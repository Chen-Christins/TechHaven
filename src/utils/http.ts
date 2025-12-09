import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, AxiosError } from 'axios';

/**
 * HTTP请求响应接口
 */
export interface HttpResponse<T = any> {
    code: number | string;
    message: string;
    data: T;
    success: boolean;
}

/**
 * Token 管理器 - 使用内存存储，避免 localStorage 安全风险
 */
class TokenManager {
    private token: string | null = null;
    private listeners: ((token: string | null) => void)[] = [];

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
        this.listeners.forEach(listener => listener(this.token));
    }
}

/**
 * 从Cookie中提取S_TOKEN
 */
export const getTokenFromCookie = (): string | null => {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'S_TOKEN') {
            return decodeURIComponent(value);
        }
    }
    return null;
};

// 创建全局 token 管理器实例
export const tokenManager = new TokenManager();

/**
 * 登录请求参数
 */
export interface LoginParams {
    auth_id: string;  // 账号/邮箱
    passwd: string;   // 密码
}

/**
 * 登录响应数据
 */
export interface LoginResponse {
    data: LoginResponse;
    token: string;
    user: {
        id: number;
        name: string;
        username: string;
        email: string;
        avatar: string;
        role: string;
        created_at: string;
    };
}

/**
 * 注册请求参数
 */
export interface RegisterParams {
    account: string;  // 账号
    email: string;    // 邮箱
    passwd: string;    // 原始密码（将被MD5加密）
    auth_code: string; // 邮件验证码
}

/**
 * 重置密码请求参数
 */
export interface ForgetPasswordParams {
    email: string;     // 邮箱
    passwd: string;    // 新密码
    auth_code: string; // 验证码
}

/**
 * 发送验证码请求参数
 */
export interface SendCodeParams {
    email: string;  // 邮箱
    agent: string;  // 用户代理
    type: '1' | '2' | '3' | '4';  // 操作类型：1 注册 2 登录 3 密码重置 4 更换邮箱
}

/**
 * 验证码操作类型常量
 */
export const CodeType = {
    REGISTER: '1',    // 注册
    LOGIN: '2',       // 登录
    PASSWORD_RESET: '3', // 密码重置
    EMAIL_CHANGE: '4'   // 更换邮箱
} as const;

export type CodeType = typeof CodeType[keyof typeof CodeType];

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
    config: HttpRequestConfig;
    msg: string;

    constructor(message: string, code: number, config: HttpRequestConfig) {
        super(message);
        this.name = 'HttpError';
        this.code = code;
        this.config = config;
        this.msg = message; // 添加 msg 属性，与 message 保持一致
    }
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
        const useProxy = import.meta.env.VITE_USE_PROXY === 'true';
        const requireCredentials = import.meta.env.VITE_REQUIRE_CREDENTIALS === 'true';

        this.baseURL = config.baseURL || (useProxy ? '/api' : `${import.meta.env.VITE_API_BASE_URL}`);
        this.timeout = config.timeout || 10000;

        this.instance = axios.create({
            baseURL: this.baseURL,
            timeout: this.timeout,
            withCredentials: requireCredentials,
            headers: {
                'Content-Type': 'application/json',
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
                if (import.meta.env.VITE_USE_PROXY === 'true' && fullURL.includes('/api/')) {
                    // // console.log('✅ 代理路径正确:', fullURL);
                } else if (import.meta.env.VITE_USE_PROXY === 'true') {
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
            }
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
                if (response.config.url?.includes('/login') && response.status === 200) {
                    const setCookieHeader = response.headers['set-cookie'];
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
                    // HTTP 200 成功，进一步检查业务状态码
                    if (data && typeof data === 'object' && 'code' in data) {
                        // 处理字符串和数字类型的成功状态码
                        if (data.code === 200 || data.code === '200' || data.success || data.code === 1 || data.code === '1') {
                            return response;
                        } else {
                            // 业务错误，需要根据业务状态码进行错误映射
                            const businessCode = Number(data.code);
                            const errorMsg = (data as any)?.msg || '请求失败';
                            let mappedMessage = errorMsg;
                            // // console.log('⚠️ 业务错误响应:', {
                            //     businessCode,
                            //     errorMsg,
                            //     url: response.config.url,
                            //     data: response.data
                            // });
                            // 根据业务状态码映射错误信息
                            switch (businessCode) {
                                case 400:
                                    if (errorMsg.includes('param account passwd empty')) {
                                        mappedMessage = '账号和密码不能为空';
                                    } else if (errorMsg.includes('no param')) {
                                        mappedMessage = '缺少必要参数';
                                    }
                                    break;
                                case 401:
                                    if (errorMsg.includes('email exists')) {
                                        mappedMessage = '邮箱已被注册';
                                    } else if (errorMsg.includes('account exists')) {
                                        mappedMessage = '账号已被注册';
                                    } else {
                                        mappedMessage = '未授权，请重新登录';
                                        this.handleUnauthorized();
                                    }
                                    break;
                                case 402:
                                    if (errorMsg.includes('invalid auth_id')) {
                                        mappedMessage = '账号或邮箱格式不正确';
                                    } else {
                                        mappedMessage = '账号或邮箱格式不正确';
                                    }
                                    break;
                                case 403:
                                    if (errorMsg.includes('invalid auth_id')) {
                                        mappedMessage = '账号或邮箱不存在';
                                    } else if (errorMsg.includes('invalid auth_code')) {
                                        mappedMessage = '验证码无效或已过期';
                                    } else if (errorMsg.includes('Access Denied')) { 
                                        mappedMessage = '权限不足，拒绝访问';
                                    } else {
                                        mappedMessage = '账号状态异常';
                                    }
                                    break;
                                case 404:
                                    if (errorMsg.includes('not found')) {
                                        mappedMessage = '请求资源不存在';
                                    } else if (errorMsg.includes('auth_id not exists')) {
                                        mappedMessage = '账号或邮箱不存在';
                                    } else if (errorMsg.includes('user not found')) {
                                        mappedMessage = '用户不存在';
                                    } else if (errorMsg.includes('file not found')) {
                                        mappedMessage = '请求资源不存在';
                                    } else if (errorMsg.includes('resource not found')) {
                                        mappedMessage = '请求资源不存在';
                                    } else if (errorMsg.includes('invalid id')) {
                                        mappedMessage = '请求资源不存在';
                                    }
                                    break;
                                case 405:
                                    if (errorMsg.includes('invalid passwd')) {
                                        mappedMessage = '密码错误，请重新输入';
                                    }
                                    break;
                                case 406:
                                    if (errorMsg.includes('invalid state')) {
                                        mappedMessage = '账号状态异常，请联系管理员';
                                    }
                                    break;
                                case 410:
                                    if (errorMsg.includes('account invalid state')) {
                                        mappedMessage = '账号状态异常，请联系管理员';
                                    } else if (errorMsg.includes('already login')) {
                                        mappedMessage = '账号已在其他设备登录';
                                    } else if (errorMsg.includes('invalid passwd')) {
                                        mappedMessage = '密码错误，请重新输入';
                                    } else if (errorMsg.includes('invalid state')) {
                                        mappedMessage = '账号状态异常，请联系管理员';
                                    } else {
                                        mappedMessage = '账号状态异常';
                                    }
                                    break;
                                case 500:
                                    if (errorMsg.includes('not login')) {
                                        mappedMessage = '未登录，请重新登录';
                                    } else {
                                        mappedMessage = '服务器内部错误，请联系管理员';
                                    }
                                    break;
                                case 501:
                                    mappedMessage = '服务器内部错误，请联系管理员';
                                    break;
                                default:
                                    // 保持原始错误信息
                                    break;
                            }

                            throw new HttpError(
                                mappedMessage,
                                businessCode,
                                response.config as HttpRequestConfig
                            );
                        }
                    } else {
                        // 没有标准业务状态码，但HTTP状态码是200，认为成功
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
                console.error('❌ 请求错误:', {
                    message: error.message,
                    code: error.code,
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    url: error.config?.url,
                    baseURL: error.config?.baseURL,
                    withCredentials: error.config?.withCredentials
                });

                // 对响应错误做点什么
                let message = '网络错误';
                let code = 500;

                if (error.response) {
                    // 服务器返回了响应，但状态码不在 2xx 范围内
                    const { status, data } = error.response;
                    code = status;

                    switch (status) {
                        case 400:
                            // 根据上下文判断具体错误类型
                            const errorMsg = (data as any)?.msg || '请求参数错误';
                            if (errorMsg.includes('param account passwd empty')) {
                                message = '账号和密码不能为空';
                            } else if (errorMsg.includes('no param')) {
                                message = '缺少必要参数';
                            } else if (errorMsg.includes('invalid email format')) {
                                message = '邮箱格式不正确';
                            } else {
                                message = errorMsg;
                            }
                            break;
                        case 401:
                            // 根据上下文判断具体错误类型
                            const authErrorMsg = (data as any)?.msg || '认证失败';
                            if (authErrorMsg.includes('email exists')) {
                                message = '邮箱已被注册';
                            } else if (authErrorMsg.includes('account exists')) {
                                message = '账号已被注册';
                            } else {
                                message = '未授权，请重新登录';
                                this.handleUnauthorized();
                            }
                            break;
                        case 402:
                            // 根据上下文判断具体错误类型
                            const formatErrorMsg = (data as any)?.msg || '格式错误';
                            if (formatErrorMsg.includes('invalid account')) {
                                message = '账号格式不正确';
                            } else if (formatErrorMsg.includes('invalid email format')) {
                                message = '邮箱格式不正确';
                            } else if (formatErrorMsg.includes('invalid auth_id')) {
                                message = '账号或邮箱格式不正确';
                            } else {
                                message = '账号或邮箱格式不正确';
                            }
                            break;
                        case 403:
                            // 根据上下文判断具体错误类型
                            const invalidMsg = (data as any)?.msg || '账号状态异常';
                            if (invalidMsg.includes('invalid auth_code')) {
                                message = '验证码无效或已过期';
                            } else if (invalidMsg.includes('invalid auth_id')) {
                                message = '账号或邮箱不存在';
                            } else {
                                message = '账号状态异常';
                            }
                            break;
                        case 404:
                            message = '请求资源不存在';
                            break;
                        case 410:
                            // 根据后端返回的具体错误信息判断
                            const statusErrorMsg = (data as any)?.msg || '账号状态异常';
                            if (statusErrorMsg.includes('account invalid state')) {
                                message = '账号状态异常，请联系管理员';
                            } else if (statusErrorMsg.includes('already login')) {
                                message = '账号已在其他设备登录';
                            } else if (statusErrorMsg.includes('invalid passwd')) {
                                message = '密码错误，请重新输入';
                            } else if (statusErrorMsg.includes('invalid state')) {
                                message = '账号状态异常，请联系管理员';
                            } else {
                                message = '账号状态异常';
                            }
                            break;
                        case 500:
                            message = '服务器内部错误，请联系管理员';
                            break;
                        case 502:
                            message = '网关错误';
                            break;
                        case 501:
                            message = '服务器内部错误，请联系管理员';
                            break;
                        case 503:
                            message = '服务不可用';
                            break;
                        case 504:
                            message = '网关超时';
                            break;
                        default:
                            message = (data as any)?.msg || `请求失败 (${status})`;
                    }
                } else if (error.request) {
                    // 请求已发出，但没有收到响应
                    if (error.code === 'ECONNABORTED') {
                        message = '请求超时';
                    } else {
                        message = '网络连接失败';
                    }
                } else {
                    // 在设置请求时触发了错误
                    message = error.message || '请求配置错误';
                }

                const httpError = new HttpError(message, code, error.config as HttpRequestConfig);
                return Promise.reject(httpError);
            }
        );
    }

    /**
     * 处理未授权错误
     */
    private handleUnauthorized(): void {
        tokenManager.clearToken();
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
                'Content-Type': 'multipart/form-data',
                ...config?.headers,
            },
        };

        const response = await this.instance.post<HttpResponse<T>>(url, formData, uploadConfig);
        return response.data;
    }

    /**
     * 文件下载
     */
    async download(url: string, filename?: string, config?: HttpRequestConfig): Promise<void> {
        const downloadConfig: HttpRequestConfig = {
            ...config,
            responseType: 'blob',
        };

        const response = await this.instance.get(url, downloadConfig);
        const blob = new Blob([response.data]);
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
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
}

// 创建默认实例 - 自动使用代理配置
export const http = new HttpClient({
    timeout: 10000,
});

// 导出类型和类
export { HttpClient };
export default http;