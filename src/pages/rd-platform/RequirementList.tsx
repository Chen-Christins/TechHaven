import React, { useState, useEffect } from "react";
import {
  FaPlus,
  FaEye,
  FaEdit,
  FaTrash,
  FaFilter,
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
import { confirm } from "../../components/confirm/Confirm";
import message from "../../components/message/Message";
import { useAuth } from "../../contexts/AuthContext";
import { RdPlatformMockService } from "../../services/rdPlatformMockService";
import type { SelectOption } from "../../types";
import type { Requirement } from "../../types/rdPlatform";

// ---- constants ----
const statusOptions: SelectOption[] = [
  { id: "", name: "全部状态", color: "#6c757d" },
  { id: "new", name: "新建", color: "#3b82f6" },
  { id: "developing", name: "开发中", color: "#eab308" },
  { id: "testing", name: "测试中", color: "#a855f7" },
  { id: "done", name: "已完成", color: "#22c55e" },
  { id: "closed", name: "已关闭", color: "#6b7280" },
];

const priorityOptions: SelectOption[] = [
  { id: "", name: "全部优先级", color: "#6c757d" },
  { id: "high", name: "高", color: "#ef4444" },
  { id: "medium", name: "中", color: "#f59e0b" },
  { id: "low", name: "低", color: "#22c55e" },
];

const formPriorityOptions = priorityOptions.filter((o) => o.id !== "");
const formStatusOptions = statusOptions.filter((o) => o.id !== "");

const statusText: Record<string, string> = { new: "新建", developing: "开发中", testing: "测试中", done: "已完成", closed: "已关闭" };
const priorityText: Record<string, string> = { high: "高", medium: "中", low: "低" };
const PAGE_SIZE = 10;

interface FormData {
  title: string;
  description: string;
  priority: string;
  status: string;
  assignee: string;
  iteration: string;
  category: string;
  source: string;
}

const emptyForm: FormData = {
  title: "",
  description: "",
  priority: "medium",
  status: "new",
  assignee: "",
  iteration: "",
  category: "",
  source: "",
};

// ---- component ----
const RequirementList: React.FC = () => {
  const { user } = useAuth();
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({ search: "", status: "", priority: "" });

  // modal
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "view" | "edit">("create");
  const [selectedReq, setSelectedReq] = useState<Requirement | null>(null);
  const [form, setForm] = useState<FormData>({ ...emptyForm });

  const fetchData = async () => {
    setLoading(true);
    const res = await RdPlatformMockService.getRequirements({ ...filters, page: currentPage, pageSize: PAGE_SIZE });
    setRequirements(res.data);
    setTotal(res.total);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, filters]);

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  // ---- modal handlers ----
  const openCreate = () => {
    setModalMode("create");
    setSelectedReq(null);
    setForm({ ...emptyForm });
    setModalVisible(true);
  };

  const openView = (req: Requirement) => {
    setModalMode("view");
    setSelectedReq(req);
    setModalVisible(true);
  };

  const openEdit = (req: Requirement) => {
    setModalMode("edit");
    setSelectedReq(req);
    setForm({
      title: req.title,
      description: req.description,
      priority: req.priority,
      status: req.status,
      assignee: req.assignee,
      iteration: req.iteration,
      category: req.category,
      source: req.source,
    });
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedReq(null);
  };

  const setFormField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      message.warn("请输入需求标题");
      return;
    }
    const data = {
      title: form.title.trim(),
      description: form.description,
      priority: form.priority as Requirement["priority"],
      status: form.status as Requirement["status"],
      assignee: form.assignee,
      iteration: form.iteration,
      category: form.category,
      source: form.source,
    };
    if (modalMode === "edit" && selectedReq) {
      await RdPlatformMockService.updateRequirement(selectedReq.id, data);
      message.success("需求更新成功");
    } else {
      await RdPlatformMockService.createRequirement({ ...data, status: "new", creator: user?.name || user?.account || "未知" });
      message.success("需求创建成功");
    }
    closeModal();
    fetchData();
  };

  const handleDelete = async (req: Requirement) => {
    await confirm({
      title: "确认删除",
      content: (
        <div>
          确定要删除需求 "<strong>{req.title}</strong>" 吗？删除后无法恢复。
        </div>
      ),
      confirmText: "删除",
      cancelText: "取消",
      onConfirm: async () => {
        await RdPlatformMockService.deleteRequirement(req.id);
        message.success("需求已删除");
        fetchData();
      },
    });
  };

  // ---- render helpers ----
  const renderField = (label: string, value: React.ReactNode) => (
    <div style={{ marginBottom: "14px" }}>
      <span style={{ fontSize: "13px", color: "var(--text-tertiary)", display: "block", marginBottom: "2px" }}>{label}</span>
      <span style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: 500 }}>{value || "-"}</span>
    </div>
  );

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      const s = Math.max(1, currentPage - 2),
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

  if (loading && requirements.length === 0) return <Loading />;

  return (
    <div className={styles.listPage}>
      {/* header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>需求管理</h1>
          <p className={styles.pageDescription}>管理产品需求，跟踪开发进度</p>
        </div>
        <button className={styles.createBtn} onClick={openCreate}>
          <FaPlus /> 新建需求
        </button>
      </div>

      {/* filters */}
      <div className={styles.filterSection}>
        <div className={styles.filterHeader}>
          <h3 className={styles.filterTitle}>
            <FaFilter /> 筛选条件
          </h3>
          <button
            className={styles.clearBtn}
            onClick={() => {
              setFilters({ search: "", status: "", priority: "" });
              setCurrentPage(1);
            }}
          >
            清除筛选
          </button>
        </div>
        <div className={styles.filterForm}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>搜索</label>
            <Input
              placeholder="标题、描述或创建人"
              value={filters.search}
              onChange={(val) => handleFilterChange("search", val)}
              allowClear
              size="large"
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>状态</label>
            <CustomSelect
              name="状态"
              options={statusOptions}
              value={statusOptions.find((o) => o.id === filters.status) || null}
              onChange={(o) => handleFilterChange("status", (o?.id as string) || "")}
              hideBadge
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>优先级</label>
            <CustomSelect
              name="优先级"
              options={priorityOptions}
              value={priorityOptions.find((o) => o.id === filters.priority) || null}
              onChange={(o) => handleFilterChange("priority", (o?.id as string) || "")}
              hideBadge
            />
          </div>
        </div>
      </div>

      {/* table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>标题</th>
              <th>优先级</th>
              <th>状态</th>
              <th>负责人</th>
              <th>迭代</th>
              <th>创建人</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {requirements.map((r) => (
              <tr key={r.id}>
                <td className={styles.titleCell} onClick={() => openView(r)}>
                  {r.title}
                </td>
                <td>
                  <span className={`${styles.badge} ${styles[`priority_${r.priority}`]}`}>{priorityText[r.priority]}</span>
                </td>
                <td>
                  <span className={`${styles.badge} ${styles[`status_${r.status}`]}`}>{statusText[r.status]}</span>
                </td>
                <td>{r.assignee || "-"}</td>
                <td>{r.iteration || "-"}</td>
                <td>{r.creator}</td>
                <td>{new Date(r.createdAt).toLocaleDateString("zh-CN")}</td>
                <td>
                  <div className={styles.actionButtons}>
                    <button className={`${styles.actionBtn} ${styles.view}`} title="查看" onClick={() => openView(r)}>
                      <FaEye />
                    </button>
                    <button className={`${styles.actionBtn} ${styles.edit}`} title="编辑" onClick={() => openEdit(r)}>
                      <FaEdit />
                    </button>
                    <button className={`${styles.actionBtn} ${styles.delete}`} title="删除" onClick={() => handleDelete(r)}>
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {requirements.length === 0 && (
              <tr>
                <td colSpan={8} className={styles.emptyCell}>
                  暂无需求数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <span className={styles.paginationInfo}>共 {total} 条记录</span>
          <div className={styles.paginationControls}>
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(1)}>
              <FaAngleDoubleLeft />
            </button>
            <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
              <FaChevronLeft />
            </button>
            {getPageNumbers().map((page, i) =>
              page === "..." ? (
                <span key={`d-${i}`} className={styles.paginationEllipsis}>
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  className={currentPage === page ? styles.activePage : ""}
                  onClick={() => setCurrentPage(page as number)}
                >
                  {page}
                </button>
              ),
            )}
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>
              <FaChevronRight />
            </button>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)}>
              <FaAngleDoubleRight />
            </button>
          </div>
        </div>
      )}

      {/* ============ MODAL ============ */}
      <Modal
        visible={modalVisible}
        title={modalMode === "create" ? "新建需求" : modalMode === "edit" ? "编辑需求" : selectedReq?.title || "需求详情"}
        onClose={closeModal}
        width={720}
        footer={
          modalMode === "view" ? null : (
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button
                onClick={closeModal}
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
                onClick={handleSubmit}
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
                {modalMode === "edit" ? "保存修改" : "创建需求"}
              </button>
            </div>
          )
        }
      >
        {modalMode === "view" && selectedReq ? (
          /* ---- detail view ---- */
          <div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
              <span className={`${styles.badge} ${styles[`priority_${selectedReq.priority}`]}`}>
                {priorityText[selectedReq.priority]}
              </span>
              <span className={`${styles.badge} ${styles[`status_${selectedReq.status}`]}`}>{statusText[selectedReq.status]}</span>
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
              {renderField("负责人", selectedReq.assignee)}
              {renderField("创建人", selectedReq.creator)}
              {renderField("迭代", selectedReq.iteration)}
              {renderField("分类", selectedReq.category)}
              {renderField("来源", selectedReq.source)}
              {renderField("创建时间", new Date(selectedReq.createdAt).toLocaleString("zh-CN"))}
              {renderField("更新时间", new Date(selectedReq.updatedAt).toLocaleString("zh-CN"))}
            </div>
            <div>
              <h4 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px" }}>描述</h4>
              <div style={{ fontSize: "14px", color: "var(--text-primary)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                {selectedReq.description || "暂无描述"}
              </div>
            </div>
          </div>
        ) : (
          /* ---- create / edit form ---- */
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label
                style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}
              >
                标题 <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <Input placeholder="请输入需求标题" value={form.title} onChange={(v) => setFormField("title", v)} size="large" />
            </div>
            <div style={{ display: "flex", gap: "16px" }}>
              <div style={{ flex: 1 }}>
                <label
                  style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}
                >
                  优先级
                </label>
                <CustomSelect
                  name="优先级"
                  options={formPriorityOptions}
                  value={formPriorityOptions.find((o) => o.id === form.priority) || null}
                  onChange={(o) => setFormField("priority", (o?.id as string) || "medium")}
                  hideBadge
                />
              </div>
              {modalMode === "edit" && (
                <div style={{ flex: 1 }}>
                  <label
                    style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}
                  >
                    状态
                  </label>
                  <CustomSelect
                    name="状态"
                    options={formStatusOptions}
                    value={formStatusOptions.find((o) => o.id === form.status) || null}
                    onChange={(o) => setFormField("status", (o?.id as string) || "new")}
                    hideBadge
                  />
                </div>
              )}
              <div style={{ flex: 1 }}>
                <label
                  style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}
                >
                  负责人
                </label>
                <Input placeholder="请输入负责人" value={form.assignee} onChange={(v) => setFormField("assignee", v)} size="large" />
              </div>
            </div>
            <div style={{ display: "flex", gap: "16px" }}>
              <div style={{ flex: 1 }}>
                <label
                  style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}
                >
                  迭代
                </label>
                <Input placeholder="如 Sprint 12" value={form.iteration} onChange={(v) => setFormField("iteration", v)} size="large" />
              </div>
              <div style={{ flex: 1 }}>
                <label
                  style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}
                >
                  分类
                </label>
                <Input placeholder="如 前端、后端" value={form.category} onChange={(v) => setFormField("category", v)} size="large" />
              </div>
              <div style={{ flex: 1 }}>
                <label
                  style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}
                >
                  来源
                </label>
                <Input placeholder="如 产品需求" value={form.source} onChange={(v) => setFormField("source", v)} size="large" />
              </div>
            </div>
            <div>
              <label
                style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}
              >
                描述
              </label>
              <textarea
                placeholder="请输入需求详细描述..."
                value={form.description}
                onChange={(e) => setFormField("description", e.target.value)}
                rows={6}
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
        )}
      </Modal>
    </div>
  );
};

export default RequirementList;
