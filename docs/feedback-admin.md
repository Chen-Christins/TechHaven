# 反馈管理（Feedback Management）

入口：管理后台 → 运营管理 → 反馈管理（`/admin/feedbacks`，dev-only）。
对应组件：`src/pages/admin/FeedbackManagement.tsx`。

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

- 当前页面使用 mock 数据（`buildMockFeedbacks`），后端接口未实现。
- 分页、搜索、类型筛选均为前端过滤 mock 数据，待后端接口就绪后替换为服务端分页查询。
- 支持的反馈类型常量见 `TYPE_LABELS`、`TYPE_OPTIONS`。
