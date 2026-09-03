/**
 * HTTP 路由层（node:http，零依赖）：全部 JSON 响应，错误统一 {error}。
 *
 * 鉴权：除 /healthz 外都要求 `Authorization: Bearer <gatewayToken>`，否则 401。
 * SSE：GET /v1/sessions/:sid/events —— 先补发 seq>after 的缓存事件，再持续推送；
 *      每 15s 一行 `: keepalive`；终态后发送最后一个事件并以 `event: end` 关闭。
 */
import http from "node:http";
import { timingSafeEqual } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Config } from "./config.js";
import { log } from "./log.js";
import { isRecord } from "./util.js";
import type { ProposalPort } from "./proposals.js";
import { AiConfigResolutionError, type AiConfigResolver } from "./aiConfig.js";
import {
  GatewayError,
  sessionView,
  toEnvelopeJson,
  type SessionEventSubscriber,
  type SessionRecord,
  type SessionRegistry,
} from "./sessions.js";

/** 请求体上限 1MB */
const MAX_BODY_BYTES = 1024 * 1024;
/** SSE keepalive 间隔 */
const KEEPALIVE_MS = 15_000;
/** 单订阅者累计未冲刷字节数上限（超过即断开慢客户端） */
const MAX_PENDING_BYTES = 1024 * 1024;

/** 鉴权：常量时间比较，避免令牌逐字节探测 */
function authorized(req: IncomingMessage, gatewayToken: string): boolean {
  const header = req.headers.authorization ?? "";
  const match = /^Bearer\s+(.+)$/.exec(header);
  if (!match) return false;
  const given = Buffer.from(match[1].trim(), "utf8");
  const expected = Buffer.from(gatewayToken, "utf8");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** 读取并解析 JSON 请求体（限 1MB，空体返回 undefined） */
function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;
    req.on("data", (chunk: Buffer) => {
      total += chunk.length;
      if (total > MAX_BODY_BYTES) {
        reject(new GatewayError(413, "请求体超过 1MB 上限"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8").trim();
      if (!raw) {
        resolve(undefined);
        return;
      }
      try {
        resolve(JSON.parse(raw) as unknown);
      } catch {
        reject(new GatewayError(400, "请求体不是合法 JSON"));
      }
    });
    req.on("error", (err) => reject(err));
  });
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

function sendError(res: ServerResponse, status: number, message: string): void {
  sendJson(res, status, { error: message });
}

/** 请求体必须是 JSON 对象（POST 路由共用校验） */
function jsonObject(body: unknown): Record<string, unknown> {
  if (!isRecord(body)) throw new GatewayError(400, "请求体必须是 JSON 对象");
  return body;
}

function requireString(body: Record<string, unknown>, key: string): string {
  const value = body[key];
  if (value === undefined || value === null || value === "") {
    throw new GatewayError(400, `缺少必填字段：${key}`);
  }
  if (typeof value !== "string") throw new GatewayError(400, `字段 ${key} 必须是字符串`);
  return value;
}

function optionalString(body: Record<string, unknown>, key: string): string | undefined {
  const value = body[key];
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") throw new GatewayError(400, `字段 ${key} 必须是字符串`);
  return value;
}

/** 审批主体由持有 Gateway 内部令牌的 BFF/开发代理注入，禁止从 JSON body 接受可伪造 actor。 */
function trustedActor(req: IncomingMessage): string {
  const raw = req.headers["x-techhaven-actor"];
  const actor = Array.isArray(raw) ? raw[0] : raw;
  if (typeof actor !== "string" || !/^user:[1-9]\d*$/.test(actor.trim())) {
    throw new GatewayError(401, "缺少可信审批主体 X-TechHaven-Actor（格式 user:<positive-id>）");
  }
  return actor.trim();
}

/** POST /v1/sessions 请求体校验 */
function parseCreateBody(body: unknown): { orgId: number; subjectType?: string; subjectId?: string; prompt: string } {
  const record = jsonObject(body);
  const orgId = record.orgId;
  if (!Number.isInteger(orgId) || (orgId as number) < 1) {
    throw new GatewayError(400, "字段 orgId 必须是正整数");
  }
  const prompt = requireString(record, "prompt");
  if (!prompt || !prompt.trim()) throw new GatewayError(400, "字段 prompt 必填且不能为空白");
  return {
    orgId: orgId as number,
    subjectType: optionalString(record, "subjectType"),
    subjectId: optionalString(record, "subjectId"),
    prompt: prompt.trim(),
  };
}

/** GET /v1/sessions/:sid/events —— SSE 事件桥 */
function handleEventsStream(
  req: IncomingMessage,
  url: URL,
  record: SessionRecord,
  registry: SessionRegistry,
  res: ServerResponse,
): void {
  const afterRaw = url.searchParams.get("after");
  let after = -1; // 默认全量补发（seq 从 1 起）
  if (afterRaw !== null) {
    const parsed = Number(afterRaw);
    if (!Number.isFinite(parsed)) throw new GatewayError(400, "查询参数 after 必须是数字");
    after = Math.trunc(parsed);
  } else {
    // 断线重连回放：缺省回读 Last-Event-ID（EventSource 重连自动携带最后收到的 id）；缺失 / 非数字按 -1 全量补发
    const lastId = req.headers["last-event-id"];
    const parsed = Number(Array.isArray(lastId) ? lastId[0] : lastId);
    after = Number.isFinite(parsed) ? Math.trunc(parsed) : -1;
  }

  res.writeHead(200, {
    "content-type": "text/event-stream; charset=utf-8",
    "cache-control": "no-cache, no-transform",
    connection: "keep-alive",
    // 提示反向代理不要缓冲事件流
    "x-accel-buffering": "no",
  });

  const writable = (): boolean => !res.destroyed && !res.writableEnded;
  // 最小背压：记录累计未冲刷字节数；write 返回 false 或超上限 → 断开慢客户端（事件已落 JSONL 不丢失）
  let pendingBytes = 0;
  res.on("drain", () => {
    pendingBytes = 0;
  });
  const writeFrame = (frame: string): void => {
    if (!writable()) return;
    pendingBytes += Buffer.byteLength(frame);
    const flushed = res.write(frame);
    if (!flushed || pendingBytes > MAX_PENDING_BYTES) {
      log(`SSE 订阅者背压超限（${record.sid}，pending=${pendingBytes}B），断开慢客户端`);
      res.destroy();
    }
  };

  // 1) 先补发 seq>after 的缓存事件，再订阅 —— 两步之间无 await，单线程下不会漏事件
  for (const ev of record.events) {
    if (ev.seq > after) writeFrame(`id: ${ev.seq}\ndata: ${toEnvelopeJson(record, ev)}\n\n`);
  }

  let closed = false;
  const keepalive = setInterval(() => {
    // 心跳只维持连接，不计入背压统计
    if (writable()) res.write(": keepalive\n\n");
  }, KEEPALIVE_MS);
  keepalive.unref(); // 心跳不阻止进程退出（由活跃连接自身维持进程存活）

  const finish = (): void => {
    if (closed) return;
    closed = true;
    clearInterval(keepalive);
    registry.unsubscribe(record, subscriber);
    if (writable()) {
      res.write("event: end\ndata: {}\n\n");
      res.end();
    }
  };
  const subscriber: SessionEventSubscriber = {
    onEvent: (frame) => writeFrame(frame),
    onEnd: () => finish(),
  };
  registry.subscribe(record, subscriber);

  // 2) 客户端断连清理：取消订阅 + 停心跳（正常 finish 后 close 也会触发，closed 幂等）
  res.on("close", () => {
    if (closed) return;
    closed = true;
    clearInterval(keepalive);
    registry.unsubscribe(record, subscriber);
  });
}

async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse,
  config: Config,
  registry: SessionRegistry,
  proposals: ProposalPort,
  aiConfigResolver?: AiConfigResolver,
): Promise<void> {
  const url = new URL(req.url ?? "/", "http://localhost");
  const path = url.pathname;
  const method = (req.method ?? "GET").toUpperCase();

  try {
    if (path === "/healthz" && method === "GET") {
      try {
        await registry.checkReady();
        sendJson(res, 200, { ok: true, driver: config.driver, store: config.store });
      } catch {
        sendJson(res, 503, { ok: false, driver: config.driver, store: config.store, error: "权威存储不可用" });
      }
      return;
    }

    // 鉴权：/healthz 之外一律要求 Bearer 令牌
    if (!authorized(req, config.gatewayToken)) {
      sendError(res, 401, "缺少或无效的 Bearer 令牌");
      return;
    }

    if (path === "/v1/sessions" && method === "GET") {
      sendJson(res, 200, { sessions: registry.list().map(sessionView) });
      return;
    }

    if (path === "/v1/sessions" && method === "POST") {
      const body = await readJsonBody(req);
      const input = parseCreateBody(body);
      const runtimeConfig = aiConfigResolver ? await aiConfigResolver.resolve(trustedActor(req)) : undefined;
      const record = await registry.create({ ...input, runtimeConfig });
      sendJson(res, 201, { sid: record.sid, status: record.status });
      return;
    }

    const detailMatch = /^\/v1\/sessions\/([^/]+)$/.exec(path);
    if (detailMatch && method === "GET") {
      const record = registry.get(decodeURIComponent(detailMatch[1]));
      if (!record) throw new GatewayError(404, `未知会话：${detailMatch[1]}`);
      sendJson(res, 200, sessionView(record));
      return;
    }

    const proposalListMatch = /^\/v1\/sessions\/([^/]+)\/proposals$/.exec(path);
    if (proposalListMatch && method === "GET") {
      const sid = decodeURIComponent(proposalListMatch[1]);
      const record = registry.get(sid);
      if (!record) throw new GatewayError(404, `未知会话：${sid}`);
      const snapshots = await proposals.listForSession(sid, record.orgId);
      for (const item of snapshots) await registry.syncProposalLifecycle(item.lifecycle);
      sendJson(res, 200, { proposals: snapshots.map((item) => item.proposal) });
      return;
    }

    const proposalMatch = /^\/v1\/sessions\/([^/]+)\/proposals\/([^/]+)(?:\/(decision))?$/.exec(path);
    if (proposalMatch) {
      const sid = decodeURIComponent(proposalMatch[1]);
      const proposalId = decodeURIComponent(proposalMatch[2]);
      const action = proposalMatch[3];
      const record = registry.get(sid);
      if (!record) throw new GatewayError(404, `未知会话：${sid}`);

      if (!action && method === "GET") {
        const snapshots = await proposals.listForSession(sid, record.orgId);
        const found = snapshots.find((item) => item.proposal.id === proposalId);
        if (!found) throw new GatewayError(404, "提案不存在或不属于当前会话");
        await registry.syncProposalLifecycle(found.lifecycle);
        sendJson(res, 200, found.proposal);
        return;
      }

      if (action === "decision" && method === "POST") {
        const body = jsonObject(await readJsonBody(req));
        const decision = body.decision;
        if (decision !== "approve" && decision !== "reject") {
          throw new GatewayError(400, '字段 decision 必须是 "approve" | "reject"');
        }
        const result = await proposals.decide({
          sessionId: sid,
          orgId: record.orgId,
          proposalId,
          decision,
          actor: trustedActor(req),
          note: optionalString(body, "note"),
        });
        await registry.syncProposalLifecycle(result.lifecycle);
        sendJson(res, 200, result.proposal);
        return;
      }
    }

    const subMatch = /^\/v1\/sessions\/([^/]+)\/(events|permission|cancel)$/.exec(path);
    if (subMatch) {
      const sid = decodeURIComponent(subMatch[1]);
      const action = subMatch[2];

      if (action === "events" && method === "GET") {
        const record = registry.get(sid);
        if (!record) throw new GatewayError(404, `未知会话：${sid}`);
        handleEventsStream(req, url, record, registry, res);
        return;
      }

      if (action === "permission" && method === "POST") {
        const body = await readJsonBody(req);
        const fields = jsonObject(body);
        const requestId = requireString(fields, "requestId");
        const decision = fields.decision;
        if (decision !== "approve" && decision !== "reject") {
          throw new GatewayError(400, '字段 decision 必须是 "approve" | "reject"');
        }
        const note = optionalString(fields, "note");
        await registry.answerPermission(sid, requestId, decision, note);
        sendJson(res, 200, { ok: true });
        return;
      }

      if (action === "cancel" && method === "POST") {
        await registry.cancel(sid);
        sendJson(res, 200, { ok: true });
        return;
      }

      throw new GatewayError(405, `${method} 不支持该资源`);
    }

    sendError(res, 404, "未找到路由");
  } catch (err) {
    if (err instanceof AiConfigResolutionError) {
      sendError(res, err.status, err.message);
      return;
    }
    if (err instanceof GatewayError) {
      sendError(res, err.status, err.message);
      return;
    }
    log("请求处理异常：", err);
    if (!res.headersSent) sendError(res, 500, "内部错误");
    else res.destroy();
  }
}

/** 创建网关 HTTP 服务 */
export function createGatewayServer(
  config: Config,
  registry: SessionRegistry,
  proposals: ProposalPort,
  aiConfigResolver?: AiConfigResolver,
): http.Server {
  const server = http.createServer((req, res) => {
    void handleRequest(req, res, config, registry, proposals, aiConfigResolver);
  });
  // 显式消费 clientError：默认行为是销毁 socket 并可能打出未处理异常日志
  server.on("clientError", (err, socket) => {
    if (socket.writable) socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
    else socket.destroy();
    log("客户端连接异常：", err);
  });
  // SSE 长连接：关闭请求整体超时（默认 300s 会掐断长事件流）
  server.requestTimeout = 0;
  server.headersTimeout = 30_000;
  return server;
}
