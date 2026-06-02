import React, { useState, useEffect } from "react";
import { FaBuilding, FaTimes, FaCheck } from "react-icons/fa";
import styles from "./OrgSelector.module.css";
import type { RdOrgInfo } from "../../types/rdPlatform";

interface OrgSelectorProps {
  orgs: RdOrgInfo[];
  selectedOrgId: string;
  onChange: (orgId: string) => void;
  collapsed: boolean;
}

const OrgSelector: React.FC<OrgSelectorProps> = ({ orgs, selectedOrgId, onChange, collapsed }) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (orgs.length <= 1) return null;

  const currentOrg = orgs.find((o) => o.orgId === selectedOrgId);
  const displayName = currentOrg ? currentOrg.orgName : "全部组织";

  const options = [{ orgId: "", orgName: "全部组织", role: 0 }, ...orgs];

  const handleSelect = (orgId: string) => {
    onChange(orgId);
    setOpen(false);
  };

  return (
    <div className={`${styles.container} ${collapsed ? styles.collapsed : ""}`}>
      <button className={styles.trigger} onClick={() => setOpen(true)} title={collapsed ? displayName : undefined}>
        <FaBuilding className={styles.icon} />
        {!collapsed && <span className={styles.label}>{displayName}</span>}
      </button>

      {/* 遮罩层 */}
      <div className={`${styles.overlay} ${open ? styles.overlayVisible : ""}`} onClick={() => setOpen(false)} />

      {/* 右侧滑出面板 */}
      <div className={`${styles.panel} ${open ? styles.panelOpen : ""}`}>
        <div className={styles.panelHeader}>
          <h3 className={styles.panelTitle}>选择组织</h3>
          <button className={styles.closeBtn} onClick={() => setOpen(false)}>
            <FaTimes />
          </button>
        </div>

        <div className={styles.panelBody}>
          {options.map((org) => {
            const isSelected = org.orgId === selectedOrgId;
            return (
              <div
                key={org.orgId}
                className={`${styles.optionCard} ${isSelected ? styles.optionCardSelected : ""}`}
                onClick={() => handleSelect(org.orgId)}
              >
                <div className={styles.optionCardLeft}>
                  <div className={`${styles.optionAvatar} ${isSelected ? styles.optionAvatarActive : ""}`}>
                    <FaBuilding />
                  </div>
                  <div className={styles.optionInfo}>
                    <span className={styles.optionName}>{org.orgName}</span>
                    {org.orgId === "" && <span className={styles.optionHint}>查看所有组织的数据</span>}
                  </div>
                </div>
                {isSelected && (
                  <span className={styles.checkIcon}>
                    <FaCheck />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OrgSelector;
