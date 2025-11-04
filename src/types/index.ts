// 文章类型
export interface Article {
  id: number;
  title: string;
  summary: string;
  date: string; // 格式：YYYY-MM-DD
  category: string;
  tags: string[];
}

// 统计数据类型
export interface StatsData {
  onlineUsers: number;
  totalVisits: number;
  todayVisits: number;
  totalVisitors: number;
}

// 分类类型
export interface Category {
  name: string;
  count: number;
}

// 标签类型
export interface Tag {
  name: string;
  count: number;
}