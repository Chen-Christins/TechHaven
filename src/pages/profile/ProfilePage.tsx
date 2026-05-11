import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ProfilePage.module.css";
import Navbar from "../../components/navbar/Navbar";
import Footer from "../../components/footer/Footer";
import BackToTop from "../../components/backToTop/BackToTop";
import { useAuth } from "../../contexts/AuthContext";
import {
  MapPin,
  Calendar,
  Globe,
  FileText,
  Users,
  Heart,
  MessageSquare,
  Eye,
  Clock,
  Hash,
  TrendingUp,
  Activity,
  Edit,
  Share2,
  BookOpen,
  Star,
  UserPlus,
} from "lucide-react";
import type { Article, UserProfile } from "../../types/index";

// 模拟数据
const mockUser: UserProfile = {
  id: 1,
  name: "张明",
  avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
  bio: "全栈开发者 | 技术博客作者 | 开源爱好者。热爱分享技术心得，专注于React、Node.js和云计算领域。",
  location: "北京",
  website: "https://zhangming.dev",
  joinDate: "2020年3月",
  stats: {
    articles: 24,
    followers: 1284,
    following: 342,
  },
  account: "",
  email: "",
  role: "admin",
};

const mockArticles: Article[] = [
  {
    id: 1,
    title: "React Hooks 最佳实践与性能优化",
    content: "深入探讨React Hooks的使用技巧，如何避免常见陷阱，以及提升组件性能的各种策略。通过实际案例分析，掌握高级Hook用法。",
    publish_time: "2024-01-15",
    update_time: "2024-01-15",
    categorys: ["前端技术"],
    labels: [1, 2, 3],
    views: 842,
    praise: 45,
    favorites: 12,
    author: mockUser.name,
    user_id: mockUser.id,
    type: 1,
    state: 1,
    is_deleted: false,
  },
  {
    id: 2,
    title: "TypeScript在大型项目中的应用经验",
    content: "分享在大型前端项目中TypeScript的类型设计、工程化配置和团队协作规范，帮助企业提升代码质量。",
    publish_time: "2024-01-10",
    update_time: "2024-01-10",
    categorys: ["前端技术"],
    labels: [4, 5],
    views: 1256,
    praise: 78,
    favorites: 23,
    author: mockUser.name,
    user_id: mockUser.id,
    type: 1,
    state: 1,
    is_deleted: false,
  },
  {
    id: 3,
    title: "Vue 3 Composition API 实战指南",
    content: "详细介绍Vue 3 Composition API的使用方法，通过实际项目案例展示如何构建现代化的Vue应用。",
    publish_time: "2024-01-05",
    update_time: "2024-01-05",
    categorys: ["前端技术"],
    labels: [6, 7],
    views: 945,
    praise: 56,
    favorites: 18,
    author: mockUser.name,
    user_id: mockUser.id,
    type: 1,
    state: 1,
    is_deleted: false,
  },
  {
    id: 4,
    title: "微前端架构的落地实践",
    content: "从单体应用到微前端的迁移过程，分享qiankun框架的使用经验和坑点总结，助力企业级应用拆分。",
    publish_time: "2024-01-05",
    update_time: "2024-01-05",
    categorys: ["架构设计"],
    labels: [8, 9, 10],
    views: 892,
    praise: 56,
    favorites: 18,
    author: mockUser.name,
    user_id: mockUser.id,
    type: 1,
    state: 1,
    is_deleted: false,
  },
  {
    id: 5,
    title: "Node.js 性能优化实战",
    content: "深入分析Node.js应用的性能瓶颈，提供实用的优化策略和监控方案，包含大量实际案例。",
    publish_time: "2023-12-28",
    update_time: "2023-12-28",
    categorys: ["后端技术"],
    labels: [11, 12],
    views: 734,
    praise: 42,
    favorites: 15,
    author: mockUser.name,
    user_id: mockUser.id,
    type: 1,
    state: 1,
    is_deleted: false,
  },
  {
    id: 6,
    title: "CSS Grid 布局完全指南",
    content: "全面介绍CSS Grid布局系统，从基础概念到高级应用，帮助开发者掌握现代网页布局技术。",
    publish_time: "2023-12-20",
    update_time: "2023-12-20",
    categorys: ["前端技术"],
    labels: [13, 14],
    views: 656,
    praise: 38,
    favorites: 11,
    author: mockUser.name,
    user_id: mockUser.id,
    type: 1,
    state: 1,
    is_deleted: false,
  },
];

const popularTags = [
  { name: "React", count: 15, color: "#61DAFB" },
  { name: "TypeScript", count: 12, color: "#3178C6" },
  { name: "Node.js", count: 8, color: "#339933" },
  { name: "Vue", count: 6, color: "#4FC08D" },
  { name: "微前端", count: 5, color: "#7B68EE" },
  { name: "性能优化", count: 9, color: "#FF6B6B" },
];

const recentActivities = [
  {
    id: 1,
    text: "发布了新文章",
    subText: "React Hooks 最佳实践与性能优化",
    time: "2小时前",
    type: "article" as const,
  },
  {
    id: 2,
    text: "收到了 15 个新的关注",
    subText: "来自技术社区的同行们",
    time: "1天前",
    type: "follow" as const,
  },
  {
    id: 3,
    text: "评论了文章",
    subText: "《Vue3 Composition API深度解析》",
    time: "2天前",
    type: "comment" as const,
  },
  {
    id: 4,
    text: "获得了 8 个赞",
    subText: "在文章《Docker容器化实践》中",
    time: "3天前",
    type: "like" as const,
  },
];

const activityIconMap = {
  article: { icon: <FileText size={16} />, className: styles.activityIconArticle },
  follow: { icon: <UserPlus size={16} />, className: styles.activityIconFollow },
  comment: { icon: <MessageSquare size={16} />, className: styles.activityIconComment },
  like: { icon: <Star size={16} />, className: styles.activityIconLike },
};

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated } = useAuth();

  // 判断是否为本人主页
  const isOwnProfile = isAuthenticated && currentUser?.id === mockUser.id;

  // 视图模式状态管理
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const handleViewToggle = (mode: "list" | "grid") => {
    setViewMode(mode);
  };

  return (
    <div className={styles.profile}>
      {/* 顶部导航栏 */}
      <Navbar />

      {/* 主内容区（左右分栏） */}
      <div className={styles.mainContent}>
        {/* 左侧：个人信息 + 文章列表 */}
        <div className={styles.leftColumn}>
          {/* 个人信息卡片 */}
          <div className={styles.profileCard}>
            <div className={styles.coverBg}></div>
            <div className={styles.profileContent}>
              <div className={styles.profileHeader}>
                <div className={styles.avatarWrapper}>
                  <img src={mockUser.avatar} alt={mockUser.name} className={styles.avatar} />
                  <div className={styles.onlineIndicator}></div>
                </div>
                <div className={styles.userDetails}>
                  <h1 className={styles.userName}>{mockUser.name}</h1>
                  <p className={styles.bio}>{mockUser.bio}</p>
                  <div className={styles.metaInfo}>
                    <div className={styles.metaItem}>
                      <MapPin className={styles.metaIcon} size={14} />
                      <span>{mockUser.location}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <Calendar className={styles.metaIcon} size={14} />
                      <span>{mockUser.joinDate} 加入</span>
                    </div>
                    {mockUser.website && (
                      <div className={styles.metaItem}>
                        <Globe className={styles.metaIcon} size={14} />
                        <a href={mockUser.website} target="_blank" rel="noopener noreferrer">
                          个人网站
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.statsRow}>
                <div className={styles.statItem}>
                  <FileText className={styles.statIcon} size={16} />
                  <span className={styles.statNumber}>{mockUser.stats.articles}</span>
                  <span className={styles.statLabel}>文章</span>
                </div>
                <div className={styles.statItem}>
                  <Users className={styles.statIcon} size={16} />
                  <span className={styles.statNumber}>{mockUser.stats.followers}</span>
                  <span className={styles.statLabel}>粉丝</span>
                </div>
                <div className={styles.statItem}>
                  <Heart className={styles.statIcon} size={16} />
                  <span className={styles.statNumber}>{mockUser.stats.following}</span>
                  <span className={styles.statLabel}>关注</span>
                </div>
              </div>

              <div className={styles.actionButtons}>
                {isOwnProfile && (
                  <button
                    className={styles.primaryButton}
                    onClick={() => navigate("/personal?tab=edit")}
                  >
                    <Edit size={14} />
                    编辑资料
                  </button>
                )}
                <button className={styles.secondaryButton}>
                  <Share2 size={14} />
                  分享主页
                </button>
              </div>
            </div>
          </div>

          {/* 文章列表 */}
          <div className={styles.articlesSection}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleWrapper}>
                <BookOpen className={styles.sectionIcon} size={18} />
                <h2 className={styles.sectionTitle}>我的文章</h2>
              </div>
              <div className={styles.viewToggle}>
                <button
                  className={viewMode === "list" ? styles.activeView : styles.inactiveView}
                  onClick={() => handleViewToggle("list")}
                >
                  列表
                </button>
                <button
                  className={viewMode === "grid" ? styles.activeView : styles.inactiveView}
                  onClick={() => handleViewToggle("grid")}
                >
                  网格
                </button>
              </div>
            </div>
            <div className={`${styles.articlesList} ${viewMode === "grid" ? styles.gridView : styles.listView}`}>
              {mockArticles.map((article) => (
                <article
                  key={article.id}
                  className={`${styles.articleCard} ${viewMode === "grid" ? styles.gridCard : styles.listCard}`}
                >
                  <div className={styles.articleHeader}>
                    <div className={styles.articleCategory}>{article.categorys?.[0] || "未分类"}</div>
                    <span className={styles.articleDate}>{article.publish_time}</span>
                  </div>
                  <h3 className={styles.articleTitle}>{article.title}</h3>
                  <p className={styles.articleExcerpt}>{article.content?.substring(0, 100) || ""}...</p>
                  <div className={styles.articleFooter}>
                    <div className={styles.tags}>
                      {article.labels?.slice(0, 3).map((tagId: string | number) => (
                        <span key={tagId} className={styles.tag}>
                          <Hash size={12} />
                          标签{tagId}
                        </span>
                      ))}
                      {(article.labels?.length || 0) > 3 && (
                        <span className={styles.moreTags}>+{(article.labels?.length || 0) - 3}</span>
                      )}
                    </div>
                    <div className={styles.articleStats}>
                      <div className={styles.statItem}>
                        <Eye size={14} />
                        <span>{article.views}</span>
                      </div>
                      <div className={styles.statItem}>
                        <Heart size={14} />
                        <span>{article.praise}</span>
                      </div>
                      <div className={styles.statItem}>
                        <MessageSquare size={14} />
                        <span>{article.favorites}</span>
                      </div>
                      <div className={styles.statItem}>
                        <Clock size={14} />
                        <span>5分钟</span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <button className={styles.loadMoreButton}>加载更多文章</button>
          </div>
        </div>

        {/* 右侧：侧边栏 */}
        <div className={styles.rightColumn}>
          {/* 热门标签 */}
          <div className={styles.widget}>
            <div className={styles.widgetHeader}>
              <TrendingUp className={styles.widgetIcon} size={16} />
              <h3 className={styles.widgetTitle}>热门标签</h3>
            </div>
            <div className={styles.popularTags}>
              {popularTags.map((tag) => (
                <div
                  key={tag.name}
                  className={styles.popularTag}
                  style={{
                    backgroundColor: `${tag.color}20`,
                    borderColor: tag.color,
                  }}
                >
                  <span className={styles.tagName}>{tag.name}</span>
                  <span className={styles.tagCount}>{tag.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 最近动态 */}
          <div className={styles.widget}>
            <div className={styles.widgetHeader}>
              <Activity className={styles.widgetIcon} size={16} />
              <h3 className={styles.widgetTitle}>最近动态</h3>
            </div>
            <div className={styles.recentActivity}>
              {recentActivities.map((activity) => {
                const meta = activityIconMap[activity.type];
                return (
                  <div key={activity.id} className={styles.activityItem}>
                    <div className={`${styles.activityIcon} ${meta.className}`}>{meta.icon}</div>
                    <div className={styles.activityContent}>
                      <div className={styles.activityText}>{activity.text}</div>
                      <div className={styles.activitySubtext}>{activity.subText}</div>
                      <div className={styles.activityTime}>{activity.time}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <Footer companyName="TechBlog" startYear={2025} />
      <BackToTop />
    </div>
  );
};

export default Profile;
