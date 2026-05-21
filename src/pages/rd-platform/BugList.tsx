import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import Loading from "../../components/loading/Loading";
import { confirm } from "../../components/confirm/Confirm";
import message from "../../components/message/Message";
import { RdPlatformMockService } from "../../services/rdPlatformMockService";
import type { Bug, SelectOption } from "../../types";

const statusOptions: SelectOption[] = [
  { id: "", name: "全部状态", color: "#6c757d" },
  { id: "new", name: "新建", color: "#3b82f6" },
  { id: "accepted", name: "已受理", color: "#eab308" },
  { id: "processing", name: "处理中", color: "#a855f7" },
  { id: "verified", name: "已验证", color: "#22c55e" },
  { id: "closed", name: "已关闭", color: "#6b7280" },
  { id: "reopened", name: "已重开", color: "#ef4444" },
];

const severityOptions: SelectOption[] = [
  { id: "", name: "全部严重程度", color: "#6c757d" },
  { id: "fatal", name: "致命", color: "#dc2626" },
  { id: "serious", name: "严重", color: "#ea580c" },
  { id: "normal", name: "一般", color: "#f59e0b" },
  { id: "minor", name: "轻微", color: "#22c55e" },
];

const priorityOptions: SelectOption[] = [
  { id: "", name: "全部优先级", color: "#6c757d" },
  { id: "urgent", name: "紧急", color: "#dc2626" },
  { id: "high", name: "高", color: "#ef4444" },
  { id: "medium", name: "中", color: "#f59e0b" },
  { id: "low", name: "低", color: "#22c55e" },
];

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

const PAGE_SIZE = 10;

const BugList: React.FC = () => {
  const navigate = useNavigate();
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({ search: "", status: "", severity: "", priority: "" });

  const fetchData = async () => {
    setLoading(true);
    const res = await RdPlatformMockService.getBugs({ ...filters, page: currentPage, pageSize: PAGE_SIZE });
    setBugs(res.data);
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

  const handleDelete = async (bug: Bug) => {
    await confirm({
      title: "确认删除",
      content: (
        <div>
          确定要删除缺陷 "<strong>{bug.title}</strong>" 吗？删除后无法恢复。
        </div>
      ),
      confirmText: "删除",
      cancelText: "取消",
      onConfirm: async () => {
        await RdPlatformMockService.deleteBug(bug.id);
        message.success("缺陷已删除");
        fetchData();
      },
    });
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      const start = Math.max(1, currentPage - 2);
      const end = Math.min(totalPages, start + 4);
      if (start > 1) {
        pages.push(1);
        if (start > 2) pages.push("...");
      }
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages) {
        if (end < totalPages - 1) pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  if (loading && bugs.length === 0) return <Loading />;

  return (
    <div className={styles.listPage}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>缺陷管理</h1>
          <p className={styles.pageDescription}>管理项目缺陷，跟踪修复进度</p>
        </div>
        <button className={styles.createBtn} onClick={() => navigate("/rd/bugs/create")}>
          <FaPlus /> 提交缺陷
        </button>
      </div>

      <div className={styles.filterSection}>
        <div className={styles.filterHeader}>
          <h3 className={styles.filterTitle}>
            <FaFilter /> 筛选条件
          </h3>
          <button
            className={styles.clearBtn}
            onClick={() => {
              setFilters({ search: "", status: "", severity: "", priority: "" });
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
            <label className={styles.filterLabel}>严重程度</label>
            <CustomSelect
              name="严重程度"
              options={severityOptions}
              value={severityOptions.find((o) => o.id === filters.severity) || null}
              onChange={(o) => handleFilterChange("severity", (o?.id as string) || "")}
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
              <th>严重程度</th>
              <th>优先级</th>
              <th>状态</th>
              <th>负责人</th>
              <th>模块</th>
              <th>创建人</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {bugs.map((b) => (
              <tr key={b.id}>
                <td className={styles.titleCell} onClick={() => navigate(`/rd/bugs/${b.id}`)}>
                  {b.title}
                </td>
                <td>
                  <span className={`${styles.badge} ${styles[`severity_${b.severity}`]}`}>{severityText[b.severity]}</span>
                </td>
                <td>
                  <span className={`${styles.badge} ${styles[`priority_${b.priority}`]}`}>{priorityText[b.priority]}</span>
                </td>
                <td>
                  <span className={`${styles.badge} ${styles[`status_${b.status}`]}`}>{statusText[b.status]}</span>
                </td>
                <td>{b.assignee || "-"}</td>
                <td>{b.module || "-"}</td>
                <td>{b.creator}</td>
                <td>
                  <div className={styles.actionButtons}>
                    <button className={`${styles.actionBtn} ${styles.view}`} title="查看" onClick={() => navigate(`/rd/bugs/${b.id}`)}>
                      <FaEye />
                    </button>
                    <button
                      className={`${styles.actionBtn} ${styles.edit}`}
                      title="编辑"
                      onClick={() => navigate(`/rd/bugs/${b.id}/edit`)}
                    >
                      <FaEdit />
                    </button>
                    <button className={`${styles.actionBtn} ${styles.delete}`} title="删除" onClick={() => handleDelete(b)}>
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {bugs.length === 0 && (
              <tr>
                <td colSpan={8} className={styles.emptyCell}>
                  暂无缺陷数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
                <span key={`dot-${i}`} className={styles.paginationEllipsis}>
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
    </div>
  );
};

export default BugList;
