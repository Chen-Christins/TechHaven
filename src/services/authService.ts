import http, {
  type LoginParams,
  type LoginResponse,
  type RegisterParams,
  type ForgetPasswordParams,
  type SendCodeParams,
  type HttpResponse,
  CodeType,
} from "../utils/http";

const REQUIRE_CREDENTIALS = import.meta.env.VITE_REQUIRE_CREDENTIALS === "true";

/**
 * 用户信息接口
 */
export interface UserInfo {
  data: boolean;
  code: string;
  id: number | string;
  account: string;
  email: string;
  name: string;
  role: string;
  create_time: number;
  is_deleted: number;
  update_time: number;
  login_time: number;
  status: number;
}

export interface UserAdminListParams {
  page_num: number;
  page_size: number;
  role?: number;
  state?: number;
  days?: number;
}

export interface UserAdminListResponse {
  total: number;
  list: Array<{
    id: number | string;
    name: string;
    email: string;
    role: string;
    state: number;
    create_time: number;
    login_time: number;
  }>;
}

/**
 * 认证服务类
 * 专门处理用户登录、注册等相关操作
 */
export class AuthService {
  /**
   * 用户登录
   * @param authId 账号/邮箱
   * @param password 原始密码
   * @returns 登录响应
   */
  static async login(authId: string, password: string) {
    const params: LoginParams = {
      auth_id: authId,
      passwd: password,
    };

    try {
      // 使用form-urlencoded格式发送登录请求
      const formData = new URLSearchParams();
      formData.append("auth_id", params.auth_id);
      formData.append("passwd", params.passwd);

      const response = await http.post<LoginResponse>("/user/login", formData.toString(), {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        withCredentials: REQUIRE_CREDENTIALS,
      });

      return response;
    } catch (error) {
      // 登录失败，抛出错误让调用方处理
      throw error;
    }
  }

  /**
   * 发送验证码
   * @param email 邮箱地址
   * @param type 操作类型
   * @returns 发送结果
   */
  static async sendVerificationCode(email: string, type: CodeType) {
    // 获取用户代理字符串
    const userAgent = navigator.userAgent || "Unknown";

    const params: SendCodeParams = {
      email,
      agent: userAgent,
      type,
    };

    // 使用form-urlencoded格式发送请求
    const formData = new URLSearchParams();
    formData.append("email", params.email);
    formData.append("agent", params.agent);
    formData.append("type", params.type);

    return http.post("/user/send_code", formData.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
  }

  /**
   * 注册验证码
   * @param email 邮箱地址
   * @returns 发送结果
   */
  static async sendRegisterCode(email: string) {
    return this.sendVerificationCode(email, CodeType.REGISTER);
  }

  /**
   * 登录验证码
   * @param email 邮箱地址
   * @returns 发送结果
   */
  static async sendLoginCode(email: string) {
    return this.sendVerificationCode(email, CodeType.LOGIN);
  }

  /**
   * 密码重置验证码
   * @param email 邮箱地址
   * @returns 发送结果
   */
  static async sendPasswordResetCode(email: string) {
    return this.sendVerificationCode(email, CodeType.PASSWORD_RESET);
  }

  /**
   * 更换邮箱验证码
   * @param email 新邮箱地址
   * @returns 发送结果
   */
  static async sendEmailChangeCode(email: string) {
    return this.sendVerificationCode(email, CodeType.EMAIL_CHANGE);
  }

  /**
   * 用户注册
   * @param params 注册参数
   * @returns 注册响应
   */
  static async register(params: RegisterParams) {
    // 使用新的 /user/create 接口
    const registerParams = {
      account: params.account,
      email: params.email,
      passwd: params.passwd,
      auth_code: params.auth_code,
    };

    // 使用 form-urlencoded 格式发送请求
    const formData = new URLSearchParams();
    formData.append("account", registerParams.account);
    formData.append("email", registerParams.email);
    formData.append("passwd", registerParams.passwd);
    formData.append("auth_code", registerParams.auth_code);

    return http.post("/user/create", formData.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
  }

  /**
   * 用户登出
   */
  static logout() {
    // 调用后端的登出接口
    return http.get("/user/logout");
  }

  /**
   * 获取用户信息
   * @param userId 可选，用户ID。不传则获取当前用户信息
   * @returns 用户信息
   */
  static async getUserInfo(userId?: number | string): Promise<HttpResponse<UserInfo>> {
    const url = userId ? `/user/info?user_id=${userId}` : "/user/info";
    return http.get<UserInfo>(url, { withCredentials: REQUIRE_CREDENTIALS });
  }

  /**
   * 获取用户列表 (Admin)
   * @returns 用户ID列表
   */
  static async listUsers(): Promise<Array<number | string>> {
    const response = await http.get<{ ids: Array<number | string> }>("/user/list");
    return response.data.ids;
  }

  static async listUsersAdmin(params: UserAdminListParams): Promise<UserAdminListResponse> {
    const response = await http.get<UserAdminListResponse>("/user/admin/lists", { params });
    return response.data;
  }

  /**
   * 检查用户是否存在
   * @param authId 邮箱或账号
   * @returns 是否存在
   */
  static async checkUserExists(authId: string): Promise<boolean> {
    const response = await http.get<{ is_exists: string }>(`/user/exists?auth_id=${authId}`);
    return response.data.is_exists === "1";
  }

  /**
   * 更新用户资料
   * - 改基本信息 (name/bio/website)：直接更新，无需 old_passwd
   * - 改密码 (passwd)：必须同时传 old_passwd，后端校验通过后才生效
   *
   * @param name 新昵称 (可选)
   * @param passwd 新密码 (可选，至少6位)
   * @param bio 座右铭 (可选)
   * @param website 个人网站 (可选)
   * @param oldPasswd 当前密码 (改密码时必传)
   */
  static async updateUserProfile(
    name?: string,
    passwd?: string,
    bio?: string,
    website?: string,
    oldPasswd?: string,
    avatar?: string,
  ) {
    const formData = new URLSearchParams();
    if (name) formData.append("name", name);
    if (passwd) formData.append("passwd", passwd);
    if (bio !== undefined) formData.append("bio", bio);
    if (website !== undefined) formData.append("website", website);
    if (oldPasswd) formData.append("old_passwd", oldPasswd);
    if (avatar) formData.append("avatar", avatar);

    return http.post("/user/update", formData.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
  }

  /**
   * 批量查询用户
   * @param userIds 用户ID列表
   * @returns 用户信息列表
   */
  static async queryUsersBatch(userIds: Array<number | string>): Promise<Array<{ id: number | string; name: string }>> {
    const idsStr = userIds.join(",");
    const response = await http.get<Array<{ id: number | string; name: string }>>(`/user/query?user_ids=${idsStr}`);
    return response.data;
  }

  /**
   * 忘记密码重置 - 使用邮箱、新密码和验证码直接重置
   * @param email 邮箱地址
   * @param newPassword 新密码
   * @param authCode 验证码
   * @returns 重置结果
   */
  static async forgetPassword(email: string, newPassword: string, authCode: string) {
    const params: ForgetPasswordParams = {
      email,
      passwd: newPassword,
      auth_code: authCode,
    };

    // 使用form-urlencoded格式发送请求
    const formData = new URLSearchParams();
    formData.append("email", params.email);
    formData.append("passwd", params.passwd);
    formData.append("auth_code", params.auth_code);

    return http.post("/user/forget_passwd", formData.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
  }

  /**
   * 获取用户统计数据
   */
  static async getUserStats(userId?: number | string): Promise<UserStats> {
    const url = userId ? `/user/stats?user_id=${userId}` : "/user/stats";
    const response = await http.get<UserStats>(url);
    return response.data;
  }
}

export interface UserStats {
  total_articles: number;
  published_articles: number;
  private_articles: number;
  total_views: number;
  total_likes: number;
  total_comments: number;
  total_tags: number;
  total_organizations: number;
}

export default AuthService;
