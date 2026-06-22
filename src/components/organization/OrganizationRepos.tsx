import React, { useState, useEffect } from "react";
import { FaGithub, FaStar, FaExternalLinkAlt, FaPlus, FaTrash } from "react-icons/fa";
import Modal from "../modal/Modal";
import Input from "../input/Input";
import CustomSelect from "../customSelect/CustomSelect";
import message from "../message/Message";
import { confirm } from "../confirm/Confirm";
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

const languageOptions = Object.entries(languageColors).map(([name, color]) => ({
  id: name,
  name,
  color,
}));

// ---- mock 数据（后端就绪后替换为 API 调用） ----
export const mockRepos: Repo[] = [
  {
    id: "1",
    name: "frontend-web",
    description: "前端主站项目，基于 React + TypeScript + Vite 构建，包含文章系统、研发平台、个人中心等模块。",
    url: "https://github.com/org/frontend-web",
    language: "TypeScript",
    languageColor: languageColors["TypeScript"] || "#6c757d",
    stars: 128,
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    organizationId: "1",
  },
  {
    id: "2",
    name: "backend-api",
    description: "核心 API 服务，基于 Go + Gin 框架，提供 RESTful 接口、认证鉴权、限流、日志等基础能力。",
    url: "https://github.com/org/backend-api",
    language: "Go",
    languageColor: languageColors["Go"] || "#6c757d",
    stars: 96,
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    organizationId: "1",
  },
  {
    id: "3",
    name: "admin-dashboard",
    description: "管理后台面板，基于 React + Ant Design，提供用户管理、内容审核、数据统计等功能。",
    url: "https://github.com/org/admin-dashboard",
    language: "TypeScript",
    languageColor: languageColors["TypeScript"] || "#6c757d",
    stars: 54,
    updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    organizationId: "1",
  },
  {
    id: "4",
    name: "shared-utils",
    description: "公共工具库，包含日期处理、加密解密、数据校验、HTTP 客户端封装等通用模块。",
    url: "https://github.com/org/shared-utils",
    language: "TypeScript",
    languageColor: languageColors["TypeScript"] || "#6c757d",
    stars: 32,
    updatedAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    organizationId: "1",
  },
  {
    id: "5",
    name: "deploy-scripts",
    description: "CI/CD 部署脚本与 Docker 编排，支持多环境（dev/staging/prod）一键部署与回滚。",
    url: "https://github.com/org/deploy-scripts",
    language: "Shell",
    languageColor: languageColors["Shell"] || "#6c757d",
    stars: 18,
    updatedAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    organizationId: "1",
  },
  {
    id: "6",
    name: "mobile-app",
    description: "移动端跨平台应用，基于 React Native，支持 iOS 和 Android，提供文章浏览与消息推送。",
    url: "https://github.com/org/mobile-app",
    language: "TypeScript",
    languageColor: languageColors["TypeScript"] || "#6c757d",
    stars: 45,
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    organizationId: "1",
  },
];

// ---- component ----
interface Props {
  orgId: string;
  canManage: boolean;
}

const OrganizationRepos: React.FC<Props> = ({ orgId, canManage }) => {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", url: "", language: "TypeScript" });

  useEffect(() => {
    // TODO: 后端就绪后替换为真实 API 调用
    setLoading(true);
    setTimeout(() => {
      setRepos(mockRepos);
      setLoading(false);
    }, 400);
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

  const handleAddRepo = () => {
    if (!form.name.trim()) {
      message.warn("请输入仓库名称");
      return;
    }
    if (!form.url.trim()) {
      message.warn("请输入仓库地址");
      return;
    }
    const newRepo: Repo = {
      id: String(Date.now()),
      name: form.name.trim(),
      description: form.description.trim(),
      url: form.url.trim(),
      language: form.language,
      languageColor: languageColors[form.language] || "#6c757d",
      stars: 0,
      updatedAt: new Date().toISOString(),
      organizationId: orgId,
    };
    setRepos((prev) => [newRepo, ...prev]);
    setForm({ name: "", description: "", url: "", language: "TypeScript" });
    setModalVisible(false);
    message.success("仓库添加成功");
  };

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
        setRepos((prev) => prev.filter((r) => r.id !== repo.id));
        message.success("仓库已删除");
      },
    });
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
            <div
              key={repo.id}
              className={styles.repoCard}
              onClick={() => window.open(repo.url, "_blank", "noopener,noreferrer")}
            >
              <div className={styles.repoCardHeader}>
                <FaGithub className={styles.repoIcon} />
                <span className={styles.repoName}>{repo.name}</span>
                <FaExternalLinkAlt className={styles.repoExternalIcon} />
                {canManage && (
                  <button
                    className={styles.repoDeleteBtn}
                    title="删除仓库"
                    onClick={(e) => handleDeleteRepo(e, repo)}
                  >
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
            <Input
              placeholder="如 frontend-web"
              value={form.name}
              onChange={(v) => setForm((prev) => ({ ...prev, name: v }))}
              size="large"
            />
          </div>
          <div>
            <label className={styles.formLabel}>仓库地址 *</label>
            <Input
              placeholder="https://github.com/org/repo"
              value={form.url}
              onChange={(v) => setForm((prev) => ({ ...prev, url: v }))}
              size="large"
            />
          </div>
          <div>
            <label className={styles.formLabel}>语言</label>
            <CustomSelect
              name="语言"
              options={languageOptions}
              value={languageOptions.find((o) => o.id === form.language) || null}
              onChange={(o) => setForm((prev) => ({ ...prev, language: (o?.id as string) || "TypeScript" }))}
              hideBadge
            />
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
        </div>
      </Modal>
    </div>
  );
};

export default OrganizationRepos;
