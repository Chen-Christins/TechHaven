import React, { useState } from "react";
import { FaBuilding, FaTimes } from "react-icons/fa";
import styles from "./ApplyCreateOrg.module.css";
import OrganizationService from "@/services/organizationService";
import message from "@/components/message/Message";

interface ApplyCreateOrgProps {
  visible: boolean;
  onClose: () => void;
}

const ApplyCreateOrg: React.FC<ApplyCreateOrgProps> = ({ visible, onClose }) => {
  const [formData, setFormData] = useState({ name: "", type: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.type.trim()) {
      message.error("请填写组织名称和类型");
      return;
    }
    setSubmitting(true);
    try {
      await OrganizationService.applyCreateOrganization({
        name: formData.name.trim(),
        type: formData.type.trim(),
        description: formData.description.trim(),
      });
      message.success("申请已提交，请等待管理员审核");
      setFormData({ name: "", type: "", description: "" });
      onClose();
    } catch (e: any) {
      message.error(e.message || "提交失败，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setFormData({ name: "", type: "", description: "" });
      onClose();
    }
  };

  if (!visible) return null;

  return (
    <>
      {/* 遮罩层 */}
      <div className={styles.overlay} onClick={handleClose} />

      {/* 右侧滑出面板 */}
      <div className={`${styles.panel} ${visible ? styles.panelOpen : ""}`}>
        <div className={styles.panelHeader}>
          <h3 className={styles.panelTitle}>
            <FaBuilding /> 申请创建组织
          </h3>
          <button className={styles.closeBtn} onClick={handleClose}>
            <FaTimes />
          </button>
        </div>

        <div className={styles.panelBody}>
          <p className={styles.panelHint}>提交申请后，管理员将审核您的组织创建请求。审核通过后，您将自动成为该组织的管理员。</p>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>组织名称 *</label>
            <input
              className={styles.formInput}
              placeholder="请输入组织名称"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>组织类型 *</label>
            <input
              className={styles.formInput}
              placeholder="如：研发团队、设计团队、运营团队"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>组织描述</label>
            <textarea
              className={styles.formTextarea}
              placeholder="请简要描述组织的目标和方向..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />
          </div>
        </div>

        <div className={styles.panelFooter}>
          <button className={styles.btnCancel} onClick={handleClose} disabled={submitting}>
            取消
          </button>
          <button className={styles.btnSubmit} onClick={handleSubmit} disabled={submitting}>
            {submitting ? "提交中..." : "提交申请"}
          </button>
        </div>
      </div>
    </>
  );
};

export default ApplyCreateOrg;
