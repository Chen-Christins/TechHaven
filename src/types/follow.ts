/** 关注/粉丝列表中的用户信息 */
export interface FollowUser {
  id: number;
  name: string;
  account: string;
  avatar: string;
  bio: string;
  create_time: number;
  following_count: number;
  follower_count: number;
}

/** 关注/粉丝列表响应 */
export interface FollowListResponse {
  list: FollowUser[];
  total: number;
  offset: number;
}

/** 互相关注用户（发起会话搜索用） */
export interface MutualFollowUser {
  id: number;
  name: string;
  account: string;
  avatar: string;
}

/** 互相关注列表响应 */
export interface MutualFollowListResponse {
  list: MutualFollowUser[];
  total: number;
  offset: number;
  size: number;
}
