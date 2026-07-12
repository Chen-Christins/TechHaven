import React, { useEffect, useRef } from "react";
import * as echarts from "echarts";
import type { UserStats } from "@/services/authService";
import styles from "../PersonalCenter.module.css";

interface Props {
  stats: UserStats;
}

const COLORS = {
  blue: "#3b82f6",
  green: "#10b981",
  red: "#ef4444",
  purple: "#8b5cf6",
  orange: "#f59e0b",
  teal: "#14b8a6",
  gray: "#94a3b8",
};

const StatsTab: React.FC<Props> = ({ stats }) => {
  const compositionRef = useRef<HTMLDivElement>(null);
  const engagementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const charts: echarts.ECharts[] = [];

    // 文章构成（已发布 / 私密 / 其他）
    if (compositionRef.current) {
      const chart = echarts.init(compositionRef.current, "light", { renderer: "canvas" });
      const others = Math.max(0, stats.total_articles - stats.published_articles - stats.private_articles);
      chart.setOption({
        tooltip: { trigger: "item", formatter: "{b}: {c} 篇 ({d}%)" },
        legend: {
          bottom: 0,
          left: "center",
          itemWidth: 10,
          itemHeight: 10,
          textStyle: { color: "#64748b", fontSize: 12 },
        },
        series: [
          {
            name: "文章构成",
            type: "pie",
            radius: ["45%", "70%"],
            center: ["50%", "45%"],
            avoidLabelOverlap: true,
            itemStyle: { borderColor: "#fff", borderWidth: 2 },
            label: { show: false },
            data: [
              { value: stats.published_articles, name: "已发布", itemStyle: { color: COLORS.green } },
              { value: stats.private_articles, name: "私密", itemStyle: { color: COLORS.purple } },
              { value: others, name: "其他", itemStyle: { color: COLORS.gray } },
            ],
          },
        ],
      });
      charts.push(chart);
    }

    // 平均每篇互动（浏览 / 点赞 / 评论）
    if (engagementRef.current) {
      const chart = echarts.init(engagementRef.current, "light", { renderer: "canvas" });
      const avgViews = stats.published_articles > 0 ? Math.round(stats.total_views / stats.published_articles) : 0;
      const avgLikes = stats.published_articles > 0 ? Math.round(stats.total_likes / stats.published_articles) : 0;
      const avgComments = stats.published_articles > 0 ? Math.round(stats.total_comments / stats.published_articles) : 0;
      chart.setOption({
        tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, formatter: "{b}: {c} /篇" },
        grid: { left: "3%", right: "6%", bottom: "6%", top: "12%", containLabel: true },
        xAxis: {
          type: "category",
          data: ["浏览", "点赞", "评论"],
          axisLine: { lineStyle: { color: "#e1e5e9" } },
          axisLabel: { color: "#64748b" },
        },
        yAxis: {
          type: "value",
          splitLine: { lineStyle: { color: "#eef2f7" } },
          axisLabel: { color: "#94a3b8" },
        },
        series: [
          {
            type: "bar",
            barWidth: "46%",
            itemStyle: { borderRadius: [6, 6, 0, 0] },
            data: [
              { value: avgViews, itemStyle: { color: COLORS.blue } },
              { value: avgLikes, itemStyle: { color: COLORS.red } },
              { value: avgComments, itemStyle: { color: COLORS.purple } },
            ],
            label: { show: true, position: "top", color: "#475569", fontWeight: 600 },
          },
        ],
      });
      charts.push(chart);
    }

    const handleResize = () => charts.forEach((c) => c.resize());
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      charts.forEach((c) => c.dispose());
    };
  }, [stats]);

  const avgViews = stats.published_articles > 0 ? Math.round(stats.total_views / stats.published_articles) : 0;
  const avgLikes = stats.published_articles > 0 ? Math.round(stats.total_likes / stats.published_articles) : 0;
  const avgComments = stats.published_articles > 0 ? Math.round(stats.total_comments / stats.published_articles) : 0;
  const others = Math.max(0, stats.total_articles - stats.published_articles - stats.private_articles);

  return (
    <div className={styles.contentSection}>
      <div className={styles.sectionHeader}>
        <h2>数据统计</h2>
      </div>

      <div className={styles.chartGrid}>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>文章构成</h3>
          <div ref={compositionRef} className={styles.chartCanvas} />
        </div>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>平均每篇互动</h3>
          <div ref={engagementRef} className={styles.chartCanvas} />
        </div>
      </div>

      <div className={styles.statsDetails}>
        <h3>详细统计</h3>

        <div className={styles.detailTable}>
          <div className={styles.detailCaption}>文章概况</div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>总文章数</span>
            <span className={styles.detailValue}>{stats.total_articles} 篇</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>已发布文章</span>
            <span className={styles.detailValue}>{stats.published_articles} 篇</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>私密文章</span>
            <span className={styles.detailValue}>{stats.private_articles} 篇</span>
          </div>
          {others > 0 && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>其他（草稿等）</span>
              <span className={styles.detailValue}>{others} 篇</span>
            </div>
          )}
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>标签数量</span>
            <span className={styles.detailValue}>{stats.total_tags} 个</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>加入组织</span>
            <span className={styles.detailValue}>{stats.total_organizations} 个</span>
          </div>
        </div>

        <div className={styles.detailTable}>
          <div className={styles.detailCaption}>互动概况</div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>总浏览量</span>
            <span className={styles.detailValue}>{stats.total_views.toLocaleString()} 次</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>总点赞数</span>
            <span className={styles.detailValue}>{stats.total_likes} 个</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>总评论数</span>
            <span className={styles.detailValue}>{stats.total_comments} 条</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>平均浏览量</span>
            <span className={styles.detailValue}>{avgViews} 次/篇</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>平均点赞数</span>
            <span className={styles.detailValue}>{avgLikes} 个/篇</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>平均评论数</span>
            <span className={styles.detailValue}>{avgComments} 条/篇</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsTab;
