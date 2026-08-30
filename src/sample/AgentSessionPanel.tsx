/**
 * Agent 会话面板测试样例页（DEV 专用，TH-RFC-001 §05.4）
 *
 * 默认用内置 mock 事件流驱动 UI；`?driver=gateway` 经同源代理连接本机 Gateway：
 * 状态徽标（queued/running/awaiting_permission/succeeded/failed/cancelled）、
 * 事件流（assistant_chunk / tool_call / tool_result / permission_request / status_change / error）、
 * 以及核心的权限审批卡（批准 / 拒绝 → mock 流继续或取消）。
 *
 * 这是 DEV 验证页，不替代正式业务页与生产 BFF 集成门禁。
 */
import React, { useEffect, useRef, useState, type ReactNode } from "react";
import SimpleBar from "simplebar-react";
import { FaBolt, FaCheckCircle, FaInfoCircle, FaRedo, FaShieldAlt, FaTimesCircle, FaWrench } from "react-icons/fa";
import Button from "../components/button/Button";
import Avatar from "../components/avatar/Avatar";
import Loading from "../components/loading/Loading";
import Skeleton from "../components/skeleton/Skeleton";
import message from "../components/message/Message";
import { AgentGatewayClient } from "../services/agentGatewayClient";
import type { EventEnvelope } from "../../contracts";
import styles from "./AgentSessionPanel.module.css";

/**
 * 与 services/techhaven-gateway/src/types.ts 同构的引擎事件契约
 * （TH-RFC-001 §05.1 逐字冻结），仅用于本样例页的 mock 驱动，请勿在业务代码中复用。
 */
export type SessionStatus = "queued" | "running" | "awaiting_permission" | "succeeded" | "failed" | "cancelled";

export type EngineEvent =
  | { type: "assistant_chunk"; seq: number; ts: string; text: string }
  | { type: "tool_call"; seq: number; ts: string; tool: string; argsDigest: string; args?: unknown }
  | { type: "tool_result"; seq: number; ts: string; tool: string; ok: boolean; summary?: string }
  | { type: "permission_request"; seq: number; ts: string; requestId: string; tool: string; reason?: string }
  | { type: "status_change"; seq: number; ts: string; status: SessionStatus; detail?: string }
  | { type: "error"; seq: number; ts: string; message: string };

type PermissionDecision = "approve" | "reject";

type EngineEventListener = (event: EngineEvent) => void;

interface SessionHandle {
  sid: string;
  start(): void;
  subscribe(listener: EngineEventListener): () => void;
  answerPermission(requestId: string, decision: PermissionDecision, note?: string): void;
  /** 用户显式放弃当前会话（如点击重新运行）时才调用。 */
  cancel(): void;
  /** 仅释放当前页面观察资源；不得把页面卸载误当成用户取消。 */
  dispose(): void;
}

/** 状态 → 徽标语义色映射（见 .module.css 中 badge--* 类） */
const STATUS_TONE: Record<SessionStatus, "neutral" | "running" | "warning" | "success" | "danger"> = {
  queued: "neutral",
  running: "running",
  awaiting_permission: "warning",
  succeeded: "success",
  failed: "danger",
  cancelled: "danger",
};

const STATUS_LABEL: Record<SessionStatus, string> = {
  queued: "排队中",
  running: "运行中",
  awaiting_permission: "待审批",
  succeeded: "已成功",
  failed: "已失败",
  cancelled: "已取消",
};

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** 事件间隔 300–600ms，模拟真实流式输出的节奏 */
const randomDelay = () => 300 + Math.floor(Math.random() * 301);

const randomToken = (length: number) => Array.from({ length }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");

/**
 * mock 会话数据源：按剧本异步 emit 事件。
 * 剧本：running → chunk → tool_call(get_ticket) → tool_result → chunk
 *   → awaiting_permission → permission_request（挂起等待用户点击）
 *   → [批准] running → tool_call(update_ticket_status) → tool_result → chunk → succeeded
 *   → [拒绝] chunk → cancelled
 */
function createMockSession(onSid: (sid: string) => void): SessionHandle {
  const sid = `ses_${randomToken(12)}`;
  onSid(sid);
  const listeners = new Set<EngineEventListener>();
  const decisions = new Map<string, PermissionDecision>();
  const decisionResolvers = new Map<string, () => void>();
  let seq = 0;
  let disposed = false;

  const emit = (event: EngineEvent) => {
    if (disposed) return;
    listeners.forEach((listener) => listener(event));
  };

  const chunk = (text: string) => emit({ type: "assistant_chunk", seq: ++seq, ts: new Date().toISOString(), text });
  const toolCall = (tool: string, argsDigest: string) =>
    emit({ type: "tool_call", seq: ++seq, ts: new Date().toISOString(), tool, argsDigest });
  const toolResult = (tool: string, ok: boolean, summary?: string) =>
    emit({ type: "tool_result", seq: ++seq, ts: new Date().toISOString(), tool, ok, summary });
  const statusChange = (status: SessionStatus, detail?: string) =>
    emit({ type: "status_change", seq: ++seq, ts: new Date().toISOString(), status, detail });

  const waitForDecision = (requestId: string): Promise<PermissionDecision> =>
    new Promise((resolve) => {
      const decided = decisions.get(requestId);
      if (decided) {
        resolve(decided);
        return;
      }
      decisionResolvers.set(requestId, () => resolve(decisions.get(requestId) ?? "reject"));
    });

  const run = async () => {
    statusChange("running", "mock 引擎已接管会话");
    await sleep(randomDelay());
    if (disposed) return;
    chunk("你好，我是 TechHaven 工单助手。已收到请求，正在查询工单 TCK-1024 的详情…");
    await sleep(randomDelay());
    if (disposed) return;
    toolCall("get_ticket", '{"ticketId":"TCK-1024"}');
    await sleep(randomDelay());
    if (disposed) return;
    toolResult("get_ticket", true, "已取到工单：Safari 15+ 打开登录页白屏，当前状态=待处理");
    await sleep(randomDelay());
    if (disposed) return;
    chunk("已读取工单详情。接下来我需要把工单状态更新为「处理中」，该操作会同步通知工单提交人。");
    await sleep(randomDelay());
    if (disposed) return;
    statusChange("awaiting_permission", "引擎请求人工审批");
    const requestId = `req_${randomToken(10)}`;
    emit({
      type: "permission_request",
      seq: ++seq,
      ts: new Date().toISOString(),
      requestId,
      tool: "update_ticket_status",
      reason: "将工单 TCK-1024 的状态由「待处理」变更为「处理中」，需要人工确认后才执行。",
    });

    const decision = await waitForDecision(requestId);
    if (disposed) return;
    if (decision === "approve") {
      // 状态机（图 2）：awaiting_permission --批准--> running --> succeeded
      statusChange("running", "已批准，继续执行");
      await sleep(randomDelay());
      if (disposed) return;
      toolCall("update_ticket_status", '{"ticketId":"TCK-1024","status":"in_progress"}');
      await sleep(randomDelay());
      if (disposed) return;
      toolResult("update_ticket_status", true, "工单状态已更新为「处理中」，已通知提交人");
      await sleep(randomDelay());
      if (disposed) return;
      chunk("工单 TCK-1024 已进入「处理中」状态。如需我继续跟进或回写备注，请随时告知。");
      await sleep(randomDelay());
      if (disposed) return;
      statusChange("succeeded", "任务全部完成");
    } else {
      await sleep(randomDelay());
      if (disposed) return;
      chunk("好的，本次状态变更已取消，工单 TCK-1024 保持「待处理」不变。");
      await sleep(randomDelay());
      if (disposed) return;
      statusChange("cancelled", "用户拒绝了权限请求");
    }
  };

  return {
    sid,
    start() {
      void run();
    },
    subscribe(listener: EngineEventListener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    answerPermission(requestId: string, decision: PermissionDecision) {
      decisions.set(requestId, decision);
      const resolve = decisionResolvers.get(requestId);
      if (resolve) {
        decisionResolvers.delete(requestId);
        resolve();
      }
    },
    cancel() {
      disposed = true;
      listeners.clear();
      decisionResolvers.clear();
    },
    dispose() {
      disposed = true;
      listeners.clear();
      decisionResolvers.clear();
    },
  };
}

/** 事件信封 → 面板 UI 事件（seq/ts 还原自信封；payload 为契约可辨识联合） */
const toUiEvent = (env: EventEnvelope): EngineEvent => {
  const { seq, type, occurredAt, payload } = env;
  switch (type) {
    case "assistant_chunk":
      return { type, seq, ts: occurredAt, text: payload.text };
    case "tool_call":
      return { type, seq, ts: occurredAt, tool: payload.tool, argsDigest: payload.argsDigest, args: payload.args };
    case "tool_result":
      return { type, seq, ts: occurredAt, tool: payload.tool, ok: payload.ok, summary: payload.summary };
    case "permission_request":
      return { type, seq, ts: occurredAt, requestId: payload.requestId, tool: payload.tool, reason: payload.reason };
    case "status_change":
      return { type, seq, ts: occurredAt, status: payload.status, detail: payload.detail };
    case "error":
      return { type, seq, ts: occurredAt, message: payload.message };
  }
};

/** React StrictMode 会短暂双挂载 DEV 页面；共享创建 Promise，避免并发 POST 生成两场会话。 */
let gatewayCreateInFlight: Promise<string> | null = null;

/**
 * 真实 Gateway 会话（driver=gateway）：创建会话 → SSE 订阅事件信封印 → UI 事件；
 * 审批/取消经 HTTP API 转发。POST 鉴权头由 Vite 代理注入（浏览器不持有网关 token）。
 */
function createGatewaySession(onSid: (sid: string) => void): SessionHandle {
  const checkpointKey = "techhaven:dev-agent-session";
  const client = new AgentGatewayClient();
  const listeners = new Set<EngineEventListener>();
  let disposed = false;
  let disposeStream: (() => void) | null = null;
  let syntheticSeq = 9000; // 本地合成事件（连接失败等）独立编号，避免与流内 seq 冲突
  let sid = "";

  const readCheckpoint = (): string => {
    try {
      return window.sessionStorage.getItem(checkpointKey) ?? "";
    } catch {
      return "";
    }
  };
  const writeCheckpoint = (value: string): void => {
    try {
      if (value) window.sessionStorage.setItem(checkpointKey, value);
      else window.sessionStorage.removeItem(checkpointKey);
    } catch {
      // 禁用 storage 时退化为每次新建会话；不影响主链路
    }
  };

  const emit = (event: EngineEvent) => {
    if (!disposed) listeners.forEach((listener) => listener(event));
  };
  const emitError = (message: string) => {
    emit({ type: "error", seq: ++syntheticSeq, ts: new Date().toISOString(), message });
  };

  const handle: SessionHandle = {
    sid,
    start() {
      void (async () => {
        try {
          let targetSid = readCheckpoint();
          if (targetSid) {
            const previous = await client.getSession(targetSid).catch(() => null);
            if (!previous || ["succeeded", "failed", "cancelled"].includes(previous.status)) {
              writeCheckpoint("");
              targetSid = "";
            }
          }
          if (!targetSid) {
            if (!gatewayCreateInFlight) {
              gatewayCreateInFlight = client
                .createSession({
                  orgId: 1,
                  subjectType: "bug",
                  subjectId: "bug_1",
                  prompt: "演示：读取缺陷 bug_1 并分析，如需修复请先申请权限。",
                })
                .then((created) => created.sid)
                .finally(() => {
                  gatewayCreateInFlight = null;
                });
            }
            targetSid = await gatewayCreateInFlight;
            writeCheckpoint(targetSid);
          }
          if (disposed) {
            // React StrictMode/HMR/页面卸载都可能在异步创建完成前释放本观察端；
            // 此处只停止接线，不把观察端生命周期误判为用户取消。下一挂载可凭 checkpoint 恢复。
            return;
          }
          sid = targetSid;
          handle.sid = targetSid;
          onSid(targetSid);
          // 刷新后全量回放当前会话，重建审批卡与历史；同一页面内断线仍由 client 按 after=<lastSeq> 增量续传。
          disposeStream = client.subscribeEvents(targetSid, {
            onEvent: (env) => {
              if (env.type === "status_change" && ["succeeded", "failed", "cancelled"].includes(env.payload.status)) {
                writeCheckpoint("");
                gatewayCreateInFlight = null;
              }
              emit(toUiEvent(env));
            },
            onProtocolError: (message) => emitError(`网关事件协议错误：${message}`),
            onEnd: (reason) => {
              if (disposed) return;
              if (reason === "failed") emitError("网关事件流中断且重连失败（网关可能未启动）");
            },
          });
        } catch (err) {
          if (disposed) return;
          emitError(
            `网关连接失败：${err instanceof Error ? err.message : String(err)}（请确认 Gateway 已启动，并用 ?driver=gateway 访问）`,
          );
        }
      })();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    answerPermission(requestId, decision) {
      void client
        .answerPermission(sid || handle.sid, requestId, decision)
        .catch((err) => emitError(`审批应答失败：${err instanceof Error ? err.message : String(err)}`));
    },
    cancel() {
      writeCheckpoint("");
      gatewayCreateInFlight = null;
      if (sid) void client.cancel(sid).catch(() => undefined);
    },
    dispose() {
      disposed = true;
      disposeStream?.();
      listeners.clear();
    },
  };
  return handle;
}

const formatTime = (ts: string) => {
  const date = new Date(ts);
  return Number.isNaN(date.getTime()) ? "--:--:--" : date.toLocaleTimeString("zh-CN", { hour12: false });
};

const SampleAgentSessionPanel: React.FC = () => {
  const isGatewayDriver = new URLSearchParams(window.location.search).get("driver") === "gateway";
  // runId 变化时重开一场 mock 会话（重新演示）
  const [runId, setRunId] = useState(0);
  const [sid, setSid] = useState("");
  const [status, setStatus] = useState<SessionStatus>("queued");
  const [events, setEvents] = useState<EngineEvent[]>([]);
  const [decisions, setDecisions] = useState<Record<string, PermissionDecision>>({});
  const sessionRef = useRef<SessionHandle | null>(null);
  const scrollBodyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // ?driver=gateway 接真实 Gateway（mock 为默认）；DEV 专用样例页
    const session = isGatewayDriver ? createGatewaySession(setSid) : createMockSession(setSid);
    sessionRef.current = session;
    setSid(session.sid);
    setStatus("queued");
    setEvents([]);
    setDecisions({});
    const unsubscribe = session.subscribe((event) => {
      setEvents((prev) => [...prev, event]);
      if (event.type === "status_change") {
        setStatus(event.status);
      }
    });
    session.start();
    return () => {
      unsubscribe();
      session.dispose();
      sessionRef.current = null;
    };
  }, [isGatewayDriver, runId]);

  // 新事件到达后自动滚到底部
  useEffect(() => {
    const el = scrollBodyRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [events]);

  const handleRestart = () => {
    sessionRef.current?.cancel();
    setRunId((n) => n + 1);
  };

  const handleDecision = (requestId: string, decision: PermissionDecision) => {
    sessionRef.current?.answerPermission(requestId, decision);
    setDecisions((prev) => ({ ...prev, [requestId]: decision }));
    if (decision === "approve") {
      message.success("已批准工具调用，会话继续执行");
    } else {
      message.warn("已拒绝工具调用，会话即将取消");
    }
  };

  const renderEvent = (event: EngineEvent): ReactNode => {
    switch (event.type) {
      case "assistant_chunk":
        return (
          <div className={styles.chunkRow} data-event-type="assistant_chunk">
            <Avatar name="TechHaven Agent" size={32} />
            <div className={styles.chunkBody}>
              <div className={styles.chunkMeta}>
                <span>TechHaven Agent</span>
                <span className={styles.chunkTime}>{formatTime(event.ts)}</span>
              </div>
              <div className={styles.chunkBubble}>{event.text}</div>
            </div>
          </div>
        );
      case "tool_call":
        return (
          <div className={styles.toolCard}>
            <div className={styles.toolHead}>
              <FaWrench aria-hidden="true" />
              <span>工具调用</span>
              <span className={styles.toolName}>{event.tool}</span>
              <span className={styles.toolTime}>{formatTime(event.ts)}</span>
            </div>
            <div className={styles.toolDigest}>{event.argsDigest}</div>
          </div>
        );
      case "tool_result":
        return (
          <div className={`${styles.toolCard} ${event.ok ? styles.toolCardOk : styles.toolCardFail}`}>
            <div className={styles.toolHead}>
              {event.ok ? (
                <FaCheckCircle className={styles.toolIconOk} aria-hidden="true" />
              ) : (
                <FaTimesCircle className={styles.toolIconFail} aria-hidden="true" />
              )}
              <span>{event.ok ? "工具执行成功" : "工具执行失败"}</span>
              <span className={styles.toolName}>{event.tool}</span>
              <span className={styles.toolTime}>{formatTime(event.ts)}</span>
            </div>
            {event.summary && <div className={styles.toolSummary}>{event.summary}</div>}
          </div>
        );
      case "permission_request": {
        const decision = decisions[event.requestId];
        return (
          <div className={styles.permissionCard}>
            <div className={styles.permEyebrow}>需要你的确认</div>
            <div className={styles.permTitle}>
              <FaShieldAlt aria-hidden="true" />
              <span>批准一次受控写操作</span>
              <span className={styles.toolName}>{event.tool}</span>
              <span className={styles.toolTime}>{formatTime(event.ts)}</span>
            </div>
            {event.reason && <p className={styles.permReason}>{event.reason}</p>}
            <p className={styles.permHint}>批准仅适用于本次提案；拒绝后不会改变当前工单状态。</p>
            {decision ? (
              <div className={`${styles.permDecision} ${decision === "approve" ? styles.permDecisionOk : styles.permDecisionNo}`}>
                {decision === "approve" ? <FaCheckCircle aria-hidden="true" /> : <FaTimesCircle aria-hidden="true" />}
                <span>
                  {decision === "approve"
                    ? isGatewayDriver
                      ? "已批准 · Gateway 会话继续"
                      : "已批准 · 本地会话继续"
                    : "已拒绝 · 会话已取消"}
                </span>
              </div>
            ) : (
              <div className={styles.permActions}>
                <Button
                  className={styles.actionButton}
                  color="success"
                  size="small"
                  onClick={() => handleDecision(event.requestId, "approve")}
                >
                  批准并继续
                </Button>
                <Button
                  className={styles.actionButton}
                  color="error"
                  variant="light"
                  size="small"
                  onClick={() => handleDecision(event.requestId, "reject")}
                >
                  拒绝
                </Button>
              </div>
            )}
          </div>
        );
      }
      case "status_change":
        return (
          <div className={styles.statusRow}>
            <span className={styles.statusLine} />
            <span className={styles.statusName}>状态迁移 → {STATUS_LABEL[event.status]}</span>
            {event.detail && <span className={styles.statusDetail}>{event.detail}</span>}
            <span className={styles.toolTime}>{formatTime(event.ts)}</span>
            <span className={styles.statusLine} />
          </div>
        );
      case "error":
        return (
          <div className={styles.errorRow}>
            <FaTimesCircle aria-hidden="true" />
            <span>{event.message}</span>
            <span className={styles.toolTime}>{formatTime(event.ts)}</span>
          </div>
        );
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.eyebrow}>
          <span className={styles.eyebrowDot} aria-hidden="true" />
          Agent Control Plane · R1
        </div>
        <h1 className={styles.title}>每一次执行，都清晰可控。</h1>
        <p className={styles.desc}>
          观察 Agent 的思考与工具调用，在写入发生前完成审批，并保留完整的会话轨迹。 当前页面用于验证 Gateway 事件信封与权限交互。
        </p>
      </header>

      <section className={styles.panel} aria-label="Agent 会话运行面板">
        <header className={styles.header}>
          <div className={styles.sessionIdentity}>
            <div className={styles.agentMark} aria-hidden="true">
              <FaBolt />
            </div>
            <div className={styles.sessionCopy}>
              <div className={styles.sessionTitleRow}>
                <h2 className={styles.sessionTitle}>工单协作会话</h2>
                <span className={`${styles.badge} ${styles[`badge--${STATUS_TONE[status]}`]}`} role="status">
                  <span className={`${styles.badgeDot} ${status === "running" ? styles.badgeDotPulse : ""}`} />
                  {STATUS_LABEL[status]}
                </span>
              </div>
              <span className={styles.sid} title={sid}>
                {sid || "正在创建会话…"}
              </span>
            </div>
          </div>
          <Button className={styles.restartButton} color="secondary" variant="light" size="small" onClick={handleRestart}>
            <FaRedo aria-hidden="true" />
            重新运行
          </Button>
        </header>

        <div className={styles.contextBar} aria-label="会话概况">
          <div className={styles.contextItem}>
            <span className={styles.contextLabel}>运行驱动</span>
            <strong>{isGatewayDriver ? "Gateway" : "Local Mock"}</strong>
          </div>
          <div className={styles.contextDivider} aria-hidden="true" />
          <div className={styles.contextItem}>
            <span className={styles.contextLabel}>事件数量</span>
            <strong>{events.length}</strong>
          </div>
          <div className={styles.contextDivider} aria-hidden="true" />
          <div className={styles.contextItem}>
            <span className={styles.contextLabel}>最后更新</span>
            <strong>{events.length > 0 ? formatTime(events[events.length - 1].ts) : "等待中"}</strong>
          </div>
        </div>

        <div className={styles.stream}>
          <SimpleBar scrollableNodeProps={{ ref: scrollBodyRef }} style={{ maxHeight: 440 }} autoHide={false}>
            <div className={styles.timeline} aria-live="polite" aria-label="会话事件流">
              {events.length === 0 && (
                <div className={styles.streamSkeleton}>
                  <Skeleton variant="text" lines={3} height={14} />
                </div>
              )}
              {events.map((event) => (
                <React.Fragment key={`${event.seq}`}>{renderEvent(event)}</React.Fragment>
              ))}
              {status === "running" && (
                <div className={styles.streamLoadingRow}>
                  <Loading size="small" text="" />
                  <span>{isGatewayDriver ? "Gateway 正在返回事件…" : "本地引擎正在输出…"}</span>
                </div>
              )}
            </div>
          </SimpleBar>
        </div>

        <footer className={styles.footer}>
          <div className={styles.footerNote}>
            <FaInfoCircle aria-hidden="true" />
            <span>
              {isGatewayDriver
                ? "Gateway 验证模式：经同源 Vite 代理连接本机控制面，浏览器不持有管理 token。"
                : "演示模式：使用内置事件流，不会对真实工单产生写入。追加 ?driver=gateway 可切换本机 Gateway。"}
            </span>
          </div>
          <span className={styles.footerMono}>SSE · versioned envelope · staged approval</span>
        </footer>
      </section>
    </div>
  );
};

export default SampleAgentSessionPanel;
