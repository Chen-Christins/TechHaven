import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ArticleView from './ArticleView';
import ArticleService from '../../services/articleService';
import Navbar from '../../components/navbar/Navbar';
import Footer from '../../components/footer/Footer';
import BackToTop from '../../components/backToTop/BackToTop';
import { formatToChinaTime } from '../../utils/utils';

const ArticleViewPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [article, setArticle] = useState<any>(null);

    useEffect(() => {
        const fetch = async () => {
            if (!id) {
                setError('文章ID缺失');
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const res = await ArticleService.getArticleDetails({ id, type: 0 });
                setArticle(res);
            } catch (err: any) {
                console.error('获取文章失败', err);
                setError(err?.message || '获取文章失败');
            } finally {
                setLoading(false);
            }
        };

        fetch();
    }, [id]);

    return (
        <div>
            <Navbar />
            <div style={{ minHeight: 'calc(100vh - 64px)' }}>
                {loading && (
                    <div style={{ padding: '2rem', textAlign: 'center' }}>正在加载文章...</div>
                )}

                {!loading && error && (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger)' }}>{error}</div>
                )}

                {!loading && !error && article && (
                    <ArticleView
                        title={article.title}
                        content={article.content}
                        author={article.author}
                        views={article.views ?? 0}
                        praises={article.praise ?? article.praises ?? 0}
                        update_time={formatToChinaTime(Number(article.update_time))}
                        pushlish_time={formatToChinaTime(Number(article.publish_time))}
                    />
                )}
            </div>
            <Footer companyName="TechBlog" startYear={2025} />
            <BackToTop />
        </div>
    );
};

export default ArticleViewPage;
