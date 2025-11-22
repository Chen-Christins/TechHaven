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
 * 登录请求参数
 */
export interface LoginParams {
  auth_id: string;  // 账号/邮箱
  passwd: string;   // 密码（md5）
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

  constructor(message: string, code: number, config: HttpRequestConfig) {
    super(message);
    this.name = 'HttpError';
    this.code = code;
    this.config = config;
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

    this.baseURL = config.baseURL || (useProxy ? '/api' : `${import.meta.env.VITE_API_BASE_URL}/api`);
    this.timeout = config.timeout || 10000;

    this.instance = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      withCredentials: requireCredentials,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * 设置请求和响应拦截器
   */
  private setupInterceptors(): void {
    // 请求拦截器
    this.instance.interceptors.request.use(
      (config) => {
        // 在发送请求之前做些什么
        const token = localStorage.getItem('token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // 添加请求时间戳
        if (config.params) {
          config.params._t = Date.now();
        } else {
          config.params = { _t: Date.now() };
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
              // 业务错误，支持 message 和 msg 字段
              throw new HttpError(
                (data as any).message || (data as any).msg || '请求失败',
                data.code.toString().includes('200') ? 500 : Number(data.code),
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
              const errorMsg = (data as any)?.message || '请求参数错误';
              if (errorMsg.includes('param account passwd empty')) {
                message = '账号和密码不能为空';
              } else if (errorMsg.includes('invalid email format')) {
                message = '邮箱格式不正确';
              } else {
                message = errorMsg;
              }
              break;
            case 401:
              // 根据上下文判断具体错误类型
              const authErrorMsg = (data as any)?.message || '认证失败';
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
              message = '账号不存在或格式错误';
              break;
            case 403:
              // 根据上下文判断具体错误类型
              const invalidMsg = (data as any)?.message || '账号状态异常';
              if (invalidMsg.includes('invalid auth_code')) {
                message = '验证码无效或已过期';
              } else {
                message = '账号状态异常';
              }
              break;
            case 404:
              message = '请求资源不存在';
              break;
            case 410:
              // 根据后端返回的具体错误信息判断
              const statusErrorMsg = (data as any)?.message || '账号状态异常';
              if (statusErrorMsg.includes('invalid state')) {
                message = '账号状态异常，请联系管理员';
              } else if (statusErrorMsg.includes('already login')) {
                message = '账号已在其他设备登录';
              } else if (statusErrorMsg.includes('invalid passwd')) {
                message = '密码错误，请重新输入';
              } else {
                message = statusErrorMsg;
              }
              break;
            case 500:
              message = '服务器内部错误，请稍后重试';
              break;
            case 502:
              message = '网关错误';
              break;
            case 503:
              message = '服务不可用';
              break;
            case 504:
              message = '网关超时';
              break;
            default:
              message = (data as any)?.message || `请求失败 (${status})`;
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
    localStorage.removeItem('token');
    // 可以在这里添加跳转到登录页的逻辑
    // window.location.href = '/login';
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

// 创建默认实例
export const http = new HttpClient({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8088',
  timeout: 10000,
});

// 导出类型和类
export { HttpClient };
export default http;