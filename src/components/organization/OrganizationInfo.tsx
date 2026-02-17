import React from "react";
import { useNavigate } from "react-router-dom";
import { FaBuilding, FaCheckCircle, FaLock, FaUserFriends, FaArrowLeft, FaPlus, FaUser, FaUserAlt } from "react-icons/fa";
import type { OrganizationDetail, MemberStats } from "./types";
import styles from "../../pages/organization/OrganizationDetail.module.css";

interface OrganizationInfoProps {
  org: OrganizationDetail | null;
  stats: MemberStats;
  onJoin: () => void;
}

const OrganizationInfo: React.FC<OrganizationInfoProps> = ({ org, stats, onJoin }) => {
  const navigate = useNavigate();

  if (!org) return null;

  return (
    <>
      <div className={styles.cardHeader}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <FaArrowLeft /> 返回
        </button>
        <div className={styles.headerContent}>
          <div className={styles.titleGroup}>
            <h1 className={styles.pageTitle}>
              <FaBuilding /> {org.name}
            </h1>
            <span className={styles.orgType}>{org.type}</span>
          </div>
          <div className={styles.headerRight}>
            <span className={org.status === "active" ? styles.statusActive : styles.statusInactive}>
              {org.status === "active" ? <FaCheckCircle /> : <FaLock />}
              {org.status === "active" ? "正常" : "停用"}
            </span>
            {org.user_in_org === "已加入" || org.user_in_org === "申请中" ? (
              <span className={styles.joined}>{org.user_in_org}</span>
            ) : (
              <button
                className={styles.joinBtn}
                onClick={onJoin}
                disabled={org.status !== "active"}
                title={org.status !== "active" ? "该组织已停用，无法加入" : ""}
              >
                <FaPlus /> {org.user_in_org === "已退出" ? "重新加入" : "申请加入"}
              </button>
            )}
          </div>
        </div>
      </div>
      <div className={styles.description}>{org.description}</div>

      {/* 统计卡片 */}
      <div className={styles.statsContainer}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.primary}`}>
            <FaUserFriends />
          </div>
          <div className={styles.statValue}>{stats.totalMembers}</div>
          <div className={styles.statLabel}>总成员数</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.success}`}>
            <FaCheckCircle />
          </div>
          <div className={styles.statValue}>{stats.activeMembers}</div>
          <div className={styles.statLabel}>活跃成员</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.warning}`}>
            <FaUser />
          </div>
          <div className={styles.statValue}>{stats.leaderMembers}</div>
          <div className={styles.statLabel}>负责人</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.error}`}>
            <FaUserAlt />
          </div>
          <div className={styles.statValue}>{stats.regularMembers}</div>
          <div className={styles.statLabel}>普通成员</div>
        </div>
      </div>
    </>
  );
};

export default OrganizationInfo;
