import React, { useState, useEffect, useRef } from "react";
import { FaGithub, FaStar, FaExternalLinkAlt, FaTrash, FaKey, FaSync } from "react-icons/fa";
import Modal from "../modal/Modal";
import Input from "../input/Input";
import message from "../message/Message";
import { confirm } from "../confirm/Confirm";
import { formatRelativeTime } from "@/utils/utils";
import OrganizationService from "@/services/organizationService";
import styles from "./Organization.module.css";

/** 过滤语言字段中的控制字符 */
function cleanLang(lang: any): string {
  if (typeof lang !== "string") return "";
  let out = "";
  for (let i = 0; i < lang.length; i++) {
    const c = lang.charCodeAt(i);
    if (c >= 32) out += lang[i];
  }
  return out.trim();
}

// ---- types ----
export interface Repo {
  id: string;
  name: string;
  description: string;
  url: string;
  language: string;
  languageColor: string;
  stars: number;
  updatedAt: string | number;
  organizationId: string;
  hasToken: boolean;
  syncStatus: "idle" | "syncing" | "success" | "failed";
}

// ---- 语言颜色映射 ----
const languageColors: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f7df1e",
  Python: "#3776ab",
  Go: "#00add8",
  Rust: "#dea584",
  Java: "#b07219",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Vue: "#41b883",
  Shell: "#89e051",
  Dockerfile: "#384d54",
  Kotlin: "#7f52ff",
  Swift: "#f05138",
};

// ---- 同步状态文案 ----
const syncStatusText: Record<string, string> = {
  idle: "未同步",
  syncing: "同步中...",
  success: "已同步",
  failed: "同步失败",
};

// ---- component ----
interface Props {
  orgId: string;
  canManage: boolean;
  onChange?: (delta: number) => void;
}

const OrganizationRepos: React.FC<Props> = ({ orgId, canManage, onChange }) => {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);

  // 配置 Token modal
  const [tokenModalVisible, setTokenModalVisible] = useState(false);
  const [tokenRepo, setTokenRepo] = useState<Repo | null>(null);
  const [tokenValue, setTokenValue] = useState("");
  const [tokenSaving, setTokenSaving] = useState(false);

  // polling ref
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ---- 获取仓库列表 ----
  const fetchRepos = async () => {
    try {
      const res = await OrganizationService.getRepos({ org_id: orgId });
      setRepos(
        (res.list || []).map((item: any) => ({
          id: String(item.id),
          name: item.name || "",
          description: item.description || "",
          url: item.url || "",
          language: cleanLang(item.language),
          languageColor: languageColors[cleanLang(item.language)] || "#6c757d",
          stars: item.stars_count ?? 0,
          updatedAt:
            item.updated_at == null || (typeof item.updated_at === "number" && item.updated_at > 9999999999999) ? "" : item.updated_at,
          organizationId: String(item.org_id ?? ""),
          hasToken: item.has_token ?? false,
          syncStatus: item.sync_status || "idle",
        })),
      );
    } catch (err: any) {
      message.error(err?.message || "获取仓库列表失败");
    }
  };

  useEffect(() => {
    if (!orgId) return;
    setLoading(true);
    fetchRepos().finally(() => setLoading(false));
  }, [orgId]);

  // ---- 轮询同步状态 ----
  useEffect(() => {
    const hasSyncing = repos.some((r) => r.syncStatus === "syncing");
    if (hasSyncing) {
      if (!pollingRef.current) {
        pollingRef.current = setInterval(() => {
          fetchRepos();
        }, 3000);
      }
    } else {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [repos]);

  // ---- 删除仓库 ----
  const handleDeleteRepo = async (e: React.MouseEvent, repo: Repo) => {
    e.preventDefault();
    e.stopPropagation();
    await confirm({
      title: "确认删除",
      content: (
        <div>
          确定要删除仓库 "<strong>{repo.name}</strong>" 吗？删除后无法恢复。
        </div>
      ),
      confirmText: "删除",
      cancelText: "取消",
      onConfirm: async () => {
        try {
          await OrganizationService.deleteRepo({ id: repo.id, org_id: orgId });
          setRepos((prev) => prev.filter((r) => r.id !== repo.id));
          message.success("仓库已删除");
          onChange?.(-1);
        } catch {
          message.error("删除仓库失败");
        }
      },
    });
  };

  // ---- 配置 Token ----
  const openTokenModal = (e: React.MouseEvent, repo: Repo) => {
    e.preventDefault();
    e.stopPropagation();
    setTokenRepo(repo);
    setTokenValue("");
    setTokenModalVisible(true);
  };

  const handleSaveToken = async () => {
    if (!tokenValue.trim()) {
      message.warn("请输入 GitHub Token");
      return;
    }
    if (!tokenRepo) return;
    setTokenSaving(true);
    try {
      await OrganizationService.saveRepoToken({ repo_id: tokenRepo.id, token: tokenValue.trim() });
      setRepos((prev) => prev.map((r) => (r.id === tokenRepo.id ? { ...r, hasToken: true } : r)));
      setTokenValue("");
      setTokenModalVisible(false);
      message.success("Token 已保存");
    } catch {
      message.error("保存失败");
    } finally {
      setTokenSaving(false);
    }
  };

  // ---- 同步仓库 ----
  const handleSyncRepo = async (e: React.MouseEvent, repo: Repo) => {
    e.preventDefault();
    e.stopPropagation();
    if (repo.syncStatus === "syncing") return;
    setRepos((prev) => prev.map((r) => (r.id === repo.id ? { ...r, syncStatus: "syncing" as const } : r)));
    try {
      await OrganizationService.syncRepo({ repo_id: repo.id });
    } catch {
      setRepos((prev) => prev.map((r) => (r.id === repo.id ? { ...r, syncStatus: "failed" as const } : r)));
      message.error("同步失败");
    }
  };

  if (loading) {
    return (
      <div className={styles.repoSection}>
        <div className={styles.repoGrid}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.repoCard} style={{ opacity: 0.6 }}>
              <div
                style={{ height: "20px", width: "60%", background: "var(--bg-secondary)", borderRadius: "4px", marginBottom: "12px" }}
              />
              <div
                style={{ height: "14px", width: "90%", background: "var(--bg-secondary)", borderRadius: "4px", marginBottom: "8px" }}
              />
              <div style={{ height: "14px", width: "70%", background: "var(--bg-secondary)", borderRadius: "4px" }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.repoSection}>
      {repos.length === 0 ? (
        <div className={styles.emptyState}>
          <FaGithub size={40} style={{ opacity: 0.3, marginBottom: "12px" }} />
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>暂无仓库</p>
        </div>
      ) : (
        <div className={styles.repoGrid}>
          {repos.map((repo) => (
            <div key={repo.id} className={styles.repoCard} onClick={() => window.open(repo.url, "_blank", "noopener,noreferrer")}>
              <div className={styles.repoCardHeader}>
                <FaGithub className={styles.repoIcon} />
                <span className={styles.repoName}>{repo.name}</span>
                <FaExternalLinkAlt className={styles.repoExternalIcon} />
                {canManage && (
                  <>
                    <span
                      className={repo.hasToken ? styles.repoTokenBadge : styles.repoTokenBadgeNone}
                      title={repo.hasToken ? "已配置 Token" : "未配置 Token，点击配置"}
                      onClick={(e) => openTokenModal(e, repo)}
                    >
                      <FaKey size={10} />
                    </span>
                    <span
                      className={`${styles.repoSyncBtn} ${repo.syncStatus === "syncing" ? styles.repoSyncSpinning : ""}`}
                      title={syncStatusText[repo.syncStatus]}
                      onClick={(e) => handleSyncRepo(e, repo)}
                    >
                      <FaSync size={10} />
                    </span>
                    <button className={styles.repoDeleteBtn} title="删除仓库" onClick={(e) => handleDeleteRepo(e, repo)}>
                      <FaTrash size={12} />
                    </button>
                  </>
                )}
              </div>
              <p className={styles.repoDescription}>{repo.description}</p>
              <div className={styles.repoMeta}>
                <span className={styles.repoLanguage}>
                  <span className={styles.repoLanguageDot} style={{ backgroundColor: repo.languageColor }} />
                  {repo.language || "N/A"}
                </span>
                <span className={styles.repoStars}>
                  <FaStar /> {repo.stars}
                </span>
                <span className={styles.repoSyncStatus}>
                  <span
                    className={`${styles.syncStatusDot} ${
                      repo.syncStatus === "success"
                        ? styles.syncStatusDone
                        : repo.syncStatus === "failed"
                          ? styles.syncStatusFailed
                          : repo.syncStatus === "syncing"
                            ? styles.syncStatusSyncing
                            : styles.syncStatusIdle
                    }`}
                  />
                  {syncStatusText[repo.syncStatus]}
                </span>
                <span className={styles.repoUpdated}>{formatRelativeTime(repo.updatedAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 配置 Token Modal */}
      <Modal
        visible={tokenModalVisible}
        title={tokenRepo ? `配置 Token - ${tokenRepo.name}` : "配置 Token"}
        onClose={() => setTokenModalVisible(false)}
        width={480}
        footer={
          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <button className={styles.cancelButton} onClick={() => setTokenModalVisible(false)}>
              取消
            </button>
            <button className={styles.confirmButton} onClick={handleSaveToken} disabled={tokenSaving}>
              {tokenSaving ? "保存中..." : "保存"}
            </button>
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>
            {tokenRepo?.hasToken
              ? "该仓库已配置 Token，输入新值将覆盖旧值。"
              : "为该仓库配置 GitHub Personal Access Token，用于拉取仓库元数据（Star 数、描述、语言等）。"}
          </p>
          <div>
            <label className={styles.formLabel}>GitHub Token</label>
            <Input
              type="password"
              value={tokenValue}
              onChange={(v) => setTokenValue(v)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              size="large"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OrganizationRepos;
