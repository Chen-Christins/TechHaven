import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import ArticleView from "./ArticleView";
import ArticleService from "../../services/articleService";
import Navbar from "../../components/navbar/Navbar";
import Footer from "../../components/footer/Footer";
import BackToTop from "../../components/backToTop/BackToTop";
import { formatToChinaTime } from "../../utils/utils";
import { decodeId } from "../../utils/hashId";
import { useAuth } from "../../contexts/AuthContext";
import AuthRequired from "../../components/auth/AuthRequired";
import ArticleErrorView from "../../components/articleView/ArticleErrorView";
import SkeletonArticleView from "../../components/articleView/SkeletonArticleView";

const ArticleViewPage: React.FC = () => {
  const { id: encodedId } = useParams<{ id: string }>();
  const id = encodedId ? decodeId(encodedId, "article") : null;
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [article, setArticle] = useState<any>(null);
  const [showSkeleton, setShowSkeleton] = useState<boolean>(false);

  useEffect(() => {
    // 只有在认证加载完成且用户已认证时才加载文章
    if (!authLoading && isAuthenticated) {
      if (!id) {
        setError("文章ID缺失");
        return;
      }

      const fetch = async () => {
        setLoading(true);

        // 设置一个定时器，在加载持续一段时间后才显示骨架屏
        const skeletonTimer = setTimeout(() => {
          setShowSkeleton(true);
        }, 300); // 300ms 后才显示骨架屏，避免快速加载/失败时的闪烁

        let hasError = false; // 使用局部变量来追踪是否有错误

        try {
          const res = await ArticleService.getArticleDetails({ id, type: 0 });
          setArticle(res);
          // 上报阅读（10分钟内同用户不重复计数）
          ArticleService.viewArticle(id)
            .then((viewRes) => {
              setArticle((prev: any) => (prev ? { ...prev, views: viewRes.views } : prev));
            })
            .catch((err: any) => {
              console.error("阅读计数上报失败:", err?.message || err);
            });
          // 成功获取数据后，不立即隐藏骨架屏
          // 让渲染逻辑处理从骨架屏到内容的过渡
        } catch (err: any) {
          console.error("获取文章失败", err);
          setError(err?.message || "获取文章失败");
          hasError = true;
        } finally {
          clearTimeout(skeletonTimer); // 清除定时器
          setLoading(false);
          // 仅在出错时隐藏骨架屏
          if (hasError) {
            setShowSkeleton(false);
          }
        }
      };

      fetch();
    }
  }, [id, authLoading, isAuthenticated]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <div style={{ flex: 1 }}>
        <AuthRequired>
          {authLoading ? (
            <div style={{ padding: "2rem", textAlign: "center" }}>正在加载认证状态...</div>
          ) : (
            <>
              {showSkeleton &&
                !article &&
                !error && ( // 只在没有文章和错误时显示骨架屏
                  <SkeletonArticleView />
                )}

              {!loading && error && <ArticleErrorView error={error} />}

              {!loading && !error && article && (
                <ArticleView
                  title={article.title}
                  content={article.content}
                  author={article.author}
                  authorAvatar={article.author_avatar}
                  authorId={article.user_id}
                  articleId={article.id}
                  authorStats={{
                    articles: article.author_article_count ?? 0,
                    followers: article.author_follower_count ?? 0,
                    likes: article.author_praise_count ?? 0,
                  }}
                  views={article.views ?? 0}
                  praises={article.praise ?? article.praises ?? 0}
                  update_time={formatToChinaTime(Number(article.update_time))}
                  pushlish_time={article.publish_time ? formatToChinaTime(Number(article.publish_time)) : "暂未发布"}
                  categories={article.categorys}
                  labels={article.labels}
                  readingTime={article.content ? Math.max(1, Math.ceil(article.content.length / 500)) : undefined}
                />
              )}
            </>
          )}
        </AuthRequired>
      </div>
      <Footer startYear={2025} />
      <BackToTop />
    </div>
  );
};

export default ArticleViewPage;
