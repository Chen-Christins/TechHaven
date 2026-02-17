import React from "react";
import styles from "./Loading.module.css";

interface LoadingProps {
  size?: "small" | "medium" | "large";
  text?: string;
  overlay?: boolean;
}

const Loading: React.FC<LoadingProps> = ({ size = "medium", text = "加载中...", overlay = false }) => {
  const content = (
    <div className={`${styles.loadingContainer} ${styles[size]}`}>
      <div className={styles.spinner}>
        <div className={styles.spinnerCircle}></div>
        <div className={styles.spinnerCircle}></div>
        <div className={styles.spinnerCircle}></div>
        <div className={styles.spinnerCircle}></div>
      </div>
      {text && <div className={styles.loadingText}>{text}</div>}
    </div>
  );

  if (overlay) {
    return <div className={styles.loadingOverlay}>{content}</div>;
  }

  return content;
};

export default Loading;
