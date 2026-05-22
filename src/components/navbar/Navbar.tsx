import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaHome,
  FaPen,
  FaBars,
  FaSignOutAlt,
  FaUserCircle,
  FaStar,
  FaExternalLinkAlt,
  FaSignInAlt,
  FaBuilding,
  FaTasks,
  FaFlask,
  FaGamepad,
} from "react-icons/fa";
import styles from "./Navbar.module.css";
import ThemeToggle from "../themeToggle/ThemeToggle";
import AuthButtons from "../authButtons/AuthButtons";
import Notification from "../notification/Notification";
import Avatar from "../avatar/Avatar";
import { useAuth } from "../../contexts/AuthContext";

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // 获取认证状态
  const { user, isAuthenticated, logout, token, loading } = useAuth();

  // 状态管理
  const [isScrolled, setIsScrolled] = useState(false); // 滚动状态（控制导航栏样式变化）
  const [userMenuOpen, setUserMenuOpen] = useState(false); // 用户下拉菜单状态
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // 移动端菜单状态
  const [recommendMenuOpen, setRecommendMenuOpen] = useState(false); // 推荐下拉菜单状态
  const userMenuRef = useRef<HTMLDivElement>(null); // 用户菜单DOM引用
  const recommendMenuRef = useRef<HTMLDivElement>(null); // 推荐菜单DOM引用

  // console.log(user);

  // 用户数据（从认证上下文获取）
  const currentUser = user
    ? {
        name: user.name || user.account || "用户",
        avatar: user.avatar || "https://picsum.photos/id/64/200", // 默认头像
        role: user.role || "用户",
        email: user.email,
      }
    : null;

  // 导航链接数据（包含图标和路径）
  const navLinks = [
    { label: "首页", icon: <FaHome />, path: "/" },
    { label: "任务", icon: <FaTasks />, path: "/assignments" },
    { label: "组织", icon: <FaBuilding />, path: "/organizations/list" },
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

  // 监听滚动事件和用户状态变化
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [user, isAuthenticated, token]);

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
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
    const isActive = (path: string) => {
      if (path === "/") {
        return location.pathname === "/" || location.pathname === "/index";
      }
      if (path === "/assignments") {
        return location.pathname.startsWith("/assignments") || location.pathname.startsWith("/assignment");
      }
      if (path === "/organizations/list") {
        return location.pathname.startsWith("/organizations") || location.pathname.startsWith("/organization");
      }
      if (path === "/gm") {
        return location.pathname.startsWith("/gm");
      }
      if (path === "/rd") {
        return location.pathname.startsWith("/rd");
      }
      return location.pathname === path;
    };

    const links = [...navLinks];
    if (isAuthenticated) {
      links.push({ label: "研发", icon: <FaFlask />, path: "/rd" });
    }
    if (isAuthenticated && user?.role === "管理员") {
      links.push({ label: "游戏", icon: <FaGamepad />, path: "/gm" });
    }

    return (
      <ul className={styles.navLinks}>
        {links.map((link, index) => (
          <li key={index} className={styles.navItem}>
            <div
              onClick={() => {
                navigate(link.path);
              }}
              className={styles.navLink}
              data-active={isActive(link.path)}
            >
              <span className={styles.linkIcon}>{link.icon}</span>
              <span className={styles.linkText}>{link.label}</span>
            </div>
          </li>
        ))}
        {renderRecommendMenu()}
      </ul>
    );
  };

  // 渲染移动端菜单
  const renderMobileMenu = () => {
    return (
      <div className={`${styles.mobileMenu} ${mobileMenuOpen ? styles.mobileMenuOpen : ""}`}>
        <ul className={styles.mobileNavLinks}>
          {navLinks
            .concat(
              isAuthenticated ? [{ label: "研发平台", icon: <FaFlask />, path: "/rd" }] : [],
              isAuthenticated && user?.role === "管理员" ? [{ label: "GM 控制台", icon: <FaGamepad />, path: "/gm" }] : [],
            )
            .map((link, index) => (
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
              <button className={styles.mobileRecommendButton} onClick={() => setRecommendMenuOpen(!recommendMenuOpen)}>
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
          {/* 移动端认证区域 */}
          {loading ? (
            // 认证状态加载中 - 显示占位符以避免状态切换的闪烁
            <li className={styles.mobileNavItem}>
              <div className={styles.mobileAuthSection}>
                <div className={styles.mobileAuthButtonPlaceholder}>
                  <FaSignInAlt className={styles.mobileLinkIcon} />
                  <span className={styles.mobileLinkText}>加载中...</span>
                </div>
              </div>
            </li>
          ) : !isAuthenticated ? (
            <li className={styles.mobileNavItem}>
              <div className={styles.mobileAuthSection}>
                <div
                  className={styles.mobileAuthButton}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/login");
                  }}
                >
                  <FaSignInAlt className={styles.mobileLinkIcon} />
                  <span className={styles.mobileLinkText}>登录 | 注册</span>
                </div>
              </div>
            </li>
          ) : null}
        </ul>
      </div>
    );
  };

  return (
    <header className={`${styles.navbar} ${isScrolled ? styles.navbarScrolled : ""}`}>
      <div className={styles.container}>
        {/* 左侧Logo和导航 */}
        <div className={styles.leftSection}>
          {/* Logo */}
          <div className={styles.logo} onClick={() => navigate("/")}>
            <span className={styles.logoText}>TechBlog</span>
          </div>

          {/* 桌面端导航链接 */}
          <div className={styles.desktopNav}>{renderNavLinks()}</div>

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
          {import.meta.env.DEV && (
            <button
              className={styles.testButton}
              onClick={() => {
                setUserMenuOpen(false);
                setMobileMenuOpen(false);
                navigate("/test/chunk-upload");
              }}
              type="button"
              title="进入测试页面"
              aria-label="进入测试页面"
            >
              <FaFlask className={styles.testButtonIcon} />
            </button>
          )}
          {/* 主题切换按钮 */}
          <ThemeToggle />

          {/* 通知按钮 */}
          {isAuthenticated && <Notification />}

          {loading ? (
            // 认证状态加载中 - 显示占位符以避免状态切换的闪烁
            <div className={styles.userAreaPlaceholder}>
              <div className={styles.avatarContainer}>
                <div className={styles.avatarPlaceholder}></div>
              </div>
            </div>
          ) : isAuthenticated && currentUser ? (
            <>
              <div className={styles.userArea} onClick={toggleUserMenu}>
                {/* 用户头像 */}
                <div className={styles.avatarContainer}>
                  <Avatar src={currentUser.avatar} name={currentUser.name} size={36} className={styles.avatar} />
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
                    <Avatar src={currentUser.avatar} name={currentUser.name} size={48} />
                    <div className={styles.dropdownUserInfo}>
                      <div className={styles.dropdownUserName}>{currentUser.name}</div>
                      <div className={styles.dropdownUserEmail}>{currentUser.email}</div>
                    </div>
                  </div>
                  <div className={styles.dropdownDivider}></div>
                  <div className={styles.dropdownMenu}>
                    <div
                      className={styles.dropdownItem}
                      onClick={() => {
                        setUserMenuOpen(false);
                        navigate("/personal");
                      }}
                    >
                      <FaUserCircle />
                      个人中心
                    </div>
                    <div
                      className={styles.dropdownItem}
                      onClick={() => {
                        setUserMenuOpen(false);
                        navigate("/article/create");
                      }}
                    >
                      <FaPen />
                      撰写文章
                    </div>
                    <div className={styles.dropdownDivider}></div>
                    <button
                      className={styles.dropdownItem}
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                    >
                      <FaSignOutAlt />
                      退出登录
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* 未登录状态：显示登录/注册按钮 */
            <AuthButtons
              onButtonClick={() => {
                // 关闭可能打开的移动端菜单
                if (mobileMenuOpen) {
                  setMobileMenuOpen(false);
                }
              }}
            />
          )}
        </div>
      </div>

      {/* 移动端菜单 */}
      {renderMobileMenu()}
    </header>
  );
};

export default Navbar;
