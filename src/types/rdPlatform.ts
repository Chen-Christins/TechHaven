// ============================================================
// R&D Platform (研发平台) Type Definitions
// ============================================================

/** 需求 - Requirement */
export interface Requirement {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  status: "new" | "developing" | "testing" | "done" | "closed";
  creator: string;
  assignee: string;
  organizationId: string;
  iteration: string;
  category: string;
  source: string;
  createdAt: string;
  updatedAt: string;
}

/** 缺陷 - Bug */
export interface Bug {
  id: string;
  title: string;
  description: string;
  severity: "fatal" | "serious" | "normal" | "minor";
  priority: "urgent" | "high" | "medium" | "low";
  status: "new" | "accepted" | "processing" | "verified" | "closed" | "reopened";
  creator: string;
  assignee: string;
  organizationId: string;
  relatedRequirementId: string;
  module: string;
  stepsToReproduce: string;
  environment: string;
  createdAt: string;
  updatedAt: string;
}

/** 任务 - Task */
export interface Task {
  id: string;
  title: string;
  description: string;
  status: "todo" | "doing" | "done" | "closed";
  priority: "high" | "medium" | "low";
  assignee: string;
  organizationId: string;
  requirementId: string;
  deadline: string;
  estimatedHours: number;
  createdAt: string;
  updatedAt: string;
}

/** 组织信息（研发平台用） */
export interface RdOrgInfo {
  orgId: string;
  orgName: string;
  /** 用户在该组织中的角色: 1=普通成员 2=报告者 3=开发者 4=研发主管 5=组织管理员 */
  role: number;
}

/** 组织角色常量 */
export const OrgRole = {
  MEMBER: 1,
  REPORTER: 2,
  DEVELOPER: 3,
  DEV_LEAD: 4,
  ORG_ADMIN: 5,
} as const;

export type OrgRole = (typeof OrgRole)[keyof typeof OrgRole];

/** 角色可执行的操作 */
export const OrgPermission = {
  /** 能否创建需求/缺陷 */
  canCreate: (role: number) => role >= OrgRole.REPORTER,
  /** 能否创建任务 */
  canCreateTask: (role: number) => role >= OrgRole.DEV_LEAD,
  /** 能否编辑所有工单 */
  canEditAll: (role: number) => role >= OrgRole.DEV_LEAD,
  /** 能否删除工单 */
  canDelete: (role: number) => role >= OrgRole.DEV_LEAD,
  /** 能否管理组织成员 */
  canManageMembers: (role: number) => role >= OrgRole.ORG_ADMIN,
};

/** 研发平台统计数据 */
export interface RdStats {
  totalRequirements: number;
  openRequirements: number;
  totalBugs: number;
  unresolvedBugs: number;
  totalTasks: number;
  overdueTasks: number;
}

/** 通用分页响应 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

/** 需求筛选参数 */
export interface RequirementFilters {
  search: string;
  status: string;
  priority: string;
  page: number;
  pageSize: number;
  organizationIds?: string[];
}

/** 缺陷筛选参数 */
export interface BugFilters {
  search: string;
  status: string;
  severity: string;
  priority: string;
  page: number;
  pageSize: number;
  organizationIds?: string[];
}

/** 任务筛选参数 */
export interface TaskFilters {
  search: string;
  status: string;
  priority: string;
  assignee: string;
  page: number;
  pageSize: number;
  organizationIds?: string[];
}
