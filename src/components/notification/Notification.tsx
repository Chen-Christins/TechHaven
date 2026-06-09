import React, { useState, useEffect, useRef, useCallback } from "react";
import { flushSync } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  FaBell,
  FaBellSlash,
  FaComment,
  FaHeart,
  FaUserPlus,
  FaBullhorn,
  FaNewspaper,
  FaCog,
  FaUserShield,
  FaUserClock,
  FaUserCheck,
  FaUserTimes,
  FaUserMinus,
  FaFileUpload,
  FaClipboardCheck,
  FaBan,
  FaClipboardList,
  FaBug,
  FaTasks,
} from "react-icons/fa";
import styles from "./Notification.module.css";
import NotificationService from "../../services/NotificationService";
import {
  markRead,
  markAllRead,
  subscribe,
  setUnreadCount,
  getUnreadCount,
  isUnreadCountInitialized,
  subscribeUnreadCount,
  incrementUnreadCount,
  decrementUnreadCount,
} from "../../utils/notificationState";
import { getSettings, setTypeEnabled, subscribe as subscribeSettings, type NotifType } from "../../utils/notificationSettingsState";
import { notificationWS } from "../../utils/websocket";
import { playNotificationSound } from "../../utils/notificationSound";
import { useAuth } from "../../contexts/AuthContext";
import Modal from "../modal/Modal";
import Switch from "../switcher/Switch";
import { setFaviconBadge } from "../../utils/favicon";
import { encodeId } from "../../utils/hashId";
import type { Notification as NotificationItem } from "../../types/notification";

const TYPE_ICON_MAP: Record<string, { icon: React.ReactNode; className: string }> = {
  system: { icon: <FaBullhorn />, className: styles.iconSystem },
  comment: { icon: <FaComment />, className: styles.iconComment },
  reply: { icon: <FaComment />, className: styles.iconComment },
  praise: { icon: <FaHeart />, className: styles.iconLike },
  follow: { icon: <FaUserPlus />, className: styles.iconFollow },
  article: { icon: <FaNewspaper />, className: styles.iconArticle },
  org_role_change: { icon: <FaUserShield />, className: styles.iconOrgRoleChange },
  org_join_request: { icon: <FaUserClock />, className: styles.iconOrgJoinRequest },
  org_join_approved: { icon: <FaUserCheck />, className: styles.iconOrgJoinApproved },
  org_join_rejected: { icon: <FaUserTimes />, className: styles.iconOrgJoinRejected },
  org_member_kicked: { icon: <FaUserMinus />, className: styles.iconOrgMemberKicked },
  article_review_request: { icon: <FaFileUpload />, className: styles.iconArticleReviewRequest },
  article_review_approved: { icon: <FaClipboardCheck />, className: styles.iconArticleReviewApproved },
  article_review_rejected: { icon: <FaBan />, className: styles.iconArticleReviewRejected },
  comment_approved: { icon: <FaClipboardCheck />, className: styles.iconArticleReviewApproved },
  comment_rejected: { icon: <FaBan />, className: styles.iconArticleReviewRejected },
  comment_spam: { icon: <FaBan />, className: styles.iconArticleReviewRejected },
  comment_admin_deleted: { icon: <FaUserMinus />, className: styles.iconOrgMemberKicked },
  requirement_assigned: { icon: <FaClipboardList />, className: styles.iconRequirementAssigned },
  bug_assigned: { icon: <FaBug />, className: styles.iconBugAssigned },
  task_assigned: { icon: <FaTasks />, className: styles.iconTaskAssigned },
  org_apply_request: { icon: <FaFileUpload />, className: styles.iconOrgJoinRequest },
  org_apply_approved: { icon: <FaClipboardCheck />, className: styles.iconOrgJoinApproved },
  org_apply_rejected: { icon: <FaBan />, className: styles.iconOrgJoinRejected },
  org_deleted: { icon: <FaUserMinus />, className: styles.iconOrgMemberKicked },
  account_deleted: { icon: <FaUserTimes />, className: styles.iconOrgJoinRejected },
  account_recovered: { icon: <FaUserCheck />, className: styles.iconOrgJoinApproved },
  password_reset: { icon: <FaCog />, className: styles.iconSystem },
  article_state_changed: { icon: <FaNewspaper />, className: styles.iconArticle },
  assignment_submitted: { icon: <FaFileUpload />, className: styles.iconArticleReviewRequest },
  assignment_created: { icon: <FaBullhorn />, className: styles.iconSystem },
  assignment_deleted: { icon: <FaUserMinus />, className: styles.iconOrgMemberKicked },
};

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

const Notification: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setLocalUnreadCount] = useState(() => (isUnreadCountInitialized() ? getUnreadCount() : 0));
  const [loading, setLoading] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState(getSettings);

  // Subscribe to settings changes from NotificationsTab
  useEffect(() => {
    return subscribeSettings(() => {
      setSettings(getSettings());
    });
  }, []);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await NotificationService.getNotifications({ offset: 0, size: 50 });
      setNotifications((prev) => {
        const apiIds = new Set(data.list.map((n: NotificationItem) => n.id));
        const wsOnlyItems = prev.filter((n) => !apiIds.has(n.id));
        return [...wsOnlyItems, ...data.list];
      });
    } catch {
      // 静默处理
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await NotificationService.getUnreadCount();
      setUnreadCount(data.count ?? 0);
    } catch {
      // 静默处理
    }
  }, []);

  // Sync local display state with global unread count
  useEffect(() => {
    return subscribeUnreadCount((count) => {
      setLocalUnreadCount(count);
    });
  }, []);

  // Listen for mark-read actions from other components (e.g. NotificationsTab)
  useEffect(() => {
    return subscribe((delta) => {
      decrementUnreadCount(delta);
    });
  }, []);

  // WebSocket real-time notification listener
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleNotification = (data: any) => {
      const newNotification: NotificationItem = {
        id: data.notification_id ?? data.id ?? Date.now(),
        type: data.notification_type ?? data.type ?? "system",
        title: data.title ?? "",
        content: data.content ?? data.body ?? "",
        is_read: data.is_read ?? false,
        create_time: data.create_time ?? Math.floor(Date.now() / 1000),
        link: data.link,
        article_id: data.article_id,
        comment_id: data.comment_id,
        bug_id: data.bug_id,
        requirement_id: data.requirement_id,
        task_id: data.task_id,
        apply_id: data.apply_id,
        org_id: data.org_id,
        assignment_id: data.assignment_id,
      };
      // 播放提示音
      playNotificationSound();

      // flushSync 确保 React 立即提交渲染，不等下一次事件循环
      flushSync(() => {
        setNotifications((prev) => [newNotification, ...prev]);
        incrementUnreadCount();
      });
    };

    // 注册指定 type="notification" 的处理器
    const unsub1 = notificationWS.onMessage("notification", handleNotification);
    // 兜底：同时注册通配符处理器，覆盖服务端 type 字段不一致的情况
    const unsub2 = notificationWS.onMessage("*", (data: any) => {
      // 如果已有精确匹配的 "notification" 处理器触发过，这里就不重复处理
      // 通配符只在消息格式不标准时兜底
      const msgType = data?.type || data?.event || "";
      if (msgType === "notification") return; // 已由精确处理器处理
      // 只要携带了通知相关字段就视为通知
      if (data?.notification_id || data?.title || data?.content) {
        handleNotification(data);
      }
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, [isAuthenticated]);

  // 认证完成后拉取初始未读数（仅在硬刷新时拉取 API，SPA 导航复用全局计数）
  useEffect(() => {
    if (!isAuthenticated) return;
    if (!isUnreadCountInitialized()) {
      fetchUnreadCount();
    }
  }, [isAuthenticated, fetchUnreadCount]);

  // WebSocket 重连后刷新通知列表（全局计数已本地维护，无需再拉 API）
  const wsFirstOpen = useRef(true);
  useEffect(() => {
    const unsub = notificationWS.onOpen(() => {
      if (wsFirstOpen.current) {
        wsFirstOpen.current = false;
        return;
      }
      fetchNotifications();
    });
    return unsub;
  }, [fetchNotifications]);

  // Update browser tab favicon badge when unread count changes
  useEffect(() => {
    setFaviconBadge(unreadCount);
    return () => {
      setFaviconBadge(0); // restore original favicon on unmount
    };
  }, [unreadCount]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // WebSocket 连接状态（仅开发环境）
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    setWsConnected(notificationWS.isConnected);
    const unsubOpen = notificationWS.onOpen(() => setWsConnected(true));
    const unsubClose = notificationWS.onClose(() => setWsConnected(false));
    return () => {
      unsubOpen();
      unsubClose();
    };
  }, []);

  const handleToggle = () => {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen) {
      fetchNotifications();
    }
  };

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    markAllRead(notifications.map((n) => n.id));
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    // Fire-and-forget API call (don't block UI)
    NotificationService.markAllAsRead().catch(() => {});
  };

  const handleItemClick = (item: NotificationItem) => {
    if (!item.is_read) {
      markRead(item.id);
      setNotifications((prev) => prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n)));
      NotificationService.markAsRead(item.id).catch(() => {});
    }
    setOpen(false);

    // RD 平台通知 → 跳转到对应工单详情
    if (item.type === "bug_assigned" && item.bug_id) {
      navigate(`/rd/bugs/${encodeId(item.bug_id)}`);
      return;
    }
    if (item.type === "requirement_assigned" && item.requirement_id) {
      navigate(`/rd/requirements/${encodeId(item.requirement_id)}`);
      return;
    }
    if (item.type === "task_assigned" && item.task_id) {
      navigate(`/rd/tasks/${encodeId(item.task_id)}`);
      return;
    }

    // 组织创建申请通过 → 跳转到组织详情
    if (item.type === "org_apply_approved" && item.org_id) {
      navigate(`/organization/detail/${encodeId(item.org_id)}`);
      return;
    }

    // 作业相关通知
    if (item.type === "assignment_submitted" && item.assignment_id) {
      navigate(`/assignment/submissions/${encodeId(item.assignment_id)}`);
      return;
    }
    if (item.type === "assignment_created" && item.assignment_id) {
      navigate(`/assignment/submit/${encodeId(item.assignment_id)}`);
      return;
    }

    // 文章相关通知 → 跳转到文章详情
    if (item.article_id) {
      navigate(`/article/${encodeId(item.article_id)}`);
      return;
    }

    // link 作为兜底
    if (item.link) {
      navigate(item.link);
    }
  };

  const handleViewAll = () => {
    setOpen(false);
    navigate("/personal?tab=notifications");
  };

  const handleSettingToggle = (type: NotifType, checked: boolean) => {
    setTypeEnabled(type, checked);
    setSettings(getSettings());
  };

  const settingTypes: { key: NotifType; label: string }[] = [
    { key: "system", label: "系统通知" },
    { key: "comment", label: "评论通知" },
    { key: "reply", label: "评论回复通知" },
    { key: "praise", label: "文章点赞通知" },
    { key: "follow", label: "关注通知" },
    { key: "article", label: "文章通知" },
    { key: "article_state_changed", label: "文章状态变更通知" },
    { key: "article_review_request", label: "文章待审核通知" },
    { key: "article_review_approved", label: "文章审核通过通知" },
    { key: "article_review_rejected", label: "文章审核拒绝通知" },
    { key: "comment_approved", label: "评论审核通过通知" },
    { key: "comment_rejected", label: "评论未通过通知" },
    { key: "comment_spam", label: "评论垃圾标记通知" },
    { key: "comment_admin_deleted", label: "评论被删通知" },
    { key: "org_role_change", label: "角色变更通知" },
    { key: "org_join_request", label: "加入申请通知" },
    { key: "org_join_approved", label: "申请通过通知" },
    { key: "org_join_rejected", label: "申请拒绝通知" },
    { key: "org_member_kicked", label: "成员移出通知" },
    { key: "org_apply_request", label: "组织创建申请通知" },
    { key: "org_apply_approved", label: "组织创建通过通知" },
    { key: "org_apply_rejected", label: "组织创建拒绝通知" },
    { key: "org_deleted", label: "组织删除通知" },
    { key: "requirement_assigned", label: "需求分配通知" },
    { key: "bug_assigned", label: "缺陷分配通知" },
    { key: "task_assigned", label: "任务分配通知" },
    { key: "assignment_created", label: "新作业发布通知" },
    { key: "assignment_submitted", label: "作业提交通知" },
    { key: "assignment_deleted", label: "作业删除通知" },
    { key: "account_deleted", label: "账户禁用通知" },
    { key: "account_recovered", label: "账户恢复通知" },
    { key: "password_reset", label: "密码重置通知" },
  ];

  const typeMeta = (type: string) => TYPE_ICON_MAP[type] || TYPE_ICON_MAP.system;

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button className={styles.bellButton} onClick={handleToggle} title="通知">
        <FaBell className={styles.bellIcon} />
        {unreadCount > 0 && <span className={styles.badge}>{unreadCount > 99 ? "99+" : unreadCount}</span>}
      </button>

      {open && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <span className={styles.title}>
              通知
              {import.meta.env.DEV && (
                <span
                  style={{
                    display: "inline-block",
                    width: 7,
                    height: 7,
                    verticalAlign: "middle",
                    marginLeft: 6,
                    marginBottom: 6,
                    borderRadius: "50%",
                    backgroundColor: wsConnected ? "#22c55e" : "#ef4444",
                    boxShadow: wsConnected ? "0 0 5px rgba(34, 197, 94, 0.6)" : "0 0 5px rgba(239, 68, 68, 0.6)",
                    flexShrink: 0,
                  }}
                  title={wsConnected ? "WS 已连接" : "WS 未连接"}
                />
              )}
            </span>
            {unreadCount > 0 && (
              <button className={styles.markAllRead} onClick={handleMarkAllRead}>
                全部已读
              </button>
            )}
          </div>

          <div className={styles.list}>
            {loading ? (
              <div className={styles.loading}>加载中...</div>
            ) : notifications.filter((n) => !n.is_read).length === 0 ? (
              <div className={styles.empty}>
                <FaBellSlash className={styles.emptyIcon} />
                <span className={styles.emptyText}>暂无未读通知</span>
              </div>
            ) : (
              notifications
                .filter((n) => !n.is_read)
                .map((item) => {
                  const meta = typeMeta(item.type);
                  return (
                    <div
                      key={item.id}
                      className={`${styles.item} ${!item.is_read ? styles.itemUnread : ""}`}
                      onClick={() => handleItemClick(item)}
                    >
                      <div className={`${styles.itemIcon} ${meta.className}`}>{meta.icon}</div>
                      <div className={styles.itemBody}>
                        <div className={styles.itemTitle}>{item.title}</div>
                        <div className={styles.itemContent}>{item.content}</div>
                        <div className={styles.itemTime}>{formatTime(item.create_time)}</div>
                      </div>
                      {!item.is_read && <span className={styles.unreadDot} />}
                    </div>
                  );
                })
            )}
          </div>

          {notifications.length > 0 && (
            <div className={styles.footer}>
              <button className={styles.viewAll} onClick={handleViewAll}>
                查看全部
              </button>
              <button className={styles.viewAll} onClick={() => setShowSettings(true)}>
                <FaCog />
                通知设置
              </button>
            </div>
          )}
        </div>
      )}

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        title="通知设置"
        onClose={() => setShowSettings(false)}
        size="small"
        footer={
          <button
            className={styles.viewAll}
            onClick={() => setShowSettings(false)}
            style={{
              background: "none",
              border: "1px solid var(--border-primary)",
              padding: "8px 16px",
              borderRadius: 8,
              cursor: "pointer",
              color: "var(--text-primary)",
              fontSize: 14,
            }}
          >
            关闭
          </button>
        }
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          {settingTypes.map(({ key, label }) => {
            const meta = typeMeta(key);
            return (
              <div
                key={key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 0",
                  borderBottom: key === "article" ? "none" : "1px solid var(--border-light)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      ...(key === "system"
                        ? { backgroundColor: "rgba(59,130,246,0.1)", color: "var(--primary)" }
                        : key === "comment"
                          ? { backgroundColor: "rgba(16,185,129,0.1)", color: "var(--success)" }
                          : key === "praise"
                            ? { backgroundColor: "rgba(239,68,68,0.1)", color: "var(--error)" }
                            : key === "follow"
                              ? { backgroundColor: "rgba(139,92,246,0.1)", color: "var(--accent)" }
                              : { backgroundColor: "rgba(245,158,11,0.1)", color: "var(--warning)" }),
                    }}
                  >
                    {meta.icon}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{label}</span>
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

export default Notification;
