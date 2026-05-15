/** 文章评论（用户端） */
export interface ArticleComment {
  id: number;
  content: string;
  user: string;
  avatar: string;
  user_id: number;
  time: string;
  likes: number;
  is_liked: boolean;
  replies: ArticleComment[];
  reply_count: number;
}

/** 评论列表响应 */
export interface CommentListResponse {
  total: number;
  list: ArticleComment[];
}

/** 发表评论返回 */
export interface CreateCommentResponse {
  id: number;
  content: string;
  user: string;
  avatar: string;
  user_id: number;
  time: string;
  likes: number;
  is_liked: boolean;
  replies: ArticleComment[];
  reply_count: number;
}

/** 评论点赞 toggle 返回 */
export interface CommentPraiseResponse {
  is_praising: boolean;
  praise_count: number;
}

/** 管理端评论 */
export interface AdminComment {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    email: string;
    avatar: string;
  };
  article: {
    id: string;
    title: string;
  };
  parent_id: string;
  status: "approved" | "pending" | "rejected" | "spam";
  created_at: number;
  updated_at: number;
  likes: number;
  reply_count: number;
  is_reported: boolean;
  report_count: number;
  ip: string;
  user_agent: string;
}

/** 管理端评论列表响应 */
export interface AdminCommentListResponse {
  total: number;
  list: AdminComment[];
}

/** 批量操作响应 */
export interface BatchOperationResponse {
  ids: string[];
  affected: number;
}

/** 管理端评论统计 */
export interface CommentStatsResponse {
  total_comments: number;
  pending_comments: number;
  approved_comments: number;
  spam_comments: number;
  reported_comments: number;
}
