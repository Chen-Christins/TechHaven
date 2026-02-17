import React from "react";
import styles from "./BackToTop.module.css";

interface BackToTopProps {
  className?: string;
  bottom?: string;
  right?: string;
}

const BackToTop: React.FC<BackToTopProps> = ({ className = "", bottom = "30px", right = "30px" }) => {
  const handleClick = () => {
    // 使用平滑滚动到顶部
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    // 备用方案确保兼容性
    setTimeout(() => {
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 100);
  };

  return (
    <button
      className={`${styles.backToTop} ${styles.show} ${className}`}
      onClick={handleClick}
      aria-label="回到顶部"
      title="回到顶部"
      type="button"
      style={{
        position: "fixed",
        bottom: bottom,
        right: right,
        zIndex: 10000,
        pointerEvents: "auto",
        cursor: "pointer",
      }}
    >
      ↑
    </button>
  );
};

export default BackToTop;
