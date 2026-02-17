import React, { useState, useEffect } from "react";
import { FaFileAlt, FaEye, FaThumbsUp, FaComment, FaTag, FaChartBar } from "react-icons/fa";
import type { ArticleListItem } from "../../../types/index";
import styles from "../PersonalCenter.module.css";

// 个人统计类型
interface PersonalStats {
  totalArticles: number;
  publishedArticles: number;
  privateArticles: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalTags: number;
}

interface PersonalTag {
  id: number;
  name: string;
  description?: string | "暂无";
  articleCount?: number | 0;
  color: string;
  createTime?: string | "未知时间";
}

interface Props {
  articles: ArticleListItem[];
  tags: PersonalTag[];
  totalArticles: number;
}

const StatsTab: React.FC<Props> = ({ articles, tags, totalArticles }) => {
  const [stats, setStats] = useState<PersonalStats>({
    totalArticles: 0,
    publishedArticles: 0,
    privateArticles: 0,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    totalTags: 0,
  });

  // 计算统计数据
  useEffect(() => {
    const calculatedStats: PersonalStats = {
      totalArticles: totalArticles,
      publishedArticles: articles.filter((a) => a.state === "published").length,
      privateArticles: articles.filter((a) => a.state === "private").length,
      totalViews: articles.reduce((sum, a) => sum + a.views, 0),
      totalLikes: articles.reduce((sum, a) => sum + a.praise, 0),
      totalComments: articles.reduce((sum, a) => sum + a.favorites, 0), // 使用favorites作为评论数
      totalTags: tags.length,
    };
    setStats(calculatedStats);
  }, [articles, tags, totalArticles]);

  return (
    <div className={styles.contentSection}>
      <div className={styles.sectionHeader}>
        <h2>数据统计</h2>
      </div>
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FaFileAlt />
          </div>
          <div className={styles.statContent}>
            <h3>{stats.totalArticles}</h3>
            <p>总文章数</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FaEye />
          </div>
          <div className={styles.statContent}>
            <h3>{stats.totalViews.toLocaleString()}</h3>
            <p>总浏览量</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FaThumbsUp />
          </div>
          <div className={styles.statContent}>
            <h3>{stats.totalLikes}</h3>
            <p>总点赞数</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FaComment />
          </div>
          <div className={styles.statContent}>
            <h3>{stats.totalComments}</h3>
            <p>总评论数</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FaTag />
          </div>
          <div className={styles.statContent}>
            <h3>{stats.totalTags}</h3>
            <p>标签数量</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FaChartBar />
          </div>
          <div className={styles.statContent}>
            <h3>{stats.publishedArticles}</h3>
            <p>已发布文章</p>
          </div>
        </div>
      </div>

      <div className={styles.statsDetails}>
        <h3>详细统计</h3>
        <div className={styles.statsTable}>
          <div className={styles.tableRow}>
            <span>已发布文章</span>
            <span>{stats.publishedArticles} 篇</span>
          </div>
          <div className={styles.tableRow}>
            <span>私密文章</span>
            <span>{stats.privateArticles} 篇</span>
          </div>
          <div className={styles.tableRow}>
            <span>平均浏览量</span>
            <span>{stats.totalArticles > 0 ? Math.round(stats.totalViews / stats.totalArticles) : 0} 次/篇</span>
          </div>
          <div className={styles.tableRow}>
            <span>平均点赞数</span>
            <span>{stats.publishedArticles > 0 ? Math.round(stats.totalLikes / stats.publishedArticles) : 0} 个/篇</span>
          </div>
          <div className={styles.tableRow}>
            <span>平均评论数</span>
            <span>{stats.publishedArticles > 0 ? Math.round(stats.totalComments / stats.publishedArticles) : 0} 条/篇</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsTab;
