# 登录与 WebSocket 认证故障复盘

## 故障概述

生产环境曾出现登录后立即失效、页面跳转到 `/auth`，以及浏览器控制台持续输出以下错误的问题：

```text
WebSocket is closed before the connection was established
```

错误中出现的 WebSocket 地址携带了不同的 `token`。这并不表示用户主动进行了多次登录，而是前端在认证状态初始化、token 续期和 WebSocket 生命周期切换期间，重复发起了握手，并关闭了尚未完成握手的旧连接。

## 影响范围

- 登录成功后认证状态可能被错误清理，用户无法正常进入已登录页面。
- 通知、在线状态和聊天 WebSocket 可能在短时间内重复握手。
- token 采用轮换策略时，并发刷新可能让前后两个 token 互相失效。
- 浏览器控制台产生大量 WebSocket 错误，掩盖了真正的认证问题。

## 根因

### 1. Token 轮换期间重复创建连接

认证上下文中原来的 token 刷新流程是：

```text
refresh_token 返回新 token
    ↓
disconnect 旧 WebSocket
    ↓
立即 connect 新 WebSocket
```

应用同时维护通知、在线状态和聊天三个 WebSocket 单例。登录初始化、React effect、token 自动续期和 WebSocket 鉴权失败处理可能在相近时间执行，造成多个握手同时存在。

如果服务端刷新 token 后立即使旧 token 失效，那么不同握手可能分别携带 token A、B、C，最终导致部分握手被服务端拒绝。

### 2. 主动关闭 CONNECTING 状态的 WebSocket

浏览器在 WebSocket 仍处于 `CONNECTING` 状态时调用 `close()`，会报告：

```text
WebSocket is closed before the connection was established
```

这条消息本身是客户端关闭握手的结果，不等价于服务端已经返回了明确的 token 鉴权失败。但原实现把它当作普通连接异常处理，容易继续触发重连。

### 3. 旧连接的异步事件影响新连接

`onclose`、`onerror` 等 WebSocket 事件是异步触发的。旧连接关闭时，新连接可能已经被赋值给客户端对象，旧事件仍有机会修改重连状态或调度新的连接，造成连接数量继续增加。

### 4. 并发调用 refresh_token

通知 WebSocket 鉴权失败处理和 token 主动续期都可能调用 `refresh_token`。如果两个调用同时执行，后端可能连续轮换 token，前一个响应返回的 token 在后一个刷新完成后立即失效。

## 修复措施

### WebSocket 客户端

修复位于 `../src/infra/websocket.ts`：

- 为每次连接分配递增的 generation，只允许当前连接处理 `open`、`message`、`close` 和 `error` 事件。
- 记录连接是否真正触发过 `open`。
- 只有曾经成功建立过的连接断开后才自动重连。
- 握手从未成功的连接不再自动重连，避免代理拒绝或端点异常时持续刷屏。
- 自动重连定时器保存连接 generation，旧定时器不能启动新连接。
- `disconnect()` 不再主动关闭处于 `CONNECTING` 状态的 socket，避免制造误导性的浏览器错误。
- 已建立的连接才会在主动断开时调用 `close()`。
- WebSocket 建连优先读取内存中的 `TokenManager` token，保证与 HTTP 请求使用同一份当前认证凭据。
- 自动重连次数限制为有限次数，避免永久重试。

### AuthContext

修复位于 `src/contexts/AuthContext.tsx`：

- token 续期成功后只更新内存 token，不再立即断开并重建所有 WebSocket。
- 新 token 会在下一次自然重连时使用，避免在旧握手尚未完成时创建并发握手。
- token 不再根据含义不明确的 `S_TOKEN_TIME` 自动续期。

### Token 刷新

修复位于 `src/services/authService.ts`：

- `refresh_token` 保留为显式服务方法，但不再由页面初始化或 WebSocket 首次握手自动调用。
- 当前前端不根据含义不明确的 `S_TOKEN_TIME` 猜测 token 过期时间。
- 如果后端需要无感续期，应明确提供 `expires_in` 或绝对过期时间，再单独实现续期策略。

## 结果

修复后，以下行为得到保证：

1. 同一个 WebSocket 客户端不会同时维护多个有效的当前连接。
2. 旧连接的异步关闭事件不会触发新连接重连。
3. 未完成握手的连接不会被前端主动关闭并反复重试。
4. token 刷新不会立即制造新的 WebSocket 握手风暴。
5. 多个 token 刷新调用不会并发轮换服务端 token。
6. WebSocket 建连失败不会轮换 HTTP token；HTTP 请求收到明确的 `1101` 时，仍由 HTTP 层清理登录态。

## 验证

已完成：

- 增加旧连接异步关闭不触发重连的回归测试。
- 增加握手未成功时不自动重连的回归测试。
- 保留 token query 传输测试和日志脱敏测试。
- `npm run build` 通过。
- `git diff --check` 通过。

## 排查指南

如果以后再次出现该错误，应按以下顺序排查：

1. 查看 WebSocket URL 的路径，确认是 `/ws/v1/notification`、`/ws/v1/presence` 还是 `/ws/v1/messages`。
2. 查看是否存在多个不同 token 的握手请求，确认是否发生 token 轮换竞态。
3. 检查前端是否在 `CONNECTING` 状态调用了 `disconnect()` 或重复 `connect()`。
4. 检查服务端或 Nginx 是否返回了 WebSocket Upgrade：

   ```nginx
   proxy_http_version 1.1;
   proxy_set_header Upgrade $http_upgrade;
   proxy_set_header Connection "upgrade";
   ```

5. 如果前端只发起一次握手但仍然失败，再检查 WebSocket 服务端、反向代理、TLS 证书和端口可达性。
6. 控制台中由浏览器插件、性能监控脚本产生的其他异常，例如 `reportAllChanges` 的 `startTime` 错误，与本次登录认证故障无直接关系，应单独排查。

## 防止回归

- 修改认证或 WebSocket 生命周期时，必须覆盖“初始化、登录、续期、登出、路由切换和 React StrictMode”场景。
- 不允许在多个业务组件内直接管理全局 WebSocket 的连接生命周期。
- token 刷新必须通过统一的 single-flight 入口完成。
- 生产环境验证应关注 Network 面板中的 WebSocket 握手数量，而不仅是控制台错误文本。
