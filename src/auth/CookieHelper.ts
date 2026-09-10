/**
 * Cookie 工具
 */

/**
 * 从 Cookie 中读取指定 key 的值
 *
 * 用 indexOf 而非 split("=") 取值：Cookie 值本身允许含 "="（base64 填充、JWT 分段等），
 * split 会在第一个 "=" 处切断导致 token 被静默截断。
 */
export function getCookie(key: string): string | null {
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
        const trimmed = cookie.trim();
        const eq = trimmed.indexOf("=");
        if (eq < 0) {
            continue;
        }
        if (trimmed.slice(0, eq) !== key) {
            continue;
        }
        return decodeURIComponent(trimmed.slice(eq + 1));
    }
    return null;
}

/**
 * 从 Cookie 中提取 S_TOKEN
 */
export function getTokenFromCookie(): string | null {
    return getCookie("S_TOKEN");
}

/**
 * 清除会话认证 Cookie（S_TOKEN / S_UID / S_TOKEN_TIME）
 * 注意：DEVICE_ID 为 10 年设备标识，保留不删
 */
export function clearAuthCookies(): void {
    const authCookieNames = ["S_TOKEN", "S_UID", "S_TOKEN_TIME"];
    authCookieNames.forEach((name) => {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    });
}
