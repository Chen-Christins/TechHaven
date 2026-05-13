import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBellSlash,
  FaComment,
  FaHeart,
  FaUserPlus,
  FaBullhorn,
  FaNewspaper,
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
    content: "这篇关于 React 状态管理的文章写得太好了，尤其是 useReducer 和 Context 结合使用的部分！",
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
    content: "《深入理解 Vite 插件机制》发布了新章节「插件钩子执行顺序详解」",
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
  {
    id: 13,
    type: "system",
    title: "账号安全提醒",
    content: "检测到你的账号在一台新设备上登录，如非本人操作请及时修改密码。登录地点：广东深圳，登录时间：2026-05-10 14:30",
    is_read: true,
    create_time: NOW - 1209600,
  },
  {
    id: 14,
    type: "follow",
    title: "郑九 关注了你",
    content: "郑九 开始关注你",
    is_read: true,
    create_time: NOW - 2592000,
  },
  {
    id: 15,
    type: "like",
    title: "你的文章获得了 32 个赞",
    content: "《前端工程化实践》获得了 32 个赞",
    is_read: true,
    create_time: NOW - 5184000,
  },
];

const TYPE_ICON_MAP: Record<string, { icon: React.ReactNode; className: string }> = {
  system: { icon: <FaBullhorn />, className: styles.notifIconSystem },
  comment: { icon: <FaComment />, className: styles.notifIconComment },
  like: { icon: <FaHeart />, className: styles.notifIconLike },
  follow: { icon: <FaUserPlus />, className: styles.notifIconFollow },
  article: { icon: <FaNewspaper />, className: styles.notifIconArticle },
};

const TYPE_OPTIONS: SelectOption[] = [
  { id: "all", name: "全部类型", color: "#6c757d" },
  { id: "system", name: "系统通知", color: "#3b82f6" },
  { id: "comment", name: "评论", color: "#10b981" },
  { id: "like", name: "点赞", color: "#ef4444" },
  { id: "follow", name: "关注", color: "#8b5cf6" },
  { id: "article", name: "文章", color: "#f59e0b" },
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
    const enabledTypes = getEnabledTypes();

    if (MOCK_ENABLED) {
      let filtered = MOCK_NOTIFICATIONS.filter((n) => enabledTypes.includes(n.type as NotifType));
      if (typeFilter !== "all") {
        filtered = filtered.filter((n) => n.type === typeFilter);
      }
      setTotal(filtered.length);
      const start = (currentPage - 1) * PAGE_SIZE;
      const paged = filtered.slice(start, start + PAGE_SIZE);
      setNotifications(paged.map((n) => ({ ...n, is_read: n.is_read || isRead(n.id) })));
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const offset = (currentPage - 1) * PAGE_SIZE;
      const data = await NotificationService.getNotifications({
        offset,
        size: PAGE_SIZE,
        type: typeFilter !== "all" ? typeFilter : undefined,
      });
      // Apply settings filter client-side
      let filtered = data.list;
      const allEnabled = enabledTypes.length === 5;
      if (!allEnabled) {
        filtered = data.list.filter((n) => enabledTypes.includes(n.type as NotifType));
      }
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
    if (MOCK_ENABLED) {
      markAllRead(MOCK_NOTIFICATIONS.map((n) => n.id));
    } else {
      NotificationService.markAllAsRead().catch(() => {});
    }
    markAllRead(notifications.map((n) => n.id));
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleItemClick = (item: NotificationItem) => {
    if (!item.is_read) {
      markRead(item.id);
      setNotifications((prev) => prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n)));
      if (!MOCK_ENABLED) {
        NotificationService.markAsRead(item.id).catch(() => {});
      }
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
    { key: "like", label: "点赞通知" },
    { key: "follow", label: "关注通知" },
    { key: "article", label: "文章通知" },
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
          <CustomSelect
            name="类型"
            options={TYPE_OPTIONS}
            value={selectedType}
            onChange={handleTypeChange}
            hideBadge={true}
          />
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
            <button
              className={styles.paginationButton}
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
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
                <Switch
                  checked={settings[key]}
                  size="small"
                  onChange={(checked) => handleSettingToggle(key, checked)}
                />
              </div>
            );
          })}
        </div>
      </Modal>
    </div>
  );
};

export default NotificationsTab;
