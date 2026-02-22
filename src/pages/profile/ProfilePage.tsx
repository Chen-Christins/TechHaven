import React, { useEffect, useMemo, useState } from "react";
import styles from "./ProfilePage.module.css";
import Navbar from "../../components/navbar/Navbar";
import Footer from "../../components/footer/Footer";
import BackToTop from "../../components/backToTop/BackToTop";
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
} from "lucide-react";
import { message } from "../../components/message/Message";
import { useAuth } from "../../contexts/AuthContext";
import { AuthService } from "../../services/authService";
import ArticleService from "../../services/articleService";
import { formatToChinaTime } from "../../utils/utils";
import type { Article, UserProfile } from "../../types/index";

type ContributionItem = { date: string; count: number };
type ProfileArticle = Article & { publish_timestamp?: number };

const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face";

const FALLBACK_TAGS = [
  { name: "React", count: 15, color: "#61DAFB" },
  { name: "TypeScript", count: 12, color: "#3178C6" },
  { name: "Node.js", count: 8, color: "#339933" },
  { name: "Vue", count: 6, color: "#4FC08D" },
  { name: "微前端", count: 5, color: "#7B68EE" },
  { name: "性能优化", count: 9, color: "#FF6B6B" },
];

const ROLE_MAP: Record<string, UserProfile["role"]> = {
  admin: "admin",
  editor: "editor",
  user: "user",
  "1": "user",
  "2": "admin",
  "3": "editor",
};

const Profile: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [articles, setArticles] = useState<ProfileArticle[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [pageFrom, setPageFrom] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingArticles, setLoadingArticles] = useState(false);

  const PAGE_SIZE = 6;

  const contributionData = useMemo<ContributionItem[]>(() => {
    const days = 28;
    const today = new Date();
    const counts: Record<string, number> = {};

    articles.forEach((article) => {
      if (!article.publish_timestamp) return;
      const date = new Date(article.publish_timestamp * 1000);
      const key = date.toISOString().slice(0, 10);
      counts[key] = (counts[key] || 0) + 1;
    });

    const data: ContributionItem[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const key = date.toISOString().slice(0, 10);
      data.push({ date: key, count: counts[key] || 0 });
    }
    return data;
  }, [articles]);

  const getContributionLevel = (count: number) => {
    if (count >= 4) return 4;
    if (count >= 3) return 3;
    if (count >= 2) return 2;
    if (count >= 1) return 1;
    return 0;
  };

  const handleViewToggle = (mode: "list" | "grid") => {
    setViewMode(mode);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (authLoading) return;
      if (!user?.id) {
        setProfile(null);
        return;
      }

      try {
        const res = await AuthService.getUserInfo(user.id);
        if (res.code === "200" && res.data) {
          const info = res.data as any;
          setProfile({
            id: Number(info.id ?? user.id),
            name: info.name || info.account || "未命名用户",
            avatar: info.avatar || DEFAULT_AVATAR,
            bio: info.bio || "这个人很低调，暂无简介",
            account: info.account || "",
            email: info.email || "",
            role: ROLE_MAP[String(info.role)] || "user",
            location: info.location || "未设置",
            website: info.website || "",
            joinDate: info.create_time ? formatToChinaTime(Number(info.create_time)).split(" ")[0] : "--",
            stats: {
              articles: articles.length,
              followers: info.followers || 0,
              following: info.following || 0,
            },
          });
        }
      } catch (err) {
        console.error("加载用户信息失败", err);
        message.error("加载用户信息失败");
      }
    };

    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id]);

  useEffect(() => {
    const fetchArticles = async (page: number) => {
      if (!user?.id) return;
      setLoadingArticles(true);
      try {
        const res = await ArticleService.listArticlesByUserIdPages({
          user_id: user.id,
          page_from: page,
          page_size: PAGE_SIZE,
        });

        const mapped: ProfileArticle[] = res.list.map((item) => ({
          id: item.id,
          title: item.title,
          content: item.summary || "",
          author: item.author,
          user_id: user.id,
          favorites: 0,
          praise: 0,
          views: 0,
          publish_time: item.publish_time ? formatToChinaTime(Number(item.publish_time)) : "暂未发布",
          update_time: item.publish_time ? formatToChinaTime(Number(item.publish_time)) : "",
          type: item.type,
          state: item.state,
          is_deleted: false,
          labels: [],
          categorys: [],
          publish_timestamp: item.publish_time ? Number(item.publish_time) : undefined,
        }));

        setArticles((prev) => (page === 1 ? mapped : [...prev, ...mapped]));
        const total = typeof res.total === "number" ? res.total : mapped.length;
        setHasMore(page * PAGE_SIZE < total);
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                stats: {
                  ...prev.stats,
                  articles: total,
                },
              }
            : prev,
        );
      } catch (err) {
        console.error("加载文章失败", err);
        message.error("加载文章失败");
      } finally {
        setLoadingArticles(false);
      }
    };

    if (!authLoading && user?.id) {
      fetchArticles(1);
      setPageFrom(1);
    } else {
      setArticles([]);
      setHasMore(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id]);

  const handleLoadMore = async () => {
    if (loadingArticles || !hasMore) return;
    const nextPage = pageFrom + 1;
    await (async () => {
      if (!user?.id) return;
      setPageFrom(nextPage);
      setLoadingArticles(true);
      try {
        const res = await ArticleService.listArticlesByUserIdPages({
          user_id: user.id,
          page_from: nextPage,
          page_size: PAGE_SIZE,
        });

        const mapped: ProfileArticle[] = res.list.map((item) => ({
          id: item.id,
          title: item.title,
          content: item.summary || "",
          author: item.author,
          user_id: user.id,
          favorites: 0,
          praise: 0,
          views: 0,
          publish_time: item.publish_time ? formatToChinaTime(Number(item.publish_time)) : "暂未发布",
          update_time: item.publish_time ? formatToChinaTime(Number(item.publish_time)) : "",
          type: item.type,
          state: item.state,
          is_deleted: false,
          labels: [],
          categorys: [],
          publish_timestamp: item.publish_time ? Number(item.publish_time) : undefined,
        }));

        const totalFromApi = typeof res.total === "number" ? res.total : undefined;
        setArticles((prev) => {
          const nextArticles = [...prev, ...mapped];
          const computedTotal = totalFromApi ?? nextArticles.length;
          setHasMore(nextPage * PAGE_SIZE < computedTotal);
          return nextArticles;
        });
      } catch (err) {
        console.error("加载更多文章失败", err);
        message.error("加载更多文章失败");
      } finally {
        setLoadingArticles(false);
      }
    })();
  };

  const profileData: UserProfile = profile || {
    id: Number(user?.id ?? 0),
    name: user?.name || user?.account || "未登录用户",
    avatar: DEFAULT_AVATAR,
    bio: user ? "这个人很低调，暂无简介" : "登录后查看个人资料",
    account: user?.account || "",
    email: user?.email || "",
    role: ROLE_MAP[String(user?.role ?? "user")] || "user",
    location: "未设置",
    website: "",
    joinDate: user?.login_time ? formatToChinaTime(Number(user.login_time)).split(" ")[0] : "--",
    stats: {
      articles: articles.length,
      followers: 0,
      following: 0,
    },
  };

  const activityFeed = useMemo(
    () =>
      articles.slice(0, 5).map((item) => ({
        id: item.id,
        text: "发布了新文章",
        subText: item.title,
        time: item.publish_time,
        icon: "📝",
        type: "article",
      })),
    [articles],
  );

  const popularTags = useMemo(() => FALLBACK_TAGS, []);

  useEffect(() => {
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            stats: {
              ...prev.stats,
              articles: articles.length,
            },
          }
        : prev,
    );
  }, [articles.length]);

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
                  <img src={profileData.avatar} alt={profileData.name} className={styles.avatar} />
                  <div className={styles.onlineIndicator}></div>
                </div>
                <div className={styles.userDetails}>
                  <h1 className={styles.userName}>{profileData.name}</h1>
                  <p className={styles.bio}>{profileData.bio}</p>
                  <div className={styles.metaInfo}>
                    <div className={styles.metaItem}>
                      <MapPin className={styles.metaIcon} size={14} />
                      <span>{profileData.location || "未设置"}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <Calendar className={styles.metaIcon} size={14} />
                      <span>{profileData.joinDate ? `${profileData.joinDate} 加入` : "--"}</span>
                    </div>
                    {profileData.website && (
                      <div className={styles.metaItem}>
                        <Globe className={styles.metaIcon} size={14} />
                        <a href={profileData.website} target="_blank" rel="noopener noreferrer">
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
                  <span className={styles.statNumber}>{profileData.stats.articles}</span>
                  <span className={styles.statLabel}>文章</span>
                </div>
                <div className={styles.statItem}>
                  <Users className={styles.statIcon} size={16} />
                  <span className={styles.statNumber}>{profileData.stats.followers}</span>
                  <span className={styles.statLabel}>粉丝</span>
                </div>
                <div className={styles.statItem}>
                  <Heart className={styles.statIcon} size={16} />
                  <span className={styles.statNumber}>{profileData.stats.following}</span>
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
              {articles.length === 0 ? (
                <div className={styles.emptyState}>暂无文章</div>
              ) : (
                articles.map((article) => (
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
                ))
              )}
            </div>
            <button className={styles.loadMoreButton} onClick={handleLoadMore} disabled={!hasMore || loadingArticles}>
              {loadingArticles ? "加载中..." : hasMore ? "加载更多文章" : "没有更多了"}
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

          {/* 贡献热力图 */}
          <div className={styles.widget}>
            <div className={styles.widgetHeader}>
              <Activity className={styles.widgetIcon} size={16} />
              <h3 className={styles.widgetTitle}>贡献热力图</h3>
            </div>
            <div className={styles.contributionHeaderRow}>
              <span className={styles.contributionHint}>近 4 周活动（文章、点赞、评论等）</span>
              <div className={styles.contributionLegend}>
                <span>低</span>
                <div className={styles.legendScale}>
                  {[0, 1, 2, 3, 4].map((lvl) => (
                    <span key={lvl} className={`${styles.legendBlock} ${styles[`level-${lvl}`]}`} />
                  ))}
                </div>
                <span>高</span>
              </div>
            </div>
            <div className={styles.contributionGrid}>
              {contributionData.map((item) => {
                const level = getContributionLevel(item.count);
                const dateLabel = new Date(item.date).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" });
                return (
                  <div
                    key={item.date}
                    className={`${styles.contributionCell} ${styles[`level-${level}`]}`}
                    title={`${dateLabel} · ${item.count} 次活动`}
                  />
                );
              })}
            </div>
            <div className={styles.contributionFooter}>持续创作能让热度更高哦！</div>
          </div>

          {/* 最近动态 */}
          <div className={styles.widget}>
            <div className={styles.widgetHeader}>
              <Activity className={styles.widgetIcon} size={16} />
              <h3 className={styles.widgetTitle}>最近动态</h3>
            </div>
            <div className={styles.recentActivity}>
              {activityFeed.length === 0 ? (
                <div className={styles.emptyState}>暂无动态</div>
              ) : (
                activityFeed.map((activity) => (
                  <div key={activity.id} className={styles.activityItem}>
                    <div className={styles.activityIcon}>{activity.icon}</div>
                    <div className={styles.activityContent}>
                      <div className={styles.activityText}>{activity.text}</div>
                      <div className={styles.activitySubtext}>{activity.subText}</div>
                      <div className={styles.activityTime}>{activity.time}</div>
                    </div>
                  </div>
                ))
              )}
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
