/**
 * WebSocket 业务单例
 *
 * notificationWS：通知频道（/ws/v1/notification）
 * chatWS：聊天频道（/ws/v1/messages）
 */

import { WebSocketClient } from "../infra/Websocket.ts";

/** 通知 WebSocket 单例 */
export const notificationWS = new WebSocketClient("/ws/v1/notification");

/** 聊天 WebSocket 单例 */
export const chatWS = new WebSocketClient("/ws/v1/messages");
