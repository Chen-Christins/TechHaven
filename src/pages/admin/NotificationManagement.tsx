import React, { useState, useEffect } from "react";
import { FaBell, FaPaperPlane, FaTimes } from "react-icons/fa";
import CustomSelect from "@/components/customSelect/CustomSelect";
import Input from "@/components/input/Input";
import Button from "@/components/button/Button";
import DatePicker from "@/components/datePicker/DatePicker";
import Switch from "@/components/switch/Switch";
import message from "@/components/message/Message";
import NotificationService from "@/services/notificationService";
import type { SelectOption } from "@/types/index";
import styles from "./NotificationManagement.module.css";

const BROADCAST_LEVEL_OPTIONS: SelectOption[] = [
  { id: "info", name: "普通", color: "#3b82f6" },
  { id: "warning", name: "警告", color: "#f59e0b" },
  { id: "danger", name: "紧急", color: "#ef4444" },
];

const NotificationManagement: React.FC = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("system");
  const [target, setTarget] = useState<"all" | "users">("all");
  const [userIds, setUserIds] = useState("");
  const [isBroadcast, setIsBroadcast] = useState(false);
  const [broadcastLevel, setBroadcastLevel] = useState<string>("info");
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [sending, setSending] = useState(false);
  const [activeBroadcasts, setActiveBroadcasts] = useState<{ id: number; title: string; content: string; level: string }[]>([]);

  const fetchBroadcasts = async () => {
    try {
      const list = await NotificationService.getBroadcasts();
      setActiveBroadcasts(list);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchBroadcasts();
  }, []);

  const handleCloseBroadcast = async (id: number) => {
    try {
      await NotificationService.closeBroadcast(id);
      message.success("广播已关闭");
      fetchBroadcasts();
    } catch (err: any) {
      message.error(err?.message || "关闭失败");
    }
  };

  const typeOptions: SelectOption[] = [
    { id: "system", name: "系统通知", color: "#6366f1" },
    { id: "announcement", name: "公告", color: "#f59e0b" },
    { id: "article", name: "文章推送", color: "#10b981" },
  ];

  const targetOptions: SelectOption[] = [
    { id: "all", name: "所有用户", color: "#6366f1" },
    { id: "users", name: "指定用户", color: "#f59e0b" },
  ];

  const handleSend = async () => {
    if (!title.trim()) {
      message.error("请输入通知标题");
      return;
    }
    if (!content.trim()) {
      message.error("请输入通知内容");
      return;
    }
    if (target === "users" && !userIds.trim()) {
      message.error("请输入目标用户ID");
      return;
    }
    if (isBroadcast && endTime && startTime && endTime <= startTime) {
      message.error("结束时间必须晚于开始时间");
      return;
    }

    setSending(true);
    try {
      await NotificationService.sendNotification({
        title: title.trim(),
        content: content.trim(),
        type,
        target,
        user_ids: target === "users" ? userIds.trim() : undefined,
        is_broadcast: isBroadcast,
        level: isBroadcast ? broadcastLevel : undefined,
        start_time: isBroadcast && startTime ? Math.floor(startTime.getTime() / 1000) : undefined,
        end_time: isBroadcast && endTime ? Math.floor(endTime.getTime() / 1000) : undefined,
      });
      message.success(isBroadcast ? "广播已创建" : "通知发送成功");
      setTitle("");
      setContent("");
      setUserIds("");
      setIsBroadcast(false);
      setStartTime(null);
      setEndTime(null);
      if (isBroadcast) fetchBroadcasts();
    } catch (err: any) {
      message.error(err.message || "发送失败，请稍后重试");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.notificationManagement}>
      {/* 页面头部 */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            <FaBell />
            发送通知
          </h1>
          <p className={styles.pageDescription}>向用户推送系统通知、公告或文章更新提醒</p>
        </div>
      </div>

      {/* 表单卡片 */}
      <div className={styles.formCard}>
        <div className={styles.formSection}>
          <h3 className={styles.formSectionTitle}>通知设置</h3>

          <div className={styles.formGrid}>
            {/* 通知类型 */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>通知类型</label>
              <CustomSelect
                name="通知类型"
                options={typeOptions}
                value={typeOptions.find((o) => o.id === type) || null}
                onChange={(option) => setType(String(option?.id || "system"))}
                placeholder="选择通知类型"
                hideBadge={true}
              />
            </div>

            {/* 发送目标 */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>发送目标</label>
              <CustomSelect
                name="发送目标"
                options={targetOptions}
                value={targetOptions.find((o) => o.id === target) || null}
                onChange={(option) => setTarget((option?.id as "all" | "users") || "all")}
                placeholder="选择发送目标"
                hideBadge={true}
              />
            </div>
          </div>

          {/* 指定用户ID */}
          {target === "users" && (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>目标用户ID</label>
              <Input
                placeholder="多个ID用逗号分隔，例如: 1,2,3"
                value={userIds}
                onChange={(value) => setUserIds(value)}
                allowClear={true}
                size="large"
              />
            </div>
          )}

          {/* 设为广播跑马灯 */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>设为广播</label>
            <div className={styles.switchRow}>
              <Switch checked={isBroadcast} onChange={(checked) => setIsBroadcast(checked)} />
              <span className={styles.switchHint}>开启后该通知将在页面顶部跑马灯持续滚动展示</span>
            </div>
          </div>

          {/* 广播设置 */}
          {isBroadcast && (
            <>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>广播级别</label>
                <CustomSelect
                  name="广播级别"
                  options={BROADCAST_LEVEL_OPTIONS}
                  value={BROADCAST_LEVEL_OPTIONS.find((o) => o.id === broadcastLevel) || null}
                  onChange={(option) => setBroadcastLevel(String(option?.id || "info"))}
                  placeholder="选择广播级别"
                  hideBadge={true}
                />
              </div>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>开始时间（可选，留空立即可见）</label>
                  <DatePicker
                    value={startTime || undefined}
                    onChange={(date) => setStartTime(date)}
                    placeholder="即时生效"
                    showTime
                    allowClear
                    size="large"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>结束时间（可选，留空手动关闭）</label>
                  <DatePicker
                    value={endTime || undefined}
                    onChange={(date) => setEndTime(date)}
                    placeholder="手动关闭"
                    showTime
                    allowClear
                    size="large"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <div className={styles.formDivider} />

        {/* 通知内容 */}
        <div className={styles.formSection}>
          <h3 className={styles.formSectionTitle}>通知内容</h3>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>通知标题</label>
            <Input
              placeholder="请输入通知标题"
              value={title}
              onChange={(value) => setTitle(value)}
              allowClear={true}
              maxLength={100}
              size="large"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              通知内容
              <span className={styles.charCount}>{content.length}/2000</span>
            </label>
            <textarea
              className={styles.textarea}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="请输入通知内容，支持纯文本"
              rows={6}
              maxLength={2000}
            />
          </div>
        </div>

        {/* 操作按钮 */}
        <div className={styles.formActions}>
          <Button color="primary" size="medium" onClick={handleSend} disabled={sending} loading={sending}>
            <FaPaperPlane />
            {sending ? "发送中..." : "发送通知"}
          </Button>
        </div>
      </div>

      {/* 当前广播列表 */}
      {activeBroadcasts.length > 0 && (
        <div className={styles.formCard} style={{ marginTop: 24 }}>
          <h3 className={styles.formSectionTitle}>当前广播</h3>
          <div className={styles.broadcastList}>
            {activeBroadcasts.map((bc) => (
              <div key={bc.id} className={styles.broadcastItem}>
                <div className={styles.broadcastContent}>
                  <div className={styles.broadcastTitle}>
                    <span
                      style={{
                        display: "inline-block",
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: bc.level === "danger" ? "#ef4444" : bc.level === "warning" ? "#f59e0b" : "#3b82f6",
                      }}
                    />
                    <strong style={{ fontSize: 14 }}>{bc.title}</strong>
                  </div>
                  <div className={styles.broadcastText}>{bc.content}</div>
                </div>
                <button onClick={() => handleCloseBroadcast(bc.id)} className={styles.broadcastCloseButton} title="手动关闭此广播">
                  <FaTimes size={10} style={{ marginRight: 4 }} />
                  关闭
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationManagement;
