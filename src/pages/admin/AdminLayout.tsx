import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import {
    FaHome,
    FaUsers,
    FaFileAlt,
    FaChartBar,
    FaCog,
    FaBars,
    FaTimes,
    FaUserShield,
    FaComments,
    FaTags,
    FaImages,
    FaDatabase
} from 'react-icons/fa';
import styles from './AdminLayout.module.css';
import ThemeToggle from '../../components/themeToggle/ThemeToggle';
import UserDropdown from '../../components/userDropdown/UserDropdown';
import Footer from '../../components/footer/Footer';

interface NavItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    path: string;
    section?: string;
}

const AdminLayout: React.FC = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();

    // 清理tooltip
    useEffect(() => {
        return () => {
            const tooltip = document.getElementById('admin-sidebar-tooltip');
            if (tooltip && tooltip.parentNode) {
                tooltip.parentNode.removeChild(tooltip);
            }
        };
    }, []);

    // 模拟当前用户数据
    const currentUser = {
        name: 'Admin',
        avatar: 'https://i.pravatar.cc/150?img=12',
        role: '超级管理员',
        email: 'admin@techblog.com'
    };

    // 处理退出登录
    const handleLogout = () => {
        // console.log('管理员退出登录');
        // 这里可以添加实际的退出逻辑，比如清除token、跳转登录页等
    };

    // 导航菜单配置
    const navSections: { title: string; items: NavItem[] }[] = [
        {
            title: '主要功能',
            items: [
                { id: 'dashboard', label: '仪表盘', icon: <FaHome />, path: '/admin' },
                { id: 'users', label: '用户管理', icon: <FaUsers />, path: '/admin/users' },
                { id: 'articles', label: '文章管理', icon: <FaFileAlt />, path: '/admin/articles' },
                { id: 'comments', label: '评论管理', icon: <FaComments />, path: '/admin/comments' },
            ]
        },
        {
            title: '内容管理',
            items: [
                { id: 'categories', label: '分类管理', icon: <FaTags />, path: '/admin/categories' },
                { id: 'media', label: '媒体库', icon: <FaImages />, path: '/admin/media' },
                { id: 'database', label: '数据管理', icon: <FaDatabase />, path: '/admin/database' },
            ]
        },
        {
            title: '系统设置',
            items: [
                { id: 'analytics', label: '统计分析', icon: <FaChartBar />, path: '/admin/analytics' },
                { id: 'settings', label: '系统设置', icon: <FaCog />, path: '/admin/settings' },
                { id: 'permissions', label: '权限管理', icon: <FaUserShield />, path: '/admin/permissions' },
            ]
        }
    ];

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
            let tooltip = document.getElementById('admin-sidebar-tooltip');
            if (!tooltip) {
                tooltip = document.createElement('div');
                tooltip.id = 'admin-sidebar-tooltip';
                tooltip.style.cssText = `
                    position: fixed;
                    padding: 8px 12px;
                    background-color: var(--text-primary);
                    color: var(--bg-primary);
                    font-size: 13px;
                    font-weight: 500;
                    border-radius: 8px;
                    white-space: nowrap;
                    z-index: 10000;
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
                    pointer-events: none;
                    opacity: 0;
                    transition: opacity 0.2s ease;
                    max-width: 200px;
                    text-align: center;
                `;
                document.body.appendChild(tooltip);
            }

            tooltip.textContent = text;
            const rect = event.currentTarget.getBoundingClientRect();
            tooltip.style.left = `${rect.right + 12}px`;
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
        const tooltip = document.getElementById('admin-sidebar-tooltip');
        if (tooltip) {
            tooltip.style.opacity = '0';
            setTimeout(() => {
                if (tooltip.parentNode) {
                    tooltip.parentNode.removeChild(tooltip);
                }
            }, 200);
        }
    };

    
    // 获取面包屑导航
    const getBreadcrumbs = () => {
        const pathSegments = location.pathname.split('/').filter(Boolean);
        const breadcrumbs = [{ label: '首页', path: '/admin' }];

        if (pathSegments.length > 1) {
            const currentSection = navSections.find(section =>
                section.items.some(item => item.path === location.pathname)
            );

            if (currentSection) {
                const currentItem = currentSection.items.find(item => item.path === location.pathname);
                if (currentItem) {
                    breadcrumbs.push({ label: currentItem.label, path: currentItem.path });
                }
            }
        } else if (pathSegments.length === 1 && pathSegments[0] === 'admin') {
            // 当前在仪表盘页面
        }

        return breadcrumbs;
    };

    const breadcrumbs = getBreadcrumbs();

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
                        <Link to="/admin" className={styles.adminLogo}>
                            <span className={styles.adminLogoIcon}>⚡</span>
                            <span className={styles.adminLogoText}>管理后台</span>
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
                        {navSections.map((section) => (
                            <div key={section.title} className={styles.adminNavSection}>
                                <h3 className={styles.adminSectionTitle}>{section.title}</h3>
                                {section.items.map((item) => (
                                    <div key={item.id} className={styles.adminNavItem}>
                                        <Link
                                            to={item.path}
                                            className={`${styles.adminNavLink} ${location.pathname === item.path ? styles.active : ''}`}
                                            onClick={closeMobileMenu}
                                            onMouseEnter={(e) => showTooltip(e, item.label)}
                                            onMouseLeave={hideTooltip}
                                        >
                                            <span className={styles.adminNavIcon}>{item.icon}</span>
                                            <span className={styles.adminNavText}>{item.label}</span>
                                        </Link>
                                    </div>
                                ))}
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
                                {breadcrumbs.map((crumb, index) => (
                                    <React.Fragment key={index}>
                                        {index > 0 && <span className={styles.breadcrumbSeparator}>/</span>}
                                        {index === breadcrumbs.length - 1 ? (
                                            <span className={styles.breadcrumbActive}>{crumb.label}</span>
                                        ) : (
                                            <Link to={crumb.path} className={styles.breadcrumbLink}>
                                                {crumb.label}
                                            </Link>
                                        )}
                                    </React.Fragment>
                                ))}
                            </nav>
                        </div>

                        {/* 顶部操作区域 */}
                        <div className={styles.adminTopBarActions}>
                            <ThemeToggle />

                            {/* 用户信息区域 */}
                            <UserDropdown
                                user={currentUser}
                                onLogout={handleLogout}
                                showAdminLink={false}
                            />
                        </div>
                    </header>

                    {/* 页面内容 */}
                    <div className={styles.adminPageContent}>
                        <Outlet />
                    </div>

                    {/* Footer */}
                    <Footer companyName="TechBlog" />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;