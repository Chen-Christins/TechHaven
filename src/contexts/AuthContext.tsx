import React, { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { AuthService } from "../services/authService";
import { tokenManager } from "../auth/tokenManager.ts";
import { getTokenFromCookie, clearAuthCookies } from "../auth/cookieHelper.ts";
import { notificationWS, chatWS } from "../services/wsInstances";
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
    const authGenerationRef = useRef(0);

    const disconnectWebSockets = useCallback(() => {
        notificationWS.disconnect();
        chatWS.disconnect();
    }, []);

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
        disconnectWebSockets();
        setUser(null);
        setToken(null);
        tokenManager.clearToken();
        clearAuthCookies();
        resetNotificationState();
        setFaviconBadge(0);
    }, [disconnectWebSockets]);

    // 初始化认证状态
    useEffect(() => {
        const generation = ++authGenerationRef.current;
        const initAuth = async () => {
            try {
                const cookieToken = getTokenFromCookie();

                if (!cookieToken) {
                    // 无 token → 直接标记未认证，不发请求
                    clearAuthRuntimeState();
                    return;
                }

                // 有 token → 设置后再 getUserInfo
                setToken(cookieToken);
                tokenManager.setToken(cookieToken);

                try {
                    const userResponse = await AuthService.getUserInfo();

                    if (
                        generation === authGenerationRef.current &&
                        tokenManager.getToken() === cookieToken &&
                        userResponse.data &&
                        userResponse.errno === 0
                    ) {
                        const userData = userResponse.data;
                        userData.role = Number(userData.role) || 1;
                        setUser(userData as User);
                    } else if (generation === authGenerationRef.current) {
                        clearAuthRuntimeState();
                    }
                } catch (_userError) {
                    if (generation === authGenerationRef.current) {
                        clearAuthRuntimeState();
                    }
                }
            } finally {
                if (generation === authGenerationRef.current) {
                    setLoading(false);
                }
            }
        };

        void initAuth();
        return () => {
            if (authGenerationRef.current === generation) {
                authGenerationRef.current++;
            }
        };
    }, []);

    // 会话失效（token 过期 / 被顶下线）→ 清除登录态并跳转登录页
    useEffect(() => {
        const handleSessionInvalidated = () => {
            authGenerationRef.current++;
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
    const isAuthenticated = Boolean(user && token);

    // WebSocket 连接管理 — 在 AuthProvider 层持久化，不会随路由切换重连
    useEffect(() => {
        const activeToken = tokenManager.getToken();
        if (isAuthenticated && user && token && activeToken === token) {
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
    }, [isAuthenticated, token, user]);

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
        const generation = ++authGenerationRef.current;
        try {
            setLoginError(null);
            setLoading(true);
            disconnectWebSockets();
            setUser(null);
            setToken(null);
            tokenManager.clearToken();
            resetNotificationState();
            setFaviconBadge(0);

            const response = await AuthService.login(authId, password);
            if (generation !== authGenerationRef.current) {
                return;
            }

            if (response.errno === 0) {
                let userToken = extractToken(response);

                if (!userToken) {
                    userToken = getTokenFromCookie();
                }

                if (!userToken) {
                    throw new Error("登录成功但未获取到认证令牌");
                }

                tokenManager.setToken(userToken);
                setToken(userToken);

                // 获取最新的用户信息
                try {
                    const userResponse = await AuthService.getUserInfo();

                    if (
                        generation === authGenerationRef.current &&
                        tokenManager.getToken() === userToken &&
                        userResponse.data &&
                        userResponse.errno === 0
                    ) {
                        const updatedUser = userResponse.data;
                        updatedUser.role = Number(updatedUser.role) || 1;
                        setUser(updatedUser as User);
                    } else {
                        throw new Error("登录成功但用户信息校验失败");
                    }
                } catch (_userError) {
                    if (generation !== authGenerationRef.current || tokenManager.getToken() !== userToken) {
                        return;
                    }
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
                    } else {
                        throw _userError;
                    }
                }
            } else {
                console.warn("⚠️ 登录响应状态异常:", response);
            }
        } catch (error: any) {
            if (generation !== authGenerationRef.current) {
                return;
            }
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
            clearAuthRuntimeState();
            throw error;
        } finally {
            if (generation === authGenerationRef.current) {
                setLoading(false);
            }
        }
    };

    // 登出方法
    const logout = async () => {
        const generation = ++authGenerationRef.current;
        try {
            setLoading(true);
            // 调用后端登出接口
            await AuthService.logout();
            if (generation !== authGenerationRef.current) {
                return;
            }
            // 清除内存状态
            clearAuthRuntimeState();
            setLoginError(null);
        } catch (error) {
            if (generation !== authGenerationRef.current) {
                return;
            }
            console.error("登出失败:", error);
            // 即使后端登出失败，也清除本地状态
            clearAuthRuntimeState();
        } finally {
            if (generation === authGenerationRef.current) {
                setLoading(false);
            }
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
