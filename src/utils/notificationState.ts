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
