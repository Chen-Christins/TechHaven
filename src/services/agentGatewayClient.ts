/**
 * Agent Gateway 客户端（R1 接线，TH-RFC-001 §05.1/§6）。
 *
 * 安全边界：浏览器**不持有** Gateway 管理 token（ARCHITECTURE §6）。
 * 请求经 Vite 开发代理 `/gateway` 转发，Authorization 头由代理注入
 * （见 vite.config.ts `^/gateway` 规则；生产由 Web BFF 承担同一职责）。
 *
 * 事件流：SSE 数据帧为事件信封（EventEnvelope，见根 contracts/）；
 * 断线自动重连并携带 `after=<lastSeq>` 从 Last-Event-ID 续传，指数退避，
 * 重试耗尽后以 failed 回调收尾（绝不静默悬空）。
 */

import type { CreateSessionRequest, CreateSessionResponse, EventEnvelope, OkResponse, SessionDetailResponse } from "../../contracts";

/**
 * 全局 fetch 的绑定副本：部分浏览器/WebView 对「解引用后的 fetch」直接调用会抛
 * Illegal invocation（fetch 要求 this 是 Window/Global）。一律用绑定副本，杜绝环境差异。
 */
const boundFetch: typeof fetch = fetch.bind(globalThis);

const RETRY_BASE_MS = 1000;
const RETRY_MAX_MS = 8000;
const RETRY_LIMIT = 5;

export type EventStreamEnd = "completed" | "failed";

export interface EventStreamHandlers {
  onEvent(env: EventEnvelope): void;
  /** 流正常关闭（终态 + event: end）或重试耗尽（failed，此时无终态事件兜底请自行合成） */
  onEnd(reason: EventStreamEnd): void;
}

export class GatewayRequestError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "GatewayRequestError";
    this.status = status;
  }
}

export class AgentGatewayClient {
  private readonly base: string;
  private readonly fetchImpl: typeof fetch;

  /** base 为网关 API 前缀（开发经 Vite 代理；不直接暴露绝对地址给浏览器） */
  constructor(base = "/gateway", fetchImpl: typeof fetch = boundFetch) {
    this.base = base;
    this.fetchImpl = fetchImpl;
  }

  /** 规范化响应：非 2xx 抛 GatewayRequestError（错误体 {error}） */
  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await this.fetchImpl(`${this.base}${path}`, init);
    const contentType = res.headers.get("content-type") ?? "";
    const body = contentType.includes("application/json") ? await res.json().catch(() => null) : null;
    if (!res.ok) {
      const message =
        body && typeof body === "object" && "error" in body
          ? String((body as { error: unknown }).error)
          : `请求失败 (HTTP ${res.status})`;
      throw new GatewayRequestError(res.status, message);
    }
    return body as T;
  }

  async createSession(req: CreateSessionRequest): Promise<CreateSessionResponse> {
    return this.request<CreateSessionResponse>("/v1/sessions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(req),
    });
  }

  async getSession(sid: string): Promise<SessionDetailResponse> {
    return this.request<SessionDetailResponse>(`/v1/sessions/${encodeURIComponent(sid)}`);
  }

  async answerPermission(sid: string, requestId: string, decision: "approve" | "reject", note?: string): Promise<void> {
    await this.request<OkResponse>(`/v1/sessions/${encodeURIComponent(sid)}/permission`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ requestId, decision, note }),
    });
  }

  async cancel(sid: string): Promise<void> {
    await this.request<OkResponse>(`/v1/sessions/${encodeURIComponent(sid)}/cancel`, {
      method: "POST",
      body: "{}",
    });
  }

  /**
   * 订阅会话事件流（不可用 EventSource：其无法携带鉴权头；fetch 流可自主带 after）。
   * 返回关闭函数；关闭或完成后不再重连。重连在「收到部分事件后断开」时按 lastSeq 续传。
   */
  subscribeEvents(sid: string, handlers: EventStreamHandlers): () => void {
    let closed = false;
    let controller: AbortController | null = null;
    let retries = 0;
    let lastSeq = 0;

    const attempt = async (): Promise<void> => {
      if (closed) return;
      controller = new AbortController();
      const after = lastSeq > 0 ? `?after=${lastSeq}` : "";
      try {
        const res = await this.fetchImpl(`${this.base}/v1/sessions/${encodeURIComponent(sid)}/events${after}`, {
          headers: { accept: "text/event-stream" },
          signal: controller.signal,
        });
        if (!res.ok) throw new GatewayRequestError(res.status, `事件流失败 (HTTP ${res.status})`);
        if (!res.body) throw new GatewayRequestError(500, "事件流无响应体");

        retries = 0;
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        let eventName = "";
        let dataLines: string[] = [];

        const dispatchFrame = (): void => {
          const name = eventName;
          const data = dataLines.join("\n");
          eventName = "";
          dataLines = [];
          if (name === "end") {
            closed = true;
            handlers.onEnd("completed");
            void reader.cancel().catch(() => undefined);
            return;
          }
          if (!data) return;
          try {
            const env = JSON.parse(data) as EventEnvelope;
            lastSeq = env.seq;
            handlers.onEvent(env);
          } catch {
            handlers.onEvent({
              schemaVersion: 1,
              eventId: `${sid}:bad-frame`,
              sessionId: sid,
              orgId: 0,
              seq: lastSeq + 1,
              type: "error",
              occurredAt: new Date().toISOString(),
              traceId: "",
              payload: { message: "事件帧解析失败" },
            });
          }
        };

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let idx: number;
          while ((idx = buf.indexOf("\n")) >= 0) {
            const line = buf.slice(0, idx).replace(/\r$/, "");
            buf = buf.slice(idx + 1);
            if (line === "") {
              dispatchFrame();
              if (closed) return;
              continue;
            }
            if (line.startsWith(":")) continue; // keepalive 注释行
            if (line.startsWith("event:")) {
              eventName = line.slice(6).trim();
              continue;
            }
            if (line.startsWith("data:")) {
              dataLines.push(line.slice(5).trim());
              continue;
            }
            // 其余行（如 id:）忽略：seq 由信封携带
          }
        }
        // 流自然断开但未见 event: end（网关重启/网络断）：指数退避重连，续传 after=lastSeq
        if (!closed) {
          retries += 1;
          if (retries > RETRY_LIMIT) {
            closed = true;
            handlers.onEnd("failed");
            return;
          }
          await new Promise((resolve) => setTimeout(resolve, Math.min(RETRY_BASE_MS * 2 ** retries, RETRY_MAX_MS)));
          if (!closed) void attempt();
        }
      } catch (err) {
        if (closed) return;
        if (err instanceof Error && err.name === "AbortError") return;
        retries += 1;
        if (retries > RETRY_LIMIT) {
          closed = true;
          handlers.onEnd("failed");
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, Math.min(RETRY_BASE_MS * 2 ** retries, RETRY_MAX_MS)));
        if (!closed) void attempt();
      }
    };

    void attempt();
    return () => {
      closed = true;
      controller?.abort();
    };
  }
}

export default AgentGatewayClient;
