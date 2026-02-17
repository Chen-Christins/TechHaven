import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./GMLayout.module.css";
import Navbar from "../../components/navbar/Navbar";
import Footer from "../../components/footer/Footer";
import { resolveBackendEnvLabel } from "../../utils/http";

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

interface NavSection {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface GMLayoutProps {
  navItems?: NavItem[];
  navSections?: NavSection[];
  activeSection?: string;
  scrollToSection?: (id: string) => void;
  children: React.ReactNode;
}

const GMLayout: React.FC<GMLayoutProps> = ({ navItems, navSections, activeSection, scrollToSection, children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const envLabel = resolveBackendEnvLabel();

  const isActive = (path: string) => location.pathname.startsWith(path);
  const useNavItems = Boolean(navItems && navItems.length);

  return (
    <div className={styles.shell}>
      <Navbar />
      <div className={styles.page}>
        <div className={styles.layout}>
          <aside className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
              <div className={styles.sidebarTitle}>GM 控制台</div>
              <div className={styles.sidebarEnv}>{envLabel}</div>
            </div>
            <div className={styles.sidebarNav}>
              {useNavItems &&
                navItems?.map((item) => (
                  <button
                    key={item.path}
                    className={`${styles.navBtn} ${isActive(item.path) ? styles.navBtnActive : ""}`}
                    onClick={() => navigate(item.path)}
                  >
                    <span className={styles.navIcon}>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              {!useNavItems &&
                navSections?.map((item) => (
                  <button
                    key={item.id}
                    className={`${styles.navBtn} ${activeSection === item.id ? styles.navBtnActive : ""}`}
                    onClick={() => scrollToSection?.(item.id)}
                  >
                    <span className={styles.navIcon}>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
            </div>
          </aside>

          <div className={styles.main}>{children}</div>
        </div>
      </div>
      <Footer companyName="TechBlog" />
    </div>
  );
};

export default GMLayout;
