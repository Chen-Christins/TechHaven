import http from "../utils/http";
import type { NotificationListResponse } from "../types/notification";

export class NotificationService {
  /**
   * 获取通知列表
   */
  static async getNotifications(params?: {
    page_num?: number;
    page_size?: number;
  }): Promise<NotificationListResponse> {
    const response = await http.get<NotificationListResponse>("/notification/list", {
      params: {
        page_num: params?.page_num ?? 1,
        page_size: params?.page_size ?? 20,
      },
    });
    return response.data;
  }

  /**
   * 获取未读通知数量
   */
  static async getUnreadCount(): Promise<{ unread_count: number }> {
    const response = await http.get<{ unread_count: number }>("/notification/unread_count");
    return response.data;
  }

  /**
   * 标记单条通知为已读
   */
  static async markAsRead(notificationId: number | string): Promise<void> {
    await http.post("/notification/read", { notification_id: notificationId });
  }

  /**
   * 标记所有通知为已读
   */
  static async markAllAsRead(): Promise<void> {
    await http.post("/notification/read_all");
  }
}

export default NotificationService;
