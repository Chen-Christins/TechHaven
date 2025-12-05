import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaChevronLeft,
    FaChevronRight,
    FaAngleDoubleLeft,
    FaAngleDoubleRight
} from 'react-icons/fa';
import type { Article } from '../../types/index';
import ArticleService from '../../services/articleService';
import styles from './ArticleList.module.css';
import { formatToChinaTime } from '../../utils/utils';

const ArticleList: React.FC = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;
    const [totalArticles, setTotalArticles] = useState(0);
    const [articleIds, setArticleIds] = useState<(string | number)[]>([]);
    const [articles, setArticles] = useState<Article[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchIds = async () => {
            try {
                const res = await ArticleService.listArticlesByUserIdPages({
                    // user_id: 1,
                    page_from: currentPage,
                    page_size: itemsPerPage,
                    state: 2
                });
                // // console.log('获取文章ID列表成功:', res.total, res.ids);
                // // console.log('准备设置 articleIds:', res.ids);
                setTotalArticles(res.total);
                setArticleIds(res.ids);
            } catch (err) {
                console.error('获取文章ID列表失败:', err);
                setArticleIds([]);
            }
        };
        fetchIds();
    }, [currentPage]);

    // 根据 id 列表获取文章详情
    useEffect(() => {
        const fetchDetails = async () => {
            // // console.log('fetchDetails 开始执行 - articleIds:', articleIds);

            if (!Array.isArray(articleIds) || articleIds.length === 0) {
                // // console.log('articleIds 为空，清空文章列表');
                setArticles([]);
                return;
            }

            try {
                const detailsList = await Promise.all(
                    articleIds.map(id => ArticleService.getArticleDetails({ id, type: 0 }))
                );
                setArticles(detailsList);
            } catch (err) {
                console.error('fetchDetails 异常:', err);
                setArticles([]);
            }
        };

        fetchDetails();
    }, [articleIds]);

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
                if (start > 2) pages.push('...');
            }
            for (let i = start; i <= end; i++) {
                pages.push(i);
            }
            if (end < totalPages) {
                if (end < totalPages - 1) pages.push('...');
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
                                <h3 className={styles.articleTitle}>{article.title || '无标题'}</h3>
                                <div className={styles.articleMeta}>
                                    <span>日期：{formatToChinaTime(Number(article.publish_time))}</span>
                                    <span>作者：{article.author}</span>
                                    <span>阅读量：{article.views ?? 0}</span>
                                </div>
                                <p className={styles.articleSummary}>{article.content.substring(0, 80) || '无摘要'}</p>
                                <div
                                    className={styles.readMoreBtn}
                                    onClick={() => { navigate(`/article/${article.id}`)}}
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
                        显示 {startIndex + 1} - {Math.min(endIndex, totalArticles)} 条，
                        共 {totalArticles} 篇文章
                    </div>
                    <div className={styles.paginationControls}>
                        <button
                            className={styles.paginationButton}
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                        >
                            <FaAngleDoubleLeft />
                        </button>
                        <button
                            className={styles.paginationButton}
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                        >
                            <FaChevronLeft />
                        </button>

                        {getPageNumbers().map((page, index) => (
                            <React.Fragment key={index}>
                                {page === '...' ? (
                                    <span className={styles.paginationEllipsis}>...</span>
                                ) : (
                                    <button
                                        className={`${styles.paginationButton} ${currentPage === page ? styles.active : ''}`}
                                        onClick={() => setCurrentPage(page as number)}
                                    >
                                        {page}
                                    </button>
                                )}
                            </React.Fragment>
                        ))}

                        <button
                            className={styles.paginationButton}
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                        >
                            <FaChevronRight />
                        </button>
                        <button
                            className={styles.paginationButton}
                            onClick={() => setCurrentPage(totalPages)}
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