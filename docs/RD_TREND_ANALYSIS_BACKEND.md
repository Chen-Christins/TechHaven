# 研发平台趋势分析后台接口对接文档

本文档用于对接研发平台的「趋势分析」页面。当前前端页面使用本地 mock 数据，后端接口完成后可替换为真实请求。

## 1. 接口概览

```http
GET /rd/trends
```

用于返回指定组织、指定时间范围内的研发吞吐、缺陷、任务、代码审查和交付周期趋势数据。

## 2. 权限要求

- 复用研发平台访问权限：系统管理员，或在已批准组织中具备报告者及以上角色。
- 权限判断规则建议与 `GET /rd/check_access` 保持一致。
- 如果传入 `org_id`，需要校验当前用户是否有该组织的数据查看权限。

## 3. 请求参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| `org_id` | string | 否 | 当前用户可访问的默认组织 | 组织 ID。不传时由后端按当前用户权限决定统计范围。 |
| `period_days` | number | 否 | `30` | 快捷周期，可选值 `7`、`30`。前端当前用它驱动 7 天 / 30 天切换。 |
| `start_date` | string | 否 | 近 30 天起始日 | 开始日期，格式 `YYYY-MM-DD`。 |
| `end_date` | string | 否 | 今日 | 结束日期，格式 `YYYY-MM-DD`。 |
| `granularity` | string | 否 | `day` | 聚合粒度，可选值：`day`、`week`、`month`。 |

示例：

```http
GET /rd/trends?org_id=org_001&period_days=30&granularity=day
```

## 4. 响应格式

遵循项目统一 HTTP 响应包装：

```ts
type HttpResponse<T> = {
  code: number | string;
  errno?: number;
  message?: string;
  msg?: string;
  success: boolean;
  data: T;
};
```

`data` 结构：

```ts
type RdTrendAnalysisResponse = {
  summary: {
    completed_total: number;
    bug_total: number;
    avg_review_pass_rate: number;
    avg_cycle_time: number;
    task_delta: number;
    cycle_delta: number;
  };
  series: Array<{
    date: string;
    requirements: number;
    bugs: number;
    tasks: number;
    completed: number;
    reopened: number;
    review_pass_rate: number;
    cycle_time: number;
  }>;
  work_distribution: {
    requirement_delivery: number;
    bug_fix: number;
    rd_task: number;
    code_review: number;
  };
  team_health: {
    throughput: number;
    bug_pressure: number;
    review_efficiency: number;
    rework_risk: number;
  };
  insights: Array<{
    title: string;
    content: string;
  }>;
};
```

字段说明：

| 字段 | 说明 |
| --- | --- |
| `summary.completed_total` | 时间范围内累计完成项数量。 |
| `summary.bug_total` | 时间范围内新增缺陷数量。 |
| `summary.avg_review_pass_rate` | 平均代码审查通过率，百分比数字，例如 `86`。 |
| `summary.avg_cycle_time` | 平均交付周期，单位天。 |
| `summary.task_delta` | 当前周期末与上一统计点的任务总量差值。 |
| `summary.cycle_delta` | 当前周期末与上一统计点的平均周期差值，单位天。负数表示周期缩短。 |
| `series.date` | 趋势横轴日期。`day` 用 `YYYY-MM-DD`，`week` 用周起始日，`month` 用 `YYYY-MM`。 |
| `series.requirements` | 当前统计点新增需求数。 |
| `series.bugs` | 当前统计点新增缺陷数。 |
| `series.tasks` | 当前统计点任务总量。 |
| `series.completed` | 当前统计点完成项数量。 |
| `series.reopened` | 当前统计点返工或重新打开数量。 |
| `series.review_pass_rate` | 当前统计点代码审查通过率，百分比数字。 |
| `series.cycle_time` | 当前统计点平均交付周期，单位天。 |
| `work_distribution` | 时间范围内工作类型占比，返回稳定字段，不返回中文展示名。数值建议为百分比，也可以约定为数量后由前端计算占比。 |
| `team_health` | 页面右侧健康度指标，返回稳定字段，不返回中文展示名和颜色。数值为 0-100，颜色和排序由前端按字段映射。 |
| `insights` | 后端可生成趋势判断文案；如果后端暂不支持，允许返回空数组，前端兜底展示规则判断。 |

### 指标口径

#### 平均代码审查通过率

建议按「一次审查通过率」定义：

```text
avg_review_pass_rate = 一次通过的审查数 / 已完成审查总数 * 100
```

说明：

- 已完成审查总数：统计周期内状态已结束的代码审查，例如 `approved`、`rejected`、`closed`，具体状态以后端实际枚举为准。
- 一次通过的审查数：统计周期内没有被打回、没有进入再次修改流程，首次审查即通过的审查数量。
- 返回百分比数字，不带 `%`，例如 `86` 表示 `86%`。
- 如果统计周期内没有已完成审查，建议返回 `0`。

#### 平均交付周期

建议按研发事项从开始处理到完成的平均耗时定义，单位为天：

```text
avg_cycle_time = avg(done_at - started_at)
```

建议状态口径：

- 需求：从进入 `developing` 到 `done` / `closed`。
- 任务：从进入 `doing` 到 `done` / `closed`。
- 缺陷：从进入 `accepted` / `processing` 到 `verified` / `closed`。

说明：

- 只统计周期内完成的事项。
- 同一个事项重复打开时，建议以后端最终确定的流转规则为准；如无特殊规则，按最近一次开始处理到最终完成计算。
- 返回数字，保留 1 位小数即可，例如 `3.9` 表示平均 `3.9` 天。
- 如果统计周期内没有完成事项，建议返回 `0`。

## 5. 响应示例

```json
{
  "code": 0,
  "success": true,
  "message": "success",
  "data": {
    "summary": {
      "completed_total": 315,
      "bug_total": 113,
      "avg_review_pass_rate": 86,
      "avg_cycle_time": 3.9,
      "task_delta": 5,
      "cycle_delta": -0.1
    },
    "series": [
      {
        "date": "2026-06-01",
        "requirements": 18,
        "bugs": 9,
        "tasks": 24,
        "completed": 16,
        "reopened": 3,
        "review_pass_rate": 78,
        "cycle_time": 4.8
      }
    ],
    "work_distribution": {
      "requirement_delivery": 36,
      "bug_fix": 24,
      "rd_task": 28,
      "code_review": 12
    },
    "team_health": {
      "throughput": 87,
      "bug_pressure": 34,
      "review_efficiency": 76,
      "rework_risk": 22
    },
    "insights": [
      {
        "title": "交付节奏",
        "content": "完成项连续增长，任务吞吐高于新增缺陷，短期积压风险可控。"
      }
    ]
  }
}
```

## 6. 空数据与异常约定

- 查询范围内没有数据时，返回 `series: []`，其余统计字段返回 `0` 或空数组。
- 日期范围非法时返回业务错误，例如 `code: 400`，`message: "日期范围不合法"`。
- 无权限时返回统一未授权或无权限业务码，并与现有 HTTP 拦截器错误处理保持一致。

## 7. 前端替换点

当前 mock 数据位于：

```text
src/pages/rd-platform/TrendAnalysis.tsx
```

后端完成后建议新增服务方法：

```ts
RdPlatformService.getTrends(params)
```

页面替换策略：

- 将本地 `trendData`、`moduleDistribution`、`teamHealth` 和洞察文案改为接口返回数据。
- 保留当前 ECharts 渲染结构，只替换数据来源。
- 接口 loading、empty、error 状态按研发平台现有列表页交互风格处理。
