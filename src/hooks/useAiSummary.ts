import { useState, useRef, useCallback, useEffect } from "react";
import http from "../utils/http";

/**
 * AI 总结 Hook
 *
 * POST /api/v1/article/ai-summary 获取总结全文，
 * 前端模拟打字机流式效果逐字渲染。
 */
function useAiSummary(articleId?: string | number) {
  const [text, setText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const indexRef = useRef(0);
  const fullTextRef = useRef("");

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const cleanup = useCallback(() => {
    stopTimer();
    indexRef.current = 0;
    fullTextRef.current = "";
  }, [stopTimer]);

  const start = useCallback(() => {
    if (articleId == null) return;

    cleanup();
    setText("");
    setError(null);
    setIsStreaming(true);
    setIsCompleted(false);

    const formData = new URLSearchParams();
    formData.append("article_id", String(articleId));

    http
      .post<{ summary: string }>("/article/ai-summary", formData.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      })
      .then((res) => {
        const summary = res.data?.summary || "";

        if (!summary) {
          setError("AI 未返回总结内容");
          setIsStreaming(false);
          return;
        }

        fullTextRef.current = summary;
        indexRef.current = 0;

        // 启动打字机效果：每 30~80ms 吐出 1~3 个字符
        timerRef.current = setInterval(() => {
          const chunkSize = Math.floor(Math.random() * 3) + 1;
          const nextIndex = Math.min(indexRef.current + chunkSize, fullTextRef.current.length);

          setText(fullTextRef.current.slice(0, nextIndex));
          indexRef.current = nextIndex;

          if (nextIndex >= fullTextRef.current.length) {
            stopTimer();
            setIsStreaming(false);
            setIsCompleted(true);
          }
        }, 30 + Math.random() * 50);
      })
      .catch((err: any) => {
        setError(err?.msg || err?.message || "网络错误，请稍后重试");
        setIsStreaming(false);
      });
  }, [articleId, cleanup, stopTimer]);

  const reset = useCallback(() => {
    cleanup();
    setText("");
    setError(null);
    setIsStreaming(false);
    setIsCompleted(false);
  }, [cleanup]);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return {
    text,
    isStreaming,
    isCompleted,
    error,
    start,
    reset,
  };
}

export default useAiSummary;
