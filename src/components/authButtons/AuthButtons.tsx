import React from "react";
import { Link } from "react-router-dom";
import { FaSignInAlt } from "react-icons/fa";
import styles from "./AuthButtons.module.css";
import { useSiteSettings } from "../../contexts/SiteSettingsContext";

interface AuthButtonsProps {
  onButtonClick?: () => void;
}

const AuthButtons: React.FC<AuthButtonsProps> = ({ onButtonClick }) => {
  const { settings } = useSiteSettings();

  return (
    <div className={styles.authButtons}>
      <Link to="/auth" className={`${styles.authButton} ${styles.loginButton}`} onClick={onButtonClick}>
        <FaSignInAlt className={styles.buttonIcon} />
        <span className={styles.buttonText}>{settings.enableRegistration ? "登录 | 注册" : "登录"}</span>
      </Link>
    </div>
  );
};

export default AuthButtons;
