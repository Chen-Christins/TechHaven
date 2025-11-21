import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from '../pages/auth/AuthPage';
import IndexPage from '../pages/home/IndexPage';
import ArticleView from '../sample/ArticleView';
import ArticleCreate from '../pages/articleCreate/ArticleCreate';
import Profile from '../pages/profile/ProfilePage';
import AdminLayout from '../pages/admin/AdminLayout';
import Dashboard from '../pages/admin/Dashboard';
import UserManagement from '../pages/admin/UserManagement';
import CategoryManagement from '../pages/admin/CategoryManagement';
import Analytics from '../pages/admin/Analytics';
import Settings from '../pages/admin/Settings';

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

            {/* 管理中心路由 */}
            <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="users" element={<UserManagement />} />
                {/* 其他管理页面可以在这里添加 */}
                <Route path="articles" element={<div>文章管理页面（待开发）</div>} />
                <Route path="comments" element={<div>评论管理页面（待开发）</div>} />
                <Route path="categories" element={<CategoryManagement />} />
                <Route path="media" element={<div>媒体库页面（待开发）</div>} />
                <Route path="database" element={<div>数据管理页面（待开发）</div>} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="settings" element={<Settings />} />
                <Route path="permissions" element={<div>权限管理页面（待开发）</div>} />
            </Route>

            {/* 404 页面 */}
            <Route path="*" element={<div>页面不存在</div>} />
        </Routes>
    );
};

export default RouterConfig;