# TechHaven 架构推进计划

> 版本：v1.0-draft  
> 日期：2026-08-29  
> 对应架构：`docs/ARCHITECTURE.md`  
> 执行原则：按退出门禁推进，不按日期宣布完成

## 1. 状态定义

每项能力只允许使用以下状态：

| 状态                   | 含义                             |
| ---------------------- | -------------------------------- |
| `planned`              | 仅有设计或任务                   |
| `implemented`          | 代码存在并通过静态检查           |
| `verified-mock`        | 在 mock/离线依赖上通过自动化验证 |
| `verified-integration` | 与真实相邻系统在测试环境完成验证 |
| `pilot`                | 有限组织真实使用，可回滚且有观测 |
| `production`           | 满足安全、可靠性、恢复和运营门禁 |

禁止把 `implemented` 或 `verified-mock` 写成“完成上线”。

## 2. 当前状态快照

| 能力                    | 当前状态        | 证据与边界                                               |
| ----------------------- | --------------- | -------------------------------------------------------- |
| SPA 博客/组织/研发/后台 | `implemented`   | 页面与 service 已存在；缺少系统化自动化测试              |
| 根前端正式构建          | `verified-mock` | `npm run build` 通过；主入口 gzip 92.2 KB（预算 256 KB，历史单体约 1.03 MB） |
| 根前端单测基线          | `verified-mock` | vitest 7 项通过：Mermaid 安全回归（strict + 恶意输入 fail-closed）、HTTP 1101 状态同步 |
| Mermaid 安全            | `verified-mock` | `securityLevel=strict`；恶意 HTML/脚本/click 注入测试无可执行标记 |
| CI                      | `verified-mock` | `.github/workflows/ci.yml` 三 job：root（build+test+体积）、mcp、gateway，触发覆盖 master 与 feature/agent-engine |
| MCP direct 工具流       | `verified-mock` | 9 项离线冒烟通过                                         |
| MCP staged proposal     | `verified-mock` | 11 项离线冒烟通过；当前批准后由 `get_proposal` 触发应用  |
| Gateway HTTP/SSE/配额   | `verified-mock` | 22 项 mock driver 冒烟通过                               |
| 前端 Agent 面板         | `implemented`   | DEV 样例页，仅本地 mock，未接 Gateway                    |
| dsh driver              | `implemented`   | 静态实现；无 live dsh、权限应答和单 turn cancel 验证     |
| MCP → 产品域 HTTP       | `implemented`   | adapter 已有；服务凭据/状态机/趋势接口未联调             |
| Agent PostgreSQL        | `implemented`   | schema/provider/loader 已有；无 live PG 验证             |
| 多租户沙箱              | `planned`       | 尚未实现                                                 |
| 全链路可观测性          | `planned`       | 当前以 JSONL 和 stderr 为主                              |

## 3. 阶段计划

### R0：稳定基线（预计 1–2 周）

目标：让主干重新具备可信构建、测试和文档基线。

工作项：

- 修复残留 `@ant-design/icons`，恢复 `npm run build`；
- 修复 HTTP 1101 只清 TokenManager、不清 AuthContext 的状态分裂；
- WebSocket 不再在 URL/日志暴露长时 token，形成同源 Cookie 或一次性 ticket 设计；
- Mermaid 改为严格模式并增加恶意输入测试；
- Router 使用 `React.lazy` 分割 admin/rd/article/agent 等路由；
- 建立 root、MCP、Gateway 三个 CI job；
- 将现有 smoke 纳入 CI，增加最小纯域测试；
- README、RFC、服务文档统一使用本状态模型。

退出门禁：

- `npm ci && npm run build` 在干净 checkout 通过；
- 两个服务 typecheck + 三套 smoke 全通过；
- 不存在未声明依赖和 README 依赖漂移；
- 主 JS gzip 体积建立预算并较当前约 1.03 MB 明显下降；
- 高优先级认证与 Mermaid 安全问题有自动化回归测试。

> **R0 进度（2026-08-29）**：构建阻断（antd icons 残留）、1101 状态分裂、路由分包、WS token 日志脱敏、
> Mermaid strict + 回归、CI 三 job、主入口 gzip 预算均已落地并本地复验；`npm test`/`npm run build`/两服务
> typecheck+smoke 全绿。**剩余**：WebSocket token 从 URL 参数迁移到同源 Cookie/一次性 ticket（需后端配合，
> 见 ARCHITECTURE §6）、MCP 纯域单测、干净 checkout `npm ci` 复核（CI 完成后自动覆盖）。

### R1：契约与真实控制面接线（预计 2–3 周）

> **R1 进度（2026-08-29）**：共享契约包 `contracts/`（类型单源：引擎事件/事件信封/会话/提案/API 形态，
> 双服务经 `file:../../contracts` 消费并过 typecheck+smoke）；Gateway SSE 已升级为事件信封
> （schemaVersion/eventId/sessionId/orgId/seq/type/occurredAt/traceId/payload，TH-RFC-001 §6）。
> **剩余**：前端 Gateway client（SSE 续传/取消/审批）与面板接线、proposal 服务端 worker（见 ADR-04 迁移）、
> 断线/重启恢复门禁验证。

目标：前端通过稳定契约使用真实 Gateway，但仍可选择 mock driver。

工作项：

- 建立共享 `contracts` 模块：session、event envelope、proposal、error、API schema；
- Agent 面板实现 Gateway client：创建会话、SSE 断线续传、取消、proposal 审批；
- 事件加入 `schemaVersion/eventId/traceId/orgId`；
- Gateway 会话与 proposal API 做 contract test；
- 明确 dsh 权限限制：产品域写走 proposal 权威流程，runner 权限不可应答时 fail-closed；
- proposal 批准后由服务端 worker 主动应用，移除“模型查询才生效”的关键依赖；
- feature flag 控制 mock/real UI 路径，可快速回退。

退出门禁：

- 浏览器刷新/断线后从 `Last-Event-ID` 恢复，持久化事件无缺口、无重复副作用；
- 拒绝 proposal 后域状态不变；重复批准只执行一次；
- UI 展示的权限结果与服务端权威状态一致；
- Gateway 重启后历史会话仍可查询。

### R2：真实域后端与 PostgreSQL（预计 2–3 周）

目标：把 mock 工具流替换为真实测试环境集成。

工作项：

- 与产品后端冻结 service identity、audience、scope、状态机和错误契约；
- 域后端提供 idempotency key、actor、reason、trace ID；
- PostgreSQL 执行 schema/migration/seed/loader；
- 以 PostgreSQL 为 proposal/session/event 权威，JSONL 改为 spool；
- 双写对账工具、补写策略、备份恢复和并发批准测试；
- MCP HTTP adapter 与域 API contract test；
- dsh runtime 精确版本安装并完成 Windows live smoke。

退出门禁：

- 测试环境完成“真实工单读取 → proposal → 人批 → 域状态更新 → 审计回放”；
- 跨组织、错误 audience、过期 token、非法迁移全部拒绝；
- 数据库短暂不可用不会产生未经审计的写；恢复后可幂等补写；
- dsh 版本、profile、事件映射和已知限制生成可审阅报告。

### R3：单组织试点（预计 2–4 周）

目标：在受控开发者组织中验证价值、可靠性与运营流程。

范围：

- 本地 runner；
- 只读工具 + `update_ticket_status` 一个 staged 写工具；
- 组织/会话/工具配额；
- 运行历史、proposal 审批、失败解释和人工回滚；
- OpenTelemetry traces/metrics/logs 与审计关联；
- on-call、kill switch、数据导出和事件保留策略。

退出门禁：

- 所有写调用都可关联到策略或人工决定；越权写成功数为 0；
- 会话创建、事件回放、审批等待、工具失败有可查询指标；
- 完成故障演练：runner 崩溃、Gateway 重启、域 API 超时、数据库短暂不可用；
- 试点用户确认核心流程有价值，且失败可理解、可恢复；
- 形成继续生产化或停止投入的量化决策记录。

### R4：生产硬化（预计 4–6 周）

目标：满足多组织生产门禁。

工作项：

- 每会话一次性容器/沙箱、只读或最小仓库挂载、网络出站 allowlist；
- bulkhead、retry budget、circuit breaker、容量和成本配额；
- ASVS 检查、威胁建模、依赖/SBOM、密钥轮换、审计保留；
- 负载、长稳、恢复、升级/回滚和数据迁移演练；
- SLO 与告警、容量模型、成本看板；
- 灰度发布和组织级 kill switch。

退出门禁：

- 沙箱无法访问白名单外网络、未授权路径和其他组织数据；
- 配额、慢客户端、retry storm 和依赖故障不会扩散到其他组织；
- 备份恢复、版本回滚和事件重放演练通过；
- 安全、可靠性和运营负责人共同签署生产验收。

### R5：数据驱动扩展（无固定日期）

仅在 R3/R4 数据证明必要时评估：

- `create_bug`、`add_ticket_comment` 等更多写工具；
- MCP Tasks 等实验性长任务协议；
- 多 runner 或其他 agent runtime；
- ACP/SDK 新版权限应答；
- 独立 BFF 部署、消息总线、微服务或多区域。

每个选项都需单独 RFC，不继承“规划即承诺”。

## 4. 并行工作流

| 工作流        | R0                | R1                   | R2              | R3           | R4         |
| ------------- | ----------------- | -------------------- | --------------- | ------------ | ---------- |
| Frontend      | 构建/安全/分包    | 真实 Agent client    | 错误与恢复 UI   | 试点体验     | 性能与灰度 |
| Contracts     | 状态模型          | 事件/API schema      | 域/MCP contract | 兼容性监控   | 版本治理   |
| Control Plane | CI/纯域测试       | 持久会话/审批 worker | PG 权威迁移     | 配额/OTel    | 隔离/容量  |
| MCP           | 测试与 token 基线 | proposal 契约        | 真实域 API      | 一个写工具   | 工具治理   |
| Runner        | mock 基线         | fail-closed 权限     | live dsh        | 本地试点     | 沙箱池     |
| Security      | Web 风险修复      | threat model         | audience/跨租户 | 试点审计     | ASVS/渗透  |
| Operations    | CI                | trace ID             | PG 备份恢复     | 告警/runbook | SLO/成本   |

## 5. 指标

产品与工程指标分开，避免只优化技术吞吐：

### 5.1 产品效果

- 首次有用结果时间；
- 人工接受的 Agent 建议比例；
- proposal 批准/拒绝/过期比例；
- 因 Agent 产生的返工或回滚比例；
- 单次成功会话的人工作业时间节省。

### 5.2 运行质量

- 会话创建成功率与 p95 排队时间；
- 事件回放缺口/重复；
- 工具成功率、超时率、p95 latency；
- 审批等待时间；
- runner 异常退出、配额拒绝、跨组织拒绝；
- 每成功会话 token/运行时/沙箱成本。

### 5.3 交付能力

按 DORA 当前五指标观察趋势，不用于个人绩效：change lead time、deployment frequency、failed deployment recovery time、change fail rate、deployment rework rate。参考：https://dora.dev/guides/dora-metrics/

## 6. 决策与报告模板

每个阶段结束提交一页结论：

1. 目标与退出门禁；
2. 当前状态（使用标准状态词）；
3. 自动化证据与真实环境证据；
4. 未验证边界；
5. 指标变化；
6. 风险和回滚方案；
7. 决策：继续、调整、暂停或终止。
