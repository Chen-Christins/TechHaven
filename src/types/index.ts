// 文章类型
export interface Article {
  author: string;
  title: string;
  content: string;
  id: string | number;
  user_id: string | number;
  favorites: number;
  praise: number;
  views: number;
  publish_time: string;
  update_time: string;
  type: number;
  state: number;
  is_deleted: boolean;
  labels?: Array<string | number>;
  categorys?: Array<string | number>;
}

export interface ArticleListItem {
  id: string | number;
  title: string;
  author: string;
  summary: string;
  state: string;
  type: string;
  publish_time: string;
  views: number;
  praise: number;
  favorites: number;
  category: string;
  tags: string[];
  categories?: Array<{ id: number; name: string }>;
}

export interface UserProfile {
  id: number;
  name: string;
  avatar: string;
  bio: string;
  account: string;
  email: string;
  role: "admin" | "editor" | "user";
  location: string;
  website?: string;
  joinDate: string;
  stats: {
    articles: number;
    followers: number;
    following: number;
  };
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
  id: number | string;
  name: string;
  count?: number;
  view_count?: number;
  children?: Category[];
  color: string;
}

export interface ArticleFormData {
  title: string;
  articleType: "original" | "repost";
  category: Category | null;
  tags: Tag[];
  content: string;
}

export interface ArticleCreateProps {
  className?: string;
  onSaveDraft?: (data: ArticleFormData) => void;
  onPublish?: (data: ArticleFormData) => void;
  initialData?: Partial<ArticleFormData>;
}

// 标签类型
export interface Tag {
  id: string | number;
  color: string; // 背景颜色
  name: string;
}

export interface SelectOption {
  id: string | number;
  name: string;
  color: string;
  date?: string;
  count?: number;
  avatar?: string;
}

export interface CustomSelectProps {
  name: string;
  options: SelectOption[];
  showDate?: boolean;
  placeholder?: string;
  value?: SelectOption | null;
  onChange?: (selectedOption: SelectOption | null, selectedIndex: number, oldIndex: number) => void;
  className?: string;
  hideBadge?: boolean;
  disabled?: boolean;
}

export interface SelectChangeEventDetail {
  selectedOption: SelectOption | null;
  selectedIndex: number;
  oldIndex: number;
  name: string;
}

export interface Assignment {
  id: string;
  title: string;
  courseName: string;
  deadline: string;
  status: "active" | "draft" | "closed";
  submissionCount: number;
  totalStudents: number;
  createdAt: string;
  description?: string;
  priority: "low" | "medium" | "high" | "urgent";
  maxFileSize?: number; // MB
  allowedTypes?: string[];
}
