# TechHaven

[English](README.en.md)

TechHaven 是一个“写作 + 研发”一体化平台。本仓库包含 React 前端，以及可独立部署的 Agent Gateway、MCP 工具服务和旧后端兼容层；现有产品后端及其 MySQL 数据库保持不变，不在本仓库内。

TechHaven 是一个面向技术团队的知识与协作平台前端，将技术博客、社区互动、组织协作和轻量研发管理整合在同一个应用中。

用户可以发布和阅读技术文章、参与评论互动，并在组织内管理需求、缺陷、任务、作业和 GitHub Pull Request 数据。平台还提供个人中心、实时通知、研发趋势分析和管理后台，用于连接知识沉淀与研发执行。

> 产品后端、MySQL、文件服务和 WebSocket 服务不在本仓库内；完整运行仍需要这些既有服务。

## 核心功能

### 技术博客

- 首页文章流，支持关键词搜索、标签筛选、分类筛选和分页。
- Markdown 文章发布、编辑、实时预览和临时草稿恢复。
- 支持 GFM、代码高亮、KaTeX 数学公式和 Mermaid 图表。
- 文章目录提取、滚动定位和当前章节高亮。
- 基于 SSE 的流式 AI 摘要。
- 文章发布审核及后台内容管理。

> 项目还封装了完整的自定义 UI 组件库（`src/components/`），业务开发时应优先复用现有组件与 CSS 变量。

## 架构与 Agent 集成

TechHaven 采用“模块化产品域 + Web BFF 边界 + Agent 控制面/执行面分离 + Ports & Adapters”。产品后端和 MySQL 继续拥有业务数据；dsh 是可替换 runner；MCP 暴露 Agent 工具；独立 Bridge 隔离旧 HTTP 契约。

```text
浏览器
  │ 同源 HTTP/SSE（浏览器只持用户会话，不持服务密钥）
  ▼
Web BFF / Nginx
  ├──────────────────────────────► 旧产品后端 ──► MySQL
  │ /gateway/*
  ▼
Agent Gateway ──► dsh runner ──MCP stdio──► techhaven-mcp
                                                │ 内部 Bearer + session/org
                                                ▼
                                      techhaven-agent-bridge
                                                │ 旧 Bearer/Cookie + /rd/*
                                                └────────────► 旧产品后端
```

Agent 写入链路为：前端请求会话 → Gateway 驱动 dsh → agent 调 MCP 工具 → MCP 校验 token/scope/状态机并按策略 direct 或创建 proposal → 获批的写调用进入 Bridge → Bridge 做旧状态映射、幂等台账、一次写入和写后读取确认 → 旧后端写 MySQL。浏览器不直连 MCP 或 Bridge，Bridge 也不直连 MySQL。

| 组件                     | 职责                                                       | 不负责                               |
| ------------------------ | ---------------------------------------------------------- | ------------------------------------ |
| React SPA                | 产品 UI、Agent 会话 UI、SSE 消费                           | 保存服务 token、执行 Agent 工具      |
| Web BFF / Nginx          | 同源入口、用户认证、向 Gateway 注入服务身份                | Agent 推理和旧协议转换               |
| `techhaven-gateway`      | 会话、事件、配额、proposal 决策入口、runner adapter        | 产品域数据和旧后端适配               |
| dsh runner               | 模型循环与 MCP 调用                                        | 产品授权的最终裁决                   |
| `techhaven-mcp`          | Agent token/scope、工具 schema、状态机预检、审计、proposal | 保存旧后端 Cookie、访问 MySQL        |
| `techhaven-agent-bridge` | 旧 API 路径/字段/状态/认证转换、写入幂等与对账             | 模型推理、前端认证、产品数据库所有权 |
| 旧产品后端 + MySQL       | 业务权限、权威状态机、产品数据持久化                       | Agent 会话与模型执行                 |

- 架构基线：`docs/ARCHITECTURE.md`（当前事实、目标边界、安全、数据、可观测性与测试）
- 推进计划：`docs/ROADMAP.md`（R0–R5、状态定义、退出门禁与指标）
- 决策记录：`docs/TH-RFC-001-agent-engine.md`（TH-RFC-001 v0.2）
- 数据层：`docs/agent-db/schema.sql`（schema v0.3）+ v0.2→v0.3 migration + 语义层种子数据。
- `services/techhaven-mcp/`：7 个工具、scoped token、staged proposal、JSONL/PG 可切换权威 repository；direct/staged/HTTP contract smoke 为 9+11+6 项，另有环境门控 PG 并发 smoke。
- `services/techhaven-agent-bridge/`：独立旧后端兼容层；规范化读接口、状态映射、内部身份、JSONL 幂等台账和写后对账。当前只支持单实例，真实旧后端尚待联调。
- `services/techhaven-gateway/`：runner adapter、HTTP/SSE、配额、proposal 决策、JSONL/PG session-event 权威、loader 与 reconcile；mock driver smoke 为 41 项，另有环境门控 PG 恢复 smoke。
- Gateway 可选通过内部服务身份按可信用户读取 AI 配置，并为每个 dsh 会话注入隔离的 provider/model/凭据环境；配置不进入浏览器、会话响应、日志或 JSONL。产品后端内部读取端点与 live dsh 仍需在测试环境联调。
- 前端 Agent 助手：开发、测试和生产环境统一通过研发平台 `/rd/agent` 入口访问。页面内可切换本地 mock 与 Gateway 联调模式，也可打开“API 配置”，分别选择 OpenAI、Anthropic、智谱 AI 或自定义兼容服务，以及 Responses、Chat Completions 或 Messages 接口类型；配置通过 `/user/ai-config` 交由站点后端保存，不写入浏览器存储。Gateway 经同源代理连接（鉴权头由代理注入，浏览器不持有网关 token）。活动 SID 在单标签页会话内做轻量检查点，刷新后查询同一会话并全量回放 UI；同页网络断线则按 `after=<lastSeq>` 增量续传。客户端见 `src/services/agentGatewayClient.ts`，契约见 `contracts/`。

当前准确成熟度：Agent 工具面、控制面、兼容层和 Agent 面板已 `implemented`，其中离线测试通过的部分标记为 `verified-mock`；PG 权威、并发锁、迁移/对账/live smoke 为 `implemented`。浏览器 mock runner 链路已实测；Bridge 与真实旧后端、live dsh、live PostgreSQL 和多租户沙箱尚未达到 `verified-integration`。禁止把编译或 mock 冒烟表述为生产完成。

### feature/agent-engine 提交边界

该分支提交完整的前端改进、共享契约、MCP/Gateway 服务、数据库 schema/migration、离线测试与说明文档。以下内容不进入版本库：本地未跟踪的 Agent/助手状态、构建产物、日志、依赖目录、运行态 JSONL/数据库凭据及发布检查日志；仓库已有的 `AGENTS.md`、`CLAUDE.md` 与组件复用 Skill 继续保留。开发代理令牌使用不带 `VITE_` 前缀的 `TECHHAVEN_GATEWAY_PROXY_TOKEN`，只由 Vite 配置进程注入代理请求头，不属于客户端环境变量。

本次分支可通过无外部依赖的 build、unit test 与 mock/contract smoke 作为提交门禁；`smoke:pg`、真实 dsh 和带 service identity 的产品域联调必须在具备对应运行时与凭据的测试环境单独执行。该分支不是生产部署完成声明。

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
npm run build      # tsc 类型检查 + vite 生产构建
npm run preview    # 本地预览 dist/
npm test           # vitest 单测（Mermaid、鉴权脱敏、Gateway client 等回归）
npm run format     # Prettier 格式化 src/
```

启动后以 Vite 输出的本地地址为准。

Agent 子项目分别安装依赖和验证：

```bash
cd services/techhaven-mcp
npm ci && npm run typecheck && npm test && npm run smoke

cd ../techhaven-gateway
npm ci && npm run typecheck && npm test && npm run smoke

cd ../techhaven-agent-bridge
npm ci && npm run typecheck && npm test && npm run smoke
```

三个服务的 `npm test` 是纯域/adapter 单测（Node 内置 `node:test` + `tsx`，无需外部实例）；
`npm run smoke` 是 mock/离线的端到端冒烟。PG 相关门禁（`smoke:pg`）另需 `TECHHAVEN_TEST_DB_URL`。

> R0 稳定基线已落地：根 `npm run build` / `npm test`（vitest）与三个 Agent 服务的 typecheck + test + smoke 均纳入 CI（`.github/workflows/ci.yml`）；`scripts/check-bundle-size.mjs` 检查主入口 gzip 体积预算。

## 环境变量

配置按进程隔离。只有 `VITE_*` 会进入浏览器 bundle；所有 `TECHHAVEN_*TOKEN`、Cookie、数据库 URL 和模型 API key 都只能注入服务端进程。各子服务的可复制模板见其 `.env.example`。

### 前端与开发代理

| 环境变量                        | 默认/示例                   | 说明                                                                                     |
| ------------------------------- | --------------------------- | ---------------------------------------------------------------------------------------- |
| `VITE_API_BASE_URL`             | `https://techhaven.website` | 产品后端基址；不走代理时用于浏览器请求                                                   |
| `VITE_WS_URL`                   | `wss://techhaven.website`   | 产品通知 WebSocket 地址                                                                  |
| `VITE_USE_PROXY`                | `true`                      | 开发模式用 Vite `/api` 代理；生产静态站点不存在 Vite 代理，必须由 Nginx/BFF 实现同样路由 |
| `VITE_REQUIRE_CREDENTIALS`      | `false`                     | axios 是否发送 Cookie credentials                                                        |
| `VITE_GATEWAY_URL`              | `http://127.0.0.1:3091`     | 仅 Vite 配置进程使用的 Gateway 目标                                                      |
| `TECHHAVEN_GATEWAY_PROXY_TOKEN` | 无                          | Vite 代理注入的 Gateway Bearer；没有 `VITE_` 前缀，不进入前端代码                        |
| `TECHHAVEN_GATEWAY_PROXY_ACTOR` | `user:1`                    | 开发代理注入的 `X-TechHaven-Actor`；只用于本地开发占位                                   |

### 请求模式

- `VITE_USE_PROXY=true`：浏览器请求同源 `/api/v1`。开发环境由 Vite 转发，生产环境需要由 Nginx、网关或其他 Web 服务器提供对应的反向代理。
- `VITE_USE_PROXY=false`：Axios 直接使用 `VITE_API_BASE_URL`。
- Vite 开发代理覆盖 AI 摘要 SSE、通用 `/api/v1` 请求和 `/file` 文件服务。
- WebSocket 会在 `VITE_WS_URL` 后连接通知与在线状态端点。

所有 `VITE_*` 环境变量都会暴露给浏览器，禁止在其中保存密码、私钥、服务端密钥或其他敏感信息。本地覆盖配置可以放在被 Git 忽略的 `.env.local` 或 `.env.*.local` 中。

### 开发代理路径

- `^/api/v1/article/ai-summary`：AI 摘要 SSE 流式端点（需置于通用规则之前）
- `^/gateway`：Agent Gateway；移除 `/gateway` 前缀并在代理侧注入 Bearer 头
- `^/api/v1`：通用 API
- `^/file(.*)`：文件服务

### Agent Gateway

模板见 `services/techhaven-gateway/.env.example`。

| 环境变量                                 | 必填条件           | 默认值                                   | 说明                                                 |
| ---------------------------------------- | ------------------ | ---------------------------------------- | ---------------------------------------------------- |
| `TECHHAVEN_GATEWAY_TOKEN`                | 是                 | 无                                       | BFF/Vite → Gateway Bearer；不得给浏览器              |
| `TECHHAVEN_GATEWAY_PORT`                 | 否                 | `3091`                                   | HTTP/SSE 端口                                        |
| `TECHHAVEN_ENGINE_DRIVER`                | 否                 | `mock`                                   | `mock` 或 `dsh`                                      |
| `TECHHAVEN_GATEWAY_DATA_DIR`             | 否                 | `./data`                                 | JSONL、审计或 PG 提交后 spool 目录                   |
| `TECHHAVEN_GATEWAY_STORE`                | 否                 | `jsonl`                                  | `jsonl` 单实例 PoC，或 `postgres` 权威模式           |
| `TECHHAVEN_GATEWAY_DB_URL`               | store=postgres     | 无                                       | Agent PostgreSQL 连接串，不是产品 MySQL              |
| `TECHHAVEN_GATEWAY_DB_SCHEMA`            | 否                 | `public`                                 | PG schema 名                                         |
| `TECHHAVEN_PROPOSALS_FILE`               | JSONL proposal     | `../techhaven-mcp/audit/proposals.jsonl` | 与 MCP 共享的 proposal 事件文件                      |
| `TECHHAVEN_MAX_SESSIONS_PER_ORG`         | 否                 | `3`                                      | 单组织活动会话配额                                   |
| `TECHHAVEN_SESSION_RETENTION_MINUTES`    | 否                 | `30`                                     | 终态会话保留时间                                     |
| `TECHHAVEN_SESSION_IDLE_TIMEOUT_MINUTES` | 否                 | `30`                                     | 活动态空闲超时                                       |
| `TECHHAVEN_DB_URL`                       | 仅 loader          | 无                                       | `npm run load` 的 PG 连接串，也可由 CLI `--url` 覆盖 |
| `TECHHAVEN_DSH_BIN`                      | driver=dsh         | 无                                       | dsh 可执行文件绝对路径                               |
| `TECHHAVEN_DSH_PROFILE`                  | driver=dsh         | 无                                       | Gateway 固定下发的 dsh profile                       |
| `TECHHAVEN_DSH_HOME`                     | driver=dsh         | 无                                       | dsh 工作区/缓存根                                    |
| `TECHHAVEN_AI_CONFIG_URL`                | 按用户配置时       | 无                                       | 产品后端内部 AI 配置读取端点；与 service token 成对  |
| `TECHHAVEN_AI_CONFIG_SERVICE_TOKEN`      | 按用户配置时       | 无                                       | Gateway 调内部读取端点的独立服务令牌                 |
| `TECHHAVEN_AI_CONFIG_TIMEOUT_MS`         | 否                 | `5000`                                   | 内部 AI 配置读取超时，范围 100~60000ms               |
| `TECHHAVEN_DSH_PROVIDER_OPENAI`          | 否                 | `openai`                                 | OpenAI 配置对应的 dsh provider route                 |
| `TECHHAVEN_DSH_PROVIDER_CLAUDE`          | 否                 | `anthropic`                              | Claude 配置对应的 dsh provider route                 |
| `TECHHAVEN_DSH_PROVIDER_GLM`             | 否                 | `glm`                                    | GLM 配置对应的 dsh provider route                    |
| `DEEPSEEK_API_KEY`                       | 取决于 dsh profile | 无                                       | 模型供应商密钥，只注入 runner/Gateway 进程           |
| `DEEPSEEK_BASE_URL`                      | 否                 | 供应商默认值                             | 兼容代理或自建模型端点；是否支持由 dsh profile 决定  |

### TechHaven MCP

模板和每项语义见 `services/techhaven-mcp/.env.example` 与 `services/techhaven-mcp/README.md`。

| 环境变量                         | 必填条件      | 默认值                             | 说明                                         |
| -------------------------------- | ------------- | ---------------------------------- | -------------------------------------------- |
| `TECHHAVEN_AGENT_TOKEN`          | MCP server    | 无                                 | 每个 Agent 会话签发，绑定 session/org/scope  |
| `TECHHAVEN_TOKEN_SECRET`         | 是            | 无                                 | agent token HMAC 密钥                        |
| `TECHHAVEN_AGENT_NAME`           | 否            | `techhaven-mcp-poc`                | 审计身份名                                   |
| `TECHHAVEN_BACKEND`              | 否            | `mock`                             | `mock`、`bridge`（推荐）或 `http`            |
| `TECHHAVEN_BRIDGE_URL`           | bridge        | 无                                 | 兼容层地址，通常 `http://127.0.0.1:3093`     |
| `TECHHAVEN_BRIDGE_TOKEN`         | bridge        | 无                                 | MCP → Bridge 内部 Bearer                     |
| `TECHHAVEN_API_BASE_URL`         | http          | `https://techhaven.website/api/v1` | MCP 直连旧 API 基址                          |
| `TECHHAVEN_SERVICE_TOKEN`        | http          | 无                                 | MCP 直连旧 API 的 Bearer                     |
| `TECHHAVEN_API_TIMEOUT_MS`       | 否            | `5000`                             | HTTP/Bridge 超时，100–60000 ms               |
| `TECHHAVEN_AUDIT_FILE`           | 否            | `./audit/agent-audit.jsonl`        | append-only 工具审计                         |
| `TECHHAVEN_WRITE_MODE`           | 否            | `direct`                           | `direct` 或 `staged`                         |
| `TECHHAVEN_WRITE_STAGED_TOOLS`   | 否            | `update_ticket_status`             | staged 下需 proposal 的写工具清单            |
| `TECHHAVEN_PROPOSALS_FILE`       | 否            | `./audit/proposals.jsonl`          | mirror 模式 proposal 权威文件                |
| `TECHHAVEN_PROPOSAL_TTL_MINUTES` | 否            | `30`                               | proposal 过期分钟数                          |
| `TECHHAVEN_DB_MODE`              | 否            | `mirror`                           | `mirror` 或 `authoritative`；后者必须 staged |
| `TECHHAVEN_DB_URL`               | authoritative | 无                                 | Agent PostgreSQL，不是产品 MySQL             |
| `TECHHAVEN_APPROVAL_ORG_ID`      | PG 审批 CLI   | 无                                 | 审批目标组织                                 |
| `TECHHAVEN_APPROVER_ID`          | 否            | 无                                 | 审批人 ID                                    |

### 独立旧后端兼容层

模板和内部 API 见 `services/techhaven-agent-bridge/.env.example` 与 `services/techhaven-agent-bridge/README.md`。

| 环境变量                           | 必填条件      | 默认值                           | 说明                                                 |
| ---------------------------------- | ------------- | -------------------------------- | ---------------------------------------------------- |
| `TECHHAVEN_BRIDGE_TOKEN`           | 是            | 无                               | 与 MCP 一致的内部随机 Bearer，不得与其他 token 复用  |
| `TECHHAVEN_BRIDGE_PORT`            | 否            | `3093`                           | 服务只绑定 `127.0.0.1`（3092 已分配给 BFF）          |
| `TECHHAVEN_BRIDGE_LEDGER_FILE`     | 否            | `./data/bridge-operations.jsonl` | 单实例 append-only 幂等台账，必须持久化和备份        |
| `TECHHAVEN_LEGACY_BASE_URL`        | 是            | 无                               | 包含 `/api/v1`、不含 `/rd` 的旧后端地址              |
| `TECHHAVEN_LEGACY_RD_PREFIX`       | 否            | `/rd`                            | 旧研发 API 前缀                                      |
| `TECHHAVEN_LEGACY_TIMEOUT_MS`      | 否            | `5000`                           | 旧后端超时，100–60000 ms                             |
| `TECHHAVEN_LEGACY_AUTH_MODE`       | 否            | `bearer`                         | `bearer`、`cookie`、`none`                           |
| `TECHHAVEN_LEGACY_AUTH_VALUE`      | bearer/cookie | 无                               | 旧后端 token 或完整 Cookie，只存在 Bridge 进程       |
| `TECHHAVEN_LEGACY_STATUS_MAP_JSON` | 否            | 空映射                           | 旧状态 → canonical 状态的单行 JSON；写入自动反向映射 |

产品 MySQL 无需为兼容层新增任何配置或迁移。`TECHHAVEN_*DB_URL` 均指 Agent 自己的 PostgreSQL 数据平面；如果暂不启用 PG，Gateway/MCP 可分别使用 JSONL，但两者都是单实例 PoC 形态。

## 推荐部署方式

保持旧后端和 MySQL 不动，按以下顺序部署：

1. 确认旧后端可从 Bridge 所在机器访问，并冻结三类工单的真实请求/响应、认证方式和状态枚举。
2. 启动一个 Bridge 实例；为 ledger 挂持久卷。MCP 与 Bridge 同机时保持 `127.0.0.1:3093`（3092 是 BFF，3091 是 Gateway），不要向公网开放。
3. 构建 MCP，把 `TECHHAVEN_BACKEND=bridge`、Bridge URL/token 注入 dsh 的 MCP server 环境；每个会话注入独立 `TECHHAVEN_AGENT_TOKEN`。
4. 启动 Gateway。开发验证用 `TECHHAVEN_ENGINE_DRIVER=mock`；接入真实 Agent 时使用已经验证的 dsh driver/profile。
5. 由 Nginx/BFF 暴露同源 `/gateway/*`，在服务端注入 Gateway Bearer 和真实用户 actor；静态前端不能依赖 Vite 开发代理完成生产鉴权。
6. 先使用只读工具联调，再用测试组织执行一个 staged 状态变更，核对 proposal、Bridge ledger、旧后端状态和 MySQL 最终数据。

最小的 Bridge/MCP 关键配置关系：

```dotenv
# Bridge 进程
TECHHAVEN_BRIDGE_TOKEN=<随机且只在服务端保存>
TECHHAVEN_LEGACY_BASE_URL=https://legacy.example.com/api/v1
TECHHAVEN_LEGACY_AUTH_MODE=cookie
TECHHAVEN_LEGACY_AUTH_VALUE=S_TOKEN=<旧后端服务账号会话>

# dsh 启动 MCP 时注入
TECHHAVEN_BACKEND=bridge
TECHHAVEN_BRIDGE_URL=http://127.0.0.1:3093
TECHHAVEN_BRIDGE_TOKEN=<与上方一致>
TECHHAVEN_AGENT_TOKEN=<按 session/org/scope 签发>
TECHHAVEN_TOKEN_SECRET=<签发和校验共享的独立 HMAC 密钥>
TECHHAVEN_WRITE_MODE=staged
```

生产前仍需补齐：真实旧后端 contract test、短期/可轮换服务身份、Bridge 多实例权威幂等存储或明确单实例运维、TLS/mTLS、日志与指标、备份恢复、secret manager、真实 dsh 集成、PG live smoke 和多租户隔离测试。当前仓库提供的是可部署代码路径，不是已完成上线声明。

## 常用命令

| 命令                | 说明                                                          |
| ------------------- | ------------------------------------------------------------- |
| `npm run dev`       | 启动 Vite 开发服务器                                          |
| `npm run dev:agent` | 一键构建并启动本地 Gateway，再启动 Vite；默认使用 mock driver |
| `npm run build`     | 执行 `tsc --noEmit` 类型检查并构建生产产物                    |
| `npm run preview`   | 本地预览 `dist/` 构建产物                                     |
| `npm test`          | 执行前端 Vitest 回归测试                                      |
| `npm run format`    | 使用 Prettier 格式化 `src/` 中支持的文件                      |

前端、Gateway、MCP 和 Bridge 都已配置自动化单测或离线 smoke；环境门控的 Gateway 集成测试和两套 PG smoke 需要相应外部实例。`src/sample/` 仍用于组件的浏览器人工验证。

## 项目结构

```
src/
  components/   # 自定义 UI 组件库（Button/Input/Modal/Message/Confirm/Navbar 等）
  contexts/     # 全局上下文（Theme/Auth/LayoutWidth/SiteSettings/RdOrg）
  hooks/        # 自定义 Hooks（AI 摘要、在线人数、空闲超时、防调试等）
  pages/        # 业务页面（home/auth/article/assignment/organization/personal/profile/rd-platform/admin/error/test）
  router/       # 路由配置
  services/     # API Service 封装（article/auth/organization/rdPlatform/notification 等）
  types/        # 全局类型定义
  utils/        # 工具与请求封装（http/websocket/cookie/hashId 等）
  sample/       # 组件测试样例页
services/
  techhaven-gateway/       # Agent 控制面、HTTP/SSE、runner adapter
  techhaven-mcp/           # Agent 工具、scope、审计与 proposal
  techhaven-agent-bridge/  # 不改旧后端时的独立 HTTP 兼容层
contracts/                 # 前端 ↔ Gateway 版本化共享契约
docs/                      # 架构、路线、RFC 与 Agent PG schema
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

## 文档地图

| 文档                                         | 作用                             |
| -------------------------------------------- | -------------------------------- |
| `docs/ARCHITECTURE.md`                       | 当前与目标架构的单一入口         |
| `docs/ROADMAP.md`                            | 阶段、门禁、状态和指标的单一入口 |
| `docs/TH-RFC-001-agent-engine.md`            | Agent 架构决策与取舍             |
| `docs/agent-db/README.md`                    | Agent 数据平面现状与迁移边界     |
| `services/techhaven-mcp/README.md`           | MCP 工具面运行与验证             |
| `services/techhaven-agent-bridge/README.md`  | 旧后端兼容层、配置、API 与部署   |
| `services/techhaven-gateway/README.md`       | Agent 控制面运行与验证           |
| `services/techhaven-gateway/docs/DSH_SDK.md` | dsh SDK 源码勘察与未验证清单     |

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

Agent 架构与交付门禁以 `docs/ARCHITECTURE.md`、`docs/ROADMAP.md` 和 `docs/TH-RFC-001-agent-engine.md` 为准。

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

推送到 `master`、`feature/agent-engine` 或向两者创建 Pull Request 时，GitHub Actions 使用 Node.js 24 执行四个 job：

1. 前端 build、Vitest、主入口 gzip 体积门禁及 `dist/` 检查。
2. MCP typecheck、单测与 direct/staged/HTTP smoke。
3. Agent Bridge typecheck、单测与假旧后端 HTTP smoke。
4. Gateway typecheck、单测与 mock driver smoke。

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

### Agent Gateway 一键启动与测试部署

本地不再需要分别开两个终端：先在仓库根目录和 `services/techhaven-gateway/` 各执行一次 `npm ci`，以后运行 `npm run dev:agent` 即会构建并启动 `127.0.0.1:3091` Gateway，通过健康检查后再启动 Vite。脚本为两个进程注入同一份仅本次运行有效的随机代理令牌；显式设置的 `TECHHAVEN_*` 变量仍优先生效。

`.github/workflows/deploy-agent-gateway.yml` 提供 GitHub Actions 的 **Deploy Agent Gateway** 手动按钮，并会在 **Deploy to Test Environment** 成功后自动执行，因此测试站不再只发布静态 `dist/`。服务器需满足 Node.js 24、npm、curl，并配置：

1. GitHub Secret `TEST_AGENT_DEPLOY_PATH`，例如 `/srv/techhaven-agent-gateway`。
2. 在服务器创建 `$TEST_AGENT_DEPLOY_PATH/shared/gateway.env`，权限设为 `600`；最小内容为 `TECHHAVEN_GATEWAY_TOKEN=<随机服务端令牌>` 与 `TECHHAVEN_ENGINE_DRIVER=mock`。
3. Nginx/BFF 的 `/gateway/*` 反向代理指向 `127.0.0.1:3091`，并注入与上项一致的 Bearer。启用按用户 AI 配置时，还必须由可信 BFF 注入真实 `X-TechHaven-Actor`，不能信任浏览器自报身份。

工作流会安装生产依赖、切换 `current` 软链接、重启进程并轮询 `/healthz`。若环境文件选择 `TECHHAVEN_ENGINE_DRIVER=dsh`，部署阶段还会固定安装并校验配套的官方 dsh runtime/SDK `0.1.1-rc.2`。默认使用无需 root 的进程管理脚本；为了让服务随服务器重启自动恢复，首次部署成功后执行一次：

```bash
sudo /srv/techhaven-agent-gateway/current/scripts/install-agent-gateway-systemd.sh \
  /srv/techhaven-agent-gateway "$USER"
```

之后同一工作流会自动改用 `systemd` 重启服务。内部 AI 配置读取端点仍由产品后端提供；一键启动负责部署和进程生命周期，不会把脱敏的浏览器配置当作可运行密钥。

### 不依赖 GitHub 的服务器直部署

Windows 本地可以通过 `npm run deploy:server -- -Server <服务器> -User <SSH用户> -DeployRoot /srv/techhaven` 一次完成前端与 Agent Gateway 的构建、最小化打包、SCP 上传、原子版本切换、进程重启和健康检查。首次发布会在服务器生成仅限属主读取的 mock 配置；真实 dsh、用户 API 配置内部端点、BFF 身份注入和 systemd 设置见 [服务器直部署指南](docs/SERVER_DEPLOYMENT.md)。该流程不要求使用 GitHub 或 GitHub Actions。

## 相关文档

- [版本变更记录](CHANGELOG.md)
- [架构基线](docs/ARCHITECTURE.md)
- [推进路线](docs/ROADMAP.md)
- [Agent 架构决策](docs/TH-RFC-001-agent-engine.md)
- [服务器直部署指南](docs/SERVER_DEPLOYMENT.md)
- [部分页面接口与数据协议](docs/README.md)

## License

本项目基于 [GNU Affero General Public License v3.0](LICENSE) 发布。

AGPL-3.0 允许使用、修改、分发及商业使用本项目，但分发修改版本或通过网络向用户提供修改版本时，必须按照许可证要求向相应用户提供完整对应源码，并保留版权及许可声明。

如需将本项目用于不适合遵循 AGPL-3.0 的闭源商业产品，请另行取得商业授权。
