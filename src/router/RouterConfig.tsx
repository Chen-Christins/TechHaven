import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from '../pages/auth/AuthPage';
import IndexPage from '../pages/home/IndexPage';
import ArticleView from '../sample/ArticleView';
import ArticleCreate from '../pages/articleCreate/ArticleCreate';
import Profile from '../pages/profile/ProfilePage';

const RouterConfig: React.FC = () => {
    return (
        <Routes>
            {/* 默认路由重定向到主页 */}
            <Route path="/" element={<Navigate to="/index" replace />} />

            {/* 主页 */}
            <Route path="/index" element={<IndexPage />} />

            {/* 登录页 */}
            <Route path="/auth" element={<AuthPage />} />
            
            {/* 文章创建页 */}
            <Route path='/article/create' element={<ArticleCreate />} />

            {/* 文章详情页 */}
            <Route path="/article/:id" element={<ArticleView />} />

            <Route path="/profile/:id" element={<Profile />} />

            {/* 404 页面 */}
            <Route path="*" element={<div>页面不存在</div>} />
        </Routes>
    );
};

export default RouterConfig;