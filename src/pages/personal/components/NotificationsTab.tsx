import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBellSlash,
  FaComment,
  FaHeart,
  FaUserPlus,
  FaBullhorn,
  FaNewspaper,
  FaUserShield,
  FaUserClock,
  FaUserCheck,
  FaUserTimes,
  FaUserMinus,
  FaFileUpload,
  FaClipboardCheck,
  FaBan,
  FaCheckDouble,
  FaCog,
} from "react-icons/fa";
import NotificationService from "../../../services/NotificationService";
import { isRead, markRead, markAllRead, subscribe } from "../../../utils/notificationState";
import {
  getSettings,
  getEnabledTypes,
  setTypeEnabled,
  subscribe as subscribeSettings,
  type NotifType,
} from "../../../utils/notificationSettingsState";
import { notificationWS } from "../../../utils/websocket";
import CustomSelect from "../../../components/customSelect/CustomSelect";
import Modal from "../../../components/modal/Modal";
import Switch from "../../../components/switcher/Switch";
import type { SelectOption } from "../../../types/index";
import type { Notification as NotificationItem } from "../../../types/notification";
import styles from "../PersonalCenter.module.css";

const TYPE_ICON_MAP: Record<string, { icon: React.ReactNode; className: string }> = {
  system: { icon: <FaBullhorn />, className: styles.notifIconSystem },
  comment: { icon: <FaComment />, className: styles.notifIconComment },
  praise: { icon: <FaHeart />, className: styles.notifIconLike },
  follow: { icon: <FaUserPlus />, className: styles.notifIconFollow },
  article: { icon: <FaNewspaper />, className: styles.notifIconArticle },
  org_role_change: { icon: <FaUserShield />, className: styles.notifIconOrgRoleChange },
  org_join_request: { icon: <FaUserClock />, className: styles.notifIconOrgJoinRequest },
  org_join_approved: { icon: <FaUserCheck />, className: styles.notifIconOrgJoinApproved },
  org_join_rejected: { icon: <FaUserTimes />, className: styles.notifIconOrgJoinRejected },
  org_member_kicked: { icon: <FaUserMinus />, className: styles.notifIconOrgMemberKicked },
  article_review_request: { icon: <FaFileUpload />, className: styles.notifIconArticleReviewRequest },
  article_review_approved: { icon: <FaClipboardCheck />, className: styles.notifIconArticleReviewApproved },
  article_review_rejected: { icon: <FaBan />, className: styles.notifIconArticleReviewRejected },
};

const TYPE_OPTIONS: SelectOption[] = [
  { id: "all", name: "全部类型", color: "#6c757d" },
  { id: "system", name: "系统通知", color: "#3b82f6" },
  { id: "comment", name: "评论", color: "#10b981" },
  { id: "praise", name: "文章点赞", color: "#f97316" },
  { id: "follow", name: "关注", color: "#8b5cf6" },
  { id: "article", name: "文章", color: "#f59e0b" },
  { id: "org_role_change", name: "角色变更", color: "#8b5cf6" },
  { id: "org_join_request", name: "加入申请", color: "#f59e0b" },
  { id: "org_join_approved", name: "申请通过", color: "#10b981" },
  { id: "org_join_rejected", name: "申请拒绝", color: "#ef4444" },
  { id: "org_member_kicked", name: "成员移出", color: "#dc2626" },
  { id: "article_review_request", name: "待审核", color: "#f59e0b" },
  { id: "article_review_approved", name: "审核通过", color: "#10b981" },
  { id: "article_review_rejected", name: "审核拒绝", color: "#ef4444" },
];

function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp * 1000;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 30) return `${days}天前`;
  return new Date(timestamp * 1000).toLocaleDateString("zh-CN");
}

function getPageNumbers(current: number, total: number): (number | string)[] {
  const pages: (number | string)[] = [];
  const maxVisible = 5;

  if (total <= maxVisible) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    const start = Math.max(1, current - 2);
    const end = Math.min(total, start + maxVisible - 1);
    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push("...");
    }
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < total) {
      if (end < total - 1) pages.push("...");
      pages.push(total);
    }
  }
  return pages;
}

const PAGE_SIZE = 20;

const NotificationsTab: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<SelectOption | null>(TYPE_OPTIONS[0]);
  const [, setTick] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  // 通知设置
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState(getSettings);

  // Subscribe to settings changes from other components (e.g., bell dropdown)
  useEffect(() => {
    return subscribeSettings(() => {
      setSettings(getSettings());
    });
  }, []);

  // Subscribe to shared state changes from the bell component
  useEffect(() => {
    return subscribe(() => {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: n.is_read || isRead(n.id) })));
      setTick((t) => t + 1);
    });
  }, []);

  // Listen for real-time notifications via WebSocket — reset to page 1
  useEffect(() => {
    const unsub = notificationWS.onMessage("notification", () => {
      setCurrentPage(1);
      setRefreshKey((k) => k + 1);
    });
    return unsub;
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const enabledTypes = getEnabledTypes();
      const allTypesCount = Object.keys(getSettings()).length;
      const offset = (currentPage - 1) * PAGE_SIZE;
      const data = await NotificationService.getNotifications({
        offset,
        size: PAGE_SIZE,
        type: typeFilter !== "all" ? typeFilter : undefined,
      });
      // 未全部启用时，客户端再过滤一层
      const filtered = enabledTypes.length === allTypesCount
        ? data.list
        : data.list.filter((n) => enabledTypes.includes(n.type as NotifType));
      setNotifications(filtered);
      setTotal(data.total ?? data.list.length);
    } catch {
      // 静默处理
    } finally {
      setLoading(false);
    }
  }, [currentPage, typeFilter, settings]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications, refreshKey]);

  const handleTypeChange = (option: SelectOption | null) => {
    setSelectedType(option);
    setTypeFilter(String(option?.id ?? "all"));
    setCurrentPage(1);
  };

  const handleSettingToggle = (type: NotifType, checked: boolean) => {
    setTypeEnabled(type, checked);
    setSettings(getSettings());
    setCurrentPage(1);
  };

  const handleMarkAllRead = () => {
    NotificationService.markAllAsRead().catch(() => {});
    markAllRead(notifications.map((n) => n.id));
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleItemClick = (item: NotificationItem) => {
    if (!item.is_read) {
      markRead(item.id);
      NotificationService.markAsRead(item.id).catch(() => {});
      setNotifications((prev) => prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n)));
    }
    if (item.link) {
      navigate(item.link);
    }
  };

  const typeMeta = (type: string) => TYPE_ICON_MAP[type] || TYPE_ICON_MAP.system;

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + notifications.length, total);
  const unreadCount = notifications.filter((n) => !n.is_read && !isRead(n.id)).length;

  // 设置面板中要用到的类型列表
  const settingTypes: { key: NotifType; label: string }[] = [
    { key: "system", label: "系统通知" },
    { key: "comment", label: "评论通知" },
    { key: "praise", label: "文章点赞通知" },
    { key: "follow", label: "关注通知" },
    { key: "article", label: "文章通知" },
    { key: "org_role_change", label: "角色变更通知" },
    { key: "org_join_request", label: "加入申请通知" },
    { key: "org_join_approved", label: "申请通过通知" },
    { key: "org_join_rejected", label: "申请拒绝通知" },
    { key: "org_member_kicked", label: "成员移出通知" },
    { key: "article_review_request", label: "文章待审核通知" },
    { key: "article_review_approved", label: "文章审核通过通知" },
    { key: "article_review_rejected", label: "文章审核拒绝通知" },
  ];

  return (
    <div className={styles.contentSection}>
      {/* Header */}
      <div className={styles.sectionHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h2>通知中心</h2>
          {unreadCount > 0 && <span className={styles.unreadBadge}>{unreadCount} 条未读</span>}
        </div>
        {unreadCount > 0 && (
          <button className={styles.markAllReadBtn} onClick={handleMarkAllRead}>
            <FaCheckDouble />
            全部标为已读
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className={styles.searchFilterBar}>
        <div className={styles.notifTypeFilter}>
          <CustomSelect name="类型" options={TYPE_OPTIONS} value={selectedType} onChange={handleTypeChange} hideBadge={true} />
        </div>
        <button className={styles.notifSettingsBtn} onClick={() => setShowSettings(true)}>
          <FaCog />
          通知设置
        </button>
      </div>

      {/* Notification list */}
      <div className={styles.notifList}>
        {loading ? (
          <div className={styles.notifEmpty}>
            <span>加载中...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className={styles.notifEmpty}>
            <FaBellSlash className={styles.notifEmptyIcon} />
            <span>暂无通知</span>
          </div>
        ) : (
          notifications.map((item) => {
            const meta = typeMeta(item.type);
            return (
              <div
                key={item.id}
                className={`${styles.notifItem} ${!item.is_read ? styles.notifItemUnread : ""}`}
                onClick={() => handleItemClick(item)}
              >
                <div className={`${styles.notifItemIcon} ${meta.className}`}>{meta.icon}</div>
                <div className={styles.notifItemBody}>
                  <div className={styles.notifItemTitle}>
                    {item.title}
                    {!item.is_read && <span className={styles.notifItemDot} />}
                  </div>
                  <div className={styles.notifItemContent}>{item.content}</div>
                  <div className={styles.notifItemTime}>{formatTime(item.create_time)}</div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages >= 1 && (
        <div className={styles.pagination}>
          <div className={styles.paginationInfo}>
            显示 {startIndex + 1} - {endIndex} 条，共 {total} 条通知
          </div>
          <div className={styles.paginationControls}>
            <button className={styles.paginationButton} onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
              首页
            </button>
            <button
              className={styles.paginationButton}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              上一页
            </button>
            {getPageNumbers(currentPage, totalPages).map((page, index) => (
              <button
                key={index}
                className={`${styles.paginationButton} ${currentPage === page ? styles.active : ""}`}
                onClick={() => page !== "..." && setCurrentPage(page as number)}
                disabled={page === "..."}
              >
                {page}
              </button>
            ))}
            <button
              className={styles.paginationButton}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              下一页
            </button>
            <button
              className={styles.paginationButton}
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              末页
            </button>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        title="通知设置"
        onClose={() => setShowSettings(false)}
        size="small"
        footer={
          <button className={styles.cancelButton} onClick={() => setShowSettings(false)}>
            关闭
          </button>
        }
      >
        <div className={styles.settingsList}>
          {settingTypes.map(({ key, label }) => {
            const meta = typeMeta(key);
            return (
              <div key={key} className={styles.settingsItem}>
                <div className={styles.settingsItemLeft}>
                  <span className={`${styles.settingsItemIcon} ${meta.className}`}>{meta.icon}</span>
                  <span className={styles.settingsItemLabel}>{label}</span>
                </div>
                <Switch checked={settings[key]} size="small" onChange={(checked) => handleSettingToggle(key, checked)} />
              </div>
            );
          })}
        </div>
      </Modal>
    </div>
  );
};

export default NotificationsTab;
