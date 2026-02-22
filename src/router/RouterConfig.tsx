import React from "react";
import NotFound404 from "../pages/error/NotFound404";
import { Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "../pages/auth/AuthPage";
import IndexPage from "../pages/home/IndexPage";
import ArticleCreate from "../pages/article/ArticleCreate";
import Profile from "../pages/profile/ProfilePage";
import PersonalCenter from "../pages/personal/PersonalCenter";
import AdminLayout from "../pages/admin/AdminLayout";
import Dashboard from "../pages/admin/Dashboard";
import UserManagement from "../pages/admin/UserManagement";
import ArticleManagement from "../pages/admin/ArticleManagement";
import AssignmentManagement from "../pages/admin/AssignmentManagement";
import CategoryManagement from "../pages/admin/CategoryManagement";
import CommentManagement from "../pages/admin/CommentManagement";
import MediaManagement from "../pages/admin/MediaManagement";
import PermissionManagement from "../pages/admin/PermissionManagement";
import DataManagement from "../pages/admin/DataManagement";
import Analytics from "../pages/admin/Analytics";
import Settings from "../pages/admin/Settings";
import OrganizationManagement from "../pages/admin/OrganizationManagement";
import OrganizationList from "../pages/organization/OrganizationList";
import OrganizationDetail from "../pages/organization/OrganizationDetail";
import ArticleViewPage from "../pages/article/ArticleViewPage";
import AssignmentSubmit from "../pages/assignment/AssignmentSubmit";
import AssignmentList from "../pages/assignment/AssignmentList";
import AssignmentSubmissions from "../pages/assignment/AssignmentSubmissions";
import ChunkUploadTest from "../pages/test/ChunkUploadTest";
import CaptchaTest from "../pages/test/CaptchaTest";
import TestList from "../pages/test/TestList";
import GMShell from "../pages/gm/GMShell";
import GMDashboard from "../pages/gm/GMDashboard";
import GMProtocol from "../pages/gm/GMProtocol";
import GMServer from "../pages/gm/GMServer";

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
      <Route path="/article/create" element={<ArticleCreate />} />
      <Route path="/article/edit/:id" element={<ArticleCreate />} />

      {/* 文章详情页 */}
      <Route path="/article/:id" element={<ArticleViewPage />} />

      {/* 作业列表页 */}
      <Route path="/assignments" element={<AssignmentList />} />
      {/* 作业提交页 */}
      <Route path="/assignment/submit/:id" element={<AssignmentSubmit />} />
      {/* 作业提交详情页 */}
      <Route path="/assignment/submissions/:id" element={<AssignmentSubmissions />} />

      {/* 测试页面（仅开发环境可见） */}
      {import.meta.env.DEV && <Route path="/test" element={<TestList />} />}
      {import.meta.env.DEV && <Route path="/test/captcha" element={<CaptchaTest />} />}
      {import.meta.env.DEV && <Route path="/test/chunk-upload" element={<ChunkUploadTest />} />}

      {/* 用户组织列表页 */}
      <Route path="/organizations/list" element={<OrganizationList />} />
      {/* 组织详情页 */}
      <Route path="/organization/detail/:id" element={<OrganizationDetail />} />

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

      {/* GM 业务控制台（平台入口，支持后续子页） */}
      <Route path="/gm" element={<GMShell />}>
        <Route index element={<Navigate to="/gm/dashboard" replace />} />
        <Route path="dashboard" element={<GMDashboard />} />
        <Route path="protocol" element={<GMProtocol />} />
        <Route path="server" element={<GMServer />} />
      </Route>

      {/* 404 页面 */}
      <Route path="*" element={<NotFound404 />} />
    </Routes>
  );
};

export default RouterConfig;
