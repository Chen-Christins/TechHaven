import http from "../utils/http";

/* ═══════════════════════════════════════════
   API 响应类型（snake_case）
   ═══════════════════════════════════════════ */

interface DataStatsResponse {
  total_size: number;
  used_size: number;
  available_size: number;
  total_records: number;
  articles: number;
  users: number;
  comments: number;
  categories: number;
  tags: number;
  backups: number;
}

interface BackupRecordResponse {
  id: string;
  name: string;
  type: "full" | "incremental" | "manual";
  size: number;
  file_count: number;
  status: "completed" | "processing" | "failed";
  created_at: number;
  completed_at?: number;
  created_by: string;
  description: string;
  download_url?: string;
}

interface ExportRecordResponse {
  id: string;
  name: string;
  type: "articles" | "users" | "comments" | "full";
  format: "json" | "csv" | "xlsx";
  size: number;
  record_count: number;
  status: "completed" | "processing" | "failed";
  created_at: number;
  created_by: string;
  download_url?: string;
}

interface PaginatedResponse<T> {
  list: T[];
  total: number;
}

/* ═══════════════════════════════════════════
   前端类型（camelCase）
   ═══════════════════════════════════════════ */

export interface DataStats {
  totalSize: number;
  usedSize: number;
  availableSize: number;
  totalRecords: number;
  articles: number;
  users: number;
  comments: number;
  categories: number;
  tags: number;
  backups: number;
}

export interface BackupRecord {
  id: string;
  name: string;
  type: "full" | "incremental" | "manual";
  size: number;
  fileCount: number;
  status: "completed" | "processing" | "failed";
  createdAt: string | number;
  completedAt?: string | number;
  createdBy: string;
  description: string;
  downloadUrl?: string;
}

export interface ExportRecord {
  id: string;
  name: string;
  type: "articles" | "users" | "comments" | "full";
  format: "json" | "csv" | "xlsx";
  size: number;
  recordCount: number;
  status: "completed" | "processing" | "failed";
  createdAt: string | number;
  createdBy: string;
  downloadUrl?: string;
}

/* ═══════════════════════════════════════════
   Mapper 函数
   ═══════════════════════════════════════════ */

function toBackupRecord(r: BackupRecordResponse): BackupRecord {
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    size: r.size,
    fileCount: r.file_count,
    status: r.status,
    createdAt: r.created_at,
    completedAt: r.completed_at,
    createdBy: r.created_by,
    description: r.description,
    downloadUrl: r.download_url,
  };
}

function toExportRecord(r: ExportRecordResponse): ExportRecord {
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    format: r.format,
    size: r.size,
    recordCount: r.record_count,
    status: r.status,
    createdAt: r.created_at,
    createdBy: r.created_by,
    downloadUrl: r.download_url,
  };
}

function toDataStats(r: DataStatsResponse): DataStats {
  return {
    totalSize: r.total_size,
    usedSize: r.used_size,
    availableSize: r.available_size,
    totalRecords: r.total_records,
    articles: r.articles,
    users: r.users,
    comments: r.comments,
    categories: r.categories,
    tags: r.tags,
    backups: r.backups,
  };
}

/* ═══════════════════════════════════════════
   Service
   ═══════════════════════════════════════════ */

export class DataService {
  /** 数据概览统计 */
  static async getStats(): Promise<DataStats> {
    const res = await http.get<DataStatsResponse>("/admin/database/stats");
    return toDataStats(res.data);
  }

  /** 备份列表 */
  static async getBackups(params: {
    search?: string;
    type?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ list: BackupRecord[]; total: number }> {
    const res = await http.get<PaginatedResponse<BackupRecordResponse>>("/admin/database/backups", { params });
    console.log("getBackups response:", res); // Debug log
    return {
      list: res.data.list.map(toBackupRecord),
      total: res.data.total,
    };
  }

  /** 创建备份 */
  static async createBackup(type: "full" | "incremental"): Promise<BackupRecord> {
    const res = await http.post<BackupRecordResponse>("/admin/database/backups/create", { type });
    return toBackupRecord(res.data);
  }

  /** 删除备份 */
  static async deleteBackup(id: string): Promise<void> {
    await http.post(`/admin/database/backups/${id}/delete`);
  }

  /** 导出记录列表 */
  static async getExports(params: {
    search?: string;
    type?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ list: ExportRecord[]; total: number }> {
    const res = await http.get<PaginatedResponse<ExportRecordResponse>>("/admin/database/exports", { params });
    return {
      list: res.data.list.map(toExportRecord),
      total: res.data.total,
    };
  }

  /** 创建导出任务 */
  static async createExport(type: "articles" | "users" | "comments" | "full"): Promise<ExportRecord> {
    const res = await http.post<ExportRecordResponse>("/admin/database/exports/create", { type });
    return toExportRecord(res.data);
  }

  /** 删除导出记录 */
  static async deleteExport(id: string): Promise<void> {
    await http.post(`/admin/database/exports/${id}/delete`);
  }

  /** 清理过期数据 */
  static async cleanup(): Promise<void> {
    await http.post("/admin/database/cleanup");
  }
}

export default DataService;
