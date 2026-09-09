import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { AuthService } from "../services/authService";
import { tokenManager, getTokenFromCookie, clearAuthCookies } from "../utils/http";
import { notificationWS, chatWS } from "../utils/websocket";
import { setFaviconBadge } from "../utils/favicon";
import { resetNotificationState } from "../utils/notificationState";
import { canChat } from "../types/roles";

// 用户信息类型
export interface User {
    id: number | string;
    account: string;
    name: string;
    email: string;
    avatar?: string;
    bio?: string;
    website?: string;
    github?: string;
    role: number;
    login_time: number | string;
    status: number | string;
    following_count?: number;
    follower_count?: number;
}

// 认证上下文类型
interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (authId: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
    loading: boolean;
    loginError: string | null;
    clearLoginError: () => void;
}

// 创建认证上下文
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 认证提供者组件
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [loginError, setLoginError] = useState<string | null>(null);
    const navigate = useNavigate();

    const extractToken = (response: any): string | null => {
        const candidates = [
            response?.token,
            response?.access_token,
            response?.data?.token,
            response?.data?.access_token,
            response?.data?.data?.token,
            response?.data?.data?.access_token,
            response?.data?.data?.data?.token,
            response?.data?.data?.data?.access_token,
        ];

        for (const t of candidates) {
            if (typeof t === "string" && t.trim()) {
                return t;
            }
        }
        return null;
    };

    const clearAuthRuntimeState = useCallback(() => {
        setUser(null);
        setToken(null);
        tokenManager.clearToken();
        clearAuthCookies();
        resetNotificationState();
        setFaviconBadge(0);
    }, []);

    // 初始化认证状态
    useEffect(() => {
        const initAuth = async () => {
            try {
                const cookieToken = getTokenFromCookie();

                if (cookieToken) {
                    setToken(cookieToken);
                    tokenManager.setToken(cookieToken);
                }

                try {
                    const userResponse = await AuthService.getUserInfo();

                    if (userResponse.data && userResponse.errno === 0) {
                        const userData = userResponse.data;
                        userData.role = Number(userData.role) || 1;
                        setUser(userData as User);
                    } else {
                        clearAuthRuntimeState();
                    }
                } catch (_userError) {
                    clearAuthRuntimeState();
                }
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, []);

    // 会话失效（token 过期 / 被顶下线）→ 清除登录态并跳转登录页
    useEffect(() => {
        const handleSessionInvalidated = () => {
            clearAuthRuntimeState();
            if (!window.location.pathname.startsWith("/auth")) {
                navigate("/auth");
            }
        };
        tokenManager.addSessionInvalidatedListener(handleSessionInvalidated);
        return () => {
            tokenManager.removeSessionInvalidatedListener(handleSessionInvalidated);
        };
    }, [clearAuthRuntimeState, navigate]);

    // 计算是否已认证（必须在 WebSocket useEffect 之前声明）
    const isAuthenticated = !!user;

    // WebSocket 连接管理 — 在 AuthProvider 层持久化，不会随路由切换重连
    useEffect(() => {
        if (isAuthenticated && user) {
            notificationWS.connect(user.id);
            // 普通用户无私信权限，不建立聊天连接（后端同样拒绝，避免重连循环）
            if (canChat(user.role)) {
                chatWS.connect(user.id);
            } else {
                chatWS.disconnect();
            }
        } else {
            notificationWS.disconnect();
            chatWS.disconnect();
            setFaviconBadge(0); // 退出登录或未认证时清除 favicon 角标
        }
    }, [isAuthenticated, user]);

    // WebSocket 错误不负责轮换 token。token 只由主动续期计时器更新，
    // 避免页面首次建立 WS 后收到 1101 就导致每次刷新页面都调用 refresh_token。
    useEffect(() => {
        // 聊天 WS 失败（如无权限/账号异常）绝不影响登录态，仅停止重连避免循环。
        const unsubChatError = chatWS.onServerError(() => {
            chatWS.disconnect();
        });
        const unsubError = notificationWS.onServerError((err) => {
            // 账号状态异常（1103），刷新 token 无意义，直接登出
            if (err.errno === 1103) {
                clearAuthRuntimeState();
                return;
            }
            // 1101 只代表该 WebSocket 会话被服务端拒绝，不能据此轮换全局 token。
            // HTTP 请求收到 1101 时仍由 http.ts 统一清理登录态；主动续期由下方计时器负责。
            if (err.errno === 1101) {
                notificationWS.disconnect();
            }
        });
        return () => {
            unsubError();
            unsubChatError();
        };
    }, [clearAuthRuntimeState]);

    // 登录方法
    const login = async (authId: string, password: string) => {
        return loginWithRetry(authId, password, false);
    };

    const loginWithRetry = async (authId: string, password: string, retried: boolean) => {
        try {
            setLoginError(null);
            setLoading(true);
            resetNotificationState();
            setFaviconBadge(0);

            const response = await AuthService.login(authId, password);

            if (response.errno === 0) {
                let userToken = extractToken(response);

                if (!userToken) {
                    userToken = getTokenFromCookie();
                }

                if (userToken) {
                    setToken(userToken);
                    tokenManager.setToken(userToken);
                    // console.log('✅ Token已设置:', userToken);
                } else {
                    // console.warn('⚠️ 未找到token，检查响应headers和Cookie:', (response as any).headers);
                    // console.log('🍪 当前页面Cookie:', document.cookie);
                }

                // 获取最新的用户信息
                try {
                    const userResponse = await AuthService.getUserInfo();

                    if (userResponse.data && userResponse.errno === 0) {
                        const updatedUser = userResponse.data;
                        updatedUser.role = Number(updatedUser.role) || 1;
                        setUser(updatedUser as User);
                    } else {
                        console.warn("⚠️ 用户信息接口返回异常:", userResponse);
                    }
                } catch (_userError) {
                    // console.warn('⚠️ 获取最新用户信息失败，使用登录返回的用户信息:', userError);
                    // 如果获取用户信息失败，使用登录响应中的用户信息
                    if ((response.data as any)?.user) {
                        const fallbackUserData = (response.data as any).user;
                        // 转换为User类型
                        const fallbackUser: User = {
                            ...fallbackUserData,
                            account: fallbackUserData.username || fallbackUserData.account || "",
                            login_time: fallbackUserData.login_time || new Date().toISOString(),
                            status: fallbackUserData.status || "active",
                        };
                        setUser(fallbackUser);
                        // console.log('🔄 使用登录响应的用户信息:', fallbackUser);
                        // console.log('🔐 当前认证状态:', { token: userToken, user: fallbackUser });
                    }
                }
            } else {
                console.warn("⚠️ 登录响应状态异常:", response);
            }
        } catch (error: any) {
            // 2010 USER_ALREADY_LOGIN：本设备已有登录态，先登出再重试一次登录
            if (!retried && error?.errno === 2010) {
                try {
                    await AuthService.logout();
                } catch {
                    // 登出失败不阻断重试
                }
                clearAuthRuntimeState();
                return loginWithRetry(authId, password, true);
            }
            setLoginError(error.message || "登录失败");
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // 登出方法
    const logout = async () => {
        try {
            setLoading(true);
            // 调用后端登出接口
            await AuthService.logout();
            // 清除内存状态
            clearAuthRuntimeState();
            setLoginError(null);
        } catch (error) {
            console.error("登出失败:", error);
            // 即使后端登出失败，也清除本地状态
            clearAuthRuntimeState();
        } finally {
            setLoading(false);
        }
    };

    // 清除登录错误
    const clearLoginError = () => {
        setLoginError(null);
    };

    const value: AuthContextType = {
        user,
        token,
        login,
        logout,
        isAuthenticated,
        loading,
        loginError,
        clearLoginError,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 自定义hook：使用认证上下文
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth必须在AuthProvider内部使用");
    }
    return context;
};

export default AuthContext;
