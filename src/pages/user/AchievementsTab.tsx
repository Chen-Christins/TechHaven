import React, { useState, useEffect } from "react";
import { FaFire, FaPenNib, FaComments, FaStar, FaMedal, FaCode, FaHeart, FaRocket, FaTrophy } from "react-icons/fa";
import styles from "./UserPage.module.css";
import acStyles from "./Achievements.module.css";
import { AuthService, type AchievementData, type AchievementBadge } from "@/services/authService";
import message from "@/components/message/Message";

const ICON_MAP: Record<string, React.ReactNode> = {
  pen: <FaPenNib />,
  heart: <FaHeart />,
  fire: <FaFire />,
  code: <FaCode />,
  star: <FaStar />,
  comments: <FaComments />,
  rocket: <FaRocket />,
  trophy: <FaTrophy />,
};

const LEVEL_COLORS = ["var(--bg-tertiary)", "#9be9a8", "#40c463", "#30a14e", "#216e39"];
const WEEKDAYS = ["", "一", "", "三", "", "五", ""];
const MONTHS = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

const AchievementsTab: React.FC = () => {
  const [data, setData] = useState<AchievementData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AuthService.getAchievements()
      .then(setData)
      .catch((err) => message.error(err?.message || "加载成就数据失败"))
      .finally(() => setLoading(false));
  }, []);

  const stats = data?.stats;
  const badges: AchievementBadge[] = data?.badges ?? [];
  const heatmap: number[][] = data?.heatmap ?? [];
  const totalContributions = stats?.total_contributions ?? 0;

  if (loading) {
    return (
      <div className={styles.tabWrap} style={{ textAlign: "center", padding: 60, color: "var(--text-tertiary)" }}>
        加载中...
      </div>
    );
  }

  return (
    <div className={styles.tabWrap}>
      <div className={acStyles.statsRow}>
        {[
          { label: "总贡献", value: totalContributions, icon: <FaFire />, color: "#f97316" },
          { label: "已发布文章", value: stats?.published_articles ?? 0, icon: <FaPenNib />, color: "#3b82f6" },
          { label: "获得点赞", value: stats?.total_likes ?? 0, icon: <FaHeart />, color: "#ef4444" },
          {
            label: "解锁徽章",
            value: `${stats?.unlocked_badges ?? 0}/${stats?.total_badges ?? 0}`,
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
        <p className={styles.cardDesc}>过去一年共 {totalContributions} 次贡献</p>
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
                {heatmap.map((col, wi) => (
                  <div key={wi} className={acStyles.col}>
                    {col.map((level, di) => (
                      <div
                        key={di}
                        className={acStyles.cell}
                        style={{ background: LEVEL_COLORS[level] ?? LEVEL_COLORS[0] }}
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
          {badges.map((b) => (
            <div key={b.id} className={`${acStyles.badge} ${!b.unlocked ? acStyles.badgeLocked : ""}`}>
              <div className={acStyles.badgeIcon} style={{ color: b.color, background: `${b.color}1a` }}>
                {ICON_MAP[b.icon] ?? <FaMedal />}
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
