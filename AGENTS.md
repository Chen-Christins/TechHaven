# AGENTS.md

本项目为 React 19 + TypeScript + Vite 博客前端，使用 CSS Modules 样式方案，拥有完整的自定义 UI 组件库。

## 开发原则

### 1. 组件优先复用
实现任何 UI 时，**必须优先使用 `src/components/` 下已封装的自定义组件**，禁止使用 antd 原生组件或手写原生 HTML 元素替代。完整组件清单和使用指南见 `.claude/skills/use-existing-components/SKILL.md`。

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
npm run build   # tsc -b + vite build，修复所有错误
npm run format  # Prettier 格式化
```

## 项目架构要点

- **Provider 嵌套顺序**：BrowserRouter → Theme → Auth → LayoutWidth → SiteSettings → Message → Confirm
- **Token 认证**：从 Cookie 提取 S_TOKEN，存于内存 TokenManager，HTTP 拦截器自动附加 Bearer header
- **WebSocket**：`notificationWS` 单例，生命周期绑定 AuthContext（登录连/登出断），支持自动重连
- **路由**：`/auth` 和 `/admin/*` 免维护模式守卫，其余路由受 `MaintenanceGuard` 保护
- **样式**：CSS Modules + CSS 自定义属性（`data-theme` 驱动明暗主题，`data-width-mode` 驱动页面宽度）
- **HTTP**：`src/utils/http.ts` 封装，拦截器做了完整的中文业务状态码映射
