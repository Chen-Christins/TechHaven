import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaThList, FaPen, FaBars, FaSignOutAlt, FaCog, FaUserCircle, FaStar, FaExternalLinkAlt } from 'react-icons/fa';
import styles from './Navbar.module.css';
import ThemeToggle from '../themeToggle/ThemeToggle';

// 用户信息类型
interface User {
	name: string;
	avatar: string;
	role: string; // 用于显示用户身份（如博主/访客）
	email: string; // 邮箱地址
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
		role: "管理员",
		email: "admin@techblog.com"
	};

	// 导航链接数据（包含图标和路径）
	const navLinks = [
		{ label: "首页", icon: <FaHome />, path: "/" },
		{ label: "登录", icon: <FaThList />, path: "/auth" },
		{ label: "管理", icon: <FaCog />, path: "/admin" },
		// { label: "标签", icon: <FaTags />, path: "/tags" },
		// { label: "关于", icon: <FaUser />, path: "/about" },
	];

	// 推荐网站数据
	const recommendations = [
		{
			title: "MDN Web Docs",
			url: "https://developer.mozilla.org",
		},
		{
			title: "GitHub",
			url: "https://github.com",
		},
		{
			title: "Stack Overflow",
			url: "https://stackoverflow.com",
		},
		{
			title: "CodePen",
			url: "https://codepen.io",
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
			<div className={styles.navItem} ref={recommendMenuRef}>
				<button
					className={styles.recommendButton}
					onClick={(e) => {
						e.stopPropagation();
						toggleRecommendMenu();
					}}
					title="推荐网站"
					data-active={recommendMenuOpen}
				>
					<FaStar className={styles.linkIcon} />
					<span className={styles.linkText}>推荐</span>
				</button>
				{recommendMenuOpen && (
					<div className={styles.recommendDropdown}>
						<div className={styles.dropdownContent}>
							{recommendations.map((item, index) => (
								<a
									key={index}
									href={item.url}
									target="_blank"
									rel="noopener noreferrer"
									className={styles.recommendItem}
									onClick={(e) => {
										e.stopPropagation();
										setRecommendMenuOpen(false);
									}}
								>
									<span className={styles.itemTitle}>{item.title}</span>
									<FaExternalLinkAlt className={styles.externalIcon} size={12} />
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
					{/* 移动端推荐选项 */}
					<li className={styles.mobileNavItem}>
						<div className={styles.mobileRecommendSection}>
							<button
								className={styles.mobileRecommendButton}
								onClick={() => setRecommendMenuOpen(!recommendMenuOpen)}
							>
								<FaStar className={styles.mobileLinkIcon} />
								<span className={styles.mobileLinkText}>推荐</span>
							</button>
							{recommendMenuOpen && (
								<div className={styles.mobileRecommendDropdown}>
									{recommendations.map((item, index) => (
										<a
											key={index}
											href={item.url}
											target="_blank"
											rel="noopener noreferrer"
											className={styles.mobileRecommendItem}
											onClick={() => {
												setMobileMenuOpen(false);
												setRecommendMenuOpen(false);
											}}
										>
											<span className={styles.mobileItemTitle}>{item.title}</span>
											<FaExternalLinkAlt className={styles.mobileExternalIcon} size={12} />
										</a>
									))}
								</div>
							)}
						</div>
					</li>
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
					<Link to="/" className={styles.logo}>
						<span className={styles.logoText}>TechBlog</span>
					</Link>

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
								<Link to="/profile/1" className={styles.dropdownItem} onClick={() => setUserMenuOpen(false)}>
									<FaUserCircle />
									个人中心
								</Link>
								<Link to="/article/create" className={styles.dropdownItem} onClick={() => setUserMenuOpen(false)}>
									<FaPen />
									撰写文章
								</Link>
								<div className={styles.dropdownDivider}></div>
								<button className={styles.dropdownItem} onClick={() => {
									setUserMenuOpen(false);
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

			{/* 移动端菜单 */}
			{renderMobileMenu()}
		</header>
	);
};

export default Navbar;