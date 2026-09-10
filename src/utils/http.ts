import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, AxiosError } from "axios";
import { getErrorMsg } from "./errorCodes";
import { tokenManager } from "./tokenManager";

/**
 * HTTP 请求响应接口
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
 * HTTP 请求配置接口
 */
export interface HttpRequestConfig extends AxiosRequestConfig {
    loading?: boolean;
    showError?: boolean;
    timeout?: number;
}

/**
 * HTTP 错误类
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
        this.msg = message;
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
 * HTTP 请求类
 */
class HttpClient {
    private instance: AxiosInstance;
    private baseURL: string;
    private timeout: number;

    constructor(config: { baseURL?: string; timeout?: number } = {}) {
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

        this.setupInterceptors();
    }

    private setupInterceptors(): void {
        this.instance.interceptors.request.use(
            (config) => {
                const token = tokenManager.getToken();
                if (token && config.headers) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            },
        );

        this.instance.interceptors.response.use(
            (response: AxiosResponse<HttpResponse>) => {
                const { data } = response;

                if (response.status === 200) {
                    if (data && typeof data === "object" && "errno" in data) {
                        if (data.errno === 0 || data.success) {
                            return response;
                        } else {
                            const errno = data.errno as number;
                            const fallbackMsg = (data as any)?.msg || (data as any)?.message || "请求失败";
                            const mappedMessage = getErrorMsg(errno, fallbackMsg);

                            businessErrorHandler?.(errno, data);

                            throw new HttpError(mappedMessage, 200, response.config as HttpRequestConfig, errno);
                        }
                    } else {
                        return response;
                    }
                }

                return response;
            },
            (error: AxiosError) => {
                if (error instanceof HttpError) {
                    return Promise.reject(error);
                }

                console.error("❌ 请求错误:", {
                    message: error.message,
                    code: error.code,
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    url: error.config?.url,
                    baseURL: error.config?.baseURL,
                    withCredentials: error.config?.withCredentials,
                });

                let message = "网络错误";
                let code = 500;
                let responseErrno: number | undefined;

                if (error.response) {
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
                    if (error.code === "ECONNABORTED") {
                        message = "请求超时";
                    } else {
                        message = "网络连接失败";
                    }
                } else {
                    message = error.message || "请求配置错误";
                }

                const httpError = new HttpError(message, code, error.config as HttpRequestConfig, responseErrno);
                return Promise.reject(httpError);
            },
        );
    }

    async get<T = any>(url: string, config?: HttpRequestConfig): Promise<HttpResponse<T>> {
        const response = await this.instance.get<HttpResponse<T>>(url, config);
        return response.data;
    }

    async post<T = any>(url: string, data?: any, config?: HttpRequestConfig): Promise<HttpResponse<T>> {
        const response = await this.instance.post<HttpResponse<T>>(url, data, config);
        return response.data;
    }

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

    async put<T = any>(url: string, data?: any, config?: HttpRequestConfig): Promise<HttpResponse<T>> {
        const response = await this.instance.put<HttpResponse<T>>(url, data, config);
        return response.data;
    }

    async patch<T = any>(url: string, data?: any, config?: HttpRequestConfig): Promise<HttpResponse<T>> {
        const response = await this.instance.patch<HttpResponse<T>>(url, data, config);
        return response.data;
    }

    async delete<T = any>(url: string, config?: HttpRequestConfig): Promise<HttpResponse<T>> {
        const response = await this.instance.delete<HttpResponse<T>>(url, config);
        return response.data;
    }

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

    createCancelToken() {
        return axios.CancelToken.source();
    }

    isCancel(error: any): boolean {
        return axios.isCancel(error);
    }

    getBaseURL(): string {
        return this.baseURL;
    }
}

export const http = new HttpClient({
    timeout: 10000,
});

export { HttpClient };
export default http;
