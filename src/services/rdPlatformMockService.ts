// ============================================================
// R&D Platform Mock Service — localStorage-backed CRUD
// Replace with real API calls when backend is ready.
// ============================================================

import type {
  Requirement,
  Bug,
  Task,
  RdStats,
  PaginatedResponse,
  RequirementFilters,
  BugFilters,
  TaskFilters,
} from "../types/rdPlatform";

const STORAGE_REQUIREMENTS = "rd_requirements";
const STORAGE_BUGS = "rd_bugs";
const STORAGE_TASKS = "rd_tasks";

const PAGE_SIZE = 10;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function delay(ms = 180): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readData<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function writeData<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function now(): string {
  return new Date().toISOString();
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

function seedIfEmpty(): void {
  if (readData<Requirement>(STORAGE_REQUIREMENTS).length === 0) {
    writeData<Requirement>(STORAGE_REQUIREMENTS, seedRequirements());
  }
  if (readData<Bug>(STORAGE_BUGS).length === 0) {
    writeData<Bug>(STORAGE_BUGS, seedBugs());
  }
  if (readData<Task>(STORAGE_TASKS).length === 0) {
    writeData<Task>(STORAGE_TASKS, seedTasks());
  }
}

type SeedRequirement = Omit<Requirement, "id" | "createdAt" | "updatedAt"> & { organizationId: string };
type SeedBug = Omit<Bug, "id" | "createdAt" | "updatedAt"> & { organizationId: string };
type SeedTask = Omit<Task, "id" | "createdAt" | "updatedAt"> & { organizationId: string };

function seedRequirements(): Requirement[] {
  const items: SeedRequirement[] = [
    {
      title: "用户登录页面优化",
      description: "优化登录页面UI，增加社交账号登录方式，支持微信扫码登录。",
      priority: "high",
      status: "developing",
      creator: "张三",
      assignee: "李四",
      organizationId: "org_1",
      iteration: "Sprint 12",
      category: "前端",
      source: "产品需求",
    },
    {
      title: "消息通知中心重构",
      description: "重构消息通知模块，支持消息分类、批量已读、通知偏好设置等功能。",
      priority: "high",
      status: "new",
      creator: "王五",
      assignee: "",
      organizationId: "org_2",
      iteration: "Sprint 13",
      category: "后端",
      source: "用户反馈",
    },
    {
      title: "数据导出功能",
      description: "支持需求、缺陷数据的 Excel/CSV 导出，包含筛选条件后的数据导出。",
      priority: "medium",
      status: "new",
      creator: "赵六",
      assignee: "张三",
      organizationId: "org_2",
      iteration: "Sprint 12",
      category: "后端",
      source: "内部需求",
    },
    {
      title: "移动端适配",
      description: "对研发平台进行移动端适配，确保在手机和平板上的基本操作体验。",
      priority: "medium",
      status: "testing",
      creator: "李四",
      assignee: "王五",
      organizationId: "org_1",
      iteration: "Sprint 11",
      category: "前端",
      source: "产品需求",
    },
    {
      title: "权限体系升级",
      description: "增加自定义角色功能，支持细粒度的模块级权限控制。",
      priority: "low",
      status: "done",
      creator: "张三",
      assignee: "赵六",
      organizationId: "org_2",
      iteration: "Sprint 10",
      category: "后端",
      source: "技术规划",
    },
    {
      title: "项目看板视图",
      description: "新增看板视图展示需求、任务状态流转，支持拖拽更新状态。",
      priority: "high",
      status: "new",
      creator: "王五",
      assignee: "",
      organizationId: "org_1",
      iteration: "Sprint 13",
      category: "前端",
      source: "竞品分析",
    },
    {
      title: "搜索功能增强",
      description: "支持全文搜索需求、缺陷、任务，支持高级筛选条件组合。",
      priority: "medium",
      status: "developing",
      creator: "赵六",
      assignee: "李四",
      organizationId: "org_3",
      iteration: "Sprint 12",
      category: "全栈",
      source: "用户反馈",
    },
    {
      title: "API 接口文档自动生成",
      description: "基于代码注解自动生成并发布 API 文档，集成 Swagger UI。",
      priority: "low",
      status: "new",
      creator: "李四",
      assignee: "",
      organizationId: "org_2",
      iteration: "Sprint 14",
      category: "后端",
      source: "技术规划",
    },
  ];
  // Timestamps
  const base = Date.now();
  return items.map((item, i) => ({
    ...item,
    id: generateId(),
    createdAt: new Date(base - (items.length - i) * 86400000).toISOString(),
    updatedAt: new Date(base - (items.length - i) * 43200000).toISOString(),
  }));
}

function seedBugs(): Bug[] {
  const items: SeedBug[] = [
    {
      title: "登录页面白屏",
      description: "iOS Safari 浏览器下登录页面偶现白屏，需刷新后才能正常显示。",
      severity: "serious",
      priority: "high",
      status: "processing",
      creator: "张三",
      assignee: "李四",
      organizationId: "org_1",
      relatedRequirementId: "",
      module: "用户模块",
      stepsToReproduce: "1. 使用 iOS Safari 打开登录页\n2. 等待页面加载\n3. 偶现白屏",
      environment: "iOS 18 Safari",
    },
    {
      title: "消息通知数量不准确",
      description: "未读消息数量角标与实际未读消息数不一致，多显示了计数。",
      severity: "normal",
      priority: "medium",
      status: "new",
      creator: "王五",
      assignee: "",
      organizationId: "org_2",
      relatedRequirementId: "",
      module: "通知模块",
      stepsToReproduce: "1. 登录后查看通知图标\n2. 对比角标数和实际未读数",
      environment: "Chrome 120",
    },
    {
      title: "数据导出超时",
      description: "导出大量数据时请求超时，超过 1000 条记录时必现。",
      severity: "serious",
      priority: "urgent",
      status: "accepted",
      creator: "赵六",
      assignee: "张三",
      organizationId: "org_2",
      relatedRequirementId: "",
      module: "数据模块",
      stepsToReproduce: "1. 筛选超过1000条数据\n2. 点击导出\n3. 等待超时",
      environment: "生产环境",
    },
    {
      title: "看板拖拽卡顿",
      description: "在看板视图拖拽卡片时出现明显卡顿，帧率低于 30fps。",
      severity: "minor",
      priority: "low",
      status: "new",
      creator: "李四",
      assignee: "",
      organizationId: "org_1",
      relatedRequirementId: "",
      module: "看板模块",
      stepsToReproduce: "1. 打开看板视图\n2. 拖拽任意卡片\n3. 观察帧率",
      environment: "Firefox 115",
    },
    {
      title: "权限变更未生效",
      description: "修改用户角色后需重新登录才能生效，期望实时生效。",
      severity: "normal",
      priority: "medium",
      status: "verified",
      creator: "张三",
      assignee: "赵六",
      organizationId: "org_2",
      relatedRequirementId: "",
      module: "权限模块",
      stepsToReproduce: "1. 管理员修改某用户角色\n2. 该用户刷新页面\n3. 权限未变化",
      environment: "全平台",
    },
    {
      title: "富文本编辑器粘贴图片失败",
      description: "从剪贴板粘贴截图到编辑器时，图片上传失败但无错误提示。",
      severity: "normal",
      priority: "high",
      status: "new",
      creator: "王五",
      assignee: "李四",
      organizationId: "org_1",
      relatedRequirementId: "",
      module: "编辑模块",
      stepsToReproduce: "1. 截图到剪贴板\n2. 在编辑器中粘贴\n3. 无任何反应",
      environment: "Chrome / Edge",
    },
    {
      title: "搜索结果排序异常",
      description: "搜索结果按相关度排序时，部分结果顺序不符合预期。",
      severity: "minor",
      priority: "low",
      status: "closed",
      creator: "赵六",
      assignee: "王五",
      organizationId: "org_3",
      relatedRequirementId: "",
      module: "搜索模块",
      stepsToReproduce: "1. 搜索关键词\n2. 查看结果排序",
      environment: "全平台",
    },
  ];
  const base = Date.now();
  return items.map((item, i) => ({
    ...item,
    id: generateId(),
    createdAt: new Date(base - (items.length - i) * 86400000).toISOString(),
    updatedAt: new Date(base - (items.length - i) * 43200000).toISOString(),
  }));
}

function seedTasks(): Task[] {
  const items: SeedTask[] = [
    {
      title: "编写登录模块单元测试",
      description: "为登录页面组件编写单元测试，覆盖正常登录、登录失败、表单校验等场景。",
      status: "doing",
      priority: "high",
      assignee: "李四",
      organizationId: "org_1",
      requirementId: "",
      deadline: "2026-05-30",
      estimatedHours: 8,
    },
    {
      title: "Code Review: 通知模块",
      description: "审查消息通知重构代码，关注性能和安全问题。",
      status: "todo",
      priority: "medium",
      assignee: "张三",
      organizationId: "org_2",
      requirementId: "",
      deadline: "2026-05-25",
      estimatedHours: 4,
    },
    {
      title: "部署 Staging 环境",
      description: "将最新代码部署到 Staging 环境进行集成测试。",
      status: "done",
      priority: "high",
      assignee: "王五",
      organizationId: "org_2",
      requirementId: "",
      deadline: "2026-05-20",
      estimatedHours: 2,
    },
    {
      title: "更新 API 文档",
      description: "根据最近的接口变更更新 API 文档。",
      status: "todo",
      priority: "low",
      assignee: "",
      organizationId: "org_2",
      requirementId: "",
      deadline: "2026-06-05",
      estimatedHours: 3,
    },
    {
      title: "修复导出超时问题",
      description: "优化数据导出查询，添加分页导出和异步任务支持。",
      status: "doing",
      priority: "high",
      assignee: "赵六",
      organizationId: "org_2",
      requirementId: "",
      deadline: "2026-05-28",
      estimatedHours: 16,
    },
    {
      title: "性能测试",
      description: "对看板视图进行性能测试，找出拖拽卡顿的根因。",
      status: "todo",
      priority: "medium",
      assignee: "张三",
      organizationId: "org_3",
      requirementId: "",
      deadline: "2026-06-01",
      estimatedHours: 6,
    },
  ];
  const base = Date.now();
  return items.map((item, i) => ({
    ...item,
    id: generateId(),
    createdAt: new Date(base - (items.length - i) * 86400000).toISOString(),
    updatedAt: new Date(base - (items.length - i) * 43200000).toISOString(),
  }));
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class RdPlatformMockService {
  // -- Stats ----------------------------------------------------------------

  static async getStats(organizationIds?: string[]): Promise<RdStats> {
    seedIfEmpty();
    await delay();
    let reqs = readData<Requirement>(STORAGE_REQUIREMENTS);
    let bugs = readData<Bug>(STORAGE_BUGS);
    let tasks = readData<Task>(STORAGE_TASKS);
    const nowStr = new Date().toISOString().slice(0, 10);

    if (organizationIds && organizationIds.length > 0) {
      reqs = reqs.filter((r) => organizationIds.includes(r.organizationId));
      bugs = bugs.filter((b) => organizationIds.includes(b.organizationId));
      tasks = tasks.filter((t) => organizationIds.includes(t.organizationId));
    }

    return {
      totalRequirements: reqs.length,
      openRequirements: reqs.filter((r) => r.status !== "done" && r.status !== "closed").length,
      totalBugs: bugs.length,
      unresolvedBugs: bugs.filter((b) => b.status !== "verified" && b.status !== "closed").length,
      totalTasks: tasks.length,
      overdueTasks: tasks.filter((t) => t.deadline && t.deadline < nowStr && t.status !== "done" && t.status !== "closed").length,
    };
  }

  // -- Requirements ---------------------------------------------------------

  static async getRequirements(filters: Partial<RequirementFilters> = {}): Promise<PaginatedResponse<Requirement>> {
    seedIfEmpty();
    await delay();
    let data = readData<Requirement>(STORAGE_REQUIREMENTS);

    const { search = "", status = "", priority = "", page = 1, pageSize = PAGE_SIZE, organizationIds } = filters;

    if (organizationIds && organizationIds.length > 0) {
      data = data.filter((r) => organizationIds.includes(r.organizationId));
    }
    if (search) {
      const kw = search.toLowerCase();
      data = data.filter(
        (r) => r.title.toLowerCase().includes(kw) || r.description.toLowerCase().includes(kw) || r.creator.toLowerCase().includes(kw),
      );
    }
    if (status) data = data.filter((r) => r.status === status);
    if (priority) data = data.filter((r) => r.priority === priority);

    // Sort by createdAt desc
    data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = data.length;
    const start = (page - 1) * pageSize;
    return { data: data.slice(start, start + pageSize), total };
  }

  static async getRequirementById(id: string): Promise<Requirement | null> {
    seedIfEmpty();
    await delay(80);
    const data = readData<Requirement>(STORAGE_REQUIREMENTS);
    return data.find((r) => r.id === id) ?? null;
  }

  static async createRequirement(params: Omit<Requirement, "id" | "createdAt" | "updatedAt">): Promise<Requirement> {
    seedIfEmpty();
    await delay();
    const data = readData<Requirement>(STORAGE_REQUIREMENTS);
    const item: Requirement = { ...params, id: generateId(), createdAt: now(), updatedAt: now() };
    data.unshift(item);
    writeData(STORAGE_REQUIREMENTS, data);
    return item;
  }

  static async updateRequirement(
    id: string,
    params: Partial<Omit<Requirement, "id" | "createdAt" | "updatedAt">>,
  ): Promise<Requirement | null> {
    await delay();
    const data = readData<Requirement>(STORAGE_REQUIREMENTS);
    const idx = data.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    data[idx] = { ...data[idx], ...params, updatedAt: now() };
    writeData(STORAGE_REQUIREMENTS, data);
    return data[idx];
  }

  static async deleteRequirement(id: string): Promise<boolean> {
    await delay();
    const data = readData<Requirement>(STORAGE_REQUIREMENTS);
    const filtered = data.filter((r) => r.id !== id);
    if (filtered.length === data.length) return false;
    writeData(STORAGE_REQUIREMENTS, filtered);
    return true;
  }

  // -- Bugs -----------------------------------------------------------------

  static async getBugs(filters: Partial<BugFilters> = {}): Promise<PaginatedResponse<Bug>> {
    seedIfEmpty();
    await delay();
    let data = readData<Bug>(STORAGE_BUGS);

    const { search = "", status = "", severity = "", priority = "", page = 1, pageSize = PAGE_SIZE, organizationIds } = filters;

    if (organizationIds && organizationIds.length > 0) {
      data = data.filter((b) => organizationIds.includes(b.organizationId));
    }
    if (search) {
      const kw = search.toLowerCase();
      data = data.filter(
        (b) => b.title.toLowerCase().includes(kw) || b.description.toLowerCase().includes(kw) || b.creator.toLowerCase().includes(kw),
      );
    }
    if (status) data = data.filter((b) => b.status === status);
    if (severity) data = data.filter((b) => b.severity === severity);
    if (priority) data = data.filter((b) => b.priority === priority);

    data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = data.length;
    const start = (page - 1) * pageSize;
    return { data: data.slice(start, start + pageSize), total };
  }

  static async getBugById(id: string): Promise<Bug | null> {
    seedIfEmpty();
    await delay(80);
    const data = readData<Bug>(STORAGE_BUGS);
    return data.find((b) => b.id === id) ?? null;
  }

  static async createBug(params: Omit<Bug, "id" | "createdAt" | "updatedAt">): Promise<Bug> {
    seedIfEmpty();
    await delay();
    const data = readData<Bug>(STORAGE_BUGS);
    const item: Bug = { ...params, id: generateId(), createdAt: now(), updatedAt: now() };
    data.unshift(item);
    writeData(STORAGE_BUGS, data);
    return item;
  }

  static async updateBug(id: string, params: Partial<Omit<Bug, "id" | "createdAt" | "updatedAt">>): Promise<Bug | null> {
    await delay();
    const data = readData<Bug>(STORAGE_BUGS);
    const idx = data.findIndex((b) => b.id === id);
    if (idx === -1) return null;
    data[idx] = { ...data[idx], ...params, updatedAt: now() };
    writeData(STORAGE_BUGS, data);
    return data[idx];
  }

  static async deleteBug(id: string): Promise<boolean> {
    await delay();
    const data = readData<Bug>(STORAGE_BUGS);
    const filtered = data.filter((b) => b.id !== id);
    if (filtered.length === data.length) return false;
    writeData(STORAGE_BUGS, filtered);
    return true;
  }

  // -- Tasks ----------------------------------------------------------------

  static async getTasks(filters: Partial<TaskFilters> = {}): Promise<PaginatedResponse<Task>> {
    seedIfEmpty();
    await delay();
    let data = readData<Task>(STORAGE_TASKS);

    const { search = "", status = "", priority = "", assignee = "", page = 1, pageSize = PAGE_SIZE, organizationIds } = filters;

    if (organizationIds && organizationIds.length > 0) {
      data = data.filter((t) => organizationIds.includes(t.organizationId));
    }
    if (search) {
      const kw = search.toLowerCase();
      data = data.filter((t) => t.title.toLowerCase().includes(kw) || t.description.toLowerCase().includes(kw));
    }
    if (status) data = data.filter((t) => t.status === status);
    if (priority) data = data.filter((t) => t.priority === priority);
    if (assignee) data = data.filter((t) => t.assignee.toLowerCase().includes(assignee.toLowerCase()));

    data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = data.length;
    const start = (page - 1) * pageSize;
    return { data: data.slice(start, start + pageSize), total };
  }

  static async getTaskById(id: string): Promise<Task | null> {
    seedIfEmpty();
    await delay(80);
    const data = readData<Task>(STORAGE_TASKS);
    return data.find((t) => t.id === id) ?? null;
  }

  static async createTask(params: Omit<Task, "id" | "createdAt" | "updatedAt">): Promise<Task> {
    seedIfEmpty();
    await delay();
    const data = readData<Task>(STORAGE_TASKS);
    const item: Task = { ...params, id: generateId(), createdAt: now(), updatedAt: now() };
    data.unshift(item);
    writeData(STORAGE_TASKS, data);
    return item;
  }

  static async updateTask(id: string, params: Partial<Omit<Task, "id" | "createdAt" | "updatedAt">>): Promise<Task | null> {
    await delay();
    const data = readData<Task>(STORAGE_TASKS);
    const idx = data.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    data[idx] = { ...data[idx], ...params, updatedAt: now() };
    writeData(STORAGE_TASKS, data);
    return data[idx];
  }

  static async deleteTask(id: string): Promise<boolean> {
    await delay();
    const data = readData<Task>(STORAGE_TASKS);
    const filtered = data.filter((t) => t.id !== id);
    if (filtered.length === data.length) return false;
    writeData(STORAGE_TASKS, filtered);
    return true;
  }
}

export default RdPlatformMockService;
