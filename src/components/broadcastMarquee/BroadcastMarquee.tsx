import React, { useState, useEffect, useRef } from "react";
import { FaTimes } from "react-icons/fa";
import NotificationService from "@/services/notificationService";
import styles from "./BroadcastMarquee.module.css";

interface BroadcastItem {
  id: number;
  title: string;
  content: string;
  level: string;
}

const POLL_INTERVAL = 30_000;

const BroadcastMarquee: React.FC = () => {
  const [broadcasts, setBroadcasts] = useState<BroadcastItem[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(() => new Set());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchBroadcasts = async () => {
    try {
      const list = await NotificationService.getBroadcasts();
      setBroadcasts(list);
    } catch {
      // 静默失败，轮询继续
    }
  };

  useEffect(() => {
    fetchBroadcasts();
    timerRef.current = setInterval(fetchBroadcasts, POLL_INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const activeBroadcasts = broadcasts.filter((item) => !dismissedIds.has(item.id));

  if (activeBroadcasts.length === 0) {
    return null;
  }

  const topLevel = activeBroadcasts.some((item) => item.level === "danger")
    ? "danger"
    : activeBroadcasts.some((item) => item.level === "warning")
      ? "warning"
      : "info";

  const messages = [...activeBroadcasts, ...activeBroadcasts];

  const handleDismiss = () => {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      activeBroadcasts.forEach((item) => next.add(item.id));
      return next;
    });
  };

  return (
    <div className={`${styles.broadcastMarquee} ${styles[topLevel]}`} role="status" aria-live="polite">
      <div className={styles.label}>
        <span className={styles.statusDot} />
        公告
      </div>
      <div className={styles.viewport}>
        <div className={styles.track}>
          {messages.map((item, index) => (
            <span className={styles.message} key={`${item.id}-${index}`}>
              <span className={styles.title}>{item.title}</span>
              <span className={styles.separator} />
              <span>{item.content}</span>
            </span>
          ))}
        </div>
      </div>
      <button className={styles.closeButton} type="button" onClick={handleDismiss} aria-label="关闭广播">
        <FaTimes size={12} />
      </button>
    </div>
  );
};

export default BroadcastMarquee;
