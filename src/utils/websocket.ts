type MessageHandler = (data: any) => void;
type EventHandler = (event?: Event) => void;

/** 从 Cookie 中读取指定 key 的值 */
function getCookie(key: string): string | null {
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === key) {
      return decodeURIComponent(value);
    }
  }
  return null;
}

/**
 * WebSocket 客户端封装
 * 支持自动重连、消息分发、Cookie 鉴权
 */
export class WebSocketClient {
  private ws: WebSocket | null = null;
  private basePath: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 50;
  private reconnectDelay = 1000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
  private openHandlers: Set<EventHandler> = new Set();
  private closeHandlers: Set<EventHandler> = new Set();
  private errorHandlers: Set<EventHandler> = new Set();
  private intentionalClose = false;
  private pendingSend: string[] = [];
  private uid: string | number | undefined;

  /**
   * @param path WebSocket 路径，如 "/notification"
   */
  constructor(path: string) {
    const baseUrl = import.meta.env.VITE_WS_URL || "ws://localhost:8080";
    const cleanBase = baseUrl.replace(/\/+$/, "");
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    this.basePath = `${cleanBase}${cleanPath}`;
  }

  /** 获取连接状态 */
  get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  /** 是否已连接 */
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /** 建立连接（uid 从 AuthContext 传入，token / token_time 从 Cookie 读取） */
  connect(uid?: string | number) {
    if (uid !== undefined) {
      this.uid = uid;
    }
    if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) {
      return;
    }
    this.intentionalClose = false;

    const token = getCookie("S_TOKEN");
    const tokenTime = getCookie("S_TOKEN_TIME");

    const params = new URLSearchParams();
    if (this.uid !== undefined && this.uid !== null && this.uid !== "") params.set("uid", String(this.uid));
    if (token) params.set("token", token);
    if (tokenTime) params.set("token_time", tokenTime);

    const connectUrl = `${this.basePath}?${params.toString()}`;
    console.log("[WS] 正在连接:", connectUrl, { uid: this.uid, token: token ? "***" : null, tokenTime });

    this.ws = new WebSocket(connectUrl);

    this.ws.onopen = () => {
      console.log("[WS] 连接已建立");
      while (this.pendingSend.length > 0) {
        const msg = this.pendingSend.shift();
        this.ws?.send(msg!);
      }
      this.openHandlers.forEach((fn) => fn());
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        const type = data.type || data.event || "message";
        const handlers = this.messageHandlers.get(type);
        if (handlers) {
          handlers.forEach((fn) => fn(data));
        }
        const allHandlers = this.messageHandlers.get("*");
        if (allHandlers) {
          allHandlers.forEach((fn) => fn(data));
        }
      } catch {
        const allHandlers = this.messageHandlers.get("*");
        if (allHandlers) {
          allHandlers.forEach((fn) => fn(event.data));
        }
      }
    };

    this.ws.onclose = (event: CloseEvent) => {
      console.log("[WS] 连接关闭, code:", event.code, "reason:", event.reason || "(无)");
      this.closeHandlers.forEach((fn) => fn(event));
      if (!this.intentionalClose) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (event: Event) => {
      console.error("[WS] 连接错误:", event);
      this.errorHandlers.forEach((fn) => fn(event));
    };
  }

  /** 断开连接（不重连） */
  disconnect() {
    this.intentionalClose = true;
    this.clearReconnectTimer();
    this.ws?.close();
    this.ws = null;
    this.pendingSend = [];
    this.reconnectAttempts = 0;
  }

  /** 发送消息 */
  send(data: string | object) {
    const payload = typeof data === "string" ? data : JSON.stringify(data);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(payload);
    } else {
      this.pendingSend.push(payload);
    }
  }

  // ---------- 事件订阅（返回取消订阅函数） ----------

  /** 订阅指定类型的消息 */
  onMessage(type: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    this.messageHandlers.get(type)!.add(handler);
    return () => {
      this.messageHandlers.get(type)?.delete(handler);
    };
  }

  /** 连接成功回调 */
  onOpen(handler: EventHandler): () => void {
    this.openHandlers.add(handler);
    return () => {
      this.openHandlers.delete(handler);
    };
  }

  /** 连接关闭回调 */
  onClose(handler: EventHandler): () => void {
    this.closeHandlers.add(handler);
    return () => {
      this.closeHandlers.delete(handler);
    };
  }

  /** 连接错误回调 */
  onError(handler: EventHandler): () => void {
    this.errorHandlers.add(handler);
    return () => {
      this.errorHandlers.delete(handler);
    };
  }

  /** 调度自动重连（指数退避，最大 30s） */
  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

/** 通知 WebSocket 单例（path: /ws/v1/notification） */
export const notificationWS = new WebSocketClient("/ws/v1/notification");

export default WebSocketClient;
