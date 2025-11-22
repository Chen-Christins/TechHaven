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
    FaDatabase,
    FaUserCircle,
    FaChevronDown,
    FaSignOutAlt
} from 'react-icons/fa';
import styles from './AdminLayout.module.css';
import ThemeToggle from '../../components/themeToggle/ThemeToggle';
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
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const location = useLocation();

    // 模拟当前用户数据
    const currentUser = {
        name: 'Admin',
        avatar: 'https://i.pravatar.cc/150?img=12',
        role: '超级管理员',
        email: 'admin@techblog.com'
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

    // 切换用户菜单
    const toggleUserMenu = () => {
        setUserMenuOpen(!userMenuOpen);
    };

    // 关闭用户菜单
    const closeUserMenu = () => {
        setUserMenuOpen(false);
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

    // 点击外部关闭用户菜单
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (!target.closest(`.${styles.userInfoSection}`)) {
                closeUserMenu();
            }
        };

        if (userMenuOpen) {
            document.addEventListener('click', handleClickOutside);
        }

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [userMenuOpen]);

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
                                            data-tooltip={item.label}
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
                            <div className={styles.userInfoSection}>
                                <div className={styles.userDisplay} onClick={toggleUserMenu}>
                                    <img
                                        src={currentUser.avatar}
                                        alt={currentUser.name}
                                        className={styles.userAvatar}
                                    />
                                    <div className={styles.userDetails}>
                                        <div className={styles.userName}>{currentUser.name}</div>
                                        <div className={styles.userRole}>{currentUser.role}</div>
                                    </div>
                                    <FaChevronDown className={`${styles.userMenuArrow} ${userMenuOpen ? styles.open : ''}`} />
                                </div>

                                {/* 用户下拉菜单 */}
                                {userMenuOpen && (
                                    <div className={styles.userDropdown}>
                                        <div className={styles.dropdownHeader}>
                                            <img
                                                src={currentUser.avatar}
                                                alt={currentUser.name}
                                                className={styles.dropdownAvatar}
                                            />
                                            <div className={styles.dropdownUserInfo}>
                                                <div className={styles.dropdownUserName}>{currentUser.name}</div>
                                                <div className={styles.dropdownUserEmail}>{currentUser.email}</div>
                                            </div>
                                        </div>
                                        <div className={styles.dropdownDivider}></div>
                                        <div className={styles.dropdownMenu}>
                                            <Link to="/admin/profile" className={styles.dropdownItem} onClick={closeUserMenu}>
                                                <FaUserCircle />
                                                个人资料
                                            </Link>
                                            <Link to="/admin/settings" className={styles.dropdownItem} onClick={closeUserMenu}>
                                                <FaCog />
                                                账户设置
                                            </Link>
                                            <div className={styles.dropdownDivider}></div>
                                            <button className={styles.dropdownItem} onClick={() => {
                                                closeUserMenu();
                                                // 处理退出登录
                                                console.log('退出登录');
                                            }}>
                                                <FaSignOutAlt />
                                                退出登录
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
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