export interface Notification {
  id: number | string;
  title: string;
  content: string;
  type: "system" | "comment" | "like" | "follow" | "article";
  is_read: boolean;
  create_time: number;
  link?: string;
}

export interface NotificationListResponse {
  total: number;
  unread_count: number;
  list: Notification[];
}
