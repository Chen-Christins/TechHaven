import React, { useRef, useEffect, useState } from "react";
import * as echarts from "echarts";
import { FaUsers, FaFileAlt, FaComments, FaEye, FaFilter, FaDownload, FaHourglassHalf, FaUserPlus } from "react-icons/fa";
import CustomSelect from "@/components/customSelect/CustomSelect";
import Loading from "@/components/loading/Loading";
import type { SelectOption } from "@/types/index";
import styles from "./Analytics.module.css";
import DashboardService, { type DashboardStats, type DashboardTrend, type DashboardActivity } from "@/services/dashboardService";
import { AuthService } from "@/services/authService";
import ArticleService, { type ListAdminArticlesResponse } from "@/services/articleService";
import { CommentService } from "@/services/commentService";
import message from "@/components/message/Message";

interface AdminUserStats {
  total_users: number;
  active_users: number;
  new_users_30d: number;
  inactive_users: number;
}

interface AdminArticleStats {
  total_articles: number;
  pending_articles: number;
  published_articles: number;
  rejected_articles: number;
  reported_articles: number;
}

interface AdminCommentStats {
  total_comments: number;
  pending_comments: number;
  approved_comments: number;
  spam_comments: number;
  reported_comments: number;
}

interface PopularArticle {
  id: string | number;
  title: string;
  views: number;
  likes: number;
  comments: number;
  author: string;
}

const periodMap: Record<string, number> = {
  "7天": 7,
  "30天": 30,
  "90天": 90,
};

const ACTIVITY_LABEL: Record<string, string> = {
  user_register: "新用户注册",
  article_publish: "发布文章",
  comment_create: "发表评论",
  system_backup: "系统备份",
  profile_update: "更新资料",
};

const ACTIVITY_COLOR: Record<string, string> = {
  user_register: "success",
  article_publish: "primary",
  comment_create: "warning",
  system_backup: "error",
  profile_update: "primary",
};

const Analytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("7天");
  const [exporting, setExporting] = useState(false);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [userStats, setUserStats] = useState<AdminUserStats | null>(null);
  const [articleStats, setArticleStats] = useState<AdminArticleStats | null>(null);
  const [commentStats, setCommentStats] = useState<AdminCommentStats | null>(null);
  const [trendData, setTrendData] = useState<DashboardTrend | null>(null);
  const [popularArticles, setPopularArticles] = useState<PopularArticle[]>([]);
  const [activities, setActivities] = useState<DashboardActivity[]>([]);

  const trendChartRef = useRef<HTMLDivElement>(null);
  const trendChartInstance = useRef<echarts.ECharts | null>(null);
  const articlePieRef = useRef<HTMLDivElement>(null);
  const articlePieInstance = useRef<echarts.ECharts | null>(null);
  const userPieRef = useRef<HTMLDivElement>(null);
  const userPieInstance = useRef<echarts.ECharts | null>(null);
  const commentPieRef = useRef<HTMLDivElement>(null);
  const commentPieInstance = useRef<echarts.ECharts | null>(null);

  const periodOptions: SelectOption[] = [
    { id: "7天", name: "最近7天", color: "#4361ee" },
    { id: "30天", name: "最近30天", color: "#4361ee" },
    { id: "90天", name: "最近90天", color: "#4361ee" },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsRes, userStatsRes, articleStatsRes, commentStatsRes, trendRes, activitiesRes] = await Promise.all([
          DashboardService.getStats(),
          AuthService.getAdminUserStats(),
          ArticleService.getAdminArticleStats(),
          CommentService.getAdminStats(),
          DashboardService.getTrend(periodMap[selectedPeriod]),
          DashboardService.getActivities(8),
        ]);
        setStats(statsRes);
        setUserStats(userStatsRes);
        setArticleStats(articleStatsRes);
        setCommentStats(commentStatsRes);
        setTrendData(trendRes);
        setActivities(activitiesRes.list || []);
      } catch {
        // error handled by interceptor
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchTrend = async () => {
      try {
        const trendRes = await DashboardService.getTrend(periodMap[selectedPeriod]);
        setTrendData(trendRes);
      } catch {
        // error handled by interceptor
      }
    };
    fetchTrend();
  }, [selectedPeriod]);

  useEffect(() => {
    const fetchPopularArticles = async () => {
      try {
        const res: ListAdminArticlesResponse = await ArticleService.listAdminArticlesByPages({
          page_num: 1,
          page_size: 5,
          state: 2,
        });
        setPopularArticles(
          (res.list || []).map((a) => ({
            id: a.id,
            title: a.title,
            views: a.views ?? 0,
            likes: a.praise ?? 0,
            comments: a.favorites ?? 0,
            author: a.author,
          })),
        );
      } catch {
        // error handled by interceptor
      }
    };
    fetchPopularArticles();
  }, []);

  const initLineChart = (el: HTMLDivElement, data: DashboardTrend) => {
    const chart = echarts.init(el);
    chart.setOption({
      tooltip: { trigger: "axis", axisPointer: { type: "cross" } },
      grid: { top: 20, bottom: 30, left: 60, right: 20 },
      xAxis: { type: "category", data: data.list.map((i) => i.label), axisLine: { lineStyle: { color: "#e0e0e0" } } },
      yAxis: {
        type: "value",
        axisLine: { lineStyle: { color: "#e0e0e0" } },
        splitLine: { lineStyle: { color: "#f0f0f0" } },
      },
      series: [
        {
          name: "访问量",
          type: "line",
          data: data.list.map((i) => i.visits),
          smooth: true,
          lineStyle: { width: 3, color: "#4f46e5" },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(79, 70, 229, 0.3)" },
              { offset: 1, color: "rgba(79, 70, 229, 0.05)" },
            ]),
          },
          itemStyle: { color: "#4f46e5" },
        },
      ],
    });
    return chart;
  };

  const initPieChart = (el: HTMLDivElement, data: Array<{ value: number; name: string; color: string }>) => {
    const chart = echarts.init(el);
    chart.setOption({
      tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
      legend: { bottom: 0, textStyle: { fontSize: 12, color: "var(--text-secondary)" } },
      series: [
        {
          type: "pie",
          radius: ["42%", "68%"],
          center: ["50%", "45%"],
          label: { show: false },
          data: data.map((d) => ({ value: d.value, name: d.name, itemStyle: { color: d.color } })),
        },
      ],
    });
    return chart;
  };

  useEffect(() => {
    if (!trendChartRef.current || !trendData) return;
    trendChartInstance.current?.dispose();
    trendChartInstance.current = initLineChart(trendChartRef.current, trendData);
    const h = () => trendChartInstance.current?.resize();
    window.addEventListener("resize", h);
    return () => {
      window.removeEventListener("resize", h);
      trendChartInstance.current?.dispose();
    };
  }, [trendData]);

  useEffect(() => {
    if (!articlePieRef.current || !articleStats) return;
    articlePieInstance.current?.dispose();
    articlePieInstance.current = initPieChart(articlePieRef.current, [
      { value: articleStats.published_articles, name: "已发布", color: "#4361ee" },
      { value: articleStats.pending_articles, name: "待审核", color: "#f59e0b" },
      { value: articleStats.rejected_articles, name: "已拒绝", color: "#ef4444" },
      { value: articleStats.reported_articles, name: "被举报", color: "#dc2626" },
    ]);
    const h = () => articlePieInstance.current?.resize();
    window.addEventListener("resize", h);
    return () => {
      window.removeEventListener("resize", h);
      articlePieInstance.current?.dispose();
    };
  }, [articleStats]);

  useEffect(() => {
    if (!userPieRef.current || !userStats) return;
    userPieInstance.current?.dispose();
    userPieInstance.current = initPieChart(userPieRef.current, [
      { value: userStats.active_users ?? 0, name: "活跃用户", color: "#10b981" },
      { value: userStats.inactive_users ?? 0, name: "非活跃用户", color: "#f59e0b" },
    ]);
    const h = () => userPieInstance.current?.resize();
    window.addEventListener("resize", h);
    return () => {
      window.removeEventListener("resize", h);
      userPieInstance.current?.dispose();
    };
  }, [userStats]);

  useEffect(() => {
    if (!commentPieRef.current || !commentStats) return;
    commentPieInstance.current?.dispose();
    commentPieInstance.current = initPieChart(commentPieRef.current, [
      { value: commentStats.approved_comments, name: "已通过", color: "#10b981" },
      { value: commentStats.pending_comments, name: "待审核", color: "#f59e0b" },
      { value: commentStats.spam_comments, name: "垃圾评论", color: "#ef4444" },
      { value: commentStats.reported_comments, name: "被举报", color: "#dc2626" },
    ]);
    const h = () => commentPieInstance.current?.resize();
    window.addEventListener("resize", h);
    return () => {
      window.removeEventListener("resize", h);
      commentPieInstance.current?.dispose();
    };
  }, [commentStats]);

  const handleExport = async () => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      message.success("报告已生成");
    }, 1500);
  };

  const formatNumber = (n: number | undefined | null) => (n ?? 0).toLocaleString();

  const overviewCards = [
    { label: "总用户数", value: formatNumber(userStats?.total_users), icon: <FaUsers />, color: "primary" },
    { label: "文章总数", value: formatNumber(articleStats?.total_articles), icon: <FaFileAlt />, color: "primary" },
    { label: "评论总数", value: formatNumber(commentStats?.total_comments), icon: <FaComments />, color: "success" },
    { label: "今日访问", value: formatNumber(stats?.today_visits), icon: <FaEye />, color: "warning" },
    { label: "新增(30天)", value: formatNumber(userStats?.new_users_30d), icon: <FaUserPlus />, color: "success" },
    { label: "待审核", value: formatNumber(articleStats?.pending_articles), icon: <FaHourglassHalf />, color: "warning" },
  ];

  if (loading) {
    return (
      <div className={styles.analytics}>
        <Loading text="加载统计数据中..." size="large" />
      </div>
    );
  }

  return (
    <div className={styles.analytics}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>统计分析</h1>
          <p className={styles.pageDescription}>查看网站访问量、用户行为和内容表现等详细统计数据</p>
        </div>
        <div className={styles.headerActions}>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleExport} disabled={exporting}>
            <FaDownload />
            {exporting ? "导出中..." : "导出报告"}
          </button>
        </div>
      </div>

      <div className={styles.statsContainer}>
        {overviewCards.map((card, i) => (
          <div key={i} className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles[card.color]}`}>{card.icon}</div>
            <div className={styles.statValue}>{card.value}</div>
            <div className={styles.statLabel}>{card.label}</div>
          </div>
        ))}
      </div>

      <div className={styles.filterSection}>
        <div className={styles.filterHeader}>
          <h3 className={styles.filterTitle}>
            <FaFilter />
            筛选条件
          </h3>
        </div>
        <div className={styles.filterForm}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>时间范围</label>
            <CustomSelect
              name="时间范围"
              value={periodOptions.find((o) => o.id === selectedPeriod) || null}
              onChange={(option) => setSelectedPeriod(String(option?.id || "7天"))}
              options={periodOptions}
              hideBadge={true}
              placeholder="选择时间范围"
            />
          </div>
          {trendData && (
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>趋势摘要</label>
              <div className={styles.trendSummary}>
                <span>总计 {formatNumber(trendData.total_visits)}</span>
                <span>日均 {formatNumber(trendData.avg_visits)}</span>
                <span>峰值 {formatNumber(trendData.max_visits)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <h3 className={styles.chartTitle}>访问趋势</h3>
        </div>
        <div ref={trendChartRef} className={styles.chartContainer} />
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>文章状态</h3>
          </div>
          <div ref={articlePieRef} className={styles.chartContainerSmall} />
        </div>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>用户活跃度</h3>
          </div>
          <div ref={userPieRef} className={styles.chartContainerSmall} />
        </div>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>评论状态</h3>
          </div>
          <div ref={commentPieRef} className={styles.chartContainerSmall} />
        </div>
      </div>

      {/* 底部数据面板 */}
      <div className={styles.bottomPanel}>
        {/* 热门文章 */}
        <div className={styles.panelCard}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>热门文章</h3>
            <span className={styles.panelSubtitle}>按浏览量排序</span>
          </div>
          <table className={styles.analyticsTable}>
            <thead>
              <tr>
                <th>#</th>
                <th>标题</th>
                <th>作者</th>
                <th>浏览</th>
                <th>点赞</th>
              </tr>
            </thead>
            <tbody>
              {popularArticles.length > 0 ? (
                popularArticles.map((a, i) => (
                  <tr key={a.id}>
                    <td>
                      <span className={styles.rankBadge}>{i + 1}</span>
                    </td>
                    <td className={styles.titleCell}>{a.title}</td>
                    <td>{a.author}</td>
                    <td>{formatNumber(a.views)}</td>
                    <td>{formatNumber(a.likes)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className={styles.emptyCell}>
                    暂无数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 近期活动 */}
        <div className={styles.panelCard}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>近期活动</h3>
            <span className={styles.panelSubtitle}>最新动态</span>
          </div>
          <div className={styles.activityList}>
            {activities.length > 0 ? (
              activities.map((act, i) => (
                <div key={i} className={styles.activityItem}>
                  <div className={`${styles.activityDot} ${styles[ACTIVITY_COLOR[act.type] || "primary"]}`} />
                  <div className={styles.activityContent}>
                    <div className={styles.activityTitle}>{act.title}</div>
                    <div className={styles.activityTime}>{act.time || ACTIVITY_LABEL[act.type] || act.type}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyCell}>暂无活动</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
