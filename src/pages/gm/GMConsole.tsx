import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FaGamepad,
  FaSearch,
  FaBroadcastTower,
  FaBolt,
  FaShieldAlt,
  FaCoins,
  FaMagic,
  FaHistory,
  FaCopy,
  FaCheck,
  FaTerminal,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import message from "@/components/message/Message";
import { useAuth } from "@/contexts/AuthContext";
import GMLayout from "./GMLayout";
import styles from "./GMConsole.module.css";
import Input from "@/components/input/Input";
import CustomSelect from "@/components/customSelect/CustomSelect";
import Button from "@/components/button/Button";
import Loading from "@/components/loading/Loading";
import type { SelectOption } from "../../types";
import { resolveBackendEnvLabel } from "@/utils/http";

interface CommandTemplate {
  label: string;
  command: string;
  icon: React.ReactNode;
}

const GMConsole: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useAuth();
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const [activeSection, setActiveSection] = useState<string>("overview");
  const serverOptions: SelectOption[] = [
    { id: "S1-国服", name: "S1-国服", color: "#3b82f6" },
    { id: "S2-国际服", name: "S2-国际服", color: "#f59e0b" },
    { id: "S3-体验服", name: "S3-体验服", color: "#10b981" },
  ];

  const resourceOptions: SelectOption[] = [
    { id: "gold", name: "金币", color: "#fbbf24" },
    { id: "diamond", name: "钻石", color: "#8b5cf6" },
    { id: "energy", name: "体力", color: "#3b82f6" },
  ];

  const envLabel = resolveBackendEnvLabel();

  const [playerId, setPlayerId] = useState("");
  const [server, setServer] = useState<SelectOption | null>(serverOptions[0]);
  const [resourceType, setResourceType] = useState<SelectOption | null>(resourceOptions[0]);
  const [amount, setAmount] = useState(1000);
  const [reason, setReason] = useState("测试资源调整");
  const [command, setCommand] = useState(`/add ${resourceOptions[0].id} 1000`);
  const [pending, setPending] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const templates = useMemo<CommandTemplate[]>(
    () => [
      { label: "补偿金币 +5,000", command: "/add gold 5000", icon: <FaCoins /> },
      { label: "刷新体力", command: "/reset stamina", icon: <FaBolt /> },
      { label: "全局公告", command: "/broadcast 测试公告", icon: <FaBroadcastTower /> },
      { label: "临时护盾", command: "/buff shield 600", icon: <FaShieldAlt /> },
    ],
    [],
  );

  const timeline = [
    { type: "broadcast", text: "已向全服广播维护提示", time: "10:21", status: "success" },
    { type: "resource", text: "为玩家 #10086 发放金币 2,000", time: "10:18", status: "success" },
    { type: "buff", text: "为玩家 #10086 添加护盾 buff(600s)", time: "10:16", status: "success" },
    { type: "rollback", text: "回滚玩家 #9527 上一次指令", time: "10:12", status: "warn" },
  ];

  const statCards = [
    { label: "在线玩家", value: "5,123", trend: "+3.2%", tone: "positive" as const },
    { label: "今日指令", value: "182", trend: "-1.1%", tone: "neutral" as const },
    { label: "待处理工单", value: "7", trend: "", tone: "warn" as const },
  ];

  const navSections = [
    { id: "overview", label: "总览", icon: <FaGamepad /> },
    { id: "locate", label: "玩家定位", icon: <FaSearch /> },
    { id: "resource", label: "资源调整", icon: <FaCoins /> },
    { id: "templates", label: "指令模板", icon: <FaMagic /> },
    { id: "timeline", label: "操作流", icon: <FaHistory /> },
  ];

  const handleSend = async () => {
    if (!playerId.trim()) {
      message.warn("请先填写玩家ID或昵称");
      return;
    }
    setPending(true);
    setTimeout(() => {
      message.success("指令已派发（模拟）");
      setPending(false);
    }, 600);
  };

  const handleBroadcast = () => {
    message.success("已发送公告（模拟）");
  };

  const copyCommand = (text: string, index: number) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 900);
      })
      .catch(() => message.error("复制失败"));
  };

  const scrollToSection = (id: string) => {
    const el = sectionRefs.current[id];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(id);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) {
          setActiveSection(visible.target.id);
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0.1, 0.25, 0.5] },
    );

    Object.values(sectionRefs.current).forEach((node) => {
      if (node) observer.observe(node);
    });

    return () => observer.disconnect();
  }, []);

  if (loading) {
    return (
      <div className={styles.page}>
        <Loading size="medium" text="正在加载权限..." />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "管理员") {
    return (
      <div
        className={styles.page}
        style={{
          minHeight: "60vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
        }}
      >
        <FaShieldAlt style={{ fontSize: "32px", color: "var(--text-secondary)" }} />
        <h2 style={{ margin: 0 }}>无权限访问</h2>
        <p style={{ margin: 0, color: "var(--text-secondary)" }}>请使用管理员账号登录后再试。</p>
        <div style={{ display: "flex", gap: "10px" }}>
          <Button
            color="primary"
            variant="solid"
            size="medium"
            onClick={() => navigate("/auth?redirect=" + encodeURIComponent(window.location.pathname + window.location.search))}
          >
            前往登录
          </Button>
          <Button color="primary" variant="ghost" size="medium" onClick={() => navigate("/")}>
            返回首页
          </Button>
        </div>
      </div>
    );
  }

  return (
    <GMLayout navSections={navSections} activeSection={activeSection} scrollToSection={scrollToSection}>
      <div
        className={styles.hero}
        id="overview"
        ref={(el) => {
          sectionRefs.current["overview"] = el;
        }}
      >
        <div>
          <div className={styles.badge}>GM 控制台</div>
          <h1 className={styles.title}>即时调优 · 精准控制</h1>
          <p className={styles.subtitle}>快速派发 GM 指令、资源补偿与全服公告，已适配深浅主题。</p>
          <div className={styles.heroActions}>
            <Button color="primary" variant="solid" size="medium" onClick={handleSend} disabled={pending}>
              <FaTerminal /> 立即派发
            </Button>
            <Button color="primary" variant="outline" size="medium" onClick={handleBroadcast}>
              <FaBroadcastTower /> 全服公告
            </Button>
          </div>
        </div>
        <div className={styles.heroRight}>
          <div className={styles.heroCard}>
            <div className={styles.heroIcon}>
              <FaGamepad />
            </div>
            <div>
              <div className={styles.heroStatLabel}>当前环境</div>
              <div className={styles.heroStatValue}>{envLabel}</div>
            </div>
          </div>
          <div className={styles.heroCard}>
            <div className={styles.heroIcon}>
              <FaMagic />
            </div>
            <div>
              <div className={styles.heroStatLabel}>可用模板</div>
              <div className={styles.heroStatValue}>{templates.length}</div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.statGrid}>
        {statCards.map((card) => (
          <div key={card.label} className={`${styles.statCard} ${styles[`tone-${card.tone}`]}`}>
            <div className={styles.statLabel}>{card.label}</div>
            <div className={styles.statValue}>{card.value}</div>
            {card.trend && <div className={styles.statTrend}>{card.trend}</div>}
          </div>
        ))}
      </div>

      <div className={styles.grid}>
        <section
          id="locate"
          ref={(el) => {
            sectionRefs.current["locate"] = el;
          }}
          className={styles.card}
        >
          <div className={styles.cardHeader}>
            <div>
              <p className={styles.cardTag}>玩家定位</p>
              <h3 className={styles.cardTitle}>精准检索与状态摘要</h3>
              <p className={styles.cardDesc}>支持按照玩家 ID、昵称或区服快速定位，输出即时状态。</p>
            </div>
            <FaSearch className={styles.cardIcon} />
          </div>
          <div className={styles.formRow}>
            <label>玩家 ID / 昵称</label>
            <Input size="large" value={playerId} onChange={(val) => setPlayerId(val)} placeholder="如: 10086 或 玩家昵称" />
          </div>
          <div className={styles.formRow}>
            <label>区服</label>
            <CustomSelect name="区服" options={serverOptions} value={server} onChange={(opt) => setServer(opt)} hideBadge />
          </div>
          <div className={styles.inlineActions}>
            <Button color="primary" variant="outline" size="medium" onClick={() => message.info("查询中（模拟）")}>
              <FaSearch /> 快速查询
            </Button>
            <Button color="primary" variant="ghost" size="medium" onClick={() => message.info("获取状态（模拟）")}>
              <FaBroadcastTower /> 拉取实时状态
            </Button>
          </div>
        </section>

        <section
          id="resource"
          ref={(el) => {
            sectionRefs.current["resource"] = el;
          }}
          className={styles.card}
        >
          <div className={styles.cardHeader}>
            <div>
              <p className={styles.cardTag}>资源调整</p>
              <h3 className={styles.cardTitle}>发放补偿与数值微调</h3>
              <p className={styles.cardDesc}>一次性派发资源并记录原因，适配审计需求。</p>
            </div>
            <FaCoins className={styles.cardIcon} />
          </div>
          <div className={styles.dualRow}>
            <div className={styles.formRow}>
              <label>资源类型</label>
              <CustomSelect
                name="资源类型"
                options={resourceOptions}
                value={resourceType}
                onChange={(opt) => setResourceType(opt)}
                hideBadge
              />
            </div>
            <div className={styles.formRow}>
              <label>数量</label>
              <Input size="large" type="number" value={amount.toString()} min={0} onChange={(val) => setAmount(Number(val) || 0)} />
            </div>
          </div>
          <div className={styles.formRow}>
            <label>原因备注</label>
            <Input size="large" value={reason} onChange={(val) => setReason(val)} placeholder="记录发放原因" />
          </div>
          <div className={styles.inlineActions}>
            <Button color="primary" variant="solid" size="medium" onClick={handleSend} disabled={pending}>
              <FaBolt /> 派发资源
            </Button>
            <Button color="primary" variant="outline" size="medium" onClick={() => message.info("预览成功（模拟）")}>
              预览指令
            </Button>
          </div>
          <div className={styles.hint}>
            指令示例：/add {resourceType?.id || "gold"} {amount}
          </div>
        </section>

        <section
          id="templates"
          ref={(el) => {
            sectionRefs.current["templates"] = el;
          }}
          className={styles.card}
        >
          <div className={styles.cardHeader}>
            <div>
              <p className={styles.cardTag}>指令模板</p>
              <h3 className={styles.cardTitle}>一键套用 · 减少输入</h3>
              <p className={styles.cardDesc}>点击快速应用常用 GM 指令，也可复制到剪贴板。</p>
            </div>
            <FaMagic className={styles.cardIcon} />
          </div>
          <div className={styles.templateGrid}>
            {templates.map((tpl, index) => (
              <div key={tpl.label} className={styles.templateCard}>
                <div className={styles.templateIcon}>{tpl.icon}</div>
                <div className={styles.templateText}>
                  <div className={styles.templateLabel}>{tpl.label}</div>
                  <div className={styles.templateCommand}>{tpl.command}</div>
                </div>
                <div className={styles.templateActions}>
                  <Button
                    size="small"
                    variant="outline"
                    color="primary"
                    onClick={() => {
                      setCommand(tpl.command);
                      message.success("已套用模板");
                    }}
                  >
                    <FaCheck />
                  </Button>
                  <Button size="small" variant="ghost" color="primary" onClick={() => copyCommand(tpl.command, index)}>
                    {copiedIndex === index ? <FaCheck /> : <FaCopy />}
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className={styles.formRow}>
            <label>指令内容</label>
            <textarea
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              className={styles.textarea}
              rows={3}
              placeholder="输入自定义 GM 指令"
            />
          </div>
          <div className={styles.inlineActions}>
            <Button color="primary" variant="solid" size="medium" onClick={handleSend} disabled={pending}>
              <FaTerminal /> 派发指令
            </Button>
            <Button color="primary" variant="ghost" size="medium" onClick={() => message.info("已保存草稿（模拟）")}>
              保存草稿
            </Button>
          </div>
        </section>

        <section
          id="timeline"
          ref={(el) => {
            sectionRefs.current["timeline"] = el;
          }}
          className={styles.card}
        >
          <div className={styles.cardHeader}>
            <div>
              <p className={styles.cardTag}>操作流</p>
              <h3 className={styles.cardTitle}>最近派发与回滚</h3>
              <p className={styles.cardDesc}>记录最近动作，便于追踪与快速回滚。</p>
            </div>
            <FaHistory className={styles.cardIcon} />
          </div>
          <div className={styles.timeline}>
            {timeline.map((item) => (
              <div key={item.text} className={`${styles.timelineItem} ${styles[`status-${item.status}`]}`}>
                <div className={styles.timelineDot} />
                <div className={styles.timelineContent}>
                  <div className={styles.timelineText}>{item.text}</div>
                  <div className={styles.timelineMeta}>{item.time}</div>
                </div>
                <Button size="small" variant="ghost" color="primary" onClick={() => message.info("回滚（模拟）")}>
                  回滚
                </Button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </GMLayout>
  );
};

export default GMConsole;
