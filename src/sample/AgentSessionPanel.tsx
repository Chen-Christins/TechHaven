/**
 * Agent 会话面板测试样例页（DEV 专用，TH-RFC-001 §05.4）
 *
 * 默认用内置 mock 事件流驱动 UI；`?driver=gateway` 经同源代理连接本机 Gateway：
 * 状态徽标（queued/running/awaiting_permission/succeeded/failed/cancelled）、
 * 事件流（assistant/tool/runner permission/product proposal/status/error）、runner 权限卡，
 * 以及独立的产品写提案卡（批准后仍由 MCP worker 重校验并幂等应用）。
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
import type {
  EngineEvent as SharedEngineEvent,
  EventEnvelope,
  ProposalStatus,
  ProposalView,
  SessionStatus as SharedSessionStatus,
} from "../../contracts";
import styles from "./AgentSessionPanel.module.css";

/**
 * 与 services/techhaven-gateway/src/types.ts 同构的引擎事件契约
 * （TH-RFC-001 §05.1 逐字冻结），仅用于本样例页的 mock 驱动，请勿在业务代码中复用。
 */
export type SessionStatus = SharedSessionStatus;
export type EngineEvent = SharedEngineEvent;

type PermissionDecision = "approve" | "reject";

type EngineEventListener = (event: EngineEvent) => void;

interface SessionHandle {
  sid: string;
  start(): void;
  subscribe(listener: EngineEventListener): () => void;
  answerPermission(requestId: string, decision: PermissionDecision, note?: string): void;
  decideProposal(proposalId: string, decision: PermissionDecision, note?: string): Promise<void>;
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

const PROPOSAL_LABEL: Record<ProposalStatus, string> = {
  pending: "待产品审批",
  approved: "已批准，等待应用",
  rejected: "已拒绝",
  applied: "已应用",
  expired: "已过期",
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
  const proposalDecisions = new Map<string, PermissionDecision>();
  const proposalResolvers = new Map<string, () => void>();
  let seq = 0;
  let disposed = false;
  let proposal: ProposalView | null = null;

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
  const proposalLifecycle = (
    event: "created" | "approved" | "rejected" | "applied" | "expired",
    next: ProposalView,
    actor: string,
    note?: string,
  ) =>
    emit({
      type: "proposal_lifecycle",
      seq: ++seq,
      ts: next.updatedAt,
      event,
      actor,
      proposal: next,
      note,
    });

  const waitForDecision = (requestId: string): Promise<PermissionDecision> =>
    new Promise((resolve) => {
      const decided = decisions.get(requestId);
      if (decided) {
        resolve(decided);
        return;
      }
      decisionResolvers.set(requestId, () => resolve(decisions.get(requestId) ?? "reject"));
    });

  const waitForProposalDecision = (proposalId: string): Promise<PermissionDecision> =>
    new Promise((resolve) => {
      const decided = proposalDecisions.get(proposalId);
      if (decided) {
        resolve(decided);
        return;
      }
      proposalResolvers.set(proposalId, () => resolve(proposalDecisions.get(proposalId) ?? "reject"));
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
    statusChange("awaiting_permission", "runner 请求执行工具权限");
    const requestId = `req_${randomToken(10)}`;
    emit({
      type: "permission_request",
      seq: ++seq,
      ts: new Date().toISOString(),
      requestId,
      tool: "update_ticket_status",
      reason: "runner 请求调用写工具。这里仅决定引擎是否可以发起工具调用，不等于批准产品数据写入。",
    });

    const decision = await waitForDecision(requestId);
    if (disposed) return;
    if (decision === "approve") {
      // 状态机（图 2）：awaiting_permission --批准--> running --> succeeded
      statusChange("running", "runner 权限已批准，继续发起工具调用");
      await sleep(randomDelay());
      if (disposed) return;
      toolCall("update_ticket_status", '{"ticketId":"TCK-1024","status":"in_progress"}');
      await sleep(randomDelay());
      if (disposed) return;
      toolResult("update_ticket_status", true, "已创建产品写提案；工单尚未发生变化");
      await sleep(randomDelay());
      if (disposed) return;
      const createdAt = new Date().toISOString();
      proposal = {
        id: `p_${randomToken(12)}`,
        sessionId: sid,
        orgId: 1,
        tool: "update_ticket_status",
        subjectType: "bug",
        subjectHashId: "TCK-1024",
        fromStatus: "待处理",
        toStatus: "处理中",
        reason: "已确认问题可复现，进入修复处理阶段",
        status: "pending",
        expiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
        updatedAt: createdAt,
      };
      proposalLifecycle("created", proposal, "agent");
      const proposalDecision = await waitForProposalDecision(proposal.id);
      if (disposed) return;
      if (proposalDecision === "approve") {
        await sleep(randomDelay());
        if (disposed || !proposal) return;
        proposal = {
          ...proposal,
          status: "applied",
          updatedAt: new Date().toISOString(),
          note: "MCP worker 已重新校验状态机并幂等应用",
        };
        proposalLifecycle("applied", proposal, "system", proposal.note);
        await sleep(randomDelay());
        if (disposed) return;
        chunk("产品写提案已应用，工单 TCK-1024 现在处于「处理中」。");
      } else {
        await sleep(randomDelay());
        if (disposed) return;
        chunk("产品写提案已拒绝；runner 会话可以正常收尾，工单仍保持「待处理」。");
      }
      await sleep(randomDelay());
      if (disposed) return;
      statusChange("succeeded", proposalDecision === "approve" ? "提案已应用" : "提案被拒绝，未写入产品域");
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
    async decideProposal(proposalId: string, decision: PermissionDecision, note?: string) {
      if (!proposal || proposal.id !== proposalId) throw new Error(`未知产品提案：${proposalId}`);
      if (proposal.status !== "pending") return;
      proposalDecisions.set(proposalId, decision);
      proposal = {
        ...proposal,
        status: decision === "approve" ? "approved" : "rejected",
        updatedAt: new Date().toISOString(),
        ...(note ? { note } : {}),
      };
      proposalLifecycle(decision === "approve" ? "approved" : "rejected", proposal, "user:1", note);
      const resolve = proposalResolvers.get(proposalId);
      if (resolve) {
        proposalResolvers.delete(proposalId);
        resolve();
      }
    },
    cancel() {
      disposed = true;
      listeners.clear();
      decisionResolvers.clear();
      proposalResolvers.clear();
    },
    dispose() {
      disposed = true;
      listeners.clear();
      decisionResolvers.clear();
      proposalResolvers.clear();
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
    case "proposal_lifecycle":
      return {
        type,
        seq,
        ts: occurredAt,
        event: payload.event,
        actor: payload.actor,
        proposal: payload.proposal,
        note: payload.note,
      };
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
  let proposalPoll: number | null = null;
  let proposalPollFailed = false;
  let sessionTerminal = false;
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
                sessionTerminal = true;
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
          const syncProposals = async (): Promise<void> => {
            try {
              const result = await client.listProposals(targetSid);
              proposalPollFailed = false;
              if (sessionTerminal && result.proposals.every((item) => !["pending", "approved"].includes(item.status))) {
                if (proposalPoll !== null) window.clearInterval(proposalPoll);
                proposalPoll = null;
              }
            } catch (err) {
              if (!proposalPollFailed && !disposed) {
                proposalPollFailed = true;
                emitError(`提案同步失败：${err instanceof Error ? err.message : String(err)}`);
              }
            }
          };
          void syncProposals();
          proposalPoll = window.setInterval(() => void syncProposals(), 1000);
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
        .catch((err) => emitError(`Runner 权限应答失败：${err instanceof Error ? err.message : String(err)}`));
    },
    async decideProposal(proposalId, decision, note) {
      try {
        await client.decideProposal(sid || handle.sid, proposalId, decision, note);
      } catch (err) {
        const message = `产品提案审批失败：${err instanceof Error ? err.message : String(err)}`;
        emitError(message);
        throw err;
      }
    },
    cancel() {
      writeCheckpoint("");
      gatewayCreateInFlight = null;
      if (sid) void client.cancel(sid).catch(() => undefined);
    },
    dispose() {
      disposed = true;
      if (proposalPoll !== null) window.clearInterval(proposalPoll);
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
  const [proposalBusy, setProposalBusy] = useState<Record<string, boolean>>({});
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
    setProposalBusy({});
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

  const handleProposalDecision = async (proposalId: string, decision: PermissionDecision): Promise<void> => {
    setProposalBusy((prev) => ({ ...prev, [proposalId]: true }));
    try {
      await sessionRef.current?.decideProposal(proposalId, decision);
      if (decision === "approve") message.success("产品写提案已批准，等待 MCP worker 重新校验并应用");
      else message.warn("产品写提案已拒绝，工单状态不会改变");
    } catch {
      message.error("产品写提案审批失败，请查看事件流中的错误信息");
    } finally {
      setProposalBusy((prev) => ({ ...prev, [proposalId]: false }));
    }
  };

  // 生命周期事件保留在 events 计数中；同一提案只渲染最新快照，避免旧 pending 卡仍可点击。
  const visibleEvents = events.filter((event, index) => {
    if (event.type !== "proposal_lifecycle") return true;
    return !events.slice(index + 1).some((next) => next.type === "proposal_lifecycle" && next.proposal.id === event.proposal.id);
  });

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
            <div className={styles.permEyebrow}>Runner 执行权限</div>
            <div className={styles.permTitle}>
              <FaShieldAlt aria-hidden="true" />
              <span>是否允许引擎发起工具调用</span>
              <span className={styles.toolName}>{event.tool}</span>
              <span className={styles.toolTime}>{formatTime(event.ts)}</span>
            </div>
            {event.reason && <p className={styles.permReason}>{event.reason}</p>}
            <p className={styles.permHint}>这里只控制 runner 执行权限；产品数据写入仍需经过下方独立的产品提案审批。</p>
            {decision ? (
              <div className={`${styles.permDecision} ${decision === "approve" ? styles.permDecisionOk : styles.permDecisionNo}`}>
                {decision === "approve" ? <FaCheckCircle aria-hidden="true" /> : <FaTimesCircle aria-hidden="true" />}
                <span>
                  {decision === "approve"
                    ? isGatewayDriver
                      ? "已批准 · Gateway 会话继续"
                      : "已批准 · 本地会话继续"
                    : "已拒绝 Runner 权限 · 会话已取消"}
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
                  允许 Runner 调用
                </Button>
                <Button
                  className={styles.actionButton}
                  color="error"
                  variant="light"
                  size="small"
                  onClick={() => handleDecision(event.requestId, "reject")}
                >
                  拒绝 Runner 调用
                </Button>
              </div>
            )}
          </div>
        );
      }
      case "proposal_lifecycle": {
        const proposal = event.proposal;
        const pending = proposal.status === "pending";
        const busy = proposalBusy[proposal.id] === true;
        const terminalTone =
          proposal.status === "applied"
            ? styles.proposalResultOk
            : proposal.status === "rejected" || proposal.status === "expired"
              ? styles.proposalResultNo
              : styles.proposalResultPending;
        return (
          <div className={styles.proposalCard} data-proposal-status={proposal.status}>
            <div className={styles.proposalEyebrow}>产品写提案 · 服务端权威</div>
            <div className={styles.proposalTitleRow}>
              <FaShieldAlt aria-hidden="true" />
              <strong>{proposal.subjectHashId}</strong>
              <span className={styles.proposalTransition}>
                {proposal.fromStatus} → {proposal.toStatus}
              </span>
              <span className={styles.toolTime}>{formatTime(event.ts)}</span>
            </div>
            <p className={styles.proposalReason}>{proposal.reason}</p>
            <div className={styles.proposalMeta}>
              <span>{proposal.tool}</span>
              <span>{proposal.subjectType}</span>
              <span title={proposal.expiresAt}>到期 {formatTime(proposal.expiresAt)}</span>
            </div>
            {proposal.note && <p className={styles.proposalNote}>{proposal.note}</p>}
            {pending ? (
              <div className={styles.permActions}>
                <Button
                  className={styles.actionButton}
                  color="success"
                  size="small"
                  loading={busy}
                  disabled={busy}
                  onClick={() => void handleProposalDecision(proposal.id, "approve")}
                >
                  批准产品写入
                </Button>
                <Button
                  className={styles.actionButton}
                  color="error"
                  variant="light"
                  size="small"
                  disabled={busy}
                  onClick={() => void handleProposalDecision(proposal.id, "reject")}
                >
                  拒绝产品写入
                </Button>
              </div>
            ) : (
              <div className={`${styles.proposalResult} ${terminalTone}`} role="status">
                {proposal.status === "applied" ? <FaCheckCircle aria-hidden="true" /> : <FaInfoCircle aria-hidden="true" />}
                <span>{PROPOSAL_LABEL[proposal.status]}</span>
                {proposal.status === "approved" && <Loading size="small" text="" />}
              </div>
            )}
            <p className={styles.permHint}>批准只推进 proposal；实际写入仍由 MCP worker 重新读取域状态、校验状态机并幂等执行。</p>
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
        <p className={styles.desc}>分开观察 Runner 执行权限与产品写提案，在真实写入前完成服务端审批，并保留可回放的生命周期轨迹。</p>
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
              {visibleEvents.map((event) => (
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
                ? "Gateway 验证模式：BFF/开发代理注入管理凭据与可信 actor；浏览器不持有 token。"
                : "演示模式：分别模拟 Runner 权限和产品 proposal，不会对真实工单写入。追加 ?driver=gateway 可切换本机 Gateway。"}
            </span>
          </div>
          <span className={styles.footerMono}>SSE · versioned envelope · staged approval</span>
        </footer>
      </section>
    </div>
  );
};

export default SampleAgentSessionPanel;
