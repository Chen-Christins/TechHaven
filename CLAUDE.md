# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 常用命令

```bash
npm run dev          # 启动 Vite 开发服务器
npm run build        # TypeScript 类型检查 (tsc -b) + Vite 生产构建
npm run preview      # 本地预览 dist/
npm run lint         # ESLint 检查
npm run lint:fix     # ESLint 自动修复 src/ 下文件
npm run format       # Prettier 格式化 src/ 下所有文件
```

## 架构概览

### Provider 嵌套层级（App.tsx）

```
BrowserRouter → ThemeProvider → AuthProvider → LayoutWidthProvider → SiteSettingsProvider
  → MessageProvider → ConfirmProvider → SimpleBar → RouterConfig
```

顺序很重要：AuthProvider 必须在 ThemeProvider 之后（主题可能影响登录页样式），Message/Confirm 在最内层（它们的命令式 API 需要包裹业务路由）。

### 认证与 HTTP 层

- Token 使用**内存存储**（`TokenManager` 类，见 `src/utils/http.ts`），不使用 localStorage/Cookie 直接读写，避免 XSS 风险
- Token 来源：登录时从响应的 `Set-Cookie` header 中提取 `S_TOKEN`，或从 `document.cookie` 回退读取
- 所有 API 请求通过 `src/utils/http.ts` 的 `http` 实例发送，拦截器自动附加 `Authorization: Bearer <token>` header
- 后端返回统一结构 `{ code, data, message/msg, success }`，响应拦截器做了完整的业务状态码映射（400-504 均有中文错误提示）
- API Service 层位于 `src/services/`，每个 service 文件封装一类业务接口

### WebSocket 连接管理

- WebSocket 客户端封装在 `src/utils/websocket.ts`（`WebSocketClient` 类），支持自动重连（指数退避，最多 50 次，最长间隔 30s）、消息类型分发、Cookie 鉴权
- 通知 WebSocket 是全局单例 `notificationWS`，**连接生命周期绑定在 AuthContext 中** — 登录成功自动 connect，登出自动 disconnect，不会随路由切换重连
- WebSocket 路径通过 `VITE_WS_URL` 环境变量配置

### 路由结构

- 路由集中在 `src/router/RouterConfig.tsx`
- `/auth` 和 `/admin/*` 不受 `MaintenanceGuard` 限制（管理员需登录后台关闭维护模式）
- 其他所有页面路由被 `<MaintenanceGuard>` 包裹，维护模式下非管理员用户看到维护页面
- 测试路由使用 `import.meta.env.DEV` 条件包裹，仅开发环境可见

### 组件库

- **不使用 antd 原生组件**。项目在 `src/components/` 下构建了完整的自定义 UI 组件库，全部使用 CSS Modules 样式
- 包含：Button, Input, DatePicker, Selector, SearchBox, Switch, Radio/RadioGroup, Modal, Loading, Skeleton, Avatar, TagPanel, Navbar, Footer 等
- `message` 和 `confirm` 支持命令式调用（`message.success()`、`confirm()`），分别由 `MessageProvider` 和 `ConfirmProvider` 支持
- 实现 UI 时优先查找并使用已有组件，该规则已收录在 SKILL `/use-existing-components` 中

### 组件开发流程

新建或修改组件时，严格按以下流程：

1. 在 `src/sample/` 下写测试页面，挂载到 `RouterConfig.tsx` 用 `import.meta.env.DEV` 包裹
2. 用户在浏览器确认视觉效果和交互正确
3. 集成到正式业务页面
4. 执行 `npm run build` 确保无编译错误，再执行 `npm run format` 统一格式

### Vite 代理配置

`vite.config.ts` 中配置了三条代理规则（按优先级）：

| 路径匹配 | 目标 | 说明 |
|---------|------|------|
| `^/api/v1/article/ai-summary` | `apiTarget` | SSE 流式端点，timeout 120s，不缓冲 |
| `^/api/v1` | `apiTarget` | 通用 API 代理 |
| `^/file(.*)` | `apiTarget` | 文件上传/下载代理，timeout 100s，禁用 agent |

代理目标由 `VITE_API_BASE_URL` 环境变量控制，默认 `http://127.0.0.1:8088`。

### 主题与布局

- `ThemeContext`：浅色/深色主题切换，使用 `data-theme` 属性挂载在 `<html>` 上，通过 CSS 变量驱动
- `LayoutWidthContext`：页面宽度模式（default/wide/full），使用 `data-width-mode` 属性挂载在 `<html>` 上
- 两者均持久化到 localStorage，检测系统偏好作为默认值

### 样式方案

- 全局使用 CSS Modules（`*.module.css`），组件与样式文件同目录
- 主题变量通过 CSS 自定义属性（`var(--xxx)`）在 `:root` 和 `[data-theme="dark"]` 下定义
