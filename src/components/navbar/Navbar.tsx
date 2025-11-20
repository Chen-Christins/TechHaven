import React, { useState, useEffect, useRef } from 'react';
import { FaHome, FaThList, FaPen, FaUser, FaBars, FaSignOutAlt, FaCog, FaUserCircle, FaStar, FaExternalLinkAlt } from 'react-icons/fa';
import styles from './Navbar.module.css';
import SearchBox from '../searchBox/SearchBox';
import ThemeToggle from '../themeToggle/ThemeToggle';

// 用户信息类型
interface User {
	name: string;
	avatar: string;
	role: string; // 用于显示用户身份（如博主/访客）
}

const Navbar: React.FC = () => {
	// 状态管理
	const [isScrolled, setIsScrolled] = useState(false); // 滚动状态（控制导航栏样式变化）
	const [userMenuOpen, setUserMenuOpen] = useState(false); // 用户下拉菜单状态
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // 移动端菜单状态
	const [recommendMenuOpen, setRecommendMenuOpen] = useState(false); // 推荐下拉菜单状态
	const userMenuRef = useRef<HTMLDivElement>(null); // 用户菜单DOM引用
	const recommendMenuRef = useRef<HTMLDivElement>(null); // 推荐菜单DOM引用

	// 模拟用户数据
	const currentUser: User = {
		name: "Admin",
		avatar: "https://picsum.photos/id/64/200", // 占位头像
		role: "管理员"
	};

	// 导航链接数据（包含图标和路径）
	const navLinks = [
		{ label: "首页", icon: <FaHome />, path: "/" },
		{ label: "登录", icon: <FaThList />, path: "/auth" },
		// { label: "标签", icon: <FaTags />, path: "/tags" },
		// { label: "关于", icon: <FaUser />, path: "/about" },
	];

	// 推荐网站数据
	const recommendations = [
		{
			title: "网站A",
			description: "优质的前端学习资源",
			url: "https://example-a.com",
			category: "学习"
		},
		{
			title: "网站B",
			description: "开发者必备的工具集合",
			url: "https://example-b.com",
			category: "工具"
		},
		{
			title: "网站C",
			description: "最新的技术资讯",
			url: "https://example-c.com",
			category: "资讯"
		},
	];

	// 监听滚动事件，改变导航栏样式
	useEffect(() => {
		const handleScroll = () => {
			setIsScrolled(window.scrollY > 10);
		};
		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	// 点击外部关闭用户菜单
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
				setUserMenuOpen(false);
			}
			if (recommendMenuRef.current && !recommendMenuRef.current.contains(event.target as Node)) {
				setRecommendMenuOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	// 切换用户菜单
	const toggleUserMenu = () => {
		setUserMenuOpen(!userMenuOpen);
	};

	// 切换推荐菜单
	const toggleRecommendMenu = () => {
		setRecommendMenuOpen(!recommendMenuOpen);
	};

	// 渲染推荐下拉菜单
	const renderRecommendMenu = () => {
		return (
			<div className={styles.navItem}>
				<button
					className={styles.recommendButton}
					onClick={toggleRecommendMenu}
					title="推荐网站"
				>
					<FaStar className={styles.linkIcon} />
					<span className={styles.linkText}>推荐</span>
				</button>
				{recommendMenuOpen && (
					<div className={styles.recommendDropdown} ref={recommendMenuRef}>
						<div className={styles.dropdownHeader}>
							<span className={styles.dropdownTitle}>推荐网站</span>
						</div>
						<div className={styles.dropdownContent}>
							{recommendations.map((item, index) => (
								<a
									key={index}
									href={item.url}
									target="_blank"
									rel="noopener noreferrer"
									className={styles.recommendItem}
								>
									<div className={styles.itemMain}>
										<span className={styles.itemTitle}>{item.title}</span>
										<FaExternalLinkAlt className={styles.externalIcon} size={12} />
									</div>
									<span className={styles.itemDescription}>{item.description}</span>
									<span className={styles.itemCategory}>{item.category}</span>
								</a>
							))}
						</div>
					</div>
				)}
			</div>
		);
	};

	// 渲染导航链接（桌面端）
	const renderNavLinks = () => {
		return (
			<ul className={styles.navLinks}>
				{navLinks.map((link, index) => (
					<li key={index} className={styles.navItem}>
						<a
							href={link.path}
							className={styles.navLink}
							// 假设首页为当前活跃页
							data-active={link.path === "/"}
						>
							<span className={styles.linkIcon}>{link.icon}</span>
							<span className={styles.linkText}>{link.label}</span>
						</a>
					</li>
				))}
				{renderRecommendMenu()}
			</ul>
		);
	};

	// 渲染移动端菜单
	const renderMobileMenu = () => {
		return (
			<div className={`${styles.mobileMenu} ${mobileMenuOpen ? styles.mobileMenuOpen : ''}`}>
				<ul className={styles.mobileNavLinks}>
					{navLinks.map((link, index) => (
						<li key={index} className={styles.mobileNavItem}>
							<a
								href={link.path}
								className={styles.mobileNavLink}
								onClick={() => setMobileMenuOpen(false)} // 点击后关闭菜单
							>
								<span className={styles.mobileLinkIcon}>{link.icon}</span>
								<span className={styles.mobileLinkText}>{link.label}</span>
							</a>
						</li>
					))}
				</ul>
			</div>
		);
	};

	return (
		<header className={`${styles.navbar} ${isScrolled ? styles.navbarScrolled : ''}`}>
			<div className={styles.container}>
				{/* 左侧Logo和导航 */}
				<div className={styles.leftSection}>
					{/* Logo */}
					<a href="/" className={styles.logo}>
						<span className={styles.logoText}>TechBlog</span>
					</a>

					{/* 桌面端导航链接 */}
					<div className={styles.desktopNav}>
						{renderNavLinks()}
					</div>

					{/* 移动端菜单按钮 */}
					<button
						className={styles.mobileMenuBtn}
						onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
						aria-label={mobileMenuOpen ? "关闭菜单" : "打开菜单"}
					>
						<FaBars className={styles.menuIcon} />
					</button>
				</div>

				{/* 右侧用户区域 */}
				<div className={styles.rightSection} ref={userMenuRef}>
					{/* 主题切换按钮 */}
					<ThemeToggle />

					<div className={styles.userArea} onClick={toggleUserMenu}>
						{/* 用户头像 */}
						<div className={styles.avatarContainer}>
							<img
								src={currentUser.avatar}
								alt={currentUser.name}
								className={styles.avatar}
							/>
							{/* 在线状态指示器 */}
							<span className={styles.statusIndicator}></span>
						</div>

						{/* 用户信息（桌面端显示） */}
						<div className={styles.userInfo}>
							<div className={styles.userName}>{currentUser.name}</div>
							<div className={styles.userRole}>{currentUser.role}</div>
						</div>
					</div>

					{/* 用户下拉菜单 */}
					<div className={`${styles.userMenu} ${userMenuOpen ? styles.userMenuOpen : ''}`}>
						<ul className={styles.menuItems}>
							<li className={styles.menuItem}>
								<a href="/profile/1" className={styles.menuLink}>
									<FaUserCircle className={styles.menuIcon} />
									<span>个人中心</span>
								</a>
							</li>
							<li className={styles.menuDivider}></li>
                            <li className={styles.menuItem}>
								<a href="/article/create" className={styles.menuLink}>
									<FaPen className={styles.menuIcon} />
									<span>撰写文章</span>
								</a>
							</li>
							<li className={styles.menuDivider}></li>
							<li className={styles.menuItem}>
								<a href="/logout" className={styles.menuLink} style={{ color: '#ef4444' }}>
									<FaSignOutAlt className={styles.menuIcon} />
									<span>退出登录</span>
								</a>
							</li>
						</ul>
					</div>
				</div>
			</div>

			{/* 移动端菜单 */}
			{renderMobileMenu()}
		</header>
	);
};

export default Navbar;