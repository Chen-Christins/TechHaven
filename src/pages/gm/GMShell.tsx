import React from "react";
import { Outlet } from "react-router-dom";
import { FaGamepad, FaFileAlt, FaServer } from "react-icons/fa";
import GMLayout from "./GMLayout";
import { useAuth } from "../../contexts/AuthContext";
import NotFound404 from "../error/NotFound404";
import styles from "./GMShell.module.css";
import Loading from "../../components/loading/Loading";

const gmNavItems = [
  { path: "/gm/dashboard", label: "总览", icon: <FaGamepad /> },
  { path: "/gm/protocol", label: "协议", icon: <FaFileAlt /> },
  { path: "/gm/server", label: "服务器管理", icon: <FaServer /> },
];

const GMShell: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className={styles.page}>
        <Loading size="medium" text="正在加载权限..." />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "管理员") {
    return <NotFound404 />;
  }

  return (
    <GMLayout navItems={gmNavItems}>
      <Outlet />
    </GMLayout>
  );
};

export default GMShell;
