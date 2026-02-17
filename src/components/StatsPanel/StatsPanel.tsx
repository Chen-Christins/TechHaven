import React from "react";
import type { StatsData } from "../../types/index";
import { FaUsers, FaEye, FaChartLine, FaUserCheck } from "react-icons/fa";
import styles from "./StatsPanel.module.css";

// 模拟统计数据
const mockStats: StatsData = {
  onlineUsers: 28,
  totalVisits: 15682,
  todayVisits: 326,
  totalVisitors: 8945,
};

const StatsPanel: React.FC = () => {
  const statsItems = [
    {
      title: "在线用户",
      value: mockStats.onlineUsers,
      icon: <FaUsers className={styles.statIcon} />,
      color: styles.online,
    },
    {
      title: "今日访问",
      value: mockStats.todayVisits,
      icon: <FaChartLine className={styles.statIcon} />,
      color: styles.today,
    },
    {
      title: "累计访问",
      value: mockStats.totalVisits.toLocaleString(),
      icon: <FaEye className={styles.statIcon} />,
      color: styles.total,
    },
    {
      title: "累计访客",
      value: mockStats.totalVisitors.toLocaleString(),
      icon: <FaUserCheck className={styles.statIcon} />,
      color: styles.visitors,
    },
  ];

  return (
    <div className={styles.statsPanel}>
      <h3 className={styles.panelTitle}>访问统计</h3>
      <div className={styles.statsGrid}>
        {statsItems.map((item, index) => (
          <div key={index} className={styles.statItem}>
            <div className={item.color}>{item.icon}</div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>{item.value}</div>
              <div className={styles.statTitle}>{item.title}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatsPanel;
