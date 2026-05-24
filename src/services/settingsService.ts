import http from "../utils/http";

export interface SiteSettings {
  siteName: string;
  siteDescription: string;
  siteKeywords: string;
  siteIcon: string;
  siteLogo: string;
  favicon: string;
  adminEmail: string;
  timezone: string;
  language: string;
}

export interface EmailSettings {
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  smtpEncryption: "none" | "ssl" | "tls";
  fromEmail: string;
  fromName: string;
  replyTo: string;
}

export interface SystemSettings {
  enableRegistration: boolean;
  requireEmailVerification: boolean;
  allowComments: boolean;
  moderateComments: boolean;
  maxFileSize: number;
  allowedFileTypes: string;
  sessionTimeout: number;
  maintenanceMode: boolean;
  backupSchedule: string;
}

export interface AllSettings {
  siteName: string;
  siteDescription: string;
  siteKeywords: string;
  siteIcon: string;
  siteLogo: string;
  favicon: string;
  adminEmail: string;
  timezone: string;
  language: string;

  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  smtpEncryption: "none" | "ssl" | "tls";
  fromEmail: string;
  fromName: string;
  replyTo: string;

  enableRegistration: boolean;
  requireEmailVerification: boolean;
  allowComments: boolean;
  moderateComments: boolean;
  maxFileSize: number;
  allowedFileTypes: string;
  sessionTimeout: number;
  maintenanceMode: boolean;
  backupSchedule: string;
}

export interface UploadImageResponse {
  url: string;
}

export interface SiteStatus {
  maintenanceMode: boolean;
}

export class SettingsService {
  static async getSiteStatus(): Promise<SiteStatus> {
    const response = await http.get<SiteStatus>("/site/status");
    return response.data;
  }

  static async getSettings(): Promise<AllSettings> {
    const response = await http.get<AllSettings>("/admin/settings");
    return response.data;
  }

  static async updateSettings(settings: AllSettings): Promise<void> {
    await http.put("/admin/settings", settings);
  }

  static async uploadImage(file: File, type: "siteIcon" | "siteLogo" | "favicon"): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    const response = await http.upload<UploadImageResponse>("/admin/settings/upload", formData);
    return response.data.url;
  }
}

export default SettingsService;
