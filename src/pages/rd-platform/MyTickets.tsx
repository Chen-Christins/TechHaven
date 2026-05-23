import React, { useState, useEffect, useCallback } from "react";
import {
  FaEye,
  FaEdit,
  FaClipboardList,
  FaBug,
  FaTasks,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import styles from "./ListPage.module.css";
import Input from "../../components/input/Input";
import CustomSelect from "../../components/customSelect/CustomSelect";
import Modal from "../../components/modal/Modal";
import Loading from "../../components/loading/Loading";
import message from "../../components/message/Message";
import { useRdOrg } from "../../contexts/RdOrgContext";
import { RdPlatformService as RdAPI } from "../../services/rdPlatformService";
import type { SelectOption } from "../../types";
import type { Requirement, Bug, Task } from "../../types/rdPlatform";

const reqStatusOptions: SelectOption[] = [
  { id: "", name: "全部状态", color: "#6c757d" },
  { id: "new", name: "新建", color: "#3b82f6" },
  { id: "developing", name: "开发中", color: "#eab308" },
  { id: "testing", name: "测试中", color: "#a855f7" },
  { id: "done", name: "已完成", color: "#22c55e" },
  { id: "closed", name: "已关闭", color: "#6b7280" },
];

const bugStatusOptions: SelectOption[] = [
  { id: "", name: "全部状态", color: "#6c757d" },
  { id: "new", name: "新建", color: "#3b82f6" },
  { id: "processing", name: "处理中", color: "#a855f7" },
  { id: "verified", name: "已验证", color: "#22c55e" },
  { id: "closed", name: "已关闭", color: "#6b7280" },
  { id: "reopened", name: "已重开", color: "#ef4444" },
];

const taskStatusOptions: SelectOption[] = [
  { id: "", name: "全部状态", color: "#6c757d" },
  { id: "todo", name: "待办", color: "#6b7280" },
  { id: "doing", name: "进行中", color: "#3b82f6" },
  { id: "done", name: "已完成", color: "#22c55e" },
  { id: "closed", name: "已关闭", color: "#6b7280" },
];

const reqPriorityOptions: SelectOption[] = [
  { id: "high", name: "高", color: "#ef4444" },
  { id: "medium", name: "中", color: "#f59e0b" },
  { id: "low", name: "低", color: "#22c55e" },
];
const bugSeverityOptions: SelectOption[] = [
  { id: "fatal", name: "致命", color: "#dc2626" },
  { id: "serious", name: "严重", color: "#ea580c" },
  { id: "normal", name: "一般", color: "#f59e0b" },
  { id: "minor", name: "轻微", color: "#22c55e" },
];

const reqStatusText: Record<string, string> = {
  new: "新建",
  developing: "开发中",
  testing: "测试中",
  done: "已完成",
  closed: "已关闭",
};
const bugStatusText: Record<string, string> = {
  new: "新建",
  processing: "处理中",
  verified: "已验证",
  closed: "已关闭",
  reopened: "已重开",
};
const taskStatusText: Record<string, string> = { todo: "待办", doing: "进行中", done: "已完成", closed: "已关闭" };
const priorityText: Record<string, string> = { urgent: "紧急", high: "高", medium: "中", low: "低" };
const severityText: Record<string, string> = { fatal: "致命", serious: "严重", normal: "一般", minor: "轻微" };
const PAGE_SIZE = 10;

type TabKey = "req" | "bug" | "task";
type TabData = Requirement | Bug | Task;

const MyTickets: React.FC = () => {
  const { orgs, orgNameMap } = useRdOrg();
  const [activeTab, setActiveTab] = useState<TabKey>("req");
  const [data, setData] = useState<TabData[]>([]);
  const [total, setTotal] = useState(0);
  const [totalMap, setTotalMap] = useState<Record<TabKey, number>>({ req: 0, bug: 0, task: 0 });
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  // modal
  const [modalVisible, setModalVisible] = useState(false);
  const [detail, setDetail] = useState<{ type: TabKey; item: TabData } | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const typeParam = activeTab === "req" ? "requirement" : activeTab === "bug" ? "bug" : "task";

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await RdAPI.getMyTickets({
      type: typeParam,
      page,
      pageSize: PAGE_SIZE,
      search: search || undefined,
      status: status || undefined,
      orgId: orgId || undefined,
    });
    setData(res.data);
    setTotal(res.total);
    setTotalMap((prev) => ({ ...prev, [activeTab]: res.total }));
    setLoading(false);
  }, [typeParam, page, search, status, orgId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  useEffect(() => {
    (["requirement", "bug", "task"] as const).forEach((t) => {
      RdAPI.getMyTickets({ type: t, pageSize: 1, orgId: orgId || undefined }).then((res) => {
        setTotalMap((prev) => ({ ...prev, [t === "requirement" ? "req" : t === "bug" ? "bug" : "task"]: res.total }));
      });
    });
  }, []); // eslint-disable-line
  useEffect(() => {
    setPage(1);
    setData([]);
  }, [activeTab, search, status, orgId]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      const s = Math.max(1, page - 2),
        e = Math.min(totalPages, s + 4);
      if (s > 1) {
        pages.push(1);
        if (s > 2) pages.push("...");
      }
      for (let i = s; i <= e; i++) pages.push(i);
      if (e < totalPages) {
        if (e < totalPages - 1) pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const openDetail = (type: TabKey, item: TabData) => {
    setDetail({ type, item });
    setEditMode(false);
    setModalVisible(true);
  };
  const openEdit = (type: TabKey, item: TabData) => {
    const f: Record<string, string> = {};
    if (type === "req") {
      const r = item as Requirement;
      f.title = r.title;
      f.status = r.status;
      f.priority = r.priority;
      f.assignee = r.assignee || "";
      f.iteration = r.iteration || "";
      f.category = r.category || "";
      f.source = r.source || "";
      f.description = r.description || "";
    } else if (type === "bug") {
      const b = item as Bug;
      f.title = b.title;
      f.status = b.status;
      f.severity = b.severity;
      f.priority = b.priority;
      f.assignee = b.assignee || "";
      f.module = b.module || "";
      f.environment = b.environment || "";
      f.description = b.description || "";
    } else {
      const t = item as Task;
      f.title = t.title;
      f.status = t.status;
      f.priority = t.priority;
      f.assignee = t.assignee || "";
      f.deadline = t.deadline || "";
      f.estimatedHours = String(t.estimatedHours || 0);
      f.description = t.description || "";
    }
    setEditForm(f);
    setDetail({ type, item });
    setEditMode(true);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!detail) return;
    setSaving(true);
    try {
      if (detail.type === "req") {
        await RdAPI.updateRequirement(detail.item.id, {
          title: editForm.title,
          status: editForm.status as Requirement["status"],
          priority: editForm.priority as Requirement["priority"],
          assignee: editForm.assignee,
          organizationId: (detail.item as Requirement).organizationId,
          iteration: editForm.iteration,
          category: editForm.category,
          source: editForm.source,
          description: editForm.description,
        });
      } else if (detail.type === "bug") {
        await RdAPI.updateBug(detail.item.id, {
          title: editForm.title,
          status: editForm.status as Bug["status"],
          severity: editForm.severity as Bug["severity"],
          priority: editForm.priority as Bug["priority"],
          assignee: editForm.assignee,
          organizationId: (detail.item as Bug).organizationId,
          module: editForm.module,
          environment: editForm.environment,
          description: editForm.description,
        });
      } else {
        await RdAPI.updateTask(detail.item.id, {
          title: editForm.title,
          status: editForm.status as Task["status"],
          priority: editForm.priority as Task["priority"],
          assignee: editForm.assignee,
          organizationId: (detail.item as Task).organizationId,
          deadline: editForm.deadline,
          estimatedHours: Number(editForm.estimatedHours) || 0,
          description: editForm.description,
        });
      }
      message.success("保存成功");
      setEditMode(false);
      setModalVisible(false);
      fetchData();
    } catch (err: any) {
      message.error(err?.message || "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const renderField = (label: string, value: React.ReactNode) => (
    <div style={{ marginBottom: "14px" }}>
      <span style={{ fontSize: "13px", color: "var(--text-tertiary)", display: "block", marginBottom: "2px" }}>{label}</span>
      <span style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: 500 }}>{value || "-"}</span>
    </div>
  );

  const formLabel = (label: string, required?: boolean) => (
    <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>
      {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
    </label>
  );

  const renderEditForm = () => {
    if (!detail) return null;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          {formLabel("标题", true)}
          <Input value={editForm.title || ""} onChange={(v) => setEditForm((p) => ({ ...p, title: v }))} size="large" />
        </div>

        <div style={{ display: "flex", gap: "16px" }}>
          <div style={{ flex: 1 }}>
            {formLabel("状态")}
            <CustomSelect
              name="状态"
              options={(detail.type === "req"
                ? reqStatusOptions
                : detail.type === "bug"
                  ? bugStatusOptions
                  : taskStatusOptions
              ).filter((o) => o.id !== "")}
              value={
                (detail.type === "req" ? reqStatusOptions : detail.type === "bug" ? bugStatusOptions : taskStatusOptions).find(
                  (o) => o.id === editForm.status,
                ) || null
              }
              onChange={(o) => setEditForm((p) => ({ ...p, status: (o?.id as string) || "" }))}
              hideBadge
            />
          </div>

          {detail.type === "req" && (
            <div style={{ flex: 1 }}>
              {formLabel("优先级")}
              <CustomSelect
                name="优先级"
                options={reqPriorityOptions}
                value={reqPriorityOptions.find((o) => o.id === editForm.priority) || null}
                onChange={(o) => setEditForm((p) => ({ ...p, priority: (o?.id as string) || "medium" }))}
                hideBadge
              />
            </div>
          )}
          {detail.type === "bug" && (
            <>
              <div style={{ flex: 1 }}>
                {formLabel("严重程度")}
                <CustomSelect
                  name="严重程度"
                  options={bugSeverityOptions}
                  value={bugSeverityOptions.find((o) => o.id === editForm.severity) || null}
                  onChange={(o) => setEditForm((p) => ({ ...p, severity: (o?.id as string) || "normal" }))}
                  hideBadge
                />
              </div>
              <div style={{ flex: 1 }}>
                {formLabel("优先级")}
                <CustomSelect
                  name="优先级"
                  options={reqPriorityOptions}
                  value={reqPriorityOptions.find((o) => o.id === editForm.priority) || null}
                  onChange={(o) => setEditForm((p) => ({ ...p, priority: (o?.id as string) || "high" }))}
                  hideBadge
                />
              </div>
            </>
          )}
          {detail.type === "task" && (
            <div style={{ flex: 1 }}>
              {formLabel("优先级")}
              <CustomSelect
                name="优先级"
                options={reqPriorityOptions}
                value={reqPriorityOptions.find((o) => o.id === editForm.priority) || null}
                onChange={(o) => setEditForm((p) => ({ ...p, priority: (o?.id as string) || "medium" }))}
                hideBadge
              />
            </div>
          )}

          <div style={{ flex: 1 }}>
            {formLabel("负责人")}
            <Input value={editForm.assignee || ""} onChange={(v) => setEditForm((p) => ({ ...p, assignee: v }))} size="large" />
          </div>
        </div>

        {/* type-specific fields */}
        {detail.type === "req" && (
          <div style={{ display: "flex", gap: "16px" }}>
            <div style={{ flex: 1 }}>
              {formLabel("迭代")}
              <Input value={editForm.iteration || ""} onChange={(v) => setEditForm((p) => ({ ...p, iteration: v }))} size="large" />
            </div>
            <div style={{ flex: 1 }}>
              {formLabel("分类")}
              <Input value={editForm.category || ""} onChange={(v) => setEditForm((p) => ({ ...p, category: v }))} size="large" />
            </div>
            <div style={{ flex: 1 }}>
              {formLabel("来源")}
              <Input value={editForm.source || ""} onChange={(v) => setEditForm((p) => ({ ...p, source: v }))} size="large" />
            </div>
          </div>
        )}
        {detail.type === "bug" && (
          <div style={{ display: "flex", gap: "16px" }}>
            <div style={{ flex: 1 }}>
              {formLabel("模块")}
              <Input value={editForm.module || ""} onChange={(v) => setEditForm((p) => ({ ...p, module: v }))} size="large" />
            </div>
            <div style={{ flex: 1 }}>
              {formLabel("运行环境")}
              <Input
                value={editForm.environment || ""}
                onChange={(v) => setEditForm((p) => ({ ...p, environment: v }))}
                size="large"
              />
            </div>
          </div>
        )}
        {detail.type === "task" && (
          <div style={{ display: "flex", gap: "16px" }}>
            <div style={{ flex: 1 }}>
              {formLabel("截止日期")}
              <Input
                placeholder="YYYY-MM-DD"
                value={editForm.deadline || ""}
                onChange={(v) => setEditForm((p) => ({ ...p, deadline: v }))}
                size="large"
              />
            </div>
            <div style={{ flex: 1 }}>
              {formLabel("预估工时 (h)")}
              <Input
                value={editForm.estimatedHours || ""}
                onChange={(v) => setEditForm((p) => ({ ...p, estimatedHours: v }))}
                size="large"
              />
            </div>
          </div>
        )}

        <div>
          {formLabel("描述")}
          <textarea
            value={editForm.description || ""}
            onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
            rows={5}
            style={{
              width: "100%",
              padding: "10px 14px",
              border: "1px solid var(--border-primary)",
              borderRadius: "8px",
              fontSize: "14px",
              color: "var(--text-primary)",
              backgroundColor: "var(--bg-primary)",
              resize: "vertical",
              fontFamily: "inherit",
              lineHeight: 1.6,
            }}
          />
        </div>
      </div>
    );
  };

  const renderField_ = renderField;

  const tabBtn = (key: TabKey, icon: React.ReactNode, label: string, count: number) => (
    <button
      onClick={() => setActiveTab(key)}
      style={{
        padding: "10px 24px",
        fontSize: "14px",
        fontWeight: activeTab === key ? 600 : 400,
        color: activeTab === key ? "var(--primary)" : "var(--text-secondary)",
        border: "none",
        background: "transparent",
        cursor: "pointer",
        borderBottom: activeTab === key ? "2px solid var(--primary)" : "2px solid transparent",
        marginBottom: "-2px",
      }}
    >
      {icon} {label} ({count})
    </button>
  );

  const renderPriorityBadge = (p: string) => (
    <span className={`${styles.badge} ${styles[`priority_${p}`]}`}>{priorityText[p] || p}</span>
  );
  const renderStatusBadge = (s: string, map: Record<string, string>) => (
    <span className={`${styles.badge} ${styles[`status_${s}`]}`}>{map[s] || s}</span>
  );

  const filterBar = (
    <div className={styles.filterSection}>
      <div className={styles.filterHeader}>
        <h3 className={styles.filterTitle}>筛选条件</h3>
        <button
          className={styles.clearBtn}
          onClick={() => {
            setSearch("");
            setStatus("");
          }}
        >
          清除筛选
        </button>
      </div>
      <div className={styles.filterForm}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>搜索</label>
          <Input placeholder="标题或描述" value={search} onChange={setSearch} allowClear size="large" />
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>状态</label>
          <CustomSelect
            name="状态"
            options={activeTab === "req" ? reqStatusOptions : activeTab === "bug" ? bugStatusOptions : taskStatusOptions}
            value={
              (activeTab === "req" ? reqStatusOptions : activeTab === "bug" ? bugStatusOptions : taskStatusOptions).find(
                (o) => o.id === status,
              ) || null
            }
            onChange={(o) => setStatus((o?.id as string) || "")}
            hideBadge
          />
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>组织</label>
          <CustomSelect
            name="组织"
            options={[
              { id: "", name: "全部组织", color: "#6c757d" },
              ...orgs.map((o) => ({ id: o.orgId, name: o.orgName, color: "#6c757d" })),
            ]}
            value={
              orgs.find((o) => o.orgId === orgId)
                ? { id: orgId, name: orgs.find((o) => o.orgId === orgId)!.orgName, color: "#6c757d" }
                : { id: "", name: "全部组织", color: "#6c757d" }
            }
            onChange={(o) => setOrgId((o?.id as string) || "")}
            hideBadge
          />
        </div>
      </div>
    </div>
  );

  const paginationBar = (
    <div className={styles.pagination}>
      <span className={styles.paginationInfo}>共 {total} 条记录</span>
      <div className={styles.paginationControls}>
        <button disabled={page === 1} onClick={() => setPage(1)}>
          <FaAngleDoubleLeft />
        </button>
        <button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
          <FaChevronLeft />
        </button>
        {getPageNumbers().map((pg, i) =>
          pg === "..." ? (
            <span key={`d-${i}`} className={styles.paginationEllipsis}>
              ...
            </span>
          ) : (
            <button key={pg} className={page === pg ? styles.activePage : ""} onClick={() => setPage(pg as number)}>
              {pg}
            </button>
          ),
        )}
        <button disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
          <FaChevronRight />
        </button>
        <button disabled={page === totalPages} onClick={() => setPage(totalPages)}>
          <FaAngleDoubleRight />
        </button>
      </div>
    </div>
  );

  if (loading && data.length === 0) return <Loading />;

  return (
    <div className={styles.listPage}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>我的工单</h1>
          <p className={styles.pageDescription}>我负责或创建的需求、缺陷与任务</p>
        </div>
      </div>
      <div style={{ display: "flex", gap: "0", marginBottom: "20px", borderBottom: "2px solid var(--border-primary)" }}>
        {tabBtn("req", <FaClipboardList style={{ marginRight: "6px" }} />, "需求", totalMap.req)}
        {tabBtn("bug", <FaBug style={{ marginRight: "6px" }} />, "缺陷", totalMap.bug)}
        {tabBtn("task", <FaTasks style={{ marginRight: "6px" }} />, "任务", totalMap.task)}
      </div>
      {filterBar}

      {/* ---- requirements table ---- */}
      {activeTab === "req" && (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>标题</th>
                  <th>优先级</th>
                  <th>状态</th>
                  <th>负责人</th>
                  <th>创建人</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => {
                  const r = item as Requirement;
                  return (
                    <tr key={r.id}>
                      <td className={styles.titleCell} onClick={() => openDetail("req", r)}>
                        {r.title}
                      </td>
                      <td>{renderPriorityBadge(r.priority)}</td>
                      <td>{renderStatusBadge(r.status, reqStatusText)}</td>
                      <td>{r.assignee || "-"}</td>
                      <td>{r.creator}</td>
                      <td>{new Date(r.createdAt).toLocaleDateString("zh-CN")}</td>
                      <td>
                        <div className={styles.actionButtons}>
                          <button className={`${styles.actionBtn} ${styles.view}`} title="查看" onClick={() => openDetail("req", r)}>
                            <FaEye />
                          </button>
                          <button className={`${styles.actionBtn} ${styles.edit}`} title="编辑" onClick={() => openEdit("req", r)}>
                            <FaEdit />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={7} className={styles.emptyCell}>
                      <div className={styles.emptyCellIcon}>
                        <FaClipboardList />
                      </div>
                      <div className={styles.emptyCellText}>暂无相关需求</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {paginationBar}
        </>
      )}

      {/* ---- bugs table ---- */}
      {activeTab === "bug" && (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>标题</th>
                  <th>严重程度</th>
                  <th>优先级</th>
                  <th>状态</th>
                  <th>负责人</th>
                  <th>创建人</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => {
                  const b = item as Bug;
                  return (
                    <tr key={b.id}>
                      <td className={styles.titleCell} onClick={() => openDetail("bug", b)}>
                        {b.title}
                      </td>
                      <td>
                        <span className={`${styles.badge} ${styles[`severity_${b.severity}`]}`}>{severityText[b.severity]}</span>
                      </td>
                      <td>{renderPriorityBadge(b.priority)}</td>
                      <td>{renderStatusBadge(b.status, bugStatusText)}</td>
                      <td>{b.assignee || "-"}</td>
                      <td>{b.creator}</td>
                      <td>
                        <div className={styles.actionButtons}>
                          <button className={`${styles.actionBtn} ${styles.view}`} title="查看" onClick={() => openDetail("bug", b)}>
                            <FaEye />
                          </button>
                          <button className={`${styles.actionBtn} ${styles.edit}`} title="编辑" onClick={() => openEdit("bug", b)}>
                            <FaEdit />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={7} className={styles.emptyCell}>
                      <div className={styles.emptyCellIcon}>
                        <FaBug />
                      </div>
                      <div className={styles.emptyCellText}>暂无相关缺陷</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {paginationBar}
        </>
      )}

      {/* ---- tasks table ---- */}
      {activeTab === "task" && (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>标题</th>
                  <th>优先级</th>
                  <th>状态</th>
                  <th>负责人</th>
                  <th>创建人</th>
                  <th>截止日期</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => {
                  const t = item as Task;
                  return (
                    <tr key={t.id}>
                      <td className={styles.titleCell} onClick={() => openDetail("task", t)}>
                        {t.title}
                      </td>
                      <td>{renderPriorityBadge(t.priority)}</td>
                      <td>{renderStatusBadge(t.status, taskStatusText)}</td>
                      <td>{t.assignee || "-"}</td>
                      <td>{t.creator}</td>
                      <td>{t.deadline ? new Date(t.deadline).toLocaleDateString("zh-CN") : "-"}</td>
                      <td>
                        <div className={styles.actionButtons}>
                          <button className={`${styles.actionBtn} ${styles.view}`} title="查看" onClick={() => openDetail("task", t)}>
                            <FaEye />
                          </button>
                          <button className={`${styles.actionBtn} ${styles.edit}`} title="编辑" onClick={() => openEdit("task", t)}>
                            <FaEdit />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={7} className={styles.emptyCell}>
                      <div className={styles.emptyCellIcon}>
                        <FaTasks />
                      </div>
                      <div className={styles.emptyCellText}>暂无相关任务</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {paginationBar}
        </>
      )}

      {/* ============ MODAL ============ */}
      <Modal
        visible={modalVisible}
        title={
          detail
            ? editMode
              ? `编辑${activeTab === "req" ? "需求" : activeTab === "bug" ? "缺陷" : "任务"}`
              : (detail.item as any).title
            : "工单详情"
        }
        onClose={() => {
          setModalVisible(false);
          setDetail(null);
          setEditMode(false);
        }}
        width={720}
        footer={
          editMode ? (
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button
                onClick={() => setEditMode(false)}
                style={{
                  padding: "10px 20px",
                  background: "var(--card-bg)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-primary)",
                  borderRadius: "8px",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: "10px 20px",
                  background: "var(--primary)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                {saving ? "保存中..." : "保存"}
              </button>
            </div>
          ) : null
        }
      >
        {detail && !editMode && (
          <>
            {/* Requirement detail */}
            {detail.type === "req" &&
              (() => {
                const r = detail.item as Requirement;
                return (
                  <div>
                    <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
                      {renderPriorityBadge(r.priority)}
                      {renderStatusBadge(r.status, reqStatusText)}
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                        gap: "8px",
                        marginBottom: "20px",
                        paddingBottom: "16px",
                        borderBottom: "1px solid var(--border-primary)",
                      }}
                    >
                      {renderField_("负责人", r.assignee)}
                      {renderField_("创建人", r.creator)}
                      {renderField_("所属组织", orgNameMap[r.organizationId] || r.organizationId)}
                      {renderField_("迭代", r.iteration)}
                      {renderField_("分类", r.category)}
                      {renderField_("来源", r.source)}
                      {renderField_("创建时间", new Date(r.createdAt).toLocaleString("zh-CN"))}
                      {renderField_("更新时间", new Date(r.updatedAt).toLocaleString("zh-CN"))}
                    </div>
                    <div>
                      <h4 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px" }}>描述</h4>
                      <div style={{ fontSize: "14px", color: "var(--text-primary)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                        {r.description || "暂无描述"}
                      </div>
                    </div>
                  </div>
                );
              })()}
            {/* Bug detail */}
            {detail.type === "bug" &&
              (() => {
                const b = detail.item as Bug;
                return (
                  <div>
                    <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
                      <span className={`${styles.badge} ${styles[`severity_${b.severity}`]}`}>{severityText[b.severity]}</span>
                      {renderPriorityBadge(b.priority)}
                      {renderStatusBadge(b.status, bugStatusText)}
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                        gap: "8px",
                        marginBottom: "20px",
                        paddingBottom: "16px",
                        borderBottom: "1px solid var(--border-primary)",
                      }}
                    >
                      {renderField_("负责人", b.assignee)}
                      {renderField_("创建人", b.creator)}
                      {renderField_("所属组织", orgNameMap[b.organizationId] || b.organizationId)}
                      {renderField_("所属模块", b.module)}
                      {renderField_("关联需求", b.relatedRequirementId)}
                      {renderField_("运行环境", b.environment)}
                      {renderField_("创建时间", new Date(b.createdAt).toLocaleString("zh-CN"))}
                      {renderField_("更新时间", new Date(b.updatedAt).toLocaleString("zh-CN"))}
                    </div>
                    <div style={{ marginBottom: b.stepsToReproduce ? "20px" : "0" }}>
                      <h4 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px" }}>描述</h4>
                      <div style={{ fontSize: "14px", color: "var(--text-primary)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                        {b.description || "暂无描述"}
                      </div>
                    </div>
                    {b.stepsToReproduce && (
                      <div>
                        <h4 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px" }}>
                          复现步骤
                        </h4>
                        <div style={{ fontSize: "14px", color: "var(--text-primary)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                          {b.stepsToReproduce}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            {/* Task detail */}
            {detail.type === "task" &&
              (() => {
                const t = detail.item as Task;
                return (
                  <div>
                    <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
                      {renderPriorityBadge(t.priority)}
                      {renderStatusBadge(t.status, taskStatusText)}
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                        gap: "8px",
                        marginBottom: "20px",
                        paddingBottom: "16px",
                        borderBottom: "1px solid var(--border-primary)",
                      }}
                    >
                      {renderField_("负责人", t.assignee)}
                      {renderField_("创建人", t.creator)}
                      {renderField_("所属组织", orgNameMap[t.organizationId] || t.organizationId)}
                      {renderField_("关联需求", t.requirementId)}
                      {renderField_("截止日期", t.deadline ? new Date(t.deadline).toLocaleDateString("zh-CN") : "-")}
                      {renderField_("预估工时", `${t.estimatedHours}h`)}
                      {renderField_("创建时间", new Date(t.createdAt).toLocaleString("zh-CN"))}
                      {renderField_("更新时间", new Date(t.updatedAt).toLocaleString("zh-CN"))}
                    </div>
                    <div>
                      <h4 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px" }}>描述</h4>
                      <div style={{ fontSize: "14px", color: "var(--text-primary)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                        {t.description || "暂无描述"}
                      </div>
                    </div>
                  </div>
                );
              })()}
          </>
        )}
        {detail && editMode && renderEditForm()}
      </Modal>
    </div>
  );
};

export default MyTickets;
