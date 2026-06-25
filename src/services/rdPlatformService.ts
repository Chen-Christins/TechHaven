// ============================================================
// R&D Platform Service — Real API calls
// ============================================================

import http from "../utils/http";
import type {
  Requirement,
  Bug,
  Task,
  RdStats,
  PaginatedResponse,
  RequirementFilters,
  BugFilters,
  TaskFilters,
  RdTrendAnalysisData,
  RdTrendFilters,
} from "../types/rdPlatform";

// ---------------------------------------------------------------------------
// Helpers — transform backend ↔ frontend format
// ---------------------------------------------------------------------------

const BASE = "/rd";

/** Unix timestamp (seconds) → ISO string */
function tsToISO(ts: number): string {
  return new Date(ts * 1000).toISOString();
}

/** Date string "YYYY-MM-DD" → Unix timestamp (seconds) */
function dateToUnix(dateStr: string): number {
  if (!dateStr) return 0;
  return Math.floor(new Date(dateStr + "T00:00:00").getTime() / 1000);
}

/** Backend item → frontend Requirement */
function mapRequirement(raw: any): Requirement {
  return {
    id: String(raw.id),
    title: raw.title || "",
    description: raw.description || "",
    priority: raw.priority || "medium",
    status: raw.status || "new",
    creator: raw.creator || "",
    assignee: raw.assignee || "",
    assigneeAvatar: raw.assignee_avatar || "",
    organizationId: String(raw.org_id ?? ""),
    iteration: raw.iteration || "",
    category: raw.category || "",
    source: raw.source || "",
    createdAt: typeof raw.created_at === "number" ? tsToISO(raw.created_at) : raw.created_at || "",
    updatedAt: typeof raw.updated_at === "number" ? tsToISO(raw.updated_at) : raw.updated_at || "",
  };
}

/** Backend item → frontend Bug */
function mapBug(raw: any): Bug {
  return {
    id: String(raw.id),
    title: raw.title || "",
    description: raw.description || "",
    severity: raw.severity || "normal",
    priority: raw.priority || "high",
    status: raw.status || "new",
    creator: raw.creator || "",
    assignee: raw.assignee || "",
    assigneeAvatar: raw.assignee_avatar || "",
    organizationId: String(raw.org_id ?? ""),
    relatedRequirementId: String(raw.related_requirement_id ?? ""),
    module: raw.module || "",
    stepsToReproduce: raw.steps_to_reproduce || "",
    environment: raw.environment || "",
    createdAt: typeof raw.created_at === "number" ? tsToISO(raw.created_at) : raw.created_at || "",
    updatedAt: typeof raw.updated_at === "number" ? tsToISO(raw.updated_at) : raw.updated_at || "",
  };
}

/** Backend item → frontend Task */
function mapTask(raw: any): Task {
  return {
    id: String(raw.id),
    title: raw.title || "",
    description: raw.description || "",
    status: raw.status || "todo",
    priority: raw.priority || "medium",
    assignee: raw.assignee || "",
    assigneeAvatar: raw.assignee_avatar || "",
    creator: raw.creator || "",
    organizationId: String(raw.org_id ?? ""),
    requirementId: String(raw.requirement_id ?? ""),
    deadline: raw.deadline
      ? typeof raw.deadline === "number"
        ? `${new Date(raw.deadline * 1000).getFullYear()}-${String(new Date(raw.deadline * 1000).getMonth() + 1).padStart(2, "0")}-${String(new Date(raw.deadline * 1000).getDate()).padStart(2, "0")}`
        : raw.deadline
      : "",
    estimatedHours: Number(raw.estimated_hours) || 0,
    createdAt: typeof raw.created_at === "number" ? tsToISO(raw.created_at) : raw.created_at || "",
    updatedAt: typeof raw.updated_at === "number" ? tsToISO(raw.updated_at) : raw.updated_at || "",
  };
}

/** Frontend filter org_ids → query string org_id (取第一个，单选筛选用) */
function orgIdParam(organizationIds?: string[]): string {
  if (!organizationIds || organizationIds.length === 0) return "";
  return organizationIds[0];
}

/** Build query string from filters */
function toQuery(params: Record<string, any>): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  }
  return parts.length > 0 ? "?" + parts.join("&") : "";
}

/** 后端趋势响应 → 前端 RdTrendAnalysisData */
function mapTrendResponse(raw: any): RdTrendAnalysisData {
  const s = raw.summary || {};
  const series = (raw.series || []).map((item: any) => ({
    date: item.date || "",
    requirements: item.requirements ?? 0,
    bugs: item.bugs ?? 0,
    tasks: item.tasks ?? 0,
    completed: item.completed ?? 0,
    reopened: item.reopened ?? 0,
    reviewPassRate: item.review_pass_rate ?? 0,
    cycleTime: item.cycle_time ?? 0,
  }));
  const wd = raw.work_distribution || {};
  const th = raw.team_health || {};

  // insights 为空时使用 mock
  const insights =
    raw.insights && raw.insights.length > 0
      ? raw.insights
      : [
          { title: "交付节奏", content: "完成项保持增长，任务吞吐高于新增缺陷，短期积压风险可控。" },
          { title: "质量风险", content: "返工数处于低位，审查通过率持续提升，建议继续保留当前代码审查标准。" },
          { title: "资源关注", content: "任务总量仍在上升，如下个周期新增继续增加，需要提前拆分高优先级任务。" },
        ];

  return {
    summary: {
      completedTotal: s.completed_total ?? 0,
      bugTotal: s.bug_total ?? 0,
      avgReviewPassRate: s.avg_review_pass_rate ?? 0,
      avgCycleTime: s.avg_cycle_time ?? 0,
      taskDelta: s.task_delta ?? 0,
      cycleDelta: s.cycle_delta ?? 0,
    },
    series,
    workDistribution: {
      requirementDelivery: wd.requirement_delivery ?? wd.requirements ?? 0,
      bugFix: wd.bug_fix ?? wd.bugs ?? 0,
      rdTask: wd.rd_task ?? wd.tasks ?? 0,
      codeReview: wd.code_review ?? 0,
    },
    teamHealth: {
      throughput: th.throughput ?? 0,
      bugPressure: th.bug_pressure ?? 0,
      reviewEfficiency: th.review_efficiency ?? 0,
      reworkRisk: th.rework_risk ?? 0,
    },
    insights,
  };
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class RdPlatformService {
  // -- Stats ----------------------------------------------------------------

  static async getStats(organizationIds?: string[]): Promise<RdStats> {
    const q = toQuery({ org_id: orgIdParam(organizationIds) });
    const res = await http.get<any>(`${BASE}/stats${q}`);
    const d = res.data;
    return {
      totalRequirements: d.total_requirements ?? 0,
      openRequirements: d.open_requirements ?? 0,
      totalBugs: d.total_bugs ?? 0,
      unresolvedBugs: d.unresolved_bugs ?? 0,
      totalTasks: d.total_tasks ?? 0,
      overdueTasks: d.overdue_tasks ?? 0,
      totalReviews: d.total_reviews ?? 0,
      pendingReviews: d.pending_reviews ?? 0,
    };
  }

  static async getTrends(filters: RdTrendFilters): Promise<RdTrendAnalysisData> {
    const q = toQuery({
      org_id: filters.orgId,
      period_days: filters.periodDays,
      granularity: filters.granularity || "day",
    });
    const res = await http.get<any>(`${BASE}/trends${q}`);
    return mapTrendResponse(res.data);
  }

  // -- Requirements ---------------------------------------------------------

  static async getRequirements(filters: Partial<RequirementFilters> = {}): Promise<PaginatedResponse<Requirement>> {
    const q = toQuery({
      page: filters.page,
      page_size: filters.pageSize,
      org_id: orgIdParam(filters.organizationIds),
      search: filters.search,
      status: filters.status,
      priority: filters.priority,
    });
    const res = await http.get<any>(`${BASE}/requirements${q}`);
    return {
      data: (res.data.list || []).map(mapRequirement),
      total: res.data.total ?? 0,
    };
  }

  static async getRequirementById(id: string): Promise<Requirement | null> {
    const res = await http.get<any>(`${BASE}/requirements/detail?id=${id}`);
    if (!res.data) return null;
    return mapRequirement(res.data);
  }

  static async createRequirement(params: Omit<Requirement, "id" | "createdAt" | "updatedAt">): Promise<Requirement> {
    const body = {
      title: params.title,
      description: params.description,
      priority: params.priority,
      status: params.status || "new",
      org_id: Number(params.organizationId) || 0,
      assignee: params.assignee,
      creator: params.creator,
      assignee_id: params.assignee || "",
      iteration: params.iteration,
      category: params.category,
      source: params.source,
    };
    const res = await http.post<any>(`${BASE}/requirements/edit`, body);
    return mapRequirement(res.data);
  }

  static async updateRequirement(
    id: string,
    params: Partial<Omit<Requirement, "id" | "createdAt" | "updatedAt">>,
  ): Promise<Requirement | null> {
    const body: Record<string, any> = { id: Number(id) };
    if (params.title !== undefined) body.title = params.title;
    if (params.description !== undefined) body.description = params.description;
    if (params.priority !== undefined) body.priority = params.priority;
    if (params.status !== undefined) body.status = params.status;
    if (params.assignee !== undefined) {
      body.assignee = params.assignee;
      body.assignee_id = params.assignee;
    }
    if (params.organizationId !== undefined) body.org_id = Number(params.organizationId);
    if (params.iteration !== undefined) body.iteration = params.iteration;
    if (params.category !== undefined) body.category = params.category;
    if (params.source !== undefined) body.source = params.source;

    const res = await http.post<any>(`${BASE}/requirements/edit`, body);
    if (!res.data) return null;
    return mapRequirement(res.data);
  }

  static async deleteRequirement(id: string, orgId?: string): Promise<boolean> {
    const res = await http.post<any>(`${BASE}/requirements/delete`, { id: Number(id), org_id: Number(orgId) || 0 });
    return res.errno === 0 || (res as any).success;
  }

  // -- Bugs -----------------------------------------------------------------

  static async getBugs(filters: Partial<BugFilters> = {}): Promise<PaginatedResponse<Bug>> {
    const q = toQuery({
      page: filters.page,
      page_size: filters.pageSize,
      org_id: orgIdParam(filters.organizationIds),
      search: filters.search,
      status: filters.status,
      severity: filters.severity,
      priority: filters.priority,
    });
    const res = await http.get<any>(`${BASE}/bugs${q}`);
    return {
      data: (res.data.list || []).map(mapBug),
      total: res.data.total ?? 0,
    };
  }

  static async getBugById(id: string): Promise<Bug | null> {
    const res = await http.get<any>(`${BASE}/bugs/detail?id=${id}`);
    if (!res.data) return null;
    return mapBug(res.data);
  }

  static async createBug(params: Omit<Bug, "id" | "createdAt" | "updatedAt">): Promise<Bug> {
    const body = {
      title: params.title,
      description: params.description,
      severity: params.severity,
      priority: params.priority,
      status: params.status || "new",
      org_id: Number(params.organizationId) || 0,
      assignee: params.assignee,
      creator: params.creator,
      assignee_id: params.assignee || "",
      related_requirement_id: params.relatedRequirementId || "",
      module: params.module,
      steps_to_reproduce: params.stepsToReproduce,
      environment: params.environment,
    };
    const res = await http.post<any>(`${BASE}/bugs/edit`, body);
    return mapBug(res.data);
  }

  static async updateBug(id: string, params: Partial<Omit<Bug, "id" | "createdAt" | "updatedAt">>): Promise<Bug | null> {
    const body: Record<string, any> = { id: Number(id) };
    if (params.title !== undefined) body.title = params.title;
    if (params.description !== undefined) body.description = params.description;
    if (params.severity !== undefined) body.severity = params.severity;
    if (params.priority !== undefined) body.priority = params.priority;
    if (params.status !== undefined) body.status = params.status;
    if (params.assignee !== undefined) {
      body.assignee = params.assignee;
      body.assignee_id = params.assignee;
    }
    if (params.organizationId !== undefined) body.org_id = Number(params.organizationId);
    if (params.relatedRequirementId !== undefined) body.related_requirement_id = params.relatedRequirementId;
    if (params.module !== undefined) body.module = params.module;
    if (params.stepsToReproduce !== undefined) body.steps_to_reproduce = params.stepsToReproduce;
    if (params.environment !== undefined) body.environment = params.environment;

    const res = await http.post<any>(`${BASE}/bugs/edit`, body);
    if (!res.data) return null;
    return mapBug(res.data);
  }

  static async deleteBug(id: string, orgId?: string): Promise<boolean> {
    const res = await http.post<any>(`${BASE}/bugs/delete`, { id: Number(id), org_id: Number(orgId) || 0 });
    return res.errno === 0 || (res as any).success;
  }

  // -- Tasks ----------------------------------------------------------------

  static async getTasks(filters: Partial<TaskFilters> = {}): Promise<PaginatedResponse<Task>> {
    const q = toQuery({
      page: filters.page,
      page_size: filters.pageSize,
      org_id: orgIdParam(filters.organizationIds),
      search: filters.search,
      status: filters.status,
      priority: filters.priority,
      assignee_id: filters.assignee || undefined,
    });
    const res = await http.get<any>(`${BASE}/tasks${q}`);
    return {
      data: (res.data.list || []).map(mapTask),
      total: res.data.total ?? 0,
    };
  }

  static async getTaskById(id: string): Promise<Task | null> {
    const res = await http.get<any>(`${BASE}/tasks/detail?id=${id}`);
    if (!res.data) return null;
    return mapTask(res.data);
  }

  static async createTask(params: Omit<Task, "id" | "createdAt" | "updatedAt">): Promise<Task> {
    const body = {
      title: params.title,
      description: params.description,
      priority: params.priority,
      status: params.status || "todo",
      org_id: Number(params.organizationId) || 0,
      assignee: params.assignee,
      creator: params.creator,
      assignee_id: params.assignee || "",
      requirement_id: params.requirementId || "",
      deadline: dateToUnix(params.deadline || ""),
      estimated_hours: params.estimatedHours,
    };
    const res = await http.post<any>(`${BASE}/tasks/edit`, body);
    return mapTask(res.data);
  }

  static async updateTask(id: string, params: Partial<Omit<Task, "id" | "createdAt" | "updatedAt">>): Promise<Task | null> {
    const body: Record<string, any> = { id: Number(id) };
    if (params.title !== undefined) body.title = params.title;
    if (params.description !== undefined) body.description = params.description;
    if (params.status !== undefined) body.status = params.status;
    if (params.priority !== undefined) body.priority = params.priority;
    if (params.assignee !== undefined) {
      body.assignee = params.assignee;
      body.assignee_id = params.assignee;
    }
    if (params.organizationId !== undefined) body.org_id = Number(params.organizationId);
    if (params.requirementId !== undefined) body.requirement_id = params.requirementId;
    if (params.deadline !== undefined) body.deadline = dateToUnix(params.deadline || "");
    if (params.estimatedHours !== undefined) body.estimated_hours = params.estimatedHours;

    const res = await http.post<any>(`${BASE}/tasks/edit`, body);
    if (!res.data) return null;
    return mapTask(res.data);
  }

  static async deleteTask(id: string, orgId?: string): Promise<boolean> {
    const res = await http.post<any>(`${BASE}/tasks/delete`, { id: Number(id), org_id: Number(orgId) || 0 });
    return res.errno === 0 || (res as any).success;
  }

  // -- Organizations (R&D platform) ----------------------------------------

  static async getOrgMembers(orgId: string): Promise<{ userId: string; name: string; role: number; avatar?: string }[]> {
    const res = await http.get<any>(`${BASE}/organizations/members?org_id=${orgId}`);
    const list = res.data?.list || [];
    if (!Array.isArray(list)) return [];
    return list.map((item: any) => ({
      userId: String(item.user_id ?? item.id ?? ""),
      name: item.name || "",
      role: Number(item.role) || 1,
      avatar: item.avatar || "",
    }));
  }

  static async getMyOrganizations(): Promise<{ orgId: string; orgName: string; role: number }[]> {
    const res = await http.get<any>(`${BASE}/organizations`);
    const list = res.data?.list || res.data || [];
    if (!Array.isArray(list)) return [];
    return list.map((item: any) => ({
      orgId: String(item.org_id ?? item.id),
      orgName: item.org_name || item.name || "",
      role: Number(item.role) || 1,
    }));
  }

  // -- My Tickets -----------------------------------------------------------

  static async getMyTickets(params: {
    type: "requirement" | "bug" | "task";
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    orgId?: string;
  }): Promise<PaginatedResponse<Requirement | Bug | Task>> {
    const q = toQuery({
      type: params.type,
      page: params.page,
      page_size: params.pageSize,
      search: params.search,
      status: params.status,
      org_id: params.orgId,
    });
    const res = await http.get<any>(`${BASE}/my-tickets${q}`);
    const d = res.data || {};
    const list =
      params.type === "requirement"
        ? (d.list || []).map(mapRequirement)
        : params.type === "bug"
          ? (d.list || []).map(mapBug)
          : (d.list || []).map(mapTask);
    return { data: list, total: d.total ?? 0 };
  }

  // -- Access Control -------------------------------------------------------

  static async checkAccess(): Promise<{ canAccess: boolean; reason?: string }> {
    const res = await http.get<any>(`${BASE}/check_access`);
    const d = res.data;
    return {
      canAccess: d?.can_access === "1",
      reason: d?.reason,
    };
  }
}

export default RdPlatformService;
