import { getErrorMsg } from "../utils/ErrorCodes.ts";
import { tokenManager } from "../auth/TokenManager.ts";
import { getCookie } from "../auth/CookieHelper.ts";

type MessageHandler = (data: unknown) => void;
type EventHandler = (event?: Event) => void;

export interface WebSocketClientOptions {
    maxReconnectAttempts?: number;
    reconnectDelay?: number;
    maxReconnectDelay?: number;
    maxPendingMessages?: number;
}

/** WebSocket 服务端错误帧（与 HTTP API 同构的 errno / errstr 格式） */
export interface WsServerError {
    errno: number;
    errstr: string;
    message: string;
}

type ServerErrorHandler = (err: WsServerError) => void;

/**
 * WebSocket 客户端封装
 * 支持自动重连、消息分发、Cookie 鉴权
 */
export class WebSocketClient {
    private ws: WebSocket | null = null;
    private basePath: string;
    private reconnectAttempts = 0;
    private readonly maxReconnectAttempts: number;
    private readonly reconnectDelay: number;
    private readonly maxReconnectDelay: number;
    private readonly maxPendingMessages: number;
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
    private openHandlers: Set<EventHandler> = new Set();
    private closeHandlers: Set<EventHandler> = new Set();
    private errorHandlers: Set<EventHandler> = new Set();
    private serverErrorHandlers: Set<ServerErrorHandler> = new Set();
    private intentionalClose = false;
    private pendingSend: string[] = [];
    private uid: string | number | undefined;
    /** 每次建连递增；旧连接的异步事件不能影响新连接。 */
    private connectionGeneration = 0;
    private hasOpened = false;

    /**
     * @param path WebSocket 路径，如 "/notification"
     */
    constructor(path: string, options: WebSocketClientOptions = {}) {
        const explicit = import.meta.env.VITE_WS_URL;
        const wsProto = window.location.protocol === "https:" ? "wss" : "ws";
        const isLoopback = !explicit || /^wss?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\/?/i.test(explicit);
        const baseUrl = isLoopback ? `${wsProto}://${window.location.host}` : explicit;
        const cleanBase = baseUrl.replace(/\/+$/, "");
        const cleanPath = path.startsWith("/") ? path : `/${path}`;
        this.basePath = `${cleanBase}${cleanPath}`;
        this.maxReconnectAttempts = Math.max(0, options.maxReconnectAttempts ?? 5);
        this.reconnectDelay = Math.max(0, options.reconnectDelay ?? 1000);
        this.maxReconnectDelay = Math.max(this.reconnectDelay, options.maxReconnectDelay ?? 30000);
        this.maxPendingMessages = Math.max(0, options.maxPendingMessages ?? 100);

        window.addEventListener(
            "beforeunload",
            () => {
                this.intentionalClose = true;
            },
            { once: true },
        );
    }

    get readyState(): number {
        return this.ws?.readyState ?? WebSocket.CLOSED;
    }

    get isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }

    get hasEstablishedConnection(): boolean {
        return this.hasOpened;
    }

    connect(uid?: string | number): boolean {
        if (uid !== undefined) {
            this.uid = uid;
        }
        if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) {
            return true;
        }

        const token = tokenManager.getToken();
        if (!token) {
            return false;
        }
        this.intentionalClose = false;
        this.clearReconnectTimer();
        const generation = ++this.connectionGeneration;

        const params = new URLSearchParams();
        const tokenTime = getCookie("S_TOKEN_TIME");
        if (this.uid !== undefined && this.uid !== null && this.uid !== "") {
            params.set("uid", String(this.uid));
        }
        params.set("token", token);
        if (tokenTime) {
            params.set("token_time", tokenTime);
        }

        const connectUrl = `${this.basePath}?${params.toString()}`;

        const logParams = new URLSearchParams(params);
        if (logParams.has("token")) {
            logParams.set("token", "***");
        }
        if (logParams.has("token_time")) {
            logParams.set("token_time", "***");
        }
        console.log("[WS] 正在连接:", `${this.basePath}?${logParams.toString()}`, { uid: this.uid });

        const socket = new WebSocket(connectUrl);
        this.ws = socket;
        let hasOpened = false;

        const isCurrentConnection = () => this.ws === socket && this.connectionGeneration === generation;

        socket.onopen = () => {
            if (!isCurrentConnection()) {
                return;
            }
            console.log("[WS] 连接已建立");
            hasOpened = true;
            this.hasOpened = true;
            this.reconnectAttempts = 0;
            while (this.pendingSend.length > 0) {
                const message = this.pendingSend[0];
                try {
                    socket.send(message);
                    this.pendingSend.shift();
                } catch (error) {
                    console.error("[WS] 待发送消息发送失败:", error);
                    break;
                }
            }
            this.dispatchHandlers(this.openHandlers, undefined, "open");
        };

        socket.onmessage = (event: MessageEvent) => {
            if (!isCurrentConnection()) {
                return;
            }
            let data: unknown;
            try {
                data = JSON.parse(event.data);
            } catch {
                this.dispatchMessage("*", event.data);
                return;
            }

            if (this.isMessageRecord(data)) {
                if (typeof data.errno === "number" && data.errno !== 0) {
                    const errstr = typeof data.errstr === "string" ? data.errstr : typeof data.msg === "string" ? data.msg : "";
                    const parsed: WsServerError = {
                        errno: data.errno,
                        errstr,
                        message: getErrorMsg(data.errno, errstr),
                    };
                    this.dispatchHandlers(this.serverErrorHandlers, parsed, "server error");
                }
                const type = typeof data.type === "string" ? data.type : typeof data.event === "string" ? data.event : "message";
                this.dispatchMessage(type, data);
            } else {
                this.dispatchMessage("message", data);
            }
            if (this.isMessageRecord(data) && (data.type === "*" || data.event === "*")) {
                return;
            }
            this.dispatchMessage("*", data);
        };

        socket.onclose = (event: CloseEvent) => {
            if (!isCurrentConnection()) {
                return;
            }
            console.log("[WS] 连接关闭, code:", event.code, "reason:", event.reason || "(无)");
            this.dispatchHandlers(this.closeHandlers, event, "close");
            if (hasOpened && !this.intentionalClose) {
                this.scheduleReconnect();
            }
        };

        socket.onerror = (event: Event) => {
            if (!isCurrentConnection()) {
                return;
            }
            console.error("[WS] 连接错误:", event);
            this.dispatchHandlers(this.errorHandlers, event, "error");
        };
        return true;
    }

    disconnect() {
        this.intentionalClose = true;
        this.connectionGeneration++;
        this.clearReconnectTimer();
        const socket = this.ws;
        this.ws = null;
        if (socket) {
            socket.onmessage = null;
            socket.onclose = null;
            socket.onerror = null;
            socket.onopen = null;
            if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CLOSING) {
                socket.close();
            }
        }
        this.pendingSend = [];
        this.reconnectAttempts = 0;
        this.hasOpened = false;
    }

    send(data: string | object): boolean {
        let payload: string;
        try {
            payload = typeof data === "string" ? data : JSON.stringify(data);
        } catch (error) {
            console.error("[WS] 消息序列化失败:", error);
            return false;
        }
        if (this.ws?.readyState === WebSocket.OPEN) {
            try {
                this.ws.send(payload);
                return true;
            } catch (error) {
                console.error("[WS] 消息发送失败:", error);
                return false;
            }
        }
        if (this.intentionalClose) {
            return false;
        }
        if (this.pendingSend.length >= this.maxPendingMessages) {
            return false;
        }
        this.pendingSend.push(payload);
        return true;
    }

    onMessage(type: string, handler: MessageHandler): () => void {
        if (!this.messageHandlers.has(type)) {
            this.messageHandlers.set(type, new Set());
        }
        this.messageHandlers.get(type)!.add(handler);
        return () => {
            this.messageHandlers.get(type)?.delete(handler);
        };
    }

    onOpen(handler: EventHandler): () => void {
        this.openHandlers.add(handler);
        return () => {
            this.openHandlers.delete(handler);
        };
    }

    onClose(handler: EventHandler): () => void {
        this.closeHandlers.add(handler);
        return () => {
            this.closeHandlers.delete(handler);
        };
    }

    onError(handler: EventHandler): () => void {
        this.errorHandlers.add(handler);
        return () => {
            this.errorHandlers.delete(handler);
        };
    }

    onServerError(handler: ServerErrorHandler): () => void {
        this.serverErrorHandlers.add(handler);
        return () => {
            this.serverErrorHandlers.delete(handler);
        };
    }

    private scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            return;
        }
        const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts), this.maxReconnectDelay);
        this.reconnectAttempts++;
        const generation = this.connectionGeneration;
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            if (this.connectionGeneration !== generation || this.intentionalClose) {
                return;
            }
            this.connect();
        }, delay);
    }

    private clearReconnectTimer() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }

    private isMessageRecord(data: unknown): data is Record<string, unknown> {
        return typeof data === "object" && data !== null;
    }

    private dispatchMessage(type: string, data: unknown): void {
        const handlers = this.messageHandlers.get(type);
        if (handlers) {
            this.dispatchHandlers(handlers, data, `message:${type}`);
        }
    }

    private dispatchHandlers<T>(handlers: Set<(data: T) => void>, data: T, eventName: string): void {
        for (const handler of [...handlers]) {
            try {
                handler(data);
            } catch (error) {
                console.error(`[WS] ${eventName} 处理器执行失败:`, error);
            }
        }
    }
}

export default WebSocketClient;
