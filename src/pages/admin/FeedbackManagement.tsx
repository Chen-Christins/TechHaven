import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  FaPlus,
  FaTrash,
  FaQuestionCircle,
  FaEye,
  FaBug,
  FaEdit,
  FaLightbulb,
  FaSyncAlt,
  FaFilter,
  FaClipboardList,
  FaSearch,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaChevronLeft,
  FaChevronRight,
  FaBook,
} from "react-icons/fa";
import styles from "./FeedbackManagement.module.css";
import Input from "@/components/input/Input";
import Modal from "@/components/modal/Modal";
import CustomSelect from "@/components/customSelect/CustomSelect";
import { confirm } from "@/components/confirm/Confirm";
import message from "@/components/message/Message";
import type { SelectOption } from "@/types/index";
import { formatDateTime } from "@/utils/utils";
import { HelpService, type FeedbackItem, type HelpFaq } from "@/services/helpService";
import { OrganizationService } from "@/services/organizationService";

const TYPE_LABELS: Record<string, string> = {
  bug: "问题反馈",
  feature: "功能建议",
  other: "其他",
  "": "全部",
};

const FAQ_CATEGORY_OPTIONS: SelectOption[] = [
  { id: "入门", name: "入门", color: "#3b82f6" },
  { id: "账户安全", name: "账户安全", color: "#ef4444" },
  { id: "组织协作", name: "组织协作", color: "#22c55e" },
  { id: "研发平台", name: "研发平台", color: "#a855f7" },
];

const TYPE_OPTIONS: SelectOption[] = [
  { id: "", name: "全部类型", color: "#6b7280" },
  { id: "bug", name: "问题反馈", color: "#dc2626" },
  { id: "feature", name: "功能建议", color: "#2563eb" },
  { id: "other", name: "其他", color: "#6b7280" },
];

const PAGE_SIZE = 10;

const FeedbackManagement: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);

  const [convertModal, setConvertModal] = useState<{ feedback: FeedbackItem; target: "faq" | "requirement" | "bug" } | null>(null);
  const [convertForm, setConvertForm] = useState({ title: "", content: "", cat: "", orgId: "", orgName: "" });
  const [converting, setConverting] = useState(false);
  const [orgOptions, setOrgOptions] = useState<SelectOption[]>([]);

  // 加载组织列表（供转换弹窗下拉选择）
  useEffect(() => {
    OrganizationService.getOrganizationLists({})
      .then((res) => {
        const colors = ["#3b82f6", "#22c55e", "#a855f7", "#ef4444", "#f59e0b", "#06b6d4", "#ec4899"];
        setOrgOptions(
          (res.list || []).map((org, i) => ({
            id: String(org.id),
            name: org.name,
            color: colors[i % colors.length],
          })),
        );
      })
      .catch(() => {
        // 组织列表加载失败不阻塞页面
      });
  }, []);

  // --- FAQ 列表 ---
  const [faqs, setFaqs] = useState<HelpFaq[]>([]);
  const [faqLoading, setFaqLoading] = useState(false);
  const [faqSearch, setFaqSearch] = useState("");
  const [faqEditModal, setFaqEditModal] = useState<HelpFaq | null>(null);
  const [faqEditForm, setFaqEditForm] = useState({ q: "", a: "", cat: "" });
  const [faqSaving, setFaqSaving] = useState(false);
  const [faqPreview, setFaqPreview] = useState<HelpFaq | null>(null);

  const fetchFaqs = useCallback(async () => {
    setFaqLoading(true);
    try {
      const res = await HelpService.getFaqs();
      setFaqs(Array.isArray(res.data) ? res.data : []);
    } catch {
      // 加载失败不阻塞页面
    } finally {
      setFaqLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFaqs();
  }, [fetchFaqs]);

  const filteredFaqs = useMemo(() => {
    if (!faqSearch) return faqs;
    const kw = faqSearch.toLowerCase();
    return faqs.filter((f) => f.q.toLowerCase().includes(kw) || f.a.toLowerCase().includes(kw) || f.cat.includes(kw));
  }, [faqs, faqSearch]);

  const handleDeleteFaq = (id: string) => {
    confirm({
      title: "删除常见问题",
      content: "确定要删除这条常见问题吗？",
      onConfirm: async () => {
        try {
          await HelpService.deleteFaq(id);
          message.success("已删除");
          setFaqs((prev) => prev.filter((f) => f.id !== id));
        } catch (err: any) {
          message.error(err?.message || "删除失败");
        }
      },
    });
  };

  const openFaqEdit = (faq: HelpFaq) => {
    setFaqEditForm({ q: faq.q, a: faq.a, cat: faq.cat });
    setFaqEditModal(faq);
  };

  const handleFaqEdit = async () => {
    if (!faqEditModal) return;
    if (!faqEditForm.q.trim() || !faqEditForm.a.trim()) {
      message.error("问题和答案不能为空");
      return;
    }
    setFaqSaving(true);
    try {
      await HelpService.updateFaq(faqEditModal.id, {
        q: faqEditForm.q.trim(),
        a: faqEditForm.a.trim(),
        cat: faqEditForm.cat,
      });
      message.success("已保存");
      setFaqEditModal(null);
      fetchFaqs();
    } catch (err: any) {
      message.error(err?.message || "保存失败");
    } finally {
      setFaqSaving(false);
    }
  };

  // 加载反馈列表
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: { page: number; page_size: number; type?: string } = {
        page,
        page_size: PAGE_SIZE,
      };
      if (typeFilter) params.type = typeFilter;
      const res = await HelpService.getFeedbacks(params);
      setFeedbacks(res.data.list || []);
      setTotal(res.data.total || 0);
    } catch (err: any) {
      message.error(err?.message || "加载反馈列表失败");
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 类型筛选变化时重置页码
  const handleTypeFilterChange = (option: SelectOption | null) => {
    setTypeFilter((option?.id as string) || "");
    setPage(1);
  };

  // 客户端搜索过滤（在当前页内过滤）
  const filtered = useMemo(() => {
    if (!search) return feedbacks;
    const kw = search.toLowerCase();
    return feedbacks.filter((f) => f.content.toLowerCase().includes(kw) || f.contact?.toLowerCase().includes(kw));
  }, [feedbacks, search]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      const start = Math.max(1, page - 2);
      const end = Math.min(totalPages, start + maxVisiblePages - 1);
      if (start > 1) {
        pages.push(1);
        if (start > 2) pages.push("...");
      }
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages) {
        if (end < totalPages - 1) pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const openConvert = (feedback: FeedbackItem, target: "faq" | "requirement" | "bug") => {
    setConvertForm({
      title: feedback.content.slice(0, 40),
      content: feedback.content,
      cat: target === "faq" ? "入门" : "",
      orgId: "",
      orgName: "",
    });
    setConvertModal({ feedback, target });
  };

  const handleConvert = async () => {
    if (!convertModal) return;
    if (!convertForm.title.trim()) {
      message.error("请输入标题");
      return;
    }
    setConverting(true);
    try {
      const payload: { title: string; content: string; cat?: string; org_id?: string } = {
        title: convertForm.title.trim(),
        content: convertForm.content.trim(),
      };
      if (convertModal.target === "faq" && convertForm.cat) {
        payload.cat = convertForm.cat.trim();
      }
      if ((convertModal.target === "requirement" || convertModal.target === "bug") && convertForm.orgId) {
        payload.org_id = convertForm.orgId;
      }
      await HelpService.convertFeedback(convertModal.feedback.id, convertModal.target, payload);
      message.success(
        convertModal.target === "faq" ? "已转为常见问题" : convertModal.target === "requirement" ? "已转为需求" : "已转为缺陷",
      );
      setConvertModal(null);
      fetchData();
      if (convertModal.target === "faq") fetchFaqs();
    } catch (err: any) {
      message.error(err?.message || "转换失败");
    } finally {
      setConverting(false);
    }
  };

  const handleDelete = (id: string) => {
    confirm({
      title: "删除反馈",
      content: "确定要删除这条反馈吗？此操作不可恢复。",
      onConfirm: async () => {
        try {
          await HelpService.deleteFeedback(id);
          message.success("已删除");
          // 如果当前页只剩一条且不是第一页，回到上一页
          if (feedbacks.length === 1 && page > 1) {
            setPage((p) => p - 1);
          } else {
            fetchData();
          }
        } catch (err: any) {
          message.error(err?.message || "删除失败");
        }
      },
    });
  };

  const handleRefresh = async () => {
    setPage(1);
    setSearch("");
    setTypeFilter("");
    // 直接请求第一页、无筛选条件的数据
    setLoading(true);
    try {
      const res = await HelpService.getFeedbacks({ page: 1, page_size: PAGE_SIZE });
      setFeedbacks(res.data.list || []);
      setTotal(res.data.total || 0);
    } catch (err: any) {
      message.error(err?.message || "加载反馈列表失败");
    } finally {
      setLoading(false);
    }
    fetchFaqs();
  };

  const convertTitle =
    convertModal?.target === "faq" ? "转为常见问题" : convertModal?.target === "requirement" ? "转为需求" : "转为缺陷";

  return (
    <div className={styles.feedbackManagement}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>帮助运营</h1>
          <p className={styles.pageDescription}>管理用户反馈与常见问题（FAQ）</p>
        </div>
        <div className={styles.headerActions}>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleRefresh}>
            <FaSyncAlt /> 刷新
          </button>
        </div>
      </div>

      <div className={styles.statsContainer}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.primary}`}>
            <FaClipboardList />
          </div>
          <div className={styles.statValue}>{loading ? "..." : total}</div>
          <div className={styles.statLabel}>全部反馈</div>
        </div>
      </div>

      <div className={styles.filterSection}>
        <div className={styles.filterHeader}>
          <h3 className={styles.filterTitle}>
            <FaFilter /> 筛选条件
          </h3>
        </div>
        <div className={styles.filterForm}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>搜索反馈</label>
            <Input
              placeholder="搜索反馈内容或联系方式..."
              value={search}
              onChange={setSearch}
              prefix={<FaSearch />}
              size="large"
              style={{ minHeight: "46px", height: "50px" }}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>反馈类型</label>
            <CustomSelect
              name="类型"
              options={TYPE_OPTIONS}
              value={TYPE_OPTIONS.find((o) => o.id === typeFilter) || TYPE_OPTIONS[0]}
              onChange={handleTypeFilterChange}
              hideBadge={true}
            />
          </div>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <h3 className={styles.tableTitle}>
            <FaClipboardList /> 反馈列表
          </h3>
          <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            共 {total} 条{typeFilter ? `（已筛选）` : ""}
          </span>
        </div>

        {loading ? (
          <div className={styles.empty}>加载中...</div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>暂无反馈</div>
        ) : (
          <>
            <table className={styles.adminTable}>
              <thead>
                <tr>
                  <th>反馈内容</th>
                  <th>类型</th>
                  <th>联系方式</th>
                  <th>时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((fb) => (
                  <tr key={fb.id}>
                    <td className={styles.contentCell}>{fb.content}</td>
                    <td>
                      <span
                        className={`${styles.typeBadge} ${styles[`type${fb.type.charAt(0).toUpperCase() + fb.type.slice(1)}` as keyof typeof styles] || ""}`}
                      >
                        {TYPE_LABELS[fb.type]}
                      </span>
                    </td>
                    <td className={styles.contactCell}>{fb.contact || "-"}</td>
                    <td className={styles.timeCell}>{formatDateTime(fb.created_at)}</td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button className={styles.actionButton} onClick={() => openConvert(fb, "faq")} title="转为 FAQ">
                          <FaQuestionCircle />
                        </button>
                        <button className={styles.actionButton} onClick={() => openConvert(fb, "requirement")} title="转为需求">
                          <FaLightbulb />
                        </button>
                        <button className={styles.actionButton} onClick={() => openConvert(fb, "bug")} title="转为缺陷">
                          <FaBug />
                        </button>
                        <button className={`${styles.actionButton} ${styles.delete}`} onClick={() => handleDelete(fb.id)} title="删除">
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages >= 1 && (
              <div className={styles.pagination}>
                <span className={styles.pageInfo}>
                  显示 {(page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, total)} 条，共 {total} 条记录
                </span>
                <div className={styles.pageButtons}>
                  <button className={styles.pageBtn} disabled={page === 1} onClick={() => setPage(1)}>
                    <FaAngleDoubleLeft />
                  </button>
                  <button className={styles.pageBtn} disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                    <FaChevronLeft />
                  </button>
                  {getPageNumbers().map((p, index) => (
                    <React.Fragment key={index}>
                      {p === "..." ? (
                        <span className={styles.paginationEllipsis}>...</span>
                      ) : (
                        <button
                          className={`${styles.pageBtn} ${page === p ? styles.active : ""}`}
                          onClick={() => setPage(p as number)}
                        >
                          {p}
                        </button>
                      )}
                    </React.Fragment>
                  ))}
                  <button className={styles.pageBtn} disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                    <FaChevronRight />
                  </button>
                  <button className={styles.pageBtn} disabled={page === totalPages} onClick={() => setPage(totalPages)}>
                    <FaAngleDoubleRight />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* FAQ 常见问题列表 */}
      <div className={styles.tableContainer} style={{ marginTop: 24 }}>
        <div className={styles.tableHeader}>
          <h3 className={styles.tableTitle}>
            <FaBook /> 常见问题 (FAQ)
          </h3>
          <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>共 {filteredFaqs.length} 条</span>
        </div>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-primary)" }}>
          <Input
            placeholder="搜索问题或答案..."
            value={faqSearch}
            onChange={setFaqSearch}
            prefix={<FaSearch />}
            size="large"
            style={{ maxWidth: 360, minHeight: "42px", height: "46px" }}
          />
        </div>

        {faqLoading ? (
          <div className={styles.empty}>加载中...</div>
        ) : filteredFaqs.length === 0 ? (
          <div className={styles.empty}>{faqSearch ? "无匹配结果" : "暂无常见问题"}</div>
        ) : (
          <table className={styles.adminTable}>
            <thead>
              <tr>
                <th>问题</th>
                <th>答案</th>
                <th>分类</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredFaqs.map((faq) => (
                <tr key={faq.id}>
                  <td className={styles.contentCell}>{faq.q}</td>
                  <td className={styles.contentCell}>{faq.a.length > 60 ? faq.a.slice(0, 60) + "..." : faq.a}</td>
                  <td>
                    <span className={styles.typeBadge} style={{ background: "#dbeafe", color: "#2563eb" }}>
                      {faq.cat}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actionButtons}>
                      <button className={styles.actionButton} onClick={() => setFaqPreview(faq)} title="预览">
                        <FaEye />
                      </button>
                      <button className={styles.actionButton} onClick={() => openFaqEdit(faq)} title="编辑">
                        <FaEdit />
                      </button>
                      <button
                        className={`${styles.actionButton} ${styles.delete}`}
                        onClick={() => handleDeleteFaq(faq.id)}
                        title="删除"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {convertModal && (
        <Modal visible onClose={() => setConvertModal(null)} title={convertTitle}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>标题</label>
            <Input
              className={styles.formInput}
              value={convertForm.title}
              onChange={(v) => setConvertForm((f) => ({ ...f, title: v }))}
            />
          </div>
          {convertModal.target === "faq" && (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>分类</label>
              <CustomSelect
                name="分类"
                options={FAQ_CATEGORY_OPTIONS}
                value={FAQ_CATEGORY_OPTIONS.find((o) => o.id === convertForm.cat) ?? null}
                onChange={(option) => setConvertForm((f) => ({ ...f, cat: String(option?.id ?? "") }))}
                placeholder="选择 FAQ 分类"
                hideBadge={true}
              />
            </div>
          )}
          {(convertModal.target === "requirement" || convertModal.target === "bug") && (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>指派组织</label>
              <CustomSelect
                name="org"
                options={orgOptions}
                value={orgOptions.find((o) => o.id === convertForm.orgId) ?? null}
                onChange={(option) =>
                  setConvertForm((f) => ({
                    ...f,
                    orgId: String(option?.id ?? ""),
                    orgName: option?.name ?? "",
                  }))
                }
                placeholder="选择目标组织（可选）"
                hideBadge={true}
              />
            </div>
          )}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>内容</label>
            <textarea
              className={styles.formTextarea}
              value={convertForm.content}
              onChange={(e) => setConvertForm((f) => ({ ...f, content: e.target.value }))}
            />
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 20 }}>
            <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setConvertModal(null)}>
              取消
            </button>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleConvert} disabled={converting}>
              {converting ? (
                "处理中..."
              ) : (
                <>
                  <FaPlus /> 确认{convertTitle}
                </>
              )}
            </button>
          </div>
        </Modal>
      )}

      {faqEditModal && (
        <Modal visible onClose={() => setFaqEditModal(null)} title="编辑常见问题">
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>问题</label>
            <Input
              className={styles.formInput}
              value={faqEditForm.q}
              onChange={(v) => setFaqEditForm((f) => ({ ...f, q: v }))}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>答案</label>
            <textarea
              className={styles.formTextarea}
              value={faqEditForm.a}
              onChange={(e) => setFaqEditForm((f) => ({ ...f, a: e.target.value }))}
              style={{ minHeight: 150 }}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>分类</label>
            <CustomSelect
              name="分类"
              options={FAQ_CATEGORY_OPTIONS}
              value={FAQ_CATEGORY_OPTIONS.find((o) => o.id === faqEditForm.cat) ?? null}
              onChange={(option) => setFaqEditForm((f) => ({ ...f, cat: String(option?.id ?? "") }))}
              placeholder="选择分类"
              hideBadge={true}
            />
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 20 }}>
            <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setFaqEditModal(null)}>
              取消
            </button>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleFaqEdit} disabled={faqSaving}>
              {faqSaving ? "保存中..." : "保存"}
            </button>
          </div>
        </Modal>
      )}

      {faqPreview && (
        <Modal visible onClose={() => setFaqPreview(null)} title="预览常见问题" size="large">
          <div style={{ marginBottom: 16 }}>
            <span
              className={styles.typeBadge}
              style={{ background: "#dbeafe", color: "#2563eb", fontSize: 13, padding: "4px 12px" }}
            >
              {faqPreview.cat}
            </span>
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 12px" }}>
            {faqPreview.q}
          </h3>
          <div
            style={{
              fontSize: 14,
              lineHeight: 1.8,
              color: "var(--text-secondary)",
              whiteSpace: "pre-wrap",
              padding: "16px",
              background: "var(--bg-secondary)",
              borderRadius: 8,
              border: "1px solid var(--border-primary)",
            }}
          >
            {faqPreview.a}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default FeedbackManagement;
