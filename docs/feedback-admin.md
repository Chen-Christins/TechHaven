# 反馈管理（Feedback Management）

入口：管理后台 → 运营管理 → 反馈管理（`/admin/feedbacks`，dev-only）。
对应组件：`src/pages/admin/FeedbackManagement.tsx`。

> 实现状态：`implemented (client-wired)`。反馈、FAQ 与转换操作已通过 `HelpService` 调用服务端接口，组织选项通过 `OrganizationService` 获取；本轮只核对静态调用链，live 后端、权限和事务一致性仍为 `unverified`。

## 数据模型

```ts
type FeedbackType = "bug" | "feature" | "other";

interface FeedbackItem {
  id: string;
  type: FeedbackType;       // bug=问题反馈, feature=功能建议, other=其他
  content: string;           // 反馈内容
  contact?: string;          // 联系方式（选填）
  created_at: number;        // 时间戳
}
```

## 接口

### GET /api/v1/admin/feedback/list
获取反馈列表。

**响应 data**
```json
[
  {
    "id": "fb_001",
    "type": "bug",
    "content": "私信页面在移动端偶尔无法展开聊天窗",
    "contact": "user@example.com",
    "created_at": 1720771200000
  }
]
```

### POST /api/v1/admin/feedback/delete
删除指定反馈。

**请求体**
```json
{
  "id": "fb_001"
}
```

**响应 data**：`{}`

### POST /api/v1/admin/feedback/convert
将反馈转换为常见问题 / 需求 / 缺陷。

**请求体**
```json
{
  "id": "fb_001",
  "target": "faq",
  "title": "关于私信问题的处理办法",
  "content": "私信页面在移动端偶尔无法展开聊天窗",
  "cat": "常见问题分类"
}
```

**字段说明**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 反馈 ID |
| `target` | "faq" \| "requirement" \| "bug" | 是 | 转换目标类型 |
| `title` | string | 是 | 转换后标题 |
| `content` | string | 否 | 转换后内容，不传则复用原反馈内容 |
| `cat` | string | 否 | 仅 `target="faq"` 时有效，常见问题分类 |
| `orgId` | string | 否 | 仅 `target="requirement" \| "bug"` 时可选，指派目标组织 ID |

**响应 data**：`{ "id": "converted_001" }`

## 备注

- 反馈列表已使用服务端分页、搜索和类型筛选；FAQ 搜索仍在前端对已加载列表进行过滤。
- “转 FAQ / 需求 / Bug”依赖服务端保证幂等与事务一致性，进入试点前需按 [`ROADMAP.md`](ROADMAP.md) R2 做 live 集成验证。
- 支持的反馈类型常量见 `TYPE_LABELS`、`TYPE_OPTIONS`。
