import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./ProfilePage.module.css";
import Navbar from "../../components/navbar/Navbar";
import Footer from "../../components/footer/Footer";
import BackToTop from "../../components/backToTop/BackToTop";
import { useAuth } from "../../contexts/AuthContext";
import AuthService from "../../services/authService";
import ArticleService from "../../services/articleService";
import LabelService from "../../services/labelService";
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

// 文章数较小就用 mock 数据补充
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

function formatDate(timestamp: number | string): string {
  if (!timestamp) return "";
  const ts = typeof timestamp === "string" ? parseInt(timestamp, 10) : timestamp;
  if (isNaN(ts) || ts === 0) return "";
  const date = new Date(ts * 1000);
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}

function formatPublishTime(timestamp: number | string): string {
  if (!timestamp) return "";
  const ts = typeof timestamp === "string" ? parseInt(timestamp, 10) : timestamp;
  if (isNaN(ts) || ts === 0) return "";
  const date = new Date(ts * 1000);
  return date.toISOString().split("T")[0];
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user: currentUser, isAuthenticated } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [tags, setTags] = useState<{ name: string; count: number; color: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [articleTotal, setArticleTotal] = useState(0);

  const isOwnProfile = isAuthenticated && currentUser?.id.toString() === id;

  useEffect(() => {
    if (!id) return;

    const fetchProfileData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 并行请求用户信息和文章列表
        const [userResponse, articlesResponse, labelsData] = await Promise.all([
          AuthService.getUserInfo(id).catch(() => null),
          ArticleService.listArticlesByUserIdPages({
            user_id: id,
            page_from: 1,
            page_size: 20,
            state: 2,
          }).catch(() => null),
          LabelService.queryLabel({ user_id: id }).catch(() => []),
        ]);

        // 构建用户资料
        const userData = userResponse?.data ?? (userResponse as any);
        const mappedProfile: UserProfile = {
          id: Number(id),
          name: userData?.name || "未知用户",
          avatar: userData?.avatar || `https://picsum.photos/id/${(Number(id) % 100) + 1}/150`,
          bio: userData?.bio || userData?.signature || "",
          account: userData?.account || "",
          email: userData?.email || "",
          role: userData?.role || "user",
          location: userData?.location || "",
          website: userData?.website || "",
          joinDate: formatDate(userData?.create_time),
          stats: {
            articles: articlesResponse?.total ?? 0,
            followers: userData?.followers_count ?? 0,
            following: userData?.following_count ?? 0,
          },
        };
        setProfile(mappedProfile);

        // 构建文章列表
        if (articlesResponse?.list) {
          const mappedArticles: Article[] = articlesResponse.list.map((item: any) => ({
            id: item.id,
            title: item.title,
            content: item.summary || "",
            author: item.author || mappedProfile.name,
            user_id: item.user_id || id,
            type: item.type ?? 1,
            state: item.state ?? 2,
            is_deleted: false,
            publish_time: formatPublishTime(item.publish_time),
            update_time: formatPublishTime(item.update_time || item.publish_time),
            views: item.views ?? 0,
            praise: item.praise ?? 0,
            favorites: item.favorites ?? 0,
            labels: item.labels || [],
            categorys: item.categorys || [],
          }));
          setArticles(mappedArticles);
          setArticleTotal(articlesResponse.total);
        }

        // 标签
        if (Array.isArray(labelsData) && labelsData.length > 0) {
          const tagColors = ["#61DAFB", "#3178C6", "#339933", "#4FC08D", "#7B68EE", "#FF6B6B"];
          const mappedTags = labelsData.slice(0, 8).map((label: any, i: number) => ({
            name: label.name || `标签${i + 1}`,
            count: label.count ?? 0,
            color: label.color || tagColors[i % tagColors.length],
          }));
          setTags(mappedTags);
        }
      } catch (err: any) {
        setError(err.message || "加载失败");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [id]);

  if (loading) {
    return (
      <div className={styles.profile}>
        <Navbar />
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <span>加载中...</span>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className={styles.profile}>
        <Navbar />
        <div className={styles.loadingContainer}>
          <span>{error || "用户不存在"}</span>
        </div>
      </div>
    );
  }

  const popularTags = tags.length > 0 ? tags : [];

  return (
    <div className={styles.profile}>
      <Navbar />

      <div className={styles.mainContent}>
        <div className={styles.leftColumn}>
          {/* 个人信息卡片 */}
          <div className={styles.profileCard}>
            <div className={styles.coverBg}></div>
            <div className={styles.profileContent}>
              <div className={styles.profileHeader}>
                <div className={styles.avatarWrapper}>
                  <img src={profile.avatar} alt={profile.name} className={styles.avatar} />
                  <div className={styles.onlineIndicator}></div>
                </div>
                <div className={styles.userDetails}>
                  <h1 className={styles.userName}>{profile.name}</h1>
                  {profile.bio && <p className={styles.bio}>{profile.bio}</p>}
                  <div className={styles.metaInfo}>
                    {profile.location && (
                      <div className={styles.metaItem}>
                        <MapPin className={styles.metaIcon} size={14} />
                        <span>{profile.location}</span>
                      </div>
                    )}
                    {profile.joinDate && (
                      <div className={styles.metaItem}>
                        <Calendar className={styles.metaIcon} size={14} />
                        <span>{profile.joinDate} 加入</span>
                      </div>
                    )}
                    {profile.website && (
                      <div className={styles.metaItem}>
                        <Globe className={styles.metaIcon} size={14} />
                        <a href={profile.website} target="_blank" rel="noopener noreferrer">
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
                  <span className={styles.statNumber}>{profile.stats.articles}</span>
                  <span className={styles.statLabel}>文章</span>
                </div>
                <div className={styles.statItem}>
                  <Users className={styles.statIcon} size={16} />
                  <span className={styles.statNumber}>{profile.stats.followers}</span>
                  <span className={styles.statLabel}>粉丝</span>
                </div>
                <div className={styles.statItem}>
                  <Heart className={styles.statIcon} size={16} />
                  <span className={styles.statNumber}>{profile.stats.following}</span>
                  <span className={styles.statLabel}>关注</span>
                </div>
              </div>

              <div className={styles.actionButtons}>
                {isOwnProfile && (
                  <button className={styles.primaryButton} onClick={() => navigate("/personal?tab=edit")}>
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
                <h2 className={styles.sectionTitle}>文章 ({articleTotal})</h2>
              </div>
              <div className={styles.viewToggle}>
                <button className={viewMode === "list" ? styles.activeView : styles.inactiveView} onClick={() => setViewMode("list")}>
                  列表
                </button>
                <button className={viewMode === "grid" ? styles.activeView : styles.inactiveView} onClick={() => setViewMode("grid")}>
                  网格
                </button>
              </div>
            </div>
            {articles.length === 0 ? (
              <div className={styles.emptyArticles}>暂无文章</div>
            ) : (
              <div className={`${styles.articlesList} ${viewMode === "grid" ? styles.gridView : styles.listView}`}>
                {articles.map((article) => (
                  <article
                    key={article.id}
                    className={`${styles.articleCard} ${viewMode === "grid" ? styles.gridCard : styles.listCard}`}
                    onClick={() => navigate(`/article/${article.id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className={styles.articleHeader}>
                      <div className={styles.articleCategory}>
                        {Array.isArray(article.categorys) && article.categorys.length > 0
                          ? typeof article.categorys[0] === "object"
                            ? (article.categorys[0] as any).name
                            : article.categorys[0]
                          : "未分类"}
                      </div>
                      <span className={styles.articleDate}>{article.publish_time}</span>
                    </div>
                    <h3 className={styles.articleTitle}>{article.title}</h3>
                    <p className={styles.articleExcerpt}>
                      {(article.content || "").substring(0, 100)}
                      {(article.content || "").length > 100 ? "..." : ""}
                    </p>
                    <div className={styles.articleFooter}>
                      <div className={styles.tags}>
                        {(article.labels || []).slice(0, 3).map((label: any) => (
                          <span key={typeof label === "object" ? label.id : label} className={styles.tag}>
                            <Hash size={12} />
                            {typeof label === "object" ? label.name : label}
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
            )}
            {articles.length < articleTotal && <button className={styles.loadMoreButton}>加载更多文章</button>}
          </div>
        </div>

        {/* 右侧：侧边栏 */}
        <div className={styles.rightColumn}>
          {popularTags.length > 0 && (
            <div className={styles.widget}>
              <div className={styles.widgetHeader}>
                <TrendingUp className={styles.widgetIcon} size={16} />
                <h3 className={styles.widgetTitle}>常用标签</h3>
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
          )}

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
