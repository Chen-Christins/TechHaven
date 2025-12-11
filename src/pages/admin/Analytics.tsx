import React, { useRef, useEffect, useState } from "react";
import * as echarts from "echarts";
import {
    FaUsers,
    FaFileAlt,
    FaComments,
    FaEye,
    FaArrowUp,
    FaArrowDown,
    FaMinus,
    FaChartBar,
    FaChartPie,
    FaDownload,
    FaCalendarAlt,
    FaFilter,
    FaGlobe,
    FaClock,
    FaMousePointer,
} from "react-icons/fa";
import styles from "./Analytics.module.css";
import CustomSelect from "../../components/customSelect/CustomSelect";

interface AnalyticsData {
    overview: {
        totalUsers: number;
        totalArticles: number;
        totalComments: number;
        totalViews: number;
        totalLikes: number;
        avgSessionDuration: string;
        bounceRate: string;
        newUsers: number;
    };
    trends: {
        visits: Array<{ date: string; value: number; label: string }>;
        users: Array<{ date: string; value: number; label: string }>;
        pageViews: Array<{ date: string; value: number; label: string }>;
    };
    content: {
        popularArticles: Array<{
            id: number;
            title: string;
            views: number;
            likes: number;
            comments: number;
        }>;
        categories: Array<{ name: string; count: number; percentage: number }>;
    };
    traffic: {
        sources: Array<{ name: string; value: number; percentage: number }>;
        devices: Array<{ name: string; value: number; percentage: number }>;
        locations: Array<{ country: string; users: number; percentage: number }>;
    };
}

const Analytics: React.FC = () => {
    const [selectedPeriod, setSelectedPeriod] = useState("7天");
    const [selectedMetric, setSelectedMetric] = useState("visits");
    const [isLoading, setIsLoading] = useState(false);

    // 时间范围选项
    const periodOptions = [
        { id: "7天", name: "最近7天", color: "#4361ee" },
        { id: "30天", name: "最近30天", color: "#4361ee" },
        { id: "90天", name: "最近90天", color: "#4361ee" },
        { id: "1年", name: "最近1年", color: "#4361ee" },
    ];

    // 指标类型选项
    const metricOptions = [
        { id: "visits", name: "访问量", color: "#7209b7" },
        { id: "users", name: "用户数", color: "#7209b7" },
        { id: "pageViews", name: "页面浏览量", color: "#7209b7" },
    ];

    // 图表引用
    const trendChartRef = useRef<HTMLDivElement>(null);
    const pieChartRef = useRef<HTMLDivElement>(null);
    const barChartRef = useRef<HTMLDivElement>(null);

    const trendChartInstance = useRef<echarts.ECharts | null>(null);
    const pieChartInstance = useRef<echarts.ECharts | null>(null);
    const barChartInstance = useRef<echarts.ECharts | null>(null);

    // 模拟分析数据
    const analyticsData: AnalyticsData = {
        overview: {
            totalUsers: 12847,
            totalArticles: 1456,
            totalComments: 3892,
            totalViews: 256789,
            totalLikes: 12456,
            avgSessionDuration: "4:32",
            bounceRate: "32.5%",
            newUsers: 847,
        },
        trends: {
            visits: [
                { date: "11-15", value: 2820, label: "周一" },
                { date: "11-16", value: 2932, label: "周二" },
                { date: "11-17", value: 2901, label: "周三" },
                { date: "11-18", value: 3134, label: "周四" },
                { date: "11-19", value: 3290, label: "周五" },
                { date: "11-20", value: 3330, label: "周六" },
                { date: "11-21", value: 2892, label: "周日" },
            ],
            users: [
                { date: "11-15", value: 1820, label: "周一" },
                { date: "11-16", value: 1932, label: "周二" },
                { date: "11-17", value: 1901, label: "周三" },
                { date: "11-18", value: 2134, label: "周四" },
                { date: "11-19", value: 2290, label: "周五" },
                { date: "11-20", value: 2330, label: "周六" },
                { date: "11-21", value: 1892, label: "周日" },
            ],
            pageViews: [
                { date: "11-15", value: 5820, label: "周一" },
                { date: "11-16", value: 5932, label: "周二" },
                { date: "11-17", value: 5901, label: "周三" },
                { date: "11-18", value: 6134, label: "周四" },
                { date: "11-19", value: 6290, label: "周五" },
                { date: "11-20", value: 6330, label: "周六" },
                { date: "11-21", value: 5892, label: "周日" },
            ],
        },
        content: {
            popularArticles: [
                {
                    id: 1,
                    title: "React 18 新特性详解",
                    views: 5432,
                    likes: 234,
                    comments: 45,
                },
                {
                    id: 2,
                    title: "TypeScript 最佳实践指南",
                    views: 4211,
                    likes: 189,
                    comments: 32,
                },
                {
                    id: 3,
                    title: "前端性能优化技巧",
                    views: 3897,
                    likes: 167,
                    comments: 28,
                },
                {
                    id: 4,
                    title: "Vite 构建工具使用教程",
                    views: 3456,
                    likes: 145,
                    comments: 23,
                },
                {
                    id: 5,
                    title: "CSS Grid 布局完全指南",
                    views: 2987,
                    likes: 123,
                    comments: 19,
                },
            ],
            categories: [
                { name: "前端开发", count: 456, percentage: 31.3 },
                { name: "后端技术", count: 342, percentage: 23.5 },
                { name: "开发工具", count: 289, percentage: 19.8 },
                { name: "设计相关", count: 234, percentage: 16.1 },
                { name: "其他", count: 135, percentage: 9.3 },
            ],
        },
        traffic: {
            sources: [
                { name: "直接访问", value: 45, percentage: 35.2 },
                { name: "搜索引擎", value: 38, percentage: 29.7 },
                { name: "社交媒体", value: 25, percentage: 19.5 },
                { name: "外链引用", value: 20, percentage: 15.6 },
            ],
            devices: [
                { name: "桌面端", value: 65, percentage: 50.8 },
                { name: "移动端", value: 48, percentage: 37.5 },
                { name: "平板端", value: 15, percentage: 11.7 },
            ],
            locations: [
                { country: "中国", users: 8234, percentage: 64.1 },
                { country: "美国", users: 2134, percentage: 16.6 },
                { country: "日本", users: 1234, percentage: 9.6 },
                { country: "英国", users: 876, percentage: 6.8 },
                { country: "其他", users: 369, percentage: 2.9 },
            ],
        },
    };

    // 概览统计卡片
    const overviewStats = [
        {
            title: "总用户数",
            value: analyticsData.overview.totalUsers.toLocaleString(),
            change: "+12.5%",
            changeType: "positive" as const,
            icon: <FaUsers />,
            iconColor: "blue",
            description: "新增用户: " + analyticsData.overview.newUsers,
        },
        {
            title: "文章总数",
            value: analyticsData.overview.totalArticles.toLocaleString(),
            change: "+8.3%",
            changeType: "positive" as const,
            icon: <FaFileAlt />,
            iconColor: "green",
            description: "本月新增: 45",
        },
        {
            title: "总评论数",
            value: analyticsData.overview.totalComments.toLocaleString(),
            change: "-2.1%",
            changeType: "negative" as const,
            icon: <FaComments />,
            iconColor: "orange",
            description: "今日新增: 12",
        },
        {
            title: "总访问量",
            value: analyticsData.overview.totalViews.toLocaleString(),
            change: "+18.7%",
            changeType: "positive" as const,
            icon: <FaEye />,
            iconColor: "purple",
            description: "今日访问: 2,892",
        },
        {
            title: "平均停留时间",
            value: analyticsData.overview.avgSessionDuration,
            change: "+5.2%",
            changeType: "positive" as const,
            icon: <FaClock />,
            iconColor: "cyan",
            description: "较上周期",
        },
        {
            title: "跳出率",
            value: analyticsData.overview.bounceRate,
            change: "-3.4%",
            changeType: "positive" as const,
            icon: <FaMousePointer />,
            iconColor: "red",
            description: "较上周期",
        },
    ];

    // 初始化趋势图表
    const initTrendChart = () => {
        if (!trendChartRef.current) return;

        const chart = echarts.init(trendChartRef.current);
        trendChartInstance.current = chart;

        const data = analyticsData.trends[selectedMetric as keyof typeof analyticsData.trends];

        const option = {
            tooltip: {
                trigger: "axis",
                axisPointer: {
                    type: "cross",
                },
            },
            legend: {
                data: [selectedMetric === "visits" ? "访问量" : selectedMetric === "users" ? "用户数" : "页面浏览量"],
                bottom: 0,
            },
            grid: {
                top: 20,
                bottom: 60,
                left: 60,
                right: 40,
            },
            xAxis: {
                type: "category",
                data: data.map((item) => item.label),
                axisLine: {
                    lineStyle: {
                        color: "#e0e0e0",
                    },
                },
            },
            yAxis: {
                type: "value",
                axisLine: {
                    lineStyle: {
                        color: "#e0e0e0",
                    },
                },
                splitLine: {
                    lineStyle: {
                        color: "#f0f0f0",
                    },
                },
            },
            series: [
                {
                    name: selectedMetric === "visits" ? "访问量" : selectedMetric === "users" ? "用户数" : "页面浏览量",
                    type: "line",
                    data: data.map((item) => item.value),
                    smooth: true,
                    lineStyle: {
                        width: 3,
                        color: "#4f46e5",
                    },
                    areaStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: "rgba(79, 70, 229, 0.3)" },
                            { offset: 1, color: "rgba(79, 70, 229, 0.05)" },
                        ]),
                    },
                    itemStyle: {
                        color: "#4f46e5",
                    },
                },
            ],
        };

        chart.setOption(option);
    };

    // 初始化饼图
    const initPieChart = () => {
        if (!pieChartRef.current) return;

        const chart = echarts.init(pieChartRef.current);
        pieChartInstance.current = chart;

        const option = {
            tooltip: {
                trigger: "item",
                formatter: "{a} <br/>{b}: {c}% ({d}%)",
            },
            legend: {
                orient: "vertical",
                left: "left",
                data: analyticsData.traffic.sources.map((item) => item.name),
            },
            series: [
                {
                    name: "流量来源",
                    type: "pie",
                    radius: ["40%", "70%"],
                    center: ["60%", "50%"],
                    data: analyticsData.traffic.sources.map((item) => ({
                        value: item.value,
                        name: item.name,
                    })),
                    emphasis: {
                        itemStyle: {
                            shadowBlur: 10,
                            shadowOffsetX: 0,
                            shadowColor: "rgba(0, 0, 0, 0.5)",
                        },
                    },
                },
            ],
        };

        chart.setOption(option);
    };

    // 初始化柱状图
    const initBarChart = () => {
        if (!barChartRef.current) return;

        const chart = echarts.init(barChartRef.current);
        barChartInstance.current = chart;

        const option = {
            tooltip: {
                trigger: "axis",
                axisPointer: {
                    type: "shadow",
                },
            },
            grid: {
                top: 20,
                bottom: 40,
                left: 60,
                right: 40,
            },
            xAxis: {
                type: "category",
                data: analyticsData.traffic.devices.map((item) => item.name),
                axisLine: {
                    lineStyle: {
                        color: "#e0e0e0",
                    },
                },
            },
            yAxis: {
                type: "value",
                axisLine: {
                    lineStyle: {
                        color: "#e0e0e0",
                    },
                },
                splitLine: {
                    lineStyle: {
                        color: "#f0f0f0",
                    },
                },
            },
            series: [
                {
                    name: "用户数",
                    type: "bar",
                    data: analyticsData.traffic.devices.map((item) => item.value),
                    itemStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: "#667eea" },
                            { offset: 1, color: "#764ba2" },
                        ]),
                    },
                    emphasis: {
                        itemStyle: {
                            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                { offset: 0, color: "#5a67d8" },
                                { offset: 1, color: "#667eea" },
                            ]),
                        },
                    },
                },
            ],
        };

        chart.setOption(option);
    };

    // 响应式处理
    const handleResize = () => {
        trendChartInstance.current?.resize();
        pieChartInstance.current?.resize();
        barChartInstance.current?.resize();
    };

    useEffect(() => {
        initTrendChart();
        initPieChart();
        initBarChart();

        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
            trendChartInstance.current?.dispose();
            pieChartInstance.current?.dispose();
            barChartInstance.current?.dispose();
        };
    }, [selectedMetric]);

    // 导出数据
    const exportData = () => {
        setIsLoading(true);
        // 模拟导出过程
        setTimeout(() => {
            setIsLoading(false);
            // console.log('导出分析数据');
        }, 2000);
    };

    return (
        <div className={styles.analytics}>
            {/* 页面头部 */}
            <div className={styles.pageHeader}>
                <div className={styles.headerLeft}>
                    <h1 className={styles.pageTitle}>
                        <FaChartBar />
                        统计分析
                    </h1>
                    <p className={styles.pageDescription}>查看网站访问量、用户行为和内容表现等详细统计数据</p>
                </div>
                <div className={styles.headerActions}>
                    <button className={styles.exportButton} onClick={exportData} disabled={isLoading}>
                        <FaDownload />
                        {isLoading ? "导出中..." : "导出报告"}
                    </button>
                </div>
            </div>

            {/* 筛选控制栏 */}
            <div className={styles.controlsSection}>
                <div className={styles.controlGroup}>
                    <div className={styles.controlItem}>
                        <FaCalendarAlt className={styles.controlIcon} />
                        <CustomSelect
                            name="时间范围"
                            value={periodOptions.find((option) => option.id === selectedPeriod) || null}
                            onChange={(selectedOption) => setSelectedPeriod(String(selectedOption?.id || "7天"))}
                            options={periodOptions}
                            hideBadge={true}
                            placeholder="选择时间范围"
                        />
                    </div>
                    <div className={styles.controlItem}>
                        <FaFilter className={styles.controlIcon} />
                        <CustomSelect
                            name="指标类型"
                            value={metricOptions.find((option) => option.id === selectedMetric) || null}
                            onChange={(selectedOption) => setSelectedMetric(String(selectedOption?.id || "visits"))}
                            options={metricOptions}
                            hideBadge={true}
                            placeholder="选择指标类型"
                        />
                    </div>
                </div>
            </div>

            {/* 概览统计卡片 */}
            <div className={styles.overviewGrid}>
                {overviewStats.map((stat, index) => (
                    <div key={index} className={styles.statCard}>
                        <div className={`${styles.statIcon} ${styles[stat.iconColor]}`}>{stat.icon}</div>
                        <div className={styles.statContent}>
                            <div className={styles.statTitle}>{stat.title}</div>
                            <div className={styles.statValue}>{stat.value}</div>
                            <div className={`${styles.statChange} ${styles[stat.changeType]}`}>
                                {stat.changeType === "positive" ? (
                                    <FaArrowUp />
                                ) : stat.changeType === "negative" ? (
                                    <FaArrowDown />
                                ) : (
                                    <FaMinus />
                                )}
                                {stat.change}
                            </div>
                            <div className={styles.statDescription}>{stat.description}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* 图表区域 */}
            <div className={styles.chartsSection}>
                <div className={styles.chartRow}>
                    {/* 趋势图表 */}
                    <div className={styles.chartCard}>
                        <div className={styles.chartHeader}>
                            <h3 className={styles.chartTitle}>
                                {selectedMetric === "visits"
                                    ? "访问量趋势"
                                    : selectedMetric === "users"
                                      ? "用户数趋势"
                                      : "页面浏览量趋势"}
                            </h3>
                        </div>
                        <div ref={trendChartRef} className={styles.chartContainer} />
                    </div>

                    {/* 饼图 */}
                    <div className={styles.chartCard}>
                        <div className={styles.chartHeader}>
                            <h3 className={styles.chartTitle}>流量来源分布</h3>
                        </div>
                        <div ref={pieChartRef} className={styles.chartContainer} />
                    </div>
                </div>

                <div className={styles.chartRow}>
                    {/* 设备分布 */}
                    <div className={styles.chartCard}>
                        <div className={styles.chartHeader}>
                            <h3 className={styles.chartTitle}>设备类型分布</h3>
                        </div>
                        <div ref={barChartRef} className={styles.chartContainer} />
                    </div>

                    {/* 地区分布 */}
                    <div className={styles.chartCard}>
                        <div className={styles.chartHeader}>
                            <h3 className={styles.chartTitle}>地区分布</h3>
                        </div>
                        <div className={styles.locationList}>
                            {analyticsData.traffic.locations.map((location, index) => (
                                <div key={index} className={styles.locationItem}>
                                    <div className={styles.locationInfo}>
                                        <FaGlobe className={styles.locationIcon} />
                                        <span className={styles.locationName}>{location.country}</span>
                                    </div>
                                    <div className={styles.locationStats}>
                                        <span className={styles.locationUsers}>{location.users.toLocaleString()}</span>
                                        <span className={styles.locationPercentage}>{location.percentage}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 内容分析 */}
            <div className={styles.contentSection}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>内容分析</h2>
                </div>
                <div className={styles.contentGrid}>
                    {/* 热门文章 */}
                    <div className={styles.contentCard}>
                        <h3 className={styles.contentTitle}>
                            <FaFileAlt />
                            热门文章
                        </h3>
                        <div className={styles.articleList}>
                            {analyticsData.content.popularArticles.map((article, index) => (
                                <div key={article.id} className={styles.articleItem}>
                                    <div className={styles.articleRank}>{index + 1}</div>
                                    <div className={styles.articleInfo}>
                                        <div className={styles.articleTitle}>{article.title}</div>
                                        <div className={styles.articleStats}>
                                            <span className={styles.articleStat}>
                                                <FaEye /> {article.views.toLocaleString()}
                                            </span>
                                            <span className={styles.articleStat}>
                                                <FaUsers /> {article.likes}
                                            </span>
                                            <span className={styles.articleStat}>
                                                <FaComments /> {article.comments}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 分类统计 */}
                    <div className={styles.contentCard}>
                        <h3 className={styles.contentTitle}>
                            <FaChartPie />
                            分类统计
                        </h3>
                        <div className={styles.categoryList}>
                            {analyticsData.content.categories.map((category, index) => (
                                <div key={index} className={styles.categoryItem}>
                                    <div className={styles.categoryInfo}>
                                        <span className={styles.categoryName}>{category.name}</span>
                                        <span className={styles.categoryCount}>{category.count} 篇</span>
                                    </div>
                                    <div className={styles.categoryBar}>
                                        <div
                                            className={styles.categoryProgress}
                                            style={{ width: `${category.percentage}%` }}
                                        />
                                    </div>
                                    <span className={styles.categoryPercentage}>{category.percentage}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
