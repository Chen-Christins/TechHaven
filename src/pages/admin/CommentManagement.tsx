import React, { useState, useEffect, useCallback } from "react";
import {
  FaFilter,
  FaReply,
  FaTrash,
  FaBan,
  FaCheck,
  FaEye,
  FaEyeSlash,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaUser,
  FaFileAlt,
  FaClock,
  FaExclamationTriangle,
  FaStar,
  FaFlag,
} from "react-icons/fa";
import CustomSelect from "../../components/customSelect/CustomSelect";
import Input from "../../components/input/Input";
import Loading from "../../components/loading/Loading";
import { confirm } from "../../components/confirm/Confirm";
import CommentService from "../../services/commentService";
import type { AdminComment } from "../../types/comment";
import type { SelectOption } from "../../types/index";
import styles from "./CommentManagement.module.css";

interface FilterOptions {
  search: string;
  status: string;
  articleId: string;
  dateRange: string;
  isReported: string;
}

const PAGE_SIZE = 10;

const CommentManagement: React.FC = () => {
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<FilterOptions>({
    search: "",
    status: "",
    articleId: "",
    dateRange: "",
    isReported: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedComments, setSelectedComments] = useState<string[]>([]);
  const [showReplies, setShowReplies] = useState<string[]>([]);

  // 加载数据
  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const params: {
        page_num: number;
        page_size: number;
        status?: string;
        keyword?: string;
        article_id?: string;
        is_reported?: number;
      } = {
        page_num: currentPage,
        page_size: PAGE_SIZE,
      };
      if (filters.status) params.status = filters.status;
      if (filters.search) params.keyword = filters.search;
      if (filters.articleId) params.article_id = filters.articleId;
      if (filters.isReported) params.is_reported = filters.isReported === "true" ? 1 : 0;

      const data = await CommentService.getAdminList(params);
      setComments(data.list);
      setTotal(data.total);
    } catch {
      // error handled by interceptor
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // 筛选时重置页码
  const updateFilter = useCallback((field: keyof FilterOptions, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  }, []);

  // 分页计算
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const startIndex = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endIndex = Math.min(currentPage * PAGE_SIZE, total);

  // 筛选选项数据
  const statusOptions: SelectOption[] = [
    { id: "", name: "全部状态", color: "#6c757d" },
    { id: "approved", name: "已通过", color: "#28a745" },
    { id: "pending", name: "待审核", color: "#ffc107" },
    { id: "rejected", name: "已拒绝", color: "#dc3545" },
    { id: "spam", name: "垃圾评论", color: "#dc3545" },
  ];

  const reportedOptions: SelectOption[] = [
    { id: "", name: "全部", color: "#6c757d" },
    { id: "true", name: "被举报", color: "#dc3545" },
    { id: "false", name: "正常", color: "#28a745" },
  ];

  const handleSelectChange = (field: keyof FilterOptions) => {
    return (selectedOption: SelectOption | null) => {
      updateFilter(field, selectedOption?.id?.toString() || "");
    };
  };

  const handleFilterChange = (field: keyof FilterOptions, value: string) => {
    updateFilter(field, value);
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      status: "",
      articleId: "",
      dateRange: "",
      isReported: "",
    });
    setCurrentPage(1);
  };

  // 批量操作

  const handleSelectComment = (commentId: string, checked: boolean) => {
    if (checked) {
      setSelectedComments((prev) => [...prev, commentId]);
    } else {
      setSelectedComments((prev) => prev.filter((id) => id !== commentId));
    }
  };

  // 批准评论
  const approveComments = async (commentIds: string[]) => {
    await confirm({
      title: "批准评论",
      content: `确定要批准选中的 ${commentIds.length} 条评论吗？`,
      confirmText: "确认批准",
      cancelText: "取消",
      onConfirm: async () => {
        await CommentService.approve(commentIds);
        setSelectedComments([]);
        fetchComments();
      },
    });
  };

  // 拒绝评论
  const rejectComments = async (commentIds: string[]) => {
    await confirm({
      title: "拒绝评论",
      content: `确定要拒绝选中的 ${commentIds.length} 条评论吗？`,
      confirmText: "确认拒绝",
      cancelText: "取消",
      onConfirm: async () => {
        await CommentService.reject(commentIds);
        setSelectedComments([]);
        fetchComments();
      },
    });
  };

  // 标记为垃圾评论
  const markAsSpam = async (commentIds: string[]) => {
    await confirm({
      title: "标记垃圾评论",
      content: `确定要将选中的 ${commentIds.length} 条评论标记为垃圾评论吗？`,
      confirmText: "确认标记",
      cancelText: "取消",
      onConfirm: async () => {
        await CommentService.markSpam(commentIds);
        setSelectedComments([]);
        fetchComments();
      },
    });
  };

  // 删除评论
  const deleteComments = async (commentIds: string[]) => {
    await confirm({
      title: "删除评论",
      content: `确定要删除选中的 ${commentIds.length} 条评论吗？删除后无法恢复。`,
      confirmText: "确认删除",
      cancelText: "取消",
      onConfirm: async () => {
        await CommentService.batchDelete(commentIds);
        setSelectedComments([]);
        fetchComments();
      },
    });
  };

  // 切换回复显示
  const toggleReplies = (commentId: string) => {
    setShowReplies((prev) => (prev.includes(commentId) ? prev.filter((id) => id !== commentId) : [...prev, commentId]));
  };

  // 格式化日期（Unix 时间戳）
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 获取回复评论
  const getReplies = (parentId: string) => {
    return comments.filter((comment) => comment.parent_id === parentId);
  };

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

  if (loading) {
    return (
      <div className={styles.commentManagement}>
        <Loading text="加载评论管理中..." size="large" />
      </div>
    );
  }

  return (
    <div className={styles.commentManagement}>
      {/* 页面头部 */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>评论管理</h1>
          <p className={styles.pageDescription}>管理用户评论、审核内容和处理举报</p>
        </div>
        <div className={styles.headerActions}>
          <span
            style={{
              fontSize: "14px",
              color: "var(--text-secondary)",
              marginRight: "12px",
            }}
          >
            共 {total} 条评论
          </span>
        </div>
      </div>

      {/* 筛选区域 */}
      <div className={styles.filterSection}>
        <div className={styles.filterHeader}>
          <h3 className={styles.filterTitle}>
            <FaFilter />
            筛选条件
          </h3>
          <div className={styles.filterActions}>
            <button className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`} onClick={clearFilters}>
              清除筛选
            </button>
          </div>
        </div>
        <div className={styles.filterForm}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>搜索评论</label>
            <Input
              placeholder="评论内容、作者或文章标题"
              value={filters.search}
              onChange={(value) => handleFilterChange("search", value)}
              allowClear={true}
              size="large"
              style={{ minHeight: "46px", height: "50px" }}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>状态</label>
            <CustomSelect
              name="状态"
              options={statusOptions}
              value={statusOptions.find((option) => option.id === filters.status) || null}
              onChange={handleSelectChange("status")}
              placeholder="选择状态..."
              className="adminCustomSelect"
              hideBadge={true}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>举报状态</label>
            <CustomSelect
              name="举报状态"
              options={reportedOptions}
              value={reportedOptions.find((option) => option.id === filters.isReported) || null}
              onChange={handleSelectChange("isReported")}
              placeholder="选择举报状态..."
              className="adminCustomSelect"
              hideBadge={true}
            />
          </div>
        </div>
      </div>

      {/* 批量操作栏 */}
      {selectedComments.length > 0 && (
        <div className={styles.batchActions}>
          <div className={styles.batchInfo}>已选择 {selectedComments.length} 条评论</div>
          <div className={styles.batchButtons}>
            <button className={`${styles.btn} ${styles.btnSuccess} ${styles.btnSm}`} onClick={() => approveComments(selectedComments)}>
              <FaCheck />
              批准
            </button>
            <button className={`${styles.btn} ${styles.btnWarning} ${styles.btnSm}`} onClick={() => rejectComments(selectedComments)}>
              <FaBan />
              拒绝
            </button>
            <button className={`${styles.btn} ${styles.btnDanger} ${styles.btnSm}`} onClick={() => markAsSpam(selectedComments)}>
              <FaExclamationTriangle />
              标记垃圾
            </button>
            <button className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`} onClick={() => deleteComments(selectedComments)}>
              <FaTrash />
              删除
            </button>
          </div>
        </div>
      )}

      {/* 评论列表 */}
      <div className={styles.commentsContainer}>
        {comments.length > 0 ? (
          comments.map((comment) => {
            const replies = getReplies(comment.id);
            const hasReplies = replies.length > 0;
            const showReplyList = showReplies.includes(comment.id);

            return (
              <div key={comment.id} className={styles.commentCard}>
                <div className={styles.commentHeader}>
                  <div className={styles.commentMeta}>
                    <input
                      type="checkbox"
                      checked={selectedComments.includes(comment.id)}
                      onChange={(e) => handleSelectComment(comment.id, e.target.checked)}
                      className={styles.commentCheckbox}
                    />
                    <div className={styles.authorInfo}>
                      <div className={styles.authorAvatar}>
                        {comment.author.avatar ? <img src={comment.author.avatar} alt={comment.author.name} /> : <FaUser />}
                      </div>
                      <div className={styles.authorDetails}>
                        <div className={styles.authorName}>{comment.author.name}</div>
                        <div className={styles.authorEmail}>{comment.author.email}</div>
                      </div>
                    </div>
                    <div className={styles.commentInfo}>
                      <span className={`${styles.statusBadge} ${styles[comment.status]}`}>
                        {comment.status === "approved" && "已通过"}
                        {comment.status === "pending" && "待审核"}
                        {comment.status === "rejected" && "已拒绝"}
                        {comment.status === "spam" && "垃圾评论"}
                      </span>
                      {comment.is_reported && (
                        <span className={styles.reportedBadge}>
                          <FaFlag />
                          举报 {comment.report_count}
                        </span>
                      )}
                      <span className={styles.commentTime}>
                        <FaClock />
                        {formatDate(comment.created_at)}
                      </span>
                    </div>
                  </div>
                  <div className={styles.commentActions}>
                    {comment.status === "pending" && (
                      <>
                        <button
                          className={`${styles.actionButton} ${styles.approve}`}
                          title="批准"
                          onClick={() => approveComments([comment.id])}
                        >
                          <FaCheck />
                        </button>
                        <button
                          className={`${styles.actionButton} ${styles.reject}`}
                          title="拒绝"
                          onClick={() => rejectComments([comment.id])}
                        >
                          <FaBan />
                        </button>
                      </>
                    )}
                    <button
                      className={`${styles.actionButton} ${styles.spam}`}
                      title="标记垃圾"
                      onClick={() => markAsSpam([comment.id])}
                    >
                      <FaExclamationTriangle />
                    </button>
                    <button
                      className={`${styles.actionButton} ${styles.delete}`}
                      title="删除"
                      onClick={() => deleteComments([comment.id])}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>

                <div className={styles.commentContent}>
                  <div className={styles.articleLink}>
                    <FaFileAlt />
                    文章：{comment.article.title}
                  </div>
                  <div className={styles.contentText}>{comment.content}</div>
                  <div className={styles.commentStats}>
                    <span className={styles.statItem}>
                      <FaStar />
                      {comment.likes} 赞
                    </span>
                    {hasReplies && (
                      <button className={styles.statItem} onClick={() => toggleReplies(comment.id)}>
                        <FaReply />
                        {replies.length} 回复
                        {showReplyList ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    )}
                  </div>
                </div>

                {/* 回复列表 */}
                {hasReplies && showReplyList && (
                  <div className={styles.repliesList}>
                    {replies.map((reply) => (
                      <div key={reply.id} className={styles.replyItem}>
                        <div className={styles.replyHeader}>
                          <div className={styles.replyAuthor}>
                            <div className={styles.replyAvatar}>
                              {reply.author.avatar ? <img src={reply.author.avatar} alt={reply.author.name} /> : <FaUser />}
                            </div>
                            <div className={styles.replyInfo}>
                              <span className={styles.replyName}>{reply.author.name}</span>
                              <span className={styles.replyTime}>{formatDate(reply.created_at)}</span>
                              <span className={`${styles.statusBadge} ${styles[reply.status]} ${styles.small}`}>
                                {reply.status === "approved" && "已通过"}
                                {reply.status === "pending" && "待审核"}
                                {reply.status === "rejected" && "已拒绝"}
                                {reply.status === "spam" && "垃圾评论"}
                              </span>
                            </div>
                          </div>
                          <div className={styles.replyActions}>
                            <button
                              className={`${styles.actionButton} ${styles.small}`}
                              title="删除"
                              onClick={() => deleteComments([reply.id])}
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                        <div className={styles.replyContent}>{reply.content}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              color: "var(--text-secondary)",
            }}
          >
            暂无数据
          </div>
        )}
      </div>

      {/* 分页 */}
      {totalPages >= 1 && (
        <div className={styles.paginationContainer}>
          <div className={styles.paginationInfo}>
            显示 {startIndex} - {endIndex} 条， 共 {total} 条评论
          </div>
          <div className={styles.paginationControls}>
            <button className={styles.paginationButton} onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
              <FaAngleDoubleLeft />
            </button>
            <button
              className={styles.paginationButton}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <FaChevronLeft />
            </button>

            {getPageNumbers().map((page, index) => (
              <React.Fragment key={index}>
                {page === "..." ? (
                  <span className={styles.paginationEllipsis}>...</span>
                ) : (
                  <button
                    className={`${styles.paginationButton} ${currentPage === page ? styles.active : ""}`}
                    onClick={() => setCurrentPage(page as number)}
                  >
                    {page}
                  </button>
                )}
              </React.Fragment>
            ))}

            <button
              className={styles.paginationButton}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              <FaChevronRight />
            </button>
            <button
              className={styles.paginationButton}
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <FaAngleDoubleRight />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentManagement;
