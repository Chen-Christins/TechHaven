/**
 * Token 管理器 — 纯内存存储，避免 localStorage 安全风险
 */

export type SessionInvalidReason = "expired" | "kicked";

class TokenManager {
    private token: string | null = null;
    private listeners: ((token: string | null) => void)[] = [];
    private sessionInvalidatedListeners: ((reason: SessionInvalidReason) => void)[] = [];

    setToken(token: string | null) {
        this.token = token;
        this.notifyListeners();
    }

    getToken(): string | null {
        return this.token;
    }

    clearToken() {
        this.token = null;
        this.notifyListeners();
    }

    addListener(listener: (token: string | null) => void) {
        this.listeners.push(listener);
    }

    removeListener(listener: (token: string | null) => void) {
        const index = this.listeners.indexOf(listener);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }

    private notifyListeners() {
        this.listeners.forEach((listener) => listener(this.token));
    }

    emitSessionInvalidated(reason: SessionInvalidReason) {
        this.sessionInvalidatedListeners.forEach((listener) => listener(reason));
    }

    addSessionInvalidatedListener(listener: (reason: SessionInvalidReason) => void) {
        this.sessionInvalidatedListeners.push(listener);
    }

    removeSessionInvalidatedListener(listener: (reason: SessionInvalidReason) => void) {
        const index = this.sessionInvalidatedListeners.indexOf(listener);
        if (index > -1) {
            this.sessionInvalidatedListeners.splice(index, 1);
        }
    }
}

export const tokenManager = new TokenManager();

/**
 * 根据服务端 errstr/msg 判定会话失效原因
 * 命中"被顶/被踢/已在其他设备"关键字 → kicked，否则视为 token 过期
 */
export const detectInvalidReason = (text: string): SessionInvalidReason =>
    /kick|kicked|other device|异地|被顶|踢下线|已在其他设备|已被登录/i.test(text) ? "kicked" : "expired";
