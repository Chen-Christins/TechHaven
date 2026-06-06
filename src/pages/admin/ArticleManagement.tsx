import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { encodeId } from "../../utils/hashId";
import {
  FaFileAlt,
  FaPlus,
  FaFilter,
  FaEdit,
  FaTrash,
  FaEye,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaThumbsUp,
  FaThumbsDown,
  FaBan,
  FaHourglassHalf,
  FaTimes,
  FaStar,
  FaFlag,
  FaTags,
  FaUser,
  FaCalendar,
  FaClock,
  FaHeart,
  FaComment,
  FaClipboardCheck,
} from "react-icons/fa";
import CustomSelect from "../../components/customSelect/CustomSelect";
import Input from "../../components/input/Input";
import Loading from "../../components/loading/Loading";
import { confirm } from "../../components/confirm/Confirm";
import type { SelectOption } from "../../types/index";
import styles from "./ArticleManagement.module.css";
import ArticleService, { type ListAdminArticlesResponse, type ArticleStatsResponse } from "../../services/articleService";
import { CategoryService } from "../../services/categoryService";
import { formatToChinaTime } from "../../utils/utils";
import message from "../../components/message/Message";

// 文章接口定义
interface Article {
  id: string;
  title: string;
  slug: string;
  summary: string;
  author: string;
  authorEmail: string;
  authorRole: string;
  category: string;
  tags: string[];
  status: "pending" | "published" | "rejected" | "private";
  featured: boolean;
  views: number;
  likes: number;
  comments: number;
  readTime: number;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  reportCount: number;
  isReported: boolean;
}

// 统计数据接口
interface ArticleStats {
  totalArticles: number;
  pendingArticles: number;
  publishedArticles: number;
  rejectedArticles: number;
  reportedArticles: number;
}

// 筛选条件接口
interface FilterOptions {
  search: string;
  status: string;
  category: string;
  authorRole: string;
  dateRange: string;
}

// 状态映射
const STATE_MAP: Record<number, Article["status"]> = {
  1: "pending",
  2: "published",
  3: "rejected",
  4: "private",
};

const ROLE_MAP: Record<number, string> = {
  1: "用户",
  2: "管理员",
  3: "编辑",
  4: "审核员",
};

const REVERSE_ROLE_MAP: Record<string, number> = {
  user: 1,
  admin: 2,
  editor: 3,
  checker: 4,
};

const REVERSE_STATE_MAP: Record<string, number> = {
  pending: 1,
  published: 2,
  rejected: 3,
  private: 4,
};

const ArticleManagement: React.FC = () => {
  const navigate = useNavigate();
  // 状态管理
  const [articles, setArticles] = useState<Article[]>([]);
  const [stats, setStats] = useState<ArticleStats>({
    totalArticles: 0,
    pendingArticles: 0,
    publishedArticles: 0,
    rejectedArticles: 0,
    reportedArticles: 0,
  });
  const [filters, setFilters] = useState<FilterOptions>({
    search: "",
    status: "",
    category: "",
    authorRole: "",
    dateRange: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [categoryOptions, setCategoryOptions] = useState<SelectOption[]>([{ id: "", name: "全部分类", color: "#6c757d" }]);

  const [totalArticles, setTotalArticles] = useState(0);
  const articlesPerPage = 15; // 每页显示15条数据

  // 加载分类数据
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await CategoryService.queryCategory();
        if (res) {
          const options = res.list.map((cat) => ({
            id: cat.id,
            name: cat.name,
            color: cat.color || "#007bff",
          }));
          setCategoryOptions([{ id: "", name: "全部分类", color: "#6c757d" }, ...options]);
        }
      } catch (error) {
        console.error("获取分类失败:", error);
      }
    };
    fetchCategories();
  }, []);

  // 加载统计数据
  const fetchStats = async () => {
    try {
      const days =
        filters.dateRange === "7days" ? 7 : filters.dateRange === "30days" ? 30 : filters.dateRange === "90days" ? 90 : undefined;

      const res: ArticleStatsResponse = await ArticleService.getAdminArticleStats({
        category_id: filters.category || undefined,
        role: filters.authorRole ? REVERSE_ROLE_MAP[filters.authorRole] : undefined,
        days,
        keyword: filters.search || undefined,
      });
      setStats({
        totalArticles: res.total_articles,
        pendingArticles: res.pending_articles,
        publishedArticles: res.published_articles,
        rejectedArticles: res.rejected_articles,
        reportedArticles: res.reported_articles,
      });
    } catch (error) {
      console.error("获取统计数据失败:", error);
    }
  };

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // 加载文章数据
  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        const stateValue = filters.status ? REVERSE_STATE_MAP[filters.status] : 0;

        // 处理日期筛选
        let days: number | undefined;
        if (filters.dateRange === "7days") days = 7;
        else if (filters.dateRange === "30days") days = 30;
        else if (filters.dateRange === "90days") days = 90;

        const res: ListAdminArticlesResponse = await ArticleService.listAdminArticlesByPages({
          page_num: currentPage,
          page_size: articlesPerPage,
          state: stateValue || 0, // 获取所有状态的文章
          keyword: filters.search,
          category_id: filters.category,
          role: filters.authorRole ? REVERSE_ROLE_MAP[filters.authorRole] : -1,
          days: days,
        });

        setTotalArticles(res.total);
        setArticles(
          (res.list || []).map((article) => ({
            id: String(article.id),
            title: article.title,
            slug: "asdasdsad", // 占位符，API未提供
            summary: article.summary.substring(0, 45) + "...",
            author: article.author,
            authorEmail: article.email,
            authorRole: ROLE_MAP[article.author_role] || "用户", // 使用API提供的author_role字段
            category: "默认分类", // 占位符，API未提供
            tags: [], // 占位符，API未提供
            status: STATE_MAP[article.state] || "draft",
            featured: false, // 占位符，API未提供
            views: article.views ?? 0,
            likes: article.praise ?? 0,
            comments: article.favorites ?? 0,
            readTime: 0, // 占位符，API未提供
            publishedAt: article.publish_time ? formatToChinaTime(Number(article.publish_time)) : "暂未发布",
            createdAt: formatToChinaTime(Number(article.publish_time)),
            updatedAt: formatToChinaTime(Number(article.update_time)),
            reviewedAt: undefined,
            reviewedBy: undefined,
            rejectionReason: undefined,
            reportCount: 0,
            isReported: false,
          })),
        );
      } catch (error) {
        console.error("获取文章列表失败:", error);
        setTotalArticles(0);
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [currentPage, filters]);

  // 筛选文章数据
  const filteredArticles = useMemo(() => {
    return articles;
  }, [articles]);

  // 分页计算
  const totalPages = Math.ceil(totalArticles / articlesPerPage);
  const startIndex = (currentPage - 1) * articlesPerPage;
  const endIndex = startIndex + articles.length;
  const currentArticles = filteredArticles;

  // 筛选选项数据
  const statusOptions: SelectOption[] = [
    { id: "", name: "全部状态", color: "#6c757d" },
    { id: "pending", name: "待审核", color: "#ffc107" },
    { id: "published", name: "已发布", color: "#007bff" },
    { id: "rejected", name: "已拒绝", color: "#dc3545" },
    { id: "private", name: "私密", color: "#9129e7ff" },
  ];

  const authorRoleOptions: SelectOption[] = [
    { id: "", name: "全部角色", color: "#6c757d" },
    { id: "admin", name: "管理员", color: "#dc3545" },
    { id: "editor", name: "编辑", color: "#28a745" },
    { id: "checker", name: "审核员", color: "#007bff" },
    { id: "user", name: "普通用户", color: "#6c757d" },
  ];

  const dateRangeOptions: SelectOption[] = [
    { id: "", name: "全部时间", color: "#6c757d" },
    { id: "7days", name: "最近7天", color: "#17a2b8" },
    { id: "30days", name: "最近30天", color: "#17a2b8" },
    { id: "90days", name: "最近90天", color: "#17a2b8" },
  ];

  // 处理CustomSelect选择
  const handleSelectChange = (field: keyof FilterOptions) => {
    return (selectedOption: SelectOption | null) => {
      setFilters((prev) => ({
        ...prev,
        [field]: selectedOption?.id || "",
      }));
      setCurrentPage(1); // 任何筛选条件变化都重置页码
    };
  };

  // 处理筛选条件变化（用于搜索框）
  const handleFilterChange = (field: keyof FilterOptions, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
    setCurrentPage(1); // 搜索条件变化重置页码
  };

  // 清除筛选条件
  const clearFilters = () => {
    setFilters({
      search: "",
      status: "",
      category: "",
      authorRole: "",
      dateRange: "",
    });
  };

  // 审批文章 - 通过
  const approveArticle = async (article: Article) => {
    await confirm({
      title: "审批通过",
      content: (
        <div>
          <p>
            确定要通过文章 "<strong>{article.title}</strong>" 的审核吗？
          </p>
          <p>文章通过后将会发布到系统中。</p>
        </div>
      ),
      confirmText: "通过审核",
      cancelText: "取消",
      onConfirm: async () => {
        try {
          await ArticleService.verifyArticle({
            id: article.id,
            state: REVERSE_STATE_MAP["published"],
          });

          setArticles((prev) =>
            prev.map((a) =>
              a.id === article.id
                ? {
                    ...a,
                    status: "published",
                    reviewedAt: new Date().toISOString().split("T")[0],
                    reviewedBy: "当前管理员",
                    updatedAt: new Date().toISOString().split("T")[0],
                  }
                : a,
            ),
          );
          fetchStats();
        } catch (error) {
          console.error("审核失败:", error);
          message.error("操作失败，请重试");
        }
      },
    });
  };

  // 审批文章 - 拒绝
  const rejectArticle = async (article: Article, reason: string) => {
    await confirm({
      title: "审批拒绝",
      content: (
        <div>
          <p>
            确定要拒绝文章 "<strong>{article.title}</strong>" 的审核吗？
          </p>
          <p>
            拒绝原因：<strong>{reason}</strong>
          </p>
          <p style={{ color: "var(--warning-color)" }}>作者将需要修改后重新提交审核。</p>
        </div>
      ),
      confirmText: "拒绝审核",
      cancelText: "取消",
      onConfirm: async () => {
        try {
          await ArticleService.verifyArticle({
            id: article.id,
            state: REVERSE_STATE_MAP["rejected"],
          });

          setArticles((prev) =>
            prev.map((a) =>
              a.id === article.id
                ? {
                    ...a,
                    status: "rejected",
                    rejectionReason: reason,
                    reviewedAt: new Date().toISOString().split("T")[0],
                    reviewedBy: "当前管理员",
                    updatedAt: new Date().toISOString().split("T")[0],
                  }
                : a,
            ),
          );
          fetchStats();
        } catch (error) {
          console.error("拒绝失败:", error);
          message.error("操作失败，请重试");
        }
      },
    });
  };

  // 下架文章
  const unpublishArticle = async (article: Article) => {
    await confirm({
      title: "下架文章",
      content: (
        <div>
          <p>
            确定要下架文章 "<strong>{article.title}</strong>" 吗？
          </p>
          <p style={{ color: "var(--warning-color)" }}>下架后文章将不再对用户可见。</p>
        </div>
      ),
      confirmText: "确认下架",
      cancelText: "取消",
      onConfirm: async () => {
        try {
          // 下架转为私密状态
          await ArticleService.switchArticleState({
            id: article.id,
            state: REVERSE_STATE_MAP["rejected"],
          });

          setArticles((prev) =>
            prev.map((a) =>
              a.id === article.id
                ? {
                    ...a,
                    status: "rejected",
                    updatedAt: new Date().toISOString().split("T")[0],
                  }
                : a,
            ),
          );
          fetchStats();
        } catch (error) {
          console.error("下架失败:", error);
          message.error("操作失败，请重试");
        }
      },
    });
  };

  // 查看文章详情
  const handleViewArticle = (id: string) => {
    navigate(`/article/${encodeId(id)}`);
  };

  // 编辑文章
  const handleEditArticle = (id: string) => {
    navigate(`/article/edit/${encodeId(id)}`);
  };

  // 删除文章
  const deleteArticle = async (articleId: string, articleTitle: string) => {
    await confirm({
      title: "删除文章",
      content: (
        <div>
          <p>
            确定要删除文章 "<strong>{articleTitle}</strong>" 吗？
          </p>
          <p style={{ color: "var(--error)" }}>此操作不可恢复。</p>
        </div>
      ),
      confirmText: "确认删除",
      cancelText: "取消",
      onConfirm: async () => {
        try {
          await ArticleService.deleteArticle({ ids: articleId });
          setArticles((prev) => prev.filter((article) => article.id !== articleId));
          setTotalArticles((prev) => Math.max(0, prev - 1));
          fetchStats();

          if (articles.length === 1 && currentPage > 1) {
            setCurrentPage((prev) => prev - 1);
          }
        } catch (error) {
          console.error("删除失败:", error);
          message.error("删除失败，请重试");
        }
      },
    });
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
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
      <div className={styles.articleManagement}>
        <Loading text="加载文章数据中..." size="large" />
      </div>
    );
  }

  return (
    <div className={styles.articleManagement}>
      {/* 页面头部 */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>文章管理</h1>
          <p className={styles.pageDescription}>管理系统中的所有文章内容，包括审核流程和发布管理</p>
        </div>
        <div className={styles.headerActions}>
          <button className={`${styles.btn} ${styles.btnPrimary}`}>
            <FaPlus />
            新增文章
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className={styles.statsContainer}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.primary}`}>
            <FaFileAlt />
          </div>
          <div className={styles.statValue}>{stats.totalArticles}</div>
          <div className={styles.statLabel}>总文章数</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.warning}`}>
            <FaHourglassHalf />
          </div>
          <div className={styles.statValue}>{stats.pendingArticles}</div>
          <div className={styles.statLabel}>待审核</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.success}`}>
            <FaEye />
          </div>
          <div className={styles.statValue}>{stats.publishedArticles}</div>
          <div className={styles.statLabel}>已发布</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.error}`}>
            <FaTimes />
          </div>
          <div className={styles.statValue}>{stats.rejectedArticles}</div>
          <div className={styles.statLabel}>已拒绝</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.reported}`}>
            <FaFlag />
          </div>
          <div className={styles.statValue}>{stats.reportedArticles}</div>
          <div className={styles.statLabel}>被举报</div>
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
            <label className={styles.filterLabel}>搜索文章</label>
            <Input
              placeholder="标题、内容或作者"
              value={filters.search}
              onChange={(value) => handleFilterChange("search", value)}
              allowClear={true}
              size="large"
              style={{ minHeight: "46px", height: "50px" }}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>文章状态</label>
            <CustomSelect
              name="文章状态"
              options={statusOptions}
              value={statusOptions.find((option) => option.id === filters.status) || null}
              onChange={handleSelectChange("status")}
              placeholder="选择状态..."
              className="adminCustomSelect"
              hideBadge={true}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>文章分类</label>
            <CustomSelect
              name="文章分类"
              options={categoryOptions}
              value={categoryOptions.find((option) => option.id === filters.category) || null}
              onChange={handleSelectChange("category")}
              placeholder="选择分类..."
              className="adminCustomSelect"
              hideBadge={true}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>作者角色</label>
            <CustomSelect
              name="作者角色"
              options={authorRoleOptions}
              value={authorRoleOptions.find((option) => option.id === filters.authorRole) || null}
              onChange={handleSelectChange("authorRole")}
              placeholder="选择角色..."
              className="adminCustomSelect"
              hideBadge={true}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>创建时间</label>
            <CustomSelect
              name="创建时间"
              options={dateRangeOptions}
              value={dateRangeOptions.find((option) => option.id === filters.dateRange) || null}
              onChange={handleSelectChange("dateRange")}
              placeholder="选择时间范围..."
              className="adminCustomSelect"
              hideBadge={true}
            />
          </div>
        </div>
      </div>

      {/* 文章表格 */}
      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <h3 className={styles.tableTitle}>文章列表</h3>
          <div className={styles.tableActions}>
            <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>共 {totalArticles} 篇文章</span>
          </div>
        </div>
        <table className={styles.articlesTable}>
          <thead>
            <tr>
              <th>文章信息</th>
              <th>作者</th>
              <th>分类</th>
              <th>状态</th>
              <th>统计数据</th>
              <th>发布时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {currentArticles.length > 0 ? (
              currentArticles.map((article) => (
                <tr key={article.id} className={`${article.featured ? styles.featured : ""}`}>
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
                        <FaFileAlt />
                      </div>
                      <div className={styles.userDetails}>
                        <div className={styles.userName}>{article.title}</div>
                        <div className={styles.userEmail}>
                          {article.featured && (
                            <span className={styles.featuredTag}>
                              <FaStar /> 置顶
                            </span>
                          )}
                          {article.summary && (
                            <span
                              style={{
                                fontSize: "12px",
                                color: "var(--text-secondary)",
                                lineHeight: "1.4",
                              }}
                            >
                              {article.summary}
                            </span>
                          )}
                          {article.isReported && (
                            <span className={styles.reportedTag} style={{ marginLeft: "8px" }}>
                              <FaFlag /> 举报 {article.reportCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className={styles.authorInfo}>
                      <div className={styles.authorName}>
                        <FaUser /> {article.author}
                        <span className={styles.authorRole}>({article.authorRole})</span>
                      </div>
                      <div className={styles.authorEmail}>{article.authorEmail}</div>
                    </div>
                  </td>
                  <td>
                    <span className={styles.categoryTag}>
                      <FaTags /> {article.category}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles[article.status]}`}>
                      <span className={styles.statusIndicator}></span>
                      {article.status === "pending" && (
                        <>
                          <FaHourglassHalf /> 待审核
                        </>
                      )}
                      {article.status === "published" && (
                        <>
                          <FaEye /> 已发布
                        </>
                      )}
                      {article.status === "rejected" && (
                        <>
                          <FaTimes /> 已拒绝
                        </>
                      )}
                      {article.status === "private" && (
                        <>
                          <FaClipboardCheck /> 私密
                        </>
                      )}
                    </span>
                    {(article.status === "pending" || article.status === "rejected" || article.status === "published") && (
                      <div className={styles.reviewInfo}>
                        {article.reviewedBy && <div className={styles.reviewedBy}>审核人：{article.reviewedBy}</div>}
                        {article.reviewedAt && <div className={styles.reviewedAt}>{article.reviewedAt}</div>}
                      </div>
                    )}
                  </td>
                  <td>
                    <div className={styles.statsInfo}>
                      <div>
                        <FaEye /> {article.views.toLocaleString()}
                      </div>
                      <div>
                        <FaHeart /> {article.likes}
                      </div>
                      <div>
                        <FaComment /> {article.comments}
                      </div>
                      <div>
                        <FaClock /> {article.readTime}分钟
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className={styles.dateInfo}>
                      <div>
                        {article.publishedAt ? (
                          <>
                            <FaCalendar /> {article.publishedAt}
                          </>
                        ) : (
                          <>
                            <FaClock /> {formatDate(article.createdAt)}
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className={styles.actionButtons}>
                      {/* 管理员审批操作 */}
                      {article.status === "pending" && (
                        <>
                          <button
                            className={`${styles.actionButton} ${styles.approve}`}
                            title="通过审核"
                            onClick={() => approveArticle(article)}
                          >
                            <FaThumbsUp />
                          </button>
                          <button
                            className={`${styles.actionButton} ${styles.reject}`}
                            title="拒绝审核"
                            onClick={() => rejectArticle(article, "内容质量不达标")}
                          >
                            <FaThumbsDown />
                          </button>
                        </>
                      )}

                      {/* 已发布文章可以下架 */}
                      {article.status === "published" && (
                        <button
                          className={`${styles.actionButton} ${styles.unpublish}`}
                          title="下架文章"
                          onClick={() => unpublishArticle(article)}
                        >
                          <FaBan />
                        </button>
                      )}

                      <button
                        className={`${styles.actionButton} ${styles.edit}`}
                        title="编辑文章"
                        onClick={() => handleEditArticle(article.id)}
                      >
                        <FaEdit />
                      </button>
                      <button
                        className={`${styles.actionButton} ${styles.edit}`}
                        title="查看详情"
                        onClick={() => handleViewArticle(article.id)}
                      >
                        <FaEye />
                      </button>
                      <button
                        className={`${styles.actionButton} ${styles.delete}`}
                        title="删除文章"
                        onClick={() => deleteArticle(article.id, article.title)}
                      >
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

        {/* 分页 */}
        {totalPages >= 1 && (
          <div className={styles.paginationContainer}>
            <div className={styles.paginationInfo}>
              显示 {totalArticles > 0 ? startIndex + 1 : 0} - {Math.min(endIndex, totalArticles)} 条， 共 {totalArticles} 条记录
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
    </div>
  );
};

export default ArticleManagement;
