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

TECHHAVEN_DSH_HOME=/srv/techhaven/shared/dsh
TECHHAVEN_DSH_PROFILE=<部署使用的dsh-profile>

TECHHAVEN_AI_CONFIG_URL=https://产品后端/internal/v1/agent/ai-config
TECHHAVEN_AI_CONFIG_SERVICE_TOKEN=<内部服务令牌>
TECHHAVEN_AI_CONFIG_TIMEOUT_MS=5000

TECHHAVEN_DSH_PROVIDER_OPENAI=openai
TECHHAVEN_DSH_PROVIDER_CLAUDE=anthropic
TECHHAVEN_DSH_PROVIDER_GLM=glm
```

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

当前自动发布只包含前端和 Agent Gateway。若要启用工单查询、proposal 审批和旧产品域写入，还需要另外部署 `services/techhaven-mcp` 与 `services/techhaven-agent-bridge`，并完成真实后端和 PostgreSQL 联调。
