import React from 'react';
import { Link } from 'react-router-dom';
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
    FaChevronRight
} from 'react-icons/fa';
import styles from './Dashboard.module.css';

const Dashboard: React.FC = () => {
    // 模拟统计数据
    const stats = [
        {
            title: '总用户数',
            value: '1,234',
            change: '+12%',
            changeType: 'positive' as const,
            icon: <FaUsers />,
            iconColor: 'blue'
        },
        {
            title: '文章总数',
            value: '456',
            change: '+8%',
            changeType: 'positive' as const,
            icon: <FaFileAlt />,
            iconColor: 'green'
        },
        {
            title: '评论总数',
            value: '2,789',
            change: '-3%',
            changeType: 'negative' as const,
            icon: <FaComments />,
            iconColor: 'orange'
        },
        {
            title: '今日访问',
            value: '892',
            change: '+15%',
            changeType: 'positive' as const,
            icon: <FaEye />,
            iconColor: 'purple'
        },
        {
            title: '新增用户',
            value: '23',
            change: '0%',
            changeType: 'neutral' as const,
            icon: <FaUserPlus />,
            iconColor: 'blue'
        }
    ];

    // 快速操作数据
    const quickActions = [
        {
            title: '创建文章',
            description: '撰写新的博客文章',
            icon: <FaEdit />,
            path: '/article/create'
        },
        {
            title: '添加用户',
            description: '邀请新用户加入',
            icon: <FaUserPlus />,
            path: '/admin/users'
        },
        {
            title: '系统设置',
            description: '配置系统参数',
            icon: <FaCog />,
            path: '/admin/settings'
        },
        {
            title: '查看统计',
            description: '查看详细数据分析',
            icon: <FaChartBar />,
            path: '/admin/analytics'
        }
    ];

    // 最近活动数据
    const recentActivities = [
        {
            type: 'user' as const,
            title: '新用户 "张三" 注册了账户',
            time: '2分钟前',
            icon: <FaUsers />
        },
        {
            type: 'article' as const,
            title: '李四 发布了新文章《React Hooks 最佳实践》',
            time: '15分钟前',
            icon: <FaFileAlt />
        },
        {
            type: 'comment' as const,
            title: '王五 在《TypeScript 入门》中发表了评论',
            time: '1小时前',
            icon: <FaComments />
        },
        {
            type: 'system' as const,
            title: '系统自动备份完成',
            time: '2小时前',
            icon: <FaCog />
        },
        {
            type: 'user' as const,
            title: '赵六 更新了个人资料',
            time: '3小时前',
            icon: <FaUsers />
        }
    ];

    // 最近用户数据
    const recentUsers = [
        {
            name: '张三',
            role: '普通用户',
            avatar: 'https://picsum.photos/id/1/100',
            status: 'active'
        },
        {
            name: '李四',
            role: '版主',
            avatar: 'https://picsum.photos/id/2/100',
            status: 'active'
        },
        {
            name: '王五',
            role: '普通用户',
            avatar: 'https://picsum.photos/id/3/100',
            status: 'active'
        },
        {
            name: '赵六',
            role: '管理员',
            avatar: 'https://picsum.photos/id/4/100',
            status: 'active'
        },
        {
            name: '钱七',
            role: '普通用户',
            avatar: 'https://picsum.photos/id/5/100',
            status: 'inactive'
        }
    ];

    // 获取变化指示器
    const getChangeIndicator = (change: string, type: 'positive' | 'negative' | 'neutral') => {
        const getIcon = () => {
            if (type === 'positive') return <FaArrowUp />;
            if (type === 'negative') return <FaArrowDown />;
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
                            <div className={`${styles.statIcon} ${styles[stat.iconColor]}`}>
                                {stat.icon}
                            </div>
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
                            <button className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`}>
                                7天
                            </button>
                            <button className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`}>
                                30天
                            </button>
                            <button className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`}>
                                90天
                            </button>
                        </div>
                    </div>
                    <div className={styles.chartContainer}>
                        📊 图表组件占位符（可集成 Chart.js 或其他图表库）
                    </div>
                </div>

                {/* 快速操作 */}
                <div className={styles.quickActionsCard}>
                    <h3 className={styles.quickActionsTitle}>快速操作</h3>
                    <div className={styles.quickActionsList}>
                        {quickActions.map((action, index) => (
                            <Link
                                key={index}
                                to={action.path}
                                className={styles.quickActionItem}
                            >
                                <div className={styles.quickActionIcon}>
                                    {action.icon}
                                </div>
                                <div className={styles.quickActionContent}>
                                    <div className={styles.quickActionTitle}>{action.title}</div>
                                    <div className={styles.quickActionDescription}>
                                        {action.description}
                                    </div>
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
                                <div className={getActivityIconClass(activity.type)}>
                                    {activity.icon}
                                </div>
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
                                <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className={styles.userAvatar}
                                />
                                <div className={styles.userInfo}>
                                    <div className={styles.userName}>{user.name}</div>
                                    <div className={styles.userRole}>{user.role}</div>
                                </div>
                                <div
                                    className={styles.userStatus}
                                    style={{
                                        backgroundColor: user.status === 'active' ? 'var(--success)' : 'var(--text-tertiary)'
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