import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./ProfilePage.module.css";
import Navbar from "../../components/navbar/Navbar";
import Footer from "../../components/footer/Footer";
import { encodeId, decodeId } from "../../utils/hashId";
import BackToTop from "../../components/backToTop/BackToTop";
import { useAuth } from "../../contexts/AuthContext";
import AuthService from "../../services/authService";
import ArticleService from "../../services/articleService";
import LabelService from "../../services/labelService";
import {
  MapPin,
  Mail,
  Link2,
  Users,
  Heart,
  MessageSquare,
  Eye,
  Clock,
  Hash,
  BookOpen,
  Star,
  UserPlus,
  UserCheck,
  Loader2,
  Edit,
} from "lucide-react";
import type { Article, UserProfile } from "../../types/index";
import type { UserStats } from "../../services/authService";
import FollowService from "../../services/followService";
import message from "../../components/message/Message";

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

const TABS = [
  { key: "overview", label: "概览" },
  { key: "articles", label: "文章" },
  { key: "tags", label: "标签" },
] as const;

const PAGE_SIZE = 15;

type TabKey = (typeof TABS)[number]["key"];

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { id: encodedId } = useParams<{ id: string }>();
  const id = encodedId ? decodeId(encodedId, "user") : null;
  const { user: currentUser, isAuthenticated } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [tags, setTags] = useState<{ name: string; count: number; color: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [articleTotal, setArticleTotal] = useState(0);
  const [articlePage, setArticlePage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  const isOwnProfile = isAuthenticated && String(currentUser?.id) === String(id);

  useEffect(() => {
    if (!id) return;

    const fetchProfileData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [userResponse, articlesResponse, labelsData, statsData] = await Promise.all([
          AuthService.getUserInfo(id).catch(() => null),
          ArticleService.listArticlesByUserIdPages({
            user_id: id,
            page_from: 1,
            page_size: PAGE_SIZE,
            state: 2,
          }).catch(() => null),
          LabelService.queryLabel({ user_id: id }).catch(() => []),
          AuthService.getUserStats(id).catch(() => null),
        ]);

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
            followers: userData?.follower_count ?? 0,
            following: userData?.following_count ?? 0,
          },
        };
        setProfile(mappedProfile);
        setFollowersCount(mappedProfile.stats.followers);

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
            categorys: item.categories || item.categorys || [],
          }));
          setArticles(mappedArticles);
          setArticleTotal(articlesResponse.total);
        }

        if (Array.isArray(labelsData) && labelsData.length > 0) {
          const tagColors = ["#61DAFB", "#3178C6", "#339933", "#4FC08D", "#7B68EE", "#FF6B6B"];
          const mappedTags = labelsData.slice(0, 12).map((label: any, i: number) => ({
            name: label.name || `标签${i + 1}`,
            count: label.count ?? 0,
            color: label.color || tagColors[i % tagColors.length],
          }));
          setTags(mappedTags);
        }

        if (statsData) {
          setUserStats(statsData);
        }
      } catch (err: any) {
        setError(err.message || "加载失败");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [id]);

  // 独立检查关注状态（等 auth 就绪后再查）
  useEffect(() => {
    if (!id || !isAuthenticated || isOwnProfile) return;
    FollowService.isFollowing(id)
      .then(setIsFollowing)
      .catch(() => {});
  }, [id, isAuthenticated, isOwnProfile]);

  const handleLoadMore = async () => {
    if (!id || loadingMore) return;
    const nextPage = articlePage + 1;
    setLoadingMore(true);
    try {
      const response = await ArticleService.listArticlesByUserIdPages({
        user_id: id,
        page_from: nextPage,
        page_size: PAGE_SIZE,
        state: 2,
      });
      if (response?.list) {
        const newArticles: Article[] = response.list.map((item: any) => ({
          id: item.id,
          title: item.title,
          content: item.summary || "",
          author: item.author || profile?.name || "",
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
          categorys: item.categories || item.categorys || [],
        }));
        setArticles((prev) => [...prev, ...newArticles]);
        setArticlePage(nextPage);
      }
    } catch (err: any) {
      message.error(err?.message || "加载失败");
    } finally {
      setLoadingMore(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!isAuthenticated) {
      message.info("请先登录");
      navigate("/auth");
      return;
    }
    if (!id) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await FollowService.unfollow(id);
        setIsFollowing(false);
        setFollowersCount((c) => Math.max(0, c - 1));
        message.success("已取消关注");
      } else {
        await FollowService.follow(id);
        setIsFollowing(true);
        setFollowersCount((c) => c + 1);
        message.success("关注成功");
      }
    } catch (err: any) {
      message.error(err?.response?.data?.msg || err?.message || "操作失败");
    } finally {
      setFollowLoading(false);
    }
  };

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

  const renderOverview = () => (
    <div className={styles.overviewContent}>
      {userStats && (
        <div className={styles.statsCards}>
          <div className={styles.statsCard}>
            <BookOpen size={20} />
            <span className={styles.statsCardNumber}>{userStats.published_articles}</span>
            <span className={styles.statsCardLabel}>已发布文章</span>
          </div>
          <div className={styles.statsCard}>
            <Eye size={20} />
            <span className={styles.statsCardNumber}>{userStats.total_views}</span>
            <span className={styles.statsCardLabel}>总浏览量</span>
          </div>
          <div className={styles.statsCard}>
            <Heart size={20} />
            <span className={styles.statsCardNumber}>{userStats.total_likes}</span>
            <span className={styles.statsCardLabel}>总点赞</span>
          </div>
          <div className={styles.statsCard}>
            <MessageSquare size={20} />
            <span className={styles.statsCardNumber}>{userStats.total_comments}</span>
            <span className={styles.statsCardLabel}>总评论</span>
          </div>
        </div>
      )}

      {articles.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>精选文章</h2>
          </div>
          <div className={styles.featuredGrid}>
            {articles.slice(0, 6).map((article) => (
              <article
                key={article.id}
                className={styles.featuredCard}
                onClick={() => navigate(`/article/${encodeId(article.id, "article")}`)}
              >
                <div className={styles.featuredCardHeader}>
                  <span className={styles.articleCategoryBadge}>
                    {Array.isArray(article.categorys) && article.categorys.length > 0
                      ? typeof article.categorys[0] === "object"
                        ? (article.categorys[0] as any).name
                        : article.categorys[0]
                      : "未分类"}
                  </span>
                </div>
                <h3 className={styles.featuredCardTitle}>{article.title}</h3>
                <p className={styles.featuredCardExcerpt}>
                  {(article.content || "").substring(0, 120)}
                  {(article.content || "").length > 120 ? "..." : ""}
                </p>
                <div className={styles.featuredCardFooter}>
                  <span className={styles.featuredCardDate}>{article.publish_time}</span>
                  <div className={styles.featuredCardStats}>
                    <span>
                      <Eye size={13} /> {article.views}
                    </span>
                    <span>
                      <Heart size={13} /> {article.praise}
                    </span>
                    <span>
                      <MessageSquare size={13} /> {article.favorites}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {articles.length === 0 && (
        <div className={styles.emptyState}>
          <BookOpen size={48} className={styles.emptyIcon} />
          <h3>暂无文章</h3>
          <p>该用户还没有发布文章。</p>
        </div>
      )}
    </div>
  );

  const renderArticles = () => (
    <div className={styles.articlesContent}>
      <div className={styles.articlesToolbar}>
        <span className={styles.articlesCount}>{articleTotal} 篇文章</span>
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
        <div className={styles.emptyState}>
          <BookOpen size={48} className={styles.emptyIcon} />
          <h3>暂无文章</h3>
          <p>暂无文章可显示。</p>
        </div>
      ) : (
        <div className={`${styles.articlesList} ${viewMode === "grid" ? styles.gridView : styles.listView}`}>
          {articles.map((article) => (
            <article
              key={article.id}
              className={`${styles.articleCard} ${viewMode === "grid" ? styles.gridCard : styles.listCard}`}
              onClick={() => navigate(`/article/${encodeId(article.id, "article")}`)}
            >
              <div className={styles.articleHeader}>
                <span className={styles.articleCategoryBadge}>
                  {Array.isArray(article.categorys) && article.categorys.length > 0
                    ? typeof article.categorys[0] === "object"
                      ? (article.categorys[0] as any).name
                      : article.categorys[0]
                    : "未分类"}
                </span>
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
                  {(article.labels?.length || 0) > 3 && <span className={styles.moreTags}>+{(article.labels?.length || 0) - 3}</span>}
                </div>
                <div className={styles.articleStats}>
                  <span>
                    <Eye size={14} /> {article.views}
                  </span>
                  <span>
                    <Heart size={14} /> {article.praise}
                  </span>
                  <span>
                    <MessageSquare size={14} /> {article.favorites}
                  </span>
                  <span>
                    <Clock size={14} /> 5分钟
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {articles.length < articleTotal && (
        <button className={styles.loadMoreButton} onClick={handleLoadMore} disabled={loadingMore}>
          {loadingMore ? (
            <>
              <Loader2 size={14} className={styles.loadingSpin} />
              加载中...
            </>
          ) : (
            "加载更多文章"
          )}
        </button>
      )}
    </div>
  );

  const renderTags = () => (
    <div className={styles.tagsContent}>
      {tags.length === 0 ? (
        <div className={styles.emptyState}>
          <Hash size={48} className={styles.emptyIcon} />
          <h3>暂无标签</h3>
          <p>该用户还没有创建标签。</p>
        </div>
      ) : (
        <div className={styles.tagsGrid}>
          {tags.map((tag) => (
            <div key={tag.name} className={styles.tagCard} style={{ borderLeftColor: tag.color }}>
              <div className={styles.tagCardHeader}>
                <span className={styles.tagCardName} style={{ color: tag.color }}>
                  <Hash size={14} />
                  {tag.name}
                </span>
                <span className={styles.tagCardCount}>{tag.count} 篇文章</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderMainContent = () => {
    switch (activeTab) {
      case "overview":
        return renderOverview();
      case "articles":
        return renderArticles();
      case "tags":
        return renderTags();
      default:
        return null;
    }
  };

  return (
    <div className={styles.profile}>
      <Navbar />

      {/* Main layout */}
      <div className={styles.mainContent}>
        {/* Left sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarInner}>
            <img src={profile.avatar} alt={profile.name} className={styles.avatar} />

            <div className={styles.sidebarNameBlock}>
              <h1 className={styles.fullName}>{profile.name}</h1>
              <span className={styles.username}>@{profile.account || `user_${profile.id}`}</span>
            </div>

            {profile.bio && <p className={styles.bio}>{profile.bio}</p>}

            <div className={styles.sidebarActions}>
              {isOwnProfile ? (
                <button className={styles.editButton} onClick={() => navigate("/personal?tab=edit")}>
                  <Edit size={14} />
                  编辑资料
                </button>
              ) : (
                <button
                  className={`${styles.followButton} ${isFollowing ? styles.followingButton : ""}`}
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                >
                  {followLoading ? (
                    <Loader2 size={14} className={styles.loadingSpin} />
                  ) : isFollowing ? (
                    <>
                      <UserCheck size={14} />
                      已关注
                    </>
                  ) : (
                    <>
                      <UserPlus size={14} />
                      关注
                    </>
                  )}
                </button>
              )}
            </div>

            <div className={styles.sidebarStats}>
              <button
                className={styles.sidebarStat}
                onClick={() => isOwnProfile && navigate("/personal?tab=followers")}
                disabled={!isOwnProfile}
              >
                <Users size={14} />
                <strong>{followersCount}</strong> 粉丝
              </button>
              <button
                className={styles.sidebarStat}
                onClick={() => isOwnProfile && navigate("/personal?tab=following")}
                disabled={!isOwnProfile}
              >
                <Heart size={14} />
                <strong>{profile.stats.following}</strong> 关注
              </button>
            </div>

            <div className={styles.sidebarMeta}>
              {profile.location && (
                <div className={styles.sidebarMetaItem}>
                  <MapPin size={14} />
                  <span>{profile.location}</span>
                </div>
              )}
              {profile.email && (
                <div className={styles.sidebarMetaItem}>
                  <Mail size={14} />
                  <a href={`mailto:${profile.email}`}>{profile.email}</a>
                </div>
              )}
              {profile.website && (
                <div className={styles.sidebarMetaItem}>
                  <Link2 size={14} />
                  <a href={profile.website} target="_blank" rel="noopener noreferrer">
                    {profile.website.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              )}
              {profile.joinDate && (
                <div className={styles.sidebarMetaItem}>
                  <Clock size={14} />
                  <span>加入于 {profile.joinDate}</span>
                </div>
              )}
            </div>

            {userStats && (
              <div className={styles.sidebarAchievements}>
                <h3 className={styles.achievementsTitle}>成就</h3>
                <div className={styles.achievementsGrid}>
                  <div className={styles.achievement}>
                    <BookOpen size={16} />
                    <span>{userStats.published_articles} 篇文章</span>
                  </div>
                  <div className={styles.achievement}>
                    <Eye size={16} />
                    <span>{userStats.total_views} 次浏览</span>
                  </div>
                  <div className={styles.achievement}>
                    <Star size={16} />
                    <span>{userStats.total_likes} 次点赞</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main content area */}
        <main className={styles.content}>
          <nav className={styles.contentTabs}>
            {TABS.map((tab) => (
              <button
                key={tab.key}
                className={`${styles.contentTab} ${activeTab === tab.key ? styles.contentTabActive : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
                {tab.key === "articles" && articleTotal > 0 && <span className={styles.contentTabCount}>{articleTotal}</span>}
              </button>
            ))}
          </nav>
          {renderMainContent()}
        </main>
      </div>

      <Footer startYear={2025} />
      <BackToTop />
    </div>
  );
};

export default Profile;
