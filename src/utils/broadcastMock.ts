export interface BroadcastMarqueeItem {
  id: string;
  title: string;
  content: string;
  level: "info" | "warning" | "danger";
  enabled: boolean;
}

const mockBroadcasts: BroadcastMarqueeItem[] = [
  {
    id: "mock-maintenance-20260630",
    title: "停服维护公告",
    content: "平台将于今晚 23:30-24:00 进行停服维护，维护期间登录、发文、评论和作业提交功能将暂时不可用。",
    level: "warning",
    enabled: true,
  },
];

export function getMockBroadcastMarqueeItems(): BroadcastMarqueeItem[] {
  return mockBroadcasts.filter((item) => item.enabled);
}
