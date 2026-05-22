import React, { useState } from "react";
import { useLocation, Outlet, useNavigate } from "react-router-dom";
import { FaHome, FaBars, FaTimes, FaClipboardList, FaBug, FaTasks, FaTicketAlt } from "react-icons/fa";
import styles from "./RdLayout.module.css";
import ThemeToggle from "../../components/themeToggle/ThemeToggle";
import Notification from "../../components/notification/Notification";
import UserDropdown from "../../components/userDropdown/UserDropdown";
import Footer from "../../components/footer/Footer";
import { useAuth } from "../../contexts/AuthContext";

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

const RdLayout: React.FC = () => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "16px",
          color: "var(--text-secondary)",
        }}
      >
        加载中...
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    navigate("/auth");
    return null;
  }

  if (!user.avatar) {
    user.avatar = "https://picsum.photos/id/64/200";
  }

  const handleLogout = () => {
    logout();
  };

  const navSections: { title: string; items: NavItem[] }[] = [
    {
      title: "总览",
      items: [{ id: "dashboard", label: "仪表盘", icon: <FaHome />, path: "/rd" }],
    },
    {
      title: "研发管理",
      items: [
        { id: "requirements", label: "需求管理", icon: <FaClipboardList />, path: "/rd/requirements" },
        { id: "bugs", label: "缺陷管理", icon: <FaBug />, path: "/rd/bugs" },
        { id: "tasks", label: "任务管理", icon: <FaTasks />, path: "/rd/tasks" },
      ],
    },
    {
      title: "与我相关",
      items: [{ id: "myTickets", label: "我的工单", icon: <FaTicketAlt />, path: "/rd/my-tickets" }],
    },
  ];

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  const showTooltip = (event: React.MouseEvent, text: string) => {
    if (sidebarCollapsed) {
      let tooltip = document.getElementById("rd-sidebar-tooltip");
      if (!tooltip) {
        tooltip = document.createElement("div");
        tooltip.id = "rd-sidebar-tooltip";
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
          max-width: 200px;
          text-align: center;
        `;
        document.body.appendChild(tooltip);
      }
      tooltip.textContent = text;
      const rect = event.currentTarget.getBoundingClientRect();
      tooltip.style.left = `${rect.right + 12}px`;
      tooltip.style.top = `${rect.top + rect.height / 2}px`;
      tooltip.style.transform = "translateY(-50%)";
      setTimeout(() => {
        if (tooltip) tooltip.style.opacity = "1";
      }, 10);
    }
  };

  const hideTooltip = () => {
    const tooltip = document.getElementById("rd-sidebar-tooltip");
    if (tooltip) {
      tooltip.style.opacity = "0";
      setTimeout(() => {
        if (tooltip?.parentNode) tooltip.parentNode.removeChild(tooltip);
      }, 200);
    }
  };

  const getBreadcrumbs = () => {
    const pathSegments = location.pathname.split("/").filter(Boolean);
    const breadcrumbs = [{ label: "研发平台", path: "/rd" }];

    if (pathSegments.length >= 2) {
      const currentItem = navSections
        .flatMap((s) => s.items)
        .find((item) => {
          // Match exact paths or create/detail/edit child paths
          if (location.pathname === item.path) return true;
          if (location.pathname.startsWith(item.path + "/")) return true;
          return false;
        });

      if (currentItem && location.pathname !== currentItem.path) {
        breadcrumbs.push({ label: currentItem.label, path: currentItem.path });
      }

      // Add context-specific breadcrumb
      if (location.pathname.includes("/create")) {
        breadcrumbs.push({ label: "新建", path: location.pathname });
      } else if (location.pathname.includes("/edit")) {
        breadcrumbs.push({ label: "编辑", path: location.pathname });
      } else if (pathSegments.length >= 3 && !location.pathname.includes("/create") && !location.pathname.includes("/edit")) {
        breadcrumbs.push({ label: "详情", path: location.pathname });
      }
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className={styles.rdLayout}>
      <div className={`${styles.mobileMenuOverlay} ${mobileMenuOpen ? styles.show : ""}`} onClick={closeMobileMenu} />

      <div className={styles.rdContainer}>
        {/* 侧边栏 */}
        <aside
          className={`${styles.rdSidebar} ${sidebarCollapsed ? styles.collapsed : ""} ${mobileMenuOpen ? styles.mobileOpen : ""}`}
        >
          <div className={styles.rdSidebarHeader}>
            <div onClick={() => navigate("/rd")} className={styles.rdLogo}>
              <span className={styles.rdLogoIcon}>⚙</span>
              <span className={styles.rdLogoText}>研发平台</span>
            </div>
            <button className={styles.toggleSidebarBtn} onClick={toggleSidebar} title={sidebarCollapsed ? "展开侧边栏" : "收起侧边栏"}>
              {sidebarCollapsed ? <FaBars /> : <FaTimes />}
            </button>
          </div>

          <nav className={styles.rdNavMenu}>
            {navSections.map((section) => (
              <div key={section.title} className={styles.rdNavSection}>
                <h3 className={styles.rdSectionTitle}>{section.title}</h3>
                {section.items.map((item) => (
                  <div key={item.id} className={styles.rdNavItem}>
                    <div
                      onClick={() => {
                        navigate(item.path);
                        closeMobileMenu();
                      }}
                      className={`${styles.rdNavLink} ${location.pathname === item.path || (item.path !== "/rd" && location.pathname.startsWith(item.path)) ? styles.active : ""}`}
                      onMouseEnter={(e) => showTooltip(e, item.label)}
                      onMouseLeave={hideTooltip}
                    >
                      <span className={styles.rdNavIcon}>{item.icon}</span>
                      <span className={styles.rdNavText}>{item.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        <main className={`${styles.rdMainContent} ${sidebarCollapsed ? styles.expanded : ""}`}>
          <header className={styles.rdTopBar}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <button className={styles.mobileMenuBtn} onClick={toggleMobileMenu} aria-label="打开菜单">
                <FaBars />
              </button>

              <nav className={styles.rdBreadcrumb}>
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && <span className={styles.breadcrumbSeparator}>/</span>}
                    {index === breadcrumbs.length - 1 ? (
                      <span className={styles.breadcrumbActive}>{crumb.label}</span>
                    ) : (
                      <div onClick={() => navigate(crumb.path)} className={styles.breadcrumbLink}>
                        {crumb.label}
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </nav>
            </div>

            <div className={styles.rdTopBarActions}>
              <ThemeToggle />
              <Notification />
              <UserDropdown user={user} onLogout={handleLogout} showAdminLink={false} />
            </div>
          </header>

          <div className={styles.rdPageContent}>
            <Outlet />
          </div>

          <Footer companyName="TechBlog" startYear={2025} />
        </main>
      </div>
    </div>
  );
};

export default RdLayout;
