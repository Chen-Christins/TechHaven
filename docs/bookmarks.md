# 我的收藏（Bookmarks）

入口：个人中心（`/personal?tab=bookmarks`）→ 我的收藏 Tab。
对应组件：`src/pages/blog/BookmarksTab.tsx`（外壳 `src/pages/blog/Bookmarks.tsx` 已废弃，仅保留 Tab）。
共享 mock：`src/pages/blog/mockBlog.ts` 的 `MOCK_ARTICLES` / `BlogArticle`。

## 数据模型

```ts
interface BlogArticle {
  id: string;
  title: string;
  summary: string;
  author: string;
  category: string;
  tags: string[];
  date: string;        // "YYYY-MM-DD"
  views: number;
  likes: number;
  cover?: string;
}

interface BookmarkFolder {
  id: string;
  name: string;        // 如 "全部收藏" / "前端进阶"
  articleIds: string[]; // 该收藏夹下的文章 id
}

interface ReadLaterItem extends BlogArticle {
  addedAt: string;     // 加入时间 "YYYY-MM-DD"
  read: boolean;       // 是否已读
}
```

## 接口

### GET /api/v1/user/bookmarks/folders
获取收藏夹列表。

**响应 data**
```json
[
  { "id": "all", "name": "全部收藏", "articleIds": ["1","2","4","5"] },
  { "id": "fe",  "name": "前端进阶",  "articleIds": ["1","4"] }
]
```
前端按 `articleIds` 到 `BlogArticle` 列表取详情渲染；建议后端直接返回展开的文章对象以减少前端拼接。

### GET /api/v1/user/bookmarks/read-later
获取稍后读列表（已展开文章字段）。

**响应 data**
```json
[
  {
    "id": "3",
    "title": "用 echarts 打造研发燃尽图",
    "summary": "…",
    "author": "王磊",
    "category": "可视化",
    "tags": ["echarts","研发"],
    "date": "2026-07-02",
    "views": 642,
    "likes": 51,
    "addedAt": "2026-07-11",
    "read": false
  }
]
```

### DELETE /api/v1/user/bookmarks/folders/:folderId/articles/:articleId
将文章移出收藏夹（对应前端 `removeFromFolder`）。

**响应 data**：空对象或更新后的收藏夹。

### PATCH /api/v1/user/bookmarks/read-later/:id
切换稍后读已读 / 未读状态（对应前端 `toggleRead`）。

**请求体**
```json
{ "read": true }
```

**响应 data**：更新后的 `ReadLaterItem`。

### DELETE /api/v1/user/bookmarks/read-later/:id
从稍后读移除（对应前端 `removeReadLater`）。

**响应**：成功返回空 `data`。

## 备注
- 两个子模块通过顶部 Tab 切换：`collections`（收藏夹）与 `readlater`（稍后读）。
- 文章详情字段与博客域共享，后端可复用文章服务。
