// ============================================================
// 枚举常量定义（状态、优先级、严重度等）
// ============================================================

// ===== 文章状态 =====

export const ArticleState = {
    REVIEWING: 1,
    PUBLISHED: 2,
    UNALLOWED: 3,
    PRIVATE: 4,
} as const;

export type ArticleState = (typeof ArticleState)[keyof typeof ArticleState];

/** 文章状态 → 中文显示名 */
export const ArticleStateLabel: Record<ArticleState, string> = {
    [ArticleState.REVIEWING]: "审核中",
    [ArticleState.PUBLISHED]: "已发布",
    [ArticleState.UNALLOWED]: "未通过",
    [ArticleState.PRIVATE]: "私密",
};

// ===== 作业状态 =====

export const AssignmentStatus = {
    DRAFT: 0,
    OPEN: 1,
    CLOSED: 2,
} as const;

export type AssignmentStatus = (typeof AssignmentStatus)[keyof typeof AssignmentStatus];

/** 作业状态 → 中文显示名 */
export const AssignmentStatusLabel: Record<AssignmentStatus, string> = {
    [AssignmentStatus.DRAFT]: "草稿",
    [AssignmentStatus.OPEN]: "进行中",
    [AssignmentStatus.CLOSED]: "已关闭",
};

// ===== 作业优先级 =====

export const AssignmentPriority = {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
    URGENT: 4,
} as const;

export type AssignmentPriority = (typeof AssignmentPriority)[keyof typeof AssignmentPriority];

/** 作业优先级 → 中文显示名 */
export const AssignmentPriorityLabel: Record<AssignmentPriority, string> = {
    [AssignmentPriority.LOW]: "低",
    [AssignmentPriority.MEDIUM]: "中",
    [AssignmentPriority.HIGH]: "高",
    [AssignmentPriority.URGENT]: "紧急",
};

// ===== 组织成员状态 =====

export const OrgMembershipStatus = {
    PENDING: 0,
    JOINED: 1,
    REJECTED: 2,
    LEFT: 3,
} as const;

/** 组织成员状态 → 中文显示名 */
export const OrgMembershipStatusLabel: Record<number, string> = {
    [OrgMembershipStatus.PENDING]: "申请中",
    [OrgMembershipStatus.JOINED]: "已加入",
    [OrgMembershipStatus.REJECTED]: "已拒绝",
    [OrgMembershipStatus.LEFT]: "已退出",
};

// ===== 评论状态 =====

export const CommentStatus = {
    PENDING: "pending",
    APPROVED: "approved",
    REJECTED: "rejected",
    SPAM: "spam",
} as const;

export type CommentStatus = (typeof CommentStatus)[keyof typeof CommentStatus];

/** 评论状态 → 中文显示名 */
export const CommentStatusLabel: Record<CommentStatus, string> = {
    [CommentStatus.PENDING]: "待审核",
    [CommentStatus.APPROVED]: "已通过",
    [CommentStatus.REJECTED]: "已拒绝",
    [CommentStatus.SPAM]: "垃圾评论",
};

// ===== 备份/导出状态 =====

export const BackupStatus = {
    PROCESSING: "processing",
    COMPLETED: "completed",
    FAILED: "failed",
} as const;

export type BackupStatus = (typeof BackupStatus)[keyof typeof BackupStatus];

/** 备份状态 → 中文显示名 */
export const BackupStatusLabel: Record<BackupStatus, string> = {
    [BackupStatus.PROCESSING]: "处理中",
    [BackupStatus.COMPLETED]: "已完成",
    [BackupStatus.FAILED]: "失败",
};

// ===== RD 平台 - 需求状态 =====

export const ReqStatus = {
    NEW: "new",
    DEVELOPING: "developing",
    TESTING: "testing",
    DONE: "done",
    CLOSED: "closed",
} as const;

export type ReqStatus = (typeof ReqStatus)[keyof typeof ReqStatus];

/** 需求状态 → 中文显示名 */
export const ReqStatusLabel: Record<ReqStatus, string> = {
    [ReqStatus.NEW]: "新建",
    [ReqStatus.DEVELOPING]: "开发中",
    [ReqStatus.TESTING]: "测试中",
    [ReqStatus.DONE]: "已完成",
    [ReqStatus.CLOSED]: "已关闭",
};

// ===== RD 平台 - 缺陷状态 =====

export const BugStatus = {
    NEW: "new",
    PROCESSING: "processing",
    VERIFIED: "verified",
    CLOSED: "closed",
    REOPENED: "reopened",
} as const;

export type BugStatus = (typeof BugStatus)[keyof typeof BugStatus];

/** 缺陷状态 → 中文显示名 */
export const BugStatusLabel: Record<BugStatus, string> = {
    [BugStatus.NEW]: "新建",
    [BugStatus.PROCESSING]: "处理中",
    [BugStatus.VERIFIED]: "已验证",
    [BugStatus.CLOSED]: "已关闭",
    [BugStatus.REOPENED]: "已重开",
};

// ===== RD 平台 - 任务状态 =====

export const RdTaskStatus = {
    TODO: "todo",
    DOING: "doing",
    DONE: "done",
    CLOSED: "closed",
} as const;

export type RdTaskStatus = (typeof RdTaskStatus)[keyof typeof RdTaskStatus];

/** 任务状态 → 中文显示名 */
export const RdTaskStatusLabel: Record<RdTaskStatus, string> = {
    [RdTaskStatus.TODO]: "待办",
    [RdTaskStatus.DOING]: "进行中",
    [RdTaskStatus.DONE]: "已完成",
    [RdTaskStatus.CLOSED]: "已关闭",
};

// ===== RD 平台 - 优先级 =====

export const RdPriority = {
    LOW: "low",
    MEDIUM: "medium",
    HIGH: "high",
    URGENT: "urgent",
} as const;

export type RdPriority = (typeof RdPriority)[keyof typeof RdPriority];

/** 优先级 → 中文显示名 */
export const RdPriorityLabel: Record<RdPriority, string> = {
    [RdPriority.LOW]: "低",
    [RdPriority.MEDIUM]: "中",
    [RdPriority.HIGH]: "高",
    [RdPriority.URGENT]: "紧急",
};

// ===== RD 平台 - 严重度 =====

export const Severity = {
    MINOR: "minor",
    NORMAL: "normal",
    SERIOUS: "serious",
    FATAL: "fatal",
} as const;

export type Severity = (typeof Severity)[keyof typeof Severity];

/** 严重度 → 中文显示名 */
export const SeverityLabel: Record<Severity, string> = {
    [Severity.MINOR]: "轻微",
    [Severity.NORMAL]: "一般",
    [Severity.SERIOUS]: "严重",
    [Severity.FATAL]: "致命",
};

// ===== 代码审查 - PR 状态 =====

export const CrState = {
    OPEN: "open",
    CLOSED: "closed",
    MERGED: "merged",
} as const;

export type CrState = (typeof CrState)[keyof typeof CrState];

/** PR 状态 → 中文显示名 */
export const CrStateLabel: Record<CrState, string> = {
    [CrState.OPEN]: "开启中",
    [CrState.CLOSED]: "已关闭",
    [CrState.MERGED]: "已合并",
};

// ===== 代码审查 - 审查状态 =====

export const ReviewStatus = {
    PENDING: "pending",
    REVIEWING: "reviewing",
    APPROVED: "approved",
    REJECTED: "rejected",
    CHANGES_REQUESTED: "changes_requested",
} as const;

export type ReviewStatus = (typeof ReviewStatus)[keyof typeof ReviewStatus];

/** 审查状态 → 中文显示名 */
export const ReviewStatusLabel: Record<ReviewStatus, string> = {
    [ReviewStatus.PENDING]: "待审查",
    [ReviewStatus.REVIEWING]: "审查中",
    [ReviewStatus.APPROVED]: "已通过",
    [ReviewStatus.REJECTED]: "已拒绝",
    [ReviewStatus.CHANGES_REQUESTED]: "需修改",
};

// ===== Agent 会话状态（类型来自 contracts/agent）=====

export type AgentSessionStatus = "queued" | "running" | "awaiting_permission" | "succeeded" | "failed" | "cancelled";

/** Agent 会话状态 → 中文显示名 */
export const AgentSessionStatusLabel: Record<AgentSessionStatus, string> = {
    queued: "排队中",
    running: "运行中",
    awaiting_permission: "待审批",
    succeeded: "已成功",
    failed: "已失败",
    cancelled: "已取消",
};

/** Agent 会话状态 → 徽标语义色 */
export const AgentSessionStatusTone: Record<AgentSessionStatus, "neutral" | "running" | "warning" | "success" | "danger"> = {
    queued: "neutral",
    running: "running",
    awaiting_permission: "warning",
    succeeded: "success",
    failed: "danger",
    cancelled: "danger",
};

// ===== Agent 提案状态（类型来自 contracts/agent）=====

export type ProposalStatus = "pending" | "approved" | "applying" | "rejected" | "applied" | "expired";

/** 提案状态 → 中文显示名 */
export const ProposalStatusLabel: Record<ProposalStatus, string> = {
    pending: "待产品审批",
    approved: "已批准，等待应用",
    applying: "正在应用，不可撤回",
    rejected: "已拒绝",
    applied: "已应用",
    expired: "已过期",
};

// ===== 仓库同步状态 =====

export const SyncStatus = {
    IDLE: "idle",
    SYNCING: "syncing",
    SUCCESS: "success",
    FAILED: "failed",
} as const;

export type SyncStatus = (typeof SyncStatus)[keyof typeof SyncStatus];

/** 同步状态 → 中文显示名 */
export const SyncStatusLabel: Record<SyncStatus, string> = {
    [SyncStatus.IDLE]: "未同步",
    [SyncStatus.SYNCING]: "同步中...",
    [SyncStatus.SUCCESS]: "已同步",
    [SyncStatus.FAILED]: "同步失败",
};

// ===== 反馈类型 =====

export const FeedbackType = {
    BUG: "bug",
    FEATURE: "feature",
    OTHER: "other",
    ALL: "",
} as const;

export type FeedbackType = (typeof FeedbackType)[keyof typeof FeedbackType];

/** 反馈类型 → 中文显示名 */
export const FeedbackTypeLabel: Record<string, string> = {
    [FeedbackType.BUG]: "问题反馈",
    [FeedbackType.FEATURE]: "功能建议",
    [FeedbackType.OTHER]: "其他",
    [FeedbackType.ALL]: "全部",
};
