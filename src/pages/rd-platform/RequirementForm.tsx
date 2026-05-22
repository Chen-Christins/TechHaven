import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaSave, FaArrowLeft } from "react-icons/fa";
import styles from "./FormPage.module.css";
import Input from "../../components/input/Input";
import CustomSelect from "../../components/customSelect/CustomSelect";
import Loading from "../../components/loading/Loading";
import message from "../../components/message/Message";
import { useAuth } from "../../contexts/AuthContext";
import { RdPlatformMockService } from "../../services/rdPlatformMockService";
import type { SelectOption } from "../../types";
import type { Requirement } from "../../types/rdPlatform";

const priorityOptions: SelectOption[] = [
  { id: "high", name: "高", color: "#ef4444" },
  { id: "medium", name: "中", color: "#f59e0b" },
  { id: "low", name: "低", color: "#22c55e" },
];

const statusOptions: SelectOption[] = [
  { id: "new", name: "新建", color: "#3b82f6" },
  { id: "developing", name: "开发中", color: "#eab308" },
  { id: "testing", name: "测试中", color: "#a855f7" },
  { id: "done", name: "已完成", color: "#22c55e" },
  { id: "closed", name: "已关闭", color: "#6b7280" },
];

const RequirementForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<SelectOption | null>(priorityOptions[1]); // default medium
  const [status, setStatus] = useState<SelectOption | null>(statusOptions[0]); // default new
  const [assignee, setAssignee] = useState("");
  const [iteration, setIteration] = useState("");
  const [category, setCategory] = useState("");
  const [source, setSource] = useState("");

  useEffect(() => {
    if (isEdit && id) {
      setLoading(true);
      RdPlatformMockService.getRequirementById(id).then((r) => {
        if (!r) {
          message.error("需求不存在");
          navigate("/rd/requirements");
          return;
        }
        setTitle(r.title);
        setDescription(r.description);
        setPriority(priorityOptions.find((o) => o.id === r.priority) || null);
        setStatus(statusOptions.find((o) => o.id === r.status) || null);
        setAssignee(r.assignee);
        setIteration(r.iteration);
        setCategory(r.category);
        setSource(r.source);
        setLoading(false);
      });
    }
  }, [id]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      message.warn("请输入需求标题");
      return;
    }
    if (!priority) {
      message.warn("请选择优先级");
      return;
    }

    const baseData = {
      title: title.trim(),
      description,
      priority: priority.id as Requirement["priority"],
      assignee,
      iteration,
      category,
      source,
    };

    if (isEdit && id) {
      await RdPlatformMockService.updateRequirement(id, { ...baseData, status: (status?.id as Requirement["status"]) || "new" });
      message.success("需求更新成功");
      navigate(`/rd/requirements/${id}`);
    } else {
      const item = await RdPlatformMockService.createRequirement({
        ...baseData,
        status: "new",
        creator: user?.name || user?.account || "未知",
      });
      message.success("需求创建成功");
      navigate(`/rd/requirements/${item.id}`);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className={styles.formPage}>
      <div className={styles.formHeader}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <FaArrowLeft /> 返回
        </button>
        <h1 className={styles.formTitle}>{isEdit ? "编辑需求" : "新建需求"}</h1>
      </div>

      <div className={styles.formBody}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            标题 <span className={styles.required}>*</span>
          </label>
          <Input placeholder="请输入需求标题" value={title} onChange={setTitle} size="large" />
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              优先级 <span className={styles.required}>*</span>
            </label>
            <CustomSelect name="优先级" options={priorityOptions} value={priority} onChange={(o) => setPriority(o)} />
          </div>
          {isEdit && (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>状态</label>
              <CustomSelect name="状态" options={statusOptions} value={status} onChange={(o) => setStatus(o)} />
            </div>
          )}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>负责人</label>
            <Input placeholder="请输入负责人" value={assignee} onChange={setAssignee} />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>迭代</label>
            <Input placeholder="如 Sprint 12" value={iteration} onChange={setIteration} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>分类</label>
            <Input placeholder="如 前端、后端" value={category} onChange={setCategory} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>来源</label>
            <Input placeholder="如 产品需求、用户反馈" value={source} onChange={setSource} />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>描述</label>
          <textarea
            className={styles.textarea}
            placeholder="请输入需求详细描述..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={8}
          />
        </div>

        <div className={styles.formActions}>
          <button className={styles.cancelBtn} onClick={() => navigate(-1)}>
            取消
          </button>
          <button className={styles.submitBtn} onClick={handleSubmit}>
            <FaSave /> {isEdit ? "保存修改" : "创建需求"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequirementForm;
