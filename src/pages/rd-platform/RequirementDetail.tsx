import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaEdit, FaTrash, FaArrowLeft } from "react-icons/fa";
import styles from "./DetailPage.module.css";
import Loading from "../../components/loading/Loading";
import { confirm } from "../../components/confirm/Confirm";
import message from "../../components/message/Message";
import { RdPlatformMockService } from "../../services/rdPlatformMockService";
import type { Requirement } from "../../types/rdPlatform";

const statusText: Record<string, string> = {
  new: "新建",
  developing: "开发中",
  testing: "测试中",
  done: "已完成",
  closed: "已关闭",
};
const priorityText: Record<string, string> = { high: "高", medium: "中", low: "低" };

const RequirementDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [req, setReq] = useState<Requirement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    RdPlatformMockService.getRequirementById(id).then((r) => {
      setReq(r);
      setLoading(false);
    });
  }, [id]);

  const handleDelete = async () => {
    if (!req) return;
    await confirm({
      title: "确认删除",
      content: (
        <div>
          确定要删除需求 "<strong>{req.title}</strong>" 吗？
        </div>
      ),
      confirmText: "删除",
      cancelText: "取消",
      onConfirm: async () => {
        await RdPlatformMockService.deleteRequirement(req.id);
        message.success("需求已删除");
        navigate("/rd/requirements");
      },
    });
  };

  if (loading) return <Loading />;
  if (!req) return <div className={styles.empty}>需求不存在</div>;

  return (
    <div className={styles.detailPage}>
      <div className={styles.detailHeader}>
        <button className={styles.backBtn} onClick={() => navigate("/rd/requirements")}>
          <FaArrowLeft /> 返回列表
        </button>
        <div className={styles.headerActions}>
          <button className={styles.editBtn} onClick={() => navigate(`/rd/requirements/${req.id}/edit`)}>
            <FaEdit /> 编辑
          </button>
          <button className={styles.deleteBtn} onClick={handleDelete}>
            <FaTrash /> 删除
          </button>
        </div>
      </div>

      <div className={styles.detailCard}>
        <h1 className={styles.detailTitle}>{req.title}</h1>
        <div className={styles.metaRow}>
          <span className={`${styles.badge} ${styles[`priority_${req.priority}`]}`}>{priorityText[req.priority]}</span>
          <span className={`${styles.badge} ${styles[`status_${req.status}`]}`}>{statusText[req.status]}</span>
        </div>

        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>负责人</span>
            <span className={styles.infoValue}>{req.assignee || "-"}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>创建人</span>
            <span className={styles.infoValue}>{req.creator}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>迭代</span>
            <span className={styles.infoValue}>{req.iteration || "-"}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>分类</span>
            <span className={styles.infoValue}>{req.category || "-"}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>来源</span>
            <span className={styles.infoValue}>{req.source || "-"}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>创建时间</span>
            <span className={styles.infoValue}>{new Date(req.createdAt).toLocaleString("zh-CN")}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>更新时间</span>
            <span className={styles.infoValue}>{new Date(req.updatedAt).toLocaleString("zh-CN")}</span>
          </div>
        </div>

        <div className={styles.detailSection}>
          <h3 className={styles.sectionTitle}>描述</h3>
          <div className={styles.detailContent}>{req.description || "暂无描述"}</div>
        </div>
      </div>
    </div>
  );
};

export default RequirementDetail;
