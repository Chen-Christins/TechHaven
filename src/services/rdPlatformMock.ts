// ============================================================
// R&D Platform Mock Data — 临时 mock 数据，后端接口就绪后替换
// ============================================================

import type { CodeReview, PaginatedResponse } from "../types/rdPlatform";

/** 模拟延迟 */
function delay(ms = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---- 模拟数据 ----

const now = Math.floor(Date.now() / 1000);
const day = 86400;

function ts(daysAgo: number): string {
  return new Date((now - daysAgo * day) * 1000).toISOString();
}

const mockReviews: CodeReview[] = [
  {
    id: "1",
    title: "用户认证模块重构代码审查",
    description:
      "本次重构将原有的 Session-based 认证迁移至 JWT Token 认证方案，涉及登录、注册、Token 刷新、中间件拦截等核心流程。请重点关注 Token 安全性、过期策略及错误处理。",
    status: "reviewing",
    priority: "high",
    author: "张明",
    authorAvatar: "https://picsum.photos/id/64/200",
    reviewer: "李强",
    reviewerAvatar: "https://picsum.photos/id/65/200",
    organizationId: "1",
    repository: "backend-auth",
    branch: "feature/jwt-refactor",
    commitHash: "a1b2c3d",
    filesChanged: 12,
    linesAdded: 450,
    linesDeleted: 320,
    createdAt: ts(2),
    updatedAt: ts(1),
  },
  {
    id: "2",
    title: "首页性能优化 PR",
    description:
      "针对首页加载慢的问题进行了以下优化：\n1. 图片懒加载\n2. 组件代码分割（React.lazy）\n3. API 请求合并\n4. CSS 关键路径提取\n\n预期首屏加载时间从 3.2s 降至 1.1s。",
    status: "approved",
    priority: "high",
    author: "王芳",
    authorAvatar: "https://picsum.photos/id/66/200",
    reviewer: "张明",
    reviewerAvatar: "https://picsum.photos/id/64/200",
    organizationId: "1",
    repository: "frontend-web",
    branch: "feature/home-perf",
    commitHash: "e4f5g6h",
    filesChanged: 8,
    linesAdded: 180,
    linesDeleted: 95,
    createdAt: ts(5),
    updatedAt: ts(3),
  },
  {
    id: "3",
    title: "修复订单金额计算精度问题",
    description:
      "订单金额在涉及多币种转换时出现浮点数精度误差，导致部分订单金额偏差 0.01 元。本次修复统一使用 decimal 库进行金额计算，并补充了相关单元测试。",
    status: "pending",
    priority: "high",
    author: "赵六",
    authorAvatar: "https://picsum.photos/id/67/200",
    reviewer: "李强",
    reviewerAvatar: "https://picsum.photos/id/65/200",
    organizationId: "1",
    repository: "backend-order",
    branch: "fix/amount-precision",
    commitHash: "i7j8k9l",
    filesChanged: 5,
    linesAdded: 120,
    linesDeleted: 80,
    createdAt: ts(1),
    updatedAt: ts(1),
  },
  {
    id: "4",
    title: "新增数据导出 CSV 功能",
    description: "为数据管理后台新增 CSV 批量导出功能，支持自定义字段选择和日期范围筛选，单次导出上限 10 万条记录。",
    status: "reviewing",
    priority: "medium",
    author: "陈丽",
    authorAvatar: "https://picsum.photos/id/68/200",
    reviewer: "王芳",
    reviewerAvatar: "https://picsum.photos/id/66/200",
    organizationId: "1",
    repository: "admin-dashboard",
    branch: "feature/csv-export",
    commitHash: "m0n1o2p",
    filesChanged: 6,
    linesAdded: 320,
    linesDeleted: 15,
    createdAt: ts(4),
    updatedAt: ts(2),
  },
  {
    id: "5",
    title: "消息通知模块 WebSocket 重连机制",
    description:
      "实现 WebSocket 断线自动重连，采用指数退避策略（初始 1s，最大 30s），支持页面可见性检测（页面隐藏时暂停重连，可见时恢复）。",
    status: "closed",
    priority: "medium",
    author: "李强",
    authorAvatar: "https://picsum.photos/id/65/200",
    reviewer: "张明",
    reviewerAvatar: "https://picsum.photos/id/64/200",
    organizationId: "1",
    repository: "frontend-web",
    branch: "feature/ws-reconnect",
    commitHash: "q3r4s5t",
    filesChanged: 3,
    linesAdded: 210,
    linesDeleted: 45,
    createdAt: ts(10),
    updatedAt: ts(7),
  },
  {
    id: "6",
    title: "数据库查询索引优化",
    description:
      "针对文章列表查询慢的问题，在 articles 表的 status、created_at、author_id 列上添加联合索引，并对全文搜索改用 pg_trgm 扩展。",
    status: "rejected",
    priority: "medium",
    author: "王芳",
    authorAvatar: "https://picsum.photos/id/66/200",
    reviewer: "赵六",
    reviewerAvatar: "https://picsum.photos/id/67/200",
    organizationId: "2",
    repository: "backend-api",
    branch: "perf/db-index",
    commitHash: "u6v7w8x",
    filesChanged: 2,
    linesAdded: 30,
    linesDeleted: 5,
    createdAt: ts(8),
    updatedAt: ts(6),
  },
  {
    id: "7",
    title: "单元测试覆盖率提升至 80%",
    description:
      "为 core 模块补充单元测试，覆盖率达到 80%。新增测试覆盖：用户服务、订单服务、权限校验中间件、工具函数。共计新增 156 个测试用例。",
    status: "reviewing",
    priority: "low",
    author: "张明",
    authorAvatar: "https://picsum.photos/id/64/200",
    reviewer: "陈丽",
    reviewerAvatar: "https://picsum.photos/id/68/200",
    organizationId: "2",
    repository: "backend-core",
    branch: "test/coverage-80",
    commitHash: "y9z0a1b",
    filesChanged: 25,
    linesAdded: 1890,
    linesDeleted: 30,
    createdAt: ts(3),
    updatedAt: ts(1),
  },
  {
    id: "8",
    title: "响应式布局适配移动端",
    description: "适配首页、文章列表、文章详情、个人中心等页面的移动端布局，采用 CSS Grid + Flexbox 方案，断点 768px。",
    status: "pending",
    priority: "low",
    author: "陈丽",
    authorAvatar: "https://picsum.photos/id/68/200",
    reviewer: "王芳",
    reviewerAvatar: "https://picsum.photos/id/66/200",
    organizationId: "2",
    repository: "frontend-web",
    branch: "feature/mobile-responsive",
    commitHash: "c2d3e4f",
    filesChanged: 18,
    linesAdded: 560,
    linesDeleted: 210,
    createdAt: ts(0),
    updatedAt: ts(0),
  },
  {
    id: "9",
    title: "API 限流中间件实现",
    description: "实现基于令牌桶算法的 API 限流中间件，支持按 IP、用户、接口路径三个维度限流，配置通过 etcd 动态下发。",
    status: "approved",
    priority: "high",
    author: "赵六",
    authorAvatar: "https://picsum.photos/id/67/200",
    reviewer: "李强",
    reviewerAvatar: "https://picsum.photos/id/65/200",
    organizationId: "1",
    repository: "backend-gateway",
    branch: "feature/rate-limiter",
    commitHash: "g5h6i7j",
    filesChanged: 7,
    linesAdded: 380,
    linesDeleted: 20,
    createdAt: ts(7),
    updatedAt: ts(4),
  },
  {
    id: "10",
    title: "暗色主题样式变量统一",
    description: "将项目中分散的暗色主题样式统一为 CSS 变量管理，修复了 15 处深色模式下对比度不足的问题。",
    status: "reviewing",
    priority: "low",
    author: "王芳",
    authorAvatar: "https://picsum.photos/id/66/200",
    reviewer: "张明",
    reviewerAvatar: "https://picsum.photos/id/64/200",
    organizationId: "1",
    repository: "frontend-web",
    branch: "fix/dark-theme",
    commitHash: "k8l9m0n",
    filesChanged: 22,
    linesAdded: 95,
    linesDeleted: 180,
    createdAt: ts(6),
    updatedAt: ts(5),
  },
  {
    id: "11",
    title: "登录安全加固：验证码 + 失败锁定",
    description: "登陆接口新增滑块验证码校验，连续失败 5 次锁定账号 30 分钟，同时记录登录日志并发送安全通知。",
    status: "pending",
    priority: "high",
    author: "李强",
    authorAvatar: "https://picsum.photos/id/65/200",
    reviewer: "赵六",
    reviewerAvatar: "https://picsum.photos/id/67/200",
    organizationId: "2",
    repository: "backend-auth",
    branch: "feature/login-security",
    commitHash: "o1p2q3r",
    filesChanged: 10,
    linesAdded: 420,
    linesDeleted: 55,
    createdAt: ts(0),
    updatedAt: ts(0),
  },
  {
    id: "12",
    title: "代码格式化规则同步到 ESLint",
    description:
      "将团队 Prettier 规则迁移至 ESLint flat config，避免两个工具规则冲突。同步更新了 47 个文件的格式，并添加 pre-commit hook。",
    status: "closed",
    priority: "low",
    author: "陈丽",
    authorAvatar: "https://picsum.photos/id/68/200",
    reviewer: "王芳",
    reviewerAvatar: "https://picsum.photos/id/66/200",
    organizationId: "2",
    repository: "frontend-web",
    branch: "chore/eslint-flat-config",
    commitHash: "s4t5u6v",
    filesChanged: 49,
    linesAdded: 230,
    linesDeleted: 410,
    createdAt: ts(15),
    updatedAt: ts(12),
  },
];

// ---- Mock Service ----

export class RdMockService {
  /** 获取代码审查列表（模拟） */
  static async getCodeReviews(params: {
    search?: string;
    status?: string;
    priority?: string;
    page?: number;
    pageSize?: number;
    organizationIds?: string[];
  }): Promise<PaginatedResponse<CodeReview>> {
    await delay(400);

    const { search = "", status = "", priority = "", page = 1, pageSize = 10, organizationIds } = params;

    let filtered = [...mockReviews];

    // 搜索过滤
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.author.toLowerCase().includes(q) ||
          r.reviewer.toLowerCase().includes(q) ||
          r.repository.toLowerCase().includes(q) ||
          r.branch.toLowerCase().includes(q) ||
          r.commitHash.toLowerCase().includes(q),
      );
    }

    // 状态过滤
    if (status) {
      filtered = filtered.filter((r) => r.status === status);
    }

    // 优先级过滤
    if (priority) {
      filtered = filtered.filter((r) => r.priority === priority);
    }

    // 组织过滤
    if (organizationIds && organizationIds.length > 0) {
      filtered = filtered.filter((r) => organizationIds.includes(r.organizationId));
    }

    // 分页
    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const data = filtered.slice(start, start + pageSize);

    return { data, total };
  }

  /** 获取代码审查详情（模拟） */
  static async getCodeReviewById(id: string): Promise<CodeReview | null> {
    await delay(200);
    return mockReviews.find((r) => r.id === id) || null;
  }

  /** 获取代码审查统计数据（模拟） */
  static async getReviewStats(organizationIds?: string[]): Promise<{ totalReviews: number; pendingReviews: number }> {
    await delay(200);
    let data = mockReviews;
    if (organizationIds && organizationIds.length > 0) {
      data = data.filter((r) => organizationIds.includes(r.organizationId));
    }
    return {
      totalReviews: data.length,
      pendingReviews: data.filter((r) => r.status === "pending").length,
    };
  }

  /** 创建代码审查（模拟） */
  static async createCodeReview(params: Omit<CodeReview, "id" | "createdAt" | "updatedAt">): Promise<CodeReview> {
    await delay(300);
    const newReview: CodeReview = {
      ...params,
      id: String(mockReviews.length + 1),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockReviews.unshift(newReview);
    return newReview;
  }

  /** 更新代码审查（模拟） */
  static async updateCodeReview(
    id: string,
    params: Partial<Omit<CodeReview, "id" | "createdAt" | "updatedAt">>,
  ): Promise<CodeReview | null> {
    await delay(300);
    const idx = mockReviews.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    mockReviews[idx] = { ...mockReviews[idx], ...params, updatedAt: new Date().toISOString() };
    return mockReviews[idx];
  }

  /** 删除代码审查（模拟） */
  static async deleteCodeReview(id: string): Promise<boolean> {
    await delay(200);
    const idx = mockReviews.findIndex((r) => r.id === id);
    if (idx === -1) return false;
    mockReviews.splice(idx, 1);
    return true;
  }
}

export default RdMockService;
