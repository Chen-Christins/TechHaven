# techhaven-mcp

TechHaven 研发平台的 MCP adapter。它把工单/需求/缺陷操作暴露为结构化工具，是 TH-RFC-001 的「工具流」（agent → TechHaven）边界。

> 当前状态：`implemented + verified-mock`。6 读 + 1 写、direct/staged、token、审计和可选 PG adapter 已实现；真实产品后端与 live PostgreSQL 尚未验证。架构见 `../../docs/ARCHITECTURE.md`，决策见 `../../docs/TH-RFC-001-agent-engine.md`，门禁见 `../../docs/ROADMAP.md`。

## 快速开始

```bash
npm install
npm run build

# 1) 签发一个 agent token（绑定 org 1，读写 scope，2 小时时效）
TECHHAVEN_TOKEN_SECRET=dev-only-secret-change-me \
  npm run token -- issue --org 1 --sid poc-1 --scopes rd:read,rd:write --ttl 2h

# 2) 端到端冒烟（自动起 server 进程、走完整 MCP 握手、调用全部关键路径）
TECHHAVEN_TOKEN_SECRET=dev-only-secret-change-me npm run smoke
```

smoke 通过只证明 **mock/离线工具流**：握手 → 列工具 → 读工单 → 合法状态迁移 → 非法迁移拒绝 → hashId 错误；随后验证 staged proposal → 人工批准 → `get_proposal` 应用 → 幂等。它不证明真实域 API、live dsh 或 PostgreSQL 已完成集成。

## 运行模式

| 模式 | 说明 |
|---|---|
| `TECHHAVEN_BACKEND=mock`（默认） | 内置 8 条演示数据（3 需求 + 3 缺陷 + 2 任务，org 1），零依赖跑通全流程 |
| `TECHHAVEN_BACKEND=http` | 调真实后端 `/rd/*`（端点对齐前端 `rdPlatformService.ts`）。需要 `TECHHAVEN_SERVICE_TOKEN`（服务端到服务端凭据）；**待朋友侧 P0 交付后联调** |

agent token 只用于本服务与引擎之间的鉴权与审计，**不会**传给后端；后端调用使用独立的服务凭据。这落实了设计文档「凭据只在服务端，agent 只持 scoped token」的原则。

## 挂载到 dsh

dsh 侧通过 mcp-client 把本服务挂为外部工具源（stdio 方式，token 走 env 注入）。配置**示意**如下——字段名请以 dsh 仓库 `docs/config-catalog.md` 中 `mcp-client` 条目的实际 schema 为准：

```jsonc
// 示意：在 dsh 配置中新增一个 MCP server 条目（opt-in，默认不启用）
{
  "command": "node",
  "args": ["/绝对路径/techhaven-mcp/dist/index.js"],
  "env": {
    "TECHHAVEN_AGENT_TOKEN": "thm_v1....",        // 每会话签发一次
    "TECHHAVEN_TOKEN_SECRET": "dev-only-secret-change-me",
    "TECHHAVEN_BACKEND": "mock",
    "TECHHAVEN_AUDIT_FILE": "./audit/agent-audit.jsonl"
  }
}
```

挂载后 agent 即可原生调用 `get_ticket` / `list_my_tickets` / `search_requirements` / `get_trend_summary` / `get_semantics` / `get_proposal` / `update_ticket_status`。

## 工具目录（7 工具 = 6 读 + 1 写）

| 工具 | scope | 说明 |
|---|---|---|
| `get_ticket` | rd:read | 读单张工单详情（kind: requirement/bug/task，hashId 入参） |
| `list_my_tickets` | rd:read | 列本组织工单，可按类型/状态过滤，单页上限 50 |
| `search_requirements` | rd:read | 按关键词/优先级搜需求 |
| `get_trend_summary` | rd:read | 近 N 天趋势摘要（各类型 open/closed、窗口内新建/关闭） |
| `get_semantics` | rd:read | 语义层读取：字段业务含义与指标口径（查数/改数前先读口径） |
| `get_proposal` | rd:read | 查询写提案状态；当前 PoC 中批准后再调它会触发应用 |
| `update_ticket_status` | rd:write | 变更状态；**非法迁移一律拒绝**；必须附原因；staged 且列入分级审批清单时先建提案 |

`add_ticket_comment`、`create_bug` 等后续工具不是既定交付；每个写工具需单独完成风险、幂等、审批和域契约评审。

## 写模式：direct / staged

`TECHHAVEN_WRITE_MODE` 控制写工具（目前是 `update_ticket_status`）的生效方式：

| 模式 | 行为 |
|---|---|
| `direct`（默认） | 变更直接生效（P0 现状，行为不变） |
| `staged` | 变更先存为**提案**（pending，带过期时间），人工批准后才由 server 应用 |

staged 流程（文字版时序）：

```
agent 调 update_ticket_status（合法迁移）
  → server 校验 scope + 状态机，创建提案（pending，TECHHAVEN_PROPOSAL_TTL_MINUTES 内有效），
    返回 { proposal: { id, status: "pending", to_status, expires_at } }   —— 变更未生效
  → 人工执行 `npm run proposal -- approve <id>`（或 reject / 放任过期）
  → agent 调 get_proposal { id }
  → server 检测到 approved：重读工单当前状态、重新过状态机 → 应用变更，补记 applied 事件
  → 返回 { id, status: "applied", updated: {...} }
```

以上是**当前 PoC 行为**。目标流程在 R1 改为：批准后由服务端 worker 主动重新校验并幂等应用，`get_proposal` 只查询状态，模型轮询不再是写入生效的必要条件。

要点：

- **快速失败**：工单不存在或迁移非法时直接报错，不产生提案——审批负担只留给合法请求。
- **批准后二次校验**：应用前 server 重读工单当前状态、重新过状态机；审批窗口内工单若已被人工改动且迁移不再合法，提案转 rejected 并返回说明，不会硬改。
- **未决过期 = 默认拒绝**（安全侧倾斜）：`TECHHAVEN_PROPOSAL_TTL_MINUTES`（默认 30 分钟）内未批准即 expired。
- **幂等**：已 applied 的提案重复查询不会重复应用。
- **分级审批过渡**：staged 模式下只有列入 `TECHHAVEN_WRITE_STAGED_TOOLS`（默认 `update_ticket_status`）的写工具走提案；目标由 `tool_catalog` / `org_tool_policy` 服务端策略取代环境清单。
- 提案事件（created/approved/rejected/applied/expired，含操作者）落 `TECHHAVEN_PROPOSALS_FILE`（JSONL，append-only）；人工用 `npm run proposal -- list / approve / reject` 处理。

风险与边界：**当前 PoC** 以 JSONL proposal 为权威，适用单 server + 偶发 CLI；不适用于生产并发审批。目标在 R2 迁移为 PostgreSQL 权威、JSONL spool，详见 `../../docs/agent-db/README.md`。

## 工单状态机（须与后端对齐后冻结）

```
requirement: new → developing → testing → done → closed      （testing 可回退 developing）
bug:         new → accepted → processing → verified → closed （processing 可 reopened；closed 可 reopened）
task:        todo → doing → done → closed                    （doing 可回退 todo）
```

枚举来源：TechHaven `src/types/rdPlatform.ts`。**迁移规则是本仓库先拟的**，需要朋友后端确认。

## 审计

每次工具调用写一行 JSONL（`TECHHAVEN_AUDIT_FILE`，append-only）：时间、会话、组织、工具、参数摘要（SHA-256，不落原始参数）、allow/deny 与原因、耗时。趋势分析（P2）直接吃这份数据。

当前配置 `TECHHAVEN_DB_URL` 后同步镜像 `agent_tool_calls`；DB 失败只记 stderr、JSONL 继续记录。目标在 R2 切换为 PG 权威并增加 spool 补写、对账和告警，当前降级不应被视为生产可靠性保证。

## 与 docs/agent-db 的衔接

`TECHHAVEN_DB_URL` 非空时，由 `PgContext`（`src/db/context.ts`）统一建连接池并 bootstrap `agent_identities` / `agent_sessions`，供三条落地路径共用；任一环节失败整体降级为「仅 JSONL 审计 + mock 语义层 + 提案只落 JSONL」：

| 能力 | DB 落点 | 状态 |
|---|---|---|
| 审计双写 | `agent_tool_calls`（当前 JSONL 主、DB 镜像） | `implemented`，live PG 未验证 |
| 写提案落库 | `agent_write_proposals`（`proposal_ref` 映射字符串 ID） | `implemented`，live PG/并发未验证 |
| 语义层 DB Provider | `semantic_objects` / `semantic_fields` / `semantic_metrics`（60s 缓存） | `implemented`，live PG/策展未验证 |

分级审批：staged 写模式下仅 `TECHHAVEN_WRITE_STAGED_TOOLS` 清单中的写工具走提案审批；后续 `tool_catalog` / `org_tool_policy` 就位后，该清单改由组织级工具策略驱动。

## 真实域后端集成清单（ROADMAP R2）

- [ ] 服务凭据机制：接受 `TECHHAVEN_SERVICE_TOKEN`（Bearer）或指定替代方案
- [ ] `/rd/*` 端点在服务端到服务端调用下的鉴权行为确认
- [ ] 工单状态机迁移规则核对/修正
- [ ] `/rd/trends` 响应结构提供（当前 http 模式由列表端点聚合，上限 200/类）

## 目录结构

```
src/
  index.ts            # MCP Server 入口（stdio）
  cli.ts              # agent token 签发/校验 CLI
  proposalCli.ts      # 写提案人工审批 CLI（list / approve / reject）
  smoke.ts            # 端到端冒烟测试（direct 模式）
  smoke.staged.ts     # 端到端冒烟测试（staged 写模式：提案 → 人批 → 应用）
  config.ts           # 环境变量解析
  audit.ts            # JSONL 审计
  hashid.ts           # TechHaven hashId 镜像（同盐同长度）
  auth/agentToken.ts  # HMAC token：单会话 + 单组织 + scope + TTL
  db/context.ts       # DB 会话上下文（PgContext：pool + 身份/会话 bootstrap，三条落地路径共用）
  domain/             # 领域类型与工单状态机
  audit/dbSink.ts     # 审计 DB 双写（agent_tool_calls）
  proposals/store.ts  # 当前 PoC 写提案存储（JSONL append-only）
  proposals/dbSink.ts # 写提案 DB 双写（agent_write_proposals）
  semantics/          # 语义层 Provider：mock（人工策展）/ db（semantic_* 表，60s 缓存）
  techhaven/          # 数据访问：mock / http 两实现
  tools/index.ts      # P0 工具注册（scope 守卫 + 审计 + 分级审批的 staged 提案分支）
```
