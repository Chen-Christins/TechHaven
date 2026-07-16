import React, { useState, useMemo, useEffect } from "react";
import {
  FaQuestionCircle,
  FaSearch,
  FaChevronDown,
  FaBook,
  FaRocket,
  FaShieldAlt,
  FaUsers,
  FaCode,
  FaPaperPlane,
  FaInbox,
} from "react-icons/fa";
import styles from "./UserPage.module.css";
import helpStyles from "./HelpCenter.module.css";
import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/footer/Footer";
import Input from "@/components/input/Input";
import Button from "@/components/button/Button";
import CustomSelect from "@/components/customSelect/CustomSelect";
import message from "@/components/message/Message";
import type { SelectOption } from "../../types";
import { HelpService, type HelpFaq } from "../../services/helpService";

const CATEGORIES = [
  { name: "入门", icon: <FaRocket />, color: "#3b82f6" },
  { name: "账户安全", icon: <FaShieldAlt />, color: "#ef4444" },
  { name: "组织协作", icon: <FaUsers />, color: "#22c55e" },
  { name: "研发平台", icon: <FaCode />, color: "#a855f7" },
];

const feedbackTypes: SelectOption[] = [
  { id: "bug", name: "问题反馈", color: "#ef4444" },
  { id: "feature", name: "功能建议", color: "#3b82f6" },
  { id: "other", name: "其他", color: "#6c757d" },
];

const HelpCenter: React.FC = () => {
  const [search, setSearch] = useState("");
  const [faqs, setFaqs] = useState<HelpFaq[]>([]);
  const [faqLoading, setFaqLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [fbType, setFbType] = useState("bug");
  const [fbContent, setFbContent] = useState("");
  const [fbContact, setFbContact] = useState("");
  const [fbSubmitting, setFbSubmitting] = useState(false);

  useEffect(() => {
    HelpService.getFaqs()
      .then((res) => {
        const list = res.data || [];
        console.log("Fetched FAQs:", list); // Debugging line
        setFaqs(list);
        if (list.length > 0) setOpenId(list[0].id);
      })
      .catch(() => message.error("加载常见问题失败"))
      .finally(() => setFaqLoading(false));
  }, []);

  const filtered = useMemo(() => (search ? faqs.filter((f) => f.q.includes(search) || f.a.includes(search)) : faqs), [search, faqs]);

  const submitFeedback = async () => {
    if (!fbContent.trim()) {
      message.warn("请填写反馈内容");
      return;
    }
    setFbSubmitting(true);
    try {
      const res = await HelpService.submitFeedback({
        type: fbType as "bug" | "feature" | "other",
        content: fbContent.trim(),
        contact: fbContact.trim() || undefined,
      });
      if (res.errno === 0) {
        message.success("反馈已提交，感谢你的建议！");
        setFbContent("");
        setFbContact("");
      } else {
        message.error(res.msg || "提交失败，请稍后再试");
      }
    } catch {
      message.error("提交失败，请检查网络");
    } finally {
      setFbSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.container}>
        <div className={helpStyles.hero}>
          <FaQuestionCircle className={helpStyles.heroIcon} />
          <h1 className={helpStyles.heroTitle}>帮助中心</h1>
          <p className={helpStyles.heroDesc}>查找常见问题，或向我们反馈</p>
          <div className={helpStyles.heroSearch}>
            <Input
              placeholder="搜索问题，如“如何发布文章”"
              value={search}
              onChange={setSearch}
              prefix={<FaSearch />}
              allowClear
              size="large"
            />
          </div>
        </div>

        <div className={helpStyles.catRow}>
          {CATEGORIES.map((c) => {
            const count = faqs.filter((f) => f.cat === c.name).length;
            return (
              <div key={c.name} className={helpStyles.catCard} onClick={() => setSearch("")}>
                <div className={helpStyles.catIcon} style={{ color: c.color, background: `${c.color}1a` }}>
                  {c.icon}
                </div>
                <div className={helpStyles.catName}>{c.name}</div>
                <div className={helpStyles.catCount}>{count} 个问题</div>
              </div>
            );
          })}
        </div>

        <div className={helpStyles.layout}>
          <div className={`${styles.card} ${helpStyles.faqCard}`} style={{ marginBottom: 0 }}>
            <h2 className={styles.cardTitle}>
              <FaBook /> 常见问题
            </h2>
            <div className={helpStyles.faqList}>
              {filtered.map((f) => (
                <div key={f.id} className={helpStyles.faqItem}>
                  <button className={helpStyles.faqQ} onClick={() => setOpenId((id) => (id === f.id ? null : f.id))}>
                    <span>{f.q}</span>
                    <FaChevronDown className={`${helpStyles.faqChevron} ${openId === f.id ? helpStyles.faqOpen : ""}`} />
                  </button>
                  {openId === f.id && <div className={helpStyles.faqA}>{f.a}</div>}
                </div>
              ))}
              {faqLoading && (
                <div className={helpStyles.faqEmpty}>
                  <FaQuestionCircle className={helpStyles.faqEmptyIcon} />
                  <span>加载中...</span>
                </div>
              )}
              {!faqLoading && filtered.length === 0 && (
                <div className={helpStyles.faqEmpty}>
                  <FaInbox className={helpStyles.faqEmptyIcon} />
                  <span>{search ? "未找到相关问题" : "暂无常见问题"}</span>
                  {search && <p className={helpStyles.faqEmptyHint}>试试其他关键词，或提交反馈告诉我们</p>}
                </div>
              )}
            </div>
          </div>

          <div className={styles.card} style={{ marginBottom: 0 }}>
            <h2 className={styles.cardTitle}>
              <FaPaperPlane /> 提交反馈
            </h2>
            <p className={styles.cardDesc}>没找到答案？把问题告诉我们</p>
            <div className={styles.formRow}>
              <label className={styles.formLabel}>反馈类型</label>
              <CustomSelect
                name="反馈类型"
                options={feedbackTypes}
                value={feedbackTypes.find((o) => o.id === fbType) || null}
                onChange={(o) => setFbType((o?.id as string) || "bug")}
                hideBadge
              />
            </div>
            <div className={styles.formRow}>
              <label className={styles.formLabel}>详细描述</label>
              <textarea
                className={helpStyles.textarea}
                placeholder="请描述你遇到的问题或建议..."
                value={fbContent}
                onChange={(e) => setFbContent(e.target.value)}
                rows={5}
              />
            </div>
            <div className={styles.formRow}>
              <label className={styles.formLabel}>联系方式（选填）</label>
              <Input placeholder="邮箱或其他联系方式" value={fbContact} onChange={setFbContact} size="large" />
            </div>
            <Button color="primary" onClick={submitFeedback} loading={fbSubmitting}>
              <FaPaperPlane style={{ marginRight: 6 }} /> 提交反馈
            </Button>
          </div>
        </div>
      </div>
      <Footer startYear={2025} />
    </div>
  );
};

export default HelpCenter;
