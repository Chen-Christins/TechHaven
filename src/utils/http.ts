import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, AxiosError } from "axios";
import { getErrorMsg } from "./errorCodes";

/**
 * HTTP请求响应接口
 */
export interface HttpResponse<T = any> {
    code: number | string;
    errno?: number;
    message?: string;
    msg?: string;
    data: T;
    success: boolean;
}

/**
 * 会话失效原因：expired = token 过期；kicked = 被顶/被踢下线
 */
export type SessionInvalidReason = "expired" | "kicked";

/**
 * Token 管理器 - 使用内存存储，避免 localStorage 安全风险
 */
class TokenManager {
    private token: string | null = null;
    private listeners: ((token: string | null) => void)[] = [];
    private sessionInvalidatedListeners: ((reason: SessionInvalidReason) => void)[] = [];

    /**
     * 设置 token
     */
    setToken(token: string | null) {
        this.token = token;
        this.notifyListeners();
    }

    /**
     * 获取 token
     */
    getToken(): string | null {
        return this.token;
    }

    /**
     * 清除 token
     */
    clearToken() {
        this.token = null;
        this.notifyListeners();
    }

    /**
     * 添加 token 变化监听器
     */
    addListener(listener: (token: string | null) => void) {
        this.listeners.push(listener);
    }

    /**
     * 移除 token 变化监听器
     */
    removeListener(listener: (token: string | null) => void) {
        const index = this.listeners.indexOf(listener);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }

    /**
     * 通知所有监听器
     */
    private notifyListeners() {
        this.listeners.forEach((listener) => listener(this.token));
    }

    /**
     * 广播会话失效事件（token 过期 / 被顶下线）
     */
    emitSessionInvalidated(reason: SessionInvalidReason) {
        this.sessionInvalidatedListeners.forEach((listener) => listener(reason));
    }

    /**
     * 添加会话失效监听器（token 过期 / 被顶下线）
     */
    addSessionInvalidatedListener(listener: (reason: SessionInvalidReason) => void) {
        this.sessionInvalidatedListeners.push(listener);
    }

    /**
     * 移除会话失效监听器
     */
    removeSessionInvalidatedListener(listener: (reason: SessionInvalidReason) => void) {
        const index = this.sessionInvalidatedListeners.indexOf(listener);
        if (index > -1) {
            this.sessionInvalidatedListeners.splice(index, 1);
        }
    }
}

/**
 * 从Cookie中提取S_TOKEN
 */
export const getTokenFromCookie = (): string | null => {
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
        const [name, value] = cookie.trim().split("=");
        if (name === "S_TOKEN") {
            return decodeURIComponent(value);
        }
    }
    return null;
};

/**
 * 根据服务端 errstr/msg 判定 1101 会话失效原因
 * 命中"被顶/被踢/已在其他设备"关键字 → kicked，否则视为 token 过期
 */
export const detectInvalidReason = (text: string): SessionInvalidReason =>
    /kick|kicked|other device|异地|被顶|踢下线|已在其他设备|已被登录/i.test(text) ? "kicked" : "expired";

/**
 * 从 Cookie 中读取指定 key 的值
 */
export const getCookie = (key: string): string | null => {
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
        const [name, value] = cookie.trim().split("=");
        if (name === key) {
            return decodeURIComponent(value);
        }
    }
    return null;
};

/**
 * 清除会话认证 Cookie（S_TOKEN / S_UID / S_TOKEN_TIME）
 * 注意：DEVICE_ID 为 10 年设备标识，保留不删
 */
export const clearAuthCookies = (): void => {
    const authCookieNames = ["S_TOKEN", "S_UID", "S_TOKEN_TIME"];
    authCookieNames.forEach((name) => {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    });
};

// 创建全局 token 管理器实例
export const tokenManager = new TokenManager();

/**
 * 业务错误回调注册表
 *
 * http.ts 不包含任何业务语义，具体 errno 的处理逻辑由
 * errorHandlers.ts 等业务模块通过 setBusinessErrorHandler 注册。
 */
type BusinessErrorHandler = (errno: number, data?: any) => void;
let businessErrorHandler: BusinessErrorHandler | null = null;

export const setBusinessErrorHandler = (handler: BusinessErrorHandler | null): void => {
    businessErrorHandler = handler;
};

/**
 * HTTP请求配置接口
 */
export interface HttpRequestConfig extends AxiosRequestConfig {
    loading?: boolean;
    showError?: boolean;
    timeout?: number;
}

/**
 * HTTP错误类
 */
export class HttpError extends Error {
    code: number;
    errno?: number;
    config: HttpRequestConfig;
    msg: string;

    constructor(message: string, code: number, config: HttpRequestConfig, errno?: number) {
        super(message);
        this.name = "HttpError";
        this.code = code;
        this.errno = errno;
        this.config = config;
        this.msg = message; // 添加 msg 属性，与 message 保持一致
    }
}

/**
 * 触发浏览器下载 Blob
 */
function triggerBlobDownload(blob: Blob, filename: string): void {
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
}

/**
 * HTTP请求类
 */
class HttpClient {
    private instance: AxiosInstance;
    private baseURL: string;
    private timeout: number;

    constructor(config: { baseURL?: string; timeout?: number } = {}) {
        // 根据环境变量决定baseURL和凭据设置
        const useProxy = import.meta.env.VITE_USE_PROXY === "true";
        const requireCredentials = import.meta.env.VITE_REQUIRE_CREDENTIALS === "true";

        this.baseURL = config.baseURL || (useProxy ? "/api/v1" : `${import.meta.env.VITE_API_BASE_URL}`);
        this.timeout = config.timeout || 10000;

        this.instance = axios.create({
            baseURL: this.baseURL,
            timeout: this.timeout,
            withCredentials: requireCredentials,
            headers: {
                "Content-Type": "application/json",
            },
        });

        // 调试：输出HTTP配置信息
        // // console.log('🔗 HTTP实例配置:', {
        //     baseURL: this.baseURL,
        //     withCredentials: requireCredentials,
        //     useProxy,
        //     environment: import.meta.env.MODE
        // });

        this.setupInterceptors();
    }

    /**
     * 设置请求和响应拦截器
     */
    private setupInterceptors(): void {
        // 请求拦截器
        this.instance.interceptors.request.use(
            (config) => {
                // 调试：输出请求信息
                const fullURL = `${config.baseURL}${config.url}`;
                // 额外调试：检查路径是否正确
                if (import.meta.env.VITE_USE_PROXY === "true" && fullURL.includes("/api/")) {
                    // // console.log('✅ 代理路径正确:', fullURL);
                } else if (import.meta.env.VITE_USE_PROXY === "true") {
                    // console.warn('⚠️ 代理路径可能有问题:', fullURL);
                }

                // 在发送请求之前添加 token
                const token = tokenManager.getToken();
                if (token && config.headers) {
                    config.headers.Authorization = `Bearer ${token}`;
                }

                return config;
            },
            (error) => {
                // 对请求错误做些什么
                return Promise.reject(error);
            },
        );

        // 响应拦截器
        this.instance.interceptors.response.use(
            (response: AxiosResponse<HttpResponse>) => {
                // 调试：输出响应信息
                // // console.log('📥 收到响应:', {
                //     status: response.status,
                //     statusText: response.statusText,
                //     url: response.config.url,
                //     baseURL: response.config.baseURL,
                //     data: response.data,
                //     headers: response.headers
                // });

                // 检查登录接口的响应headers中的token（从Cookie中提取S_TOKEN）
                if (response.config.url?.includes("/login") && response.status === 200) {
                    const setCookieHeader = response.headers["set-cookie"];
                    if (setCookieHeader) {
                        // 从Set-Cookie header中提取S_TOKEN
                        const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
                        let sToken = null;

                        for (const cookie of cookies) {
                            const tokenMatch = cookie.match(/S_TOKEN=([^;]+)/);
                            if (tokenMatch) {
                                sToken = tokenMatch[1];
                                break;
                            }
                        }

                        if (sToken) {
                            // // console.log('🔑 从Cookie中获取到S_TOKEN:', sToken);
                            // 将token添加到响应数据中，方便后续处理
                            (response.data as any).token = sToken;
                        } else {
                            // // console.log('🍪 未在Cookie中找到S_TOKEN，完整Cookie:', cookies);
                        }
                    } else {
                        // // console.log('📥 响应中没有Set-Cookie header');
                    }
                }

                // 对响应数据做点什么
                const { data } = response;
                // 检查HTTP状态码
                if (response.status === 200) {
                    // HTTP 200 成功，进一步检查业务 errno
                    if (data && typeof data === "object" && "errno" in data) {
                        if (data.errno === 0 || data.success) {
                            return response;
                        } else {
                            // 业务错误，使用后端返回的 msg 作为后备，优先查错误码表
                            const errno = data.errno as number;
                            const fallbackMsg = (data as any)?.msg || (data as any)?.message || "请求失败";
                            const mappedMessage = getErrorMsg(errno, fallbackMsg);

                            // 交给业务层处理（如 1101 未登录清理等）
                            businessErrorHandler?.(errno, data);

                            throw new HttpError(mappedMessage, 200, response.config as HttpRequestConfig, errno);
                        }
                    } else {
                        // 没有 errno 字段的旧格式响应，认为成功
                        return response;
                    }
                }

                // 如果后端直接返回数据，包装成标准格式
                return response;
            },
            (error: AxiosError) => {
                // 如果已经是 HttpError，直接传递
                if (error instanceof HttpError) {
                    return Promise.reject(error);
                }

                // 调试：输出错误信息
                console.error("❌ 请求错误:", {
                    message: error.message,
                    code: error.code,
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    url: error.config?.url,
                    baseURL: error.config?.baseURL,
                    withCredentials: error.config?.withCredentials,
                });

                // 对响应错误做点什么
                let message = "网络错误";
                let code = 500;
                let responseErrno: number | undefined;

                if (error.response) {
                    // 服务器返回了响应（正常业务流不会出现非 200，做防御性处理）
                    const { status, data } = error.response;
                    code = status;
                    responseErrno = (data as any)?.errno;
                    const fallbackMsg = (data as any)?.msg || (data as any)?.message;

                    if (responseErrno) {
                        message = getErrorMsg(responseErrno, fallbackMsg);
                    } else {
                        message = `请求失败 (${status})`;
                    }
                } else if (error.request) {
                    // 请求已发出，但没有收到响应
                    if (error.code === "ECONNABORTED") {
                        message = "请求超时";
                    } else {
                        message = "网络连接失败";
                    }
                } else {
                    // 在设置请求时触发了错误
                    message = error.message || "请求配置错误";
                }

                const httpError = new HttpError(message, code, error.config as HttpRequestConfig, responseErrno);
                return Promise.reject(httpError);
            },
        );
    }

    /**
     * GET请求
     */
    async get<T = any>(url: string, config?: HttpRequestConfig): Promise<HttpResponse<T>> {
        const response = await this.instance.get<HttpResponse<T>>(url, config);
        return response.data;
    }

    /**
     * POST请求
     */
    async post<T = any>(url: string, data?: any, config?: HttpRequestConfig): Promise<HttpResponse<T>> {
        const response = await this.instance.post<HttpResponse<T>>(url, data, config);
        return response.data;
    }

    /** Form encoding stays here; callers retain field selection and omission rules. */
    async postForm<T = any>(
        url: string,
        fields: URLSearchParams | Record<string, string | number | boolean | null | undefined>,
        config?: HttpRequestConfig,
    ): Promise<HttpResponse<T>> {
        const body = fields instanceof URLSearchParams ? fields : new URLSearchParams();
        if (!(fields instanceof URLSearchParams)) {
            for (const [key, value] of Object.entries(fields)) {
                if (value !== null && value !== undefined) {
                    body.append(key, String(value));
                }
            }
        }
        return this.post<T>(url, body.toString(), {
            ...config,
            headers: { ...config?.headers, "Content-Type": "application/x-www-form-urlencoded" },
        });
    }

    /**
     * PUT请求
     */
    async put<T = any>(url: string, data?: any, config?: HttpRequestConfig): Promise<HttpResponse<T>> {
        const response = await this.instance.put<HttpResponse<T>>(url, data, config);
        return response.data;
    }

    /**
     * PATCH请求
     */
    async patch<T = any>(url: string, data?: any, config?: HttpRequestConfig): Promise<HttpResponse<T>> {
        const response = await this.instance.patch<HttpResponse<T>>(url, data, config);
        return response.data;
    }

    /**
     * DELETE请求
     */
    async delete<T = any>(url: string, config?: HttpRequestConfig): Promise<HttpResponse<T>> {
        const response = await this.instance.delete<HttpResponse<T>>(url, config);
        return response.data;
    }

    /**
     * 文件上传
     */
    async upload<T = any>(url: string, formData: FormData, config?: HttpRequestConfig): Promise<HttpResponse<T>> {
        const uploadConfig: HttpRequestConfig = {
            ...config,
            headers: {
                "Content-Type": "multipart/form-data",
                ...config?.headers,
            },
        };

        const response = await this.instance.post<HttpResponse<T>>(url, formData, uploadConfig);
        return response.data;
    }

    /**
     * 文件下载 - 使用原生 fetch，绕过 axios 拦截器
     * 后端直接返回文件二进制流，通过 Authorization header 鉴权
     */
    async download(url: string, filename?: string, _config?: HttpRequestConfig): Promise<void> {
        const fullUrl = `${this.baseURL}${url}`;
        const headers: HeadersInit = {};
        const token = tokenManager.getToken();
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
        const res = await fetch(fullUrl, { headers, credentials: "include" });

        if (!res.ok) {
            let msg = "下载失败";
            try {
                const err = await res.json();
                msg = err.msg || err.message || msg;
            } catch {
                msg = `下载失败 (HTTP ${res.status})`;
            }
            throw new Error(msg);
        }

        const blob = await res.blob();

        // 从 Content-Disposition 中提取文件名
        const disposition = res.headers.get("Content-Disposition");
        let fileName = filename || "download";
        if (disposition) {
            const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";\n]+)"?/);
            if (match) {
                try {
                    fileName = decodeURIComponent(match[1]);
                } catch {
                    fileName = match[1];
                }
            }
        }

        triggerBlobDownload(blob, fileName);
    }

    /**
     * 取消请求
     */
    createCancelToken() {
        return axios.CancelToken.source();
    }

    /**
     * 检查是否为取消请求的错误
     */
    isCancel(error: any): boolean {
        return axios.isCancel(error);
    }

    /**
     * 暴露当前使用的后端 baseURL，用于展示环境标签
     */
    getBaseURL(): string {
        return this.baseURL;
    }
}

// 创建默认实例 - 自动使用代理配置
export const http = new HttpClient({
    timeout: 10000,
});

/**
 * 根据正在连接的后端地址推断环境标签（测试/正式）
 */
export const resolveBackendEnvLabel = (baseURL?: string): "正式环境" | "测试环境" => {
    const target = baseURL || http.getBaseURL() || "";
    let host = "";

    try {
        const resolvedUrl = target.startsWith("http") ? new URL(target) : new URL(target, window.location.origin);
        host = resolvedUrl.hostname.toLowerCase();
    } catch (error) {
        host = target.toLowerCase();
    }

    const isTestHost =
        host.includes("localhost") ||
        host.includes("127.0.0.1") ||
        host.includes("dev") ||
        host.includes("test") ||
        host.includes("staging");

    return isTestHost ? "测试环境" : "正式环境";
};

// 导出类型和类
export { HttpClient };
export default http;
