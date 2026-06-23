# 组织仓库 — 后端开发文档

> 生成日期：2026-06-23  
> 对应前端组件：`src/components/organization/OrganizationRepos.tsx`

---

## 1. 功能概述

在组织详情页的「仓库列表」Tab 中展示该组织关联的代码仓库，以卡片形式呈现。支持：

- **所有用户**：查看仓库列表（卡片展示）
- **leader / admin**：添加仓库、删除仓库
- **仪表盘**：组织顶部统计卡片中展示仓库总数

当前前端使用 Mock 数据（`OrganizationRepos.tsx` 内 `mockRepos` 数组），后端就绪后替换为真实 API 调用。

---

## 2. 数据库表结构

### 2.1 主表：`organization_repos`

```sql
CREATE TABLE organization_repos (
  id            BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT  COMMENT '主键',
  org_id        BIGINT UNSIGNED  NOT NULL                 COMMENT '组织 ID，关联 organizations 表',
  name          VARCHAR(128)     NOT NULL                 COMMENT '仓库名称，如 frontend-web',
  description   TEXT             DEFAULT ''               COMMENT '仓库描述',
  url           VARCHAR(512)     NOT NULL                 COMMENT '仓库地址，如 https://github.com/org/repo',
  language      VARCHAR(64)      DEFAULT ''               COMMENT '主要编程语言',
  stars_count   INT UNSIGNED     DEFAULT 0                COMMENT 'Star 数量（可定时同步）',
  sort_order    INT UNSIGNED     DEFAULT 0                COMMENT '排序权重，越大越靠前',
  created_at    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  PRIMARY KEY (id),
  INDEX idx_org_id (org_id),
  INDEX idx_org_name (org_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='组织关联仓库表';
```

### 2.2 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | BIGINT | 是 | 主键，自增 |
| `org_id` | BIGINT | 是 | 组织 ID，关联现有 `organizations` 表 |
| `name` | VARCHAR(128) | 是 | 仓库名，同一组织内不可重复（建议加唯一索引） |
| `description` | TEXT | 否 | 仓库描述，前端卡片展示时截断 2 行 |
| `url` | VARCHAR(512) | 是 | 完整仓库 URL，前端点击卡片新窗口打开 |
| `language` | VARCHAR(64) | 否 | 编程语言，前端展示为彩色圆点+语言名 |
| `stars_count` | INT | 否 | Star 数，可为 0。未来可定时从 GitHub API 同步 |
| `sort_order` | INT | 否 | 排序权重，新增时默认 0，列表按此字段 DESC + id DESC |
| `created_at` | DATETIME | 是 | 创建时间 |
| `updated_at` | DATETIME | 是 | 更新时间，自动更新 |

### 2.3 可选：语言颜色映射

前端 `OrganizationRepos.tsx` 中内置了一份语言 → 颜色映射（`languageColors`），后端不需要存储颜色。如果需要后端统一管理，可以加一张配置表或返回时附带颜色，但建议由前端维护。

---

## 3. API 规范

基础路径：`/api/v1/organization`

> **路径设计说明**：框架按路径注册 servlet，不支持同路径多方法分发（如 `POST /repos` 和 `DELETE /repos` 无法共存）。因此添加/删除使用独立路径 `/repos/add` 和 `/repos/delete`，均通过 POST 方法调用。

### 3.1 获取仓库列表

```
GET /organization/repos?org_id=<string>&page?=<int>&page_size?=<int>

Headers:
  Authorization: Bearer <token>

Query:
  org_id    string  必填  组织 ID
  page      int     选填  页码，默认 1
  page_size int     选填  每页条数，默认 20，最大 50

Response 200:
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "org_id": 123,
        "name": "frontend-web",
        "description": "前端主站项目，基于 React + TypeScript + Vite 构建...",
        "url": "https://github.com/org/frontend-web",
        "language": "TypeScript",
        "stars_count": 128,
        "sort_order": 10,
        "created_at": "2026-05-01T10:00:00Z",
        "updated_at": "2026-06-20T08:30:00Z"
      }
    ],
    "total": 6,
    "page": 1,
    "page_size": 20
  }
}

错误:
  组织不存在或无权访问 → code=403, message="无权访问该组织"
```

### 3.2 添加仓库

```
POST /organization/repos/add

Headers:
  Authorization: Bearer <token>
  Content-Type: application/x-www-form-urlencoded

Body:
  org_id       string  必填  组织 ID
  name         string  必填  仓库名称，最长 128 字符
  url          string  必填  仓库地址，最长 512 字符，需为合法 URL
  language     string  选填  编程语言，最长 64 字符
  description  string  选填  仓库描述

校验:
  - org_id 对应的组织必须存在
  - 当前用户在该组织的角色 >= 4（研发主管或组织管理员）
  - 同组织下 name 不可重复

Response 200:
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 7
  }
}

错误:
  权限不足       → code=403, message="仅研发主管及以上角色可添加仓库"
  名称重复       → code=409, message="该组织下已存在同名仓库"
  参数缺失       → code=400, message="仓库名称和地址为必填项"
```

### 3.3 删除仓库

```
POST /organization/repos/delete

Headers:
  Authorization: Bearer <token>
  Content-Type: application/x-www-form-urlencoded

Body:
  id      string  必填  仓库 ID
  org_id  string  必填  组织 ID

校验:
  - 仓库必须存在且属于该组织
  - 当前用户在该组织的角色 >= 4（研发主管或组织管理员）

Response 200:
{
  "code": 0,
  "message": "success"
}

错误:
  权限不足       → code=403, message="仅研发主管及以上角色可删除仓库"
  仓库不存在     → code=404, message="仓库不存在"
```

### 3.4 获取仓库统计（用于组织详情页顶部卡片）

```
GET /organization/repos/stats?org_id=<string>

Headers:
  Authorization: Bearer <token>

Query:
  org_id    string  必填  组织 ID

Response 200:
{
  "code": 0,
  "message": "success",
  "data": {
    "total_repos": 6
  }
}
```

> 此接口也可合并到现有的 `GET /organization/detail?id=X` 响应中，在返回体里增加 `repo_count` 字段。建议独立接口以保持兼容。

---

## 4. 权限模型

沿用现有组织角色体系（与 `organization_user_list` 中的 `role` 一致）：

| 角色 | role 值 | 查看仓库 | 添加仓库 | 删除仓库 |
|------|---------|:--------:|:--------:|:--------:|
| 普通成员 | 1 | ✅ | ❌ | ❌ |
| 报告者 | 2 | ✅ | ❌ | ❌ |
| 开发者 | 3 | ✅ | ❌ | ❌ |
| 研发主管 | 4 | ✅ | ✅ | ✅ |
| 组织管理员 | 5 | ✅ | ✅ | ✅ |

权限校验伪代码：

```
func canManageRepo(userRole int) bool {
    return userRole >= 4  // 研发主管及以上
}
```

---

## 5. 前端对接说明

### 5.1 切换 Mock → 真实 API

**文件**：`src/components/organization/OrganizationRepos.tsx`

当前（Mock）：
```tsx
useEffect(() => {
  setLoading(true);
  setTimeout(() => {
    setRepos(mockRepos);
    setLoading(false);
  }, 400);
}, [orgId]);
```

后端就绪后替换为：
```tsx
useEffect(() => {
  const fetchRepos = async () => {
    setLoading(true);
    try {
      const res = await OrganizationService.getRepos(orgId);
      setRepos(res.list);
    } catch {
      message.error("获取仓库列表失败");
    } finally {
      setLoading(false);
    }
  };
  fetchRepos();
}, [orgId]);
```

### 5.2 仓库统计卡片

**文件**：`src/pages/organization/OrganizationDetail.tsx`

当前使用 `mockRepos.length`。后端就绪后调用 `GET /organization/repos/stats` 或从组织详情接口获取 `repo_count`。

### 5.3 Service 层新增方法

**文件**：`src/services/organizationService.ts`

需要新增的方法：

```typescript
// 获取组织仓库列表
static async getRepos(orgId: string, page = 1, pageSize = 20): Promise<PaginatedResponse<Repo>>

// 添加仓库
static async addRepo(params: { orgId: string; name: string; url: string; language?: string; description?: string }): Promise<{ id: string }>

// 删除仓库
static async deleteRepo(id: string, orgId: string): Promise<void>

// 获取仓库统计
static async getRepoStats(orgId: string): Promise<{ totalRepos: number }>
```

---

## 6. 前端数据结构（TypeScript）

```typescript
// src/components/organization/OrganizationRepos.tsx
export interface Repo {
  id: string;
  name: string;
  description: string;
  url: string;
  language: string;
  languageColor: string;   // 前端计算，后端不需返回
  stars: number;            // 对应 stars_count
  updatedAt: string;        // 对应 updated_at
  organizationId: string;   // 对应 org_id
}
```

Service 层需要做 `snake_case → camelCase` 映射（与现有 `organizationService.ts` 模式一致）：
```
stars_count  → stars
org_id       → organizationId
updated_at   → updatedAt
created_at   → createdAt
```

---

## 7. 后续扩展建议

| 事项 | 说明 |
|------|------|
| **GitHub 定时同步** | 定时任务从 GitHub API 拉取 `stars_count`、`language`、`description` 更新本地数据 |
| **Webhook 集成** | 组织关联 GitHub 仓库后，可接收 push/PR 事件推送，联动代码审查模块 |
| **仓库 → CR 关联** | `organization_repos.id` 可作为外键关联到代码审查表，实现仓库维度的审查列表筛选 |
| **批量导入** | 支持通过 GitHub org name 一键导入该组织下所有公开仓库 |
