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

    console.log("BackToTop clicked"); // 调试信息

    // 立即尝试多种滚动方式
    const scrollToTop = () => {
      // 方法1: window.scrollTo
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      });

      // 方法2: 设置documentElement和body
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      // 方法3: 查找所有可能有scrollTop的元素
      const elements = [window, document.documentElement, document.body];
      elements.forEach((el) => {
        if (el && "scrollTop" in el) {
          (el as any).scrollTop = 0;
        }
      });

      // 方法4: 强制重置滚动位置
      setTimeout(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;

        // 查找所有可能的滚动容器
        const scrollableElements = document.querySelectorAll('[style*="overflow"], [style*="scroll"]');
        scrollableElements.forEach((el: any) => {
          if (el.scrollTop > 0) el.scrollTop = 0;
        });

        // 最后尝试使用scrollIntoView
        if (document.body) {
          document.body.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 50);
    };

    scrollToTop();
    // 再次尝试确保滚动成功
    setTimeout(scrollToTop, 200);
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
