import { useEffect } from "react";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { connectPresence, disconnectPresence, subscribeOnlineCount, getOnlineCount } from "../services/presenceService";

/** 在 App 层使用：管理在线状态 WebSocket 连接生命周期 */
export function usePresenceConnection() {
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      connectPresence(user.id);
    } else {
      disconnectPresence();
    }
  }, [isAuthenticated, user]);
}

/** 在任何组件中使用：读取实时在线人数 */
export function useOnlineCount(): number {
  const [count, setCount] = useState(getOnlineCount());

  useEffect(() => {
    return subscribeOnlineCount(setCount);
  }, []);

  return count;
}
