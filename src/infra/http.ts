import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, AxiosError } from "axios";
import { getErrorMsg } from "../utils/errorCodes.ts";
import { tokenManager } from "../auth/tokenManager.ts";

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
    responseData?: unknown;
    isTimeout: boolean;
    isCanceled: boolean;

    constructor(
        message: string,
        code: number,
        config: HttpRequestConfig = {},
        options: { errno?: number; responseData?: unknown; cause?: unknown; isTimeout?: boolean; isCanceled?: boolean } = {},
    ) {
        super(message, { cause: options.cause });
        this.name = "HttpError";
        this.code = code;
        this.errno = options.errno;
        this.config = config;
        this.msg = message;
        this.responseData = options.responseData;
        this.isTimeout = options.isTimeout ?? false;
        this.isCanceled = options.isCanceled ?? false;
    }
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function getResponseMessage(data: unknown): string | undefined {
    if (!isRecord(data)) {
        return undefined;
    }
    const message = typeof data.msg === "string" ? data.msg : data.message;
    return typeof message === "string" ? message : undefined;
}

function getResponseErrno(data: unknown): number | undefined {
    return isRecord(data) && typeof data.errno === "number" ? data.errno : undefined;
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
                if (token && config.headers && !config.headers.Authorization) {
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

                if (!isRecord(data)) {
                    return response;
                }

                const errno = getResponseErrno(data);
                const failed = (errno !== undefined && errno !== 0) || (errno === undefined && data.success === false);
                if (failed) {
                    const fallbackMessage = getResponseMessage(data) || "请求失败";
                    const mappedMessage = errno === undefined ? fallbackMessage : getErrorMsg(errno, fallbackMessage);
                    if (errno !== undefined) {
                        businessErrorHandler?.(errno, data);
                    }
                    throw new HttpError(mappedMessage, response.status, response.config as HttpRequestConfig, {
                        errno,
                        responseData: data,
                    });
                }
                return response;
            },
            (error: unknown) => {
                if (error instanceof HttpError) {
                    return Promise.reject(error);
                }

                if (!axios.isAxiosError(error)) {
                    const message = error instanceof Error ? error.message : "请求配置错误";
                    return Promise.reject(new HttpError(message, 500, {}, { cause: error }));
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
                const isCanceled = axios.isCancel(error) || error.code === AxiosError.ERR_CANCELED;
                const isTimeout = error.code === AxiosError.ECONNABORTED || error.code === AxiosError.ETIMEDOUT;

                if (error.response) {
                    const { status, data } = error.response;
                    code = status;
                    responseErrno = getResponseErrno(data);
                    const fallbackMsg = getResponseMessage(data);

                    if (responseErrno !== undefined) {
                        message = getErrorMsg(responseErrno, fallbackMsg);
                        businessErrorHandler?.(responseErrno, data);
                    } else {
                        message = fallbackMsg || `请求失败 (${status})`;
                    }
                } else if (isCanceled) {
                    message = "请求已取消";
                } else if (error.request) {
                    if (isTimeout) {
                        message = "请求超时";
                    } else {
                        message = "网络连接失败";
                    }
                } else {
                    message = error.message || "请求配置错误";
                }

                const httpError = new HttpError(message, code, error.config as HttpRequestConfig, {
                    errno: responseErrno,
                    responseData: error.response?.data,
                    cause: error,
                    isTimeout,
                    isCanceled,
                });
                return Promise.reject(httpError);
            },
        );
    }

    async get<T = any>(url: string, config?: HttpRequestConfig): Promise<HttpResponse<T>> {
        const response = await this.instance.get<HttpResponse<T>>(url, config);
        return response.data;
    }

    async post<T = any>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<HttpResponse<T>> {
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

    async put<T = any>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<HttpResponse<T>> {
        const response = await this.instance.put<HttpResponse<T>>(url, data, config);
        return response.data;
    }

    async patch<T = any>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<HttpResponse<T>> {
        const response = await this.instance.patch<HttpResponse<T>>(url, data, config);
        return response.data;
    }

    async delete<T = any>(url: string, config?: HttpRequestConfig): Promise<HttpResponse<T>> {
        const response = await this.instance.delete<HttpResponse<T>>(url, config);
        return response.data;
    }

    async upload<T = any>(url: string, formData: FormData, config?: HttpRequestConfig): Promise<HttpResponse<T>> {
        const response = await this.instance.post<HttpResponse<T>>(url, formData, config);
        return response.data;
    }

    async download(url: string, filename?: string, config?: HttpRequestConfig): Promise<void> {
        const response = await this.instance.get<Blob>(url, { ...config, responseType: "blob" });
        const blob = response.data;
        const disposition = response.headers["content-disposition"];
        let fileName = filename || "download";
        if (typeof disposition === "string") {
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

    createAbortController(): AbortController {
        return new AbortController();
    }

    isCancel(error: unknown): boolean {
        return axios.isCancel(error) || (error instanceof HttpError && error.isCanceled);
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
