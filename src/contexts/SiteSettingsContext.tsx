import React, { createContext, useState, useEffect, useCallback, useContext } from "react";
import SettingsService from "../services/settingsService";
import { resetOriginalFavicon } from "../utils/favicon";
import { readSiteSettingsCache, writeSiteSettingsCache } from "../utils/siteSettingsCache";

export interface SiteSettingsState {
  siteName: string;
  siteDescription: string;
  siteKeywords: string;
  siteIcon: string;
  siteLogo: string;
  favicon: string;
  adminEmail: string;
  timezone: string;
  language: string;
  enableRegistration: boolean;
  requireEmailVerification: boolean;
  allowComments: boolean;
  moderateComments: boolean;
  maxFileSize: number;
  allowedFileTypes: string;
  sessionTimeout: number;
  maintenanceMode: boolean;
}

interface SiteSettingsContextType {
  settings: SiteSettingsState;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const DEFAULT_SETTINGS: SiteSettingsState = {
  siteName: "TechBlog",
  siteDescription: "",
  siteKeywords: "",
  siteIcon: "",
  siteLogo: "",
  favicon: "",
  adminEmail: "",
  timezone: "Asia/Shanghai",
  language: "zh-CN",
  enableRegistration: true,
  requireEmailVerification: true,
  allowComments: true,
  moderateComments: false,
  maxFileSize: 10,
  allowedFileTypes: "jpg,jpeg,png,gif,pdf,doc,docx",
  sessionTimeout: 24,
  maintenanceMode: false,
};

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined);

function getInitialSettings(): SiteSettingsState {
  return {
    ...DEFAULT_SETTINGS,
    ...readSiteSettingsCache(),
  };
}

function updateMetaTag(name: string, content: string): void {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function updateFavicon(url: string): void {
  const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) return;
  if (url) {
    resetOriginalFavicon();
    link.href = url;
  }
}

export const SiteSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettingsState>(getInitialSettings);
  const [loading, setLoading] = useState(true);

  const refreshSettings = useCallback(async () => {
    try {
      const data = await SettingsService.getPublicSettings();
      writeSiteSettingsCache(data);
      setSettings((prev) => ({
        ...prev,
        siteName: data.siteName,
        siteDescription: data.siteDescription,
        siteKeywords: data.siteKeywords,
        siteIcon: data.siteIcon,
        siteLogo: data.siteLogo,
        favicon: data.favicon,
        timezone: data.timezone,
        language: data.language,
        enableRegistration: data.enableRegistration,
        allowComments: data.allowComments,
        moderateComments: data.moderateComments,
        maintenanceMode: data.maintenanceMode,
      }));
    } catch {
      // keep current settings on error
    }
  }, []);

  // Initial load: show defaults while fetching from API
  useEffect(() => {
    const init = async () => {
      await refreshSettings();
      setLoading(false);
    };
    init();
  }, [refreshSettings]);

  // Update DOM meta whenever settings change
  useEffect(() => {
    document.title = settings.siteName || "Blog";
    if (settings.siteDescription) {
      updateMetaTag("description", settings.siteDescription);
    }
    if (settings.siteKeywords) {
      updateMetaTag("keywords", settings.siteKeywords);
    }
    updateFavicon(settings.favicon);
  }, [settings]);

  return <SiteSettingsContext.Provider value={{ settings, loading, refreshSettings }}>{children}</SiteSettingsContext.Provider>;
};

export function useSiteSettings(): SiteSettingsContextType {
  const ctx = useContext(SiteSettingsContext);
  if (ctx === undefined) {
    throw new Error("useSiteSettings must be used within a SiteSettingsProvider");
  }
  return ctx;
}

export default SiteSettingsContext;
