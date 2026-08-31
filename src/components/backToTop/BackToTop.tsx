import React from "react";
import styles from "./BackToTop.module.css";

interface BackToTopProps {
  className?: string;
  bottom?: string;
  right?: string;
}

const BackToTop: React.FC<BackToTopProps> = ({ className = "", bottom = "30px", right = "30px" }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    window.dispatchEvent(new Event("app:scroll-to-top"));

    const scrollContainer = document.querySelector<HTMLElement>(".simplebar-content-wrapper");
    if (scrollContainer) {
      scrollContainer.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      });
    } else {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      });
    }
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
        zIndex: 99999,
        pointerEvents: "auto",
        cursor: "pointer",
      }}
    >
      ↑
    </button>
  );
};

export default BackToTop;
