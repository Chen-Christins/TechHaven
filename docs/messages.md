# 私信（Direct Messages）

入口：顶栏头像下拉 → 私信（`/messages`）。
对应组件：`src/pages/user/Messages.tsx`（含 Navbar + Footer，聊天区自适应高度）。

## 数据模型

```ts
interface ChatMsg {
  id: string;
  fromMe: boolean;   // 是否为当前用户发送
  text: string;
  time: string;      // 展示用时间，如 "10:32" / "昨天 16:20"
}

interface Conversation {
  id: string;
  name: string;      // 对端用户昵称
  online: boolean;   // 是否在线
  lastTime: string;  // 最近消息时间
  unread: number;    // 未读条数
  messages: ChatMsg[];
}
```

## 接口

### GET /api/v1/messages/conversations
获取会话列表（含每个会话的最近消息，用于左侧列表与未读角标）。

**响应 data**
```json
[
  {
    "id": "1",
    "name": "林悦",
    "online": true,
    "lastTime": "10:32",
    "unread": 2,
    "messages": [
      { "id": "m1", "fromMe": false, "text": "在吗？", "time": "10:28" }
    ]
  }
]
```

### GET /api/v1/messages/conversations/:id
获取单个会话的完整消息记录（进入聊天窗时调用）。

**响应 data**：`ChatMsg[]`
```json
[
  { "id": "m1", "fromMe": false, "text": "在吗？", "time": "10:28" },
  { "id": "m2", "fromMe": true,  "text": "在的",   "time": "10:30" }
]
```

### POST /api/v1/messages/conversations/:id
发送一条消息（对应前端 `send`）。

**请求体**
```json
{ "text": "已经提 PR 了" }
```

**响应 data**：新建的 `ChatMsg`
```json
{ "id": "m9", "fromMe": true, "text": "已经提 PR 了", "time": "10:45" }
```
前端乐观更新本地列表，建议后端返回带服务端 `id` 与规范 `time` 的对象以便对齐。

### POST /api/v1/messages/conversations/:id/read
将某会话标记为已读（进入会话时清空 `unread`）。

**响应 data**：更新后的未读计数 `{ "unread": 0 }`。

## 备注
- 当前消息为前端内存态模拟，刷新即重置；真实环境建议配合 WebSocket（项目已有 `notificationWS` 单例）推送新消息。
- 移动端通过 CSS 类 `showChat` 在会话列表与聊天窗之间切换，接口无需区分端。
