import React from "react";
import styles from "./SkeletonArticleView.module.css";

interface SkeletonArticleViewProps {
  count?: number;
}

const SkeletonArticleView: React.FC<SkeletonArticleViewProps> = ({ count = 1 }) => {
  return (
    <div className={styles.wrapper}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className={styles.item}>
          <div className={styles.title} />
          <div className={`${styles.line} ${styles.textShort}`} />
          <div className={`${styles.line} ${styles.textShort}`} />
          <div className={`${styles.line} ${styles.textWide}`} />
          <div className={styles.contentBlock} />
          <div className={styles.textPartial} />
        </div>
      ))}
    </div>
  );
};

export default SkeletonArticleView;
