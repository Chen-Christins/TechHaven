import React, { useState, useEffect } from 'react';
import {
    FaEdit,
    FaTrash,
    FaPlus,
    FaEye,
    FaSearch,
    FaTag,
    FaFileAlt,
    FaChartBar,
    FaCalendarAlt,
    FaThumbsUp,
    FaComment,
    FaBars,
    FaTimes,
    FaUserLock,
    FaLock,
    FaArrowDown
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Loading from '../../components/loading/Loading';
import Skeleton from '../../components/skeleton/Skeleton';
import ThemeToggle from '../../components/themeToggle/ThemeToggle';
import UserDropdown from '../../components/userDropdown/UserDropdown';
import CustomSelect from '../../components/customSelect/CustomSelect';
import Footer from '../../components/footer/Footer';
import { confirm } from '../../components/confirm/Confirm';
import { message } from '../../components/message/Message';
import { useAuth } from '../../contexts/AuthContext';
import type { SelectOption } from '../../types/index';
import ArticleService from '../../services/articleService';
import LabelService from '../../services/labelService';
import { formatToChinaTime } from '../../utils/utils';
import type { ArticleListItem } from '../../types/index';
import styles from './PersonalCenter.module.css';

// 个人标签类型
interface PersonalTag {
    id: number;
    name: string;
    description?: string | '暂无';
    articleCount?: number | 0;
    color: string;
    createTime?: string | '未知时间';
}

// 个人统计类型
interface PersonalStats {
    totalArticles: number;
    publishedArticles: number;
    privateArticles: number;
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    totalTags: number;
}

// 标签数据暂时为空，后续可根据需要实现标签管理
const mockPersonalTags: PersonalTag[] = [];

interface NavItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    path: string;
}

const STATE_MAP: Record<number, string> = {
    1: 'reviewing',
    2: 'published',
    3: 'unallowed',
    4: 'private',
};

const PersonalCenter: React.FC = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated, logout, loading: authLoading } = useAuth();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'articles' | 'tags' | 'stats'>('articles');
    const [loading, setLoading] = useState(false);

    // 文章管理状态
    const [articles, setArticles] = useState<ArticleListItem[]>([]);
    const [filteredArticles, setFilteredArticles] = useState<ArticleListItem[]>([]);
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

    // 标签管理状态
    const [tags, setTags] = useState<PersonalTag[]>([]);
    const [tagsLoading, setTagsLoading] = useState(false);
    const [showTagModal, setShowTagModal] = useState(false);
    const [editingTag, setEditingTag] = useState<PersonalTag | null>(null);
    const [tagForm, setTagForm] = useState({ name: '', description: '', color: '#61dafb' });
    const [savingTag, setSavingTag] = useState(false);

    // 统计数据状态
    const [stats, setStats] = useState<PersonalStats>({
        totalArticles: 0,
        publishedArticles: 0,
        privateArticles: 0,
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
        totalTags: 0
    });

    // 用户数据（从认证上下文获取，与导航栏保持一致）
    const currentUser = user ? {
        name: user.name || user.account || '用户',
        avatar: user.avatar || "https://picsum.photos/id/64/200", // 默认头像
        role: user.role || '用户',
        email: user.email
    } : null;

    // 处理退出登录
    const handleLogout = () => {
        logout();
    };

    // 处理登录跳转
    const handleLoginRedirect = () => {
        navigate("/auth");
    };

    // 导航菜单配置
    const navItems: NavItem[] = [
        { id: 'articles', label: '我的文章', icon: <FaFileAlt />, path: '/personal' },
        { id: 'tags', label: '我的标签', icon: <FaTag />, path: '/personal/tags' },
        { id: 'stats', label: '数据统计', icon: <FaChartBar />, path: '/personal/stats' },
    ];

    useEffect(() => {
        const fetchArticleIds = async () => {
            if (!user?.id) return;

            try {
                setLoading(true);
                const stateValue = getStatusValue(statusFilter);
                // 使用分页请求，每页5条
                const response = await ArticleService.listArticlesByUserIdPages({
                    user_id: user.id,
                    page_from: currentPage,
                    page_size: itemsPerPage,
                    state: stateValue
                });
                
                // 优先使用接口返回的total，如果是0也要使用
                setTotalArticles(typeof response.total === 'number' ? response.total : response.list.length);
                setArticles(response.list.map(article => ({
                    id: article.id,
                    title: article.title,
                    author: article.author,
                    summary: article.summary,
                    state: STATE_MAP[article.state],
                    type: article.type === 1 ? '原创' : '转载',
                    publish_time: article.publish_time ? formatToChinaTime(article.publish_time) : '暂未发布',
                    views: 0, // 后续可通过详情接口补全
                    praise: 0, // 后续可通过详情接口补全
                    favorites: 0, // 后续可通过详情接口补全
                    category: '未分类', // 后续可通过详情接口补全
                    tags: [] // 后续可通过详情接口补全
                })));
                
            } catch (err) {
                console.error('获取文章ID列表失败:', err);
                setTotalArticles(0);
            } finally { 
                setLoading(false);
            }
        };
        fetchArticleIds();
    }, [user?.id, statusFilter, currentPage]);

    // 初始化标签数据
    useEffect(() => {
        setTags(mockPersonalTags);
    }, []);

    // 在用户切换到 "我的标签" 标签页时加载标签数据（仅在已登录时）
    useEffect(() => {
        const fetchPersonalTags = async () => {
            setTagsLoading(true);
            if (!user || !user.id) {
                setTags([]);
                setTagsLoading(false);
                return;
            }

            try {
                const res = await LabelService.queryLabel({ user_id: user.id });
                const mapped = (res || []).map((t: any) => ({
                    id: t.id,
                    name: t.name,
                    description: t.desc || '暂无',
                    articleCount: (t.article_count as number) || 0,
                    color: t.color || '#61dafb',
                    createTime: t.create_time ? formatToChinaTime(t.create_time) : '未知时间'
                }));
                setTags(mapped);
            } catch (err) {
                console.error('获取个人标签失败:', err);
                setTags([]);
            } finally {
                setTagsLoading(false);
            }
        };

        if (activeTab === 'tags') {
            fetchPersonalTags();
        }
    }, [activeTab, user?.id]);

    // 计算统计数据
    useEffect(() => {
        const calculatedStats: PersonalStats = {
            totalArticles: totalArticles,
            publishedArticles: articles.filter(a => a.state === 'published').length,
            privateArticles: articles.filter(a => a.state === 'private').length,
            totalViews: articles.reduce((sum, a) => sum + a.views, 0),
            totalLikes: articles.reduce((sum, a) => sum + a.praise, 0),
            totalComments: articles.reduce((sum, a) => sum + a.favorites, 0), // 使用favorites作为评论数
            totalTags: tags.length
        };
        setStats(calculatedStats);
    }, [articles, tags, totalArticles]);

    // 清理tooltip
    useEffect(() => {
        return () => {
            const tooltip = document.getElementById('sidebar-tooltip');
            if (tooltip && tooltip.parentNode) {
                tooltip.parentNode.removeChild(tooltip);
            }
        };
    }, []);

    // 文章搜索和筛选
    useEffect(() => {
        let filtered = articles;

        if (searchTerm) {
            filtered = filtered.filter(article =>
                article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                article.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
                article.category.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // 状态筛选已移至服务端
        // if (statusFilter !== 'all') {
        //     filtered = filtered.filter(article => article.status === statusFilter);
        // }

        setFilteredArticles(filtered);
        // 只有在搜索条件变化时才重置页码
        if (searchTerm) {
            setCurrentPage(1);
        }
    }, [searchTerm, articles]);

    // 如果正在验证身份，显示骨架屏
    if (authLoading) {
        return (
            <div className={styles.adminLayout}>
                <div className={styles.adminContainer}>
                    {/* 侧边栏骨架 */}
                    <aside className={styles.adminSidebar} style={{ width: '240px' }}>
                        <div className={styles.adminSidebarHeader} style={{ padding: '20px' }}>
                            <Skeleton variant="rectangular" width={120} height={32} />
                        </div>
                        <div style={{ padding: '20px 12px' }}>
                            {[1, 2, 3].map(i => (
                                <div key={i} style={{ marginBottom: '24px' }}>
                                    <Skeleton variant="rounded" height={40} />
                                </div>
                            ))}
                        </div>
                    </aside>

                    {/* 主内容骨架 */}
                    <main className={styles.adminMainContent} style={{ flex: 1 }}>
                        {/* 顶部栏骨架 */}
                        <header className={styles.adminTopBar} style={{ padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '64px' }}>
                            <Skeleton variant="text" width={100} height={24} />
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <Skeleton variant="circular" width={32} height={32} />
                                <Skeleton variant="circular" width={32} height={32} />
                            </div>
                        </header>

                        {/* 页面内容骨架 */}
                        <div className={styles.adminPageContent} style={{ padding: '24px' }}>
                            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between' }}>
                                <Skeleton variant="text" width={150} height={32} />
                                <Skeleton variant="rounded" width={100} height={36} />
                            </div>
                            
                            <div style={{ marginBottom: '24px' }}>
                                <div style={{ marginBottom: '16px' }}>
                                    <Skeleton variant="rounded" height={48} />
                                </div>
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} style={{ marginBottom: '12px' }}>
                                        <Skeleton variant="rounded" height={80} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    // 如果用户未登录，显示提示
    if (!isAuthenticated || !currentUser) {
        return (
            <div className={styles.pageContainer} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '40px',
                    backgroundColor: 'var(--card-bg)',
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                    maxWidth: '400px',
                    width: '100%',
                    textAlign: 'center'
                }}>
                    <div style={{
                        fontSize: '48px',
                        color: 'var(--primary)',
                        marginBottom: '24px',
                        opacity: 0.8
                    }}>
                        <FaUserLock />
                    </div>
                    <h2 style={{ 
                        marginBottom: '12px', 
                        color: 'var(--text-primary)',
                        fontSize: '24px',
                        fontWeight: '600'
                    }}>
                        请先登录
                    </h2>
                    <p style={{ 
                        marginBottom: '32px', 
                        color: 'var(--text-secondary)',
                        fontSize: '15px',
                        lineHeight: '1.6'
                    }}>
                        您需要登录后才能访问个人中心，查看和管理您的文章、标签及数据统计。
                    </p>
                    <button
                        onClick={handleLoginRedirect}
                        style={{
                            padding: '12px 32px',
                            backgroundColor: 'var(--primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(var(--primary-rgb), 0.3)',
                            width: '100%'
                        }}
                    >
                        立即登录
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        style={{
                            marginTop: '16px',
                            padding: '8px 16px',
                            backgroundColor: 'transparent',
                            color: 'var(--text-secondary)',
                            border: 'none',
                            fontSize: '14px',
                            cursor: 'pointer',
                            textDecoration: 'underline'
                        }}
                    >
                        返回首页
                    </button>
                </div>
            </div>
        );
    }

    // 切换侧边栏
    const toggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    // 切换移动端菜单
    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    // 关闭移动端菜单
    const closeMobileMenu = () => {
        setMobileMenuOpen(false);
    };

    // 处理状态筛选变化
    const handleStatusChange = (selectedOption: SelectOption | null) => {
        setSelectedStatus(selectedOption);
        const newStatus = selectedOption ? (selectedOption.id as 'all' | 'published' | 'private' | 'unallowed' | 'reviewing') : 'all';
        setStatusFilter(newStatus);
        setCurrentPage(1);
        setArticles([]); // 清空列表以显示加载状态
    };

    // 分页计算
    const totalPages = Math.ceil(totalArticles / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + articles.length;
    const currentArticles = filteredArticles;

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

    // 添加/编辑标签
    const handleSaveTag = async () => {
        if (!tagForm.name.trim()) return;

        setSavingTag(true);
        try {
            if (editingTag) {
                // 编辑标签
                const res = await LabelService.createLabel({
                    name: tagForm.name,
                    color: tagForm.color,
                    description: tagForm.description || '',
                });

                setTags(tags.map(tag =>
                    tag.id === editingTag.id
                        ? { 
                            ...tag, 
                            name: res.name, 
                            description: res.desc || '暂无', 
                            color: res.color,
                            createTime: res.create_time ? formatToChinaTime(res.create_time) : tag.createTime
                          }
                        : tag
                ));
            } else {
                // 创建新标签
                const res = await LabelService.createLabel({
                    name: tagForm.name,
                    color: tagForm.color,
                    description: tagForm.description || '',
                });

                // 将API响应映射到PersonalTag格式
                const newTag: PersonalTag = {
                    id: Number(res.id),
                    name: res.name,
                    description: res.desc || '暂无',
                    articleCount: 0,
                    color: res.color,
                    createTime: res.create_time ? formatToChinaTime(res.create_time) : new Date().toISOString().split('T')[0]
                };
                setTags([...tags, newTag]);
            }

            setShowTagModal(false);
            setEditingTag(null);
            setTagForm({ name: '', description: '', color: '#61dafb' });
        } catch (err) {
            console.error('保存标签失败:', err);
            alert('保存标签失败，请重试');
        } finally {
            setSavingTag(false);
        }
    };

    // 删除标签
    const handleDeleteTag = async (tag: PersonalTag) => {
        const confirmed = await confirm({
            title: '确认删除',
            content: `确定要删除标签 "${tag.name}" 吗？删除后关联文章将失去此标签。`,
            confirmText: '删除',
            cancelText: '取消'
        });

        if (confirmed) {
            try {
                await LabelService.deleteLabel({ ids: String(tag.id) });
                // 删除成功后从本地状态移除
                setTags(tags.filter(t => t.id !== tag.id));
            } catch (err) {
                console.error('删除标签失败:', err);
                alert('删除标签失败，请重试');
            }
        }
    };

    // 显示工具提示
    const showTooltip = (event: React.MouseEvent, text: string) => {
        if (sidebarCollapsed) {
            // 创建或显示tooltip
            let tooltip = document.getElementById('sidebar-tooltip');
            if (!tooltip) {
                tooltip = document.createElement('div');
                tooltip.id = 'sidebar-tooltip';
                tooltip.style.cssText = `
                    position: fixed;
                    padding: 6px 12px;
                    background-color: var(--card-bg);
                    border: 1px solid var(--border-primary);
                    border-radius: 6px;
                    color: var(--text-primary);
                    font-size: 12px;
                    white-space: nowrap;
                    z-index: 10000;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    pointer-events: none;
                    opacity: 0;
                `;
                document.body.appendChild(tooltip);
            }

            tooltip.textContent = text;
            const rect = event.currentTarget.getBoundingClientRect();
            tooltip.style.left = `${rect.right + 8}px`;
            tooltip.style.top = `${rect.top + rect.height / 2}px`;
            tooltip.style.transform = 'translateY(-50%)';

            // 显示tooltip
            setTimeout(() => {
                if (tooltip) tooltip.style.opacity = '1';
            }, 10);
        }
    };

    // 隐藏工具提示
    const hideTooltip = () => {
        const tooltip = document.getElementById('sidebar-tooltip');
        if (tooltip) {
            tooltip.style.opacity = '0';
            setTimeout(() => {
                if (tooltip.parentNode) {
                    tooltip.parentNode.removeChild(tooltip);
                }
            }, 300);
        }
    };

    // 编辑标签
    const handleEditTag = (tag: PersonalTag) => {
        setEditingTag(tag);
        setTagForm({ name: tag.name, description: tag.description || '', color: tag.color });
        setShowTagModal(true);
    };

    if (loading) {
        return (
            <div className={styles.pageContainer}>
                <Loading size="large" text="正在加载个人数据..." />
            </div>
        );
    }

    return (
        <div className={styles.adminLayout}>
            {/* 移动端菜单遮罩 */}
            <div
                className={`${styles.mobileMenuOverlay} ${mobileMenuOpen ? styles.show : ''}`}
                onClick={closeMobileMenu}
            />

            <div className={styles.adminContainer}>
                {/* 侧边栏 */}
                <aside
                    className={`${styles.adminSidebar} ${sidebarCollapsed ? styles.collapsed : ''} ${mobileMenuOpen ? styles.mobileOpen : ''}`}
                >
                    {/* Logo区域 */}
                    <div className={styles.adminSidebarHeader}>
                        <div onClick={() => navigate('/personal')} className={styles.adminLogo}>
                            <span className={styles.adminLogoIcon}>👤</span>
                            <span className={styles.adminLogoText}>个人中心</span>
                        </div>
                        <button
                            className={styles.toggleSidebarBtn}
                            onClick={toggleSidebar}
                            title={sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
                        >
                            {sidebarCollapsed ? <FaBars /> : <FaTimes />}
                        </button>
                    </div>

                    {/* 导航菜单 */}
                    <nav className={styles.adminNavMenu}>
                        {navItems.map((item) => (
                            <div key={item.id} className={styles.adminNavItem}>
                                <button
                                    className={`${styles.adminNavLink} ${activeTab === item.id ? styles.active : ''}`}
                                    onClick={() => {
                                        setActiveTab(item.id as any);
                                        closeMobileMenu();
                                    }}
                                    onMouseEnter={(e) => showTooltip(e, item.label)}
                                    onMouseLeave={hideTooltip}
                                >
                                    <span className={styles.adminNavIcon}>{item.icon}</span>
                                    <span className={styles.adminNavText}>{item.label}</span>
                                </button>
                            </div>
                        ))}
                    </nav>
                </aside>

                {/* 主内容区域 */}
                <main className={`${styles.adminMainContent} ${sidebarCollapsed ? styles.expanded : ''}`}>
                    {/* 顶部栏 */}
                    <header className={styles.adminTopBar}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            {/* 移动端菜单按钮 */}
                            <button
                                className={styles.mobileMenuBtn}
                                onClick={toggleMobileMenu}
                                aria-label="打开菜单"
                            >
                                <FaBars />
                            </button>

                            {/* 面包屑导航 */}
                            <nav className={styles.adminBreadcrumb}>
                                <span className={styles.breadcrumbActive}>
                                    {navItems.find(item => item.id === activeTab)?.label || '个人中心'}
                                </span>
                            </nav>
                        </div>

                        {/* 顶部操作区域 */}
                        <div className={styles.adminTopBarActions}>
                            <ThemeToggle />

                            {/* 用户信息区域 */}
                            <UserDropdown
                                user={currentUser}
                                onLogout={handleLogout}
                                showAdminLink={currentUser?.role === '管理员'}
                            />
                        </div>
                    </header>

                    {/* 页面内容 */}
                    <div className={styles.adminPageContent}>
                        {/* 文章管理 */}
                        {activeTab === 'articles' && (
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
                        )}

                        {/* 标签管理 */}
                        {activeTab === 'tags' && (
                            <div className={styles.contentSection}>
                                <div className={styles.sectionHeader}>
                                    <h2>我的标签</h2>
                                    <button
                                        className={styles.addButton}
                                        onClick={() => setShowTagModal(true)}
                                    >
                                        <FaPlus />
                                        新建标签
                                    </button>
                                </div>

                                {tagsLoading ? (
                                    <div style={{ padding: '24px', textAlign: 'center' }}>
                                        <Loading size="small" text="正在加载标签..." />
                                    </div>
                                ) : tags.length === 0 ? (
                                    <div className={styles.emptyState}>
                                        <FaTag className={styles.emptyIcon} />
                                        <h3>暂无标签数据</h3>
                                        <p>点击"新增标签"按钮创建第一个标签</p>
                                    </div>
                                ) : (
                                    <div className={styles.tagsGrid}>
                                        {tags.map(tag => (
                                            <div key={tag.id} className={styles.tagCard}>
                                                <div className={styles.tagHeader}>
                                                    <div
                                                        className={styles.tagColor}
                                                        style={{ backgroundColor: tag.color }}
                                                    ></div>
                                                    <h3>{tag.name}</h3>
                                                </div>
                                                <p className={styles.tagDescription}>{tag.description}</p>
                                                <div className={styles.tagStats}>
                                                    <span>{tag.articleCount} 篇文章</span>
                                                    <span>创建于 {tag.createTime}</span>
                                                </div>
                                                <div className={styles.tagActions}>
                                                    <button
                                                        className={styles.actionButton}
                                                        onClick={() => handleEditTag(tag)}
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                    <button
                                                        className={styles.actionButton}
                                                        onClick={() => handleDeleteTag(tag)}
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* 标签模态框 */}
                                {showTagModal && (
                                    <div className={styles.modalOverlay}>
                                        <div className={styles.modal}>
                                            <div className={styles.modalHeader}>
                                                <h3>{editingTag ? '编辑标签' : '新建标签'}</h3>
                                                <button
                                                    className={styles.closeButton}
                                                    onClick={() => {
                                                        setShowTagModal(false);
                                                        setEditingTag(null);
                                                        setTagForm({ name: '', description: '', color: '#61dafb' });
                                                    }}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                            <div className={styles.modalBody}>
                                                <div className={styles.formGroup}>
                                                    <label>标签名称</label>
                                                    <input
                                                        type="text"
                                                        value={tagForm.name}
                                                        onChange={(e) => setTagForm({ ...tagForm, name: e.target.value })}
                                                        placeholder="请输入标签名称"
                                                    />
                                                </div>
                                                <div className={styles.formGroup}>
                                                    <label>标签描述</label>
                                                    <textarea
                                                        value={tagForm.description}
                                                        onChange={(e) => setTagForm({ ...tagForm, description: e.target.value })}
                                                        placeholder="请输入标签描述"
                                                        rows={3}
                                                    />
                                                </div>
                                                <div className={styles.formGroup}>
                                                    <label>标签颜色</label>
                                                    <div className={styles.colorPicker}>
                                                        <input
                                                            type="color"
                                                            value={tagForm.color}
                                                            onChange={(e) => setTagForm({ ...tagForm, color: e.target.value })}
                                                        />
                                                        <span>{tagForm.color}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={styles.modalFooter}>
                                                <button
                                                    className={styles.cancelButton}
                                                    onClick={() => {
                                                        setShowTagModal(false);
                                                        setEditingTag(null);
                                                        setTagForm({ name: '', description: '', color: '#61dafb' });
                                                    }}
                                                >
                                                    取消
                                                </button>
                                                <button
                                                    className={styles.confirmButton}
                                                    onClick={handleSaveTag}
                                                    disabled={savingTag}
                                                >
                                                    {savingTag ? '保存中...' : (editingTag ? '更新' : '创建')}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 数据统计 */}
                        {activeTab === 'stats' && (
                            <div className={styles.contentSection}>
                                <div className={styles.sectionHeader}>
                                    <h2>数据统计</h2>
                                </div>
                                <div className={styles.statsGrid}>
                                    <div className={styles.statCard}>
                                        <div className={styles.statIcon}>
                                            <FaFileAlt />
                                        </div>
                                        <div className={styles.statContent}>
                                            <h3>{stats.totalArticles}</h3>
                                            <p>总文章数</p>
                                        </div>
                                    </div>
                                    <div className={styles.statCard}>
                                        <div className={styles.statIcon}>
                                            <FaEye />
                                        </div>
                                        <div className={styles.statContent}>
                                            <h3>{stats.totalViews.toLocaleString()}</h3>
                                            <p>总浏览量</p>
                                        </div>
                                    </div>
                                    <div className={styles.statCard}>
                                        <div className={styles.statIcon}>
                                            <FaThumbsUp />
                                        </div>
                                        <div className={styles.statContent}>
                                            <h3>{stats.totalLikes}</h3>
                                            <p>总点赞数</p>
                                        </div>
                                    </div>
                                    <div className={styles.statCard}>
                                        <div className={styles.statIcon}>
                                            <FaComment />
                                        </div>
                                        <div className={styles.statContent}>
                                            <h3>{stats.totalComments}</h3>
                                            <p>总评论数</p>
                                        </div>
                                    </div>
                                    <div className={styles.statCard}>
                                        <div className={styles.statIcon}>
                                            <FaTag />
                                        </div>
                                        <div className={styles.statContent}>
                                            <h3>{stats.totalTags}</h3>
                                            <p>标签数量</p>
                                        </div>
                                    </div>
                                    <div className={styles.statCard}>
                                        <div className={styles.statIcon}>
                                            <FaChartBar />
                                        </div>
                                        <div className={styles.statContent}>
                                            <h3>{stats.publishedArticles}</h3>
                                            <p>已发布文章</p>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.statsDetails}>
                                    <h3>详细统计</h3>
                                    <div className={styles.statsTable}>
                                        <div className={styles.tableRow}>
                                            <span>已发布文章</span>
                                            <span>{stats.publishedArticles} 篇</span>
                                        </div>
                                        <div className={styles.tableRow}>
                                            <span>私密文章</span>
                                            <span>{stats.privateArticles} 篇</span>
                                        </div>
                                        <div className={styles.tableRow}>
                                            <span>平均浏览量</span>
                                            <span>{stats.totalArticles > 0 ? Math.round(stats.totalViews / stats.totalArticles) : 0} 次/篇</span>
                                        </div>
                                        <div className={styles.tableRow}>
                                            <span>平均点赞数</span>
                                            <span>{stats.publishedArticles > 0 ? Math.round(stats.totalLikes / stats.publishedArticles) : 0} 个/篇</span>
                                        </div>
                                        <div className={styles.tableRow}>
                                            <span>平均评论数</span>
                                            <span>{stats.publishedArticles > 0 ? Math.round(stats.totalComments / stats.publishedArticles) : 0} 条/篇</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <Footer companyName="TechBlog" />
                </main>
            </div>
        </div>
    );
};

export default PersonalCenter;