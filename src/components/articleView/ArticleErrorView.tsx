import React from "react";
import { useNavigate } from "react-router-dom";
import { FaExclamationTriangle, FaHome, FaArrowLeft } from "react-icons/fa";
import styles from "./ArticleErrorView.module.css";

interface ArticleErrorViewProps {
  error: string | null;
}

const ArticleErrorView: React.FC<ArticleErrorViewProps> = ({ error }) => {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <div className={styles.icon}>
        <FaExclamationTriangle />
      </div>
      <h2 className={styles.title}>无法加载文章</h2>
      <p className={styles.message}>{error || "发生未知错误"}</p>
      <div className={styles.actions}>
        <button onClick={() => navigate(-1)} className={styles.backBtn}>
          <FaArrowLeft /> 返回上一页
        </button>
        <button onClick={() => navigate("/")} className={styles.homeBtn}>
          <FaHome /> 返回首页
        </button>
      </div>
    </div>
  );
};

export default ArticleErrorView;
