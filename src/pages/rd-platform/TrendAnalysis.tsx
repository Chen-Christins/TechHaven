import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as echarts from "echarts";
import { FaArrowDown, FaArrowUp, FaBug, FaChartLine, FaClock, FaClipboardCheck, FaCodeBranch } from "react-icons/fa";
import { useSearchParams } from "react-router-dom";
import Button from "../../components/button/Button";
import ErrorState from "../../components/errorState/ErrorState";
import Loading from "../../components/loading/Loading";
import { useRdOrg } from "../../contexts/RdOrgContext";
import RdPlatformService from "../../services/rdPlatformService";
import type { RdTrendAnalysisData } from "../../types/rdPlatform";
import styles from "./TrendAnalysis.module.css";

type TrendPeriod = 7 | 30;
type HealthTone = "success" | "danger" | "primary" | "warning";

const parseTrendPeriod = (value: string | null): TrendPeriod => (value === "7" ? 7 : 30);

const TrendAnalysis: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectedOrgId, loading: orgLoading } = useRdOrg();
  const [trendData, setTrendData] = useState<RdTrendAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const throughputRef = useRef<HTMLDivElement>(null);
  const backlogRef = useRef<HTMLDivElement>(null);
  const distributionRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef(0);

  const periodDays = parseTrendPeriod(searchParams.get("period"));
  const axisLabelInterval = periodDays === 30 ? 2 : 0;

  const handlePeriodChange = (period: TrendPeriod) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("period", String(period));
    setSearchParams(nextParams, { replace: true });
  };

  const loadTrends = useCallback(async () => {
    if (orgLoading) return;

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);
    setError("");
    try {
      const data = await RdPlatformService.getTrends({
        orgId: selectedOrgId || undefined,
        periodDays,
        granularity: "day",
      });
      if (requestId !== requestIdRef.current) return;
      setTrendData(data);
    } catch (err: any) {
      if (requestId !== requestIdRef.current) return;
      setError(err?.message || "趋势分析数据加载失败");
      setTrendData(null);
    } finally {
      if (requestId !== requestIdRef.current) return;
      setLoading(false);
    }
  }, [orgLoading, periodDays, selectedOrgId]);

  useEffect(() => {
    loadTrends();
  }, [loadTrends]);

  const workDistribution = useMemo(() => {
    if (!trendData) return [];
    return [
      { name: "需求交付", value: trendData.workDistribution.requirementDelivery },
      { name: "缺陷修复", value: trendData.workDistribution.bugFix },
      { name: "研发任务", value: trendData.workDistribution.rdTask },
      { name: "代码审查", value: trendData.workDistribution.codeReview },
    ];
  }, [trendData]);

  const teamHealth = useMemo(() => {
    if (!trendData) return [];
    return [
      { label: "交付吞吐", value: trendData.teamHealth.throughput, tone: "success" as HealthTone },
      { label: "缺陷压力", value: trendData.teamHealth.bugPressure, tone: "danger" as HealthTone },
      { label: "审查效率", value: trendData.teamHealth.reviewEfficiency, tone: "primary" as HealthTone },
      { label: "返工风险", value: trendData.teamHealth.reworkRisk, tone: "warning" as HealthTone },
    ];
  }, [trendData]);

  useEffect(() => {
    if (!trendData || trendData.series.length === 0) return;

    const charts: echarts.ECharts[] = [];
    const textColor = getComputedStyle(document.documentElement).getPropertyValue("--text-secondary").trim() || "#64748b";
    const borderColor = getComputedStyle(document.documentElement).getPropertyValue("--border-primary").trim() || "#e5e7eb";

    if (throughputRef.current) {
      const chart = echarts.init(throughputRef.current);
      chart.setOption({
        color: ["#2563eb", "#10b981", "#ef4444"],
        tooltip: { trigger: "axis" },
        legend: { top: 0, textStyle: { color: textColor } },
        grid: { top: 42, right: 18, bottom: 28, left: 36 },
        xAxis: {
          type: "category",
          data: trendData.series.map((item) => item.date),
          axisLine: { lineStyle: { color: borderColor } },
          axisLabel: { color: textColor, interval: axisLabelInterval, rotate: periodDays === 30 ? 30 : 0 },
        },
        yAxis: {
          type: "value",
          splitLine: { lineStyle: { color: borderColor } },
          axisLabel: { color: textColor },
        },
        series: [
          { name: "新增需求", type: "line", smooth: true, data: trendData.series.map((item) => item.requirements) },
          { name: "完成项", type: "line", smooth: true, data: trendData.series.map((item) => item.completed) },
          { name: "新增缺陷", type: "line", smooth: true, data: trendData.series.map((item) => item.bugs) },
        ],
      });
      charts.push(chart);
    }

    if (backlogRef.current) {
      const chart = echarts.init(backlogRef.current);
      chart.setOption({
        color: ["#3b82f6", "#f59e0b", "#ef4444"],
        tooltip: { trigger: "axis" },
        legend: { top: 0, textStyle: { color: textColor } },
        grid: { top: 42, right: 18, bottom: 28, left: 36 },
        xAxis: {
          type: "category",
          data: trendData.series.map((item) => item.date),
          axisLine: { lineStyle: { color: borderColor } },
          axisLabel: { color: textColor, interval: axisLabelInterval, rotate: periodDays === 30 ? 30 : 0 },
        },
        yAxis: {
          type: "value",
          splitLine: { lineStyle: { color: borderColor } },
          axisLabel: { color: textColor },
        },
        series: [
          { name: "任务总量", type: "bar", stack: "total", data: trendData.series.map((item) => item.tasks) },
          { name: "返工数", type: "bar", stack: "risk", data: trendData.series.map((item) => item.reopened) },
          { name: "平均周期", type: "line", smooth: true, data: trendData.series.map((item) => item.cycleTime) },
        ],
      });
      charts.push(chart);
    }

    if (distributionRef.current) {
      const chart = echarts.init(distributionRef.current);
      chart.setOption({
        color: ["#2563eb", "#ef4444", "#10b981", "#8b5cf6"],
        tooltip: { trigger: "item" },
        legend: { bottom: 0, textStyle: { color: textColor } },
        series: [
          {
            name: "工作占比",
            type: "pie",
            radius: ["46%", "70%"],
            center: ["50%", "43%"],
            avoidLabelOverlap: true,
            label: { formatter: "{b}\n{d}%" },
            data: workDistribution,
          },
        ],
      });
      charts.push(chart);
    }

    const handleResize = () => charts.forEach((chart) => chart.resize());
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      charts.forEach((chart) => chart.dispose());
    };
  }, [axisLabelInterval, periodDays, trendData, workDistribution]);

  if ((loading || orgLoading) && !trendData) {
    return <Loading text="加载趋势分析数据..." />;
  }

  if (error && !trendData) {
    return <ErrorState title="趋势分析加载失败" message={error} actionText="重新加载" onAction={loadTrends} />;
  }

  if (!trendData || trendData.series.length === 0) {
    return (
      <ErrorState
        title="暂无趋势数据"
        message="当前组织和时间范围内没有可展示的趋势分析数据。"
        actionText="重新加载"
        onAction={loadTrends}
      />
    );
  }

  const { summary } = trendData;

  return (
    <div className={styles.trends}>
      {loading && <Loading text="刷新趋势数据..." overlay />}

      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>趋势分析</h1>
          <p className={styles.pageDescription}>基于近 {periodDays} 天 mock 数据的研发吞吐、质量与效率走势</p>
        </div>
        <div className={styles.pageActions}>
          <div className={styles.periodSwitch} aria-label="趋势时间范围">
            <Button
              size="small"
              color={periodDays === 7 ? "primary" : "secondary"}
              variant={periodDays === 7 ? "solid" : "light"}
              className={styles.periodButton}
              onClick={() => handlePeriodChange(7)}
            >
              7 天
            </Button>
            <Button
              size="small"
              color={periodDays === 30 ? "primary" : "secondary"}
              variant={periodDays === 30 ? "solid" : "light"}
              className={styles.periodButton}
              onClick={() => handlePeriodChange(30)}
            >
              30 天
            </Button>
          </div>
          <span className={styles.mockBadge}>Mock 数据</span>
        </div>
      </div>

      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={`${styles.metricIcon} ${styles.primary}`}>
            <FaClipboardCheck />
          </div>
          <div className={styles.metricValue}>{summary.completedTotal}</div>
          <div className={styles.metricLabel}>累计完成项</div>
          <div className={summary.taskDelta >= 0 ? styles.metricMeta : styles.metricMetaWarn}>
            {summary.taskDelta >= 0 ? <FaArrowUp /> : <FaArrowDown />}
            较上一日任务量 {summary.taskDelta >= 0 ? "+" : ""}
            {summary.taskDelta}
          </div>
        </div>
        <div className={styles.metricCard}>
          <div className={`${styles.metricIcon} ${styles.danger}`}>
            <FaBug />
          </div>
          <div className={styles.metricValue}>{summary.bugTotal}</div>
          <div className={styles.metricLabel}>新增缺陷</div>
          <div className={styles.metricMetaMuted}>缺陷新增保持低位震荡</div>
        </div>
        <div className={styles.metricCard}>
          <div className={`${styles.metricIcon} ${styles.success}`}>
            <FaCodeBranch />
          </div>
          <div className={styles.metricValue}>{summary.avgReviewPassRate}%</div>
          <div className={styles.metricLabel}>平均审查通过率</div>
          <div className={styles.metricMeta}>
            <FaArrowUp /> 质量门禁趋势向好
          </div>
        </div>
        <div className={styles.metricCard}>
          <div className={`${styles.metricIcon} ${styles.warning}`}>
            <FaClock />
          </div>
          <div className={styles.metricValue}>{summary.avgCycleTime} 天</div>
          <div className={styles.metricLabel}>平均交付周期</div>
          <div className={summary.cycleDelta <= 0 ? styles.metricMeta : styles.metricMetaWarn}>
            {summary.cycleDelta <= 0 ? <FaArrowDown /> : <FaArrowUp />}
            较上一日 {summary.cycleDelta} 天
          </div>
        </div>
      </div>

      <div className={styles.chartGrid}>
        <section className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h2>研发吞吐趋势</h2>
            <span>需求 / 完成项 / 缺陷</span>
          </div>
          <div ref={throughputRef} className={styles.chartContainer} />
        </section>

        <section className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h2>任务积压与周期</h2>
            <span>任务总量 / 返工 / 平均周期</span>
          </div>
          <div ref={backlogRef} className={styles.chartContainer} />
        </section>

        <section className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h2>工作类型分布</h2>
            <span>近 {periodDays} 天占比</span>
          </div>
          <div ref={distributionRef} className={styles.chartContainer} />
        </section>

        <section className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h2>团队健康度</h2>
            <span>综合效率指标</span>
          </div>
          <div className={styles.healthList}>
            {teamHealth.map((item) => (
              <div key={item.label} className={styles.healthItem}>
                <div className={styles.healthLabel}>
                  <span>{item.label}</span>
                  <strong>{item.value}%</strong>
                </div>
                <div className={styles.healthTrack}>
                  <div className={`${styles.healthBar} ${styles[item.tone]}`} style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className={styles.insightSection}>
        <div className={styles.insightTitle}>
          <FaChartLine />
          趋势判断
        </div>
        <div className={styles.insightGrid}>
          {trendData.insights.map((item) => (
            <div key={item.title} className={styles.insightCard}>
              <h3>{item.title}</h3>
              <p>{item.content}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default TrendAnalysis;
