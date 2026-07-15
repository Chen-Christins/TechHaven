export interface BlogArticle {
  id: string;
  title: string;
  summary: string;
  author: string;
  category: string;
  tags: string[];
  date: string;
  views: number;
  likes: number;
  cover?: string;
}

export const MOCK_ARTICLES: BlogArticle[] = [
  {
    id: "1",
    title: "深入理解 React 19 的并发渲染",
    summary: "从 useTransition 到 Suspense，剖析并发特性如何提升交互流畅度与感知性能。",
    author: "陈明",
    category: "前端",
    tags: ["React", "性能"],
    date: "2026-07-10",
    views: 1284,
    likes: 96,
  },
  {
    id: "2",
    title: "内存态 Token 认证：告别 localStorage",
    summary: "为什么敏感数据不该落地浏览器存储，以及如何用内存 + HttpOnly Cookie 构建安全认证。",
    author: "林悦",
    category: "安全",
    tags: ["认证", "安全"],
    date: "2026-07-06",
    views: 987,
    likes: 143,
  },
  {
    id: "3",
    title: "用 echarts 打造研发燃尽图",
    summary: "从数据建模到图表配置，手把手实现 Sprint 燃尽可视化。",
    author: "王磊",
    category: "可视化",
    tags: ["echarts", "研发"],
    date: "2026-07-02",
    views: 642,
    likes: 51,
  },
  {
    id: "4",
    title: "CSS Modules 与主题变量最佳实践",
    summary: "如何用 data-theme 驱动明暗主题，并保持组件样式隔离。",
    author: "赵天",
    category: "前端",
    tags: ["CSS", "样式"],
    date: "2026-06-28",
    views: 733,
    likes: 62,
  },
  {
    id: "5",
    title: "WebSocket 实时通知的重连与心跳",
    summary: "单例连接、指数退避重连与生命周期绑定的完整方案。",
    author: "陈明",
    category: "后端",
    tags: ["WebSocket", "实时"],
    date: "2026-06-20",
    views: 1102,
    likes: 88,
  },
  {
    id: "6",
    title: "Vite 8 构建优化实战",
    summary: "代码分割、依赖预构建与产物瘦身，让首屏更快。",
    author: "林悦",
    category: "工程化",
    tags: ["Vite", "性能"],
    date: "2026-05-30",
    views: 856,
    likes: 70,
  },
  {
    id: "7",
    title: "Markdown 渲染中的 XSS 防护",
    summary: "rehype-sanitize 与自定义组件如何兼顾富文本与安全。",
    author: "赵天",
    category: "安全",
    tags: ["Markdown", "安全"],
    date: "2026-05-18",
    views: 521,
    likes: 44,
  },
  {
    id: "8",
    title: "从零搭建组织协作模块",
    summary: "成员、角色、权限与申请流程的前端设计。",
    author: "王磊",
    category: "产品",
    tags: ["协作", "权限"],
    date: "2026-04-25",
    views: 690,
    likes: 55,
  },
];
