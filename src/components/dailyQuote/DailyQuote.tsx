import React, { useState, useEffect, useCallback } from "react";
import { FaQuoteLeft, FaSyncAlt } from "react-icons/fa";
import { getDailyQuote, type DailyQuote as DailyQuoteData } from "@/services/quoteService";
import styles from "./DailyQuote.module.css";

const STORAGE_KEY = "dailyQuote";
const FALLBACK: DailyQuoteData = {
  content: "路漫漫其修远兮，吾将上下而求索。",
  source: "离骚",
  author: "屈原",
};

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const DailyQuote: React.FC = () => {
  const [quote, setQuote] = useState<DailyQuoteData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadQuote = useCallback((force = false) => {
    const key = todayKey();

    if (!force) {
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached) as { key: string; data: DailyQuoteData };
          if (parsed.key === key) {
            setQuote(parsed.data);
            setLoading(false);
            return;
          }
        }
      } catch {
        /* 忽略缓存解析错误 */
      }
    }

    setLoading(true);
    getDailyQuote()
      .then((data) => {
        setQuote(data);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ key, data }));
        } catch {
          /* 忽略写入错误 */
        }
      })
      .catch((err: any) => {
        console.error("获取每日名言失败:", err?.message || err);
        setQuote(FALLBACK);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadQuote(false);
  }, [loadQuote]);

  const handleRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    getDailyQuote()
      .then((data) => setQuote(data))
      .catch((err: any) => {
        console.error("刷新名言失败:", err?.message || err);
      })
      .finally(() => setRefreshing(false));
  };

  return (
    <div className={styles.dailyQuote}>
      <h3 className={styles.panelTitle}>
        <FaQuoteLeft className={styles.titleIcon} /> 每日一言
        <button
          type="button"
          className={styles.refreshBtn}
          onClick={handleRefresh}
          disabled={refreshing || loading}
          title="换一条"
          aria-label="换一条"
        >
          <FaSyncAlt className={refreshing ? styles.spinning : ""} />
        </button>
      </h3>

      {loading ? (
        <div className={styles.loading}>名言加载中…</div>
      ) : quote ? (
        <div className={styles.quoteBox}>
          <p className={styles.content}>{quote.content}</p>
          {(quote.author || quote.source) && (
            <p className={styles.meta}>
              —— {quote.author || "佚名"}
              {quote.source ? `《${quote.source}》` : ""}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default DailyQuote;
