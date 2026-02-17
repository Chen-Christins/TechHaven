import React from "react";
import styles from "./ErrorState.module.css";

interface ErrorStateProps {
  title: string;
  message?: string;
  icon?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({ title, message, icon, actionText, onAction, className = "" }) => {
  return (
    <div className={`${styles.container} ${className}`}>
      {icon && <div className={styles.icon}>{icon}</div>}
      <h2 className={styles.title}>{title}</h2>
      {message && <p className={styles.message}>{message}</p>}
      {actionText && (
        <button type="button" className={styles.actionBtn} onClick={onAction}>
          {actionText}
        </button>
      )}
    </div>
  );
};

export default ErrorState;
