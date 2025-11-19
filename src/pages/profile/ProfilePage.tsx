import React from 'react';
import styles from './ProfilePage.module.css';
import Navbar from '../../components/navbar/Navbar';
import Footer from '../../components/footer/Footer';
import BackToTop from '../../components/backToTop/BackToTop';
import {
  MapPin, Calendar, Globe,
  FileText, Users, Heart, MessageSquare,
  Eye, Clock, Hash, TrendingUp,
  Activity, Edit, Share2, BookOpen
} from 'lucide-react';
import type { Article, UserProfile } from '../../types/index';

// 模拟数据
const mockUser: UserProfile = {
  id: 1,
  name: '张明',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  bio: '全栈开发者 | 技术博客作者 | 开源爱好者。热爱分享技术心得，专注于React、Node.js和云计算领域。',
  location: '北京',
  website: 'https://zhangming.dev',
  joinDate: '2020年3月',
  stats: {
    articles: 24,
    followers: 1284,
    following: 342
  }
};

const mockArticles: Article[] = [
  {
      id: 1,
      title: 'React Hooks 最佳实践与性能优化',
      summary: '深入探讨React Hooks的使用技巧，如何避免常见陷阱，以及提升组件性能的各种策略。通过实际案例分析，掌握高级Hook用法。',
      publish_time: '2024-01-15',
      category: "前端技术",
      views: 842,
      tags: ['React', 'Hooks', '性能优化'],
      praises: 45,
      comments: 12,
      author: mockUser.name,
      date: '2024-01-15',
      publishDate: '2024-01-15',
      excerpt: '深入探讨React Hooks的使用技巧，如何避免常见陷阱，以及提升组件性能的各种策略。',
      readTime: '8',
      likes: 45
  },
  {
      id: 2,
      title: 'TypeScript在大型项目中的应用经验',
      summary: '分享在大型前端项目中TypeScript的类型设计、工程化配置和团队协作规范，帮助企业提升代码质量。',
      publish_time: '2024-01-10',
      category: "前端技术",
      views: 1256,
      tags: ['TypeScript', '工程化'],
      praises: 78,
      comments: 23,
      author: mockUser.name,
      date: '2024-01-10',
      publishDate: '2024-01-10',
      excerpt: '分享在大型前端项目中TypeScript的类型设计、工程化配置和团队协作规范...',
      readTime: '12',
      likes: 78
  },
  {
      id: 3,
      title: 'TypeScript在大型项目中的应用经验',
      summary: '分享在大型前端项目中TypeScript的类型设计、工程化配置和团队协作规范，帮助企业提升代码质量。',
      publish_time: '2024-01-10',
      category: "前端技术",
      views: 1256,
      tags: ['TypeScript', '工程化'],
      praises: 78,
      comments: 23,
      author: mockUser.name,
      date: '2024-01-10',
      publishDate: '2024-01-10',
      excerpt: '分享在大型前端项目中TypeScript的类型设计、工程化配置和团队协作规范...',
      readTime: '12',
      likes: 78
  },
  {
      id: 4,
      title: '微前端架构的落地实践',
      summary: '从单体应用到微前端的迁移过程，分享qiankun框架的使用经验和坑点总结，助力企业级应用拆分。',
      publish_time: '2024-01-05',
      category: "架构设计",
      views: 892,
      tags: ['微前端', 'qiankun', '架构'],
      praises: 56,
      comments: 18,
      author: mockUser.name,
      date: '2024-01-05',
      publishDate: '2024-01-05',
      excerpt: '从单体应用到微前端的迁移过程，分享qiankun框架的使用经验和坑点总结...',
      readTime: '15',
      likes: 56
  },
  {
      id: 5,
      title: '微前端架构的落地实践',
      summary: '从单体应用到微前端的迁移过程，分享qiankun框架的使用经验和坑点总结，助力企业级应用拆分。',
      publish_time: '2024-01-05',
      category: "架构设计",
      views: 892,
      tags: ['微前端', 'qiankun', '架构'],
      praises: 56,
      comments: 18,
      author: mockUser.name,
      date: '2024-01-05',
      publishDate: '2024-01-05',
      excerpt: '从单体应用到微前端的迁移过程，分享qiankun框架的使用经验和坑点总结...',
      readTime: '15',
      likes: 56
  },
  {
      id: 6,
      title: '微前端架构的落地实践',
      summary: '从单体应用到微前端的迁移过程，分享qiankun框架的使用经验和坑点总结，助力企业级应用拆分。',
      publish_time: '2024-01-05',
      category: "架构设计",
      views: 892,
      tags: ['微前端', 'qiankun', '架构'],
      praises: 56,
      comments: 18,
      author: mockUser.name,
      date: '2024-01-05',
      publishDate: '2024-01-05',
      excerpt: '从单体应用到微前端的迁移过程，分享qiankun框架的使用经验和坑点总结...',
      readTime: '15',
      likes: 56
  },
  {
      id: 7,
      title: '微前端架构的落地实践',
      summary: '从单体应用到微前端的迁移过程，分享qiankun框架的使用经验和坑点总结，助力企业级应用拆分。',
      publish_time: '2024-01-05',
      category: "架构设计",
      views: 892,
      tags: ['微前端', 'qiankun', '架构'],
      praises: 56,
      comments: 18,
      author: mockUser.name,
      date: '2024-01-05',
      publishDate: '2024-01-05',
      excerpt: '从单体应用到微前端的迁移过程，分享qiankun框架的使用经验和坑点总结...',
      readTime: '15',
      likes: 56
  },
];

const popularTags = [
  { name: 'React', count: 15, color: '#61DAFB' },
  { name: 'TypeScript', count: 12, color: '#3178C6' },
  { name: 'Node.js', count: 8, color: '#339933' },
  { name: 'Vue', count: 6, color: '#4FC08D' },
  { name: '微前端', count: 5, color: '#7B68EE' },
  { name: '性能优化', count: 9, color: '#FF6B6B' }
];

const recentActivities = [
  {
    id: 1,
    text: '发布了新文章',
    subText: 'React Hooks 最佳实践与性能优化',
    time: '2小时前',
    icon: '📝',
    type: 'article'
  },
  {
    id: 2,
    text: '收到了 15 个新的关注',
    subText: '来自技术社区的同行们',
    time: '1天前',
    icon: '❤️',
    type: 'follow'
  },
  {
    id: 3,
    text: '评论了文章',
    subText: '《Vue3 Composition API深度解析》',
    time: '2天前',
    icon: '💬',
    type: 'comment'
  },
  {
    id: 4,
    text: '获得了 8 个赞',
    subText: '在文章《Docker容器化实践》中',
    time: '3天前',
    icon: '⭐',
    type: 'like'
  }
];

const Profile: React.FC = () => {

  
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
                  <img
                    src={mockUser.avatar}
                    alt={mockUser.name}
                    className={styles.avatar}
                  />
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
                <button className={styles.primaryButton}>
                  <Edit size={14} />
                  编辑资料
                </button>
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
                <button className={styles.activeView}>列表</button>
                <button className={styles.inactiveView}>网格</button>
              </div>
            </div>
            <div className={styles.articlesList}>
              {mockArticles.map(article => (
                <article key={article.id} className={styles.articleCard}>
                  <div className={styles.articleHeader}>
                    <div className={styles.articleCategory}>{article.category}</div>
                    <span className={styles.articleDate}>{article.publishDate}</span>
                  </div>
                  <h3 className={styles.articleTitle}>{article.title}</h3>
                  <p className={styles.articleExcerpt}>{article.summary}</p>
                  <div className={styles.articleFooter}>
                    <div className={styles.tags}>
                      {article.tags.slice(0, 3).map(tag => (
                        <span key={tag} className={styles.tag}>
                          <Hash size={12} />
                          {tag}
                        </span>
                      ))}
                      {article.tags.length > 3 && (
                        <span className={styles.moreTags}>+{article.tags.length - 3}</span>
                      )}
                    </div>
                    <div className={styles.articleStats}>
                      <div className={styles.statItem}>
                        <Eye size={14} />
                        <span>{article.views}</span>
                      </div>
                      <div className={styles.statItem}>
                        <Heart size={14} />
                        <span>{article.likes}</span>
                      </div>
                      <div className={styles.statItem}>
                        <MessageSquare size={14} />
                        <span>{article.comments}</span>
                      </div>
                      <div className={styles.statItem}>
                        <Clock size={14} />
                        <span>{article.readTime}分钟</span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <button className={styles.loadMoreButton}>
              加载更多文章
            </button>
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
              {popularTags.map(tag => (
                <div
                  key={tag.name}
                  className={styles.popularTag}
                  style={{ backgroundColor: `${tag.color}20`, borderColor: tag.color }}
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
              {recentActivities.map(activity => (
                <div key={activity.id} className={styles.activityItem}>
                  <div className={styles.activityIcon}>{activity.icon}</div>
                  <div className={styles.activityContent}>
                    <div className={styles.activityText}>{activity.text}</div>
                    <div className={styles.activitySubtext}>{activity.subText}</div>
                    <div className={styles.activityTime}>{activity.time}</div>
                  </div>
                </div>
              ))}
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