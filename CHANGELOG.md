# Changelog

本项目所有重要变更均记录于此。格式参考 [Keep a Changelog](https://keepachangelog.com/)，版本号遵循 [Semantic Versioning](https://semver.org/)。

发版时请新增一个 `## [vX.Y.Z] - YYYY-MM-DD` 段落，CI 会自动将其作为 GitHub Release 的说明。

## [Unreleased]

### 新增

- 架构基线 `docs/ARCHITECTURE.md`：采用模块化产品域、Web BFF 逻辑边界、Ports & Adapters、Agent 控制面/执行面分离、服务端 proposal 权威、PostgreSQL 权威迁移和 OpenTelemetry 观测模型。
- 推进计划 `docs/ROADMAP.md`：以 `planned → implemented → verified-mock → verified-integration → pilot → production` 状态和 R0–R5 退出门禁替代按阶段名称宣布完成。
- Agent 集成（TH-RFC-001，当前 `implemented + verified-mock`）：决策文档 `docs/TH-RFC-001-agent-engine.md`；agent 数据平面 `docs/agent-db/`（schema v0.3 + v0.2→v0.3 migration + 语义层种子）。
- `services/techhaven-mcp/`：MCP Server（7 工具：get_ticket / list_my_tickets / search_requirements / get_trend_summary / get_semantics / get_proposal / update_ticket_status），agent token（HMAC、单会话+单组织+读写 scope），staged 写提案审批流（提案→人批→应用），审计 JSONL+PG 双写，语义层 mock/DB 双 Provider，dsh 挂载手册（真实 mcp-client 配置，含环境变量剥离陷阱）。
- `services/techhaven-gateway/`：Agent Gateway——引擎生命周期、HTTP API + SSE 事件桥（Last-Event-ID 回放、慢客户端背压）、权限中继、per-org 配额/空闲看门狗/终态 TTL 淘汰；事件 JSONL→PG 装载器（`npm run load`，幂等）。
- PostgreSQL 权威模式：MCP proposal 事务行锁与并发 worker 串行化；Gateway session/event 提交优先于 SSE、组织级 advisory lock 配额；附 migration、spool 对账和两套环境门控 live PG smoke。
- MCP HTTP adapter 增加 5 秒默认超时、稳定的上游不可用/超时错误码，以及 6 项离线 contract smoke（service Bearer、org、幂等键、errno、超时）。
- MCP 默认域 API 基址修正为 `https://techhaven.website/api/v1`；匿名 live 探测确认 `/rd/tasks` 返回统一 `errno=1101` 未登录错误壳，service identity 仍待后端凭据联调。
- 前端 Agent 面板重构为分层会话控制台，支持 mock/Gateway 双路径、事件概况、权限审批、明暗主题与窄屏布局。
- 开发、测试和生产环境统一在研发平台暴露 `/rd/agent`“Agent 助手”入口，并可在页面内直接切换本地演示与 Gateway 联调模式。
- Agent 助手增加“API 配置”入口，复用个人中心的 OpenAI/Claude/GLM 配置表单与 `/user/ai-config` 服务端保存链路，不在浏览器存储模型密钥。

- 根前端单测基线（vitest）：Mermaid 安全严格模式与恶意注入回归、HTTP 1101 未授权状态同步回归（`npm test`）。
- 凭据脱敏回归测试 9 项：`src/utils/websocket.test.ts`（6 项，WebSocket 建连日志不含 token / token_time 原文，脱敏不误伤 uid，重连不绕过，Cookie 值含 `=` 不截断）与 `src/hooks/useAiSummary.test.tsx`（3 项，AI-SSE 诊断日志不含 token 原文或 ≥6 位前缀，同时断言 `Authorization` 头仍正确携带）。两处均已用「临时改回旧写法 → 测试变红」反向验证测试有效性。
- CI 三 job：root（build + test + 体积预算）、techhaven-mcp（typecheck + smoke）、techhaven-gateway（typecheck + smoke），触发覆盖 master 与 feature/agent-engine。
- `scripts/check-bundle-size.mjs`：主入口 gzip 体积预算（R0 退出门禁）。
- MCP 纯域单测（`services/techhaven-mcp`，`npm test`）：基于 Node 内置 `node:test` + `tsx`，不新增依赖。覆盖工单状态机合法/非法迁移与终态、agent token 签发校验（错误密钥/篡改/过期/缺 scope/缺 sid/非法 org/版本）、TTL 解析，以及 `sha256Digest` 跨服务固定向量，共 29 项。
- Gateway 纯域单测（`services/techhaven-gateway`，`npm test`，此前为零）：同为 `node:test` + `tsx`，共 34 项。覆盖配置装载校验（必填 token、driver/store 枚举、端口与配额边界、`dbSchema` 标识符注入防护）、`EventChannel` 并发语义（回放/单趟游标、close 唤醒挂起消费者、close 后 push 静默丢弃、waiter 不泄漏）、SSE 信封 §6 契约（seq/type/occurredAt 上提且 payload 不重复）、`sessionView` 运行态脱敏。
- MCP / Gateway 构建均改用 `tsconfig.build.json` 排除 `*.test.ts`，使 `npm run typecheck` 覆盖测试文件而 `dist/` 不含测试产物。
- CI 的 mcp 与 gateway job 各增加 `npm test` 步骤，纯域单测纳入每次 push/PR。

### 修复

- `src/utils/websocket.ts` 的 `getCookie` 改用 `indexOf("=")` 取值：原 `split("=")` 会在 Cookie 值内的第一个 `=` 处切断，base64 填充或 JWT 分段的 token 会被静默截断，症状是「Cookie 明明有值却鉴权失败」。已附回归测试。
- 开发代理的 Gateway 令牌改用非 `VITE_` 前缀的 `TECHHAVEN_GATEWAY_PROXY_TOKEN`，避免把仅供 Vite 配置进程读取的凭据放入客户端环境变量命名空间。

### 变更

- `.gitattributes`：`* text=auto eol=lf`，统一行尾与 prettier `endOfLine: "lf"`，消除 Windows 下 Prettier 运行后的全树漂移。
- Mermaid `securityLevel` 由 `loose` 改为 `strict`（标签内 HTML/脚本不再渲染成可执行标记），配置抽至 `mermaidConfig.ts` 供组件与回归测试共用。
- README 移除「`src/sample/Input.tsx` 残留 antd icons 阻断构建」说明（已修复并纳入构建回归）。
- TH-RFC-001 升级至 v0.2，修正此前“P1 完成”的过度表述：当前仅证明 mock/离线闭环，真实前端、产品后端、dsh 和 PostgreSQL 集成仍待验证。
- 明确生产目标中 PostgreSQL 为 Agent 会话/事件/提案/工具审计的权威存储，JSONL 退为本地 spool、调试导出和有限降级缓冲。
- 明确产品 proposal/策略引擎是写权限权威；当前 dsh SDK 不支持编程式权限应答时，runner 权限必须 fail-closed。
- staged proposal 改为服务端 worker 在批准后主动重校验并应用，`get_proposal` 退回纯查询；真实 HTTP 写携带 proposal ID 作为 `Idempotency-Key`。
- 前端 Gateway SSE client 增加 EventEnvelope 运行时校验、跨会话拒绝、`sid + seq` 幂等去重与有限重连；Gateway 子进程冒烟增加断线 `after` 回放、连续性和取消终态闭环。
- Agent 面板增加活动 SID 的标签页级刷新恢复：刷新后查询同一会话并全量回放，页面卸载仅断开观察流；mock runner 补齐 `awaiting_permission → running` 状态迁移，Gateway 模式审批文案不再误写为 mock 流。
- Gateway 环境集成测试增加“第一观察端断开 → 新 client 查询同一 SID → 历史回放 → 审批 → succeeded”闭环；浏览器经 Vite 代理的创建、待审批、批准和拒绝路径已实测。
- Gateway 启动时从 JSONL 恢复会话视图与 SSE 历史；终态保留原状态并延续剩余 TTL，重启时仍活动的会话追加唯一 failed 终态。子进程冒烟扩展为 35 项，覆盖终态查询/回放与中断态收敛。
- Vite Gateway 代理在上游 SSE `ECONNRESET` 时显式关闭浏览器侧响应，使客户端真正进入 `after=<lastSeq>` 重连；浏览器已实测刷新保持同 SID，以及 Gateway 强制重启后自动续传失败终态。
- Agent 会话将“断开观察”与“用户取消”拆分，并共享 StrictMode 创建 Promise，消除刷新误取消和双 POST 会话竞态。
- 同步根 README、Agent 服务文档、数据层文档和开发约定中的架构状态与验证边界。
- `docs/agent-db/schema.sql` v0.2：`agent_write_proposals` 增加 `proposal_ref TEXT UNIQUE` 列。
- `docs/agent-db/schema.sql` 升级 v0.3：`proposal_ref` 设为 NOT NULL 权威并发键并增加 migration ledger；提供可重复的 v0.2→v0.3 migration。
- 澄清 `services/techhaven-gateway/src/channel.ts` 的挂起语义并写入注释：消费者挂起在内部 await 上时 `iterator.return()` 不会落地（AsyncGenerator 规范下 return 请求需排队到生成器体让出控制权），终止消费的唯一可靠路径是 `channel.close()`；file 内 finally 的 waiter 摘除只是 yield 点退出的兜底。现有 mock / dsh 驱动的 `dispose` 走的都是 `close()`，行为不变。

## [v1.0.1] - 2026-08-31

### 新增
- 新增「Pi 极客」主题，采用纸格与终端风格设计。
- 新增各主题对应的鼠标指针样式和主题背景交互效果。
- 主题背景支持网格、波纹、粒子及点击反馈动画，并适配系统的减少动态效果偏好。

### 优化
- 优化文章目录滚动定位逻辑，根据实际滚动容器和标题位置更新当前目录项。
- 优化文章目录在页面顶部、底部及平滑滚动过程中的激活状态。
- 优化返回顶部功能，兼容页面滚动和 SimpleBar 滚动容器。
- 优化主题样式面板、开关组件及页面背景在不同主题下的视觉表现。

### 修复
- 修复 Markdown 代码块中的标题语法被错误提取到文章目录的问题。
- 修复文章目录定位偏移及首尾标题无法正确激活的问题。

## [v1.0.0] - 2026-08-28

首个正式版本，对应当前 master 节点。

### 新增

- 首页侧边栏「每日一言」组件，调用一言（Hitokoto）公开接口，按日缓存并支持手动刷新。
- 主题风格选择面板，支持时代周刊、极简黑白、护眼豆绿、海洋蓝、樱花粉、赛博朋克、暗金奢华、薰衣草紫等风格。

### 变更

- 默认主题风格由「默认」改为「时代周刊」（纸刊衬线风），移除「默认」选项。
- CI/CD 改为基于 git tag（`v*`）发布：仅 tag 推送触发部署并生成 GitHub Release；master 推送与 PR 仅做构建检查。

### 其他

- 首页「订阅更新」卡片改为仅开发环境可见（功能尚未实现）。
- 部署版本目录由时间戳改为 tag 名称，与 Release 一一对应，便于回滚溯源。
