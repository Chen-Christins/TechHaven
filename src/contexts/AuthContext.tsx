import React, { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react";
import { AuthService } from "../services/authService";
import { tokenManager, getTokenFromCookie } from "../utils/http";
import { notificationWS } from "../utils/websocket";
import { setFaviconBadge } from "../utils/favicon";
import { resetNotificationState } from "../utils/notificationState";

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
  role: string;
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

// 状态映射
const ROLE_MAP: Record<string, string> = {
  1: "用户",
  2: "管理员",
  3: "编辑",
  4: "审核员",
};

// 认证提供者组件
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);

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
      if (typeof t === "string" && t.trim()) return t;
    }
    return null;
  };

  const clearAuthRuntimeState = () => {
    setUser(null);
    setToken(null);
    tokenManager.clearToken();
    resetNotificationState();
    setFaviconBadge(0);
  };

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
            userData.role = ROLE_MAP[userData.role] || "用户";
            setUser(userData);
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

  // 计算是否已认证（必须在 WebSocket useEffect 之前声明）
  const isAuthenticated = !!user;

  // WebSocket 连接管理 — 在 AuthProvider 层持久化，不会随路由切换重连
  useEffect(() => {
    if (isAuthenticated && user) {
      notificationWS.connect(user.id);
    } else {
      notificationWS.disconnect();
      setFaviconBadge(0); // 退出登录或未认证时清除 favicon 角标
    }
  }, [isAuthenticated, user]);

  // 跟踪当前 token，供 WS 鉴权错误处理时比对 Cookie 中是否为新 token
  const tokenRef = useRef<string | null>(null);
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  // WS 鉴权失败（token 过期 / 不匹配 / 账号异常）时刷新 token 并重连
  const wsAuthRetry = useRef(0);
  const WS_AUTH_MAX_RETRY = 2;
  useEffect(() => {
    const unsubOpen = notificationWS.onOpen(() => {
      wsAuthRetry.current = 0;
    });
    const unsubError = notificationWS.onServerError(async (err) => {
      // 账号状态异常（1103），刷新 token 无意义，直接登出
      if (err.errno === 1103) {
        clearAuthRuntimeState();
        return;
      }
      // 仅处理 token 相关鉴权错误（1101：过期 / 不匹配）
      if (err.errno !== 1101) return;

      // 无用户上下文或已达到最大重试次数，放弃并清理登录态
      if (!user?.id || wsAuthRetry.current >= WS_AUTH_MAX_RETRY) {
        clearAuthRuntimeState();
        return;
      }
      wsAuthRetry.current += 1;

      // 调用 refresh_token 无感续期，服务端会写入新 cookie
      try {
        const res = await AuthService.refreshToken(user.id);
        if (res.errno === 0 && res.data?.token) {
          const newToken = res.data.token;
          tokenRef.current = newToken;
          setToken(newToken);
          tokenManager.setToken(newToken);
          wsAuthRetry.current = 0;
          // 重连：connect 会重新读取（已被服务端刷新的）S_TOKEN / S_TOKEN_TIME cookie
          notificationWS.connect(user.id);
        } else {
          clearAuthRuntimeState();
        }
      } catch {
        clearAuthRuntimeState();
      }
    });
    return () => {
      unsubOpen();
      unsubError();
    };
  }, [user]);

  // 登录方法
  const login = async (authId: string, password: string) => {
    try {
      setLoginError(null);
      setLoading(true);
      resetNotificationState();
      setFaviconBadge(0);

      const response = await AuthService.login(authId, password);

      if (response.errno === 0) {
        let userToken = extractToken(response);

        if (!userToken) userToken = getTokenFromCookie();

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
            updatedUser.role = ROLE_MAP[updatedUser.role] || "用户";
            setUser(updatedUser);
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
