import React, { useState, useEffect, useCallback } from "react";
import {
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaEye,
  FaChevronLeft,
  FaChevronRight,
  FaBookOpen,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaFilter,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaFlag,
} from "react-icons/fa";
import DatePicker from "../../components/input/DatePicker";
import CustomSelect from "../../components/customSelect/CustomSelect";
import Input from "../../components/input/Input";
import Loading from "../../components/loading/Loading";
import { confirm } from "../../components/confirm/Confirm";
import message from "../../components/message/Message";
import Modal from "../../components/modal/Modal";
import styles from "./AssignmentManagement.module.css";
import AssignmentService from "../../services/assignmentService";

// 模拟任务数据接口
interface Assignment {
  id: string;
  title: string;
  courseName: string;
  deadline: string;
  status: "active" | "draft" | "closed";
  submissionCount: number;
  totalStudents: number;
  createdAt: string;
  description?: string;
  priority: "low" | "medium" | "high" | "urgent";
  maxFileSize?: number; // MB
  allowedTypes?: string[];
}

const STATE_STR_MAP_NUMBER: Record<string, number> = {
  draft: 0,
  active: 1,
  closed: 2,
};

const PRIORITY_STR_MAP_NUMBER: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 3,
  urgent: 4,
};

const STATE_NUMBER_MAP_STR: Record<number, string> = {
  0: "draft",
  1: "active",
  2: "closed",
};

const PRIORITY_NUMBER_MAP_STR: Record<number, string> = {
  1: "low",
  2: "medium",
  3: "high",
  4: "urgent",
};

const AssignmentManagement: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);

  // 模态框状态
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState<Assignment | null>(null);
  const [formData, setFormData] = useState<Partial<Assignment>>({
    title: "",
    courseName: "",
    deadline: "",
    status: "draft",
    description: "",
    priority: "medium",
    maxFileSize: 50,
    allowedTypes: [],
  });
  const [allowedTypesInput, setAllowedTypesInput] = useState("");

  const pageSize = 10;

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page_num: currentPage,
        page_size: pageSize,
      };
      if (statusFilter !== "all") {
        params.state = STATE_STR_MAP_NUMBER[statusFilter];
      }

      const res = await AssignmentService.getAdminAssignments(params);

      const mappedList: Assignment[] = (res.list || []).map((item) => ({
        id: String(item.id),
        title: item.name,
        courseName: item.subject_name,
        deadline: new Date(item.end_time * 1000)
          .toLocaleString("zh-CN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          })
          .replace(/\//g, "-"),
        status: STATE_NUMBER_MAP_STR[Number(item.status)] as "active" | "draft" | "closed",
        submissionCount: 0, // 暂无数据
        totalStudents: 0, // 暂无数据
        createdAt: new Date(item.create_time * 1000)
          .toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          })
          .replace(/\//g, "-"),
        description: item.description,
        priority: PRIORITY_NUMBER_MAP_STR[item.priority] as "low" | "medium" | "high" | "urgent",
        maxFileSize: item.file_size,
        allowedTypes: item.file_type ? item.file_type.split(",") : [],
      }));
      console.log("任务列表数据:", mappedList);
      setAssignments(mappedList);
      setTotal(res.total);
    } catch (error) {
      console.error("获取任务列表失败:", error);
      message.error("获取任务列表失败");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, statusFilter]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // 打开编辑模态框
  const openEditModal = (assignment: Assignment) => {
    setCurrentAssignment(assignment);
    // 将格式化的时间字符串转换为ISO格式供DatePicker使用
    const deadlineDate = assignment.deadline ? new Date(assignment.deadline.replace(/\//g, "-")) : null;
    setFormData({
      title: assignment.title,
      courseName: assignment.courseName,
      deadline: deadlineDate ? deadlineDate.toISOString() : "",
      status: assignment.status,
      priority: assignment.priority,
      description: assignment.description || "",
      maxFileSize: assignment.maxFileSize || 50,
      allowedTypes: assignment.allowedTypes || [],
    });
    setAllowedTypesInput(assignment.allowedTypes?.join(", ") || "");
    setIsModalVisible(true);
  };

  // 打开预览模态框
  const openPreviewModal = (assignment: Assignment) => {
    setCurrentAssignment(assignment);
    setIsPreviewVisible(true);
  };

  // 打开创建模态框
  const openCreateModal = () => {
    setCurrentAssignment(null);
    setFormData({
      title: "",
      courseName: "",
      deadline: "",
      status: "draft",
      description: "",
      priority: "medium",
      maxFileSize: 50,
      allowedTypes: [],
    });
    setAllowedTypesInput("");
    setIsModalVisible(true);
  };

  // 处理表单提交
  const handleSubmit = async () => {
    if (
      !formData.title ||
      !formData.courseName ||
      !formData.deadline ||
      !formData.priority ||
      !formData.maxFileSize ||
      !formData.description ||
      !formData.allowedTypes ||
      formData.allowedTypes.length === 0
    ) {
      message.error("请填写完整信息");
      return;
    }

    setLoading(true);
    try {
      if (currentAssignment) {
        // 编辑模式
        await AssignmentService.createAssignment({
          id: currentAssignment.id,
          name: formData.title!,
          subject_name: formData.courseName!,
          end_time: String(Math.floor(new Date(formData.deadline!).getTime() / 1000)),
          file_size: formData.maxFileSize || 50,
          status: String(STATE_STR_MAP_NUMBER[formData.status || "draft"]),
          file_type: formData.allowedTypes?.join(",") || "",
          description: formData.description || "",
          priority: PRIORITY_STR_MAP_NUMBER[formData.priority || "medium"],
        });
        await fetchAssignments(); // 刷新列表
        message.success("任务更新成功");
      } else {
        // 创建模式
        await AssignmentService.createAssignment({
          name: formData.title!,
          subject_name: formData.courseName!,
          end_time: String(Math.floor(new Date(formData.deadline!).getTime() / 1000)),
          file_size: formData.maxFileSize || 50,
          status: String(STATE_STR_MAP_NUMBER[formData.status || "draft"]),
          priority: PRIORITY_STR_MAP_NUMBER[formData.priority || "medium"],
          file_type: formData.allowedTypes?.join(",") || "",
          description: formData.description || "",
        });
        await fetchAssignments(); // 刷新列表
        message.success("任务发布成功");
      }
      setIsModalVisible(false);
    } catch (error: any) {
      console.error("操作失败:", error);
      message.error(error.message || "操作失败");
    } finally {
      setLoading(false);
    }
  };

  // 筛选逻辑 (仅在当前页搜索)
  const filteredAssignments = assignments.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) || item.courseName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // 分页逻辑
  const totalPages = Math.ceil(total / pageSize);
  const currentData = filteredAssignments;
  const startIndex = (currentPage - 1) * pageSize;

  // 生成页码数组
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, currentPage - 2);
      const end = Math.min(totalPages, start + maxVisiblePages - 1);

      if (start > 1) {
        pages.push(1);
        if (start > 2) pages.push("...");
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages) {
        if (end < totalPages - 1) pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: "确认删除",
      content: "您确定要删除这个任务吗？删除后无法恢复，且所有学生的提交记录也将被删除。",
      confirmText: "删除",
      cancelText: "取消",
    });

    if (isConfirmed) {
      setLoading(true);
      try {
        await AssignmentService.deleteAssignments({ ids: id });
        await fetchAssignments(); // 刷新列表
        message.success("任务已删除");
      } catch (error) {
        console.error("删除失败:", error);
        message.error("删除失败");
      } finally {
        setLoading(false);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className={`${styles.statusBadge} ${styles.statusActive}`}>
            <FaCheckCircle /> 进行中
          </span>
        );
      case "draft":
        return (
          <span className={`${styles.statusBadge} ${styles.statusDraft}`}>
            <FaEdit /> 草稿
          </span>
        );
      case "closed":
        return (
          <span className={`${styles.statusBadge} ${styles.statusClosed}`}>
            <FaTimesCircle /> 已结束
          </span>
        );
      default:
        return null;
    }
  };

  // 统计数据
  const stats = {
    total: assignments.length,
    active: assignments.filter((a) => a.status === "active").length,
    closed: assignments.filter((a) => a.status === "closed").length,
    draft: assignments.filter((a) => a.status === "draft").length,
  };

  if (loading) return <Loading />;

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>任务管理</h1>
          <p className={styles.pageDescription}>管理系统中的所有任务，包括发布、筛选和状态管理</p>
        </div>
        <div className={styles.headerActions}>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={openCreateModal}>
            <FaPlus /> 发布任务
          </button>
        </div>
      </div>
      <div className={styles.statsContainer}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.primary}`}>
            <FaBookOpen />
          </div>
          <div className={styles.statValue}>{stats.total}</div>
          <div className={styles.statLabel}>总任务数</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.success}`}>
            <FaCheckCircle />
          </div>
          <div className={styles.statValue}>{stats.active}</div>
          <div className={styles.statLabel}>进行中</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.error}`}>
            <FaTimesCircle />
          </div>
          <div className={styles.statValue}>{stats.closed}</div>
          <div className={styles.statLabel}>已结束</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.warning}`}>
            <FaEdit />
          </div>
          <div className={styles.statValue}>{stats.draft}</div>
          <div className={styles.statLabel}>草稿箱</div>
        </div>
      </div>

      <div className={styles.filterSection}>
        <div className={styles.filterHeader}>
          <h3 className={styles.filterTitle}>
            <FaFilter />
            筛选条件
          </h3>
        </div>
        <div className={styles.filterForm}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>搜索任务</label>
            <Input
              placeholder="搜索任务标题或类型名称..."
              value={searchTerm}
              onChange={(value) => setSearchTerm(value)}
              prefix={<FaSearch />}
              size="large"
              style={{ minHeight: "46px", height: "50px" }}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>任务状态</label>
            <CustomSelect
              name="状态筛选"
              options={[
                { id: "all", name: "所有状态", color: "var(--text-secondary)" },
                { id: "active", name: "进行中", color: "var(--success)" },
                { id: "closed", name: "已结束", color: "var(--error)" },
                { id: "draft", name: "草稿", color: "var(--warning)" },
              ]}
              value={{
                id: statusFilter,
                name:
                  statusFilter === "all"
                    ? "所有状态"
                    : statusFilter === "active"
                      ? "进行中"
                      : statusFilter === "closed"
                        ? "已结束"
                        : "草稿",
                color: "",
              }}
              onChange={(option) => setStatusFilter(option ? String(option.id) : "all")}
              placeholder="状态筛选"
              hideBadge={true}
            />
          </div>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <h3 className={styles.tableTitle}>任务列表</h3>
          <div className={styles.tableActions}>
            <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>共 {total} 个任务</span>
          </div>
        </div>
        <table className={styles.assignmentTable}>
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>任务信息</th>
              <th>所属类型</th>
              <th>优先级</th>
              <th>截止时间</th>
              <th>提交情况</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {currentData.length > 0 ? (
              currentData.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className={styles.userInfo}>
                      <div
                        className={styles.userAvatar}
                        style={{
                          background: "var(--primary-light)",
                          color: "var(--primary)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <FaBookOpen />
                      </div>
                      <div className={styles.userDetails}>
                        <div className={styles.userName}>{item.title}</div>
                        <div className={styles.userEmail}>
                          {item.description && (
                            <span
                              style={{
                                fontSize: "12px",
                                color: "var(--text-secondary)",
                                lineHeight: "1.4",
                              }}
                            >
                              {item.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{item.courseName}</td>
                  <td style={{ textAlign: "center" }}>
                    <span className={`${styles.priorityBadge} ${styles[item.priority]}`}>
                      <FaFlag />
                      {item.priority === "low" && "低"}
                      {item.priority === "medium" && "中"}
                      {item.priority === "high" && "高"}
                      {item.priority === "urgent" && "紧急"}
                    </span>
                  </td>
                  <td>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        fontSize: "13px",
                        color: "var(--text-secondary)",
                      }}
                    >
                      <FaClock /> {item.deadline}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: "13px" }}>
                      <span style={{ color: "var(--primary)", fontWeight: 600 }}>{item.submissionCount}</span>
                      <span style={{ color: "var(--text-secondary)" }}> / {item.totalStudents}</span>
                    </div>
                    <div
                      style={{
                        width: "100px",
                        height: "4px",
                        background: "var(--border-secondary)",
                        borderRadius: "2px",
                        margin: "4px auto 0",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${(item.submissionCount / item.totalStudents) * 100}%`,
                          height: "100%",
                          background: "var(--primary)",
                        }}
                      />
                    </div>
                  </td>
                  <td>{getStatusBadge(item.status)}</td>
                  <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{item.createdAt}</td>
                  <td>
                    <div className={styles.actionButtons}>
                      <button className={styles.actionBtn} title="查看详情" onClick={() => openPreviewModal(item)}>
                        <FaEye />
                      </button>
                      <button className={styles.actionBtn} title="编辑" onClick={() => openEditModal(item)}>
                        <FaEdit />
                      </button>
                      <button className={`${styles.actionBtn} ${styles.delete}`} title="删除" onClick={() => handleDelete(item.id)}>
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    color: "var(--text-secondary)",
                  }}
                >
                  暂无数据
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {totalPages >= 1 && (
          <div className={styles.pagination}>
            <span className={styles.pageInfo}>
              显示 {startIndex + 1} - {Math.min(startIndex + pageSize, total)} 条， 共 {total} 条记录
            </span>
            <div className={styles.pageButtons}>
              <button className={styles.pageBtn} disabled={currentPage === 1} onClick={() => setCurrentPage(1)}>
                <FaAngleDoubleLeft />
              </button>
              <button className={styles.pageBtn} disabled={currentPage === 1} onClick={() => setCurrentPage((prev) => prev - 1)}>
                <FaChevronLeft />
              </button>
              {getPageNumbers().map((page, index) => (
                <React.Fragment key={index}>
                  {page === "..." ? (
                    <span className={styles.paginationEllipsis}>...</span>
                  ) : (
                    <button
                      className={`${styles.pageBtn} ${currentPage === page ? styles.active : ""}`}
                      onClick={() => setCurrentPage(page as number)}
                    >
                      {page}
                    </button>
                  )}
                </React.Fragment>
              ))}
              <button
                className={styles.pageBtn}
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
              >
                <FaChevronRight />
              </button>
              <button className={styles.pageBtn} disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)}>
                <FaAngleDoubleRight />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 创建/编辑模态框 */}
      <Modal
        visible={isModalVisible}
        title={currentAssignment ? "编辑任务" : "发布新任务"}
        onClose={() => setIsModalVisible(false)}
        width={600}
        footer={
          <>
            <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setIsModalVisible(false)}>
              取消
            </button>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleSubmit}>
              {currentAssignment ? "保存修改" : "立即发布"}
            </button>
          </>
        }
      >
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>任务标题 *</label>
          <Input
            placeholder="请输入任务标题"
            value={formData.title || ""}
            onChange={(value) => setFormData({ ...formData, title: value })}
            className={styles.formInput}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>所属类型 *</label>
          <Input
            placeholder="请输入类型名称"
            value={formData.courseName || ""}
            onChange={(value) => setFormData({ ...formData, courseName: value })}
            className={styles.formInput}
          />
        </div>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>截止时间 *</label>
            <DatePicker
              showTime
              value={formData.deadline ? new Date(formData.deadline) : undefined}
              onChange={(date) =>
                setFormData({
                  ...formData,
                  deadline: date ? date.toISOString() : "",
                })
              }
              size="large"
              className={styles.formInput}
              style={{ width: "100%" }}
              placeholder="请选择截止时间"
              format="YYYY-MM-DD HH:mm:ss"
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>文件大小限制 (MB) *</label>
            <Input
              type="number"
              placeholder="请输入最大文件大小 (不超过96MB)"
              value={String(formData.maxFileSize || "")}
              onChange={(value) => {
                const num = Number(value);
                if (num > 96) {
                  message.error("文件大小不能超过96MB");
                  return;
                }
                setFormData({ ...formData, maxFileSize: num });
              }}
              className={styles.formInput}
            />
          </div>
        </div>
        <div style={{ display: "flex", gap: "20px" }}>
          <div className={styles.formGroup} style={{ flex: 1 }}>
            <label className={styles.formLabel}>任务状态 *</label>
            <CustomSelect
              name="状态选择"
              options={[
                { id: "active", name: "进行中", color: "var(--success)" },
                { id: "closed", name: "已结束", color: "var(--error)" },
                { id: "draft", name: "草稿", color: "var(--warning)" },
              ]}
              value={{
                id: formData.status || "draft",
                name: formData.status === "active" ? "进行中" : formData.status === "closed" ? "已结束" : "草稿",
                color: "",
              }}
              onChange={(option) => setFormData({ ...formData, status: option?.id as any })}
              placeholder="请选择状态"
              hideBadge={true}
            />
          </div>
          <div className={styles.formGroup} style={{ flex: 1 }}>
            <label className={styles.formLabel}>优先级 *</label>
            <CustomSelect
              name="优先级选择"
              options={[
                { id: "low", name: "低", color: "#6c757d" },
                { id: "medium", name: "中", color: "#ffc107" },
                { id: "high", name: "高", color: "#ff9800" },
                { id: "urgent", name: "紧急", color: "#dc3545" },
              ]}
              value={{
                id: formData.priority || "medium",
                name:
                  formData.priority === "low"
                    ? "低"
                    : formData.priority === "medium"
                      ? "中"
                      : formData.priority === "high"
                        ? "高"
                        : "紧急",
                color: "",
              }}
              onChange={(option) => setFormData({ ...formData, priority: option?.id as any })}
              placeholder="请选择优先级"
              hideBadge={true}
            />
          </div>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>允许文件格式 (用逗号分隔) *</label>
          <Input
            placeholder="例如: .pdf, .doc, .zip"
            value={allowedTypesInput}
            onChange={(value) => {
              setAllowedTypesInput(value);
              setFormData((prev) => ({
                ...prev,
                allowedTypes: value
                  .split(/[,，]/)
                  .map((t) => t.trim())
                  .filter((t) => t),
              }));
            }}
            className={styles.formInput}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>任务描述 *</label>
          <textarea
            className={styles.formTextarea}
            placeholder="请输入任务详细描述..."
            value={formData.description || ""}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>
      </Modal>

      {/* 预览模态框 */}
      <Modal
        visible={isPreviewVisible}
        title="任务详情预览"
        onClose={() => setIsPreviewVisible(false)}
        width={600}
        footer={
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setIsPreviewVisible(false)}>
            关闭
          </button>
        }
      >
        {currentAssignment && (
          <div>
            <div className={styles.detailGroup}>
              <div className={styles.detailLabel}>任务标题</div>
              <div className={styles.detailValue} style={{ fontSize: "18px", fontWeight: 600 }}>
                {currentAssignment.title}
              </div>
            </div>

            <div className={styles.detailRow}>
              <div className={styles.detailGroup}>
                <div className={styles.detailLabel}>所属类型</div>
                <div className={styles.detailValue}>{currentAssignment.courseName}</div>
              </div>
              <div className={styles.detailGroup}>
                <div className={styles.detailLabel}>当前状态</div>
                <div className={styles.detailValue}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    {getStatusBadge(currentAssignment.status)}
                    <span className={`${styles.priorityBadge} ${styles[currentAssignment.priority]}`} style={{ marginLeft: "8px" }}>
                      <FaFlag />
                      {currentAssignment.priority === "low" && "低"}
                      {currentAssignment.priority === "medium" && "中"}
                      {currentAssignment.priority === "high" && "高"}
                      {currentAssignment.priority === "urgent" && "紧急"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.detailRow}>
              <div className={styles.detailGroup}>
                <div className={styles.detailLabel}>截止时间</div>
                <div className={styles.detailValue}>{currentAssignment.deadline}</div>
              </div>
              <div className={styles.detailGroup}>
                <div className={styles.detailLabel}>创建时间</div>
                <div className={styles.detailValue}>{currentAssignment.createdAt}</div>
              </div>
            </div>

            <div className={styles.detailRow}>
              <div className={styles.detailGroup}>
                <div className={styles.detailLabel}>文件大小限制</div>
                <div className={styles.detailValue}>
                  {currentAssignment.maxFileSize ? `${currentAssignment.maxFileSize} MB` : "未设置"}
                </div>
              </div>
              <div className={styles.detailGroup}>
                <div className={styles.detailLabel}>允许文件格式</div>
                <div className={styles.detailValue}>{currentAssignment.allowedTypes?.join(", ") || "不限"}</div>
              </div>
            </div>

            <div className={styles.detailGroup}>
              <div className={styles.detailLabel}>提交情况</div>
              <div className={styles.detailValue}>
                已提交 {currentAssignment.submissionCount} / 共 {currentAssignment.totalStudents} 人
                <div
                  style={{
                    width: "100%",
                    height: "6px",
                    background: "var(--bg-secondary)",
                    borderRadius: "3px",
                    marginTop: "8px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${(currentAssignment.submissionCount / currentAssignment.totalStudents) * 100}%`,
                      height: "100%",
                      background: "var(--primary)",
                    }}
                  />
                </div>
              </div>
            </div>

            <div className={styles.detailGroup}>
              <div className={styles.detailLabel}>任务描述</div>
              <div
                className={styles.detailValue}
                style={{
                  background: "var(--bg-secondary)",
                  padding: "12px",
                  borderRadius: "6px",
                  minHeight: "80px",
                }}
              >
                {currentAssignment.description || "暂无描述"}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AssignmentManagement;
