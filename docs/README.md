# TechHaven 文档入口

## 架构与推进

- `ARCHITECTURE.md`：当前事实、目标架构、安全、数据、可靠性、可观测性与测试基线；
- `ROADMAP.md`：状态模型、R0–R5 阶段、退出门禁和指标；
- `TH-RFC-001-agent-engine.md`：Agent 集成的架构决策记录；
- `agent-db/README.md`：Agent 数据平面、schema 和权威存储迁移边界。

## 前端新增界面的接口协议

本目录还收录 6 个用户/管理界面的接口草案：账户安全、成就、收藏、反馈管理、帮助中心和私信。它们的完成度不同；文档中的接口是对接契约，不代表后端已经实现。每个页面应在自己的文档中明确 `mock`、已接线和待后端事项。

涉及界面：

| 界面 | 入口 | 文档 |
| --- | --- | --- |
| 账户安全 | 个人中心 → 账户安全 | [account-security.md](./account-security.md) |
| 我的成就 | 个人中心 → 我的成就 | [achievements.md](./achievements.md) |
| 我的收藏 | 个人中心 → 我的收藏 | [bookmarks.md](./bookmarks.md) |
| 私信 | 顶栏头像 → 私信 | [messages.md](./messages.md) |
| 帮助中心 | 顶栏 → 帮助 | [help-center.md](./help-center.md) |

## 通用约定

所有接口基于 `src/utils/http.ts` 中的 `HttpClient`，遵循以下约定：

- **Base URL**：`VITE_USE_PROXY=true` 时为 `/api/v1`，否则为 `VITE_API_BASE_URL`（如 `http://8.148.82.38:8078`）。
- **鉴权**：请求拦截器自动附加 `Authorization: Bearer <token>`，token 来自内存态 `TokenManager`（取自 `S_TOKEN` Cookie），**不**使用 localStorage。
- **响应包络（HttpResponse）**：
  ```ts
  interface HttpResponse<T = any> {
    code: number | string;
    errno?: number;      // 业务码，0 表示成功
    message?: string;
    msg?: string;
    data: T;
    success: boolean;
  }
  ```
  响应拦截器在 `errno === 0 || success` 时视为成功；`errno === 1101` 触发未登录处理（清除 token）。
- **错误码**：HTTP 状态码与业务码映射见 `src/utils/errorCodes.ts`（`getErrorMsg`）。常用：400 参数错误、401 未授权、403 状态异常、404 资源不存在、500 服务器错误。
- **约定说明**：下列协议中的字段、枚举值来自当前前端或 mock；在真实联调前属于 proposed contract。请求/响应示例省略 `HttpResponse` 外层，仅展示 `data` 部分。
