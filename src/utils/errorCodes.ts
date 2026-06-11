/**
 * 错误码管理模块
 *
 * 职责：
 * - 应用启动时从后端拉取错误码映射表（一次）
 * - 提供 getErrorMsg() 供响应拦截器等同步调用
 * - 缓存到 localStorage，下次启动立即可用
 */

const STORAGE_KEY = "app_error_codes";

/**
 * 错误码 → 消息映射表
 * 结构如: { "0": "成功", "1101": "未登录", "2001": "用户不存在", ... }
 */
let errorMessages: Record<string, string> = {};

// 应用启动时尝试从 localStorage 恢复缓存
try {
  const cached = localStorage.getItem(STORAGE_KEY);
  if (cached) {
    errorMessages = JSON.parse(cached);
  }
} catch {
  // localStorage 不可用或数据损坏，从空表开始
}

/**
 * 初始化错误码表（应用入口调用一次）
 * 使用原生 fetch 避免与 http.ts 循环依赖
 */
export async function initErrorCodes(lang: string): Promise<void> {
  try {
    const res = await fetch(`/api/v1/error-codes?lang=${encodeURIComponent(lang)}`);
    if (!res.ok) return;
    const json = await res.json();
    const data = json.data || json;
    if (data && typeof data === "object") {
      errorMessages = data;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {
        // localStorage 满或不可写，忽略
      }
    }
  } catch {
    // 静默降级：如果 localStorage 有旧缓存就用，没有则 fallback 到调用方传入的消息
  }
}

/**
 * 根据 errno 获取错误消息
 * @param errno 业务错误码
 * @param fallbackMsg 服务端返回的 msg（作为后备）
 * @returns 匹配的错误消息，或 fallbackMsg，或 "未知错误"
 */
export function getErrorMsg(errno: number | string, fallbackMsg?: string): string {
  return errorMessages[String(errno)] || fallbackMsg || "未知错误";
}
