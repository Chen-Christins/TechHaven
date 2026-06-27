import React from "react";
import styles from "./AssignmentSubmitSkeleton.module.css";

const AssignmentSubmitSkeleton: React.FC = () => {
  return (
    <div className={styles.wrapper}>
      {/* 返回按钮骨架 */}
      <div className={styles.backPlaceholder} />

      {/* 标题和课程信息骨架 */}
      <div className={styles.headerRow}>
        <div className={styles.titleGroup}>
          <div className={styles.titleLine} />
          <div className={styles.subtitleLine} />
        </div>
        <div className={styles.statusBadge} />
      </div>

      {/* 信息卡片骨架 */}
      <div className={styles.infoGrid}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className={styles.infoCard} />
        ))}
      </div>

      {/* 描述内容骨架 */}
      <div className={styles.descriptionBlock}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className={i === 3 ? styles.descriptionLinePartial : styles.descriptionLineFull} />
        ))}
      </div>

      {/* 上传区域骨架 */}
      <div className={styles.uploadArea}>
        <div className={styles.uploadBox}>
          <div className={styles.uploadInner}>
            <div className={styles.uploadBtnPlaceholder} />
          </div>
        </div>
      </div>

      {/* 操作按钮骨架 */}
      <div className={styles.actions}>
        <div className={styles.actionBtn} />
        <div className={styles.actionBtnWide} />
      </div>
    </div>
  );
};

export default AssignmentSubmitSkeleton;
