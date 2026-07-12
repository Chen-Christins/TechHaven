# 接口与数据协议（前端新增界面）

本目录收录本次新增的 5 个用户界面所需的接口与数据协议。这些界面当前均使用 `src` 内的本地 mock 数据渲染，下列协议用于指导后端对接时提供一致的契约。

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
- **约定说明**：下列协议中的字段、枚举值与前端 mock 一一对应；请求/响应示例省略 `HttpResponse` 外层，仅展示 `data` 部分。
