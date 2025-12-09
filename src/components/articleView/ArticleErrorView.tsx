import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaExclamationTriangle, FaHome, FaArrowLeft } from 'react-icons/fa';

interface ArticleErrorViewProps {
    error: string | null;
}

const ArticleErrorView: React.FC<ArticleErrorViewProps> = ({ error }) => {
    const navigate = useNavigate();

    return (
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
                {error || '发生未知错误'}
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
    );
};

export default ArticleErrorView;