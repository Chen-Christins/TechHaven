import React from "react";
import { useSiteSettings } from "../../contexts/SiteSettingsContext";
import { useAuth } from "../../contexts/AuthContext";
import { useIdleTimeout } from "../../hooks/useIdleTimeout";

const IdleTimeoutHandler: React.FC = () => {
  const { settings } = useSiteSettings();
  const { isAuthenticated, logout } = useAuth();

  useIdleTimeout(settings.sessionTimeout, logout, isAuthenticated);

  return null;
};

export default IdleTimeoutHandler;
