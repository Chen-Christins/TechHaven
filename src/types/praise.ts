/** 点赞列表项（按文章查） */
export interface PraiseItem {
  id: number;
  user_id: number;
  article_id: number;
  user_name: string;
  user_avatar: string;
  create_time: number;
}

/** 点赞列表项（按用户查） */
export interface PraiseArticleItem {
  id: number;
  user_id: number;
  article_id: number;
  title: string;
  create_time: number;
}

/** 点赞 toggle 返回 */
export interface PraiseToggleResponse {
  is_praising: boolean;
  praise_count: number;
}

/** 点赞列表返回 */
export interface PraiseListResponse {
  list: (PraiseItem | PraiseArticleItem)[];
  total: number;
}
