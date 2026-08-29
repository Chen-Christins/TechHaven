# TechHaven

[English](README.en.md)

TechHaven 是一个面向技术团队的知识与协作平台前端，将技术博客、社区互动、组织协作和轻量研发管理整合在同一个应用中。

用户可以发布和阅读技术文章、参与评论互动，并在组织内管理需求、缺陷、任务、作业和 GitHub Pull Request 数据。平台还提供个人中心、实时通知、研发趋势分析和管理后台，用于连接知识沉淀与研发执行。

> 本仓库仅包含 Web 前端，运行完整功能需要配套的 HTTP API、文件服务和 WebSocket 服务。

## 核心功能

### 技术博客

- 首页文章流，支持关键词搜索、标签筛选、分类筛选和分页。
- Markdown 文章发布、编辑、实时预览和临时草稿恢复。
- 支持 GFM、代码高亮、KaTeX 数学公式和 Mermaid 图表。
- 文章目录提取、滚动定位和当前章节高亮。
- 基于 SSE 的流式 AI 摘要。
- 文章发布审核及后台内容管理。

## 架构与 Agent 集成

TechHaven 采用“模块化产品域 + Web BFF 逻辑边界 + Agent 控制面/执行面分离 + Ports & Adapters”。外壳和域数据归 TechHaven，dsh 是可替换 runner，SDK/MCP 是协议边界。

- 架构基线：`docs/ARCHITECTURE.md`（当前事实、目标边界、安全、数据、可观测性与测试）
- 推进计划：`docs/ROADMAP.md`（R0–R5、状态定义、退出门禁与指标）
- 决策记录：`docs/TH-RFC-001-agent-engine.md`（TH-RFC-001 v0.2）
- 数据层：`docs/agent-db/schema.sql`（agent 身份/日志/提案/语义/记忆）+ `docs/agent-db/seed-semantics.sql`（语义层种子数据）
- `services/techhaven-mcp/`：7 个工具（6 读 1 写）、scoped token、staged proposal、状态机、JSONL 审计与可选 PG 镜像；direct/staged mock smoke 为 9+11 项。
- `services/techhaven-gateway/`：runner adapter、HTTP/SSE、配额、看门狗、事件 JSONL 与 PG loader；mock driver smoke 为 22 项。
- 前端 `/test/agent-session-panel`：DEV 样例页。默认本地 mock；追加 `?driver=gateway` 经 Vite 代理接本机 Gateway（`services/techhaven-gateway`，mock 驱动引擎；鉴权头由代理注入，浏览器不持有网关 token）。客户端见 `src/services/agentGatewayClient.ts`，契约见 `contracts/`。

当前准确成熟度：Agent 工具面和控制面已 `implemented + verified-mock`；真实产品后端、live dsh、live PostgreSQL、前端真实接线和多租户沙箱尚未达到 `verified-integration`。禁止把 mock 冒烟表述为生产完成。

### 社区互动

- 文章和评论点赞。
- 树形评论、回复和评论编辑。
- 作者关注、粉丝列表和关注列表。
- 用户资料、个人文章和数据统计。
- 在线人数、实时通知和系统广播。

### 组织协作

- 组织列表、组织详情和组织创建申请。
- 组织成员、角色和加入申请管理。
- 组织任务与作业发布。
- 作业文件提交、上传进度和分片上传。
- 组织仓库信息及 GitHub Pull Request 数据入口。

### 研发工作台

- 研发仪表盘和待处理工作项汇总。
- 需求、缺陷和任务的创建、编辑、删除与详情管理。
- 我的工单和组织维度筛选。
- GitHub Pull Request 同步、查询及审查状态展示。
- 7 天和 30 天研发趋势分析。
- 基于登录状态、组织成员身份和组织角色的访问控制。

### 管理后台

- 用户、文章、评论、分类、作业和组织管理。
- 数据备份、导出和存储统计。
- 站点设置、维护模式和会话设置。
- 系统通知和广播管理。
- 用户反馈、FAQ 和帮助内容运营。

### 平台体验

- 明暗模式、主题皮肤、自定义光标和页面宽度切换。
- 响应式布局、骨架屏、空状态、错误状态和统一反馈组件。
- 维护模式守卫和空闲会话超时。
- 通知与在线状态 WebSocket 自动重连。

## 技术架构

| 分类       | 技术                                              |
| ---------- | ------------------------------------------------- |
| 应用框架   | React 19、TypeScript、Vite 8                      |
| 路由       | React Router 7                                    |
| 网络请求   | Axios、Fetch、SSE                                 |
| 实时通信   | WebSocket                                         |
| UI 与样式  | 自定义组件库、CSS Modules、CSS 自定义属性         |
| 内容渲染   | React Markdown、GFM、KaTeX、Mermaid、Highlight.js |
| 数据可视化 | ECharts                                           |
| 页面滚动   | SimpleBar                                         |
| 工程化     | TypeScript 严格模式、Prettier、GitHub Actions     |

业务页面优先复用 `src/components/` 中的自定义组件。虽然依赖中仍保留 `antd`，当前业务源码不直接使用其原生组件，也不应使用 antd 替代已有的项目组件。

## 环境要求

- Node.js `^20.19.0` 或 `>=22.12.0`
- npm
- 可访问的后端 HTTP API、文件服务和 WebSocket 服务

项目包含 `package-lock.json`，推荐使用 `npm ci` 安装锁定版本的依赖。

## 快速开始

```bash
git clone https://github.com/Chen-Christins/TechHaven.git
cd TechHaven
npm ci
npm run dev
```

启动后以 Vite 输出的本地地址为准。

Agent 子项目分别安装依赖和验证：

```bash
cd services/techhaven-mcp
npm ci && npm run typecheck && npm run smoke

cd ../techhaven-gateway
npm ci && npm run typecheck && npm run smoke
```

> R0 稳定基线已落地：根 `npm run build` / `npm test`（vitest）与两个 Agent 服务的 typecheck + smoke 均纳入 CI（`.github/workflows/ci.yml`）；`scripts/check-bundle-size.mjs` 检查主入口 gzip 体积预算。

## 环境变量

项目按 Vite 模式读取 `.env.development` 和 `.env.production`。

| 变量                       | 作用                                                      |
| -------------------------- | --------------------------------------------------------- |
| `VITE_API_BASE_URL`        | API 直连地址，或 Vite 开发代理的目标地址                  |
| `VITE_WS_URL`              | WebSocket 服务基础地址                                    |
| `VITE_USE_PROXY`           | 为字符串 `"true"` 时，HTTP 请求使用同源 `/api/v1`         |
| `VITE_REQUIRE_CREDENTIALS` | 为字符串 `"true"` 时，为 Axios 请求启用 `withCredentials` |

### 请求模式

- `VITE_USE_PROXY=true`：浏览器请求同源 `/api/v1`。开发环境由 Vite 转发，生产环境需要由 Nginx、网关或其他 Web 服务器提供对应的反向代理。
- `VITE_USE_PROXY=false`：Axios 直接使用 `VITE_API_BASE_URL`。
- Vite 开发代理覆盖 AI 摘要 SSE、通用 `/api/v1` 请求和 `/file` 文件服务。
- WebSocket 会在 `VITE_WS_URL` 后连接通知与在线状态端点。

所有 `VITE_*` 环境变量都会暴露给浏览器，禁止在其中保存密码、私钥、服务端密钥或其他敏感信息。本地覆盖配置可以放在被 Git 忽略的 `.env.local` 或 `.env.*.local` 中。

## 常用命令

| 命令              | 说明                                       |
| ----------------- | ------------------------------------------ |
| `npm run dev`     | 启动 Vite 开发服务器                       |
| `npm run build`   | 执行 `tsc --noEmit` 类型检查并构建生产产物 |
| `npm run preview` | 本地预览 `dist/` 构建产物                  |
| `npm run format`  | 使用 Prettier 格式化 `src/` 中支持的文件   |

当前仓库尚未配置自动化单元测试、端到端测试和 ESLint 脚本。`src/sample/` 用于组件的浏览器人工验证，不属于自动化测试。

## 项目结构

```text
TechHaven/
├─ .github/workflows/        # CI 构建检查与 tag 发布
├─ docs/                     # 部分页面的数据模型和接口契约
├─ public/                   # Logo、favicon 和主题光标资源
├─ src/
│  ├─ components/            # 通用 UI、布局及跨页面业务组件
│  ├─ contexts/              # 认证、主题、布局、站点设置和研发组织上下文
│  ├─ hooks/                 # AI 摘要、在线状态、空闲超时等 Hooks
│  ├─ pages/                 # 博客、组织、个人中心、研发平台和后台页面
│  ├─ router/                # 集中式路由配置
│  ├─ sample/                # 组件人工验证页面
│  ├─ services/              # 按业务域划分的 API Service
│  ├─ types/                 # 公共领域类型
│  ├─ utils/                 # HTTP、WebSocket、Cookie、错误码和 ID 工具
│  ├─ App.tsx                # Provider、应用外壳和全局运行时能力
│  └─ main.tsx               # React 应用入口
├─ CHANGELOG.md              # 版本变更记录
├─ AGENTS.md                 # 仓库开发约定
├─ package.json
└─ vite.config.ts
```

## 路由概览

路由集中定义在 `src/router/RouterConfig.tsx`。

| 路径                       | 功能                 | 访问说明                         |
| -------------------------- | -------------------- | -------------------------------- |
| `/index`                   | 首页文章流           | 公共页面                         |
| `/auth`                    | 登录、注册和找回密码 | 不受维护模式限制                 |
| `/article/*`               | 文章创建、编辑和详情 | 部分操作需要登录                 |
| `/personal`                | 个人中心             | 使用 `tab` 查询参数切换功能      |
| `/profile/:id`             | 用户资料             | 需要登录                         |
| `/organizations/list`      | 组织列表             | 页面内进行登录检查               |
| `/organization/detail/:id` | 组织详情             | 页面内进行登录检查               |
| `/assignment/*`            | 作业提交和提交详情   | 页面内进行登录检查               |
| `/rd/*`                    | 研发工作台           | 需要登录并通过组织权限检查       |
| `/admin/*`                 | 管理后台             | 需要管理员权限，不受维护模式限制 |
| `/help`                    | 帮助中心             | 公共页面                         |

除 `/auth` 和 `/admin/*` 外，其余路由受 `MaintenanceGuard` 保护。`/assignments` 会重定向到 `/personal?tab=assignments`。

开发环境还会挂载 `/messages`、`/test/*` 和 `/admin/media` 等演示或验证页面。

## 架构约定

### Provider

全局 Provider 的主要嵌套顺序为：

```text
BrowserRouter
└─ ThemeProvider
   └─ AuthProvider
      └─ LayoutWidthProvider
         └─ SiteSettingsProvider
            └─ MessageProvider
               └─ ConfirmProvider
```

研发平台在 `/rd` 布局内额外挂载 `RdOrgProvider`，用于管理当前组织和组织角色。

### 认证与存储

- 页面启动时从 `S_TOKEN` Cookie 恢复 Token。
- 运行期间由 `AuthContext` 和内存 `TokenManager` 管理 Token。
- Axios 请求拦截器自动附加 Bearer Token。
- Token、用户信息、角色和权限等敏感状态不得写入 `localStorage` 或 `sessionStorage`。
- 主题、布局、公开配置缓存和内容草稿等非敏感数据可以按需持久化。
- 所有前端权限判断只用于界面控制，后端仍必须执行实际权限校验。

### HTTP 与实时通信

- 普通业务 API 按领域封装在 `src/services/` 中，并复用 `src/utils/http.ts` 的 Axios 实例。
- HTTP 层统一处理业务 `errno`、动态错误码表、HTTP 错误和认证失效。
- AI 摘要使用原生 Fetch 读取 SSE 流。
- 通知和在线状态使用两个独立 WebSocket 连接，登录后连接、登出后断开，并支持自动重连。

### UI 开发

- 开发新界面前必须先检查并复用 `src/components/` 中的组件。
- 局部样式使用 CSS Modules，全局主题变量位于 `src/index.css` 和 `src/App.css`。
- 明暗主题由 `data-theme` 驱动，主题皮肤由 `data-skin` 驱动，页面宽度由 `data-width-mode` 驱动。
- 新组件先在 `src/sample/` 编写验证页面，并通过仅开发环境可见的路由进行浏览器确认。
- 完成修改后执行 `npm run build` 和 `npm run format`。

详细约定参见 [AGENTS.md](AGENTS.md) 和 [组件复用指南](.agents/skills/use-existing-components/SKILL.md)。

## 功能状态

以下页面或能力当前属于开发演示、部分接入或有限实现：

- 私信页面仅在开发环境开放，当前使用前端 Mock 会话数据。
- 收藏和账户安全中的部分能力仍为前端演示。
- 首页订阅组件尚未接入正式订阅服务，仅在开发环境显示。
- 后台媒体库仅在开发环境挂载。
- GitHub Pull Request 模块侧重数据同步、查询和审查状态展示，不包含完整的代码 Diff 审查、审批或合并流程。
- `docs/` 当前主要记录部分新增页面的数据模型与接口契约，不是覆盖全部业务域的完整 API 文档。

## CI 与发布

### 构建检查

推送到 `master` 或向 `master` 创建 Pull Request 时，GitHub Actions 会：

1. 使用 Node.js 20 安装依赖。
2. 执行 `npm run build`。
3. 检查 `dist/` 是否存在且非空。

### 版本发布

推送名称匹配 `v*` 的 Git tag 会触发版本发布：

1. 构建生产产物。
2. 将 `dist/` 上传到服务器的独立版本目录。
3. 通过软链接切换当前版本。
4. 保留最近 5 个 tag 版本。
5. 从 `CHANGELOG.md` 提取同名版本段落并创建 GitHub Release。

发布前应先在 `CHANGELOG.md` 中添加格式完全匹配的版本标题：

```markdown
## [v1.0.1] - 2026-08-31
```

版本以 `vX.Y.Z` Git tag 为发布依据。生产服务器还需要配置 React Router 的 SPA 回退、HTTP API、文件服务、SSE 和 WebSocket 反向代理。

## 相关文档

- [版本变更记录](CHANGELOG.md)
- [开发与仓库约定](AGENTS.md)
- [自定义组件复用指南](.agents/skills/use-existing-components/SKILL.md)
- [部分页面接口与数据协议](docs/README.md)

## License

本项目基于 [GNU Affero General Public License v3.0](LICENSE) 发布。

AGPL-3.0 允许使用、修改、分发及商业使用本项目，但分发修改版本或通过网络向用户提供修改版本时，必须按照许可证要求向相应用户提供完整对应源码，并保留版权及许可声明。

如需将本项目用于不适合遵循 AGPL-3.0 的闭源商业产品，请另行取得商业授权。
