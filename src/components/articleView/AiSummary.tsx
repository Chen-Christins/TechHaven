import React from "react";
import ReactMarkdown from "react-markdown";
import { Sparkles, RotateCw, AlertCircle } from "lucide-react";
import styles from "./AiSummary.module.css";
import useAiSummary from "../../hooks/useAiSummary";

interface AiSummaryProps {
  /** 文章 ID，用于请求后端 AI 总结 */
  articleId?: string | number;
}

const AiSummary: React.FC<AiSummaryProps> = ({ articleId }) => {
  const { text, isStreaming, isCompleted, error, start, reset } = useAiSummary(articleId);

  const handleGenerate = () => {
    start();
  };

  const handleRegenerate = () => {
    reset();
    // 延迟一帧再启动，让 reset 的状态先渲染，保证动画重新触发
    requestAnimationFrame(() => {
      start();
    });
  };

  return (
    <div className={styles.container}>
      {/* 头部 */}
      <div className={styles.header}>
        <div className={styles.iconWrapper}>
          <Sparkles className={styles.aiIcon} />
        </div>
        <span className={styles.title}>AI 智能总结</span>
        {!isStreaming && !isCompleted && !error && (
          <button className={styles.generateBtn} onClick={handleGenerate} disabled={articleId == null}>
            <Sparkles size={14} />
            生成总结
          </button>
        )}
        {isStreaming && (
          <button className={styles.generateBtn} disabled>
            <span className={styles.spinner} />
            生成中...
          </button>
        )}
        {isCompleted && !error && (
          <button className={styles.generateBtn} onClick={handleRegenerate}>
            <RotateCw size={14} />
            重新生成
          </button>
        )}
        {error && (
          <button className={styles.generateBtn} onClick={handleRegenerate}>
            <RotateCw size={14} />
            重试
          </button>
        )}
      </div>

      {/* 内容区域 */}
      {error ? (
        <div className={styles.errorContent}>
          <AlertCircle size={14} className={styles.errorIcon} />
          <span>{error}</span>
        </div>
      ) : text ? (
        <div className={styles.content}>
          <ReactMarkdown>{text}</ReactMarkdown>
          {isStreaming && <span className={styles.cursor} />}
        </div>
      ) : isStreaming ? (
        <div className={styles.contentPlaceholder}>AI 正在生成总结...</div>
      ) : (
        <div className={styles.contentPlaceholder}>
          {articleId == null ? "文章数据加载中，请稍候..." : "点击上方按钮，让 AI 帮你总结这篇文章的核心内容"}
        </div>
      )}

      {/* 完成后的底部免责声明 */}
      {isCompleted && !error && (
        <div className={styles.footer}>
          <span className={styles.disclaimer}>内容由 AI 生成，仅供参考</span>
        </div>
      )}
    </div>
  );
};

export default AiSummary;
