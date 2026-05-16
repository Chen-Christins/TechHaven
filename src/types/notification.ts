export interface Notification {
  id: number | string;
  title: string;
  content: string;
  type:
    | "system"
    | "comment"
    | "praise"
    | "follow"
    | "article"
    | "org_role_change"
    | "org_join_request"
    | "org_join_approved"
    | "org_join_rejected"
    | "org_member_kicked"
    | "article_review_request"
    | "article_review_approved"
    | "article_review_rejected";
  is_read: boolean;
  create_time: number;
  link?: string;
  article_id?: number | string;
  comment_id?: number | string;
}

export interface NotificationListResponse {
  list: Notification[];
  total: number;
  offset: number;
  size: number;
}
