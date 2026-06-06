// Shared in-memory notification settings state.
// Both Notification bell and NotificationsTab share this so
// toggling a type in one place is reflected in the other — no localStorage needed.

export type NotifType =
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

const defaults: Record<NotifType, boolean> = {
  system: true,
  comment: true,
  reply: true,
  praise: true,
  follow: true,
  article: true,
  org_role_change: true,
  org_join_request: true,
  org_join_approved: true,
  org_join_rejected: true,
  org_member_kicked: true,
  article_review_request: true,
  article_review_approved: true,
  article_review_rejected: true,
  comment_approved: true,
  comment_rejected: true,
  comment_spam: true,
  comment_admin_deleted: true,
  requirement_assigned: true,
  bug_assigned: true,
  task_assigned: true,
  org_apply_request: true,
  org_apply_approved: true,
  org_apply_rejected: true,
  org_deleted: true,
  account_deleted: true,
  account_recovered: true,
  password_reset: true,
  article_state_changed: true,
  assignment_submitted: true,
  assignment_created: true,
  assignment_deleted: true,
};

const settings: Record<NotifType, boolean> = { ...defaults };

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

export function getSettings(): Record<NotifType, boolean> {
  return { ...settings };
}

export function isTypeEnabled(type: NotifType): boolean {
  return settings[type] ?? true;
}

export function getEnabledTypes(): NotifType[] {
  return (Object.keys(settings) as NotifType[]).filter((t) => settings[t]);
}

export function setTypeEnabled(type: NotifType, enabled: boolean): void {
  if (settings[type] === enabled) return;
  settings[type] = enabled;
  notify();
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
