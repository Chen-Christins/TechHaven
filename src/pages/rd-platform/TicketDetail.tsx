import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { FaArrowLeft, FaEdit, FaSave, FaTimes, FaClipboardList, FaBug, FaTasks } from "react-icons/fa";
import styles from "./TicketDetail.module.css";
import Loading from "../../components/loading/Loading";
import Input from "../../components/input/Input";
import CustomSelect from "../../components/customSelect/CustomSelect";
import message from "../../components/message/Message";
import { useRdOrg } from "../../contexts/RdOrgContext";
import { RdPlatformService as RdAPI } from "../../services/rdPlatformService";
import { decodeId } from "../../utils/hashId";
import type { Requirement, Bug, Task, SelectOption } from "../../types/rdPlatform";

// ---- Option lists ----

const reqStatusOptions: SelectOption[] = [
  { id: "new", name: "新建", color: "#3b82f6" },
  { id: "developing", name: "开发中", color: "#eab308" },
  { id: "testing", name: "测试中", color: "#a855f7" },
  { id: "done", name: "已完成", color: "#22c55e" },
  { id: "closed", name: "已关闭", color: "#6b7280" },
];

const bugStatusOptions: SelectOption[] = [
  { id: "new", name: "新建", color: "#3b82f6" },
  { id: "processing", name: "处理中", color: "#a855f7" },
  { id: "verified", name: "已验证", color: "#22c55e" },
  { id: "closed", name: "已关闭", color: "#6b7280" },
  { id: "reopened", name: "已重开", color: "#ef4444" },
];

const taskStatusOptions: SelectOption[] = [
  { id: "todo", name: "待办", color: "#6b7280" },
  { id: "doing", name: "进行中", color: "#3b82f6" },
  { id: "done", name: "已完成", color: "#22c55e" },
  { id: "closed", name: "已关闭", color: "#6b7280" },
];

const priorityOptions: SelectOption[] = [
  { id: "high", name: "高", color: "#ef4444" },
  { id: "medium", name: "中", color: "#f59e0b" },
  { id: "low", name: "低", color: "#22c55e" },
];

const bugPriorityOptions: SelectOption[] = [
  { id: "urgent", name: "紧急", color: "#dc2626" },
  ...priorityOptions,
];

const severityOptions: SelectOption[] = [
  { id: "fatal", name: "致命", color: "#dc2626" },
  { id: "serious", name: "严重", color: "#ea580c" },
  { id: "normal", name: "一般", color: "#f59e0b" },
  { id: "minor", name: "轻微", color: "#22c55e" },
];

const reqStatusText: Record<string, string> = { new: "新建", developing: "开发中", testing: "测试中", done: "已完成", closed: "已关闭" };
const bugStatusText: Record<string, string> = { new: "新建", processing: "处理中", verified: "已验证", closed: "已关闭", reopened: "已重开" };
const taskStatusText: Record<string, string> = { todo: "待办", doing: "进行中", done: "已完成", closed: "已关闭" };
const priorityText: Record<string, string> = { urgent: "紧急", high: "高", medium: "中", low: "低" };
const severityText: Record<string, string> = { fatal: "致命", serious: "严重", normal: "一般", minor: "轻微" };

type EntityType = "requirement" | "bug" | "task";

function getTypeFromPath(pathname: string): EntityType {
  if (pathname.includes("/requirements/")) return "requirement";
  if (pathname.includes("/bugs/")) return "bug";
  return "task";
}

function getTypeLabel(type: EntityType): string {
  if (type === "requirement") return "需求";
  if (type === "bug") return "缺陷";
  return "任务";
}

function getTypeIcon(type: EntityType) {
  if (type === "requirement") return <FaClipboardList />;
  if (type === "bug") return <FaBug />;
  return <FaTasks />;
}

function getListPath(type: EntityType): string {
  if (type === "requirement") return "/rd/requirements";
  if (type === "bug") return "/rd/bugs";
  return "/rd/tasks";
}

type DetailItem = Requirement | Bug | Task;

const TicketDetail: React.FC = () => {
  const { id: encodedId } = useParams<{ id: string }>();
  const id = encodedId ? String(decodeId(encodedId) ?? "") : "";
  const navigate = useNavigate();
  const location = useLocation();
  const { orgNameMap } = useRdOrg();

  const entityType = getTypeFromPath(location.pathname);

  const [item, setItem] = useState<DetailItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const fetcher =
      entityType === "requirement"
        ? RdAPI.getRequirementById(id)
        : entityType === "bug"
          ? RdAPI.getBugById(id)
          : RdAPI.getTaskById(id);
    fetcher
      .then((data) => {
        setItem(data as DetailItem);
        if (data) initForm(data);
      })
      .catch(() => setItem(null))
      .finally(() => setLoading(false));
  }, [id, entityType]);

  const initForm = (data: DetailItem) => {
    const f: Record<string, string> = {};
    f.title = (data as any).title || "";
    f.status = (data as any).status || "";
    f.priority = (data as any).priority || "";
    f.assignee = (data as any).assignee || "";
    f.description = (data as any).description || "";

    if (entityType === "requirement") {
      const r = data as Requirement;
      f.iteration = r.iteration || "";
      f.category = r.category || "";
      f.source = r.source || "";
    } else if (entityType === "bug") {
      const b = data as Bug;
      f.severity = b.severity || "normal";
      f.module = b.module || "";
      f.environment = b.environment || "";
      f.stepsToReproduce = b.stepsToReproduce || "";
    } else {
      const t = data as Task;
      f.deadline = t.deadline || "";
      f.estimatedHours = String(t.estimatedHours || 0);
    }
    setForm(f);
  };

  const handleSave = async () => {
    if (!item || !id) return;
    setSaving(true);
    try {
      if (entityType === "requirement") {
        await RdAPI.updateRequirement(id, {
          title: form.title,
          status: form.status as Requirement["status"],
          priority: form.priority as Requirement["priority"],
          assignee: form.assignee,
          iteration: form.iteration,
          category: form.category,
          source: form.source,
          description: form.description,
        });
      } else if (entityType === "bug") {
        await RdAPI.updateBug(id, {
          title: form.title,
          status: form.status as Bug["status"],
          severity: form.severity as Bug["severity"],
          priority: form.priority as Bug["priority"],
          assignee: form.assignee,
          module: form.module,
          environment: form.environment,
          stepsToReproduce: form.stepsToReproduce,
          description: form.description,
        });
      } else {
        await RdAPI.updateTask(id, {
          title: form.title,
          status: form.status as Task["status"],
          priority: form.priority as Task["priority"],
          assignee: form.assignee,
          deadline: form.deadline,
          estimatedHours: Number(form.estimatedHours) || 0,
          description: form.description,
        });
      }
      const data = await (entityType === "requirement"
        ? RdAPI.getRequirementById(id)
        : entityType === "bug"
          ? RdAPI.getBugById(id)
          : RdAPI.getTaskById(id));
      setItem(data as DetailItem);
      setEditing(false);
      message.success("保存成功");
    } catch (err: any) {
      message.error(err?.message || "保存失败");
    } finally {
      setSaving(false);
    }
  };

  // ---- render helpers ----

  const fieldLabel = (label: string, required?: boolean) => (
    <label className={styles.formLabel}>
      {label} {required && <span className={styles.formLabelRequired}>*</span>}
    </label>
  );

  const metaField = (label: string, value: React.ReactNode) => (
    <div className={styles.metaCard}>
      <div className={styles.metaCardLabel}>{label}</div>
      <div className={styles.metaCardValue}>{value || "-"}</div>
    </div>
  );

  // ---- loading ----

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingWrap}><Loading /></div>
      </div>
    );
  }

  // ---- not found ----

  if (!item) {
    return (
      <div className={styles.container}>
        <div className={styles.detailCard}>
          <div className={styles.notFound}>
            <div className={styles.notFoundIcon}>404</div>
            <p className={styles.notFoundText}>{getTypeLabel(entityType)}不存在或已被删除</p>
            <button className={styles.btnPrimary} onClick={() => navigate(getListPath(entityType))}>
              返回列表
            </button>
          </div>
        </div>
      </div>
    );
  }

  const typeLabel = getTypeLabel(entityType);

  return (
    <div className={styles.container}>
      <div className={styles.detailCard}>

        {/* ======== Card Header ======== */}
        <div className={styles.cardHeader}>
          <button className={styles.backBtn} onClick={() => navigate(getListPath(entityType))}>
            <FaArrowLeft /> 返回{typeLabel}列表
          </button>

          <div className={styles.headerContent}>
            <div className={styles.titleGroup}>
              <div className={styles.titleRow}>
                <span className={styles.typeBadge}>{getTypeIcon(entityType)}{typeLabel}</span>
                {editing && <span style={{ fontSize: "12px", color: "var(--warning)", fontWeight: 500 }}>编辑中</span>}
              </div>
              <h1 className={styles.pageTitle}>{item.title}</h1>
            </div>

            <div className={styles.headerRight}>
              {!editing ? (
                <button className={styles.btnPrimary} onClick={() => setEditing(true)}>
                  <FaEdit /> 编辑
                </button>
              ) : (
                <div className={styles.formActions} style={{ marginTop: 0 }}>
                  <button className={styles.btnSecondary} onClick={() => { setEditing(false); initForm(item); }}>
                    <FaTimes /> 取消
                  </button>
                  <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>
                    <FaSave /> {saving ? "保存中..." : "保存"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ======== Edit Mode ======== */}
        {editing ? (
          <div className={styles.editForm}>
            <div>
              {fieldLabel("标题", true)}
              <Input value={form.title || ""} onChange={(v) => setForm((p) => ({ ...p, title: v }))} size="large" />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formField}>
                {fieldLabel("状态")}
                <CustomSelect
                  name="状态"
                  options={entityType === "requirement" ? reqStatusOptions : entityType === "bug" ? bugStatusOptions : taskStatusOptions}
                  value={(entityType === "requirement" ? reqStatusOptions : entityType === "bug" ? bugStatusOptions : taskStatusOptions).find((o) => o.id === form.status) || null}
                  onChange={(o) => setForm((p) => ({ ...p, status: (o?.id as string) || "" }))}
                  hideBadge
                />
              </div>

              {entityType === "bug" && (
                <div className={styles.formField}>
                  {fieldLabel("严重程度")}
                  <CustomSelect name="严重程度" options={severityOptions} value={severityOptions.find((o) => o.id === form.severity) || null} onChange={(o) => setForm((p) => ({ ...p, severity: (o?.id as string) || "normal" }))} hideBadge />
                </div>
              )}

              <div className={styles.formField}>
                {fieldLabel("优先级")}
                <CustomSelect name="优先级" options={entityType === "bug" ? bugPriorityOptions : priorityOptions} value={(entityType === "bug" ? bugPriorityOptions : priorityOptions).find((o) => o.id === form.priority) || null} onChange={(o) => setForm((p) => ({ ...p, priority: (o?.id as string) || "" }))} hideBadge />
              </div>

              <div className={styles.formField}>
                {fieldLabel("负责人")}
                <Input value={form.assignee || ""} onChange={(v) => setForm((p) => ({ ...p, assignee: v }))} size="large" />
              </div>
            </div>

            {entityType === "requirement" && (
              <div className={styles.formRow}>
                <div className={styles.formField}>{fieldLabel("迭代")}<Input value={form.iteration || ""} onChange={(v) => setForm((p) => ({ ...p, iteration: v }))} size="large" /></div>
                <div className={styles.formField}>{fieldLabel("分类")}<Input value={form.category || ""} onChange={(v) => setForm((p) => ({ ...p, category: v }))} size="large" /></div>
                <div className={styles.formField}>{fieldLabel("来源")}<Input value={form.source || ""} onChange={(v) => setForm((p) => ({ ...p, source: v }))} size="large" /></div>
              </div>
            )}
            {entityType === "bug" && (
              <div className={styles.formRow}>
                <div className={styles.formField}>{fieldLabel("模块")}<Input value={form.module || ""} onChange={(v) => setForm((p) => ({ ...p, module: v }))} size="large" /></div>
                <div className={styles.formField}>{fieldLabel("运行环境")}<Input value={form.environment || ""} onChange={(v) => setForm((p) => ({ ...p, environment: v }))} size="large" /></div>
              </div>
            )}
            {entityType === "task" && (
              <div className={styles.formRow}>
                <div className={styles.formField}>{fieldLabel("截止日期")}<Input placeholder="YYYY-MM-DD" value={form.deadline || ""} onChange={(v) => setForm((p) => ({ ...p, deadline: v }))} size="large" /></div>
                <div className={styles.formField}>{fieldLabel("预估工时 (h)")}<Input value={form.estimatedHours || ""} onChange={(v) => setForm((p) => ({ ...p, estimatedHours: v }))} size="large" /></div>
              </div>
            )}

            <div>
              {fieldLabel("描述")}
              <textarea className={styles.formTextarea} value={form.description || ""} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={6} />
            </div>

            {entityType === "bug" && (
              <div>
                {fieldLabel("复现步骤")}
                <textarea className={styles.formTextarea} value={form.stepsToReproduce || ""} onChange={(e) => setForm((p) => ({ ...p, stepsToReproduce: e.target.value }))} rows={4} />
              </div>
            )}
          </div>
        ) : (
          /* ======== View Mode ======== */
          <>
            {/* Status / Priority / Severity badges */}
            <div className={styles.badgeStrip}>
              {entityType === "requirement" && (
                <>
                  <span className={`${styles.badge} ${styles[`priority_${(item as Requirement).priority}`]}`}>{priorityText[(item as Requirement).priority]}</span>
                  <span className={`${styles.badge} ${styles[`status_${(item as Requirement).status}`]}`}>{reqStatusText[(item as Requirement).status]}</span>
                </>
              )}
              {entityType === "bug" && (
                <>
                  <span className={`${styles.badge} ${styles[`severity_${(item as Bug).severity}`]}`}>{severityText[(item as Bug).severity]}</span>
                  <span className={`${styles.badge} ${styles[`priority_${(item as Bug).priority}`]}`}>{priorityText[(item as Bug).priority]}</span>
                  <span className={`${styles.badge} ${styles[`status_${(item as Bug).status}`]}`}>{bugStatusText[(item as Bug).status]}</span>
                </>
              )}
              {entityType === "task" && (
                <>
                  <span className={`${styles.badge} ${styles[`priority_${(item as Task).priority}`]}`}>{priorityText[(item as Task).priority]}</span>
                  <span className={`${styles.badge} ${styles[`status_${(item as Task).status}`]}`}>{taskStatusText[(item as Task).status]}</span>
                </>
              )}
            </div>

            {/* Meta info cards */}
            <div className={styles.metaGrid}>
              {metaField("负责人", item.assignee)}
              {metaField("创建人", (item as any).creator)}
              {metaField("所属组织", orgNameMap[(item as any).organizationId] || (item as any).organizationId)}

              {entityType === "requirement" && (
                <>
                  {metaField("迭代", (item as Requirement).iteration)}
                  {metaField("分类", (item as Requirement).category)}
                  {metaField("来源", (item as Requirement).source)}
                </>
              )}
              {entityType === "bug" && (
                <>
                  {metaField("所属模块", (item as Bug).module)}
                  {metaField("关联需求", (item as Bug).relatedRequirementId)}
                  {metaField("运行环境", (item as Bug).environment)}
                </>
              )}
              {entityType === "task" && (
                <>
                  {metaField("关联需求", (item as Task).requirementId)}
                  {metaField("截止日期", (item as Task).deadline ? new Date((item as Task).deadline).toLocaleDateString("zh-CN") : "-")}
                  {metaField("预估工时", `${(item as Task).estimatedHours}h`)}
                </>
              )}

              {metaField("创建时间", item.createdAt ? new Date(item.createdAt).toLocaleString("zh-CN") : "-")}
              {metaField("更新时间", item.updatedAt ? new Date(item.updatedAt).toLocaleString("zh-CN") : "-")}
            </div>

            {/* Description */}
            <div className={styles.sectionBlock}>
              <div className={styles.sectionTitle}>描述</div>
              <div className={styles.sectionBody}>{item.description || "暂无描述"}</div>
            </div>

            {/* Steps to reproduce (bug only) */}
            {entityType === "bug" && (item as Bug).stepsToReproduce && (
              <div className={styles.sectionBlock}>
                <div className={styles.sectionTitle}>复现步骤</div>
                <div className={styles.sectionBody}>{(item as Bug).stepsToReproduce}</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TicketDetail;
