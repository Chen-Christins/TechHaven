import http from "../utils/http";

export interface DashboardStats {
  total_users: number;
  total_users_change: number;
  total_articles: number;
  total_articles_change: number;
  total_comments: number;
  total_comments_change: number;
  today_visits: number;
  today_visits_change: number;
  new_users_today: number;
  new_users_today_change: number;
}

export interface TrendItem {
  label: string;
  date: string;
  visits: number;
}

export interface DashboardTrend {
  list: TrendItem[];
  total_visits: number;
  avg_visits: number;
  max_visits: number;
}

export interface DashboardActivity {
  type: "user_register" | "article_publish" | "comment_create" | "system_backup" | "profile_update";
  title: string;
  time: string;
  timestamp: number;
}

export interface DashboardRecentUser {
  name: string;
  role: string;
  avatar: string;
  status: "active" | "inactive";
}

export class DashboardService {
  static async getStats(): Promise<DashboardStats> {
    const response = await http.get<DashboardStats>("/admin/dashboard/stats");
    return response.data;
  }

  static async getTrend(period: number = 7): Promise<DashboardTrend> {
    const response = await http.get<DashboardTrend>("/admin/dashboard/trend", {
      params: { period },
    });
    return response.data;
  }

  static async getActivities(limit: number = 5): Promise<{ list: DashboardActivity[] }> {
    const response = await http.get<{ list: DashboardActivity[] }>("/admin/dashboard/activities", {
      params: { limit },
    });
    return response.data;
  }

  static async getRecentUsers(limit: number = 5): Promise<{ list: DashboardRecentUser[] }> {
    const response = await http.get<{ list: DashboardRecentUser[] }>("/admin/dashboard/recent-users", {
      params: { limit },
    });
    return response.data;
  }
}

export default DashboardService;
