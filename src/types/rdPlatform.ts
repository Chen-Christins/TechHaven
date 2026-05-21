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
  requirementId: string;
  deadline: string;
  estimatedHours: number;
  createdAt: string;
  updatedAt: string;
}

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
}

/** 缺陷筛选参数 */
export interface BugFilters {
  search: string;
  status: string;
  severity: string;
  priority: string;
  page: number;
  pageSize: number;
}

/** 任务筛选参数 */
export interface TaskFilters {
  search: string;
  status: string;
  priority: string;
  assignee: string;
  page: number;
  pageSize: number;
}
