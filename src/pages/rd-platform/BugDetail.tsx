import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaEdit, FaTrash, FaArrowLeft } from "react-icons/fa";
import styles from "./DetailPage.module.css";
import Loading from "../../components/loading/Loading";
import { confirm } from "../../components/confirm/Confirm";
import message from "../../components/message/Message";
import { RdPlatformMockService } from "../../services/rdPlatformMockService";
import type { Bug } from "../../types/rdPlatform";

const statusText: Record<string, string> = {
  new: "新建",
  accepted: "已受理",
  processing: "处理中",
  verified: "已验证",
  closed: "已关闭",
  reopened: "已重开",
};
const severityText: Record<string, string> = {
  fatal: "致命",
  serious: "严重",
  normal: "一般",
  minor: "轻微",
};
const priorityText: Record<string, string> = {
  urgent: "紧急",
  high: "高",
  medium: "中",
  low: "低",
};

const BugDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [bug, setBug] = useState<Bug | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    RdPlatformMockService.getBugById(id).then((b) => {
      setBug(b);
      setLoading(false);
    });
  }, [id]);

  const handleDelete = async () => {
    if (!bug) return;
    await confirm({
      title: "确认删除",
      content: (
        <div>
          确定要删除缺陷 "<strong>{bug.title}</strong>" 吗？
        </div>
      ),
      confirmText: "删除",
      cancelText: "取消",
      onConfirm: async () => {
        await RdPlatformMockService.deleteBug(bug.id);
        message.success("缺陷已删除");
        navigate("/rd/bugs");
      },
    });
  };

  if (loading) return <Loading />;
  if (!bug) return <div className={styles.empty}>缺陷不存在</div>;

  return (
    <div className={styles.detailPage}>
      <div className={styles.detailHeader}>
        <button className={styles.backBtn} onClick={() => navigate("/rd/bugs")}>
          <FaArrowLeft /> 返回列表
        </button>
        <div className={styles.headerActions}>
          <button className={styles.editBtn} onClick={() => navigate(`/rd/bugs/${bug.id}/edit`)}>
            <FaEdit /> 编辑
          </button>
          <button className={styles.deleteBtn} onClick={handleDelete}>
            <FaTrash /> 删除
          </button>
        </div>
      </div>

      <div className={styles.detailCard}>
        <h1 className={styles.detailTitle}>{bug.title}</h1>
        <div className={styles.metaRow}>
          <span className={`${styles.badge} ${styles[`severity_${bug.severity}`]}`}>{severityText[bug.severity]}</span>
          <span className={`${styles.badge} ${styles[`priority_${bug.priority}`]}`}>{priorityText[bug.priority]}</span>
          <span className={`${styles.badge} ${styles[`status_${bug.status}`]}`}>{statusText[bug.status]}</span>
        </div>

        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>负责人</span>
            <span className={styles.infoValue}>{bug.assignee || "-"}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>创建人</span>
            <span className={styles.infoValue}>{bug.creator}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>所属模块</span>
            <span className={styles.infoValue}>{bug.module || "-"}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>关联需求</span>
            <span className={styles.infoValue}>{bug.relatedRequirementId || "-"}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>运行环境</span>
            <span className={styles.infoValue}>{bug.environment || "-"}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>创建时间</span>
            <span className={styles.infoValue}>{new Date(bug.createdAt).toLocaleString("zh-CN")}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>更新时间</span>
            <span className={styles.infoValue}>{new Date(bug.updatedAt).toLocaleString("zh-CN")}</span>
          </div>
        </div>

        <div className={styles.detailSection}>
          <h3 className={styles.sectionTitle}>描述</h3>
          <div className={styles.detailContent}>{bug.description || "暂无描述"}</div>
        </div>

        {bug.stepsToReproduce && (
          <div className={styles.detailSection}>
            <h3 className={styles.sectionTitle}>复现步骤</h3>
            <div className={styles.detailContent}>{bug.stepsToReproduce}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BugDetail;
