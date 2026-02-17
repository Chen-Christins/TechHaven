import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaChevronLeft, FaChevronRight, FaAngleDoubleLeft, FaAngleDoubleRight, FaCalendarAlt, FaUser, FaEye } from "react-icons/fa";
import ArticleService from "../../services/articleService";
import styles from "./ArticleList.module.css";
import { formatToChinaTime } from "../../utils/utils";
import type { ArticleListItem } from "../../types/index";

const STATE_MAP: Record<number, string> = {
  1: "reviewing",
  2: "published",
  3: "unallowed",
  4: "private",
};

const ArticleList: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const itemsPerPage = 6;
  const [totalArticles, setTotalArticles] = useState(0);
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const navigate = useNavigate();

  // 切换页码
  const handlePageChange = (page: number) => {
    setSearchParams({ page: String(page) });
    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const res = await ArticleService.listArticlesByUserIdPages({
          page_from: currentPage,
          page_size: itemsPerPage,
          state: 2,
        });

        setTotalArticles(res.total);
        setArticles(
          res.list.map(
            (item) =>
              ({
                id: item.id,
                title: item.title,
                author: item.author,
                summary: item.summary,
                state: STATE_MAP[item.state],
                type: item.type === 1 ? "原创" : "转载",
                publish_time: item.publish_time ? formatToChinaTime(item.publish_time) : "暂未发布",
                views: 0, // 后续可通过详情接口补全
                praise: 0, // 后续可通过详情接口补全
                favorites: 0, // 后续可通过详情接口补全
                category: "未分类", // 后续可通过详情接口补全
                tags: [], // 后续可通过详情接口补全
              }) as ArticleListItem,
          ),
        );
      } catch (err) {
        console.error("获取文章列表失败:", err);
        setArticles([]);
      }
    };
    fetchArticles();
  }, [currentPage]);

  const totalPages = Math.ceil(totalArticles / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + articles.length;

  // 生成页码数组
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 6;
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, currentPage - 2);
      const end = Math.min(totalPages, start + maxVisiblePages - 1);
      if (start > 1) {
        pages.push(1);
        if (start > 2) pages.push("...");
      }
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (end < totalPages) {
        if (end < totalPages - 1) pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className={styles.articleList}>
      <h2 className={styles.title}>最新文章</h2>
      <div className={styles.articles}>
        {articles.length === 0 ? (
          <></>
        ) : (
          articles.map((article, _index) => {
            return (
              <div key={article.id} className={styles.articleItem}>
                <div className={styles.articleMeta}>
                  <span>
                    <div className={styles.typeBadge}>{article.type}</div>
                  </span>
                  <span>
                    <FaCalendarAlt /> {article.publish_time}
                  </span>
                  <span>
                    <FaUser /> {article.author}
                  </span>
                  <span>
                    <FaEye /> {article.views ?? 0}
                  </span>
                </div>
                <h3 className={styles.articleTitle}>{article.title || "无标题"}</h3>
                <p className={styles.articleSummary}>{article.summary + "..." || "无摘要"}</p>
                <div
                  className={styles.readMoreBtn}
                  onClick={() => {
                    navigate(`/article/${article.id}`);
                  }}
                >
                  阅读全文 →
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <div className={styles.paginationInfo}>
            显示 {startIndex + 1} - {Math.min(endIndex, totalArticles)} 条， 共 {totalArticles} 篇文章
          </div>
          <div className={styles.paginationControls}>
            <button className={styles.paginationButton} onClick={() => handlePageChange(1)} disabled={currentPage === 1}>
              <FaAngleDoubleLeft />
            </button>
            <button
              className={styles.paginationButton}
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <FaChevronLeft />
            </button>

            {getPageNumbers().map((page, index) => (
              <React.Fragment key={index}>
                {page === "..." ? (
                  <span className={styles.paginationEllipsis}>...</span>
                ) : (
                  <button
                    className={`${styles.paginationButton} ${currentPage === page ? styles.active : ""}`}
                    onClick={() => handlePageChange(page as number)}
                  >
                    {page}
                  </button>
                )}
              </React.Fragment>
            ))}

            <button
              className={styles.paginationButton}
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              <FaChevronRight />
            </button>
            <button
              className={styles.paginationButton}
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
            >
              <FaAngleDoubleRight />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticleList;
