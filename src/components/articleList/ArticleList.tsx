import React from 'react';
import type { Article } from '../../types/index';
import styles from './ArticleList.module.css';

// 模拟文章数据
const mockArticles: Article[] = [
  {
    id: 1,
    title: "React 18 新特性详解",
    summary: "本文详细介绍React 18的自动批处理、并发渲染、Transitions等核心新特性，帮助开发者快速上手。",
    date: "2024-05-20",
    category: "前端框架",
    tags: ["React", "TypeScript", "前端"]
  },
  {
    id: 2,
    title: "TypeScript 类型编程实战",
    summary: "从基础到进阶，讲解TypeScript泛型、条件类型、工具类型的实战用法，解决实际开发中的类型问题。",
    date: "2024-05-15",
    category: "TypeScript",
    tags: ["TypeScript", "类型编程", "前端工程化"]
  },
  {
    id: 3,
    title: "CSS Grid 布局完全指南",
    summary: "全面解析CSS Grid布局的语法、属性和实战案例，掌握复杂页面的高效布局方案。",
    date: "2024-05-10",
    category: "CSS",
    tags: ["CSS", "Grid", "布局"]
  }
];

const ArticleList: React.FC = () => {
  return (
    <div className={styles.articleList}>
      <h2 className={styles.title}>最新文章</h2>
      <div className={styles.articles}>
        {mockArticles.map(article => (
          <div key={article.id} className={styles.articleItem}>
            <h3 className={styles.articleTitle}>{article.title}</h3>
            <div className={styles.articleMeta}>
              <span>日期：{article.date}</span>
              <span>分类：{article.category}</span>
            </div>
            <p className={styles.articleSummary}>{article.summary}</p>
            <a 
              href={`/article/${article.id}`} 
              className={styles.readMoreBtn}
            >
              阅读全文 →
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ArticleList;