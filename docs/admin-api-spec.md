# Admin 后台 API 协议文档

---

## 目录

1. [通用约定](#1-通用约定)
2. [文章管理 - 统计指标](#2-文章管理---统计指标)
3. [任务管理 - 统计指标](#3-任务管理---统计指标)
4. [组织管理 - 统计指标](#4-组织管理---统计指标)
5. [数据管理](#5-数据管理)

---

## 1. 通用约定

### 1.1 响应包装格式

所有接口响应统一由 `HttpResponse<T>` 包装：

```json
{
  "code": 200,
  "msg": "ok",
  "success": true,
  "data": { ... }
}
```

### 1.2 业务状态码

| code | 含义 |
|------|------|
| 200 | 成功 |
| 401 | 未登录/未授权 |
| 403 | 权限不足 |
| 500 | 服务端错误 |

### 1.3 请求方式

- GET 请求：参数通过 query string 传递
- POST 请求：`Content-Type: application/x-www-form-urlencoded`，参数通过 form body 传递
- 文件上传：`Content-Type: multipart/form-data`

---

## 2. 文章管理 - 统计指标

> 页面：`/admin/articles` | 组件：`ArticleManagement.tsx`

### 2.1 获取文章统计

```
GET /article/admin/stats
```

**请求参数（可选）：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `category_id` | number | 分类ID |
| `role` | number | 作者角色：1-用户 2-管理员 3-编辑 4-审核员 |
| `days` | number | 最近N天 |
| `keyword` | string | 关键词搜索 |

**响应 `data` 字段：**

```json
{
  "total_articles": 128,
  "pending_articles": 12,
  "published_articles": 98,
  "rejected_articles": 15,
  "reported_articles": 3
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `total_articles` | number | 总文章数 |
| `pending_articles` | number | 待审核 (state=1) |
| `published_articles` | number | 已发布 (state=2) |
| `rejected_articles` | number | 已拒绝 (state=3) |
| `reported_articles` | number | 被举报 |

**前端类型（`ArticleStatsResponse`）：** 已定义在 `src/services/articleService.ts`

**前端状态：** 已对接，操作后自动刷新。

---

## 3. 任务管理 - 统计指标

> 页面：`/admin/assignments` | 组件：`AssignmentManagement.tsx`

### 3.1 获取任务统计

```
GET /assignment/admin/stats
```

无请求参数。

**响应 `data` 字段：**

```json
{
  "total_assignments": 128,
  "active_assignments": 45,
  "closed_assignments": 60,
  "draft_assignments": 23
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `total_assignments` | number | 总任务数 |
| `active_assignments` | number | 进行中 (state=1) |
| `closed_assignments` | number | 已结束 (state=2) |
| `draft_assignments` | number | 草稿箱 (state=0) |

**前端类型（`AssignmentStatsResponse`）：** 已定义在 `src/services/assignmentService.ts`

**前端状态：** 已对接，操作后自动刷新。

---

## 4. 组织管理 - 统计指标

> 页面：`/admin/organizations` | 组件：`OrganizationManagement.tsx`

### 4.1 获取组织统计

```
GET /organization/admin/stats
```

无请求参数。

**响应 `data` 字段：**

```json
{
  "total_organizations": 128,
  "active_organizations": 100,
  "inactive_organizations": 28
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `total_organizations` | number | 总组织数 |
| `active_organizations` | number | 正常 (status=1) |
| `inactive_organizations` | number | 停用 (status=0) |

**前端类型（`OrganizationStatsResponse`）：** 已定义在 `src/services/organizationService.ts`

**前端状态：** 已对接，操作后自动刷新。

---

## 5. 数据管理

> 页面：`/admin/database` | 组件：`DataManagement.tsx`  
> 三个 Tab：数据概览 / 备份管理 / 导出管理  
> **前端状态：当前使用 Mock 数据，未对接后端**

### 5.1 获取数据统计 + 存储概览

```
GET /admin/database/stats
```

无请求参数。

**响应 `data` 字段：**

```json
{
  "total_size": 53687091200,
  "used_size": 16642998272,
  "available_size": 37044092928,
  "total_records": 5000,
  "articles": 1250,
  "users": 500,
  "comments": 890,
  "categories": 15,
  "tags": 45,
  "backups": 5
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `total_size` | number | 总存储容量（字节） |
| `used_size` | number | 已使用（字节） |
| `available_size` | number | 可用空间（字节） |
| `total_records` | number | 总记录数 |
| `articles` | number | 文章数量 |
| `users` | number | 用户数量 |
| `comments` | number | 评论数量 |
| `categories` | number | 分类数量 |
| `tags` | number | 标签数量 |
| `backups` | number | 备份记录数 |

### 5.2 备份记录列表

```
GET /admin/database/backups?page_num=1&page_size=15
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `page_num` | number | 是 | 页码 |
| `page_size` | number | 是 | 每页条数 |
| `type` | string | 否 | `full` / `incremental` / `manual` |
| `status` | string | 否 | `completed` / `processing` / `failed` |
| `keyword` | string | 否 | 按名称/描述搜索 |

**响应 `data` 字段：**

```json
{
  "total": 5,
  "list": [
    {
      "id": "backup_1",
      "name": "系统完整备份",
      "type": "full",
      "size": 2048576,
      "file_count": 1250,
      "status": "completed",
      "created_at": 1732068000,
      "completed_at": 1732068900,
      "created_by": "管理员",
      "description": "包含所有文章、用户和评论数据的完整备份",
      "download_url": "/admin/database/backup/download?id=backup_1"
    }
  ]
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string/number | 备份ID |
| `name` | string | 备份名称 |
| `type` | string | `full` / `incremental` / `manual` |
| `size` | number | 文件大小（字节） |
| `file_count` | number | 文件数 |
| `status` | string | `completed` / `processing` / `failed` |
| `created_at` | number | 创建时间（Unix 时间戳） |
| `completed_at` | number | 完成时间（Unix 时间戳，可选） |
| `created_by` | string | 创建者 |
| `description` | string | 描述 |
| `download_url` | string | 下载地址（仅 completed 时存在） |

### 5.3 创建备份

```
POST /admin/database/backup
Content-Type: application/x-www-form-urlencoded
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | string | 是 | `full`（完整备份）/ `incremental`（增量备份） |
| `name` | string | 否 | 备份名称 |

**响应 `data` 字段：**

```json
{
  "id": "backup_6",
  "name": "系统完整备份",
  "type": "full",
  "size": 0,
  "file_count": 0,
  "status": "processing",
  "created_at": 1732068000,
  "created_by": "当前管理员",
  "description": "手动触发的完整备份"
}
```

> 创建后 status 为 `processing`，前端刷新列表后 status 变为 `completed`。

### 5.4 下载备份

```
GET /admin/database/backup/download?id=backup_1
```

返回文件流（`Content-Disposition: attachment`）。

### 5.5 删除备份

```
POST /admin/database/backup/delete
Content-Type: application/x-www-form-urlencoded
```

**请求参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `ids` | string | 逗号分隔的ID |

**响应 `data` 字段：**

```json
{
  "ids": ["backup_1"]
}
```

### 5.6 导出记录列表

```
GET /admin/database/exports?page_num=1&page_size=15
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `page_num` | number | 是 | 页码 |
| `page_size` | number | 是 | 每页条数 |
| `type` | string | 否 | `articles` / `users` / `comments` / `full` |
| `status` | string | 否 | `completed` / `processing` / `failed` |
| `keyword` | string | 否 | 按名称搜索 |

**响应 `data` 字段：**

```json
{
  "total": 5,
  "list": [
    {
      "id": "export_1",
      "name": "文章数据导出",
      "type": "articles",
      "format": "json",
      "size": 1048576,
      "record_count": 1250,
      "status": "completed",
      "created_at": 1732068000,
      "created_by": "管理员",
      "download_url": "/admin/database/export/download?id=export_1"
    }
  ]
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string/number | 导出ID |
| `name` | string | 导出名称 |
| `type` | string | `articles` / `users` / `comments` / `full` |
| `format` | string | `json` / `csv` / `xlsx` |
| `size` | number | 文件大小（字节） |
| `record_count` | number | 记录数 |
| `status` | string | `completed` / `processing` / `failed` |
| `created_at` | number | 创建时间（Unix 时间戳） |
| `created_by` | string | 创建者 |
| `download_url` | string | 下载地址（仅 completed 时存在） |

### 5.7 创建导出

```
POST /admin/database/export
Content-Type: application/x-www-form-urlencoded
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | string | 是 | `articles` / `users` / `comments` / `full` |
| `format` | string | 是 | `json` / `csv` / `xlsx` |
| `name` | string | 否 | 导出名称 |

**响应 `data` 字段：**

```json
{
  "id": "export_6",
  "name": "文章数据导出",
  "type": "articles",
  "format": "json",
  "size": 0,
  "record_count": 0,
  "status": "processing",
  "created_at": 1732068000,
  "created_by": "当前管理员"
}
```

### 5.8 下载导出

```
GET /admin/database/export/download?id=export_1
```

返回文件流（`Content-Disposition: attachment`）。

### 5.9 删除导出

```
POST /admin/database/export/delete
Content-Type: application/x-www-form-urlencoded
```

**请求参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `ids` | string | 逗号分隔的ID |

**响应 `data` 字段：**

```json
{
  "ids": ["export_1"]
}
```

### 5.10 导入数据（可选）

页面有「导入数据」按钮，当前无 handler。

```
POST /admin/database/import
Content-Type: multipart/form-data
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `file` | file | 导入的数据文件 |

---

## 接口汇总

| # | 接口 | 方法 | 模块 | 前端状态 |
|---|------|------|------|----------|
| 1 | `/article/admin/stats` | GET | 文章统计 | 已对接 |
| 2 | `/assignment/admin/stats` | GET | 任务统计 | 已对接 |
| 3 | `/organization/admin/stats` | GET | 组织统计 | 已对接 |
| 4 | `/admin/database/stats` | GET | 数据概览 | 待对接 |
| 5 | `/admin/database/backups` | GET | 备份列表 | 待对接 |
| 6 | `/admin/database/backup` | POST | 创建备份 | 待对接 |
| 7 | `/admin/database/backup/download` | GET | 下载备份 | 待对接 |
| 8 | `/admin/database/backup/delete` | POST | 删除备份 | 待对接 |
| 9 | `/admin/database/exports` | GET | 导出列表 | 待对接 |
| 10 | `/admin/database/export` | POST | 创建导出 | 待对接 |
| 11 | `/admin/database/export/download` | GET | 下载导出 | 待对接 |
| 12 | `/admin/database/export/delete` | POST | 删除导出 | 待对接 |
| 13 | `/admin/database/import` | POST | 导入数据 | 待对接 |
