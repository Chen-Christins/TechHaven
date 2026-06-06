export interface Notification {
  id: number | string;
  title: string;
  content: string;
  type:
    | "system"
    | "comment"
    | "reply"
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
    | "article_review_rejected"
    | "comment_approved"
    | "comment_rejected"
    | "comment_spam"
    | "comment_admin_deleted"
    | "requirement_assigned"
    | "bug_assigned"
    | "task_assigned"
    | "org_apply_request"
    | "org_apply_approved"
    | "org_apply_rejected"
    | "org_deleted"
    | "account_deleted"
    | "account_recovered"
    | "password_reset"
    | "article_state_changed"
    | "assignment_submitted"
    | "assignment_created"
    | "assignment_deleted";
  is_read: boolean;
  create_time: number;
  link?: string;
  article_id?: number | string;
  comment_id?: number | string;
  bug_id?: number | string;
  requirement_id?: number | string;
  task_id?: number | string;
  apply_id?: number | string;
  org_id?: number | string;
  assignment_id?: number | string;
}

export interface NotificationListResponse {
  list: Notification[];
  total: number;
  offset: number;
  size: number;
}
