import React, { useState, useEffect } from "react";
import { FaGithub, FaStar, FaExternalLinkAlt, FaPlus, FaTrash, FaKey } from "react-icons/fa";
import Modal from "../modal/Modal";
import Input from "../input/Input";
import message from "../message/Message";
import { confirm } from "../confirm/Confirm";
import OrganizationService from "../../services/organizationService";
import styles from "../../pages/organization/OrganizationDetail.module.css";

// ---- types ----
export interface Repo {
  id: string;
  name: string;
  description: string;
  url: string;
  language: string;
  languageColor: string;
  stars: number;
  updatedAt: string;
  organizationId: string;
  hasToken: boolean;
}

// ---- 语言选项 ----
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

// ---- component ----
interface Props {
  orgId: string;
  canManage: boolean;
  onChange?: (delta: number) => void;
}

const OrganizationRepos: React.FC<Props> = ({ orgId, canManage, onChange }) => {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);

  // 添加仓库 modal
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", url: "", token: "" });

  // 配置 Token modal
  const [tokenModalVisible, setTokenModalVisible] = useState(false);
  const [tokenRepo, setTokenRepo] = useState<Repo | null>(null);
  const [tokenValue, setTokenValue] = useState("");
  const [tokenSaving, setTokenSaving] = useState(false);

  useEffect(() => {
    const fetchRepos = async () => {
      setLoading(true);
      try {
        const res = await OrganizationService.getRepos({ org_id: orgId });
        setRepos(
          (res.list || []).map((item: any) => ({
            id: String(item.id),
            name: item.name || "",
            description: item.description || "",
            url: item.url || "",
            language: item.language || "",
            languageColor: languageColors[item.language] || "#6c757d",
            stars: item.stars_count ?? 0,
            updatedAt: item.updated_at || "",
            organizationId: String(item.org_id ?? ""),
            hasToken: item.has_token ?? false,
          })),
        );
      } catch (err: any) {
        message.error(err?.message || "获取仓库列表失败");
      } finally {
        setLoading(false);
      }
    };
    if (orgId) fetchRepos();
  }, [orgId]);

  const formatTimeAgo = (isoStr: string): string => {
    const diff = Date.now() - new Date(isoStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days < 1) return "今天";
    if (days < 30) return `${days} 天前`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} 个月前`;
    return `${Math.floor(months / 12)} 年前`;
  };

  // ---- 添加仓库 ----
  const handleAddRepo = async () => {
    if (!form.name.trim()) {
      message.warn("请输入仓库名称");
      return;
    }
    if (!form.url.trim()) {
      message.warn("请输入仓库地址");
      return;
    }
    try {
      const res = await OrganizationService.addRepo({
        org_id: orgId,
        name: form.name.trim(),
        url: form.url.trim(),
        description: form.description.trim(),
        token: form.token.trim() || undefined,
      });
      const newRepo: Repo = {
        id: String(res.id),
        name: form.name.trim(),
        description: form.description.trim(),
        url: form.url.trim(),
        language: "",
        languageColor: "#6c757d",
        stars: 0,
        updatedAt: new Date().toISOString(),
        organizationId: orgId,
        hasToken: !!form.token.trim(),
      };
      setRepos((prev) => [newRepo, ...prev]);
      setForm({ name: "", description: "", url: "", token: "" });
      setModalVisible(false);
      message.success("仓库添加成功");
      onChange?.(1);
    } catch {
      message.error("添加仓库失败");
    }
  };

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

  if (loading) {
    return (
      <div className={styles.repoSection}>
        <div className={styles.repoSectionHeader}>
          <h2 className={styles.sectionTitle}>仓库列表</h2>
        </div>
        <div className={styles.repoGrid}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.repoCard} style={{ opacity: 0.6 }}>
              <div style={{ height: "20px", width: "60%", background: "var(--bg-secondary)", borderRadius: "4px", marginBottom: "12px" }} />
              <div style={{ height: "14px", width: "90%", background: "var(--bg-secondary)", borderRadius: "4px", marginBottom: "8px" }} />
              <div style={{ height: "14px", width: "70%", background: "var(--bg-secondary)", borderRadius: "4px" }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.repoSection}>
      <div className={styles.repoSectionHeader}>
        <h2 className={styles.sectionTitle}>仓库列表</h2>
        {canManage && (
          <button className={styles.createButton} onClick={() => setModalVisible(true)}>
            <FaPlus /> 添加仓库
          </button>
        )}
      </div>

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
                {canManage && (
                  <span
                    className={repo.hasToken ? styles.repoTokenBadge : styles.repoTokenBadgeNone}
                    title={repo.hasToken ? "已配置 Token" : "未配置 Token，点击配置"}
                    onClick={(e) => openTokenModal(e, repo)}
                  >
                    <FaKey size={10} />
                  </span>
                )}
                <FaExternalLinkAlt className={styles.repoExternalIcon} />
                {canManage && (
                  <button className={styles.repoDeleteBtn} title="删除仓库" onClick={(e) => handleDeleteRepo(e, repo)}>
                    <FaTrash size={12} />
                  </button>
                )}
              </div>
              <p className={styles.repoDescription}>{repo.description}</p>
              <div className={styles.repoMeta}>
                <span className={styles.repoLanguage}>
                  <span className={styles.repoLanguageDot} style={{ backgroundColor: repo.languageColor }} />
                  {repo.language}
                </span>
                <span className={styles.repoStars}>
                  <FaStar /> {repo.stars}
                </span>
                <span className={styles.repoUpdated}>{formatTimeAgo(repo.updatedAt)} 更新</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 添加仓库 Modal */}
      <Modal
        visible={modalVisible}
        title="添加仓库"
        onClose={() => setModalVisible(false)}
        width={520}
        footer={
          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <button className={styles.cancelButton} onClick={() => setModalVisible(false)}>
              取消
            </button>
            <button className={styles.confirmButton} onClick={handleAddRepo}>
              添加
            </button>
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label className={styles.formLabel}>仓库名称 *</label>
            <Input placeholder="如 frontend-web" value={form.name} onChange={(v) => setForm((prev) => ({ ...prev, name: v }))} size="large" />
          </div>
          <div>
            <label className={styles.formLabel}>仓库地址 *</label>
            <Input placeholder="https://github.com/org/repo" value={form.url} onChange={(v) => setForm((prev) => ({ ...prev, url: v }))} size="large" />
          </div>
          <div>
            <label className={styles.formLabel}>描述</label>
            <textarea
              placeholder="请输入仓库描述..."
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
              style={{
                width: "100%",
                padding: "10px 14px",
                border: "1px solid var(--border-primary)",
                borderRadius: "8px",
                fontSize: "14px",
                color: "var(--text-primary)",
                backgroundColor: "var(--bg-primary)",
                resize: "vertical",
                fontFamily: "inherit",
                lineHeight: 1.6,
              }}
            />
          </div>
          <div>
            <label className={styles.formLabel}>GitHub Token（选填）</label>
            <Input
              type="password"
              placeholder="Personal Access Token，用于拉取仓库信息"
              value={form.token}
              onChange={(v) => setForm((prev) => ({ ...prev, token: v }))}
              size="large"
            />
          </div>
        </div>
      </Modal>

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
