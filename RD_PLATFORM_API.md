# R&D 平台后端接口文档

## 基础约定

- Base URL: `/api/v1/rd`
- 认证: Header `Authorization: Bearer <token>`
- 分页参数: `page` (从1开始), `page_size` (默认10)
- 响应格式: `{ code: 200, data: ..., message: "ok" }`
- 组织隔离: 非管理员用户只能访问所属组织的数据，管理员传 `org_id` 可跨组织
- **ID 参数**: 使用 query 参数 `?id=`，非 RESTful 路径参数 `/rd/requirements/detail?id=`
- **时间格式**: 返回 int64 Unix 时间戳（秒），前端需 `new Date(timestamp * 1000)` 转换
- **org_id 类型**: int64 数字类型

---

## 1. 仪表盘统计

### GET /rd/stats
获取当前用户的研发统计数据（按组织过滤）。

**Query:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| org_id | string | 否 | 筛选指定组织，不传则返回用户所有组织汇总。管理员不传返回全平台 |

**Response:**
```json
{
  "total_requirements": 42,
  "open_requirements": 18,
  "total_bugs": 31,
  "unresolved_bugs": 12,
  "total_tasks": 56,
  "overdue_tasks": 5
}
```

---

## 2. 需求管理

### GET /rd/requirements
分页查询需求列表。

**Query:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认1 |
| page_size | int | 否 | 每页条数，默认10 |
| org_id | string | 否 | 组织筛选，管理员可选，普通用户自动限定 |
| search | string | 否 | 模糊搜索标题/描述/创建人 |
| status | string | 否 | new / developing / testing / done / closed |
| priority | string | 否 | high / medium / low |

**Response:**
```json
{
  "total": 42,
  "list": [
    {
      "id": "req_001",
      "title": "用户登录页面优化",
      "description": "优化登录页面UI，增加社交账号登录...",
      "priority": "high",
      "status": "developing",
      "creator": "张三",
      "creator_id": 1001,
      "assignee": "李四",
      "assignee_id": 1002,
      "org_id": "org_1",
      "org_name": "前端团队",
      "iteration": "Sprint 12",
      "category": "前端",
      "source": "产品需求",
      "created_at": "2026-05-15T08:00:00Z",
      "updated_at": "2026-05-20T10:30:00Z"
    }
  ]
}
```

### GET /rd/requirements/detail?id=xxx
获取单个需求详情。

### POST /rd/requirements
创建需求。

**Body (JSON):**
```json
{
  "title": "用户登录页面优化",
  "description": "优化登录页面UI...",
  "priority": "high",
  "org_id": "org_1",
  "assignee_id": 1002,
  "iteration": "Sprint 12",
  "category": "前端",
  "source": "产品需求"
}
```

权限: 报告者及以上(role≥2)可在所属组织创建。

### PUT /rd/requirements/detail?id=
更新需求。

**Body (JSON):** 同创建，所有字段可选。
权限: 研发主管及以上(role≥4)可编辑所有。

### DELETE /rd/requirements/detail?id=
删除需求。权限: 研发主管及以上(role≥4)。

---

## 3. 缺陷管理

### GET /rd/bugs
分页查询缺陷列表。

**Query:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码 |
| page_size | int | 否 | 每页条数 |
| org_id | string | 否 | 组织筛选 |
| search | string | 否 | 模糊搜索标题/描述/创建人 |
| status | string | 否 | new / accepted / processing / verified / closed / reopened |
| severity | string | 否 | fatal / serious / normal / minor |
| priority | string | 否 | urgent / high / medium / low |

**Response:**
```json
{
  "total": 31,
  "list": [
    {
      "id": "bug_001",
      "title": "登录页面白屏",
      "description": "iOS Safari 浏览器下登录页面偶现白屏...",
      "severity": "serious",
      "priority": "high",
      "status": "processing",
      "creator": "张三",
      "creator_id": 1001,
      "assignee": "李四",
      "assignee_id": 1002,
      "org_id": "org_1",
      "org_name": "前端团队",
      "related_requirement_id": "",
      "module": "用户模块",
      "steps_to_reproduce": "1. 使用 iOS Safari 打开登录页\n2. 等待页面加载\n3. 偶现白屏",
      "environment": "iOS 18 Safari",
      "created_at": "2026-05-18T09:00:00Z",
      "updated_at": "2026-05-19T14:00:00Z"
    }
  ]
}
```

### GET /rd/bugs/detail?id=
获取单个缺陷详情。

### POST /rd/bugs
创建缺陷。

**Body (JSON):**
```json
{
  "title": "登录页面白屏",
  "description": "iOS Safari 白屏问题",
  "severity": "serious",
  "priority": "high",
  "org_id": "org_1",
  "assignee_id": 1002,
  "related_requirement_id": "",
  "module": "用户模块",
  "steps_to_reproduce": "1. ...\n2. ...",
  "environment": "iOS 18 Safari"
}
```

权限: 报告者及以上(role≥2)可创建。

### PUT /rd/bugs/detail?id=
更新缺陷。权限: 研发主管及以上(role≥4)可编辑所有。

### DELETE /rd/bugs/detail?id=
删除缺陷。权限: 研发主管及以上(role≥4)。

---

## 4. 任务管理

### GET /rd/tasks
分页查询任务列表。

**Query:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码 |
| page_size | int | 否 | 每页条数 |
| org_id | string | 否 | 组织筛选 |
| search | string | 否 | 模糊搜索标题/描述 |
| status | string | 否 | todo / doing / done / closed |
| priority | string | 否 | high / medium / low |
| assignee_id | int | 否 | 负责人筛选 |

**Response:**
```json
{
  "total": 56,
  "list": [
    {
      "id": "task_001",
      "title": "编写登录模块单元测试",
      "description": "为登录页面组件编写单元测试...",
      "status": "doing",
      "priority": "high",
      "assignee": "李四",
      "assignee_id": 1002,
      "org_id": "org_1",
      "org_name": "前端团队",
      "requirement_id": "",
      "deadline": "2026-05-30",
      "estimated_hours": 8,
      "created_at": "2026-05-16T10:00:00Z",
      "updated_at": "2026-05-20T08:00:00Z"
    }
  ]
}
```

### GET /rd/tasks/detail?id=
获取单个任务详情。

### POST /rd/tasks
创建任务。权限: 研发主管及以上(role≥4)。

**Body (JSON):**
```json
{
  "title": "编写登录模块单元测试",
  "description": "...",
  "priority": "high",
  "org_id": "org_1",
  "assignee_id": 1002,
  "requirement_id": "",
  "deadline": "2026-05-30",
  "estimated_hours": 8
}
```

### PUT /rd/tasks/detail?id=
更新任务。权限: 研发主管及以上(role≥4)可编辑所有。

### DELETE /rd/tasks/detail?id=
删除任务。权限: 研发主管及以上(role≥4)。

---

## 5. 我的工单

### GET /rd/my-tickets
获取当前用户相关的需求与缺陷（我是创建人或负责人）。

**Query:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| org_id | string | 否 | 组织筛选 |
| type | string | 否 | requirement / bug，不传返回全部 |
| status | string | 否 | 按类型传对应状态值 |

**Response:**
```json
{
  "requirements": [ ... ],
  "bugs": [ ... ]
}
```

---

## 6. 组织相关（R&D 平台专用）

### GET /rd/organizations
获取当前用户所属的组织列表（用于组织筛选下拉框）。

**Response:**
```json
{
  "list": [
    { "org_id": 1, "org_name": "前端团队", "role": 4 },
    { "org_id": 2, "org_name": "后端团队", "role": 2 }
  ]
}
```

> role 字段: 1=普通成员, 2=报告者, 3=开发者, 4=研发主管, 5=组织管理员

---

## 7. 枚举值（可选，前端可硬编码）

### GET /rd/enums
返回状态、优先级等枚举值，便于后端扩展时前端无需发版。

**Response:**
```json
{
  "requirement_status": [
    { "value": "new", "label": "新建" },
    { "value": "developing", "label": "开发中" },
    { "value": "testing", "label": "测试中" },
    { "value": "done", "label": "已完成" },
    { "value": "closed", "label": "已关闭" }
  ],
  "bug_status": [ ... ],
  "task_status": [ ... ],
  "priority": [ ... ],
  "severity": [ ... ]
}
```

---

## 接口汇总

| 方法 | 路径 | 说明 | 权限 (role≥) |
|------|------|------|------|
| GET | /rd/stats | 仪表盘统计 | 1 |
| GET | /rd/requirements | 需求列表 | 1 |
| GET | /rd/requirements/detail?id= | 需求详情 | 1 |
| POST | /rd/requirements | 创建需求 | 2 |
| PUT | /rd/requirements | 更新需求 | 4 |
| DELETE | /rd/requirements?id= | 删除需求 | 4 |
| GET | /rd/bugs | 缺陷列表 | 1 |
| GET | /rd/bugs/detail?id= | 缺陷详情 | 1 |
| POST | /rd/bugs | 创建缺陷 | 2 |
| PUT | /rd/bugs | 更新缺陷 | 4 |
| DELETE | /rd/bugs?id= | 删除缺陷 | 4 |
| GET | /rd/tasks | 任务列表 | 1 |
| GET | /rd/tasks/detail?id= | 任务详情 | 1 |
| POST | /rd/tasks | 创建任务 | 4 |
| PUT | /rd/tasks | 更新任务 | 4 |
| DELETE | /rd/tasks?id= | 删除任务 | 4 |
| GET | /rd/my-tickets | 我的工单 | 1 |
| GET | /rd/organizations | 我的组织列表 | 1 |
| GET | /rd/enums | 枚举值 | 1 |

> 角色值: 1=普通成员, 2=报告者, 3=开发者, 4=研发主管, 5=组织管理员

共 **19 个接口**。
