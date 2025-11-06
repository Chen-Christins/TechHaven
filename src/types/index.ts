// 文章类型
export interface Article {
  id: number;
  author: string;
  title: string;
  summary: string;
  date: string; // 格式：YYYY-MM-DD
  category: string;
  tags: string[];
  views: number;
  praises: number;
}

// 统计数据类型
export interface StatsData {
  onlineUsers: number;
  totalVisits: number;
  todayVisits: number;
  totalVisitors: number;
}

// 二级分类类型（支持父分类→子分类）
export interface Category {
  id: number;           // 分类唯一标识
  name: string;         // 分类名称
  count: number;        // 该分类下的文章总数（含子分类）
  children?: Category[]; // 子分类（可选，二级分类）
}

// 标签类型
export interface Tag {
  id: string;
  color: string; // 背景颜色
  name: string;
}

export interface SelectOption {
  id: string | number;
  name: string;
  color?: string;
  date?: string;
  count?: number;
}

export interface CustomSelectProps {
  name: string;
  options: SelectOption[];
  showDate?: boolean;
  placeholder?: string;
  value?: SelectOption | null;
  onChange?: (selectedOption: SelectOption | null, selectedIndex: number, oldIndex: number) => void;
  className?: string;
}

export interface SelectChangeEventDetail {
  selectedOption: SelectOption | null;
  selectedIndex: number;
  oldIndex: number;
  name: string;
}