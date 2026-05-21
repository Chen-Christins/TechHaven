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
import type { Requirement, SelectOption } from "../../types";

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

const statusText: Record<string, string> = {
  new: "新建",
  developing: "开发中",
  testing: "测试中",
  done: "已完成",
  closed: "已关闭",
};
const priorityText: Record<string, string> = { high: "高", medium: "中", low: "低" };

const PAGE_SIZE = 10;

const RequirementList: React.FC = () => {
  const navigate = useNavigate();
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({ search: "", status: "", priority: "" });

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

  if (loading && requirements.length === 0) return <Loading />;

  return (
    <div className={styles.listPage}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>需求管理</h1>
          <p className={styles.pageDescription}>管理产品需求，跟踪开发进度</p>
        </div>
        <button className={styles.createBtn} onClick={() => navigate("/rd/requirements/create")}>
          <FaPlus /> 新建需求
        </button>
      </div>

      {/* Filters */}
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
              onChange={(option) => handleFilterChange("status", (option?.id as string) || "")}
              hideBadge
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>优先级</label>
            <CustomSelect
              name="优先级"
              options={priorityOptions}
              value={priorityOptions.find((o) => o.id === filters.priority) || null}
              onChange={(option) => handleFilterChange("priority", (option?.id as string) || "")}
              hideBadge
            />
          </div>
        </div>
      </div>

      {/* Table */}
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
                <td className={styles.titleCell} onClick={() => navigate(`/rd/requirements/${r.id}`)}>
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
                    <button
                      className={`${styles.actionBtn} ${styles.view}`}
                      title="查看"
                      onClick={() => navigate(`/rd/requirements/${r.id}`)}
                    >
                      <FaEye />
                    </button>
                    <button
                      className={`${styles.actionBtn} ${styles.edit}`}
                      title="编辑"
                      onClick={() => navigate(`/rd/requirements/${r.id}/edit`)}
                    >
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

      {/* Pagination */}
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

export default RequirementList;
