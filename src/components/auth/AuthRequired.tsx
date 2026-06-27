import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { FaLock, FaSignInAlt, FaArrowLeft } from "react-icons/fa";
import Loading from "../loading/Loading";
import styles from "./AuthRequired.module.css";

interface AuthRequiredProps {
  children: React.ReactNode;
  message?: string;
  title?: string;
  buttonText?: string;
  showBackButton?: boolean;
  backUrl?: string;
}

const AuthRequired: React.FC<AuthRequiredProps> = ({
  children,
  message = "您需要登录后才能查看此内容。",
  title = "请先登录",
  buttonText = "立即登录",
  showBackButton = true,
  backUrl,
}) => {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();

  // 认证状态加载中
  if (authLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Loading size="medium" text="验证登录状态..." />
      </div>
    );
  }

  // 已认证 — 透传子内容
  if (isAuthenticated) {
    return <div className={styles.wrapper}>{children}</div>;
  }

  // 未认证 — 显示登录引导
  const handleBack = () => {
    if (backUrl) {
      navigate(backUrl);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.emptyState}>
        <div className={styles.iconCircle}>
          <FaLock />
        </div>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.subtext}>{message}</p>
        <div className={styles.actions}>
          <button onClick={() => navigate("/auth")} className={styles.loginBtn}>
            <FaSignInAlt />
            {buttonText}
          </button>
          {showBackButton && (
            <button onClick={handleBack} className={styles.backBtn}>
              <FaArrowLeft style={{ marginRight: 6 }} />
              返回上一页
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthRequired;
