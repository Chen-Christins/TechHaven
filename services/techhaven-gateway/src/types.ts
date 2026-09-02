/**
 * 引擎驱动接口契约（TH-RFC-001 §05.1）。
 *
 * 类型单源已迁移至 `techhaven-contracts`（仓库根契约包，见 contracts/README.md）：
 * 本文件仅保留重导出与「逐字冻结」的说明。跨驱动（mock / dsh）与 Gateway、
 * SPA 消费的引擎事件 / 事件信封 / 会话视图 / API 形态都以契约包为准。
 */

import type { EngineEvent, EventEnvelope } from "techhaven-contracts";

export type {
  SessionStatus,
  EngineEvent,
  EngineEventPayload,
  EventEnvelope,
  SessionView,
  CreateSessionRequest,
  CreateSessionResponse,
  ListSessionsResponse,
  SessionDetailResponse,
  AnswerPermissionRequest,
  OkResponse,
  ErrorEnvelope,
  ProposalStatus,
  ProposalLifecycleEvent,
} from "techhaven-contracts";

/** 引擎事件载荷的荷载形状不可变：driver 输出 → 信封 payload 的直接来源 */
// 契约包里的 EngineEvent/EventEnvelope 定义为唯一事实源，改动需双方同步评审（见 contracts/README.md）。

export interface EngineSessionHandle {
  events(): AsyncIterable<EngineEvent>;                       // 会话全量事件流（含历史回放）
  send(text: string): Promise<void>;
  answerPermission(requestId: string, decision: "approve" | "reject", note?: string): Promise<void>;
  cancel(): Promise<void>;
  dispose(): Promise<void>;
}
export interface EngineDriver {
  readonly name: string;
  startSession(opts: { sessionId: string; orgId: number; prompt: string; profile?: string }): Promise<EngineSessionHandle>;
  dispose(): Promise<void>;
}
