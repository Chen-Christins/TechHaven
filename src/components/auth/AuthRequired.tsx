import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { FaLock, FaSignInAlt } from "react-icons/fa";
import styles from "./AuthRequired.module.css";

interface AuthRequiredProps {
    children: React.ReactNode;
    message?: string;
    title?: string;
    buttonText?: string;
}

const AuthRequired: React.FC<AuthRequiredProps> = ({
    children,
    message = "您需要登录后才能查看此内容。",
    title = "请先登录",
    buttonText = "立即登录",
}) => {
    const navigate = useNavigate();
    const { isAuthenticated, loading: authLoading } = useAuth();

    // 如果正在加载认证状态，则显示加载状态
    if (authLoading) {
        return (
            <div
                className={styles.authRequired}
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: "60vh",
                }}
            >
                {/* 加载中... */}
            </div>
        );
    }

    // 如果用户已认证，则显示子内容
    if (isAuthenticated) {
        return <div className={styles.authRequired}>{children}</div>;
    }

    // 如果用户未认证，则显示登录提示
    return (
        <div className={styles.authRequired}>
            <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                    <FaLock />
                </div>
                <h2 className={styles.emptyText}>{title}</h2>
                <p className={styles.emptySubtext}>{message}</p>
                <button onClick={() => navigate("/auth")} className={styles.loginBtn}>
                    <FaSignInAlt /> {buttonText}
                </button>
            </div>
        </div>
    );
};

export default AuthRequired;
