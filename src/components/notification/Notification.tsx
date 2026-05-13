import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FaBell, FaBellSlash, FaComment, FaHeart, FaUserPlus, FaBullhorn, FaNewspaper } from "react-icons/fa";
import styles from "./Notification.module.css";
import NotificationService from "../../services/NotificationService";
import { isRead, markRead, markAllRead, subscribe } from "../../utils/notificationState";
import { notificationWS } from "../../utils/websocket";
import { useAuth } from "../../contexts/AuthContext";
import type { Notification as NotificationItem } from "../../types/notification";

const MOCK_ENABLED = false;

const NOW = Math.floor(Date.now() / 1000);

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 1,
    type: "system",
    title: "系统维护通知",
    content: "本站将于 2026-05-15 凌晨 2:00-4:00 进行服务器升级维护，届时部分功能可能暂时不可用，敬请谅解。",
    is_read: false,
    create_time: NOW - 120,
  },
  {
    id: 2,
    type: "comment",
    title: "张三 评论了你的文章",
    content: "这篇关于 React 状态管理的文章写得太好了，尤其是 useReducer 和 Context 结合使用的部分，解决了我一直以来的困惑！",
    is_read: false,
    create_time: NOW - 600,
    link: "/article/1",
  },
  {
    id: 3,
    type: "like",
    title: "李四 点赞了你的文章",
    content: "你的文章《TypeScript 高级类型技巧》获得了 1 个赞",
    is_read: false,
    create_time: NOW - 1800,
    link: "/article/2",
  },
  {
    id: 4,
    type: "follow",
    title: "王五 关注了你",
    content: "王五 开始关注你，你们现在可以互相看到对方的动态了",
    is_read: false,
    create_time: NOW - 3600,
    link: "/profile/wangwu",
  },
  {
    id: 5,
    type: "article",
    title: "你关注的文章已更新",
    content: "《深入理解 Vite 插件机制》发布了新章节「插件钩子执行顺序详解」，点击查看最新内容",
    is_read: false,
    create_time: NOW - 7200,
    link: "/article/3",
  },
  {
    id: 6,
    type: "comment",
    title: "赵六 回复了你的评论",
    content: "同意你的观点，不过我觉得还可以补充一下关于异步更新的处理方式",
    is_read: false,
    create_time: NOW - 10800,
    link: "/article/1",
  },
  {
    id: 7,
    type: "like",
    title: "你的评论获得了 5 个赞",
    content: "你在文章《CSS Grid 布局实战》中的评论「Grid 配合 subgrid 可以实现非常灵活的嵌套布局」获得了 5 个赞",
    is_read: false,
    create_time: NOW - 18000,
  },
  {
    id: 8,
    type: "system",
    title: "欢迎加入 TechBlog",
    content: "感谢你的注册！你可以在个人中心完善资料，或直接开始撰写你的第一篇文章。",
    is_read: true,
    create_time: NOW - 86400,
  },
  {
    id: 9,
    type: "follow",
    title: "孙七 关注了你",
    content: "孙七 开始关注你",
    is_read: true,
    create_time: NOW - 172800,
  },
  {
    id: 10,
    type: "article",
    title: "你的文章入选了精选推荐",
    content: "恭喜！你的文章《React 性能优化实战》已被编辑推荐到首页精选栏目，预计将获得更多曝光。",
    is_read: true,
    create_time: NOW - 259200,
    link: "/article/4",
  },
  {
    id: 11,
    type: "like",
    title: "你的文章获得了 10 个赞",
    content: "《Node.js 微服务架构设计》获得了 10 个赞",
    is_read: true,
    create_time: NOW - 432000,
    link: "/article/5",
  },
  {
    id: 12,
    type: "comment",
    title: "周八 评论了你的文章",
    content: "学到了",
    is_read: true,
    create_time: NOW - 604800,
    link: "/article/2",
  },
];

const TYPE_ICON_MAP: Record<string, { icon: React.ReactNode; className: string }> = {
  system: { icon: <FaBullhorn />, className: styles.iconSystem },
  comment: { icon: <FaComment />, className: styles.iconComment },
  like: { icon: <FaHeart />, className: styles.iconLike },
  follow: { icon: <FaUserPlus />, className: styles.iconFollow },
  article: { icon: <FaNewspaper />, className: styles.iconArticle },
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
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      if (MOCK_ENABLED) {
        const merged = MOCK_NOTIFICATIONS.map((n) => ({
          ...n,
          is_read: n.is_read || isRead(n.id),
        }));
        setNotifications(merged);
        setUnreadCount(merged.filter((n) => !n.is_read).length);
      } else {
        const data = await NotificationService.getNotifications({ offset: 0, size: 50 });
        setNotifications(data.list);
      }
    } catch {
      // 后端接口未就绪时静默处理
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      if (MOCK_ENABLED) {
        setUnreadCount(MOCK_NOTIFICATIONS.filter((n) => !n.is_read && !isRead(n.id)).length);
      } else {
        const data = await NotificationService.getUnreadCount();
        setUnreadCount(data.count);
      }
    } catch {
      // 静默处理
    }
  }, []);

  // Subscribe to shared state changes so badge updates when NotificationsTab marks all read.
  // Uses a ref guard to avoid race: when this component itself triggers markRead,
  // the synchronous subscriber would kick off an async fetchUnreadCount that
  // overwrites the local optimistic decrement.
  const selfUpdating = useRef(false);

  useEffect(() => {
    return subscribe(() => {
      if (selfUpdating.current) return;
      fetchUnreadCount();
    });
  }, [fetchUnreadCount]);

  // WebSocket real-time notification listener
  useEffect(() => {
    if (!isAuthenticated) return;

    const unsub = notificationWS.onMessage("notification", (data) => {
      const newNotification: NotificationItem = {
        id: data.id ?? Date.now(),
        type: data.notification_type ?? data.type ?? "system",
        title: data.title ?? "",
        content: data.content ?? data.body ?? "",
        is_read: false,
        create_time: data.create_time ?? Math.floor(Date.now() / 1000),
        link: data.link,
      };
      setNotifications((prev) => [newNotification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return unsub;
  }, [isAuthenticated]);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

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
      fetchUnreadCount();
    }
  };

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    selfUpdating.current = true;
    markAllRead(notifications.map((n) => n.id));
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    selfUpdating.current = false;
    // Fire-and-forget API call (don't block UI)
    NotificationService.markAllAsRead().catch(() => {});
  };

  const handleItemClick = (item: NotificationItem) => {
    if (!item.is_read) {
      selfUpdating.current = true;
      markRead(item.id);
      setNotifications((prev) => prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      selfUpdating.current = false;
      NotificationService.markAsRead(item.id).catch(() => {});
    }
    if (item.link) {
      setOpen(false);
      navigate(item.link);
    }
  };

  const handleViewAll = () => {
    setOpen(false);
    navigate("/personal?tab=notifications");
  };

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
            ) : notifications.length === 0 ? (
              <div className={styles.empty}>
                <FaBellSlash className={styles.emptyIcon} />
                <span className={styles.emptyText}>暂无通知</span>
              </div>
            ) : (
              notifications.map((item) => {
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
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Notification;
