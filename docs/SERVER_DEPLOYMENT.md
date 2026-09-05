# TechHaven 服务器直部署

该方案直接通过 SSH/SCP 把本机构建产物发布到 Linux 服务器，不依赖 GitHub 或 GitHub Actions。

## 部署结果

一次命令同时发布：

- React/Vite 前端静态文件；
- Agent Gateway Node.js 服务；
- BFF 身份桥服务（校验产品后端会话并注入可信 actor）；
- Gateway 运行所需的共享 contracts；
- 服务启动和 systemd 安装脚本。

服务器使用版本目录和 `current` 软链接切换。Gateway 重启后若 20 秒内未通过 `/healthz`，脚本会恢复上一版本。服务器密钥保存在共享目录，不进入发布包。

### 服务端口表

| 服务    | 默认端口 | 说明                                                         |
| ------- | -------- | ------------------------------------------------------------ |
| Gateway | `3091`   | Agent 控制（`TECHHAVEN_GATEWAY_PORT`）                       |
| BFF     | `3092`   | 身份桥（`TECHHAVEN_BFF_PORT`），Nginx `auth_request` 上游    |
| Bridge  | `3093`   | 旧后端兼容层（`TECHHAVEN_BRIDGE_PORT`），MCP/Bridge 同机部署时用 |

同机启动完整链路前先跑组合检查（静态核对各服务代码默认值、`.env.example` 与 MCP 的 Bridge URL 一致，无冲突即通过）：

```bash
node scripts/check-stack-ports.mjs
```

## 前置条件

本地 Windows：

- Node.js 22.12 或更高版本；
- npm；
- OpenSSH 的 `ssh`、`scp`；
- `tar`。

Linux 服务器：

- Node.js 24（最低支持 Node.js 20）；
- npm、tar、curl；
- 可通过 SSH 登录的普通部署用户；
- Nginx 或已有 Web BFF。

服务器第一次使用时创建一个由部署用户管理的非根目录：

```bash
sudo mkdir -p /srv/techhaven
sudo chown -R "$USER":"$(id -gn)" /srv/techhaven
```

## 一条命令部署

在项目根目录运行：

```powershell
npm run deploy:server -- `
  -Server 服务器域名或IP `
  -User SSH用户 `
  -DeployRoot /srv/techhaven
```

使用指定 SSH 私钥和端口：

```powershell
npm run deploy:server -- `
  -Server example.com `
  -User deploy `
  -Port 2222 `
  -IdentityFile C:\Users\you\.ssh\id_ed25519 `
  -DeployRoot /srv/techhaven
```

脚本默认执行 `npm ci`、前端构建、Gateway 类型检查与构建，然后只上传运行所需文件。可选参数：

| 参数                    | 作用                                           |
| ----------------------- | ---------------------------------------------- |
| `-SkipInstall`          | 使用本地已有依赖，跳过两次 `npm ci`            |
| `-SkipBuild`            | 使用已有 `dist/`，跳过构建；缺少产物时仍会失败 |
| `-PackageOnly`          | 只生成压缩包，不连接服务器                     |
| `-OutputArchive <路径>` | 指定 `-PackageOnly` 的输出位置                 |

首次部署会自动生成权限为 `600` 的安全 mock 配置：

```text
/srv/techhaven/shared/gateway.env
```

因此第一次部署后可以立即验证页面和 Gateway，不需要先准备模型密钥。

## Nginx/BFF

前端静态根目录固定为：

```text
/srv/techhaven/current/frontend
```

完整示例见 `scripts/nginx-techhaven.conf.example`（含 80→443 跳转、TLS、限流、SSE 关缓冲），复制到 `/etc/nginx/sites-available/techhaven` 并替换占位符即可。核心是 SPA 回退：

```nginx
location / {
    root /srv/techhaven/current/frontend;
    try_files $uri $uri/ /index.html;
}
```

注意事项：

- 静态资源目录要用 `current` 软链接，不要写死某个版本目录，否则发版后 Nginx 仍指向旧文件；
- 带指纹的 `/assets/*` 可长缓存，`index.html` 必须禁用缓存；
- 证书优先用 `certbot --nginx` 签发；试点内网可自签（命令在示例文件头部注释里）。

### BFF 身份桥（发布包自带）

浏览器经 `/gateway/*` 访问 Agent API 前，Nginx 先用 `auth_request` 子请求调用同机 BFF（`127.0.0.1:3092/internal/v1/session/actor`）：

```text
浏览器 Cookie/Authorization → BFF 校验产品后端会话 → 返回 X-TechHaven-Actor: user:<id>
                                                         ↓
Nginx 注入 Authorization: Bearer <TECHHAVEN_GATEWAY_TOKEN> 与 X-TechHaven-Actor → Gateway
```

BFF 随发布包一起部署，首次部署自动生成 `/srv/techhaven/shared/bff.env`，其中 `TECHHAVEN_API_BASE` 必须指向你的**产品后端**（它调用 `/api/v1/user/info` 验证会话）。验证成功结果缓存 60 秒，并发合并，失败一律 401（失败关闭）。

安全边界：

- Gateway Token 与调用者身份只能由服务端注入，浏览器永远拿不到；Nginx 会先剥掉浏览器自报的 `X-TechHaven-Actor`；
- SSE 路由关闭代理缓冲并配置长读取超时；
- Gateway（3091）与 BFF（3092）默认只监听回环（`TECHHAVEN_GATEWAY_HOST` / `TECHHAVEN_BFF_HOST`），不应暴露公网。

## 启用真实 Agent

编辑服务器文件 `/srv/techhaven/shared/gateway.env`：

```dotenv
TECHHAVEN_GATEWAY_TOKEN=<保留首次生成的随机值>
TECHHAVEN_GATEWAY_PORT=3091
TECHHAVEN_ENGINE_DRIVER=dsh
TECHHAVEN_GATEWAY_STORE=jsonl
TECHHAVEN_GATEWAY_DATA_DIR=/srv/techhaven/shared/data
TECHHAVEN_PROPOSALS_FILE=/srv/techhaven/shared/proposals.jsonl

# 会话实例 ID：多机/滚动发布时每台 Gateway 必须唯一（4–128 字符）
TECHHAVEN_GATEWAY_INSTANCE_ID=<主机名或实例标识>

TECHHAVEN_DSH_HOME=/srv/techhaven/shared/dsh
TECHHAVEN_DSH_PROFILE=<部署使用的dsh-profile>

TECHHAVEN_AI_CONFIG_URL=https://产品后端/internal/v1/agent/ai-config
TECHHAVEN_AI_CONFIG_SERVICE_TOKEN=<内部服务令牌>
TECHHAVEN_AI_CONFIG_TIMEOUT_MS=5000

TECHHAVEN_DSH_PROVIDER_OPENAI=openai
TECHHAVEN_DSH_PROVIDER_CLAUDE=anthropic
TECHHAVEN_DSH_PROVIDER_GLM=glm
```

### 组织授权（会话创建准入，必读）

自 2026-09 审查勘误起，`POST /v1/sessions` 在创建会话前校验「调用者属于目标组织」：

- 配置了 `TECHHAVEN_AI_CONFIG_URL`（Agent DB 配置资产）时，Gateway 以产品库 `ai_org_memberships` 为权威校验成员关系——这是推荐路径；
- **真实 dsh 链路若既无授权源也未配置，创建会话会直接返回 503（fail-closed）**，这是预期行为，不是故障；
- `TECHHAVEN_ORG_ACCESS_ALLOW_ALL=1` 逃生舱仅在 mock driver 下允许，真实部署设置会导致启动失败；
- mock driver 本地演示默认放行，无需额外配置。

### dsh 会话的 MCP 凭据链

随附 dsh profile 挂载的 TechHaven MCP 需要 `TECHHAVEN_AGENT_TOKEN` / `TECHHAVEN_TOKEN_SECRET`。Gateway 现在会在会话启动时构造会话级 MCP 上下文（白名单凭据键 + sid/org 绑定）注入 dsh 子进程隔离环境，不再依赖父环境继承；启用用户模型配置 + 随附 MCP profile 的组合路径可正常完成 MCP 初始化。验证要点：proposal 事件携带的 sid/org 必须与 Gateway 会话一致。

重新运行同一条 `npm run deploy:server` 即可安装固定版本的 dsh runtime、切换版本并重启。

产品后端需要同时提供：

- 面向已登录用户的 `GET/PUT /api/v1/user/ai-config`；
- 只允许 Gateway 服务身份访问的 `GET /internal/v1/agent/ai-config?user_id=<id>`；
- 内部接口返回可运行的完整密钥，浏览器接口只返回脱敏密钥；
- `provider`、`response_type`、`url`、`model`、`reasoning_effort`、`max_tokens` 字段。

## 安装开机自启

第一次发布成功后执行一次：

```bash
sudo /srv/techhaven/current/scripts/install-agent-gateway-systemd.sh \
  /srv/techhaven "$USER"
```

以后部署脚本会自动通过 systemd 重启。没有安装 systemd 时，也会使用仓库内的无 root 进程管理脚本运行。

## 验证与排障

```bash
curl http://127.0.0.1:3091/healthz
curl http://127.0.0.1:3092/healthz
curl -H "Authorization: Bearer <gateway-token>" http://127.0.0.1:3091/metrics
/srv/techhaven/current/scripts/agent-gateway-service.sh status /srv/techhaven
/srv/techhaven/current/scripts/bff-service.sh status /srv/techhaven
tail -n 100 /srv/techhaven/shared/gateway.log
tail -n 100 /srv/techhaven/shared/bff.log
```

`/metrics` 以 Prometheus 文本格式输出进程存活时间、内存、按状态会话数与 SSE 订阅数，可用任意监控栈抓取或人工巡检。

如果发布后健康检查失败，脚本会自动回滚并输出最近 100 行日志。成功发布后保留最近 5 个版本。

当前自动发布只包含前端和 Agent Gateway。若要启用工单查询、proposal 审批和旧产品域写入，还需要另外部署 `services/techhaven-mcp` 与 `services/techhaven-agent-bridge`，并完成真实后端和 PostgreSQL 联调：

- Bridge 监听 `127.0.0.1:3093`（3092 已分配给 BFF），MCP 的 `TECHHAVEN_BRIDGE_URL` 指向它；部署前跑 `node scripts/check-stack-ports.mjs` 确认全链路端口表一致；
- MCP 的提案状态机含 `applying` 应用领取态：Bridge/MCP 与 Gateway 需同版本升级（contracts 已同步 `applying`），旧版 Gateway 会把新状态当成未知值；
- 使用 PostgreSQL 权威模式时，先按顺序应用 `docs/agent-db/migrations/` 的 005（提案 applying 态）、006（会话实例归属）迁移再切换服务；PG 部署默认单活（advisory lock），多实例联调前不要并发启动第二个 Gateway。
