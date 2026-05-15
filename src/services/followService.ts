import http from "../utils/http";
import type { FollowListResponse } from "../types/follow";

/**
 * 关注服务
 */
export class FollowService {
  /**
   * 关注用户
   */
  static async follow(followingId: number | string): Promise<void> {
    const formData = new URLSearchParams();
    formData.append("following_id", String(followingId));
    await http.post("/user/follow", formData.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
  }

  /**
   * 取消关注
   */
  static async unfollow(followingId: number | string): Promise<void> {
    const formData = new URLSearchParams();
    formData.append("following_id", String(followingId));
    await http.post("/user/unfollow", formData.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
  }

  /**
   * 判断是否已关注某用户
   */
  static async isFollowing(userId: number | string): Promise<boolean> {
    const response = await http.get<{ is_following: boolean }>("/user/is_following", {
      params: { user_id: userId },
    });
    return response.data.is_following;
  }

  /**
   * 获取关注列表
   * @param userId 不传则查当前用户
   */
  static async getFollowingList(params?: {
    user_id?: number | string;
    offset?: number;
    size?: number;
  }): Promise<FollowListResponse> {
    const response = await http.get<FollowListResponse>("/user/following/list", { params });
    return response.data;
  }

  /**
   * 获取粉丝列表
   * @param userId 不传则查当前用户
   */
  static async getFollowerList(params?: {
    user_id?: number | string;
    offset?: number;
    size?: number;
  }): Promise<FollowListResponse> {
    const response = await http.get<FollowListResponse>("/user/follower/list", { params });
    return response.data;
  }
}

export default FollowService;
