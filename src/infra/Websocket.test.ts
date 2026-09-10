import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { WebSocketClient } from "./Websocket.ts";
import { tokenManager } from "../auth/TokenManager.ts";

/**
 * token 脱敏回归测试（R0 安全项）。
 *
 * 背景：此前 `connect()` 会把含完整 token 的建连 URL 直接打进 console
 * （旁边那个 `token: "***"` 只是装饰，真正泄露的是 URL 本身）。
 * 这里锁死两件事：
 *   1. 传输方式不变——URL 里**仍要**带 token，因为后端鉴权依赖该 query 参数；
 *   2. 日志/控制台里**绝不能**出现 token 与 token_time 的原文。
 * 两者必须同时成立，任何只满足其一的改法（比如为了脱敏把 token 从 URL 里摘掉）
 * 都会让这里变红。
 */

/** 一个只记录入参、不真正建连的 WebSocket 替身 */
class MockWebSocket {
    static instances: MockWebSocket[] = [];
    static readonly CONNECTING = 0;
    static readonly OPEN = 1;
    static readonly CLOSING = 2;
    static readonly CLOSED = 3;

    readyState = MockWebSocket.CONNECTING;
    readonly url: string;
    onopen: (() => void) | null = null;
    onmessage: ((event: MessageEvent) => void) | null = null;
    onclose: ((event: CloseEvent) => void) | null = null;
    onerror: ((event: Event) => void) | null = null;

    constructor(url: string) {
        this.url = url;
        MockWebSocket.instances.push(this);
    }
    sent: string[] = [];
    send(data: string): void {
        this.sent.push(data);
    }
    close(): void {
        this.readyState = MockWebSocket.CLOSED;
    }
}

const TOKEN = "S_TOKEN_VALUE_SUPER_SECRET_9f3a";
const TOKEN_TIME = "1756000000000";
/** 收集一次 connect 期间 console 的全部输出文本 */
function captureConsole(client: WebSocketClient, uid: string | number | undefined): string[] {
    const lines: string[] = [];
    const spyLog = vi.spyOn(console, "log").mockImplementation((...args: unknown[]) => {
        lines.push(args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" "));
    });
    const spyError = vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
        lines.push(args.map((a) => (typeof a === "string" ? a : String(a))).join(" "));
    });
    try {
        client.connect(uid);
    } finally {
        spyLog.mockRestore();
        spyError.mockRestore();
    }
    return lines;
}

describe("WebSocket 建连 token 处理", () => {
    beforeEach(() => {
        MockWebSocket.instances = [];
        tokenManager.clearToken();
        (globalThis as { WebSocket?: unknown }).WebSocket = MockWebSocket;
        // jsdom 下直接写 document.cookie 即可，过期时间设到未来避免被丢弃
        document.cookie = `S_TOKEN=${TOKEN}; path=/`;
        document.cookie = `S_TOKEN_TIME=${TOKEN_TIME}; path=/`;
        tokenManager.setToken(TOKEN);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("建连 URL 仍携带 token（后端鉴权依赖该 query 参数，传输方式未变）", () => {
        const client = new WebSocketClient("/ws/v1/notification");
        captureConsole(client, 42);

        expect(MockWebSocket.instances).toHaveLength(1);
        const url = MockWebSocket.instances[0].url;
        expect(url).toContain(`token=${TOKEN}`);
        expect(url).toContain(`token_time=${TOKEN_TIME}`);
        expect(url).toContain("uid=42");
    });

    it("控制台输出绝不出现 token / token_time 原文", () => {
        const client = new WebSocketClient("/ws/v1/notification");
        const lines = captureConsole(client, 42);

        expect(lines.length).toBeGreaterThan(0);
        const joined = lines.join("\n");
        expect(joined).not.toContain(TOKEN);
        expect(joined).not.toContain(TOKEN_TIME);
        // 脱敏占位必须真的出现，防止「干脆不打印」也算通过
        expect(joined).toContain("***");
    });

    it("脱敏不误伤 uid：uid 仍完整出现在日志里", () => {
        const client = new WebSocketClient("/ws/v1/notification");
        const lines = captureConsole(client, 42);
        expect(lines.join("\n")).toContain("42");
    });

    it("内存中没有 token 时拒绝建连，即使 Cookie 中存在 token", () => {
        tokenManager.clearToken();
        const client = new WebSocketClient("/ws/v1/notification");
        const lines = captureConsole(client, 7);

        expect(MockWebSocket.instances).toHaveLength(0);
        expect(client.connect(7)).toBe(false);
        expect(lines).toHaveLength(0);
        expect(lines.join("\n")).not.toContain("***");
    });

    it("Cookie 值含 = 时不截断（base64 填充 / JWT 分段场景）", () => {
        // 含两个 "=" 的 token：split("=") 会把值切在第一处，只剩 "PADDED_"
        const padded = "PADDED_BASE64_TOKEN_==";
        tokenManager.setToken(padded);

        const client = new WebSocketClient("/ws/v1/notification");
        captureConsole(client, 9);

        const url = MockWebSocket.instances[0].url;
        // 必须带上完整值（URLSearchParams 会转义，故用解码后的参数断言）
        const token = new URL(url).searchParams.get("token");
        expect(token).toBe(padded);
    });

    it("重连不会绕过脱敏：每次 connect 都重新脱敏", () => {
        const client = new WebSocketClient("/ws/v1/notification");
        captureConsole(client, 1);
        // 手动置为 CLOSED，绕开「已连接/连接中就不重复建连」的短路
        MockWebSocket.instances[0].readyState = MockWebSocket.CLOSED;
        const second = captureConsole(client, 1);

        expect(MockWebSocket.instances).toHaveLength(2);
        expect(second.join("\n")).not.toContain(TOKEN);
        expect(second.join("\n")).toContain("***");
    });

    it("旧连接异步关闭时不会为新连接调度重连", () => {
        vi.useFakeTimers();
        const client = new WebSocketClient("/ws/v1/notification");
        captureConsole(client, 1);
        const first = MockWebSocket.instances[0];
        first.readyState = MockWebSocket.CLOSED;

        captureConsole(client, 1);
        first.onclose?.({ code: 1006, reason: "", wasClean: false } as CloseEvent);

        vi.advanceTimersByTime(31000);
        expect(MockWebSocket.instances).toHaveLength(2);
        vi.useRealTimers();
    });

    it("握手从未成功时不会自动重连刷屏", () => {
        vi.useFakeTimers();
        const client = new WebSocketClient("/ws/v1/notification");
        captureConsole(client, 1);
        const socket = MockWebSocket.instances[0];

        socket.readyState = MockWebSocket.CLOSED;
        socket.onclose?.({ code: 1006, reason: "", wasClean: false } as CloseEvent);
        vi.advanceTimersByTime(60000);

        expect(MockWebSocket.instances).toHaveLength(1);
        vi.useRealTimers();
    });

    it("单个消息处理器抛错不会重复分发或阻断其他处理器", () => {
        const client = new WebSocketClient("/ws/v1/notification");
        captureConsole(client, 1);
        const socket = MockWebSocket.instances[0];
        const first = vi.fn(() => {
            throw new Error("handler failed");
        });
        const second = vi.fn();
        const wildcard = vi.fn();
        client.onMessage("notification", first);
        client.onMessage("notification", second);
        client.onMessage("*", wildcard);
        vi.spyOn(console, "error").mockImplementation(() => undefined);

        socket.onmessage?.({ data: JSON.stringify({ type: "notification", id: 1 }) } as MessageEvent);

        expect(first).toHaveBeenCalledOnce();
        expect(second).toHaveBeenCalledOnce();
        expect(wildcard).toHaveBeenCalledOnce();
        expect(wildcard).toHaveBeenCalledWith({ type: "notification", id: 1 });
    });

    it("待发送队列有上限并在连接成功后按顺序清空", () => {
        const client = new WebSocketClient("/ws/v1/notification", { maxPendingMessages: 2 });
        captureConsole(client, 1);
        const socket = MockWebSocket.instances[0];

        expect(client.send({ id: 1 })).toBe(true);
        expect(client.send({ id: 2 })).toBe(true);
        expect(client.send({ id: 3 })).toBe(false);

        socket.readyState = MockWebSocket.OPEN;
        socket.onopen?.();
        expect(socket.sent).toEqual(['{"id":1}', '{"id":2}']);
    });

    it("不可序列化消息返回 false 且不会进入队列", () => {
        const client = new WebSocketClient("/ws/v1/notification", { maxPendingMessages: 1 });
        captureConsole(client, 1);
        vi.spyOn(console, "error").mockImplementation(() => undefined);
        const circular: Record<string, unknown> = {};
        circular.self = circular;

        expect(client.send(circular)).toBe(false);
        expect(client.send("valid")).toBe(true);
        expect(client.send("overflow")).toBe(false);
    });

    it("主动断开后拒绝缓存新消息", () => {
        const client = new WebSocketClient("/ws/v1/notification");
        captureConsole(client, 1);
        client.disconnect();

        expect(client.send("stale message")).toBe(false);
    });
});
