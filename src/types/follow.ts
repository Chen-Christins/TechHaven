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
