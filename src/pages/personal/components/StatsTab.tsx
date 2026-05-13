import React from "react";
import { FaFileAlt, FaEye, FaThumbsUp, FaComment, FaTag, FaChartBar } from "react-icons/fa";
import type { UserStats } from "../../../services/authService";
import styles from "../PersonalCenter.module.css";

interface Props {
  stats: UserStats;
}

const StatsTab: React.FC<Props> = ({ stats }) => {
  return (
    <div className={styles.contentSection}>
      <div className={styles.sectionHeader}>
        <h2>数据统计</h2>
      </div>
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconBlue}`}>
            <FaFileAlt />
          </div>
          <div className={styles.statContent}>
            <h3>{stats.total_articles}</h3>
            <p>总文章数</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconGreen}`}>
            <FaEye />
          </div>
          <div className={styles.statContent}>
            <h3>{stats.total_views.toLocaleString()}</h3>
            <p>总浏览量</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconRed}`}>
            <FaThumbsUp />
          </div>
          <div className={styles.statContent}>
            <h3>{stats.total_likes}</h3>
            <p>总点赞数</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconPurple}`}>
            <FaComment />
          </div>
          <div className={styles.statContent}>
            <h3>{stats.total_comments}</h3>
            <p>总评论数</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconOrange}`}>
            <FaTag />
          </div>
          <div className={styles.statContent}>
            <h3>{stats.total_tags}</h3>
            <p>标签数量</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconTeal}`}>
            <FaChartBar />
          </div>
          <div className={styles.statContent}>
            <h3>{stats.published_articles}</h3>
            <p>已发布文章</p>
          </div>
        </div>
      </div>

      <div className={styles.statsDetails}>
        <h3>详细统计</h3>
        <div className={styles.statsTable}>
          <div className={styles.tableRow}>
            <span>已发布文章</span>
            <span>{stats.published_articles} 篇</span>
          </div>
          <div className={styles.tableRow}>
            <span>私密文章</span>
            <span>{stats.private_articles} 篇</span>
          </div>
          <div className={styles.tableRow}>
            <span>平均浏览量</span>
            <span>{stats.total_articles > 0 ? Math.round(stats.total_views / stats.published_articles) : 0} 次/篇</span>
          </div>
          <div className={styles.tableRow}>
            <span>平均点赞数</span>
            <span>{stats.published_articles > 0 ? Math.round(stats.total_likes / stats.published_articles) : 0} 个/篇</span>
          </div>
          <div className={styles.tableRow}>
            <span>平均评论数</span>
            <span>{stats.published_articles > 0 ? Math.round(stats.total_comments / stats.published_articles) : 0} 条/篇</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsTab;
