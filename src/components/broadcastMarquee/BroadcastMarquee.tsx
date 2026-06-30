import React, { useMemo, useState } from "react";
import { FaTimes } from "react-icons/fa";
import { getMockBroadcastMarqueeItems } from "@/utils/broadcastMock";
import styles from "./BroadcastMarquee.module.css";

const BroadcastMarquee: React.FC = () => {
  const broadcasts = useMemo(() => getMockBroadcastMarqueeItems(), []);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => new Set());

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
