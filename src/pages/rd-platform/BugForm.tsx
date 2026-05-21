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
import type { Bug } from "../../types/rdPlatform";
import type { SelectOption } from "../../types";

const severityOptions: SelectOption[] = [
  { id: "fatal", name: "致命", color: "#dc2626" },
  { id: "serious", name: "严重", color: "#ea580c" },
  { id: "normal", name: "一般", color: "#f59e0b" },
  { id: "minor", name: "轻微", color: "#22c55e" },
];

const priorityOptions: SelectOption[] = [
  { id: "urgent", name: "紧急", color: "#dc2626" },
  { id: "high", name: "高", color: "#ef4444" },
  { id: "medium", name: "中", color: "#f59e0b" },
  { id: "low", name: "低", color: "#22c55e" },
];

const statusOptions: SelectOption[] = [
  { id: "new", name: "新建", color: "#3b82f6" },
  { id: "accepted", name: "已受理", color: "#eab308" },
  { id: "processing", name: "处理中", color: "#a855f7" },
  { id: "verified", name: "已验证", color: "#22c55e" },
  { id: "closed", name: "已关闭", color: "#6b7280" },
  { id: "reopened", name: "已重开", color: "#ef4444" },
];

const BugForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<SelectOption | null>(severityOptions[2]); // default normal
  const [priority, setPriority] = useState<SelectOption | null>(priorityOptions[1]); // default high
  const [status, setStatus] = useState<SelectOption | null>(statusOptions[0]);
  const [assignee, setAssignee] = useState("");
  const [relatedRequirementId, setRelatedRequirementId] = useState("");
  const [module, setModule] = useState("");
  const [stepsToReproduce, setStepsToReproduce] = useState("");
  const [environment, setEnvironment] = useState("");

  useEffect(() => {
    if (isEdit && id) {
      setLoading(true);
      RdPlatformMockService.getBugById(id).then((b) => {
        if (!b) {
          message.error("缺陷不存在");
          navigate("/rd/bugs");
          return;
        }
        setTitle(b.title);
        setDescription(b.description);
        setSeverity(severityOptions.find((o) => o.id === b.severity) || null);
        setPriority(priorityOptions.find((o) => o.id === b.priority) || null);
        setStatus(statusOptions.find((o) => o.id === b.status) || null);
        setAssignee(b.assignee);
        setRelatedRequirementId(b.relatedRequirementId);
        setModule(b.module);
        setStepsToReproduce(b.stepsToReproduce);
        setEnvironment(b.environment);
        setLoading(false);
      });
    }
  }, [id]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      message.warn("请输入缺陷标题");
      return;
    }
    if (!severity) {
      message.warn("请选择严重程度");
      return;
    }
    if (!priority) {
      message.warn("请选择优先级");
      return;
    }

    const baseData = {
      title: title.trim(),
      description,
      severity: severity.id as Bug["severity"],
      priority: priority.id as Bug["priority"],
      assignee,
      relatedRequirementId,
      module,
      stepsToReproduce,
      environment,
    };

    if (isEdit && id) {
      await RdPlatformMockService.updateBug(id, { ...baseData, status: (status?.id as Bug["status"]) || "new" });
      message.success("缺陷更新成功");
      navigate(`/rd/bugs/${id}`);
    } else {
      const item = await RdPlatformMockService.createBug({
        ...baseData,
        status: "new",
        creator: user?.name || user?.account || "未知",
      });
      message.success("缺陷提交成功");
      navigate(`/rd/bugs/${item.id}`);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className={styles.formPage}>
      <div className={styles.formHeader}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <FaArrowLeft /> 返回
        </button>
        <h1 className={styles.formTitle}>{isEdit ? "编辑缺陷" : "提交缺陷"}</h1>
      </div>

      <div className={styles.formBody}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            标题 <span className={styles.required}>*</span>
          </label>
          <Input placeholder="请输入缺陷标题" value={title} onChange={setTitle} size="large" />
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              严重程度 <span className={styles.required}>*</span>
            </label>
            <CustomSelect name="严重程度" options={severityOptions} value={severity} onChange={(o) => setSeverity(o)} />
          </div>
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
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>负责人</label>
            <Input placeholder="请输入负责人" value={assignee} onChange={setAssignee} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>关联需求 ID</label>
            <Input placeholder="选填" value={relatedRequirementId} onChange={setRelatedRequirementId} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>所属模块</label>
            <Input placeholder="如 用户模块、支付模块" value={module} onChange={setModule} />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>描述</label>
          <textarea
            className={styles.textarea}
            placeholder="请输入缺陷详细描述..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>复现步骤</label>
          <textarea
            className={styles.textarea}
            placeholder="1. 打开页面&#10;2. 点击按钮&#10;3. 观察结果"
            value={stepsToReproduce}
            onChange={(e) => setStepsToReproduce(e.target.value)}
            rows={4}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>运行环境</label>
          <Input placeholder="如 Chrome 120 / iOS 18 Safari" value={environment} onChange={setEnvironment} />
        </div>

        <div className={styles.formActions}>
          <button className={styles.cancelBtn} onClick={() => navigate(-1)}>
            取消
          </button>
          <button className={styles.submitBtn} onClick={handleSubmit}>
            <FaSave /> {isEdit ? "保存修改" : "提交缺陷"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BugForm;
