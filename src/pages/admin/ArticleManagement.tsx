import React, { useState, useEffect, useMemo } from 'react';
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
    FaCheckCircle,
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
    FaClipboardCheck
} from 'react-icons/fa';
import CustomSelect from '../../components/customSelect/CustomSelect';
import Input from '../../components/input/Input';
import Button from '../../components/button/Button';
import Loading from '../../components/loading/Loading';
import { confirm } from '../../components/confirm/Confirm';
import type { SelectOption } from '../../types/index';
import styles from './ArticleManagement.module.css';

// 文章接口定义
interface Article {
    id: string;
    title: string;
    slug: string;
    summary: string;
    author: string;
    authorEmail: string;
    authorRole: 'admin' | 'editor' | 'writer' | 'user';
    category: string;
    tags: string[];
    status: 'pending' | 'approved' | 'published' | 'rejected' | 'draft' | 'private';
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

const ArticleManagement: React.FC = () => {
    // 状态管理
    const [articles, setArticles] = useState<Article[]>([]);
    const [stats, setStats] = useState<ArticleStats>({
        totalArticles: 0,
        pendingArticles: 0,
        publishedArticles: 0,
        rejectedArticles: 0,
        reportedArticles: 0
    });
    const [filters, setFilters] = useState<FilterOptions>({
        search: '',
        status: '',
        category: '',
        authorRole: '',
        dateRange: ''
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);

    const articlesPerPage = 15; // 每页显示15条数据

    // 模拟文章数据
    const mockArticles: Article[] = Array.from({ length: 200 }, (_, index) => {
        const statuses: Article['status'][] = ['pending', 'approved', 'published', 'rejected', 'draft', 'private'];
        const categories = ['前端开发', '后端技术', '开发工具', '设计相关', '其他'];
        const authors = [
            { name: '张三', role: 'writer' as const, email: 'zhangsan@example.com' },
            { name: '李四', role: 'editor' as const, email: 'lisi@example.com' },
            { name: '王五', role: 'user' as const, email: 'wangwu@example.com' },
            { name: '赵六', role: 'writer' as const, email: 'zhaoliu@example.com' },
            { name: '陈七', role: 'admin' as const, email: 'chenqi@example.com' }
        ];
        const reviewers = ['管理员A', '管理员B', '超级管理员'];
        const authorData = authors[Math.floor(Math.random() * authors.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const isPublished = status === 'published';
        const isPending = status === 'pending';
        const isRejected = status === 'rejected';

        return {
            id: `article_${index + 1}`,
            title: `文章标题 ${index + 1}：${isPending ? '[待审核]' : isRejected ? '[已拒绝]' : isPublished ? '[已发布]' : '[草稿]'}${['React Hooks最佳实践', 'Vue3组合式API详解', 'TypeScript高级技巧', '前端性能优化指南', 'Node.js微服务架构'][index % 5]}`,
            slug: `article-${index + 1}-${['react-hooks', 'vue3-composition', 'typescript-tips', 'frontend-optimization', 'nodejs-microservices'][index % 5]}`,
            summary: `这是一篇${['技术分享', '经验总结', '教程指南', '最佳实践', '深度分析'][index % 5]}文章，详细介绍了相关技术的使用方法和注意事项。${isRejected ? '内容存在一些问题需要修改。' : isPending ? '正在等待管理员审核。' : ''}`,
            author: authorData.name,
            authorEmail: authorData.email,
            authorRole: authorData.role,
            category: categories[Math.floor(Math.random() * categories.length)],
            tags: [['React', 'JavaScript', '前端开发'], ['Vue', 'TypeScript', '前端框架'], ['Node.js', '后端', '微服务'], ['CSS', '设计', 'UI'], ['工具', '效率', '开发']][index % 5],
            status: status,
            featured: Math.random() > 0.9 && isPublished,
            views: Math.floor(Math.random() * 10000),
            likes: Math.floor(Math.random() * 500),
            comments: Math.floor(Math.random() * 100),
            readTime: Math.floor(Math.random() * 20) + 5,
            publishedAt: isPublished ?
                new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] :
                '',
            createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            reviewedAt: (isPending || isRejected || status === 'approved') ?
                new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] :
                undefined,
            reviewedBy: (isPending || isRejected || status === 'approved') ?
                reviewers[Math.floor(Math.random() * reviewers.length)] :
                undefined,
            rejectionReason: isRejected ?
                ['内容不符合社区规范', '存在技术错误', '质量不达标', '重复内容'][Math.floor(Math.random() * 4)] :
                undefined,
            reportCount: Math.floor(Math.random() * 5),
            isReported: Math.random() > 0.8
        };
    });

    // 加载文章数据
    useEffect(() => {
        setLoading(true);
        // 模拟API调用
        setTimeout(() => {
            setArticles(mockArticles);

            // 计算统计数据
            const totalArticles = mockArticles.length;
            const pendingArticles = mockArticles.filter(article => article.status === 'pending').length;
            const publishedArticles = mockArticles.filter(article => article.status === 'published').length;
            const rejectedArticles = mockArticles.filter(article => article.status === 'rejected').length;
            const reportedArticles = mockArticles.filter(article => article.isReported).length;

            setStats({
                totalArticles,
                pendingArticles,
                publishedArticles,
                rejectedArticles,
                reportedArticles
            });

            setLoading(false);
        }, 1000);
    }, []);

    // 筛选文章数据
    const filteredArticles = useMemo(() => {
        return articles.filter(article => {
            // 搜索筛选
            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                if (!article.title.toLowerCase().includes(searchTerm) &&
                    !article.summary.toLowerCase().includes(searchTerm) &&
                    !article.author.toLowerCase().includes(searchTerm)) {
                    return false;
                }
            }

            // 状态筛选
            if (filters.status && article.status !== filters.status) {
                return false;
            }

            // 分类筛选
            if (filters.category && article.category !== filters.category) {
                return false;
            }

            // 作者角色筛选
            if (filters.authorRole && article.authorRole !== filters.authorRole) {
                return false;
            }

            // 日期范围筛选
            if (filters.dateRange) {
                const articleDate = new Date(article.createdAt);
                const now = new Date();
                let startDate: Date;

                switch (filters.dateRange) {
                    case '7days':
                        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        break;
                    case '30days':
                        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                        break;
                    case '90days':
                        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                        break;
                    default:
                        return true;
                }

                if (articleDate < startDate) {
                    return false;
                }
            }

            return true;
        });
    }, [articles, filters]);

    // 分页计算
    const totalPages = Math.ceil(filteredArticles.length / articlesPerPage);
    const startIndex = (currentPage - 1) * articlesPerPage;
    const endIndex = startIndex + articlesPerPage;
    const currentArticles = filteredArticles.slice(startIndex, endIndex);

    // 重置页码
    useEffect(() => {
        setCurrentPage(1);
    }, [filters]);

    // 筛选选项数据
    const statusOptions: SelectOption[] = [
        { id: '', name: '全部状态' },
        { id: 'pending', name: '待审核' },
        { id: 'approved', name: '已通过' },
        { id: 'published', name: '已发布' },
        { id: 'rejected', name: '已拒绝' },
        { id: 'draft', name: '草稿' },
        { id: 'private', name: '私密' }
    ];

    const categoryOptions: SelectOption[] = [
        { id: '', name: '全部分类' },
        { id: '前端开发', name: '前端开发' },
        { id: '后端技术', name: '后端技术' },
        { id: '开发工具', name: '开发工具' },
        { id: '设计相关', name: '设计相关' },
        { id: '其他', name: '其他' }
    ];

    const authorRoleOptions: SelectOption[] = [
        { id: '', name: '全部角色' },
        { id: 'admin', name: '管理员' },
        { id: 'editor', name: '编辑' },
        { id: 'writer', name: '作者' },
        { id: 'user', name: '普通用户' }
    ];

    const dateRangeOptions: SelectOption[] = [
        { id: '', name: '全部时间' },
        { id: '7days', name: '最近7天' },
        { id: '30days', name: '最近30天' },
        { id: '90days', name: '最近90天' }
    ];

    // 处理CustomSelect选择
    const handleSelectChange = (field: keyof FilterOptions) => {
        return (selectedOption: SelectOption | null) => {
            setFilters(prev => ({
                ...prev,
                [field]: selectedOption?.id || ''
            }));
        };
    };

    // 处理筛选条件变化（用于搜索框）
    const handleFilterChange = (field: keyof FilterOptions, value: string) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // 清除筛选条件
    const clearFilters = () => {
        setFilters({
            search: '',
            status: '',
            category: '',
            authorRole: '',
            dateRange: ''
        });
    };

    // 审批文章 - 通过
    const approveArticle = async (article: Article) => {
        await confirm({
            title: '审批通过',
            content: (
                <div>
                    <p>确定要通过文章 "<strong>{article.title}</strong>" 的审核吗？</p>
                    <p>文章通过后将会发布到系统中。</p>
                </div>
            ),
            confirmText: '通过审核',
            cancelText: '取消',
            onConfirm: async () => {
                setArticles(prev => prev.map(a =>
                    a.id === article.id
                        ? {
                            ...a,
                            status: 'approved',
                            reviewedAt: new Date().toISOString().split('T')[0],
                            reviewedBy: '当前管理员',
                            updatedAt: new Date().toISOString().split('T')[0]
                        }
                        : a
                ));
            }
        });
    };

    // 审批文章 - 拒绝
    const rejectArticle = async (article: Article, reason: string) => {
        await confirm({
            title: '审批拒绝',
            content: (
                <div>
                    <p>确定要拒绝文章 "<strong>{article.title}</strong>" 的审核吗？</p>
                    <p>拒绝原因：<strong>{reason}</strong></p>
                    <p style={{ color: 'var(--warning-color)' }}>
                        作者将需要修改后重新提交审核。
                    </p>
                </div>
            ),
            confirmText: '拒绝审核',
            cancelText: '取消',
            onConfirm: async () => {
                setArticles(prev => prev.map(a =>
                    a.id === article.id
                        ? {
                            ...a,
                            status: 'rejected',
                            rejectionReason: reason,
                            reviewedAt: new Date().toISOString().split('T')[0],
                            reviewedBy: '当前管理员',
                            updatedAt: new Date().toISOString().split('T')[0]
                        }
                        : a
                ));
            }
        });
    };

    // 发布文章
    const publishArticle = async (article: Article) => {
        setArticles(prev => prev.map(a =>
            a.id === article.id
                ? {
                    ...a,
                    status: 'published',
                    publishedAt: new Date().toISOString().split('T')[0],
                    updatedAt: new Date().toISOString().split('T')[0]
                }
                : a
        ));
    };

    // 下架文章
    const unpublishArticle = async (article: Article) => {
        await confirm({
            title: '下架文章',
            content: (
                <div>
                    <p>确定要下架文章 "<strong>{article.title}</strong>" 吗？</p>
                    <p style={{ color: 'var(--warning-color)' }}>
                        下架后文章将不再对用户可见。
                    </p>
                </div>
            ),
            confirmText: '确认下架',
            cancelText: '取消',
            onConfirm: async () => {
                setArticles(prev => prev.map(a =>
                    a.id === article.id
                        ? {
                            ...a,
                            status: 'draft',
                            updatedAt: new Date().toISOString().split('T')[0]
                        }
                        : a
                ));
            }
        });
    };

    // 删除文章
    const deleteArticle = (articleId: string) => {
        if (window.confirm('确定要删除这篇文章吗？此操作不可恢复。')) {
            setArticles(prev => prev.filter(article => article.id !== articleId));
        }
    };

    // 切换置顶状态
    const toggleFeatured = (article: Article) => {
        setArticles(prev => prev.map(a =>
            a.id === article.id
                ? { ...a, featured: !a.featured, updatedAt: new Date().toISOString().split('T')[0] }
                : a
        ));
    };

    // 格式化日期
    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
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
                if (start > 2) pages.push('...');
            }

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (end < totalPages) {
                if (end < totalPages - 1) pages.push('...');
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
                    <p className={styles.pageDescription}>
                        管理系统中的所有文章内容，包括审核流程和发布管理
                    </p>
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
                        <button
                            className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`}
                            onClick={clearFilters}
                        >
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
                            onChange={(value) => handleFilterChange('search', value)}
                            allowClear={true}
                            size="large"
                            style={{ minHeight: '46px', height: '50px' }}
                        />
                    </div>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>文章状态</label>
                        <CustomSelect
                            name="文章状态"
                            options={statusOptions}
                            value={statusOptions.find(option => option.id === filters.status) || null}
                            onChange={handleSelectChange('status')}
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
                            value={categoryOptions.find(option => option.id === filters.category) || null}
                            onChange={handleSelectChange('category')}
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
                            value={authorRoleOptions.find(option => option.id === filters.authorRole) || null}
                            onChange={handleSelectChange('authorRole')}
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
                            value={dateRangeOptions.find(option => option.id === filters.dateRange) || null}
                            onChange={handleSelectChange('dateRange')}
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
                        <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                            共 {filteredArticles.length} 篇文章
                        </span>
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
                        {currentArticles.map((article) => (
                            <tr key={article.id} className={`${article.featured ? styles.featured : ''}`}>
                                <td>
                                    <div className={styles.articleInfo}>
                                        <div className={styles.articleDetails}>
                                            {article.featured && (
                                                <span className={styles.featuredTag}>
                                                    <FaStar /> 置顶
                                                </span>
                                            )}
                                            <div className={styles.articleTitle}>{article.title}</div>
                                            <div className={styles.articleSummary}>{article.summary}</div>
                                            {article.isReported && (
                                                <span className={styles.reportedTag}>
                                                    <FaFlag /> 举报 {article.reportCount}
                                                </span>
                                            )}
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
                                        {article.status === 'pending' && <><FaHourglassHalf /> 待审核</>}
                                        {article.status === 'approved' && <><FaCheckCircle /> 已通过</>}
                                        {article.status === 'published' && <><FaEye /> 已发布</>}
                                        {article.status === 'rejected' && <><FaTimes /> 已拒绝</>}
                                        {article.status === 'draft' && <><FaClock /> 草稿</>}
                                        {article.status === 'private' && <><FaClipboardCheck /> 私密</>}
                                    </span>
                                    {(article.status === 'pending' || article.status === 'rejected' || article.status === 'approved') && (
                                        <div className={styles.reviewInfo}>
                                            {article.reviewedBy && (
                                                <div className={styles.reviewedBy}>审核人：{article.reviewedBy}</div>
                                            )}
                                            {article.reviewedAt && (
                                                <div className={styles.reviewedAt}>{article.reviewedAt}</div>
                                            )}
                                        </div>
                                    )}
                                </td>
                                <td>
                                    <div className={styles.statsInfo}>
                                        <div><FaEye /> {article.views.toLocaleString()}</div>
                                        <div><FaHeart /> {article.likes}</div>
                                        <div><FaComment /> {article.comments}</div>
                                        <div><FaClock /> {article.readTime}分钟</div>
                                    </div>
                                </td>
                                <td>
                                    <div className={styles.dateInfo}>
                                        <div>
                                            {article.publishedAt ? (
                                                <><FaCalendar /> {formatDate(article.publishedAt)}</>
                                            ) : (
                                                <><FaClock /> {formatDate(article.createdAt)}</>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div className={styles.actionButtons}>
                                        {/* 管理员审批操作 */}
                                        {article.status === 'pending' && (
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
                                                    onClick={() => rejectArticle(article, '内容质量不达标')}
                                                >
                                                    <FaThumbsDown />
                                                </button>
                                            </>
                                        )}

                                        {/* 已通过文章可以发布 */}
                                        {article.status === 'approved' && (
                                            <button
                                                className={`${styles.actionButton} ${styles.publish}`}
                                                title="发布文章"
                                                onClick={() => publishArticle(article)}
                                            >
                                                <FaCheckCircle />
                                            </button>
                                        )}

                                        {/* 已发布文章可以下架 */}
                                        {article.status === 'published' && (
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
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            className={`${styles.actionButton} ${styles.edit}`}
                                            title="查看详情"
                                        >
                                            <FaEye />
                                        </button>
                                        <button
                                            className={`${styles.actionButton} ${styles.delete}`}
                                            title="删除文章"
                                            onClick={() => deleteArticle(article.id)}
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* 分页 */}
                <div className={styles.paginationContainer}>
                    <div className={styles.paginationInfo}>
                        显示 {startIndex + 1} - {Math.min(endIndex, filteredArticles.length)} 条，
                        共 {filteredArticles.length} 条记录
                    </div>
                    <div className={styles.paginationControls}>
                        <button
                            className={styles.paginationButton}
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                        >
                            <FaAngleDoubleLeft />
                        </button>
                        <button
                            className={styles.paginationButton}
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                        >
                            <FaChevronLeft />
                        </button>

                        {getPageNumbers().map((page, index) => (
                            <React.Fragment key={index}>
                                {page === '...' ? (
                                    <span className={styles.paginationEllipsis}>...</span>
                                ) : (
                                    <button
                                        className={`${styles.paginationButton} ${currentPage === page ? styles.active : ''}`}
                                        onClick={() => setCurrentPage(page as number)}
                                    >
                                        {page}
                                    </button>
                                )}
                            </React.Fragment>
                        ))}

                        <button
                            className={styles.paginationButton}
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
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
            </div>
        </div>
    );
};

export default ArticleManagement;