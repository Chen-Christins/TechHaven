import React, { useEffect } from "react";
import { tokenManager, type SessionInvalidReason } from "@/utils/http";
import message from "@/components/message/Message";

/**
 * 会话失效全局提示组件
 * 挂在 MessageProvider 内部，订阅 tokenManager 的会话失效事件并弹出提示
 * （AuthContext 位于 MessageProvider 之上，无法直接调用 message，故单独承载）
 */
const SessionNotifier: React.FC = () => {
  useEffect(() => {
    const handleInvalidated = (reason: SessionInvalidReason) => {
      message.error(reason === "kicked" ? "账号已在其他设备登录，请重新登录" : "登录已过期，请重新登录");
    };
    tokenManager.addSessionInvalidatedListener(handleInvalidated);
    return () => {
      tokenManager.removeSessionInvalidatedListener(handleInvalidated);
    };
  }, []);

  return null;
};

export default SessionNotifier;
