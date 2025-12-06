import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaExclamationTriangle, FaHome, FaArrowLeft } from 'react-icons/fa';
import ArticleView from './ArticleView';
import ArticleService from '../../services/articleService';
import Navbar from '../../components/navbar/Navbar';
import Footer from '../../components/footer/Footer';
import BackToTop from '../../components/backToTop/BackToTop';
import { formatToChinaTime } from '../../utils/utils';

const ArticleViewPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
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
                    <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        padding: '4rem 2rem',
                        textAlign: 'center',
                        minHeight: '60vh'
                    }}>
                        <div style={{ fontSize: '4rem', color: 'var(--danger)', marginBottom: '1.5rem', opacity: 0.8 }}>
                            <FaExclamationTriangle />
                        </div>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                            无法加载文章
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '400px' }}>
                            {error}
                        </p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button 
                                onClick={() => navigate(-1)}
                                style={{
                                    padding: '0.75rem',
                                    border: '1px solid var(--border-primary)',
                                    borderRadius: '0.5rem',
                                    background: 'var(--bg-secondary)',
                                    color: 'var(--text-primary)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                <FaArrowLeft /> 返回上一页
                            </button>
                            <button 
                                onClick={() => navigate('/')}
                                style={{
                                    padding: '0.75rem',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    background: 'var(--primary)',
                                    color: 'white',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                <FaHome /> 返回首页
                            </button>
                        </div>
                    </div>
                )}

                {!loading && !error && article && (
                    <ArticleView
                        title={article.title}
                        content={article.content}
                        author={article.author}
                        views={article.views ?? 0}
                        praises={article.praise ?? article.praises ?? 0}
                        update_time={formatToChinaTime(Number(article.update_time))}
                        pushlish_time={article.publish_time ? formatToChinaTime(Number(article.publish_time)) : '暂未发布'}
                    />
                )}
            </div>
            <Footer companyName="TechBlog" startYear={2025} />
            <BackToTop />
        </div>
    );
};

export default ArticleViewPage;
