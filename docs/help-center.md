# 帮助中心（Help Center）

入口：顶栏导航 → 帮助（`/help`）。
对应组件：`src/pages/user/HelpCenter.tsx`。

## 数据模型

```ts
interface Faq {
  id: string;
  q: string;          // 问题
  a: string;          // 答案
  cat: string;        // 分类名，如 "入门" / "账户安全" / "组织协作" / "研发平台"
}

type FeedbackType = "bug" | "feature" | "other";

interface FeedbackPayload {
  type: FeedbackType; // bug=问题反馈, feature=功能建议, other=其他
  content: string;    // 详细描述（必填）
  contact?: string;   // 联系方式（选填）
}
```

分类常量（前端展示用，可后端返回或前端固定）：
`入门` / `账户安全` / `组织协作` / `研发平台`。

## 接口

### GET /api/v1/help/faqs
获取常见问题列表，支持按关键词与服务端筛选。

**Query**：`?keyword=两步验证`（可选）

**响应 data**
```json
[
  {
    "id": "4",
    "cat": "账户安全",
    "q": "如何开启两步验证？",
    "a": "前往「账户安全」页面，打开「两步验证」开关并按提示绑定验证器即可。"
  }
]
```

### POST /api/v1/help/feedback
提交用户反馈（对应前端 `submitFeedback`，`content` 为空时前端拦截）。

**请求体**
```json
{
  "type": "bug",
  "content": "私信页面在移动端偶尔无法展开聊天窗",
  "contact": "user@example.com"
}
```

**响应 data**：成功返回 `{ "id": "fb_20260712_001" }` 或空对象；`content` 缺失应返回 `errno` 参数错误。

## 备注
- 反馈列表在前端以手风琴（accordion）展示，同一时间仅展开一项（`openId`）。
- 分类卡片上的计数由 `FAQS.filter(f => f.cat === name).length` 计算，后端可按 `cat` 聚合返回。
