import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaClipboardList, FaBug, FaTasks, FaExclamationTriangle } from "react-icons/fa";
import styles from "./Dashboard.module.css";
import Loading from "../../components/loading/Loading";
import { encodeId } from "../../utils/hashId";
import { RdPlatformService as RdAPI } from "../../services/rdPlatformService";
import type { RdStats, Requirement, Bug, Task } from "../../types/rdPlatform";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<RdStats | null>(null);
  const [recentRequirements, setRecentRequirements] = useState<Requirement[]>([]);
  const [recentBugs, setRecentBugs] = useState<Bug[]>([]);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [s, reqs, bugs, tasks] = await Promise.all([
        RdAPI.getStats(),
        RdAPI.getRequirements({ page: 1, pageSize: 5 }),
        RdAPI.getBugs({ page: 1, pageSize: 5 }),
        RdAPI.getTasks({ page: 1, pageSize: 5 }),
      ]);
      setStats(s);
      setRecentRequirements(reqs.data);
      setRecentBugs(bugs.data);
      setRecentTasks(tasks.data);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <Loading />;

  const statusText: Record<string, string> = {
    new: "新建",
    developing: "开发中",
    testing: "测试中",
    done: "已完成",
    closed: "已关闭",
    accepted: "已受理",
    processing: "处理中",
    verified: "已验证",
    reopened: "已重开",
    todo: "待办",
    doing: "进行中",
  };

  const priorityText: Record<string, string> = {
    urgent: "紧急",
    high: "高",
    medium: "中",
    low: "低",
  };

  const severityText: Record<string, string> = {
    fatal: "致命",
    serious: "严重",
    normal: "一般",
    minor: "轻微",
  };

  return (
    <div className={styles.dashboard}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>研发仪表盘</h1>
          <p className={styles.pageDescription}>项目全局概览与最近动态</p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard} onClick={() => navigate("/rd/requirements")}>
          <div className={`${styles.statIcon} ${styles.primary}`}>
            <FaClipboardList />
          </div>
          <div className={styles.statValue}>{stats?.totalRequirements ?? 0}</div>
          <div className={styles.statLabel}>需求总数</div>
          <div className={styles.statSub}>未关闭 {stats?.openRequirements ?? 0}</div>
        </div>
        <div className={styles.statCard} onClick={() => navigate("/rd/bugs")}>
          <div className={`${styles.statIcon} ${styles.danger}`}>
            <FaBug />
          </div>
          <div className={styles.statValue}>{stats?.totalBugs ?? 0}</div>
          <div className={styles.statLabel}>缺陷总数</div>
          <div className={styles.statSub}>未解决 {stats?.unresolvedBugs ?? 0}</div>
        </div>
        <div className={styles.statCard} onClick={() => navigate("/rd/tasks")}>
          <div className={`${styles.statIcon} ${styles.success}`}>
            <FaTasks />
          </div>
          <div className={styles.statValue}>{stats?.totalTasks ?? 0}</div>
          <div className={styles.statLabel}>任务总数</div>
          <div className={styles.statSub}>已逾期 {stats?.overdueTasks ?? 0}</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.warning}`}>
            <FaExclamationTriangle />
          </div>
          <div className={styles.statValue}>{(stats?.openRequirements ?? 0) + (stats?.unresolvedBugs ?? 0)}</div>
          <div className={styles.statLabel}>待处理工作项</div>
          <div className={styles.statSub}>需求 + 缺陷</div>
        </div>
      </div>

      {/* 最近的需求 */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>最近需求</h2>
          <button className={styles.viewAllBtn} onClick={() => navigate("/rd/requirements")}>
            查看全部 →
          </button>
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>标题</th>
                <th>优先级</th>
                <th>状态</th>
                <th>负责人</th>
                <th>创建时间</th>
              </tr>
            </thead>
            <tbody>
              {recentRequirements.map((r) => (
                <tr key={r.id} className={styles.clickableRow} onClick={() => navigate(`/rd/requirements/${encodeId(r.id)}`)}>
                  <td>{r.title}</td>
                  <td>
                    <span className={`${styles.badge} ${styles[`priority_${r.priority}`]}`}>{priorityText[r.priority]}</span>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${styles[`status_${r.status}`]}`}>{statusText[r.status] || r.status}</span>
                  </td>
                  <td>{r.assignee || "-"}</td>
                  <td>{new Date(r.createdAt).toLocaleDateString("zh-CN")}</td>
                </tr>
              ))}
              {recentRequirements.length === 0 && (
                <tr>
                  <td colSpan={5} className={styles.emptyCell}>
                    <div className={styles.emptyCellIcon}>
                      <FaClipboardList />
                    </div>
                    <div className={styles.emptyCellText}>暂无需求</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 最近的缺陷 */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>最近缺陷</h2>
          <button className={styles.viewAllBtn} onClick={() => navigate("/rd/bugs")}>
            查看全部 →
          </button>
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>标题</th>
                <th>严重程度</th>
                <th>优先级</th>
                <th>状态</th>
                <th>负责人</th>
              </tr>
            </thead>
            <tbody>
              {recentBugs.map((b) => (
                <tr key={b.id} className={styles.clickableRow} onClick={() => navigate(`/rd/bugs/${encodeId(b.id)}`)}>
                  <td>{b.title}</td>
                  <td>
                    <span className={`${styles.badge} ${styles[`severity_${b.severity}`]}`}>{severityText[b.severity]}</span>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${styles[`priority_${b.priority}`]}`}>{priorityText[b.priority]}</span>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${styles[`status_${b.status}`]}`}>{statusText[b.status] || b.status}</span>
                  </td>
                  <td>{b.assignee || "-"}</td>
                </tr>
              ))}
              {recentBugs.length === 0 && (
                <tr>
                  <td colSpan={5} className={styles.emptyCell}>
                    <div className={styles.emptyCellIcon}>
                      <FaBug />
                    </div>
                    <div className={styles.emptyCellText}>暂无缺陷</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 最近的任务 */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>最近任务</h2>
          <button className={styles.viewAllBtn} onClick={() => navigate("/rd/tasks")}>
            查看全部 →
          </button>
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>标题</th>
                <th>状态</th>
                <th>优先级</th>
                <th>负责人</th>
                <th>截止日期</th>
              </tr>
            </thead>
            <tbody>
              {recentTasks.map((t) => (
                <tr key={t.id} className={styles.clickableRow} onClick={() => navigate(`/rd/tasks/${encodeId(t.id)}`)}>
                  <td>{t.title}</td>
                  <td>
                    <span className={`${styles.badge} ${styles[`status_${t.status}`]}`}>{statusText[t.status]}</span>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${styles[`priority_${t.priority}`]}`}>{priorityText[t.priority]}</span>
                  </td>
                  <td>{t.assignee || "-"}</td>
                  <td>{t.deadline ? new Date(t.deadline).toLocaleDateString("zh-CN") : "-"}</td>
                </tr>
              ))}
              {recentTasks.length === 0 && (
                <tr>
                  <td colSpan={5} className={styles.emptyCell}>
                    <div className={styles.emptyCellIcon}>
                      <FaTasks />
                    </div>
                    <div className={styles.emptyCellText}>暂无任务</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
