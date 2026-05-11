import React, { useState, useEffect, useRef } from "react";
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

interface ArticleListProps {
  labelId?: string | number;
  labelName?: string;
  categoryId?: string | number;
  categoryName?: string;
}

const ArticleList: React.FC<ArticleListProps> = ({ labelId, labelName, categoryId, categoryName }) => {
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

  const prevLabelId = useRef<string | number | undefined>(labelId);
  const prevCategoryId = useRef<string | number | undefined>(categoryId);

  useEffect(() => {
    // 当 labelId 或 categoryId 变化时，重置到第 1 页再请求
    const labelChanged = prevLabelId.current !== labelId;
    const categoryChanged = prevCategoryId.current !== categoryId;

    if (labelChanged || categoryChanged) {
      prevLabelId.current = labelId;
      prevCategoryId.current = categoryId;
      if (currentPage !== 1) {
        setSearchParams({ page: "1" });
        return; // 触发 re-render 后 currentPage=1 再 fetch
      }
      // 已经在第 1 页，直接走下面的 fetch 逻辑
    }

    let cancelled = false;

    const fetchArticles = async () => {
      try {
        let res: {
          total: number;
          list: Array<{
            id: string | number;
            title: string;
            author: string;
            summary: string;
            state: number;
            type: number;
            publish_time: number;
          }>;
        };

        if (labelId) {
          res = await ArticleService.listByLabel({
            label_id: labelId,
            page_from: currentPage,
            page_size: itemsPerPage,
          });
        } else if (categoryId) {
          res = await ArticleService.listByCategory({
            category_id: categoryId,
            page_from: currentPage,
            page_size: itemsPerPage,
          });
        } else {
          res = await ArticleService.listArticlesByUserIdPages({
            page_from: currentPage,
            page_size: itemsPerPage,
            state: 2,
          });
        }

        if (cancelled) return;

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
                views: 0,
                praise: 0,
                favorites: 0,
                category: "未分类",
                tags: [],
              }) as ArticleListItem,
          ),
        );
      } catch (err) {
        if (cancelled) return;
        console.error("获取文章列表失败:", err);
        setArticles([]);
      }
    };

    fetchArticles();

    return () => {
      cancelled = true;
    };
  }, [currentPage, labelId, categoryId]);

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
      <h2 className={styles.title}>{labelName ? `标签：${labelName}` : categoryName ? `分类：${categoryName}` : "最新文章"}</h2>
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
      {totalArticles > 0 && (
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
