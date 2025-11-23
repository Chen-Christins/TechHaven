import http, {
    type LoginParams,
    type LoginResponse,
    type RegisterParams,
    type ForgetPasswordParams,
    type SendCodeParams,
    CodeType
} from '../utils/http';

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
            passwd: password
        };

        try {
            // 使用form-urlencoded格式发送登录请求
            const formData = new URLSearchParams();
            formData.append('auth_id', params.auth_id);
            formData.append('passwd', params.passwd);

            const response = await http.post<LoginResponse>('/user/login', formData.toString(), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
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
        const userAgent = navigator.userAgent || 'Unknown';

        const params: SendCodeParams = {
            email,
            agent: userAgent,
            type
        };

        // 使用form-urlencoded格式发送请求
        const formData = new URLSearchParams();
        formData.append('email', params.email);
        formData.append('agent', params.agent);
        formData.append('type', params.type);

        return http.post('/user/send_code', formData.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
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
        // 使用新的 /user/create 接口，需要对 passwd 进行 MD5 加密
        const registerParams = {
            account: params.account,
            email: params.email,
            passwd: params.passwd,
            auth_code: params.auth_code
        };

        // 使用 form-urlencoded 格式发送请求
        const formData = new URLSearchParams();
        formData.append('account', registerParams.account);
        formData.append('email', registerParams.email);
        formData.append('passwd', registerParams.passwd);
        formData.append('auth_code', registerParams.auth_code);

        return http.post('/user/create', formData.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
    }

    /**
     * 用户登出
     */
    static logout() {
        // 调用后端的登出接口
        return http.post('/user/logout', {}, {});
    }

    /**
     * 获取用户信息
     * @param userId 可选，用户ID。不传则获取当前用户信息
     * @returns 用户信息
     */
    static async getUserInfo(userId?: number) {
        const url = userId ? `/user/info?id=${userId}` : '/user/info';
        return http.get(url);
    }

    /**
     * 验证token有效性
     * @returns token是否有效
     */
    static async validateToken(): Promise<boolean> {
        try {
            const response = await http.get('/user/validate');
            return response.data.code === 200;
        } catch {
            return false;
        }
    }

    /**
     * 刷新token
     * @returns 新token
     */
    static async refreshToken(): Promise<string> {
        const response = await http.post<{
            data: any; token: string
        }>('/user/refresh');

        if (response.data.data?.token) {
            // 返回新token，由调用方管理状态
            return response.data.data.token;
        }

        throw new Error('刷新token失败');
    }

    /**
     * 修改密码
     * @param oldPassword 旧密码
     * @param newPassword 新密码
     */
    static async changePassword(oldPassword: string, newPassword: string) {
        return http.post('/user/change-password', {
            old_passwd: oldPassword,
            new_passwd: newPassword
        });
    }

    /**
     * 重置密码
     * @param token 重置token
     * @param newPassword 新密码
     */
    static async resetPassword(token: string, newPassword: string) {
        return http.post('/user/reset-password', {
            token,
            new_passwd: newPassword
        });
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
            auth_code: authCode
        };
        // console.log('忘记密码重置参数:', params);

        // 使用form-urlencoded格式发送请求，与其他认证接口保持一致
        const formData = new URLSearchParams();
        formData.append('email', params.email);
        formData.append('passwd', params.passwd);
        formData.append('auth_code', params.auth_code);

        return http.post('/user/forget_passwd', formData.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
    }
}

export default AuthService;