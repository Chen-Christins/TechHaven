import http from "../utils/http";
import type { PraiseToggleResponse, PraiseListResponse } from "../types/praise";

export class PraiseService {
  /**
   * 点赞/取消点赞（toggle）
   */
  static async toggle(articleId: number | string): Promise<PraiseToggleResponse> {
    const formData = new URLSearchParams();
    formData.append("article_id", String(articleId));
    const response = await http.post<PraiseToggleResponse>("/article/praise", formData.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    return response.data;
  }

  /**
   * 是否已点赞
   */
  static async isPraising(articleId: number | string): Promise<boolean> {
    const response = await http.get<{ is_praising: boolean }>("/article/is_praising", {
      params: { article_id: articleId },
    });
    return response.data.is_praising;
  }

  /**
   * 点赞列表
   * article_id 和 user_id 二选一，都不传默认查当前用户
   */
  static async getList(params?: {
    article_id?: number | string;
    user_id?: number | string;
    offset?: number;
    size?: number;
  }): Promise<PraiseListResponse> {
    const response = await http.get<PraiseListResponse>("/article/praise/list", { params });
    return response.data;
  }
}

export default PraiseService;
