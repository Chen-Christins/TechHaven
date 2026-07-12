# 我的成就（Achievements）

入口：个人中心（`/personal?tab=achievements`）→ 我的成就 Tab。
对应组件：`src/pages/user/AchievementsTab.tsx`（外壳 `src/pages/user/Achievements.tsx` 已废弃，仅保留 Tab）。

## 数据模型

```ts
interface Badge {
  id: string;
  name: string;        // 徽章名，如 "笔耕不辍"
  desc: string;        // 解锁条件描述
  icon: string;        // 图标标识（前端映射为 React 图标）
  color: string;       // 主题色，如 "#3b82f6"
  unlocked: boolean;   // 是否已解锁
  progress?: string;   // 未解锁时的进度，如 "742 / 1000"
}

interface AchievementStats {
  totalContributions: number; // 总贡献（热力图等级之和）
  publishedArticles: number;  // 已发布文章数
  totalLikes: number;         // 获得点赞数
  unlockedBadges: number;     // 已解锁徽章数
  totalBadges: number;        // 徽章总数
}

// 贡献热力图：53 周 × 7 天，每格为 0~4 的等级
type Heatmap = number[][];
```

## 接口

### GET /api/v1/user/achievements
获取成就页全部数据。

**响应 data**
```json
{
  "stats": {
    "totalContributions": 1287,
    "publishedArticles": 52,
    "totalLikes": 3200,
    "unlockedBadges": 4,
    "totalBadges": 6
  },
  "badges": [
    {
      "id": "1",
      "name": "笔耕不辍",
      "desc": "累计发布 50 篇文章",
      "icon": "pen-nib",
      "color": "#3b82f6",
      "unlocked": true
    },
    {
      "id": "5",
      "name": "社区之星",
      "desc": "获得 1000 个关注",
      "icon": "star",
      "color": "#eab308",
      "unlocked": false,
      "progress": "742 / 1000"
    }
  ],
  "heatmap": [[0,1,2,3,4,1,0], "… 共 53 个子数组，每个含 7 个数字（0~4）"]
}
```

## 备注
- 热力图等级映射前端 `LEVEL_COLORS`：`0→var(--bg-tertiary)`、`1→#9be9a8`、`2→#40c463`、`3→#30a14e`、`4→#216e39`。
- `stats.totalLikes` 在前端以 "3.2k" 形式展示，后端返回原始数值即可。
- 当前为只读展示，无写接口。
