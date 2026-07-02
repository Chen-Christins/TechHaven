import React, { useState, useEffect } from "react";
import { formatDateTime, formatRelativeTime } from "@/utils/utils";
import {
  FaSync,
  FaEye,
  FaTrash,
  FaFilter,
  FaGithub,
  FaExternalLinkAlt,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "./ListPage.module.css";
import crStyles from "./CodeReviewList.module.css";
import Input from "@/components/input/Input";
import CustomSelect from "@/components/customSelect/CustomSelect";
import Modal from "@/components/modal/Modal";
import Loading from "@/components/loading/Loading";
import message from "@/components/message/Message";
import { confirm } from "@/components/confirm/Confirm";
import { useRdOrg } from "@/contexts/RdOrgContext";
import OrganizationService from "@/services/organizationService";
import type { SelectOption } from "../../types";

// ---- PR 数据映射 ----
interface PR {
  id: string;
  repoId: string;
  title: string;
  description: string;
  state: "open" | "closed" | "merged";
  priority: string;
  author: string;
  headBranch: string;
  baseBranch: string;
  commitSha: string;
  githubPrId: number | null;
  changedFiles: number | null;
  additions: number | null;
  deletions: number | null;
  reviewers: string;
  reviewStatus: string;
  createdAt: string;
  updatedAt: string;
}

interface RepoItem {
  id: string;
  name: string;
  url: string;
  prSyncStatus: string;
}

const stateOptions: SelectOption[] = [
  { id: "", name: "全部状态", color: "#6c757d" },
  { id: "open", name: "开启中", color: "#22c55e" },
  { id: "closed", name: "已关闭", color: "#6b7280" },
  { id: "merged", name: "已合并", color: "#a855f7" },
];

const stateText: Record<string, string> = { open: "开启中", closed: "已关闭", merged: "已合并" };
const reviewStatusText: Record<string, string> = {
  pending: "待审查",
  reviewing: "审查中",
  approved: "已通过",
  rejected: "已拒绝",
  changes_requested: "需修改",
};
const priorityText: Record<string, string> = {
  critical: "紧急",
  high: "高",
  medium: "中",
  low: "低",
};
const PAGE_SIZE = 10;

// ---- component ----
const CodeReviewList: React.FC = () => {
  const { selectedOrgId } = useRdOrg();
  const [prs, setPrs] = useState<PR[]>([]);
  const [total, setTotal] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({ search: "", state: "" });

  // 仓库列表
  const [repos, setRepos] = useState<RepoItem[]>([]);
  const [syncingRepos, setSyncingRepos] = useState<Set<string>>(new Set());

  // 当前选中的仓库
  const [selectedRepoId, setSelectedRepoId] = useState<string | null>(null);

  // view modal
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedPR, setSelectedPR] = useState<PR | null>(null);

  // ---- 获取仓库列表 ----
  const fetchRepos = async () => {
    if (!selectedOrgId) return [];
    try {
      const res = await OrganizationService.getRepos({ org_id: selectedOrgId });
      return (res.list || []).map((r: any) => ({
        id: String(r.id),
        name: r.name || "",
        url: r.url || "",
        prSyncStatus: r.pr_sync_status || "idle",
      }));
    } catch {
      return [];
    }
  };

  // ---- 获取 PR 列表 ----
  const fetchPrs = async (repoId = selectedRepoId) => {
    if (!repoId) {
      setPrs([]);
      setTotal(0);
      return;
    }

    const params: any = { page: currentPage, page_size: PAGE_SIZE };
    if (selectedOrgId) params.org_id = selectedOrgId;
    params.repo_id = repoId;
    if (filters.state) params.state = filters.state;
    const res = await OrganizationService.getPrs(params);
    setPrs(
      (res.list || []).map((item: any) => ({
        id: String(item.id),
        repoId: String(item.repo_id),
        title: item.title || "",
        description: item.description || "",
        state: item.state || "open",
        priority: item.priority || "",
        author: item.author || "",
        headBranch: item.head_branch || "",
        baseBranch: item.base_branch || "",
        commitSha: item.commit_sha || "",
        githubPrId: item.github_pr_id ?? null,
        changedFiles: item.changed_files,
        additions: item.additions,
        deletions: item.deletions,
        reviewers: item.reviewers || "[]",
        reviewStatus: item.review_status || "pending",
        createdAt: item.created_at ?? "",
        updatedAt: item.updated_at ?? "",
      })),
    );
    setTotal(res.total ?? 0);
  };

  // ---- 合并加载 ----
  const fetchAll = async () => {
    try {
      const repoList = selectedOrgId ? await fetchRepos() : [];
      setRepos(repoList);

      const nextRepoId = repoList.some((repo) => repo.id === selectedRepoId) ? selectedRepoId : (repoList[0]?.id ?? null);
      if (nextRepoId !== selectedRepoId) {
        setSelectedRepoId(nextRepoId);
        setCurrentPage(1);
        setPrs([]);
        setTotal(0);
        return;
      }

      if (!initialLoading) {
        setTableLoading(true);
      }
      await fetchPrs(nextRepoId);
    } catch {
      message.error("获取数据失败");
    } finally {
      setInitialLoading(false);
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [currentPage, filters, selectedOrgId, selectedRepoId]);

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  // ---- 轮询 PR 同步状态 ----
  useEffect(() => {
    const hasSyncing = repos.some((r) => r.prSyncStatus === "syncing");
    if (!hasSyncing || !selectedOrgId) return;
    const timer = setInterval(async () => {
      const repoList = await fetchRepos();
      const stillSyncing = repoList.some((r) => r.prSyncStatus === "syncing");
      setRepos(repoList);
      fetchPrs();
      if (!stillSyncing) clearInterval(timer);
    }, 3000);
    return () => clearInterval(timer);
  }, [selectedOrgId, repos]);

  // ---- 同步单个仓库 PR ----
  const handleSyncRepo = async (repo: RepoItem) => {
    setRepos((prev) => prev.map((r) => (r.id === repo.id ? { ...r, prSyncStatus: "syncing" } : r)));
    setSyncingRepos((prev) => new Set(prev).add(repo.id));
    try {
      await OrganizationService.syncPrs({ repo_id: repo.id });
    } catch (err: any) {
      setRepos((prev) => prev.map((r) => (r.id === repo.id ? { ...r, prSyncStatus: "failed" } : r)));
      message.error(`同步 ${repo.name} 失败`);
    } finally {
      setSyncingRepos((prev) => {
        const next = new Set(prev);
        next.delete(repo.id);
        return next;
      });
    }
  };

  // ---- 删除 PR ----
  const handleDeletePr = async (pr: PR) => {
    await confirm({
      title: "确认删除",
      content: (
        <div>
          确定要删除 PR "<strong>{pr.title}</strong>" 吗？仅删除本地记录，不影响 GitHub。
        </div>
      ),
      confirmText: "删除",
      cancelText: "取消",
      onConfirm: async () => {
        try {
          await OrganizationService.deletePr({ id: pr.id });
          message.success("PR 已删除");
          fetchPrs();
        } catch (err: any) {
          message.error(err?.message || "删除失败");
        }
      },
    });
  };

  const getPrUrl = (pr: PR): string | null => {
    if (!pr.githubPrId) return null;
    const repo = repos.find((r) => r.id === pr.repoId);
    if (!repo?.url) return null;
    return `${repo.url.replace(/\.git$/, "")}/pull/${pr.githubPrId}`;
  };

  const getRepoName = (repoId: string) => repos.find((repo) => repo.id === repoId)?.name || "-";

  const formatCommit = (commitSha: string) => (commitSha ? commitSha.slice(0, 8) : "-");

  const formatReviewers = (reviewers: string) => {
    if (!reviewers) return "-";
    try {
      const parsed = JSON.parse(reviewers);
      if (Array.isArray(parsed)) {
        return (
          parsed
            .map((item) => (typeof item === "string" ? item : item?.name || item?.login || item?.username || ""))
            .filter(Boolean)
            .join("、") || "-"
        );
      }
    } catch {
      return reviewers;
    }
    return reviewers;
  };

  const getDescriptionSummary = (description: string) => {
    const text = description
      .replace(/[#>*_`[\]()\-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!text) return "-";
    return text.length > 80 ? `${text.slice(0, 80)}...` : text;
  };

  const openView = (pr: PR) => {
    setSelectedPR(pr);
    setViewModalVisible(true);
  };
  const closeView = () => {
    setViewModalVisible(false);
    setSelectedPR(null);
  };

  const renderField = (label: string, value: React.ReactNode) => (
    <div className={crStyles.detailField}>
      <span className={crStyles.detailFieldLabel}>{label}</span>
      <span className={crStyles.detailFieldValue}>{value || "-"}</span>
    </div>
  );

  const renderChangeStats = (pr: PR) =>
    pr.changedFiles != null ? (
      <span className={crStyles.changeFiles}>
        {pr.changedFiles} 文件
        {pr.additions != null && pr.additions > 0 && <span className={crStyles.changeAdditions}>+{pr.additions}</span>}
        {pr.deletions != null && pr.deletions > 0 && <span className={crStyles.changeDeletions}>-{pr.deletions}</span>}
      </span>
    ) : (
      <span className={crStyles.changeNone}>-</span>
    );

  const renderPrActions = (pr: PR) => (
    <>
      <button className={`${styles.actionBtn} ${styles.view}`} title="查看详情" onClick={() => openView(pr)}>
        <FaEye />
      </button>
      {getPrUrl(pr) && (
        <button
          className={`${styles.actionBtn} ${styles.ghBtn}`}
          title="在 GitHub 查看"
          onClick={(e) => {
            e.stopPropagation();
            window.open(getPrUrl(pr)!, "_blank", "noopener,noreferrer");
          }}
        >
          <FaGithub />
        </button>
      )}
      <button className={`${styles.actionBtn} ${styles.delete}`} title="删除" onClick={() => handleDeletePr(pr)}>
        <FaTrash />
      </button>
    </>
  );

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      const s = Math.max(1, currentPage - 2),
        e = Math.min(totalPages, s + 4);
      if (s > 1) {
        pages.push(1);
        if (s > 2) pages.push("...");
      }
      for (let i = s; i <= e; i++) pages.push(i);
      if (e < totalPages) {
        if (e < totalPages - 1) pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  if (initialLoading) return <Loading />;

  return (
    <div className={styles.listPage}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>代码审查</h1>
          <p className={styles.pageDescription}>查看从 GitHub 同步的 Pull Request 数据</p>
        </div>
      </div>

      {/* 仓库列表 + 同步按钮 */}
      {repos.length > 0 && (
        <div className={styles.repoBar}>
          <div className={styles.repoBarList}>
            {repos.map((repo) => (
              <div
                key={repo.id}
                className={`${styles.repoBarItem} ${styles.repoBarClickable} ${selectedRepoId === repo.id ? styles.repoBarActive : ""}`}
                onClick={() => setSelectedRepoId(repo.id)}
              >
                <FaGithub size={14} className={crStyles.iconNoShrink} />
                <span className={styles.repoBarName}>{repo.name}</span>
                <span
                  className={`${styles.repoBarStatus} ${
                    repo.prSyncStatus === "success"
                      ? styles.repoBarSuccess
                      : repo.prSyncStatus === "failed"
                        ? styles.repoBarFailed
                        : repo.prSyncStatus === "syncing"
                          ? styles.repoBarSyncing
                          : ""
                  }`}
                >
                  {repo.prSyncStatus === "success"
                    ? "已同步"
                    : repo.prSyncStatus === "failed"
                      ? "失败"
                      : repo.prSyncStatus === "syncing"
                        ? "同步中"
                        : "未同步"}
                </span>
                <button
                  className={styles.repoBarSyncBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSyncRepo(repo);
                  }}
                  disabled={syncingRepos.has(repo.id)}
                >
                  <FaSync className={syncingRepos.has(repo.id) ? styles.repoSpin : ""} size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.filterSection}>
        <div className={styles.filterHeader}>
          <h3 className={styles.filterTitle}>
            <FaFilter /> 筛选条件
          </h3>
          <button
            className={styles.clearBtn}
            onClick={() => {
              setFilters({ search: "", state: "" });
              setCurrentPage(1);
            }}
          >
            清除筛选
          </button>
        </div>
        <div className={styles.filterForm}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>搜索</label>
            <Input
              placeholder="标题、作者或分支名"
              value={filters.search}
              onChange={(val) => handleFilterChange("search", val)}
              allowClear
              size="large"
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>状态</label>
            <CustomSelect
              name="状态"
              options={stateOptions}
              value={stateOptions.find((o) => o.id === filters.state) || null}
              onChange={(o) => handleFilterChange("state", (o?.id as string) || "")}
              hideBadge
            />
          </div>
        </div>
      </div>

      <div className={`${styles.tableWrapper} ${crStyles.desktopPrTable}`}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>标题</th>
              <th>状态</th>
              <th>作者</th>
              <th>分支</th>
              <th>变更</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {tableLoading ? (
              <tr>
                <td colSpan={7} className={styles.emptyCell}>
                  <Loading size="small" text="加载中..." />
                </td>
              </tr>
            ) : prs.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.emptyCell}>
                  <div className={styles.emptyCellIcon}>
                    <FaGithub />
                  </div>
                  <div className={styles.emptyCellText}>{selectedRepoId ? "暂无 PR 数据" : "请点击上方仓库查看 PR"}</div>
                </td>
              </tr>
            ) : (
              prs.map((pr) => {
                return (
                  <tr key={pr.id}>
                    <td className={styles.titleCell} data-label="标题" onClick={() => openView(pr)}>
                      {pr.title}
                    </td>
                    <td data-label="状态">
                      <span className={`${styles.badge} ${pr.state === "closed" ? styles.pr_closed : styles[`status_${pr.state}`]}`}>
                        {stateText[pr.state]}
                      </span>
                    </td>
                    <td className={crStyles.cellCenter} data-label="作者">
                      {pr.author}
                    </td>
                    <td className={crStyles.branchCell} data-label="分支">
                      <span className={crStyles.branchRoute}>
                        <span className={crStyles.branchHead}>{pr.headBranch}</span>
                        <span className={crStyles.branchArrow}>→</span>
                        <span className={crStyles.branchBase}>{pr.baseBranch}</span>
                      </span>
                    </td>
                    <td className={crStyles.changeCell} data-label="变更">
                      {renderChangeStats(pr)}
                    </td>
                    <td data-label="创建时间">{formatRelativeTime(pr.createdAt)}</td>
                    <td data-label="操作">
                      <div className={styles.actionButtons}>{renderPrActions(pr)}</div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className={crStyles.mobilePrList}>
        {tableLoading ? (
          <div className={crStyles.mobileEmpty}>
            <Loading size="small" text="加载中..." />
          </div>
        ) : prs.length === 0 ? (
          <div className={crStyles.mobileEmpty}>
            <div className={styles.emptyCellIcon}>
              <FaGithub />
            </div>
            <div className={styles.emptyCellText}>{selectedRepoId ? "暂无 PR 数据" : "请点击上方仓库查看 PR"}</div>
          </div>
        ) : (
          prs.map((pr) => (
            <article key={pr.id} className={crStyles.mobilePrCard}>
              <button className={crStyles.mobileCardMain} type="button" onClick={() => openView(pr)}>
                <div className={crStyles.mobileCardHeader}>
                  <div className={crStyles.mobileTitleBlock}>
                    <div className={crStyles.mobileTitle}>{pr.title || "-"}</div>
                    <div className={crStyles.mobileSubtitle}>
                      <span>{getRepoName(pr.repoId)}</span>
                      <span>{pr.githubPrId ? `#${pr.githubPrId}` : "无 PR 编号"}</span>
                    </div>
                  </div>
                  <span className={`${styles.badge} ${pr.state === "closed" ? styles.pr_closed : styles[`status_${pr.state}`]}`}>
                    {stateText[pr.state]}
                  </span>
                </div>

                <div className={crStyles.mobileMetaGrid}>
                  <div className={crStyles.mobileMetaItem}>
                    <span className={crStyles.mobileMetaLabel}>作者</span>
                    <span className={crStyles.mobileMetaValue}>{pr.author || "-"}</span>
                  </div>
                  <div className={crStyles.mobileMetaItem}>
                    <span className={crStyles.mobileMetaLabel}>审查状态</span>
                    <span className={crStyles.mobileMetaValue}>{reviewStatusText[pr.reviewStatus] || pr.reviewStatus || "-"}</span>
                  </div>
                  <div className={crStyles.mobileMetaItem}>
                    <span className={crStyles.mobileMetaLabel}>优先级</span>
                    <span className={crStyles.mobileMetaValue}>{priorityText[pr.priority] || pr.priority || "-"}</span>
                  </div>
                  <div className={crStyles.mobileMetaItem}>
                    <span className={crStyles.mobileMetaLabel}>变更</span>
                    <span className={crStyles.mobileMetaValue}>{renderChangeStats(pr)}</span>
                  </div>
                  <div className={crStyles.mobileMetaItem}>
                    <span className={crStyles.mobileMetaLabel}>评审人</span>
                    <span className={crStyles.mobileMetaValue}>{formatReviewers(pr.reviewers)}</span>
                  </div>
                  <div className={crStyles.mobileMetaItem}>
                    <span className={crStyles.mobileMetaLabel}>Commit</span>
                    <span className={crStyles.mobileMetaValue}>{formatCommit(pr.commitSha)}</span>
                  </div>
                  <div className={crStyles.mobileMetaItem}>
                    <span className={crStyles.mobileMetaLabel}>创建</span>
                    <span className={crStyles.mobileMetaValue}>{formatRelativeTime(pr.createdAt)}</span>
                  </div>
                  <div className={crStyles.mobileMetaItem}>
                    <span className={crStyles.mobileMetaLabel}>同步</span>
                    <span className={crStyles.mobileMetaValue}>{formatRelativeTime(pr.updatedAt)}</span>
                  </div>
                </div>

                <div className={crStyles.mobileBranchBlock}>
                  <span className={crStyles.mobileMetaLabel}>分支</span>
                  <span className={crStyles.branchRoute}>
                    <span className={crStyles.branchHead}>{pr.headBranch || "-"}</span>
                    <span className={crStyles.branchArrow}>→</span>
                    <span className={crStyles.branchBase}>{pr.baseBranch || "-"}</span>
                  </span>
                </div>

                <div className={crStyles.mobileDescription}>
                  <span className={crStyles.mobileMetaLabel}>描述</span>
                  <span>{getDescriptionSummary(pr.description)}</span>
                </div>
              </button>

              <div className={crStyles.mobileActions}>{renderPrActions(pr)}</div>
            </article>
          ))
        )}
      </div>

      {total > 0 && (
        <div className={styles.pagination}>
          <span className={styles.paginationInfo}>共 {total} 条记录</span>
          <div className={styles.paginationControls}>
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(1)}>
              <FaAngleDoubleLeft />
            </button>
            <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
              <FaChevronLeft />
            </button>
            {getPageNumbers().map((page, i) =>
              page === "..." ? (
                <span key={`d-${i}`} className={styles.paginationEllipsis}>
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  className={currentPage === page ? styles.activePage : ""}
                  onClick={() => setCurrentPage(page as number)}
                >
                  {page}
                </button>
              ),
            )}
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>
              <FaChevronRight />
            </button>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)}>
              <FaAngleDoubleRight />
            </button>
          </div>
        </div>
      )}

      {/* ============ VIEW MODAL ============ */}
      <Modal visible={viewModalVisible} title={selectedPR?.title || "PR 详情"} onClose={closeView} width={800} footer={null}>
        {selectedPR && (
          <div data-allow-copy="true">
            <div className={crStyles.detailBadges}>
              <span
                className={`${styles.badge} ${selectedPR.state === "closed" ? styles.pr_closed : styles[`status_${selectedPR.state}`]}`}
              >
                {stateText[selectedPR.state]}
              </span>
              {selectedPR.priority && (
                <span className={`${styles.badge} ${styles[`priority_${selectedPR.priority}`]}`}>
                  {selectedPR.priority === "high"
                    ? "高"
                    : selectedPR.priority === "medium"
                      ? "中"
                      : selectedPR.priority === "low"
                        ? "低"
                        : selectedPR.priority === "critical"
                          ? "紧急"
                          : selectedPR.priority}
                </span>
              )}
              {getPrUrl(selectedPR) && (
                <a
                  className={crStyles.githubLink}
                  href={getPrUrl(selectedPR)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="在 GitHub 查看此 PR"
                >
                  <FaGithub size={14} />
                  <span>前往 GitHub</span>
                  <FaExternalLinkAlt size={10} />
                </a>
              )}
            </div>
            <div className={crStyles.detailGrid}>
              {renderField("仓库", getRepoName(selectedPR.repoId))}
              {renderField("PR 编号", selectedPR.githubPrId ? `#${selectedPR.githubPrId}` : "-")}
              {renderField("作者", selectedPR.author)}
              {renderField("评审人", formatReviewers(selectedPR.reviewers))}
              {renderField("审查状态", reviewStatusText[selectedPR.reviewStatus] || selectedPR.reviewStatus)}
              {renderField("源分支", selectedPR.headBranch)}
              {renderField("目标分支", selectedPR.baseBranch)}
              {renderField("Commit", selectedPR.commitSha)}
              {renderField(
                "变更统计",
                selectedPR.changedFiles != null ? (
                  <span>
                    {selectedPR.changedFiles} 文件
                    {selectedPR.additions != null && selectedPR.additions > 0 && (
                      <span className={crStyles.changeAdditions}>+{selectedPR.additions}</span>
                    )}
                    {selectedPR.deletions != null && selectedPR.deletions > 0 && (
                      <span className={crStyles.changeDeletions}>-{selectedPR.deletions}</span>
                    )}
                  </span>
                ) : (
                  "-"
                ),
              )}
              {renderField("创建时间", formatDateTime(selectedPR.createdAt))}
              {renderField("同步时间", formatDateTime(selectedPR.updatedAt))}
            </div>
            <div>
              <h4 className={crStyles.detailSectionTitle}>描述</h4>
              <div className={styles.markdownPreview}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedPR.description || "暂无描述"}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CodeReviewList;
