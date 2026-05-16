import http from "../utils/http";
import type { StatsData } from "../types/index";

interface StatsApiResponse {
  online_users: number;
  today_visits: number;
  total_visits: number;
  total_visitors: number;
}

export class StatsService {
  static async getStats(): Promise<StatsData> {
    const response = await http.get<StatsApiResponse>("/stats");
    const data = response.data;
    return {
      onlineUsers: data.online_users,
      todayVisits: data.today_visits,
      totalVisits: data.total_visits,
      totalVisitors: data.total_visitors,
    };
  }
}

export default StatsService;
