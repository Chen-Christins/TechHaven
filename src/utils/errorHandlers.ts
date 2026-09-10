/**
 * 业务错误码处理器
 *
 * 所有与业务语义相关的 errno 处理逻辑都集中在这里，
 * http.ts 只负责调用 setBusinessErrorHandler 注册的回调。
 */

import { tokenManager, detectInvalidReason, type SessionInvalidReason } from "./tokenManager";
import { clearAuthCookies } from "./cookieHelper";
import { setBusinessErrorHandler } from "./http";

// ---------- 1101：未登录（token 过期 / 被顶下线） ----------

setBusinessErrorHandler((errno, data) => {
    if (errno === 1101) {
        const fallback = data?.msg || data?.errstr || "";
        const reason: SessionInvalidReason = detectInvalidReason(String(fallback));
        clearAuthCookies();
        tokenManager.clearToken();
        tokenManager.emitSessionInvalidated(reason);
    }
});
