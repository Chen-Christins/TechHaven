import React from "react";
import { Link } from "react-router-dom";
import { FaSignInAlt } from "react-icons/fa";
import styles from "./AuthButtons.module.css";

interface AuthButtonsProps {
  onButtonClick?: () => void; // 可选的点击回调
}

const AuthButtons: React.FC<AuthButtonsProps> = ({ onButtonClick }) => {
  return (
    <div className={styles.authButtons}>
      <Link to="/auth" className={`${styles.authButton} ${styles.loginButton}`} onClick={onButtonClick}>
        <FaSignInAlt className={styles.buttonIcon} />
        <span className={styles.buttonText}>登录 | 注册</span>
      </Link>
    </div>
  );
};

export default AuthButtons;
