import React, { useState, useEffect } from 'react';
import {
    FaEdit,
    FaTrash,
    FaPlus,
    FaEye,
    FaSearch,
    FaCalendarAlt,
    FaThumbsUp,
    FaComment,
    FaArrowDown,
    FaLock
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import CustomSelect from '../../../components/customSelect/CustomSelect';
import { confirm } from '../../../components/confirm/Confirm';
import { message } from '../../../components/message/Message';
import { useAuth } from '../../../contexts/AuthContext';
import type { SelectOption } from '../../../types/index';
import ArticleService from '../../../services/articleService';
import { formatToChinaTime } from '../../../utils/utils';
import type { ArticleListItem } from '../../../types/index';
import styles from '../PersonalCenter.module.css';

const STATE_MAP: Record<number, string> = {
    1: 'reviewing',
    2: 'published',
    3: 'unallowed',
    4: 'private',
};

const MyArticlesTab: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [articles, setArticles] = useState<ArticleListItem[]>([]);
    const [totalArticles, setTotalArticles] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'private' | 'unallowed' | 'reviewing'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // 状态筛选选项
    const statusOptions: SelectOption[] = [
        { id: 'all', name: '全部状态', color: '#6c757d' },
        { id: 'published', name: '已发布', color: '#28a745' },
        { id: 'private', name: '私密', color: '#dc3545' },
        { id: 'unallowed', name: '未通过', color: '#1474e2ff' },
        { id: 'reviewing', name: '审核中', color: '#17a2b8' },
    ];

    // 获取状态对应的数值
    const getStatusValue = (statusId: string): number | undefined => {
        switch (statusId) {
            case 'published': return 2;
            case 'private': return 4;
            case 'unallowed': return 3;
            case 'reviewing': return 1;
            default: return undefined; // 'all'
        }
    };

    // 当前选中的状态选项
    const [selectedStatus, setSelectedStatus] = useState<SelectOption | null>(statusOptions[0]);

    // 文章搜索和筛选逻辑改为渲染时处理，避免 setState 触发多次请求

    useEffect(() => {
        const fetchArticleIds = async () => {
            if (!user?.id) return;
            try {
                const stateValue = getStatusValue(statusFilter);
                const response = await ArticleService.listArticlesByUserIdPages({
                    user_id: user.id,
                    page_from: currentPage,
                    page_size: itemsPerPage,
                    state: stateValue
                });
                setTotalArticles(typeof response.total === 'number' ? response.total : response.list.length);
                if (response.list && response.list.length > 0) {
                    setArticles(response.list.map(article => ({
                        id: article.id,
                        title: article.title,
                        author: article.author,
                        summary: article.summary,
                        state: STATE_MAP[article.state],
                        type: article.type === 1 ? '原创' : '转载',
                        publish_time: article.publish_time ? formatToChinaTime(article.publish_time) : '暂未发布',
                        views: 0,
                        praise: 0,
                        favorites: 0,
                        category: '未分类',
                        tags: []
                    })));
                } else {
                    setArticles([]);
                }
            } catch (err) {
                console.error('获取文章ID列表失败:', err);
                setTotalArticles(0);
                setArticles([]);
            }
        };
        fetchArticleIds();
    }, [user?.id, statusFilter, currentPage]);

    // 处理状态筛选变化
    const handleStatusChange = (selectedOption: SelectOption | null) => {
        setSelectedStatus(selectedOption);
        const newStatus = selectedOption ? (selectedOption.id as 'all' | 'published' | 'private' | 'unallowed' | 'reviewing') : 'all';
        setStatusFilter(newStatus);
        setCurrentPage(1);
        // 不再 setArticles([])，避免多次请求
    };

    // 分页计算
    const totalPages = Math.ceil(totalArticles / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + articles.length;
    // 渲染时本地筛选
    const currentArticles = articles.filter(article => {
        if (!searchTerm) return true;
        return (
            article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            article.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
            article.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

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

    // 删除文章
    const handleDeleteArticle = async (id: string | number) => {
        const isConfirmed = await confirm({
            title: '确认删除',
            content: '确定要删除这篇文章吗？删除后无法恢复。',
            confirmText: '删除',
            cancelText: '取消'
        });

        if (isConfirmed) {
            try {
                await ArticleService.deleteArticle({ ids: String(id) });
                message.success('文章删除成功');
                // 删除成功后从本地状态移除
                const newAllIds = articles.filter(aid => aid.id !== id);
                setArticles(newAllIds);
                setTotalArticles(prev => prev - 1);

                // 如果当前页为空且不是第一页，则跳转到上一页
                if (newAllIds.length === 0 && currentPage > 1) {
                    setCurrentPage(currentPage - 1);
                }
            } catch (err) {
                console.error('删除文章失败:', err);
                message.error('删除文章失败，请重试');
            }
        }
    };

    // 切换文章状态
    const handleToggleStatus = async (id: string | number, newStatus: 'published' | 'private' | 'unallowed' | 'reviewing') => {
        try {
            if (newStatus === 'reviewing') {
                await ArticleService.publishArticle({
                    id: id,
                    publish_time: Math.floor(Date.now() / 1000)
                });
                message.success('文章发布成功, 等待管理员审核中');
                setArticles(articles.map(article =>
                    article.id === id ? { ...article, state: newStatus } : article
                ));
            }
            if (newStatus === 'private') {
                await ArticleService.switchArticleState({
                    id: id,
                    state: 4
                });
                message.success('文章已设为私密');
                setArticles(articles.map(article =>
                    article.id === id ? { ...article, state: newStatus } : article
                ));
            }
        } catch (err) {
            console.error('切换文章状态失败:', err);
            message.error('切换文章状态失败，请重试');
        }
    };

    return (
        <div className={styles.contentSection}>
            <div className={styles.sectionHeader}>
                <h2>我的文章</h2>
                <button onClick={() => navigate("/article/create")} className={styles.addButton}>
                    <FaPlus />
                    新建文章
                </button>
            </div>

            {/* 搜索和筛选 */}
            <div className={styles.searchFilterBar}>
                <div className={styles.searchBox}>
                    <FaSearch className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="搜索文章标题、摘要或分类..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <CustomSelect
                    name="状态"
                    options={statusOptions}
                    value={selectedStatus}
                    onChange={handleStatusChange}
                    className={styles.statusSelect}
                    hideBadge={true}
                />
            </div>

            {/* 文章列表 */}
            <div className={styles.articlesList}>
                <div className={styles.listHeader}>
                    <div>标题</div>
                    <div>分类</div>
                    <div>状态</div>
                    <div>数据</div>
                    <div>发布时间</div>
                    <div>操作</div>
                </div>
                {currentArticles.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                        暂无数据
                    </div>
                ) : (
                    currentArticles.map(article => (
                        <div key={article.id} className={styles.listItem}>
                            <div className={styles.articleTitle}>
                                <div>{article.title}</div>
                                <div className={styles.articleSummary}>
                                    {article.summary}...
                                </div>
                            </div>
                            <div className={styles.articleCategory}>{article.category}</div>
                            <div className={styles.statusCell}>
                                <span className={`${styles.statusBadge} ${styles[article.state]}`}>
                                    {article.state === 'published' ? '已发布' :
                                     article.state === 'private' ? '私密' :
                                     article.state === 'reviewing' ? '审核中' : '未通过'}
                                </span>
                            </div>
                            <div className={styles.dataCell}>
                                <div className={styles.dataItem}>
                                    <FaEye /> {article.views}
                                </div>
                                <div className={styles.dataItem}>
                                    <FaThumbsUp /> {article.praise}
                                </div>
                                <div className={styles.dataItem}>
                                    <FaComment /> {article.favorites}
                                </div>
                            </div>
                            <div className={styles.dateCell}>
                                <FaCalendarAlt />
                                {article.publish_time ? article.publish_time : '-'}
                            </div>
                            <div className={styles.actions}>
                                <button
                                    className={styles.actionButton}
                                    title="查看"
                                    onClick={() => navigate(`/article/${article.id}`)}
                                >
                                    <FaEye />
                                </button>
                                <button
                                    className={styles.actionButton}
                                    title="编辑"
                                    onClick={() => navigate(`/article/edit/${article.id}`)}
                                >
                                    <FaEdit />
                                </button>
                                {article.state === 'reviewing' && (
                                    <button
                                        className={styles.actionButton}
                                        title="撤回审核"
                                        onClick={() => handleToggleStatus(article.id, 'private')}
                                    >
                                        <FaArrowDown />
                                    </button>
                                )}
                                {article.state === 'published' && (
                                    <button
                                        className={styles.actionButton}
                                        title="设为私密"
                                        onClick={() => handleToggleStatus(article.id, 'private')}
                                    >
                                        <FaLock />
                                    </button>
                                )}
                                {article.state === 'private' && (
                                    <button
                                        className={styles.actionButton}
                                        title="发布文章"
                                        onClick={() => handleToggleStatus(article.id, 'reviewing')}
                                    >
                                        <FaPlus />
                                    </button>
                                )}
                                {article.state === 'unallowed' && (
                                    <button
                                        className={styles.actionButton}
                                        title="重新提交"
                                        onClick={() => handleToggleStatus(article.id, 'reviewing')}
                                    >
                                        <FaPlus />
                                    </button>
                                )}
                                <button
                                    className={styles.actionButton}
                                    title="删除"
                                    onClick={() => handleDeleteArticle(article.id)}
                                >
                                    <FaTrash />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* 分页 */}
            {totalPages >= 1 && (
                <div className={styles.pagination}>
                    <div className={styles.paginationInfo}>
                        显示 {startIndex + 1} - {Math.min(endIndex, totalArticles)} 条，
                        共 {totalArticles} 篇文章
                    </div>
                    <div className={styles.paginationControls}>
                        <button
                            className={styles.paginationButton}
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                        >
                            首页
                        </button>
                        <button
                            className={styles.paginationButton}
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                        >
                            上一页
                        </button>
                        {getPageNumbers().map((page, index) => (
                            <button
                                key={index}
                                className={`${styles.paginationButton} ${
                                    currentPage === page ? styles.active : ''
                                }`}
                                onClick={() => page !== '...' && setCurrentPage(page as number)}
                                disabled={page === '...'}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            className={styles.paginationButton}
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                        >
                            下一页
                        </button>
                        <button
                            className={styles.paginationButton}
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                        >
                            末页
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyArticlesTab;