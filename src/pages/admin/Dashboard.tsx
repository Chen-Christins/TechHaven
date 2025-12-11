import React, { useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import * as echarts from "echarts";
import {
    FaUsers,
    FaFileAlt,
    FaComments,
    FaEye,
    FaArrowUp,
    FaArrowDown,
    FaMinus,
    FaEdit,
    FaChartBar,
    FaCog,
    FaUserPlus,
    FaChevronRight,
} from "react-icons/fa";
import styles from "./Dashboard.module.css";

const Dashboard: React.FC = () => {
    // 访问趋势mock数据
    const [selectedPeriod, setSelectedPeriod] = React.useState("7天");
    const chartRef = useRef<HTMLDivElement>(null);
    const chartInstance = useRef<echarts.ECharts | null>(null);

    const visitTrendData = {
        "7天": [
            { day: "周一", visits: 820, date: "11-15" },
            { day: "周二", visits: 932, date: "11-16" },
            { day: "周三", visits: 901, date: "11-17" },
            { day: "周四", visits: 934, date: "11-18" },
            { day: "周五", visits: 1290, date: "11-19" },
            { day: "周六", visits: 1330, date: "11-20" },
            { day: "周日", visits: 892, date: "11-21" },
        ],
        "30天": [
            { day: "第1周", visits: 5800, date: "10-22~10-28" },
            { day: "第2周", visits: 6200, date: "10-29~11-04" },
            { day: "第3周", visits: 7100, date: "11-05~11-11" },
            { day: "第4周", visits: 6892, date: "11-12~11-21" },
        ],
        "90天": [
            { day: "9月", visits: 19800, date: "2024-09" },
            { day: "10月", visits: 25900, date: "2024-10" },
            { day: "11月", visits: 19892, date: "2024-11" },
        ],
    };

    // 模拟统计数据
    const stats = [
        {
            title: "总用户数",
            value: "1,234",
            change: "+12%",
            changeType: "positive" as const,
            icon: <FaUsers />,
            iconColor: "blue",
        },
        {
            title: "文章总数",
            value: "456",
            change: "+8%",
            changeType: "positive" as const,
            icon: <FaFileAlt />,
            iconColor: "green",
        },
        {
            title: "评论总数",
            value: "2,789",
            change: "-3%",
            changeType: "negative" as const,
            icon: <FaComments />,
            iconColor: "orange",
        },
        {
            title: "今日访问",
            value: "892",
            change: "+15%",
            changeType: "positive" as const,
            icon: <FaEye />,
            iconColor: "purple",
        },
        {
            title: "新增用户",
            value: "23",
            change: "0%",
            changeType: "neutral" as const,
            icon: <FaUserPlus />,
            iconColor: "blue",
        },
    ];

    // 快速操作数据
    const quickActions = [
        {
            title: "创建文章",
            description: "撰写新的博客文章",
            icon: <FaEdit />,
            path: "/article/create",
        },
        {
            title: "添加用户",
            description: "邀请新用户加入",
            icon: <FaUserPlus />,
            path: "/admin/users",
        },
        {
            title: "系统设置",
            description: "配置系统参数",
            icon: <FaCog />,
            path: "/admin/settings",
        },
        {
            title: "查看统计",
            description: "查看详细数据分析",
            icon: <FaChartBar />,
            path: "/admin/analytics",
        },
    ];

    // 最近活动数据
    const recentActivities = [
        {
            type: "user" as const,
            title: '新用户 "张三" 注册了账户',
            time: "2分钟前",
            icon: <FaUsers />,
        },
        {
            type: "article" as const,
            title: "李四 发布了新文章《React Hooks 最佳实践》",
            time: "15分钟前",
            icon: <FaFileAlt />,
        },
        {
            type: "comment" as const,
            title: "王五 在《TypeScript 入门》中发表了评论",
            time: "1小时前",
            icon: <FaComments />,
        },
        {
            type: "system" as const,
            title: "系统自动备份完成",
            time: "2小时前",
            icon: <FaCog />,
        },
        {
            type: "user" as const,
            title: "赵六 更新了个人资料",
            time: "3小时前",
            icon: <FaUsers />,
        },
    ];

    // 最近用户数据
    const recentUsers = [
        {
            name: "张三",
            role: "普通用户",
            avatar: "https://picsum.photos/id/1/100",
            status: "active",
        },
        {
            name: "李四",
            role: "版主",
            avatar: "https://picsum.photos/id/2/100",
            status: "active",
        },
        {
            name: "王五",
            role: "普通用户",
            avatar: "https://picsum.photos/id/3/100",
            status: "active",
        },
        {
            name: "赵六",
            role: "管理员",
            avatar: "https://picsum.photos/id/4/100",
            status: "active",
        },
        {
            name: "钱七",
            role: "普通用户",
            avatar: "https://picsum.photos/id/5/100",
            status: "inactive",
        },
    ];

    // 获取变化指示器
    const getChangeIndicator = (change: string, type: "positive" | "negative" | "neutral") => {
        const getIcon = () => {
            if (type === "positive") return <FaArrowUp />;
            if (type === "negative") return <FaArrowDown />;
            return <FaMinus />;
        };

        return (
            <span className={`${styles.statChange} ${styles[type]}`}>
                {getIcon()}
                {change}
            </span>
        );
    };

    // 获取活动图标样式
    const getActivityIconClass = (type: string) => {
        return `${styles.activityIcon} ${styles[type]}`;
    };

    // 初始化和更新ECharts图表
    useEffect(() => {
        if (!chartRef.current) return;

        // 初始化图表
        if (!chartInstance.current) {
            chartInstance.current = echarts.init(chartRef.current, "light", {
                renderer: "canvas",
            });
        }

        const chart = chartInstance.current;
        const data = visitTrendData[selectedPeriod as keyof typeof visitTrendData];

        // ECharts配置
        const option = {
            tooltip: {
                trigger: "axis",
                backgroundColor: "#ffffff",
                borderColor: "#e1e5e9",
                borderWidth: 1,
                borderRadius: 6,
                padding: [8, 12],
                textStyle: {
                    color: "#333333",
                    fontSize: 12,
                },
                formatter: (params: any) => {
                    const point = params[0];
                    const dataIndex = point.dataIndex;
                    const item = data[dataIndex];
                    return `
                        <div style="padding: 4px 0;">
                            <div style="font-weight: 600; margin-bottom: 4px; color: #333;">${point.name}</div>
                            <div style="color: #4361ee; font-weight: 500;">访问量: ${point.value.toLocaleString()}</div>
                            <div style="font-size: 11px; color: #666666; margin-top: 2px;">${item.date}</div>
                        </div>
                    `;
                },
            },
            grid: {
                left: "2%",
                right: "3%",
                bottom: "12%",
                top: "8%",
                containLabel: true,
            },
            xAxis: {
                type: "category",
                data: data.map((item) => item.day),
                axisLine: {
                    lineStyle: {
                        color: "#e1e5e9",
                        width: 1,
                    },
                },
                axisTick: {
                    show: false,
                },
                axisLabel: {
                    color: "#666666",
                    fontSize: 11,
                    interval: 0,
                    rotate: 0,
                    margin: 8,
                },
            },
            yAxis: {
                type: "value",
                axisLine: {
                    show: false,
                },
                axisTick: {
                    show: false,
                },
                axisLabel: {
                    color: "#999999",
                    fontSize: 10,
                    margin: 4,
                    formatter: (value: number) => {
                        if (value >= 1000) {
                            return (value / 1000).toFixed(1) + "k";
                        }
                        return value.toString();
                    },
                },
                splitLine: {
                    lineStyle: {
                        color: "#f0f0f0",
                        type: "dashed",
                        width: 1,
                        opacity: 0.6,
                    },
                },
            },
            series: [
                {
                    name: "访问量",
                    type: "line",
                    data: data.map((item) => item.visits),
                    smooth: true,
                    symbol: "circle",
                    symbolSize: 5,
                    sampling: "average",
                    lineStyle: {
                        width: 2.5,
                        color: "#4361ee",
                        shadowColor: "rgba(67, 97, 238, 0.3)",
                        shadowBlur: 8,
                        shadowOffsetY: 3,
                    },
                    itemStyle: {
                        color: "#4361ee",
                        borderColor: "#ffffff",
                        borderWidth: 2,
                        shadowColor: "rgba(67, 97, 238, 0.5)",
                        shadowBlur: 6,
                    },
                    areaStyle: {
                        color: {
                            type: "linear",
                            x: 0,
                            y: 0,
                            x2: 0,
                            y2: 1,
                            colorStops: [
                                {
                                    offset: 0,
                                    color: "#4361ee",
                                    opacity: 0.25,
                                },
                                {
                                    offset: 0.6,
                                    color: "#4361ee",
                                    opacity: 0.08,
                                },
                                {
                                    offset: 1,
                                    color: "#4361ee",
                                    opacity: 0.01,
                                },
                            ],
                        },
                    },
                    emphasis: {
                        itemStyle: {
                            color: "#4361ee",
                            borderColor: "#ffffff",
                            borderWidth: 3,
                            shadowColor: "rgba(67, 97, 238, 0.8)",
                            shadowBlur: 10,
                        },
                        lineStyle: {
                            width: 3,
                            shadowBlur: 12,
                        },
                    },
                },
            ],
        };

        chart.setOption(option);

        // 响应式处理
        const handleResize = () => {
            chart.resize();
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, [selectedPeriod, visitTrendData]);

    // 渲染访问趋势图表
    const renderVisitTrendChart = () => {
        const data = visitTrendData[selectedPeriod as keyof typeof visitTrendData];
        const totalVisits = data.reduce((sum, item) => sum + item.visits, 0);
        const avgVisits = Math.round(totalVisits / data.length);
        const maxVisits = Math.max(...data.map((d) => d.visits));

        return (
            <div className={styles.visitTrendChart}>
                <div className={styles.echartContainer} ref={chartRef} />
                <div className={styles.chartSummary}>
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>总访问量</span>
                        <span className={styles.summaryValue}>{totalVisits.toLocaleString()}</span>
                    </div>
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>日均访问</span>
                        <span className={styles.summaryValue}>{avgVisits.toLocaleString()}</span>
                    </div>
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>峰值</span>
                        <span className={styles.summaryValue}>{maxVisits.toLocaleString()}</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className={styles.dashboard}>
            {/* 页面头部 */}
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>仪表盘</h1>
                <p className={styles.pageDescription}>
                    欢迎回到管理后台！这里是您的数据中心，可以快速了解系统运行状况。
                </p>
            </div>

            {/* 统计卡片 */}
            <div className={styles.statsGrid}>
                {stats.map((stat, index) => (
                    <div key={index} className={styles.statCard}>
                        <div className={styles.statHeader}>
                            <div className={`${styles.statIcon} ${styles[stat.iconColor]}`}>{stat.icon}</div>
                            {getChangeIndicator(stat.change, stat.changeType)}
                        </div>
                        <div className={styles.statValue}>{stat.value}</div>
                        <div className={styles.statLabel}>{stat.title}</div>
                    </div>
                ))}
            </div>

            {/* 主要内容区域 */}
            <div className={styles.contentGrid}>
                {/* 图表区域 */}
                <div className={styles.chartCard}>
                    <div className={styles.chartHeader}>
                        <h3 className={styles.chartTitle}>访问趋势</h3>
                        <div className={styles.chartActions}>
                            <button
                                className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm} ${selectedPeriod === "7天" ? styles.active : ""}`}
                                onClick={() => setSelectedPeriod("7天")}
                            >
                                7天
                            </button>
                            <button
                                className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm} ${selectedPeriod === "30天" ? styles.active : ""}`}
                                onClick={() => setSelectedPeriod("30天")}
                            >
                                30天
                            </button>
                            <button
                                className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm} ${selectedPeriod === "90天" ? styles.active : ""}`}
                                onClick={() => setSelectedPeriod("90天")}
                            >
                                90天
                            </button>
                        </div>
                    </div>
                    <div className={styles.chartContainer}>{renderVisitTrendChart()}</div>
                </div>

                {/* 快速操作 */}
                <div className={styles.quickActionsCard}>
                    <h3 className={styles.quickActionsTitle}>快速操作</h3>
                    <div className={styles.quickActionsList}>
                        {quickActions.map((action, index) => (
                            <Link key={index} to={action.path} className={styles.quickActionItem}>
                                <div className={styles.quickActionIcon}>{action.icon}</div>
                                <div className={styles.quickActionContent}>
                                    <div className={styles.quickActionTitle}>{action.title}</div>
                                    <div className={styles.quickActionDescription}>{action.description}</div>
                                </div>
                                <FaChevronRight className={styles.quickActionArrow} />
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* 底部内容 */}
            <div className={styles.bottomGrid}>
                {/* 最近活动 */}
                <div className={styles.recentActivityCard}>
                    <h3 className={styles.cardTitle}>最近活动</h3>
                    <div className={styles.activityList}>
                        {recentActivities.map((activity, index) => (
                            <div key={index} className={styles.activityItem}>
                                <div className={getActivityIconClass(activity.type)}>{activity.icon}</div>
                                <div className={styles.activityContent}>
                                    <div className={styles.activityTitle}>{activity.title}</div>
                                    <div className={styles.activityTime}>{activity.time}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 最近用户 */}
                <div className={styles.recentUsersCard}>
                    <h3 className={styles.cardTitle}>最近用户</h3>
                    <div className={styles.userList}>
                        {recentUsers.map((user, index) => (
                            <div key={index} className={styles.userItem}>
                                <img src={user.avatar} alt={user.name} className={styles.userAvatar} />
                                <div className={styles.userInfo}>
                                    <div className={styles.userName}>{user.name}</div>
                                    <div className={styles.userRole}>{user.role}</div>
                                </div>
                                <div
                                    className={styles.userStatus}
                                    style={{
                                        backgroundColor:
                                            user.status === "active" ? "var(--success)" : "var(--text-tertiary)",
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
