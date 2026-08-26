export interface ProductPackage {
  id: string;
  name: string;
  description: string;
  category: string;
  techStack: string[];
  version: string;
  link: string;
  users: number;
}

export const MOCK_PRODUCTS: ProductPackage[] = [
  {
    id: "1",
    name: "TechHaven CLI",
    description: "面向技术团队的博客与研发平台命令行工具，支持文章发布、工单管理与 CI 集成。",
    category: "工具",
    techStack: ["Node.js", "TypeScript", "commander"],
    version: "v2.4.1",
    link: "https://github.com/techhaven/cli",
    users: 1284,
  },
  {
    id: "2",
    name: "Token 认证 SDK",
    description: "内存态 Token + HttpOnly Cookie 的前端认证套件，杜绝敏感数据落地浏览器存储。",
    category: "SDK",
    techStack: ["TypeScript", "axios", "Cookie"],
    version: "v1.8.0",
    link: "https://github.com/techhaven/auth-sdk",
    users: 867,
  },
  {
    id: "3",
    name: "实时通知 WebSocket 客户端",
    description: "单例连接、指数退避重连与心跳保活的实时通知客户端，绑定登录生命周期。",
    category: "SDK",
    techStack: ["WebSocket", "TypeScript"],
    version: "v1.2.3",
    link: "https://github.com/techhaven/ws-client",
    users: 542,
  },
  {
    id: "4",
    name: "分片上传组件",
    description: "支持断点续传与并发控制的大文件分片上传 React 组件，可无缝嵌入任意表单。",
    category: "插件",
    techStack: ["React", "TypeScript", "CSS Modules"],
    version: "v0.9.7",
    link: "https://github.com/techhaven/chunk-upload",
    users: 319,
  },
  {
    id: "5",
    name: "研发燃尽图可视化",
    description: "基于 ECharts 的 Sprint 燃尽图与趋势分析面板，为研发平台提供数据洞察。",
    category: "工具",
    techStack: ["React", "ECharts"],
    version: "v0.6.0-beta",
    link: "https://github.com/techhaven/burndown",
    users: 176,
  },
  {
    id: "6",
    name: "AI 摘要流式渲染",
    description: "基于 SSE 的文章 AI 摘要组件，支持流式输出与 markdown 安全渲染。",
    category: "插件",
    techStack: ["React", "SSE", "rehype-sanitize"],
    version: "v0.4.2",
    link: "https://github.com/techhaven/ai-summary",
    users: 98,
  },
  {
    id: "7",
    name: "组织协作模块",
    description: "成员、角色、权限与申请流程的完整前端组织协作解决方案。",
    category: "平台",
    techStack: ["React", "TypeScript"],
    version: "v1.0.0",
    link: "https://github.com/techhaven/org-collab",
    users: 402,
  },
  {
    id: "8",
    name: "明暗主题引擎",
    description: "基于 CSS 自定义属性与 data-theme 的主题切换引擎，支持运行时无闪烁切换。",
    category: "工具",
    techStack: ["CSS", "TypeScript"],
    version: "v1.1.0",
    link: "https://github.com/techhaven/theme-engine",
    users: 655,
  },
];
