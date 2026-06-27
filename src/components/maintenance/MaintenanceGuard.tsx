import React, { useEffect, useRef } from "react";
import { Outlet } from "react-router-dom";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import MaintenancePage from "./MaintenancePage";

const MaintenanceGuard: React.FC = () => {
  const { settings, loading } = useSiteSettings();
  const { user, isAuthenticated, logout } = useAuth();
  const loggedOutRef = useRef(false);

  const isAdmin = user?.role === "管理员";
  const blocked = !loading && settings.maintenanceMode && !isAdmin;

  useEffect(() => {
    if (blocked && isAuthenticated && !loggedOutRef.current) {
      loggedOutRef.current = true;
      logout();
    }
    if (!blocked) {
      loggedOutRef.current = false;
    }
  }, [blocked, isAuthenticated, logout]);

  if (loading) {
    return null;
  }

  if (blocked) {
    return <MaintenancePage />;
  }

  return <Outlet />;
};

export default MaintenanceGuard;
