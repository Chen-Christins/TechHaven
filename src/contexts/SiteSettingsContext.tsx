import React, { createContext, useState, useEffect, useCallback, useContext } from "react";
import SettingsService from "../services/settingsService";
import { resetOriginalFavicon } from "../utils/favicon";

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

const CACHE_KEY = "site_settings_cache";

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined);

function loadFromCache(): SiteSettingsState {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {
    // corrupt cache, ignore
  }
  return { ...DEFAULT_SETTINGS };
}

function saveToCache(settings: SiteSettingsState): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(settings));
  } catch {
    // storage full or unavailable
  }
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
  const [settings, setSettings] = useState<SiteSettingsState>(loadFromCache);
  const [loading, setLoading] = useState(true);

  const refreshSettings = useCallback(async () => {
    // Fetch public status (maintenanceMode) and admin settings in parallel
    const [statusResult, adminResult] = await Promise.allSettled([SettingsService.getSiteStatus(), SettingsService.getSettings()]);

    let updated = loadFromCache();

    if (statusResult.status === "fulfilled") {
      updated.maintenanceMode = statusResult.value.maintenanceMode;
    }

    if (adminResult.status === "fulfilled") {
      const data = adminResult.value;
      updated = {
        ...updated,
        siteName: data.siteName,
        siteDescription: data.siteDescription,
        siteKeywords: data.siteKeywords,
        siteIcon: data.siteIcon,
        siteLogo: data.siteLogo,
        favicon: data.favicon,
        adminEmail: data.adminEmail,
        timezone: data.timezone,
        language: data.language,
        enableRegistration: data.enableRegistration,
        requireEmailVerification: data.requireEmailVerification,
        allowComments: data.allowComments,
        moderateComments: data.moderateComments,
        maxFileSize: data.maxFileSize,
        allowedFileTypes: data.allowedFileTypes,
        sessionTimeout: data.sessionTimeout,
        maintenanceMode: data.maintenanceMode,
      };
    }

    saveToCache(updated);
    setSettings(updated);
  }, []);

  // Initial load: cache first (instant), then try API
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
