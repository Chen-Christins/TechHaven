import { WebSocketClient } from "../utils/websocket";

/** 在线状态 WebSocket 单例 */
export const presenceWS = new WebSocketClient("/ws/v1/presence");

type OnlineCountListener = (count: number) => void;
const listeners = new Set<OnlineCountListener>();
let _onlineCount = 0;

presenceWS.onMessage("online_count", (data: any) => {
  _onlineCount = data.count ?? data.online_users ?? 0;
  listeners.forEach((fn) => fn(_onlineCount));
});

export function getOnlineCount(): number {
  return _onlineCount;
}

export function subscribeOnlineCount(listener: OnlineCountListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function connectPresence(uid: string | number) {
  presenceWS.connect(uid);
}

export function disconnectPresence() {
  presenceWS.disconnect();
}
