import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    FaChevronLeft,
    FaChevronRight,
    FaAngleDoubleLeft,
    FaAngleDoubleRight
} from 'react-icons/fa';
import type { Article } from '../../types/index';
import styles from './ArticleList.module.css';

// 模拟文章数据
const mockArticles: Article[] = [
    {
        id: 1,
        author: "admin",
        title: "React 18 新特性详解",
        summary: "本文详细介绍React 18的自动批处理、并发渲染、Transitions等核心新特性，帮助开发者快速上手。",
        date: "2024-05-20",
        category: "前端框架",
        tags: ["React", "TypeScript", "前端"],
        views: 0,
        praises: 0,
        publishDate: undefined,
        excerpt: undefined,
        readTime: undefined,
        likes: undefined,
        publish_time: '',
        comments: 0
    },
    {
        id: 2,
        author: "admin",
        title: "TypeScript 类型编程实战",
        summary: "从基础到进阶，讲解TypeScript泛型、条件类型、工具类型的实战用法，解决实际开发中的类型问题。",
        date: "2024-05-15",
        category: "TypeScript",
        tags: ["TypeScript", "类型编程", "前端工程化"],
        views: 0,
        praises: 0,
        publishDate: undefined,
        excerpt: undefined,
        readTime: undefined,
        likes: undefined,
        publish_time: '',
        comments: 0
    },
    {
        id: 3,
        author: "admin",
        title: "CSS Grid 布局完全指南",
        summary: "全面解析CSS Grid布局的语法、属性和实战案例，掌握复杂页面的高效布局方案。",
        date: "2024-05-10",
        category: "CSS",
        tags: ["CSS", "Grid", "布局"],
        views: 0,
        praises: 0,
        publishDate: undefined,
        excerpt: undefined,
        readTime: undefined,
        likes: undefined,
        publish_time: '',
        comments: 0
    },
    {
        id: 4,
        author: "admin",
        title: "CSS Grid 布局完全指南",
        summary: "全面解析CSS Grid布局的语法、属性和实战案例，掌握复杂页面的高效布局方案。",
        date: "2024-05-10",
        category: "CSS",
        tags: ["CSS", "Grid", "布局"],
        views: 0,
        praises: 0,
        publishDate: undefined,
        excerpt: undefined,
        readTime: undefined,
        likes: undefined,
        publish_time: '',
        comments: 0
    },
    {
        id: 5,
        author: "admin",
        title: "CSS Grid 布局完全指南",
        summary: "全面解析CSS Grid布局的语法、属性和实战案例，掌握复杂页面的高效布局方案。",
        date: "2024-05-10",
        category: "CSS",
        tags: ["CSS", "Grid", "布局"],
        views: 0,
        praises: 0,
        publishDate: undefined,
        excerpt: undefined,
        readTime: undefined,
        likes: undefined,
        publish_time: '',
        comments: 0
    },
    {
        id: 6,
        author: "admin",
        title: "CSS Grid 布局完全指南",
        summary: "全面解析CSS Grid布局的语法、属性和实战案例，掌握复杂页面的高效布局方案。",
        date: "2024-05-10",
        category: "CSS",
        tags: ["CSS", "Grid", "布局"],
        views: 0,
        praises: 0,
        publishDate: undefined,
        excerpt: undefined,
        readTime: undefined,
        likes: undefined,
        publish_time: '',
        comments: 0
    },
    {
        id: 7,
        author: "admin",
        title: "CSS Grid 布局完全指南",
        summary: "全面解析CSS Grid布局的语法、属性和实战案例，掌握复杂页面的高效布局方案。",
        date: "2024-05-10",
        category: "CSS",
        tags: ["CSS", "Grid", "布局"],
        views: 0,
        praises: 0,
        publishDate: undefined,
        excerpt: undefined,
        readTime: undefined,
        likes: undefined,
        publish_time: '',
        comments: 0
    },
    {
        id: 8,
        author: "admin",
        title: "Vue 3 Composition API 实战",
        summary: "深入讲解Vue 3的Composition API，包括响应式系统、生命周期钩子、自定义组合等高级特性。",
        date: "2024-05-05",
        category: "Vue",
        tags: ["Vue", "Composition API", "前端框架"],
        views: 0,
        praises: 0,
        publishDate: undefined,
        excerpt: undefined,
        readTime: undefined,
        likes: undefined,
        publish_time: '',
        comments: 0
    },
    {
        id: 9,
        author: "admin",
        title: "前端性能优化最佳实践",
        summary: "从网络优化、资源压缩、代码分割等方面，全面介绍前端性能优化的实用技巧和工具。",
        date: "2024-04-30",
        category: "性能优化",
        tags: ["性能", "优化", "最佳实践"],
        views: 0,
        praises: 0,
        publishDate: undefined,
        excerpt: undefined,
        readTime: undefined,
        likes: undefined,
        publish_time: '',
        comments: 0
    },
    {
        id: 10,
        author: "admin",
        title: "Node.js 微服务架构设计",
        summary: "探讨基于Node.js的微服务架构设计原则、服务拆分策略以及常见的技术选型问题。",
        date: "2024-04-25",
        category: "后端技术",
        tags: ["Node.js", "微服务", "架构"],
        views: 0,
        praises: 0,
        publishDate: undefined,
        excerpt: undefined,
        readTime: undefined,
        likes: undefined,
        publish_time: '',
        comments: 0
    },
    {
        id: 11,
        author: "admin",
        title: "Webpack 5 模块联邦详解",
        summary: "详细介绍Webpack 5的Module Federation特性，实现微前端架构中的模块共享和独立部署。",
        date: "2024-04-20",
        category: "工程化",
        tags: ["Webpack", "微前端", "模块联邦"],
        views: 0,
        praises: 0,
        publishDate: undefined,
        excerpt: undefined,
        readTime: undefined,
        likes: undefined,
        publish_time: '',
        comments: 0
    },
    {
        id: 12,
        author: "admin",
        title: "移动端适配方案对比",
        summary: "对比分析rem、vw、postcss-pxtorem等移动端适配方案的优缺点，选择最适合项目的方案。",
        date: "2024-04-15",
        category: "移动开发",
        tags: ["移动端", "适配", "CSS"],
        views: 0,
        praises: 0,
        publishDate: undefined,
        excerpt: undefined,
        readTime: undefined,
        likes: undefined,
        publish_time: '',
        comments: 0
    },
];

const ArticleList: React.FC = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    // 分页计算
    const totalPages = Math.ceil(mockArticles.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentArticles = mockArticles.slice(startIndex, endIndex);

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
                {currentArticles.map(article => (
                    <div key={article.id} className={styles.articleItem}>
                        <h3 className={styles.articleTitle}>{article.title}</h3>
                        <div className={styles.articleMeta}>
                            <span>日期：{article.date}</span>
                            <span>作者：{article.author}</span>
                            <span>阅读量：{article.views}</span>
                        </div>
                        <p className={styles.articleSummary}>{article.summary}</p>
                        <Link
                            to={`/article/${article.id}`}
                            className={styles.readMoreBtn}
                        >
                            阅读全文 →
                        </Link>
                    </div>
                ))}
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
                <div className={styles.pagination}>
                    <div className={styles.paginationInfo}>
                        显示 {startIndex + 1} - {Math.min(endIndex, mockArticles.length)} 条，
                        共 {mockArticles.length} 篇文章
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