import React, { useState, useMemo } from "react";
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

interface Faq {
  id: string;
  q: string;
  a: string;
  cat: string;
}

const FAQS: Faq[] = [
  {
    id: "1",
    cat: "入门",
    q: "如何发布我的第一篇文章？",
    a: "登录后点击导航栏的「写文章」，使用 Markdown 编辑器撰写内容，填写标题、分类与标签后点击发布即可。",
  },
  {
    id: "2",
    cat: "入门",
    q: "支持哪些 Markdown 语法？",
    a: "支持 GFM 全套语法，包括代码高亮、表格、任务列表，以及 KaTeX 数学公式和 Mermaid 图表。",
  },
  {
    id: "3",
    cat: "账户安全",
    q: "为什么登录信息不保存在浏览器？",
    a: "为防止 Token 被篡改，平台采用内存态存储敏感数据，关闭页面后需重新认证，这是有意的安全设计。",
  },
  { id: "4", cat: "账户安全", q: "如何开启两步验证？", a: "前往「账户安全」页面，打开「两步验证」开关并按提示绑定验证器即可。" },
  { id: "5", cat: "组织协作", q: "如何加入一个组织？", a: "在「组织列表」中找到目标组织并提交加入申请，等待管理员审批通过。" },
  { id: "6", cat: "研发平台", q: "研发平台需要什么权限才能访问？", a: "你需要加入至少一个组织，并在组织内具有报告者及以上角色。" },
  {
    id: "7",
    cat: "研发平台",
    q: "看板上的卡片如何流转状态？",
    a: "直接拖拽卡片到目标列即可修改状态，支持需求、缺陷与任务的统一管理。",
  },
];

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
  const [openId, setOpenId] = useState<string | null>(FAQS[0].id);
  const [fbType, setFbType] = useState("bug");
  const [fbContent, setFbContent] = useState("");
  const [fbContact, setFbContact] = useState("");

  const filtered = useMemo(() => (search ? FAQS.filter((f) => f.q.includes(search) || f.a.includes(search)) : FAQS), [search]);

  const submitFeedback = () => {
    if (!fbContent.trim()) {
      message.warn("请填写反馈内容");
      return;
    }
    message.success("反馈已提交，感谢你的建议！");
    setFbContent("");
    setFbContact("");
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
            const count = FAQS.filter((f) => f.cat === c.name).length;
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
          <div className={styles.card} style={{ marginBottom: 0 }}>
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
              {filtered.length === 0 && <div className={helpStyles.faqEmpty}>未找到相关问题，试试提交反馈</div>}
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
            <Button color="primary" onClick={submitFeedback}>
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
