import React, { useState, useEffect } from "react";
import { FaUsers, FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { encodeId } from "../../../utils/hashId";
import Loading from "../../../components/loading/Loading";
import { useAuth } from "../../../contexts/AuthContext";
import { OrganizationService } from "../../../services/organizationService";
import { formatToChinaTime } from "../../../utils/utils";
import type { PersonalOrganization } from "../../../types/organization";
import styles from "../PersonalCenter.module.css";

const MyOrganizationsTab: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id;
  const [organizations, setOrganizations] = useState<PersonalOrganization[]>([]);
  const [organizationsLoading, setOrganizationsLoading] = useState(false);

  useEffect(() => {
    const fetchPersonalOrganizations = async () => {
      setOrganizationsLoading(true);
      if (!userId) {
        setOrganizations([]);
        setOrganizationsLoading(false);
        return;
      }

      try {
        // 使用最新接口获取用户加入的组织列表
        const res = await OrganizationService.userOrganizationLists();
        const orgs: PersonalOrganization[] = (res.list || []).map((org: any) => ({
          id: String(org.org_id),
          name: org.org_name || "未知组织",
          type: org.type || "未知类型",
          description: org.org_description || "暂无描述",
          memberCount: org.count ?? 0,
          role: org.role === 3 ? "会长" : org.role === 2 ? "管理员" : "成员",
          createTime: org.join_time ? formatToChinaTime(org.join_time) : "未知时间",
          status: "active", // 该接口无状态字段，默认 active
          avatar: undefined, // 该接口无头像字段
        }));
        setOrganizations(orgs);
      } catch (err) {
        console.error("获取个人组织失败:", err);
        setOrganizations([]);
      } finally {
        setOrganizationsLoading(false);
      }
    };

    fetchPersonalOrganizations();
  }, [userId]);

  return (
    <div className={styles.contentSection}>
      <div className={styles.sectionHeader}>
        <h2>我的组织</h2>
        <button className={styles.addButton} onClick={() => navigate("/organizations/list")}>
          <FaPlus />
          浏览组织
        </button>
      </div>

      {organizationsLoading ? (
        <div style={{ padding: "24px", textAlign: "center" }}>
          <Loading size="small" text="正在加载组织..." />
        </div>
      ) : organizations.length === 0 ? (
        <div className={styles.emptyState}>
          <FaUsers className={styles.emptyIcon} />
          <h3>暂无组织数据</h3>
          <p>您还没有加入任何组织，可以点击上方按钮去浏览和加入组织</p>
        </div>
      ) : (
        <div className={styles.organizationsGrid}>
          {organizations.map((org) => (
            <div key={org.id} className={styles.orgCard} onClick={() => navigate(`/organization/detail/${encodeId(org.id)}`)}>
              <div className={styles.orgHeader}>
                <div className={styles.orgAvatar}>
                  {org.avatar ? (
                    <img src={org.avatar} alt={org.name} />
                  ) : (
                    <div className={styles.orgInitials}>{org.name.charAt(0)}</div>
                  )}
                </div>
                <div className={styles.orgInfo}>
                  <h3>{org.name}</h3>
                  <p className={styles.orgType}>{org.type}</p>
                </div>
              </div>
              <p className={styles.orgDescription}>{org.description}</p>
              <div className={styles.orgStats}>
                <span>成员: {org.memberCount}</span>
                <span>角色: {org.role}</span>
              </div>
              <div className={styles.orgTime}>加入于 {org.createTime}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrganizationsTab;
