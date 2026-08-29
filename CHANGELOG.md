# Changelog

本项目所有重要变更均记录于此。格式参考 [Keep a Changelog](https://keepachangelog.com/)，版本号遵循 [Semantic Versioning](https://semver.org/)。

发版时请新增一个 `## [vX.Y.Z] - YYYY-MM-DD` 段落，CI 会自动将其作为 GitHub Release 的说明。

## [Unreleased]

### 新增
- 架构基线 `docs/ARCHITECTURE.md`：采用模块化产品域、Web BFF 逻辑边界、Ports & Adapters、Agent 控制面/执行面分离、服务端 proposal 权威、PostgreSQL 权威迁移和 OpenTelemetry 观测模型。
- 推进计划 `docs/ROADMAP.md`：以 `planned → implemented → verified-mock → verified-integration → pilot → production` 状态和 R0–R5 退出门禁替代按阶段名称宣布完成。
- Agent 集成（TH-RFC-001，当前 `implemented + verified-mock`）：决策文档 `docs/TH-RFC-001-agent-engine.md`；agent 数据平面 `docs/agent-db/`（schema v0.2 + 语义层种子）。
- `services/techhaven-mcp/`：MCP Server（7 工具：get_ticket / list_my_tickets / search_requirements / get_trend_summary / get_semantics / get_proposal / update_ticket_status），agent token（HMAC、单会话+单组织+读写 scope），staged 写提案审批流（提案→人批→应用），审计 JSONL+PG 双写，语义层 mock/DB 双 Provider，dsh 挂载手册（真实 mcp-client 配置，含环境变量剥离陷阱）。
- `services/techhaven-gateway/`：Agent Gateway——引擎生命周期、HTTP API + SSE 事件桥（Last-Event-ID 回放、慢客户端背压）、权限中继、per-org 配额/空闲看门狗/终态 TTL 淘汰；事件 JSONL→PG 装载器（`npm run load`，幂等）。
- 前端样例页 `/test/agent-session-panel`（DEV）：Agent 会话面板（事件流/工具卡片/权限审批卡），复用自研组件库；待浏览器确认后集成业务页。

### 新增
- 根前端单测基线（vitest）：Mermaid 安全严格模式与恶意注入回归、HTTP 1101 未授权状态同步回归（`npm test`）。
- CI 三 job：root（build + test + 体积预算）、techhaven-mcp（typecheck + smoke）、techhaven-gateway（typecheck + smoke），触发覆盖 master 与 feature/agent-engine。
- `scripts/check-bundle-size.mjs`：主入口 gzip 体积预算（R0 退出门禁）。

### 变更
- `.gitattributes`：`* text=auto eol=lf`，统一行尾与 prettier `endOfLine: "lf"`，消除 Windows 下 Prettier 运行后的全树漂移。
- Mermaid `securityLevel` 由 `loose` 改为 `strict`（标签内 HTML/脚本不再渲染成可执行标记），配置抽至 `mermaidConfig.ts` 供组件与回归测试共用。
- README 移除「`src/sample/Input.tsx` 残留 antd icons 阻断构建」说明（已修复并纳入构建回归）。
- TH-RFC-001 升级至 v0.2，修正此前“P1 完成”的过度表述：当前仅证明 mock/离线闭环，真实前端、产品后端、dsh 和 PostgreSQL 集成仍待验证。
- 明确生产目标中 PostgreSQL 为 Agent 会话/事件/提案/工具审计的权威存储，JSONL 退为本地 spool、调试导出和有限降级缓冲。
- 明确产品 proposal/策略引擎是写权限权威；当前 dsh SDK 不支持编程式权限应答时，runner 权限必须 fail-closed。
- 同步根 README、Agent 服务文档、数据层文档和开发约定中的架构状态与验证边界。
- `docs/agent-db/schema.sql` v0.2：`agent_write_proposals` 增加 `proposal_ref TEXT UNIQUE` 列。

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
