import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { AuthService } from '../services/authService';

// 用户信息类型
export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  avatar: string;
  role: string;
  created_at: string;
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

  // 初始化时从localStorage获取用户信息
  useEffect(() => {
    const initAuth = () => {
      try {
        const currentUser = AuthService.getCurrentUser();
        const currentToken = AuthService.getToken();

        if (currentUser && currentToken) {
          setUser(currentUser);
          setToken(currentToken);
        }
      } catch (error) {
        console.error('初始化认证状态失败:', error);
        // 清除无效数据
        AuthService.logout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // 登录方法
  const login = async (authId: string, password: string) => {
    try {
      setLoginError(null);
      setLoading(true);

      const response = await AuthService.login(authId, password);

      if (response.data && response.data.data) {
        const { token: newToken, user: userData } = response.data.data;
        setToken(newToken);
        setUser(userData);
      }
    } catch (error: any) {
      setLoginError(error.message || '登录失败');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 登出方法
  const logout = async () => {
    try {
      setLoading(true);
      await AuthService.logout();
      setUser(null);
      setToken(null);
      setLoginError(null);
    } catch (error) {
      console.error('登出失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 清除登录错误
  const clearLoginError = () => {
    setLoginError(null);
  };

  // 计算是否已认证
  const isAuthenticated = !!token && !!user;

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
    throw new Error('useAuth必须在AuthProvider内部使用');
  }
  return context;
};

export default AuthContext;