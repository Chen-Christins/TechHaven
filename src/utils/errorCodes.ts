/**
 * 错误码管理模块
 *
 * - 应用启动时立即从后端拉取错误码映射表（不依赖 settings）
 * - 缓存到 localStorage（含语言标识），下次启动立即可用
 * - getErrorMsg() 同步查表，查不到时自动触发重新拉取（防抖 3s）
 * - settings 加载后若语言变化，可调用 refreshErrorCodes 刷新
 */

const STORAGE_KEY = "app_error_codes";

interface CachedErrorCodes {
    lang: string;
    messages: Record<string, string>;
}

/** 错误码 → 消息映射表 */
let errorMessages: Record<string, string> = {};

/** 当前已加载的语言 */
let currentLang = "";

/** 防止重复拉取 */
let reFetchTimer: ReturnType<typeof setTimeout> | null = null;

// ---------- 启动时立即从 localStorage 恢复缓存 ----------

try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
        const parsed: CachedErrorCodes = JSON.parse(cached);
        errorMessages = parsed.messages || {};
        currentLang = parsed.lang || "";
    }
} catch {
    // localStorage 不可用或数据损坏，从空表开始
}

// ---------- 核心 API ----------

/**
 * 初始化错误码表（应用入口调用一次，不依赖 settings）
 * 使用原生 fetch 避免与 http.ts 循环依赖
 */
export async function initErrorCodes(lang?: string): Promise<void> {
    const targetLang = lang || navigator.language || "zh-CN";
    if (currentLang === targetLang && Object.keys(errorMessages).length > 0) {
        return; // 已加载过且语言一致，跳过
    }
    await fetchErrorCodes(targetLang);
}

/**
 * 刷新错误码表（settings 加载后语言变化时调用）
 */
export async function refreshErrorCodes(lang: string): Promise<void> {
    if (lang && lang !== currentLang) {
        await fetchErrorCodes(lang);
    }
}

/**
 * 根据 errno 获取错误消息（同步调用）
 * 查不到时自动触发异步重新拉取（防抖 3s）
 */
export function getErrorMsg(errno: number | string, fallbackMsg?: string): string {
    const key = String(errno);
    if (errorMessages[key]) {
        return errorMessages[key];
    }
    // 查不到 → 触发重新拉取
    scheduleReFetch();
    return fallbackMsg || "未知错误";
}

// ---------- 内部实现 ----------

async function fetchErrorCodes(lang: string): Promise<void> {
    try {
        const res = await fetch(`/api/v1/error-codes?lang=${encodeURIComponent(lang)}`);
        if (!res.ok) {
            return;
        }
        const json = await res.json();
        const data = json.data || json;
        if (data && typeof data === "object") {
            errorMessages = data;
            currentLang = lang;
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify({ lang, messages: data }));
            } catch {
                // localStorage 满或不可写，忽略
            }
        }
    } catch {
        // 静默降级：localStorage 有旧缓存就继续用
    }
}

/** 防抖 3s，避免无限循环重新拉取 */
function scheduleReFetch(): void {
    if (reFetchTimer) {
        return;
    }
    reFetchTimer = setTimeout(() => {
        reFetchTimer = null;
        fetchErrorCodes(currentLang || navigator.language || "zh-CN");
    }, 3000);
}
