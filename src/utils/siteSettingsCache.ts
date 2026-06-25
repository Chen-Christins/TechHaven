import type { PublicSiteSettings } from "../services/settingsService";

export const SITE_SETTINGS_CACHE_KEY = "publicSiteSettings";

export type CachedSiteSettings = Partial<PublicSiteSettings>;

export function readSiteSettingsCache(): CachedSiteSettings | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(SITE_SETTINGS_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as CachedSiteSettings;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function writeSiteSettingsCache(settings: CachedSiteSettings): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(SITE_SETTINGS_CACHE_KEY, JSON.stringify(settings));
  } catch {
    // Public settings cache is only used to avoid initial title flicker.
  }
}
