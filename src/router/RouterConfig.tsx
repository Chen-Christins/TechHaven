import React from 'react';
import NotFound404 from '../pages/error/NotFound404';
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from '../pages/auth/AuthPage';
import IndexPage from '../pages/home/IndexPage';
import ArticleCreate from '../pages/articleCreate/ArticleCreate';
import Profile from '../pages/profile/ProfilePage';
import PersonalCenter from '../pages/personal/PersonalCenter';
import AdminLayout from '../pages/admin/AdminLayout';
import Dashboard from '../pages/admin/Dashboard';
import UserManagement from '../pages/admin/UserManagement';
import ArticleManagement from '../pages/admin/ArticleManagement';
import AssignmentManagement from '../pages/admin/AssignmentManagement';
import CategoryManagement from '../pages/admin/CategoryManagement';
import CommentManagement from '../pages/admin/CommentManagement';
import MediaManagement from '../pages/admin/MediaManagement';
import PermissionManagement from '../pages/admin/PermissionManagement';
import DataManagement from '../pages/admin/DataManagement';
import Analytics from '../pages/admin/Analytics';
import Settings from '../pages/admin/Settings';
import OrganizationManagement from '../pages/admin/OrganizationManagement';
import ArticleViewPage from '../pages/articleView/ArticleViewPage';
import AssignmentSubmit from '../pages/assignment/AssignmentSubmit';
import AssignmentList from '../pages/assignment/AssignmentList';

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
            <Route path='/article/edit/:id' element={<ArticleCreate />} />

            {/* 文章详情页 */}
            <Route path="/article/:id" element={<ArticleViewPage />} />

            {/* 作业列表页 */}
            <Route path="/assignments" element={<AssignmentList />} />
            {/* 作业提交页 */}
            <Route path="/assignment/submit/:id" element={<AssignmentSubmit />} />

            <Route path="/profile/:id" element={<Profile />} />

            {/* 个人管理中心 */}
            <Route path="/personal" element={<PersonalCenter />} />

            {/* 管理中心路由 */}
            <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="articles" element={<ArticleManagement />} />
                <Route path="assignments" element={<AssignmentManagement />} />
                                <Route path="organizations" element={<OrganizationManagement />} />
                <Route path="comments" element={<CommentManagement />} />
                <Route path="categories" element={<CategoryManagement />} />
                <Route path="media" element={<MediaManagement />} />
                <Route path="database" element={<DataManagement />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="settings" element={<Settings />} />
                <Route path="permissions" element={<PermissionManagement />} />
            </Route>

            {/* 404 页面 */}
            <Route path="*" element={<NotFound404 />} />
        </Routes>
    );
};

export default RouterConfig;