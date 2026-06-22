import React, { useState, useEffect } from "react";
import { formatDateTime } from "../../utils/utils";
import {
  FaEye,
  FaTrash,
  FaFilter,
  FaCode,
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
import { confirm } from "../../components/confirm/Confirm";
import { useRdOrg } from "../../contexts/RdOrgContext";
import { RdMockService as RdAPI } from "../../services/rdPlatformMock";
import AssigneeDisplay from "../../components/assigneeDisplay/AssigneeDisplay";
import type { SelectOption } from "../../types";
import type { CodeReview } from "../../types/rdPlatform";
import { OrgPermission } from "../../types/rdPlatform";

// ---- constants ----
const statusOptions: SelectOption[] = [
  { id: "", name: "全部状态", color: "#6c757d" },
  { id: "pending", name: "待审核", color: "#3b82f6" },
  { id: "reviewing", name: "审核中", color: "#a855f7" },
  { id: "approved", name: "已通过", color: "#22c55e" },
  { id: "rejected", name: "已拒绝", color: "#ef4444" },
  { id: "closed", name: "已关闭", color: "#6b7280" },
];

const priorityOptions: SelectOption[] = [
  { id: "", name: "全部优先级", color: "#6c757d" },
  { id: "high", name: "高", color: "#ef4444" },
  { id: "medium", name: "中", color: "#f59e0b" },
  { id: "low", name: "低", color: "#22c55e" },
];

const statusText: Record<string, string> = {
  pending: "待审核",
  reviewing: "审核中",
  approved: "已通过",
  rejected: "已拒绝",
  closed: "已关闭",
};
const priorityText: Record<string, string> = { high: "高", medium: "中", low: "低" };
const PAGE_SIZE = 10;

// ---- component ----
const CodeReviewList: React.FC = () => {
  const { orgNameMap, maxOrgRole, selectedOrgId } = useRdOrg();
  const [reviews, setReviews] = useState<CodeReview[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({ search: "", status: "", priority: "" });

  // view modal
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedReview, setSelectedReview] = useState<CodeReview | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await RdAPI.getCodeReviews({
        search: filters.search,
        status: filters.status,
        priority: filters.priority,
        page: currentPage,
        pageSize: PAGE_SIZE,
        organizationIds: selectedOrgId ? [selectedOrgId] : undefined,
      });
      setReviews(res.data);
      setTotal(res.total);
    } catch {
      message.error("获取数据失败");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, filters, selectedOrgId]);

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  const openView = (review: CodeReview) => {
    setSelectedReview(review);
    setViewModalVisible(true);
  };
  const closeView = () => {
    setViewModalVisible(false);
    setSelectedReview(null);
  };

  const handleDelete = async (review: CodeReview) => {
    await confirm({
      title: "确认删除",
      content: (
        <div>
          确定要删除代码审查 "<strong>{review.title}</strong>" 吗？删除后无法恢复。
        </div>
      ),
      confirmText: "删除",
      cancelText: "取消",
      onConfirm: async () => {
        try {
          await RdAPI.deleteCodeReview(review.id);
          message.success("代码审查已删除");
          fetchData();
        } catch (err: any) {
          message.error(err?.message || "删除失败");
        }
      },
    });
  };

  const renderField = (label: string, value: React.ReactNode) => (
    <div style={{ marginBottom: "14px" }}>
      <span style={{ fontSize: "13px", color: "var(--text-tertiary)", display: "block", marginBottom: "2px" }}>{label}</span>
      <span style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: 500 }}>{value || "-"}</span>
    </div>
  );

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
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

  if (loading && reviews.length === 0) return <Loading />;

  return (
    <div className={styles.listPage}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>代码审查</h1>
          <p className={styles.pageDescription}>查看平台推送的代码审查数据，把控代码质量</p>
        </div>
      </div>

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
              placeholder="标题、描述、作者或仓库"
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

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>标题</th>
              <th>状态</th>
              <th>优先级</th>
              <th>作者</th>
              <th>审核人</th>
              <th>仓库/分支</th>
              <th>变更文件</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((r) => (
              <tr key={r.id}>
                <td className={styles.titleCell} onClick={() => openView(r)}>
                  {r.title}
                </td>
                <td>
                  <span className={`${styles.badge} ${styles[`status_${r.status}`]}`}>{statusText[r.status] || r.status}</span>
                </td>
                <td>
                  <span className={`${styles.badge} ${styles[`priority_${r.priority}`]}`}>{priorityText[r.priority]}</span>
                </td>
                <td style={{ textAlign: "center" }}>
                  <AssigneeDisplay name={r.author} avatar={r.authorAvatar} />
                </td>
                <td style={{ textAlign: "center" }}>
                  <AssigneeDisplay name={r.reviewer} avatar={r.reviewerAvatar} />
                </td>
                <td style={{ textAlign: "center" }}>
                  <span style={{ fontSize: "13px", fontWeight: 500 }}>{r.repository}</span>
                  <br />
                  <span style={{ color: "var(--text-tertiary)", fontSize: "12px" }}>{r.branch}</span>
                </td>
                <td>
                  <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                    {r.filesChanged} 文件
                    <span style={{ color: "#22c55e", marginLeft: "6px" }}>+{r.linesAdded}</span>
                    <span style={{ color: "#ef4444", marginLeft: "4px" }}>-{r.linesDeleted}</span>
                  </span>
                </td>
                <td>{formatDateTime(r.createdAt)}</td>
                <td>
                  <div className={styles.actionButtons}>
                    <button className={`${styles.actionBtn} ${styles.view}`} title="查看详情" onClick={() => openView(r)}>
                      <FaEye />
                    </button>
                    {OrgPermission.canDelete(maxOrgRole) && (
                      <button className={`${styles.actionBtn} ${styles.delete}`} title="删除" onClick={() => handleDelete(r)}>
                        <FaTrash />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {reviews.length === 0 && (
              <tr>
                <td colSpan={9} className={styles.emptyCell}>
                  <div className={styles.emptyCellIcon}>
                    <FaCode />
                  </div>
                  <div className={styles.emptyCellText}>暂无代码审查数据</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {
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
      }

      {/* ============ VIEW MODAL ============ */}
      <Modal visible={viewModalVisible} title={selectedReview?.title || "代码审查详情"} onClose={closeView} width={800} footer={null}>
        {selectedReview && (
          <div data-allow-copy="true">
            <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
              <span className={`${styles.badge} ${styles[`status_${selectedReview.status}`]}`}>
                {statusText[selectedReview.status]}
              </span>
              <span className={`${styles.badge} ${styles[`priority_${selectedReview.priority}`]}`}>
                {priorityText[selectedReview.priority]}
              </span>
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
              {renderField("作者", <AssigneeDisplay name={selectedReview.author} avatar={selectedReview.authorAvatar} />)}
              {renderField("审核人", <AssigneeDisplay name={selectedReview.reviewer} avatar={selectedReview.reviewerAvatar} />)}
              {renderField("所属组织", orgNameMap[selectedReview.organizationId] || selectedReview.organizationId)}
              {renderField("仓库", selectedReview.repository)}
              {renderField("分支", selectedReview.branch)}
              {renderField("Commit", selectedReview.commitHash)}
              {renderField(
                "变更统计",
                <span>
                  {selectedReview.filesChanged} 文件
                  <span style={{ color: "#22c55e", marginLeft: "8px" }}>+{selectedReview.linesAdded}</span>
                  <span style={{ color: "#ef4444", marginLeft: "4px" }}>-{selectedReview.linesDeleted}</span>
                </span>,
              )}
              {renderField("创建时间", formatDateTime(selectedReview.createdAt))}
              {renderField("更新时间", formatDateTime(selectedReview.updatedAt))}
            </div>
            <div>
              <h4 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px" }}>描述</h4>
              <div style={{ fontSize: "14px", color: "var(--text-primary)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                {selectedReview.description || "暂无描述"}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CodeReviewList;
