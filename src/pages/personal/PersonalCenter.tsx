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
    FaArrowDown,
    FaUsers
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
import { AssignmentService as OrganizationService } from '../../services/organizationService';
import { formatToChinaTime } from '../../utils/utils';
import type { ArticleListItem } from '../../types/index';
import type { PersonalOrganization } from '../../types/organization';
import styles from './PersonalCenter.module.css';
import MyArticlesTab from './components/MyArticlesTab';
import MyTagsTab from './components/MyTagsTab';
import StatsTab from './components/StatsTab';
import MyOrganizationsTab from './components/MyOrganizationsTab';

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
    const [activeTab, setActiveTab] = useState<'articles' | 'tags' | 'stats' | 'organizations'>('articles');
    const [loading, setLoading] = useState(false);

    // 文章管理状态 (needed for stats)
    const [articles, setArticles] = useState<ArticleListItem[]>([]);
    const [totalArticles, setTotalArticles] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');

    // 标签管理状态 (needed for stats)
    const [tags, setTags] = useState<PersonalTag[]>([]);

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

    // 文章管理状态
    const [filteredArticles, setFilteredArticles] = useState<ArticleListItem[]>([]);
    const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'private' | 'unallowed' | 'reviewing'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // 标签管理状态
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

    // 组织管理状态
    const [organizations, setOrganizations] = useState<PersonalOrganization[]>([]);
    const [organizationsLoading, setOrganizationsLoading] = useState(false);

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
        { id: 'organizations', label: '我的组织', icon: <FaUsers />, path: '/personal/organizations' },
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
                setTimeout(() => setLoading(false), 200); // 延迟隐藏加载状态，避免闪烁
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

    // 在用户切换到 "我的组织" 标签页时加载组织数据（仅在已登录时）
    useEffect(() => {
        const fetchPersonalOrganizations = async () => {
            setOrganizationsLoading(true);
            if (!user || !user.id) {
                setOrganizations([]);
                setOrganizationsLoading(false);
                return;
            }

            try {
                // 调用组织服务获取组织列表
                // 注意：真实的API可能需要获取用户加入的组织列表，这里先使用现有的API获取所有组织
                const res = await OrganizationService.getOrganizationLists({ status: -1 });
                // 模拟用户加入的组织数据，实际情况需要后端API支持
                // 暂时显示所有组织，实际应用中需要获取用户加入的组织列表
                const roles: ('会长' | '管理员' | '成员')[] = ['会长', '管理员', '成员'];
                const mockUserOrganizations: PersonalOrganization[] = (res.list || []).map((org: any) => ({
                    id: String(org.id),
                    name: org.name || '未知组织',
                    type: org.type || '未知类型',
                    description: org.description || '暂无描述',
                    memberCount: Math.floor(Math.random() * 100), // 模拟成员数
                    role: roles[Math.floor(Math.random() * roles.length)], // 模拟角色
                    createTime: org.create_time ? formatToChinaTime(org.create_time) : '未知时间',
                    status: org.status === 1 || org.status === 'active' ? 'active' : 'inactive',
                    avatar: org.avatar
                }));

                setOrganizations(mockUserOrganizations);
            } catch (err) {
                console.error('获取个人组织失败:', err);
                setOrganizations([]);
            } finally {
                setOrganizationsLoading(false);
            }
        };

        if (activeTab === 'organizations') {
            fetchPersonalOrganizations();
        }
    }, [activeTab, user?.id]);

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
                        {activeTab === 'articles' && <MyArticlesTab />}

                        {/* 标签管理 */}
                        {activeTab === 'tags' && <MyTagsTab />}

                        {/* 数据统计 */}
                        {activeTab === 'stats' && <StatsTab articles={articles} tags={tags} totalArticles={totalArticles} />}

                        {/* 我的组织 */}
                        {activeTab === 'organizations' && <MyOrganizationsTab />}
                    </div>

                    {/* Footer */}
                    <Footer companyName="TechBlog" />
                </main>
            </div>
        </div>
    );
};

export default PersonalCenter;