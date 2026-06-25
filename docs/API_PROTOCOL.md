# 后端 API 协议汇总

> 生成日期：2026-06-22  
> 状态说明：✅ 已接入 ｜ ⚠️ Mock 待后端 ｜ 🔧 前端已就绪，接口待定义

---

## 通用规范

### 请求基础

| 项目 | 值 |
|------|-----|
| 基础路径 | `/api/v1`（Vite 代理转发） |
| 鉴权方式 | `Authorization: Bearer <token>`（内存存储 TokenManager） |
| WebSocket | `ws://<host>/ws/v1/notification`、`ws://<host>/ws/v1/presence` |

### 响应格式

```json
{
  "code": 0,
  "errno": 0,
  "message": "success",
  "data": { ... },
  "success": true
}
```

- `code` / `errno` = 0 表示成功，非 0 为业务错误
- 错误码映射表：`GET /api/v1/error-codes?lang=zh`（启动时加载）

### Content-Type

| 类型 | 说明 |
|------|------|
| `application/x-www-form-urlencoded` | 默认，大多数接口使用 |
| `application/json` | RD 平台编辑接口、站点设置保存、AI 配置 |
| `multipart/form-data` | 文件上传 |

---

## 1. 用户 / 认证模块

### 1.1 登录

```
POST /user/login
Content-Type: application/x-www-form-urlencoded

Req: auth_id=<string>&passwd=<string>
Rsp: { code, data: { token?: string, user?: UserInfo }, message }
```

### 1.2 发送验证码

```
POST /user/send_code

Req: email=<string>&agent=<string>&type=<string>
     type: register | login | reset | email_change
Rsp: { code, message }
```

### 1.3 注册

```
POST /user/create

Req: account=<string>&email=<string>&passwd=<string>&auth_code=<string>
Rsp: { code, message }
```

### 1.4 登出

```
GET /user/logout
Rsp: { code, message }
```

### 1.5 获取用户信息

```
GET /user/info?user_id=<optional>

Rsp: { code, data: {
  id, account, name, email, avatar?, bio?, website?, github?,
  role, login_time, status, following_count?, follower_count?
}}
```

### 1.6 获取所有用户 ID 列表

```
GET /user/list
Rsp: { code, data: { ids: Array<number|string> } }
```

### 1.7 更新个人资料

```
POST /user/update
Content-Type: application/x-www-form-urlencoded

Req: name?=<string>&passwd?=<string>&bio?=<string>&website?=<string>
     &github?=<string>&old_passwd?=<string>&avatar?=<string>
Rsp: { code, message }
```

### 1.8 忘记密码

```
POST /user/forget_passwd

Req: email=<string>&passwd=<string>&auth_code=<string>
Rsp: { code, message }
```

### 1.9 用户统计（个人中心）

```
GET /user/stats?user_id=<optional>

Rsp: { code, data: {
  total_articles, published_articles, private_articles,
  total_views, total_likes, total_comments,
  total_tags, total_organizations
}}
```

### 1.10 检查用户是否存在

```
GET /user/exists?auth_id=<string>
Rsp: { code, data: { is_exists: "0" | "1" } }
```

### 1.11 批量查询用户

```
GET /user/query?user_ids=<comma-separated>
Rsp: { code, data: [{ id, name }] }
```

### 1.12 关注 / 取消关注

```
POST /user/follow       Req: following_id=<string>
POST /user/unfollow     Req: following_id=<string>
GET  /user/is_following?user_id=<string>  → { is_following: boolean }
```

### 1.13 关注 / 粉丝列表

```
GET /user/following/list?user_id?=<string>&offset?=<int>&size?=<int>
GET /user/follower/list?user_id?=<string>&offset?=<int>&size?=<int>

Rsp: { code, data: { total, list: [{ id, name, avatar, bio }] } }
```

### 1.14 AI 接口配置

```
GET  /user/ai-config  → { code, data: AiConfig | null }
PUT  /user/ai-config
     Req(JSON): { type, url, api_key, model?, max_tokens? }
```

### 1.15 用户组织列表

```
GET /user/organization/list

Rsp: { code, data: {
  list: [{ id, org_id, org_name, org_description, type, role, join_time, count }]
}}
```

### 1.16 用户作业列表

```
GET /user/assignment/list
Rsp: { code, data: { total, list: [...] } }
```

---

## 2. 管理员 - 用户管理

### 2.1 用户列表

```
GET /user/admin/lists?page_num=<int>&page_size=<int>&role?=<string>&state?=<string>&days?=<int>
Rsp: { code, data: { total, list: [UserInfo] } }
```

### 2.2 创建 / 更新 / 删除用户

```
POST /user/admin/create
Req: account=<string>&email=<string>&passwd=<string>&role=<string>&state=<string>

PUT  /user/admin/update
Req: user_id=<string>&account?=<string>&email?=<string>&role?=<string>&state?=<string>&passwd?=<string>

POST /user/admin/delete
Req: user_id=<string>
```

### 2.3 用户详情 & 统计

```
GET /user/admin/detail?user_id=<string>
GET /user/admin/stats
  → { total_users, active_users, new_users_30d, inactive_users }
```

---

## 3. 文章模块

### 3.1 文章列表

```
GET /article/query?page_from=<int>&page_size?=<int>&state?=<string>&user_id?=<string>
GET /article/list_by_label?label_id=<string>&page_from=<int>&page_size?=<int>
GET /article/list_by_category?category_id=<string>&page_from=<int>&page_size?=<int>

Rsp: { code, data: { total, list: [ArticleInfo] } }
```

### 3.2 文章详情

```
GET /article/detail?id=<string>&type=<string>
Rsp: { code, data: ArticleDetail }
```

### 3.3 创建 / 更新 / 删除

```
POST /article/create
Req: title=<string>&content=<string>&type=<string>&label?=<string>&category?=<string>
Rsp: { code, data: { id } }

POST /article/update
Req: id=<string>&title=<string>&content=<string>

POST /article/delete
Req: ids=<comma-separated>
Rsp: { code, data: { ids: [...] } }
```

### 3.4 发布 & 状态切换

```
POST /article/publish       Req: id=<string>&publish_time=<string>
POST /article/switch_state  Req: id=<string>&new_state=<string>
```

### 3.5 更新文章分类

```
POST /article/update_category
Req: id=<string>&add_category_ids=<comma>&del_category_ids=<comma>
```

### 3.6 文章浏览量

```
POST /article/view
Req: article_id=<string>
Rsp: { code, data: { views: number } }
```

### 3.7 文章日历

```
GET /article/calendar?year=<int>&month=<int>
Rsp: { code, data: { year, month, articleDays: [...] } }
```

### 3.8 AI 摘要（SSE 流式）

```
POST /article/ai-summary
Content-Type: application/x-www-form-urlencoded

Req: article_id=<string>
Rsp: SSE stream (text/event-stream)
     事件类型: start → chunk* → done
     每条 chunk 携带 data 字段
```

---

## 4. 管理员 - 文章管理

### 4.1 文章列表

```
GET /article/admin/lists?page_num=<int>&page_size=<int>&state?=<string>&category_id?=<string>&role?=<string>&days?=<int>&keyword?=<string>
Rsp: { code, data: { total, list: [...] } }
```

### 4.2 审核 & 统计

```
POST /article/verify     Req: id=<string>&state=<string>
GET  /article/admin/stats?category_id?=<string>&role?=<string>&days?=<int>&keyword?=<string>
  → { total_articles, pending_articles, published_articles, rejected_articles, reported_articles }
```

---

## 5. 评论模块

### 5.1 文章评论

```
GET  /article/comment/list?article_id=<string>&offset?=<int>&size?=<int>
GET  /article/comment/replies?comment_id=<string>&offset?=<int>&size?=<int>

POST /article/comment/create  Req: article_id=<string>&content=<string>&parent_id?=<string>
POST /article/comment/update  Req: id=<string>&content=<string>
POST /article/comment/delete  Req: id=<string>
POST /article/comment/praise  Req: comment_id=<string>  → { praised }
```

### 5.2 管理员评论管理

```
GET  /admin/comment/list?page_num=<int>&page_size=<int>&status?=<string>&keyword?=<string>&article_id?=<string>&is_reported?=<bool>
POST /admin/comment/approve  Req: ids=<comma>
POST /admin/comment/reject   Req: ids=<comma>
POST /admin/comment/spam     Req: ids=<comma>
POST /admin/comment/delete   Req: ids=<comma>
GET  /admin/comment/stats    → CommentStats
```

---

## 6. 点赞模块

```
POST /article/praise          Req: article_id=<string>  → { praised }
GET  /article/is_praising?article_id=<string>           → { is_praising: boolean }
GET  /article/praise/list?article_id?=<string>&user_id?=<string>&offset?=<int>&size?=<int>
```

---

## 7. 分类模块

```
GET  /category/admin/query                    → CategoryInfo (树形)
POST /category/admin/create
     Req: id?=<string>&name=<string>&color=<string>&icon=<string>&url=<string>&desc?=<string>&status?=<string>&parent_id?=<string>
POST /category/admin/delete
     Req: ids=<comma> → { ids: [...] }
```

---

## 8. 标签模块

```
GET  /label/query?ids?=<comma>&user_id?=<string>    → [LabelInfo]
POST /label/create  Req: id?=<string>&name=<string>&color=<string>&desc?=<string>
                    → { id, name, color, desc, create_time }
POST /label/delete  Req: ids=<comma> → { ids: [...] }
```

---

## 9. 通知模块

### 9.1 用户通知

```
GET  /notification/list?offset?=<int>&size?=<int>&type?=<string>
     → { total, list: [Notification] }
GET  /notification/unread_count → { count }
POST /notification/read?id=<string>         (单条已读)
POST /notification/read?ids=<comma>         (批量已读)
POST /notification/read_all                 (全部已读)
```

### 9.2 管理员发送通知

```
POST /notification/send
Req: title=<string>&content=<string>&type=<string>&target=<string>&user_ids?=<comma>
```

### 9.3 WebSocket 推送

```
ws://<host>/ws/v1/notification?uid=<string>&token=<string>&token_time=<int>
```

---

## 10. 组织模块

### 10.1 组织列表 / 详情

```
GET  /organization/list?status?=<string>
     → { total, list: [OrgInfo] }
GET  /organization/detail?id=<string>
     → { id, name, type, status, description, user_in_org?, user_role? }
```

### 10.2 创建 / 加入 / 申请

```
POST /organization/create
Req: id?=<string>&name=<string>&type=<string>&status=<string>&desc?=<string>

POST /organization/join
Req: id=<string> → { id, user_in_org }

POST /organization/apply-create
Req: name=<string>&type=<string>&desc?=<string> → { apply_id }
```

### 10.3 成员管理

```
GET  /organization/user_list?id=<string>&page_num=<int>&page_size=<int>&status=<int>
     (status: 1=已加入, 0=待审核)
     → { total, list: [{ id, user_id, name, avatar, email, role, join_time }] }

POST /organization/join_check
Req: user_id=<string>&org_id=<string>&state=<int>&role?=<int>
     (state: 1=同意, 2=拒绝)

POST /organization/user_kick
Req: id=<string>&user_id=<string>&org_id=<string>

POST /organization/user_switch_role
Req: id=<string>&user_id=<string>&org_id=<string>&role=<int>
```

### 10.4 管理员 - 组织管理

```
GET  /organization/admin/lists?page_num=<int>&page_size=<int>&status?=<string>
GET  /organization/admin/stats
     → { total_organizations, active_organizations, inactive_organizations }
POST /organization/delete  Req: ids=<comma>
```

### 10.5 组织申请审核

```
GET  /organization/apply-list?page_num=<int>&page_size=<int>&status?=<string>
GET  /organization/my-applies?page_num=<int>&page_size=<int>
POST /organization/apply-review
Req: apply_id=<string>&action=<string>&reason?=<string> → { org_id? }
```

### 10.6 组织仓库列表 ⚠️

```
⚠️ Mock 阶段，后端待实现（当前使用 OrganizationRepos.tsx 内 mockRepos 数组）
⚠️ 注意：框架按路径注册 servlet，不支持同路径多方法分发，因此 add/delete 使用独立路径

GET  /organization/repos?org_id=<string>&page?=<int>&page_size?=<int>
     → { list: [Repo{ id, name, description, url, language, stars_count, updated_at }], total }

POST /organization/repos/add
     Req: org_id=<string>&name=<string>&url=<string>&language?=<string>&description?=<string>
     → { id }
     权限：研发主管及以上

POST /organization/repos/delete
     Req: id=<string>&org_id=<string>
     权限：研发主管及以上

GET  /organization/repos/stats?org_id=<string>
     → { total_repos }
```

---

## 11. 作业模块

### 11.1 全局作业（管理员）

```
POST /assignment/create
Req: id?=<string>&name=<string>&subject_name=<string>&end_time=<unix>&file_size=<int>&status=<int>&priority=<int>&file_type=<string>&description=<string>

GET  /assignment/admin/lists?page_num=<int>&page_size=<int>&state?=<int>
GET  /assignment/admin/stats
     → { total_assignments, active_assignments, closed_assignments, draft_assignments }
POST /assignment/delete  Req: ids=<comma>
```

### 11.2 组织作业

```
POST /organization/assignment_create
Req: assign_id?=<string>&org_id=<string>&name=<string>&subject_name=<string>&end_time=<unix>&max_size=<int>&status=<int>&priority=<int>&file_type=<string>&description=<string>
     (有 assign_id 时为更新，否则创建)

GET  /organization/assignment_list?org_id=<string>&page_num=<int>&page_size=<int>&status?=<int>
```

### 11.3 作业详情 / 提交

```
GET /assignment/detail?id=<string>
    → { id, name, subject_name, end_time, max_size, status, priority, file_type, description }

GET /assignment/submission/list?assign_id=<string>
    → { list: [Submission{ id, user_id, user_name, file_url, submit_time, score? }] }
```

---

## 12. 文件上传模块

### 12.1 简单上传

```
POST /file/upload
Content-Type: multipart/form-data

Req: dir_name=<string>&biz_info=<string>&file=<File>
Rsp: { code, data: { file_path, url } }
```

### 12.2 分片上传

```
POST /upload/init
Headers: X-Upload-Type, X-Upload-Filename, X-Upload-Total-Size, X-Upload-Total-Chunks,
         X-Upload-Chunk-Size, X-Upload-Biz-Info, X-Upload-Dir-Name
→ { upload_id }

POST /upload/chunk
Headers: X-Upload-Type, X-Upload-Id, X-Upload-Chunk-Index, X-Upload-Chunk-Offset, X-Upload-Chunk-Size
Body: binary chunk

POST /upload/complete
Headers: X-Upload-Type, X-Upload-Id
→ { file_path }

POST /upload/cancel
Headers: X-Upload-Type, X-Upload-Id

GET  /upload/status
Headers: X-Upload-Type, X-Upload-Id
→ ChunkUploadStatus
```

### 12.3 文件下载

```
POST /file/download
Req: url=<string>&fileName=<string>
Rsp: Blob (文件流)
```

---

## 13. 研发平台（RD Platform）

### 13.1 仪表盘统计

```
GET /rd/stats?org_id?=<string>
Rsp: { code, data: {
  total_requirements, open_requirements,
  total_bugs, unresolved_bugs,
  total_tasks, overdue_tasks,
  total_reviews, pending_reviews     ← reviews 字段后端待实现
}}
```

### 13.2 需求管理

```
GET  /rd/requirements?page=<int>&page_size=<int>&org_id?=<string>&search?=<string>&status?=<string>&priority?=<string>
     → { list: [Requirement], total }

GET  /rd/requirements/detail?id=<string>    → Requirement

POST /rd/requirements/edit                   (创建)
     Req(JSON): { title, description, priority, status, org_id, assignee, creator,
                  assignee_id, iteration, category, source }
     → Requirement

POST /rd/requirements/edit                   (更新)
     Req(JSON): { id, title?, description?, priority?, status?, assignee?,
                  assignee_id?, org_id?, iteration?, category?, source? }
     → Requirement | null

POST /rd/requirements/delete
     Req(JSON): { id, org_id }
```

### 13.3 缺陷管理

```
GET  /rd/bugs?page=<int>&page_size=<int>&org_id?=<string>&search?=<string>
     &status?=<string>&severity?=<string>&priority?=<string>
     → { list: [Bug], total }

GET  /rd/bugs/detail?id=<string>            → Bug

POST /rd/bugs/edit                            (创建)
     Req(JSON): { title, description, severity, priority, status, org_id,
                  assignee, creator, assignee_id, related_requirement_id,
                  module, steps_to_reproduce, environment }
     → Bug

POST /rd/bugs/edit                            (更新)
     Req(JSON): { id, title?, description?, severity?, priority?,
                  status?, assignee?, assignee_id?, org_id?,
                  related_requirement_id?, module?, steps_to_reproduce?, environment? }

POST /rd/bugs/delete
     Req(JSON): { id, org_id }
```

### 13.4 任务管理

```
GET  /rd/tasks?page=<int>&page_size=<int>&org_id?=<string>&search?=<string>&status?=<string>&priority?=<string>&assignee_id?=<string>
     → { list: [Task], total }

GET  /rd/tasks/detail?id=<string>            → Task

POST /rd/tasks/edit                           (创建)
     Req(JSON): { title, description, priority, status, org_id, assignee, creator,
                  assignee_id, requirement_id, deadline, estimated_hours }

POST /rd/tasks/edit                           (更新)
     Req(JSON): { id, title?, description?, priority?, status?, assignee?,
                  assignee_id?, org_id?, requirement_id?, deadline?, estimated_hours? }

POST /rd/tasks/delete
     Req(JSON): { id, org_id }
```

### 13.5 我的工单 & 组织成员

```
GET /rd/my-tickets?type=<requirement|bug|task>&page?=<int>&pageSize?=<int>&search?=<string>&status?=<string>&org_id?=<string>
   → { list: [Requirement|Bug|Task], total }

GET /rd/organizations/members?org_id=<string>
   → { list: [{ user_id, name, role, avatar }] }

GET /rd/organizations
   → { list: [{ org_id, org_name, role }] }
```

### 13.6 权限校验

```
GET /rd/check_access
Rsp: { code, data: { can_access: "0"|"1", reason? } }
```

### 13.7 代码审查 ⚠️

```
⚠️ Mock 阶段，后端待实现（当前使用 RdMockService 内存数据）

GET    /rd/reviews?page=<int>&page_size=<int>&org_id?=<string>&search?=<string>&status?=<string>&priority?=<string>
       → { list: [CodeReview], total }

GET    /rd/reviews/detail?id=<string>
       → CodeReview

GET    /rd/reviews/stats?org_id?=<string>
       → { total_reviews, pending_reviews }

DELETE /rd/reviews/delete
       Req(JSON): { id, org_id }
```

### 13.8 趋势分析 ⚠️

```
⚠️ Mock 阶段，后端待实现（当前页面使用 TrendAnalysis.tsx 本地 mock 数据）

GET /rd/trends?org_id?=<string>&period_days?=<7|30>&start_date?=<YYYY-MM-DD>&end_date?=<YYYY-MM-DD>&granularity?=<day|week|month>
   → {
       summary: {
         completed_total, bug_total, avg_review_pass_rate, avg_cycle_time,
         task_delta, cycle_delta
       },
       series: [{
         date, requirements, bugs, tasks, completed, reopened,
         review_pass_rate, cycle_time
       }],
       work_distribution: {
         requirement_delivery, bug_fix, rd_task, code_review
       },
       team_health: {
         throughput, bug_pressure, review_efficiency, rework_risk
       },
       insights: [{ title, content }]
     }

详细字段、权限、指标口径和示例见 docs/RD_TREND_ANALYSIS_BACKEND.md
```

---

## 14. 仪表盘（管理后台）

```
GET /admin/dashboard/stats
→ { total_users, active_users, new_users_30d, total_articles, pending_articles,
    published_articles, total_comments, reported_comments }

GET /admin/dashboard/trend?period=<int>        (默认 7 天)
→ { list: [{ date, visits }], total_visits, avg_visits, max_visits }

GET /admin/dashboard/activities?limit=<int>    (默认 5)
→ { list: [{ time, action, user, detail }] }

GET /admin/dashboard/recent-users?limit=<int>  (默认 5)
→ { list: [{ id, name, avatar, created_at }] }
```

---

## 15. 站点设置

```
GET  /site/settings    → PublicSiteSettings (无需鉴权)
GET  /site/status      → { maintenanceMode: boolean } (无需鉴权)

GET  /admin/settings   → AllSettings (需管理员权限)
PUT  /admin/settings
     Req(JSON): AllSettings

POST /admin/settings/upload
     Content-Type: multipart/form-data
     Req: file=<File>&type=<siteIcon|siteLogo|favicon>
     → { url }
```

---

## 16. 站点统计

```
GET /stats
→ { online_users, today_visits, total_visits, total_visitors }
```

---

## 附录 A：待后端实现的接口清单

| 优先级 | 模块 | 接口 | 当前状态 |
|--------|------|------|----------|
| 高 | 代码审查 | `GET/POST/DELETE /rd/reviews` 全套 CRUD | Mock 内存数据（`rdPlatformMock.ts`） |
| 高 | RD 趋势分析 | `GET /rd/trends` | Mock 本地数据（`TrendAnalysis.tsx`），详见 `docs/RD_TREND_ANALYSIS_BACKEND.md` |
| 高 | 组织仓库 | `GET /organization/repos`、`POST /repos/add`、`POST /repos/delete`、`GET /repos/stats` | Mock 内存数据（`OrganizationRepos.tsx`） |
| 中 | RD 统计 | `total_reviews` / `pending_reviews` 字段 | 前端类型已定义，后端 `GET /rd/stats` 待新增字段 |

## 附录 B：切换 Mock → 真实 API

**代码审查**：
- 文件：`src/pages/rd-platform/CodeReviewList.tsx` 第 24 行
- Mock：`import { RdMockService as RdAPI } from "../../services/rdPlatformMock"`
- 真实：`import { RdPlatformService as RdAPI } from "../../services/rdPlatformService"`
- 同时在 `rdPlatformService.ts` 中添加对应方法

**仪表盘审查统计**：
- 文件：`src/pages/rd-platform/Dashboard.tsx` 第 33、40-43 行
- 删除 `RdMockService.getReviewStats()` 调用，直接用 `s.totalReviews` / `s.pendingReviews`

**组织仓库**：
- 文件：`src/components/organization/OrganizationRepos.tsx`
- 复用组件，将 `setTimeout(() => setRepos(mockRepos), 400)` 替换为真实 API 调用

**组织仓库统计**：
- 文件：`src/pages/organization/OrganizationDetail.tsx`
- 将 `setTimeout(() => setRepoCount(mockRepos.length), 400)` 替换为 API
