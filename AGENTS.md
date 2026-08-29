# AGENTS.md

本项目为 React 19 + TypeScript + Vite 博客前端，使用 CSS Modules 样式方案，拥有完整的自定义 UI 组件库。

## 开发原则

### 1. 组件优先复用
实现任何 UI 时，**必须优先使用 `src/components/` 下已封装的自定义组件**，禁止使用 antd 原生组件或手写原生 HTML 元素替代。完整组件清单和使用指南见 `.agents/skills/use-existing-components/SKILL.md`。

### 2. 数据存储：内存优先
- **敏感数据**（token、用户信息、权限标识）必须使用内存存储，**禁止**使用 `localStorage`/`sessionStorage`，防止用户篡改
- **非敏感配置**（主题偏好、布局宽度）方可例外使用 `localStorage`
- 参考：`src/utils/http.ts` 中的 `TokenManager`（内存存储）vs `ThemeContext`（localStorage 例外）

### 3. 组件开发流程
```
编写测试页面(src/sample/) → 路由 DEV 挂载 → 用户浏览器确认 → 集成业务界面 → npm run build → npm run format
```

### 4. 代码收尾
每次修改完成后必须执行：
```bash
npm run build   # tsc --noEmit + vite build，修复所有错误
npm run format  # Prettier 格式化
```

## 项目架构要点

- **Provider 嵌套顺序**：BrowserRouter → Theme → Auth → LayoutWidth → SiteSettings → Message → Confirm
- **Token 认证**：从 Cookie 提取 S_TOKEN，存于内存 TokenManager，HTTP 拦截器自动附加 Bearer header
- **WebSocket**：`notificationWS` 单例，生命周期绑定 AuthContext（登录连/登出断），支持自动重连
- **路由**：`/auth` 和 `/admin/*` 免维护模式守卫，其余路由受 `MaintenanceGuard` 保护
- **样式**：CSS Modules + CSS 自定义属性（`data-theme` 驱动明暗主题，`data-width-mode` 驱动页面宽度）
- **HTTP**：`src/utils/http.ts` 封装，拦截器做了完整的中文业务状态码映射

## 架构与状态文档

- 开始跨模块改动前先读 `docs/ARCHITECTURE.md`；Agent 相关改动还必须读 `docs/TH-RFC-001-agent-engine.md` 和 `docs/ROADMAP.md`。
- 状态只能使用：`planned`、`implemented`、`verified-mock`、`verified-integration`、`pilot`、`production`。
- mock 冒烟、静态类型检查、Vite 单独打包或静态 SQL 核对，不得描述为真实集成或生产完成。
- 产品域状态机以域后端为权威；前端/MCP 的规则只能作为 fail-closed 前置校验，必须通过 contract test 防漂移。
- Agent 写操作以服务端 policy/proposal 为权威；MCP annotations 和模型提示不能替代授权。

## 分层验证

- 根 SPA：`npm run build` + `npm test`（vitest：Mermaid 安全回归 / HTTP 1101 状态同步）。
- MCP：在 `services/techhaven-mcp` 执行 `npm run typecheck && npm run smoke`。
- Gateway：在 `services/techhaven-gateway` 执行 `npm run typecheck && npm run smoke`。
- 只有与真实后端、live dsh 或 live PostgreSQL 实跑后，才能把相应能力提升为 `verified-integration`。
