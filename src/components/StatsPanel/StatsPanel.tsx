import React, { useState, useEffect } from "react";
import { FaUsers, FaEye, FaChartLine, FaUserCheck } from "react-icons/fa";
import StatsService from "@/services/statsService";
import { useOnlineCount } from "@/hooks/useOnlineCount";
import styles from "./StatsPanel.module.css";

const POLL_INTERVAL = 30_000; // 30 秒轮询一次 HTTP 统计

const StatsPanel: React.FC = () => {
  const [httpStats, setHttpStats] = useState<{
    todayVisits: number;
    totalVisits: number;
    totalVisitors: number;
  }>({
    todayVisits: 0,
    totalVisits: 0,
    totalVisitors: 0,
  });
  const onlineUsers = useOnlineCount(); // 实时 WebSocket 推送

  useEffect(() => {
    let cancelled = false;

    const fetchStats = () => {
      StatsService.getStats()
        .then((data) => {
          if (cancelled) return;
          setHttpStats({
            todayVisits: data.todayVisits,
            totalVisits: data.totalVisits,
            totalVisitors: data.totalVisitors,
          });
        })
        .catch((err: any) => {
          console.error("获取站点统计失败:", err?.message || err);
        });
    };

    fetchStats();
    const timer = setInterval(fetchStats, POLL_INTERVAL);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const statsItems = [
    {
      title: "在线用户",
      value: onlineUsers,
      icon: <FaUsers className={styles.statIcon} />,
      color: styles.online,
    },
    {
      title: "今日访问",
      value: httpStats.todayVisits,
      icon: <FaChartLine className={styles.statIcon} />,
      color: styles.today,
    },
    {
      title: "累计访问",
      value: httpStats.totalVisits.toLocaleString(),
      icon: <FaEye className={styles.statIcon} />,
      color: styles.total,
    },
    {
      title: "累计访客",
      value: httpStats.totalVisitors.toLocaleString(),
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
