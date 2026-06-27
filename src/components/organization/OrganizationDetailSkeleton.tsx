import React from "react";
import styles from "./OrganizationDetailSkeleton.module.css";

const OrganizationDetailSkeleton: React.FC = () => {
  return (
    <div className={styles.wrapper}>
      {/* 顶部区域骨架 */}
      <div className={styles.topArea}>
        <div className={styles.backPlaceholder} />
        <div className={styles.headerRow}>
          <div className={styles.titleGroup}>
            <div className={styles.titleLine} />
            <div className={styles.subtitleLine} />
          </div>
          <div className={styles.badgeGroup}>
            <div className={styles.badge} />
            <div className={styles.badgeWide} />
          </div>
        </div>
      </div>

      {/* 描述区域骨架 */}
      <div className={styles.descBlock} />

      {/* 统计卡片区域骨架 */}
      <div className={styles.statGrid}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className={styles.statCard} />
        ))}
      </div>

      {/* 成员列表骨架 */}
      <div className={styles.tableSection}>
        <div className={styles.tableTopBar}>
          <div className={styles.tableTitle} />
          <div className={styles.tableCount} />
        </div>

        {/* 表格头部 */}
        <div className={styles.tableHeaderRow}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className={styles.tableHeaderCol} />
          ))}
        </div>

        {/* 表格行 */}
        {[...Array(5)].map((_, i) => (
          <div key={i} className={styles.tableRow}>
            {[...Array(5)].map((_, j) => (
              <div key={j} className={styles.tableCol} />
            ))}
          </div>
        ))}
      </div>

      {/* 分页骨架 */}
      <div className={styles.pagination}>
        <div className={styles.paginationInfo} />
        <div className={styles.paginationBtns}>
          <div className={`${styles.paginationBtn} ${styles.paginationBtnLarge}`} />
          <div className={`${styles.paginationBtn} ${styles.paginationBtnSmall}`} />
          <div className={`${styles.paginationBtn} ${styles.paginationBtnSmall}`} />
          <div className={`${styles.paginationBtn} ${styles.paginationBtnLarge}`} />
        </div>
      </div>
    </div>
  );
};

export default OrganizationDetailSkeleton;
