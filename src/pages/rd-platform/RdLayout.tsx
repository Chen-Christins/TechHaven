import React, { useState, useEffect } from "react";
import { useLocation, Outlet, useNavigate, useSearchParams } from "react-router-dom";
import { encodeId, decodeId } from "../../utils/hashId";
import { FaHome, FaBars, FaTimes, FaClipboardList, FaBug, FaTasks, FaTicketAlt, FaLock } from "react-icons/fa";
import styles from "./RdLayout.module.css";
import ThemeToggle from "../../components/themeToggle/ThemeToggle";
import Notification from "../../components/notification/Notification";
import UserDropdown from "../../components/userDropdown/UserDropdown";
import NotFound404 from "../error/NotFound404";
import Footer from "../../components/footer/Footer";
import OrgSelector from "../../components/orgSelector/OrgSelector";
import { useAuth } from "../../contexts/AuthContext";
import { RdOrgProvider, useRdOrg } from "../../contexts/RdOrgContext";
import { RdPlatformService } from "../../services/rdPlatformService";

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

const RdLayout: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawOrg = searchParams.get("org");
  const urlOrgId = rawOrg ? decodeId(rawOrg)?.toString() || "" : "";
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout, isAuthenticated, loading } = useAuth();

  // 权限校验：调用后端 check_access 接口
  const [accessChecked, setAccessChecked] = useState(false);
  const [canAccess, setCanAccess] = useState(false);

  useEffect(() => {
    if (!user) return;
    RdPlatformService.checkAccess()
      .then((result) => {
        setCanAccess(result.canAccess);
      })
      .catch(() => {
        setCanAccess(false);
      })
      .finally(() => setAccessChecked(true));
  }, [user]);

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
    return <NotFound404 />;
  }

  if (!accessChecked) {
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
        正在验证权限...
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "var(--bg-primary)",
          color: "var(--text-primary)",
          padding: "20px",
        }}
      >
        <div
          style={{
            fontSize: "64px",
            color: "#dc3545",
            marginBottom: "24px",
            opacity: 0.9,
          }}
        >
          <FaLock />
        </div>
        <h1
          style={{
            fontSize: "28px",
            fontWeight: "bold",
            marginBottom: "12px",
            color: "var(--text-primary)",
          }}
        >
          访问被拒绝
        </h1>
        <p
          style={{
            fontSize: "16px",
            color: "var(--text-secondary)",
            marginBottom: "32px",
            textAlign: "center",
            maxWidth: "480px",
            lineHeight: "1.6",
          }}
        >
          抱歉，您没有权限访问研发平台。需要系统管理员权限或在已批准的组织中具有报告者及以上角色。
          <br />
          如果您认为这是一个错误，请联系组织管理员。
        </p>
        <div style={{ display: "flex", gap: "16px" }}>
          <button
            onClick={() => navigate("/")}
            style={{
              padding: "10px 24px",
              backgroundColor: "var(--primary)",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "15px",
              fontWeight: "500",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <FaHome /> 返回首页
          </button>
          <button
            onClick={() => logout()}
            style={{
              padding: "10px 24px",
              backgroundColor: "transparent",
              color: "var(--text-primary)",
              border: "1px solid var(--border-primary)",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "15px",
              fontWeight: "500",
            }}
          >
            切换账号
          </button>
        </div>
      </div>
    );
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

  const orgRoleNames: Record<number, string> = {
    1: "普通成员",
    2: "报告者",
    3: "开发者",
    4: "研发主管",
    5: "组织管理员",
  };

  const RdHeaderActions: React.FC = () => {
    const { maxOrgRole, isAdmin, orgs } = useRdOrg();
    const orgRoleName = orgRoleNames[maxOrgRole] || "";
    // 系统管理员在没有组织时，显示"系统管理员"而非"组织管理员"
    const roleOverride = isAdmin && orgs.length === 0 ? "系统管理员" : orgRoleName;
    return (
      <div className={styles.rdTopBarActions}>
        <ThemeToggle />
        <Notification />
        <UserDropdown user={user} onLogout={handleLogout} showAdminLink={false} roleOverride={roleOverride} />
      </div>
    );
  };

  const SidebarOrgSelector: React.FC = () => {
    const { orgs, selectedOrgId, setSelectedOrgId } = useRdOrg();
    const [, setSearchParams] = useSearchParams();

    const handleOrgChange = (orgId: string) => {
      setSelectedOrgId(orgId);
      if (orgId) {
        setSearchParams({ org: encodeId(orgId) }, { replace: true });
      } else {
        setSearchParams({}, { replace: true });
      }
    };

    return <OrgSelector orgs={orgs} selectedOrgId={selectedOrgId} onChange={handleOrgChange} collapsed={sidebarCollapsed} />;
  };

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

  // 导航时保留 org 参数
  const navigateWithOrg = (path: string) => {
    const org = searchParams.get("org");
    if (org) {
      navigate(`${path}?org=${org}`);
    } else {
      navigate(path);
    }
  };

  return (
    <div className={styles.rdLayout}>
      <div className={`${styles.mobileMenuOverlay} ${mobileMenuOpen ? styles.show : ""}`} onClick={closeMobileMenu} />

      <RdOrgProvider initialOrgId={urlOrgId}>
        <div className={styles.rdContainer}>
          {/* 侧边栏 */}
          <aside
            className={`${styles.rdSidebar} ${sidebarCollapsed ? styles.collapsed : ""} ${mobileMenuOpen ? styles.mobileOpen : ""}`}
          >
            <div className={styles.rdSidebarHeader}>
              <div onClick={() => navigateWithOrg("/rd")} className={styles.rdLogo}>
                <span className={styles.rdLogoIcon}>⚙</span>
                <span className={styles.rdLogoText}>研发平台</span>
              </div>
              <button
                className={styles.toggleSidebarBtn}
                onClick={toggleSidebar}
                title={sidebarCollapsed ? "展开侧边栏" : "收起侧边栏"}
              >
                {sidebarCollapsed ? <FaBars /> : <FaTimes />}
              </button>
            </div>

            <SidebarOrgSelector />

            <nav className={styles.rdNavMenu}>
              {navSections.map((section) => (
                <div key={section.title} className={styles.rdNavSection}>
                  <h3 className={styles.rdSectionTitle}>{section.title}</h3>
                  {section.items.map((item) => (
                    <div key={item.id} className={styles.rdNavItem}>
                      <div
                        onClick={() => {
                          navigateWithOrg(item.path);
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
                        <div onClick={() => navigateWithOrg(crumb.path)} className={styles.breadcrumbLink}>
                          {crumb.label}
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </nav>
              </div>

              <RdHeaderActions />
            </header>

            <div className={styles.rdPageContent}>
              <Outlet />
            </div>

            <Footer startYear={2025} />
          </main>
        </div>
      </RdOrgProvider>
    </div>
  );
};

export default RdLayout;
