import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { encodeId } from "../../utils/hashId";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import "katex/dist/katex.min.css";
import mermaid from "mermaid";
import {
  Eye,
  Heart,
  MessageSquare,
  Clock,
  Calendar,
  FileText,
  Users,
  UserPlus,
  UserCheck,
  ThumbsUp,
  Send,
  Loader2,
} from "lucide-react";
import styles from "./ArticleView.module.css";
import FollowService from "../../services/followService";
import PraiseService from "../../services/praiseService";
import CommentService from "../../services/commentService";
import { useAuth } from "../../contexts/AuthContext";
import message from "../../components/message/Message";

interface Heading {
  id: string;
  text: string;
  level: number;
}

export interface AuthorStats {
  followers: number;
  articles: number;
  likes: number;
}

interface ArticleViewProps {
  title: string;
  content: string;
  className?: string;
  author: string;
  authorAvatar?: string;
  authorId?: string | number;
  articleId?: string | number;
  authorStats?: AuthorStats;
  views: number;
  praises: number;
  update_time: string;
  pushlish_time: string;
  categories?: Array<{ id: number; name: string; color: string }>;
  labels?: Array<{ id: number; name: string; color: string }>;
  readingTime?: number;
}

interface CommentItem {
  id: number;
  user: string;
  avatar: string;
  user_id?: number;
  content: string;
  time: string;
  likes: number;
  replies: CommentItem[];
  is_liked?: boolean;
  reply_count?: number;
}

const COMMENT_PAGE_SIZE = 20;

// 初始化 Mermaid 配置
mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  securityLevel: "loose",
  fontFamily: "monospace",
  fontSize: 14,
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    curve: "basis",
  },
});

// Mermaid 图表组件
const MermaidComponent: React.FC<{ code: string }> = ({ code }) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (elementRef.current) {
      try {
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        mermaid
          .render(id, code)
          .then(({ svg }) => {
            if (elementRef.current) {
              elementRef.current.innerHTML = svg;
            }
          })
          .catch((err) => {
            setError(`Mermaid 渲染错误: ${err.message}`);
          });
      } catch (err: any) {
        setError(`Mermaid 渲染错误: ${err.message}`);
      }
    }
  }, [code]);

  if (error) {
    return (
      <div className={styles.mermaidError}>
        <div className={styles.errorMessage}>{error}</div>
        <pre className={styles.errorCode}>{code}</pre>
      </div>
    );
  }

  return <div ref={elementRef} className={styles.mermaidDiagram} />;
};

// 使用 react-markdown 期望的标题属性类型
interface HeadingComponentProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: number;
  node?: any;
}

const ArticleView: React.FC<ArticleViewProps> = ({
  title,
  author,
  authorAvatar,
  authorId,
  articleId,
  authorStats,
  views,
  praises,
  update_time,
  pushlish_time,
  content,
  className = "",
  categories = [],
  labels = [],
  readingTime,
}) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const isOwnArticle = isAuthenticated && authorId != null && String(user?.id) === String(authorId);
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [isContentReady, setIsContentReady] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // 互动状态
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followersCount, setFollowersCount] = useState(authorStats?.followers ?? 0);
  const [isLiked, setIsLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [likesCount, setLikesCount] = useState(praises);
  const [authorLikesCount, setAuthorLikesCount] = useState(authorStats?.likes ?? 0);
  const [commentsList, setCommentsList] = useState<CommentItem[]>([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [replyToId, setReplyToId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [likedCommentIds, setLikedCommentIds] = useState<Set<number>>(new Set());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  // 页面加载时判断是否已关注作者、是否已点赞
  useEffect(() => {
    if (!isAuthenticated) return;
    if (authorId) {
      FollowService.isFollowing(authorId)
        .then(setIsFollowing)
        .catch(() => {});
    }
    if (articleId) {
      PraiseService.isPraising(articleId)
        .then(setIsLiked)
        .catch(() => {});
    }
  }, [isAuthenticated, authorId, articleId]);

  // 加载评论列表
  useEffect(() => {
    if (!articleId) return;
    setCommentLoading(true);
    CommentService.getList({ article_id: articleId, offset: 0, size: COMMENT_PAGE_SIZE })
      .then((data) => {
        setCommentsList(data.list);
        const liked = new Set<number>();
        const collectLiked = (comments: CommentItem[]) => {
          comments.forEach((c) => {
            if (c.is_liked) liked.add(c.id);
            if (c.replies?.length) collectLiked(c.replies);
          });
        };
        collectLiked(data.list);
        setLikedCommentIds(liked);
      })
      .catch(() => {})
      .finally(() => setCommentLoading(false));
  }, [articleId]);

  const handleFollowToggle = async () => {
    if (!isAuthenticated) {
      message.info("请先登录");
      navigate("/auth");
      return;
    }
    if (!authorId) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await FollowService.unfollow(authorId);
        setIsFollowing(false);
        setFollowersCount((c) => Math.max(0, c - 1));
        message.success("已取消关注");
      } else {
        await FollowService.follow(authorId);
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

  const handleLikeToggle = async () => {
    if (!isAuthenticated) {
      message.info("请先登录");
      navigate("/auth");
      return;
    }
    if (!articleId) return;
    setLikeLoading(true);
    try {
      const res = await PraiseService.toggle(articleId);
      setIsLiked(res.is_praising);
      setLikesCount(res.praise_count);
      setAuthorLikesCount((c) => (res.is_praising ? c + 1 : Math.max(0, c - 1)));
    } catch (err: any) {
      message.error(err?.response?.data?.msg || err?.message || "操作失败");
    } finally {
      setLikeLoading(false);
    }
  };

  const handleCommentSubmit = async () => {
    const trimmed = commentText.trim();
    if (!trimmed || !articleId) return;
    if (!isAuthenticated) {
      message.info("请先登录");
      navigate("/auth");
      return;
    }
    try {
      const newComment = await CommentService.create({
        article_id: articleId,
        content: trimmed,
      });
      setCommentsList((prev) => [
        {
          id: newComment.id,
          user: newComment.user,
          avatar: newComment.avatar,
          user_id: newComment.user_id,
          content: newComment.content,
          time: newComment.time,
          likes: newComment.likes,
          replies: [],
          is_liked: newComment.is_liked,
          reply_count: newComment.reply_count,
        },
        ...prev,
      ]);
      setCommentText("");
      message.success("评论发表成功");
    } catch (err: any) {
      message.error(err?.response?.data?.msg || err?.msg || err?.message || "评论发表失败");
    }
  };

  const handleReplySubmit = async (parentId: number) => {
    const trimmed = replyText.trim();
    if (!trimmed || !articleId) return;
    if (!isAuthenticated) {
      message.info("请先登录");
      navigate("/auth");
      return;
    }
    try {
      const newReply = await CommentService.create({
        article_id: articleId,
        content: trimmed,
        parent_id: parentId,
      });
      setCommentsList((prev) =>
        prev.map((c) => {
          if (c.id === parentId) {
            return {
              ...c,
              replies: [
                ...c.replies,
                {
                  id: newReply.id,
                  user: newReply.user,
                  avatar: newReply.avatar,
                  user_id: newReply.user_id,
                  content: newReply.content,
                  time: newReply.time,
                  likes: newReply.likes,
                  replies: [],
                  is_liked: newReply.is_liked,
                },
              ],
            };
          }
          return c;
        }),
      );
      setReplyText("");
      setReplyToId(null);
      message.success("回复发表成功");
    } catch (err: any) {
      message.error(err?.response?.data?.msg || err?.msg || err?.message || "回复发表失败");
    }
  };

  const handleCommentLike = async (commentId: number) => {
    if (!isAuthenticated) {
      message.info("请先登录");
      navigate("/auth");
      return;
    }
    try {
      const res = await CommentService.togglePraise(commentId);
      const delta = res.is_praising ? 1 : -1;
      setLikedCommentIds((prev) => {
        const next = new Set(prev);
        if (res.is_praising) {
          next.add(commentId);
        } else {
          next.delete(commentId);
        }
        return next;
      });
      setCommentsList((prev) => prev.map((c) => toggleCommentLike(c, commentId, delta)));
    } catch (err: any) {
      message.error(err?.response?.data?.msg || err?.msg || err?.message || "操作失败");
    }
  };

  // 递归查找并更新评论/回复的点赞数
  const toggleCommentLike = (comment: CommentItem, targetId: number, delta: number): CommentItem => {
    if (comment.id === targetId) {
      return { ...comment, likes: comment.likes + delta };
    }
    if (comment.replies?.length) {
      return {
        ...comment,
        replies: comment.replies.map((r) => toggleCommentLike(r, targetId, delta)),
      };
    }
    return comment;
  };

  // 递归更新评论/回复的内容
  const updateComment = (comment: CommentItem, targetId: number, newContent: string): CommentItem => {
    if (comment.id === targetId) {
      return { ...comment, content: newContent };
    }
    if (comment.replies?.length) {
      return {
        ...comment,
        replies: comment.replies.map((r) => updateComment(r, targetId, newContent)),
      };
    }
    return comment;
  };

  const handleStartEdit = (comment: CommentItem) => {
    setEditingId(comment.id);
    setEditText(comment.content);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const handleSaveEdit = async (commentId: number) => {
    const trimmed = editText.trim();
    if (!trimmed || trimmed === commentsList.find((c) => c.id === commentId)?.content) return;
    try {
      await CommentService.update({ id: commentId, content: trimmed });
      setCommentsList((prev) => prev.map((c) => updateComment(c, commentId, trimmed)));
      setEditingId(null);
      setEditText("");
      message.success("评论已更新");
    } catch (err: any) {
      message.error(err?.response?.data?.msg || err?.msg || err?.message || "编辑失败");
    }
  };

  // 生成更安全的 ID
  const generateId = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  // 提取标题
  useEffect(() => {
    const extractHeadings = (markdown: string): Heading[] => {
      const headingRegex = /^(#{1,6})\s+(.+)$/gm;
      const matches: Heading[] = [];
      let match;

      while ((match = headingRegex.exec(markdown)) !== null) {
        const level = match[1].length;
        const text = match[2].trim();
        const id = generateId(text);

        matches.push({ id, text, level });
      }

      return matches;
    };

    const extractedHeadings = extractHeadings(content);
    setHeadings(extractedHeadings);

    // 延迟设置内容准备就绪，确保 DOM 已经渲染
    setTimeout(() => {
      setIsContentReady(true);
    }, 100);
  }, [content]);

  // 设置 Intersection Observer 来跟踪活跃标题
  useEffect(() => {
    if (!contentRef.current || headings.length === 0) return;

    // 清理旧的 observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const options: IntersectionObserverInit = {
      rootMargin: "-20% 0px -60% 0px",
      threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveId(entry.target.id);
        }
      });
    }, options);

    // 观察所有标题元素
    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) {
        observer.observe(element);
      }
    });

    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [headings]);

  // 修复目录点击跳转
  const handleTocClick = useCallback((id: string, event: React.MouseEvent) => {
    event.preventDefault();

    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      // 更新活跃ID
      setActiveId(id);

      // 更新URL的hash（可选）
      window.history.pushState(null, "", `#${id}`);
    }
  }, []);

  // 复制代码功能
  const handleCopyCode = useCallback((code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      // console.log('代码已复制到剪贴板');
    });
  }, []);

  // 创建标题组件
  const createHeadingComponent = (level: number) => {
    return ({ children, ...props }: HeadingComponentProps) => {
      const text = React.Children.toArray(children).join("");
      const id = generateId(text);

      switch (level) {
        case 1:
          return (
            <h1 id={id} {...props}>
              {children}
            </h1>
          );
        case 2:
          return (
            <h2 id={id} {...props}>
              {children}
            </h2>
          );
        case 3:
          return (
            <h3 id={id} {...props}>
              {children}
            </h3>
          );
        case 4:
          return (
            <h4 id={id} {...props}>
              {children}
            </h4>
          );
        case 5:
          return (
            <h5 id={id} {...props}>
              {children}
            </h5>
          );
        case 6:
          return (
            <h6 id={id} {...props}>
              {children}
            </h6>
          );
        default:
          return (
            <h2 id={id} {...props}>
              {children}
            </h2>
          );
      }
    };
  };

  // 简化段落组件 - 不要干预代码块处理
  const ParagraphComponent: React.FC<React.HTMLAttributes<HTMLParagraphElement> & { node?: any }> = ({ children, ...props }) => {
    return <p {...props}>{children}</p>;
  };

  const getTocItemClass = (level: number, id: string) => {
    const baseClass = styles.tocItem;
    const levelClass = level === 1 ? styles.tocItemH1 : level === 2 ? styles.tocItemH2 : styles.tocItemH3;
    const activeClass = id === activeId ? styles.active : "";

    return `${baseClass} ${levelClass} ${activeClass}`.trim();
  };

  return (
    <div className={`${styles.container} ${className} ${!isContentReady ? styles.loading : styles.ready}`} ref={contentRef}>
      <aside className={styles.sidebar}>
        {/* 作者卡片 */}
        <div className={styles.authorCard}>
          <div className={styles.authorCardTop}>
            <div className={styles.authorCardAvatar} onClick={() => authorId && navigate(`/profile/${encodeId(authorId)}`)}>
              <img
                src={authorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(author)}&background=random&size=96`}
                alt={author}
                className={styles.authorCardAvatarImg}
              />
            </div>
            <div className={styles.authorCardInfo}>
              <span className={styles.authorCardName} onClick={() => authorId && navigate(`/profile/${encodeId(authorId)}`)}>
                {author}
              </span>
              <span className={styles.authorCardMeta}>{pushlish_time} 发布</span>
              {authorStats && (
                <div className={styles.authorCardStats}>
                  <span className={styles.authorStatItem}>
                    <FileText size={12} />
                    {authorStats.articles}
                  </span>
                  <span className={styles.authorStatItem}>
                    <Users size={12} />
                    {followersCount}
                  </span>
                  <span className={styles.authorStatItem}>
                    <Heart size={12} />
                    {authorLikesCount}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className={styles.authorCardActions}>
            {!isOwnArticle && (
              <button
                className={`${styles.followButton} ${isFollowing ? styles.following : ""}`}
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
                    关注作者
                  </>
                )}
              </button>
            )}
            <button
              className={`${styles.followButton} ${isLiked ? styles.following : ""}`}
              onClick={handleLikeToggle}
              disabled={likeLoading}
            >
              {likeLoading ? (
                <Loader2 size={14} className={styles.loadingSpin} />
              ) : (
                <>
                  <ThumbsUp size={14} className={isLiked ? styles.likeIconActive : ""} />
                  {isLiked ? "已点赞" : "点赞文章"}
                </>
              )}
            </button>
          </div>
        </div>

        {(categories.length > 0 || labels.length > 0) && (
          <div className={styles.tagCard}>
            <div className={styles.tagCardTitle}>分类 & 标签</div>
            <div className={styles.tagCardContent}>
              {categories.map((cat) => (
                <span key={`cat-${cat.id}`} className={styles.categoryBadge}>
                  {cat.name}
                </span>
              ))}
              {labels.map((label) => (
                <span key={`label-${label.id}`} className={styles.labelTag}>
                  {label.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {headings.length > 0 && (
          <nav className={styles.toc}>
            <div className={styles.tocTitle}>目录</div>
            <div className={styles.tocList}>
              {headings.map((heading) => (
                <a
                  key={heading.id}
                  href={`#${heading.id}`}
                  className={getTocItemClass(heading.level, heading.id)}
                  onClick={(e) => handleTocClick(heading.id, e)}
                >
                  {heading.text}
                </a>
              ))}
            </div>
          </nav>
        )}
      </aside>
      <div className={styles.content}>
        <article className={styles.article}>
          {/* 文章头部 */}
          <header className={styles.articleHeader}>
            <h1 className={styles.title}>{title}</h1>

            <div className={styles.metaRow}>
              <span className={styles.metaItem}>
                <Calendar size={13} />
                {pushlish_time} 发布
              </span>
              {update_time !== pushlish_time && <span className={styles.metaItem}>{update_time} 更新</span>}
              <span className={styles.metaItem}>
                <Eye size={14} />
                {views} 阅读
              </span>
              <span className={styles.metaItem}>
                <Heart size={14} />
                {likesCount} 点赞
              </span>
              <span className={styles.metaItem}>
                <MessageSquare size={14} />
                {commentsList.length} 评论
              </span>
              {readingTime && (
                <span className={styles.metaItem}>
                  <Clock size={14} />
                  {readingTime} 分钟阅读
                </span>
              )}
            </div>
          </header>

          <div className={`${styles.markdownBody} ${!isContentReady ? styles.contentLoading : styles.contentReady}`}>
            {!isContentReady && (
              <div className={styles.loadingIndicator}>
                <div className={styles.spinner}></div>
                <span>正在渲染文章内容...</span>
              </div>
            )}
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                // 暂时移除自定义 code 组件，使用默认处理
                // code: CodeBlock,
                p: ParagraphComponent,
                h1: createHeadingComponent(1),
                h2: createHeadingComponent(2),
                h3: createHeadingComponent(3),
                h4: createHeadingComponent(4),
                h5: createHeadingComponent(5),
                h6: createHeadingComponent(6),
                // 只对代码块进行自定义处理
                code: ({ className, children }) => {
                  const codeContent = String(children || "");
                  const language = className?.replace("language-", "") || "";

                  // 如果没有语言标识，认为是行内代码
                  if (!className) {
                    return <code className={styles.inlineCode}>{codeContent}</code>;
                  }

                  // 如果是 Mermaid 代码，使用 MermaidComponent
                  if (language === "mermaid") {
                    return (
                      <div className={styles.mermaidWrapper}>
                        <div className={styles.codeHeader}>
                          <span className={styles.languageTag}>Mermaid 图表</span>
                          <button className={styles.copyButton} onClick={() => handleCopyCode(codeContent.trim())}>
                            复制
                          </button>
                        </div>
                        <MermaidComponent code={codeContent.trim()} />
                      </div>
                    );
                  }

                  // 其他语言标识的是块级代码
                  return (
                    <div className={styles.codeBlockWrapper}>
                      <div className={styles.codeHeader}>
                        <span className={styles.languageTag}>{language}</span>
                        <button className={styles.copyButton} onClick={() => handleCopyCode(codeContent)}>
                          复制
                        </button>
                      </div>
                      <SyntaxHighlighter
                        style={vscDarkPlus}
                        language={language}
                        PreTag="div"
                        showLineNumbers={true}
                        customStyle={{
                          margin: 0,
                          borderRadius: "0 0 8px 8px",
                          fontSize: "14px",
                        }}
                      >
                        {codeContent}
                      </SyntaxHighlighter>
                    </div>
                  );
                },
              }}
              skipHtml={false}
              unwrapDisallowed={false}
            >
              {content}
            </ReactMarkdown>
          </div>
        </article>

        {/* 评论区域 */}
        <div className={styles.commentSection}>
          <div className={styles.commentHeader}>
            <h3 className={styles.commentTitle}>
              <MessageSquare size={18} />
              评论 ({commentsList.length})
            </h3>
            <button className={styles.writeCommentButton} onClick={() => setShowCommentInput(!showCommentInput)}>
              {showCommentInput ? "收起" : "写评论"}
            </button>
          </div>

          {/* 评论输入框 */}
          {showCommentInput && (
            <div className={styles.commentInputWrapper}>
              <textarea
                className={styles.commentTextarea}
                placeholder="写下你的想法..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={3}
              />
              <div className={styles.commentInputFooter}>
                <span className={styles.commentHint}>支持 Markdown 语法</span>
                <button className={styles.commentSubmitButton} onClick={handleCommentSubmit} disabled={!commentText.trim()}>
                  <Send size={14} />
                  发布
                </button>
              </div>
            </div>
          )}

          {/* 评论列表 */}
          <div className={styles.commentList}>
            {commentLoading ? (
              <div className={styles.commentEmpty}>加载评论中...</div>
            ) : commentsList.length === 0 ? (
              <div className={styles.commentEmpty}>暂无评论，快来抢沙发吧~</div>
            ) : (
              commentsList.map((comment) => (
                <React.Fragment key={comment.id}>
                  <div className={styles.commentItem}>
                    <div className={styles.commentAvatar}>
                      <img
                        src={
                          comment.avatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.user)}&background=random&size=40`
                        }
                        alt={comment.user}
                      />
                    </div>
                    <div className={styles.commentBody}>
                      <div className={styles.commentMeta}>
                        <span className={styles.commentUser}>{comment.user}</span>
                        <span className={styles.commentTime}>{comment.time}</span>
                      </div>
                      {editingId === comment.id ? (
                        <div className={styles.commentEditSection}>
                          <textarea
                            className={styles.commentTextarea}
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            rows={3}
                          />
                          <div className={styles.commentEditActions}>
                            <button
                              className={styles.commentEditSave}
                              onClick={() => handleSaveEdit(comment.id)}
                              disabled={!editText.trim() || editText.trim() === comment.content}
                            >
                              保存
                            </button>
                            <button className={styles.commentEditCancel} onClick={handleCancelEdit}>
                              取消
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className={styles.commentContent}>
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{comment.content}</ReactMarkdown>
                        </div>
                      )}
                      <div className={styles.commentActions}>
                        <button
                          className={`${styles.commentActionButton} ${likedCommentIds.has(comment.id) ? styles.commentLiked : ""}`}
                          onClick={() => handleCommentLike(comment.id)}
                        >
                          <ThumbsUp size={12} />
                          {comment.likes > 0 ? comment.likes : "赞"}
                        </button>
                        <button
                          className={styles.commentActionButton}
                          onClick={() => setReplyToId(replyToId === comment.id ? null : comment.id)}
                        >
                          回复
                        </button>
                        {isAuthenticated && user?.id === comment.user_id && (
                          <button className={styles.commentActionButton} onClick={() => handleStartEdit(comment)}>
                            编辑
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 子回复列表 */}
                  {comment.replies.length > 0 && (
                    <div className={styles.replyList}>
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className={styles.replyItem}>
                          <div className={styles.commentAvatar}>
                            <img
                              src={
                                reply.avatar ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(reply.user)}&background=random&size=32`
                              }
                              alt={reply.user}
                            />
                          </div>
                          <div className={styles.commentBody}>
                            <div className={styles.commentMeta}>
                              <span className={styles.commentUser}>{reply.user}</span>
                              <span className={styles.commentTime}>{reply.time}</span>
                            </div>
                            {editingId === reply.id ? (
                              <div className={styles.commentEditSection}>
                                <textarea
                                  className={styles.commentTextarea}
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  rows={2}
                                />
                                <div className={styles.commentEditActions}>
                                  <button
                                    className={styles.commentEditSave}
                                    onClick={() => handleSaveEdit(reply.id)}
                                    disabled={!editText.trim() || editText.trim() === reply.content}
                                  >
                                    保存
                                  </button>
                                  <button className={styles.commentEditCancel} onClick={handleCancelEdit}>
                                    取消
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className={styles.commentContent}>
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{reply.content}</ReactMarkdown>
                              </div>
                            )}
                            <div className={styles.commentActions}>
                              <button
                                className={`${styles.commentActionButton} ${likedCommentIds.has(reply.id) ? styles.commentLiked : ""}`}
                                onClick={() => handleCommentLike(reply.id)}
                              >
                                <ThumbsUp size={12} />
                                {reply.likes > 0 ? reply.likes : "赞"}
                              </button>
                              {isAuthenticated && user?.id === reply.user_id && (
                                <button className={styles.commentActionButton} onClick={() => handleStartEdit(reply)}>
                                  编辑
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 回复输入框 */}
                  {replyToId === comment.id && (
                    <div className={styles.replyInputWrapper}>
                      <textarea
                        className={styles.commentTextarea}
                        placeholder={`回复 ${comment.user}...`}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows={2}
                      />
                      <div className={styles.commentInputFooter}>
                        <span className={styles.commentHint}>支持 Markdown 语法</span>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            className={styles.writeCommentButton}
                            onClick={() => {
                              setReplyToId(null);
                              setReplyText("");
                            }}
                          >
                            取消
                          </button>
                          <button
                            className={styles.commentSubmitButton}
                            onClick={() => handleReplySubmit(comment.id)}
                            disabled={!replyText.trim()}
                          >
                            <Send size={14} />
                            回复
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleView;
