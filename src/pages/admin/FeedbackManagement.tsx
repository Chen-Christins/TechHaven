import React, { useState, useMemo } from "react";
import { FaPlus, FaTrash, FaQuestionCircle, FaBug, FaLightbulb, FaSyncAlt, FaFilter, FaClipboardList, FaSearch, FaAngleDoubleLeft, FaAngleDoubleRight, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import styles from "./FeedbackManagement.module.css";
import Input from "@/components/input/Input";
import Modal from "@/components/modal/Modal";
import CustomSelect from "@/components/customSelect/CustomSelect";
import { confirm } from "@/components/confirm/Confirm";
import message from "@/components/message/Message";
import type { SelectOption } from "@/types/index";
import { formatDateTime } from "@/utils/utils";

type FeedbackType = "bug" | "feature" | "other";

interface MockFeedback {
  id: string;
  type: FeedbackType;
  content: string;
  contact?: string;
  created_at: number;
}

const FEEDBACK_CONTENTS: { type: FeedbackType; content: string; contact?: string }[] = [
  {
    type: "bug",
    content: "私信页面在移动端偶尔无法展开聊天窗，点击对话列表中任意一项都没有反应，需要刷新页面才能恢复。",
    contact: "user@example.com",
  },
  { type: "feature", content: "希望文章编辑器能支持拖拽上传图片，现在需要手动点按钮选择文件，不太方便。", contact: "小王" },
  { type: "other", content: "请问后续会支持 Markdown 导出为 PDF 吗？想把自己的文章存档。", contact: "zhang@test.com" },
  { type: "bug", content: "个人中心的成就热力图颜色在暗色模式下看不清，色差太小了。" },
  { type: "feature", content: "建议增加文章目录锚点滚动功能，长文章阅读体验会好很多。", contact: "李四" },
  { type: "bug", content: "评论区的回复功能有 bug，点击回复后会跳转到页面顶部而不是定位到当前评论。" },
  { type: "feature", content: "希望研发平台的看板可以自定义泳道列，现在的列是固定的不够灵活。", contact: "dev@team.com" },
  { type: "bug", content: "通知中心的未读数量有时与实际不符，比如点开后角标没及时消失。" },
  { type: "feature", content: "能否添加 RSS 订阅功能？方便用阅读器追踪更新。", contact: "rss_fan" },
  { type: "other", content: "科技港湾这个项目开源了吗？想学习一下你们的实现。", contact: "learner@github" },
  { type: "bug", content: "搜索关键词包含特殊字符时会显示空白结果，例如搜索「C++」什么也不返回。" },
  { type: "feature", content: "建议在用户主页也展示一下贡献热力图，类似 GitHub profile 那种。", contact: "design@user.com" },
  { type: "other", content: "日均活跃用户数大概多少？有没有公开的统计数据？" },
  {
    type: "bug",
    content: "文章编辑时偶尔会遇到内容自动滚动到文档顶部的现象，正在写的内容会丢失光标位置。",
    contact: "editor@blog.com",
  },
  { type: "feature", content: "希望通知能支持邮件推送，有时会错过重要消息提醒。", contact: "pm@team.com" },
  { type: "bug", content: "后台管理页面在 1024px 分辨率下列表显示异常，操作按钮被折叠掉了。", contact: "admin@site.com" },
  { type: "feature", content: "建议增加代码块的行号显示和高亮语言标签，便于读者识别。" },
  { type: "bug", content: "重新登录后未读通知角标没有复位，还是显示之前的总数。", contact: "test@test.com" },
  { type: "other", content: "什么时候支持 OAuth 第三方登录？比如 GitHub 或 Google。" },
  { type: "feature", content: "想申请成为编辑，有公开的申请渠道吗？", contact: "writer@mail.com" },
  { type: "bug", content: "个人资料的「我的标签」页加载超时，一整天了还在转圈。" },
  { type: "feature", content: "文章分类希望能支持无限层级，现在的二级分类不够用。", contact: "cms@user.com" },
  { type: "other", content: "请问有移动端 App 吗？还是只有 Web 端？", contact: "mobile@user.com" },
  { type: "bug", content: "组织详情页的成员列表加载不出来，排查后发现是接口返回了 500。", contact: "org_admin" },
  { type: "feature", content: "建议在编辑器里加一个自动保存功能，防止意外丢失内容。", contact: "writer@blog.com" },
];

const TYPE_LABELS: Record<FeedbackType | "", string> = {
  bug: "问题反馈",
  feature: "功能建议",
  other: "其他",
  "": "全部",
};

const TYPE_OPTIONS: SelectOption[] = [
  { id: "", name: "全部类型", color: "#6b7280" },
  { id: "bug", name: "问题反馈", color: "#dc2626" },
  { id: "feature", name: "功能建议", color: "#2563eb" },
  { id: "other", name: "其他", color: "#6b7280" },
];

function buildMockFeedbacks(): MockFeedback[] {
  const now = Date.now();
  return FEEDBACK_CONTENTS.map((item, i) => ({
    id: String(i + 1),
    type: item.type,
    content: item.content,
    contact: item.contact || undefined,
    created_at: Math.floor((now - (FEEDBACK_CONTENTS.length - i) * 86400000 * 3) / 1000),
  }));
}

const MOCK_ORGS: SelectOption[] = [
  { id: "org-1", name: "前端开发组", color: "#3b82f6" },
  { id: "org-2", name: "后端研发组", color: "#22c55e" },
  { id: "org-3", name: "产品设计组", color: "#a855f7" },
  { id: "org-4", name: "质量保障组", color: "#ef4444" },
  { id: "org-5", name: "运维基础组", color: "#f59e0b" },
];

const PAGE_SIZE = 10;

const FeedbackManagement: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<MockFeedback[]>(buildMockFeedbacks);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);

  const [convertModal, setConvertModal] = useState<{ feedback: MockFeedback; target: "faq" | "requirement" | "bug" } | null>(null);
  const [convertForm, setConvertForm] = useState({ title: "", content: "", cat: "", orgId: "", orgName: "" });
  const [converting, setConverting] = useState(false);

  const stats = useMemo(() => {
    const total = feedbacks.length;
    const bug = feedbacks.filter((f) => f.type === "bug").length;
    const feature = feedbacks.filter((f) => f.type === "feature").length;
    const other = feedbacks.filter((f) => f.type === "other").length;
    return { total, bug, feature, other };
  }, [feedbacks]);

  const filtered = useMemo(() => {
    let list = feedbacks;
    if (search) {
      const kw = search.toLowerCase();
      list = list.filter((f) => f.content.toLowerCase().includes(kw) || f.contact?.toLowerCase().includes(kw));
    }
    if (typeFilter) {
      list = list.filter((f) => f.type === typeFilter);
    }
    return list;
  }, [feedbacks, search, typeFilter]);

  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

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

  const openConvert = (feedback: MockFeedback, target: "faq" | "requirement" | "bug") => {
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
    setConverting(true);
    await new Promise((r) => setTimeout(r, 600));
    message.success(
      convertModal.target === "faq" ? "已转为常见问题" : convertModal.target === "requirement" ? "已转为需求" : "已转为缺陷",
    );
    setConverting(false);
    setConvertModal(null);
  };

  const handleDelete = (id: string) => {
    confirm({
      title: "删除反馈",
      content: "确定要删除这条反馈吗？此操作不可恢复。",
      onConfirm: () => {
        setFeedbacks((prev) => prev.filter((f) => f.id !== id));
        message.success("已删除");
      },
    });
  };

  const handleRefresh = () => {
    setFeedbacks(buildMockFeedbacks());
    setPage(1);
    message.success("已刷新");
  };

  const convertTitle =
    convertModal?.target === "faq" ? "转为常见问题" : convertModal?.target === "requirement" ? "转为需求" : "转为缺陷";

  return (
    <div className={styles.feedbackManagement}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>反馈管理</h1>
          <p className={styles.pageDescription}>管理用户提交的反馈，可转为 FAQ、需求或缺陷</p>
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
          <div className={styles.statValue}>{stats.total}</div>
          <div className={styles.statLabel}>全部反馈</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.warning}`}>
            <FaBug />
          </div>
          <div className={styles.statValue}>{stats.bug}</div>
          <div className={styles.statLabel}>问题反馈</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.primary}`}>
            <FaLightbulb />
          </div>
          <div className={styles.statValue}>{stats.feature}</div>
          <div className={styles.statLabel}>功能建议</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.success}`}>
            <FaQuestionCircle />
          </div>
          <div className={styles.statValue}>{stats.other}</div>
          <div className={styles.statLabel}>其他</div>
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
            <Input placeholder="搜索反馈内容或联系方式..." value={search} onChange={setSearch} prefix={<FaSearch />} size="large" style={{ minHeight: "46px", height: "50px" }} />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>反馈类型</label>
            <CustomSelect
              name="类型"
              options={TYPE_OPTIONS}
              value={TYPE_OPTIONS.find((o) => o.id === typeFilter) || TYPE_OPTIONS[0]}
              onChange={(o) => setTypeFilter((o?.id as string) || "")}
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
          <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>共 {filtered.length} 条</span>
        </div>

        {paged.length === 0 ? (
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
                {paged.map((fb) => (
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
                  显示 {(page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, filtered.length)} 条，共 {filtered.length} 条记录
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

      {convertModal && (
        <Modal visible onClose={() => setConvertModal(null)} title={convertTitle}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>标题</label>
            <Input className={styles.formInput} value={convertForm.title} onChange={(v) => setConvertForm((f) => ({ ...f, title: v }))} />
          </div>
          {convertModal.target === "faq" && (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>分类</label>
              <Input
                className={styles.formInput}
                value={convertForm.cat}
                onChange={(v) => setConvertForm((f) => ({ ...f, cat: v }))}
                placeholder="如：入门、账户安全"
              />
            </div>
          )}
          {(convertModal.target === "requirement" || convertModal.target === "bug") && (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>指派组织</label>
              <CustomSelect
                name="org"
                options={MOCK_ORGS}
                value={MOCK_ORGS.find((o) => o.id === convertForm.orgId) ?? null}
                onChange={(option) => setConvertForm((f) => ({ ...f, orgId: String(option?.id ?? ""), orgName: option?.name ?? "" }))}
                placeholder="选择目标组织"
              />
            </div>
          )}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>内容</label>
            <textarea className={styles.formTextarea} value={convertForm.content} onChange={(e) => setConvertForm((f) => ({ ...f, content: e.target.value }))} />
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
    </div>
  );
};

export default FeedbackManagement;
