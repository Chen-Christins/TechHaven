import React, { useMemo } from "react";
import { FaFire, FaPenNib, FaComments, FaStar, FaMedal, FaCode, FaHeart } from "react-icons/fa";
import styles from "./UserPage.module.css";
import acStyles from "./Achievements.module.css";

interface Badge {
  id: string;
  name: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
  unlocked: boolean;
  progress?: string;
}

const BADGES: Badge[] = [
  { id: "1", name: "笔耕不辍", desc: "累计发布 50 篇文章", icon: <FaPenNib />, color: "#3b82f6", unlocked: true },
  { id: "2", name: "百赞达成", desc: "单篇文章获得 100 赞", icon: <FaHeart />, color: "#ef4444", unlocked: true },
  { id: "3", name: "连续创作", desc: "连续 30 天有贡献", icon: <FaFire />, color: "#f97316", unlocked: true },
  { id: "4", name: "代码贡献者", desc: "合并 20 个 PR", icon: <FaCode />, color: "#22c55e", unlocked: true },
  { id: "5", name: "社区之星", desc: "获得 1000 个关注", icon: <FaStar />, color: "#eab308", unlocked: false, progress: "742 / 1000" },
  {
    id: "6",
    name: "评论达人",
    desc: "发表 500 条评论",
    icon: <FaComments />,
    color: "#a855f7",
    unlocked: false,
    progress: "318 / 500",
  },
];

const LEVEL_COLORS = ["var(--bg-tertiary)", "#9be9a8", "#40c463", "#30a14e", "#216e39"];
const WEEKDAYS = ["", "一", "", "三", "", "五", ""];
const MONTHS = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

const AchievementsTab: React.FC = () => {
  const { weeks, total } = useMemo(() => {
    const weeksCount = 53;
    const grid: number[][] = [];
    let sum = 0;
    let seed = 20260101;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    for (let w = 0; w < weeksCount; w++) {
      const col: number[] = [];
      for (let d = 0; d < 7; d++) {
        const r = rand();
        const level = r < 0.45 ? 0 : r < 0.65 ? 1 : r < 0.82 ? 2 : r < 0.94 ? 3 : 4;
        col.push(level);
        sum += level;
      }
      grid.push(col);
    }
    return { weeks: grid, total: sum };
  }, []);

  return (
    <div className={styles.tabWrap}>
      <div className={acStyles.statsRow}>
        {[
          { label: "总贡献", value: total, icon: <FaFire />, color: "#f97316" },
          { label: "已发布文章", value: 52, icon: <FaPenNib />, color: "#3b82f6" },
          { label: "获得点赞", value: "3.2k", icon: <FaHeart />, color: "#ef4444" },
          {
            label: "解锁徽章",
            value: `${BADGES.filter((b) => b.unlocked).length}/${BADGES.length}`,
            icon: <FaMedal />,
            color: "#eab308",
          },
        ].map((s) => (
          <div key={s.label} className={acStyles.statCard}>
            <div className={acStyles.statIcon} style={{ color: s.color, background: `${s.color}1a` }}>
              {s.icon}
            </div>
            <div>
              <div className={acStyles.statValue}>{s.value}</div>
              <div className={acStyles.statLabel}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>
          <FaFire /> 贡献热力图
        </h2>
        <p className={styles.cardDesc}>过去一年共 {total} 次贡献</p>
        <div className={acStyles.heatmapScroll}>
          <div className={acStyles.heatmap}>
            <div className={acStyles.months}>
              {MONTHS.map((m) => (
                <span key={m} className={acStyles.monthLabel}>
                  {m}
                </span>
              ))}
            </div>
            <div className={acStyles.gridWrap}>
              <div className={acStyles.weekdays}>
                {WEEKDAYS.map((d, i) => (
                  <span key={i} className={acStyles.weekdayLabel}>
                    {d}
                  </span>
                ))}
              </div>
              <div className={acStyles.grid}>
                {weeks.map((col, wi) => (
                  <div key={wi} className={acStyles.col}>
                    {col.map((level, di) => (
                      <div
                        key={di}
                        className={acStyles.cell}
                        style={{ background: LEVEL_COLORS[level] }}
                        title={`贡献等级 ${level}`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className={acStyles.legend}>
              <span>少</span>
              {LEVEL_COLORS.map((c, i) => (
                <span key={i} className={acStyles.cell} style={{ background: c }} />
              ))}
              <span>多</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>
          <FaMedal /> 荣誉徽章
        </h2>
        <div className={acStyles.badgeGrid}>
          {BADGES.map((b) => (
            <div key={b.id} className={`${acStyles.badge} ${!b.unlocked ? acStyles.badgeLocked : ""}`}>
              <div className={acStyles.badgeIcon} style={{ color: b.color, background: `${b.color}1a` }}>
                {b.icon}
              </div>
              <div className={acStyles.badgeName}>{b.name}</div>
              <div className={acStyles.badgeDesc}>{b.desc}</div>
              {b.unlocked ? (
                <span className={acStyles.badgeUnlocked}>已解锁</span>
              ) : (
                <span className={acStyles.badgeProgress}>{b.progress}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AchievementsTab;
