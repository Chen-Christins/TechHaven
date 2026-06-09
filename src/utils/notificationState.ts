// Shared in-memory read-state for mock notifications.
// Both Notification bell and NotificationsTab use this so
// "mark all read" in one place is reflected in the other.

const readIds = new Set<string | number>();

let version = 0;
const listeners = new Set<(delta: number) => void>();

export function isRead(id: string | number): boolean {
  return readIds.has(id);
}

export function markRead(id: string | number): void {
  readIds.add(id);
  version++;
  listeners.forEach((fn) => fn(1));
}

export function markAllRead(ids: Array<string | number>): void {
  ids.forEach((id) => readIds.add(id));
  version++;
  listeners.forEach((fn) => fn(ids.length));
}

export function subscribe(fn: (delta: number) => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

// Global unread count that persists across component mounts (SPA navigation).
// Only fetched from API on hard page load; then maintained via WS increment
// and mark-read decrement, preventing stale API responses from re-inflating the badge.

let globalUnreadCount = 0;
let countInitialized = false;
const countListeners = new Set<(count: number) => void>();

export function getUnreadCount(): number {
  return globalUnreadCount;
}

export function setUnreadCount(count: number): void {
  globalUnreadCount = count;
  countInitialized = true;
  countListeners.forEach((fn) => fn(count));
}

export function decrementUnreadCount(delta: number): void {
  globalUnreadCount = Math.max(0, globalUnreadCount - delta);
  countListeners.forEach((fn) => fn(globalUnreadCount));
}

export function incrementUnreadCount(): void {
  globalUnreadCount += 1;
  countListeners.forEach((fn) => fn(globalUnreadCount));
}

export function subscribeUnreadCount(fn: (count: number) => void): () => void {
  countListeners.add(fn);
  return () => countListeners.delete(fn);
}

export function isUnreadCountInitialized(): boolean {
  return countInitialized;
}
