# AI 配置资产（Agent DB v0.4）

把每个账号的模型 API Key 当作**账号资产**管理：一个账号可持有多套命名配置，可显式切换；组织可共享配置给成员；个人配置优先于组织配置；每套配置可独立设置用量配额并按天/月统计消耗。

数据只落在 Agent DB（PostgreSQL），**不经过、不依赖产品后端**——中间层由 Gateway 自己承担，浏览器与产品后端都不接触明文密钥。

## 数据模型

见 `docs/agent-db/schema.sql` 第 11 节（迁移：`migrations/003-v0.3-to-v0.4-ai-config-assets.sql`）。

| 表 | 职责 |
| --- | --- |
| `ai_configs` | 配置本体。`scope` 区分 `user` / `org`；密钥只存 AES-256-GCM 密文 + 指纹 + 脱敏串 |
| `ai_usage_daily` | 按「配置 × 天」聚合用量；金额以微元（cost_micros）整数累加 |
| `ai_quotas` | 单套配置的配额：`daily/monthly` × `tokens/requests/cost_micros` |
| `ai_config_usages` | 使用明细：谁、哪个会话、用了哪把钥匙（审计追责） |
| `user_ai_preferences` | 用户当前选中的配置；为空走默认解析链 |

## 解析优先级

会话创建时 Gateway 按 `X-TechHaven-Actor` 解析该用户的配置：

```text
1. explicit      用户显式选中（个人，或已共享的组织配置）
2. user_named    个人配置中按名字指定
3. user_default  个人默认配置
4. org_default   组织默认配置（必须 shared = true）
全落空 → 412 提示先配置
```

额度用完（`quota_exceeded`）的配置在每一层被**跳过而非报错**，因此「个人钥匙没额度了」会自动回落到组织配置。配额按实时用量判定，跨日自动重置，无需改库。

## HTTP API（Bearer Gateway Token + X-TechHaven-Actor）

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/v1/ai-configs` | 个人配置 + 组织共享配置（脱敏）+ 当前选中 |
| POST | `/v1/ai-configs` | 新建个人配置（body 含 `name`/`type`/`url`/`api_key`…） |
| GET | `/v1/ai-configs/resolve` | 预览当前会话将命中的配置与来源，不含明文 |
| PUT | `/v1/ai-configs/preference` | 设置选中：`{config_id, org_id}`，null 表示清空 |
| GET | `/v1/ai-configs/:id` | 单条详情（脱敏） |
| PATCH | `/v1/ai-configs/:id` | 更新元数据 / 置默认 / 启停 |
| PUT | `/v1/ai-configs/:id/key` | 更换密钥（重新加密） |
| DELETE | `/v1/ai-configs/:id` | 删除（用量与配额级联清理，使用明细保留） |
| GET | `/v1/ai-configs/:id/usage` | 日/月窗口用量 + 累计值 |

响应视图与前端 `AiConfigParams` 契约兼容：`type` / `provider` / `response_type` / `url` / `api_key`（脱敏）/ `model` / `reasoning_effort` / `max_tokens`，另有 `id` / `name` / `is_default` / `status` 等资产管理字段。

安全不变量：

- 所有写操作限定 `scope=user AND owner=当前用户`，无法触达他人配置；
- 明文密钥只流向 dsh 子进程环境变量，任何 HTTP 响应只含脱敏串；
- 路由需要 Bearer Token（Nginx/BFF 注入），不暴露公网。

组织配置（`scope=org`）的创建与配额管理**不开放 HTTP**：Gateway 无法验证「谁是组织管理员」，该操作走 DBA / 管理通道。

## 启用步骤

```bash
# 1. 迁移（可重复执行）
cd services/techhaven-gateway
npm run db:migrate -- --url "postgres://…/techhaven" --mode upgrade

# 2. 生成主密钥并写入 gateway.env（一次性的，丢了已存密钥就解不开）
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# 3. gateway.env 中启用
TECHHAVEN_GATEWAY_STORE=postgres
TECHHAVEN_GATEWAY_DB_URL=postgres://…/techhaven
TECHHAVEN_AI_CONFIG_MASTER_KEY=<上一步生成值>

# 4. 重启 Gateway；日志出现「AI 配置资产已启用」即成功
```

主密钥轮换：`TECHHAVEN_AI_CONFIG_MASTER_KEY` 换新值，`_VERSION` 加一，旧值放 `_PREVIOUS`；存量密文在用户重新保存时逐条重加密，完成后移除 `_PREVIOUS`。

## 与现有链路的关系

- 未配置主密钥或存储为 jsonl 时，路由返回 503，会话创建回退到 `TECHHAVEN_AI_CONFIG_URL`（产品后端）链路，行为与升级前一致；
- 配置后产品后端的 `/user/ai-config` 不再是必选项，前端可逐步切换到 `/v1/ai-configs` 多套配置接口。

## 已知边界

- 配额未含通知/预警，超限时直接 429；`ai_quotas` 表结构已支持后续加软阈值；
- `ai_usage_daily` 依赖会话结束后回写（`recordUsage`），异常崩溃的会话可能少记最后一段用量；
- 明细保留 365 天、日聚合保留 400 天（见 schema 保留策略注释），由 DB 定时任务执行。
