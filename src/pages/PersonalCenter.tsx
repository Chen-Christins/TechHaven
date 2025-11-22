import React, { useState, useEffect } from 'react';
import {
    FaEdit,
    FaTrash,
    FaPlus,
    FaEye,
    FaSearch,
    FaFilter,
    FaTag,
    FaFileAlt,
    FaChartBar,
    FaCalendarAlt,
    FaThumbsUp,
    FaComment,
    FaHome,
    FaBars,
    FaTimes,
    FaFolderOpen,
    FaPenFancy
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import Loading from '../components/loading/Loading';
import ThemeToggle from '../components/themeToggle/ThemeToggle';
import UserDropdown from '../components/userDropdown/UserDropdown';
import CustomSelect from '../components/customSelect/CustomSelect';
import Footer from '../components/footer/Footer';
import type { SelectOption } from '../../types/index';
import styles from './PersonalCenter.module.css';

// 个人文章类型
interface PersonalArticle {
    id: number;
    title: string;
    summary: string;
    category: string;
    tags: string[];
    date: string;
    views: number;
    likes: number;
    comments: number;
    status: 'published' | 'draft' | 'private';
    publishTime?: string;
}

// 个人标签类型
interface PersonalTag {
    id: number;
    name: string;
    description: string;
    articleCount: number;
    color: string;
    createTime: string;
}

// 个人统计类型
interface PersonalStats {
    totalArticles: number;
    publishedArticles: number;
    draftArticles: number;
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    totalTags: number;
}

// 模拟个人文章数据
const mockPersonalArticles: PersonalArticle[] = [
    {
        id: 1,
        title: "React 18 新特性详解",
        summary: "本文详细介绍React 18的自动批处理、并发渲染、Transitions等核心新特性，帮助开发者快速上手。",
        category: "前端框架",
        tags: ["React", "TypeScript", "前端"],
        date: "2024-05-20",
        views: 1250,
        likes: 45,
        comments: 12,
        status: "published",
        publishTime: "2024-05-20 10:30"
    },
    {
        id: 2,
        title: "TypeScript 类型编程实战",
        summary: "从基础到进阶，讲解TypeScript泛型、条件类型、工具类型的实战用法，解决实际开发中的类型问题。",
        category: "TypeScript",
        tags: ["TypeScript", "类型编程", "前端工程化"],
        date: "2024-05-15",
        views: 980,
        likes: 32,
        comments: 8,
        status: "published",
        publishTime: "2024-05-15 14:20"
    },
    {
        id: 3,
        title: "CSS Grid 布局完全指南（草稿）",
        summary: "全面解析CSS Grid布局的语法、属性和实战案例，掌握复杂页面的高效布局方案。",
        category: "CSS",
        tags: ["CSS", "Grid", "布局"],
        date: "2024-05-10",
        views: 0,
        likes: 0,
        comments: 0,
        status: "draft"
    },
    {
        id: 4,
        title: "Vue 3 Composition API 实战",
        summary: "深入讲解Vue 3的Composition API，包括响应式系统、生命周期钩子、自定义组合等高级特性。",
        category: "Vue",
        tags: ["Vue", "Composition API", "前端框架"],
        date: "2024-05-05",
        views: 750,
        likes: 28,
        comments: 5,
        status: "published",
        publishTime: "2024-05-05 16:45"
    },
    {
        id: 5,
        title: "前端性能优化最佳实践",
        summary: "从网络优化、资源压缩、代码分割等方面，全面介绍前端性能优化的实用技巧和工具。",
        category: "性能优化",
        tags: ["性能", "优化", "最佳实践"],
        date: "2024-04-30",
        views: 1100,
        likes: 38,
        comments: 10,
        status: "published",
        publishTime: "2024-04-30 09:15"
    },
    {
        id: 6,
        title: "Vue 3 Composition API 详解",
        summary: "深入解析Vue 3的Composition API，包括setup函数、响应式系统、生命周期等核心概念。",
        category: "Vue",
        tags: ["Vue", "Composition API", "JavaScript"],
        date: "2024-04-25",
        views: 890,
        likes: 28,
        comments: 6,
        status: "published",
        publishTime: "2024-04-25 16:45"
    },
    {
        id: 7,
        title: "微前端架构设计与实践",
        summary: "介绍微前端架构的设计理念、技术选型、实施方案以及在大型项目中的应用案例。",
        category: "架构设计",
        tags: ["微前端", "架构", "qiankun"],
        date: "2024-04-20",
        views: 750,
        likes: 22,
        comments: 4,
        status: "draft",
        publishTime: ""
    },
    {
        id: 8,
        title: "Node.js 服务端开发入门",
        summary: "从零开始学习Node.js服务端开发，包括Express框架、数据库操作、API设计等内容。",
        category: "Node.js",
        tags: ["Node.js", "Express", "后端"],
        date: "2024-04-15",
        views: 680,
        likes: 18,
        comments: 3,
        status: "published",
        publishTime: "2024-04-15 10:20"
    },
    {
        id: 9,
        title: "Webpack 5 配置详解",
        summary: "详细介绍Webpack 5的配置方法，包括loader、plugin、优化策略等高级特性。",
        category: "工程化",
        tags: ["Webpack", "构建工具", "工程化"],
        date: "2024-04-10",
        views: 920,
        likes: 35,
        comments: 8,
        status: "published",
        publishTime: "2024-04-10 14:30"
    },
    {
        id: 10,
        title: "JavaScript 异步编程完全指南",
        summary: "从回调函数到Promise，再到async/await，全面掌握JavaScript异步编程的各种模式。",
        category: "JavaScript",
        tags: ["JavaScript", "异步编程", "Promise"],
        date: "2024-04-05",
        views: 1150,
        likes: 42,
        comments: 11,
        status: "published",
        publishTime: "2024-04-05 11:15"
    },
    {
        id: 11,
        title: "React Hooks 最佳实践",
        summary: "总结React Hooks的使用技巧、性能优化、自定义Hooks开发等最佳实践经验。",
        category: "React",
        tags: ["React", "Hooks", "最佳实践"],
        date: "2024-03-30",
        views: 1380,
        likes: 56,
        comments: 15,
        status: "published",
        publishTime: "2024-03-30 09:45"
    },
    {
        id: 12,
        title: "CSS-in-JS 方案对比分析",
        summary: "对比分析styled-components、emotion、jss等CSS-in-JS方案的优缺点和适用场景。",
        category: "CSS",
        tags: ["CSS", "CSS-in-JS", "样式方案"],
        date: "2024-03-25",
        views: 720,
        likes: 24,
        comments: 5,
        status: "private",
        publishTime: ""
    },
    {
        id: 13,
        title: "前端监控体系搭建",
        summary: "介绍如何搭建完整的前端监控体系，包括性能监控、错误监控、用户行为监控等。",
        category: "监控",
        tags: ["监控", "性能", "错误追踪"],
        date: "2024-03-20",
        views: 890,
        likes: 31,
        comments: 7,
        status: "draft",
        publishTime: ""
    },
];

// 模拟个人标签数据
const mockPersonalTags: PersonalTag[] = [
    {
        id: 1,
        name: "React",
        description: "React相关技术文章",
        articleCount: 3,
        color: "#61dafb",
        createTime: "2024-01-15"
    },
    {
        id: 2,
        name: "TypeScript",
        description: "TypeScript类型系统与编程",
        articleCount: 2,
        color: "#3178c6",
        createTime: "2024-01-20"
    },
    {
        id: 3,
        name: "CSS",
        description: "CSS样式与布局技术",
        articleCount: 4,
        color: "#1572b6",
        createTime: "2024-01-25"
    },
    {
        id: 4,
        name: "Vue",
        description: "Vue框架开发相关",
        articleCount: 2,
        color: "#4fc08d",
        createTime: "2024-02-01"
    },
    {
        id: 5,
        name: "性能优化",
        description: "前端性能优化技巧",
        articleCount: 1,
        color: "#ff6b6b",
        createTime: "2024-02-10"
    }
];

interface NavItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    path: string;
}

const PersonalCenter: React.FC = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'articles' | 'tags' | 'stats'>('articles');
    const [loading, setLoading] = useState(false);

    // 文章管理状态
    const [articles, setArticles] = useState<PersonalArticle[]>([]);
    const [filteredArticles, setFilteredArticles] = useState<PersonalArticle[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'private'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // 状态筛选选项
    const statusOptions: SelectOption[] = [
        { id: 'all', name: '全部状态' },
        { id: 'published', name: '已发布' },
        { id: 'draft', name: '草稿' },
        { id: 'private', name: '私密' }
    ];

    // 当前选中的状态选项
    const [selectedStatus, setSelectedStatus] = useState<SelectOption | null>(statusOptions[0]);

    // 标签管理状态
    const [tags, setTags] = useState<PersonalTag[]>([]);
    const [showTagModal, setShowTagModal] = useState(false);
    const [editingTag, setEditingTag] = useState<PersonalTag | null>(null);
    const [tagForm, setTagForm] = useState({ name: '', description: '', color: '#61dafb' });

    // 统计数据状态
    const [stats, setStats] = useState<PersonalStats>({
        totalArticles: 0,
        publishedArticles: 0,
        draftArticles: 0,
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
        totalTags: 0
    });

    // 模拟当前用户数据
    const currentUser = {
        name: 'Admin',
        avatar: 'https://i.pravatar.cc/150?img=12',
        role: '管理员',
        email: 'admin@techblog.com'
    };

    // 处理退出登录
    const handleLogout = () => {
        console.log('用户退出登录');
        // 这里可以添加实际的退出逻辑，比如清除token、跳转登录页等
    };

    // 导航菜单配置
    const navItems: NavItem[] = [
        { id: 'articles', label: '我的文章', icon: <FaFileAlt />, path: '/personal' },
        { id: 'tags', label: '我的标签', icon: <FaTag />, path: '/personal/tags' },
        { id: 'stats', label: '数据统计', icon: <FaChartBar />, path: '/personal/stats' },
    ];

    // 初始化数据
    useEffect(() => {
        setLoading(true);
        setTimeout(() => {
            setArticles(mockPersonalArticles);
            setFilteredArticles(mockPersonalArticles);
            setTags(mockPersonalTags);

            // 计算统计数据
            const calculatedStats: PersonalStats = {
                totalArticles: mockPersonalArticles.length,
                publishedArticles: mockPersonalArticles.filter(a => a.status === 'published').length,
                draftArticles: mockPersonalArticles.filter(a => a.status === 'draft').length,
                totalViews: mockPersonalArticles.reduce((sum, a) => sum + a.views, 0),
                totalLikes: mockPersonalArticles.reduce((sum, a) => sum + a.likes, 0),
                totalComments: mockPersonalArticles.reduce((sum, a) => sum + a.comments, 0),
                totalTags: mockPersonalTags.length
            };
            setStats(calculatedStats);
            setLoading(false);
        }, 800);
    }, []);

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
    const handleStatusChange = (selectedOption: SelectOption | null, selectedIndex: number, oldIndex: number) => {
        setSelectedStatus(selectedOption);
        if (selectedOption) {
            setStatusFilter(selectedOption.id as 'all' | 'published' | 'draft' | 'private');
        }
    };

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

        if (statusFilter !== 'all') {
            filtered = filtered.filter(article => article.status === statusFilter);
        }

        setFilteredArticles(filtered);
        setCurrentPage(1);
    }, [searchTerm, statusFilter, articles]);

    // 分页计算
    const totalPages = Math.ceil(filteredArticles.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentArticles = filteredArticles.slice(startIndex, endIndex);

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
    const handleDeleteArticle = (id: number) => {
        if (window.confirm('确定要删除这篇文章吗？')) {
            setArticles(articles.filter(article => article.id !== id));
        }
    };

    // 切换文章状态
    const handleToggleStatus = (id: number, newStatus: 'published' | 'draft' | 'private') => {
        setArticles(articles.map(article =>
            article.id === id ? { ...article, status: newStatus } : article
        ));
    };

    // 添加/编辑标签
    const handleSaveTag = () => {
        if (!tagForm.name.trim()) return;

        if (editingTag) {
            setTags(tags.map(tag =>
                tag.id === editingTag.id
                    ? { ...tag, name: tagForm.name, description: tagForm.description, color: tagForm.color }
                    : tag
            ));
        } else {
            const newTag: PersonalTag = {
                id: Math.max(...tags.map(t => t.id)) + 1,
                name: tagForm.name,
                description: tagForm.description,
                articleCount: 0,
                color: tagForm.color,
                createTime: new Date().toISOString().split('T')[0]
            };
            setTags([...tags, newTag]);
        }

        setShowTagModal(false);
        setEditingTag(null);
        setTagForm({ name: '', description: '', color: '#61dafb' });
    };

    // 删除标签
    const handleDeleteTag = (id: number) => {
        if (window.confirm('确定要删除这个标签吗？删除后关联文章将失去此标签。')) {
            setTags(tags.filter(tag => tag.id !== id));
        }
    };

    // 编辑标签
    const handleEditTag = (tag: PersonalTag) => {
        setEditingTag(tag);
        setTagForm({ name: tag.name, description: tag.description, color: tag.color });
        setShowTagModal(true);
    };

    if (loading) {
        return (
            <div className={styles.pageContainer}>
                <Loading size="large" text="正在加载个人数据..." />
            </div>
        );
    }

    if (loading) {
        return (
            <div className={styles.adminLayout}>
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
                        <Link to="/personal" className={styles.adminLogo}>
                            <span className={styles.adminLogoIcon}>👤</span>
                            <span className={styles.adminLogoText}>个人中心</span>
                        </Link>
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
                                    data-tooltip={item.label}
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
                                showAdminLink={true}
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
                                    <button className={styles.addButton}>
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
                                    {currentArticles.map(article => (
                                        <div key={article.id} className={styles.listItem}>
                                            <div className={styles.articleTitle}>
                                                <div>{article.title}</div>
                                                <div className={styles.articleSummary}>{article.summary}</div>
                                            </div>
                                            <div className={styles.articleCategory}>{article.category}</div>
                                            <div className={styles.statusCell}>
                                                <span className={`${styles.statusBadge} ${styles[article.status]}`}>
                                                    {article.status === 'published' ? '已发布' :
                                                     article.status === 'draft' ? '草稿' : '私密'}
                                                </span>
                                            </div>
                                            <div className={styles.dataCell}>
                                                <div className={styles.dataItem}>
                                                    <FaEye /> {article.views}
                                                </div>
                                                <div className={styles.dataItem}>
                                                    <FaThumbsUp /> {article.likes}
                                                </div>
                                                <div className={styles.dataItem}>
                                                    <FaComment /> {article.comments}
                                                </div>
                                            </div>
                                            <div className={styles.dateCell}>
                                                <FaCalendarAlt />
                                                {article.publishTime || '-'}
                                            </div>
                                            <div className={styles.actions}>
                                                <button className={styles.actionButton} title="查看">
                                                    <FaEye />
                                                </button>
                                                <button className={styles.actionButton} title="编辑">
                                                    <FaEdit />
                                                </button>
                                                {article.status === 'draft' && (
                                                    <button
                                                        className={styles.actionButton}
                                                        title="发布"
                                                        onClick={() => handleToggleStatus(article.id, 'published')}
                                                    >
                                                        <FaPlus />
                                                    </button>
                                                )}
                                                {article.status === 'published' && (
                                                    <button
                                                        className={styles.actionButton}
                                                        title="设为草稿"
                                                        onClick={() => handleToggleStatus(article.id, 'draft')}
                                                    >
                                                        <FaEdit />
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
                                    ))}
                                </div>

                                {/* 分页 */}
                                {totalPages > 1 && (
                                    <div className={styles.pagination}>
                                        <div className={styles.paginationInfo}>
                                            显示 {startIndex + 1} - {Math.min(endIndex, filteredArticles.length)} 条，
                                            共 {filteredArticles.length} 篇文章
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
                                                    onClick={() => handleDeleteTag(tag.id)}
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

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
                                                <button className={styles.confirmButton} onClick={handleSaveTag}>
                                                    {editingTag ? '更新' : '创建'}
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
                                            <span>草稿文章</span>
                                            <span>{stats.draftArticles} 篇</span>
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