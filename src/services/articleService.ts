import http from "../utils/http";

/**
 * 文章分页查询请求参数类型
 */
export interface ListArticlesParams {
  user_id?: string | number;
  page_from: number;
  page_size?: number;
  state?: number;
}

/**
 * 文章分页查询响应类型
 */
export interface ListArticlesResponse {
  total: number;
  list: Array<{
    id: string | number;
    title: string;
    author: string;
    summary: string;
    state: number;
    type: number;
    publish_time: number;
  }>;
}

export interface ListAdminArticlesParams {
  page_num: number;
  page_size: number;
  state?: number;
  category_id?: string | number;
  role?: number;
  days?: number;
  keyword?: string;
}

/**
 * 管理员文章分页查询响应类型
 */
export interface ListAdminArticlesResponse {
  total: number;
  list: Array<{
    update_time: number;
    id: string | number;
    title: string;
    author: string;
    email: string;
    state: number;
    summary: string;
    publish_time: string;
    author_role: number;
    user_id: string | number;
  }>;
}

/**
 * 文章发布请求参数类型
 */
export interface PublishArticleParams {
  id: string | number;
  publish_time: number;
}

/**
 * 文章发布响应类型
 */
export interface PublishArticleResponse {
  code: number | string;
  msg: string;
}

/**
 * 文章详情请求参数类型
 */
export interface ArticleDetailsParams {
  id: string | number;
  type: number;
}

/**
 * 文章详情响应类型
 */
export interface ArticleDetailsResponse {
  email: string;
  id: string | number;
  author: string;
  title: string;
  content: string;
  user_id: string | number;
  type: number;
  publish_time: string;
  update_time: string;
  state: number;
  is_deleted: boolean;
  views: number;
  praise: number;
  favorites: number;
  labels?: Array<string | number>;
  categorys?: Array<string | number>;
}

/**
 * 删除文章请求参数类型
 */
export interface DeleteArticleParams {
  ids: string; // 逗号分隔的文章id字符串
}

/**
 * 删除文章响应类型
 */
export interface DeleteArticleResponse {
  ids: Array<string | number>;
}

/**
 * 创建文章请求参数类型
 */
export interface CreateArticleParams {
  title: string;
  content: string;
  type: number;
  label?: string;
  category?: string;
}

/**
 * 创建文章响应类型
 */
export interface CreateArticleResponse {
  id: string | number;
}

/**
 * 审核文章参数
 */
export interface VerifyArticleParams {
  id: string | number;
  state: number;
}

/**
 * 更新文章内容参数
 */
export interface UpdateArticleContentParams {
  id: string | number;
  title: string;
  content: string;
}

/**
 * 更新文章分类参数
 */
export interface UpdateArticleCategoryParams {
  id: string | number;
  add_category_ids: string;
  del_category_ids: string;
}

/**
 * 更新文章分类响应
 */
export interface UpdateArticleCategoryResponse {
  add_category_ids: Array<string | number>;
  del_category_ids: Array<string | number>;
}

export interface SwitchArticleStateParams {
  id: string | number;
  state: number;
}

/**
 * 管理端文章统计响应类型
 */
export interface ArticleStatsResponse {
  total_articles: number;
  pending_articles: number;
  published_articles: number;
  rejected_articles: number;
  reported_articles: number;
}

/**
 * 文章服务类
 */
export class ArticleService {
  /**
   * 分页获取文章列表
   */
  static async listArticlesByUserIdPages(params: ListArticlesParams): Promise<ListArticlesResponse> {
    let url = `/article/query?page_from=${params.page_from}`;
    if (params.page_size) url += `&page_size=${params.page_size}`;
    if (params.state !== undefined) url += `&state=${params.state}`;
    if (params.user_id) url += `&user_id=${params.user_id}`;

    const response = await http.get<ListArticlesResponse>(url);
    return response.data;
  }

  /**
   * 按标签分页获取文章列表
   */
  static async listByLabel(params: {
    label_id: string | number;
    page_from: number;
    page_size?: number;
  }): Promise<ListArticlesResponse> {
    let url = `/article/list_by_label?label_id=${params.label_id}&page_from=${params.page_from}`;
    if (params.page_size) url += `&page_size=${params.page_size}`;

    const response = await http.get<ListArticlesResponse>(url);
    return response.data;
  }

  /**
   * 按分类分页获取文章列表
   */
  static async listByCategory(params: {
    category_id: string | number;
    page_from: number;
    page_size?: number;
  }): Promise<ListArticlesResponse> {
    let url = `/article/list_by_category?category_id=${params.category_id}&page_from=${params.page_from}`;
    if (params.page_size) url += `&page_size=${params.page_size}`;

    const response = await http.get<ListArticlesResponse>(url);
    return response.data;
  }

  static async listAdminArticlesByPages(params: ListAdminArticlesParams): Promise<ListAdminArticlesResponse> {
    let url = `/article/admin/lists?page_num=${params.page_num}`;
    url += `&page_size=${params.page_size}`;
    if (params.state !== undefined) {
      url += `&state=${params.state}`;
    }
    if (params.category_id !== undefined && params.category_id !== "") {
      url += `&category_id=${params.category_id}`;
    }
    if (params.role !== undefined) {
      url += `&role=${params.role}`;
    }
    if (params.days !== undefined) {
      url += `&days=${params.days}`;
    }
    if (params.keyword !== undefined && params.keyword !== "") {
      url += `&keyword=${encodeURIComponent(params.keyword)}`;
    }

    const response = await http.get<ListAdminArticlesResponse>(url);
    return response.data;
  }

  /**
   * 发布文章
   */
  static async publishArticle(params: PublishArticleParams): Promise<PublishArticleResponse> {
    const formData = new URLSearchParams();
    formData.append("id", String(params.id));
    formData.append("publish_time", String(params.publish_time));
    const response = await http.post<PublishArticleResponse>("/article/publish", formData.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    return {
      code: response.code,
      msg: response.message ?? response.msg ?? "",
    };
  }

  /**
   * 获取文章详情
   */
  static async getArticleDetails(params: ArticleDetailsParams): Promise<ArticleDetailsResponse> {
    const response = await http.get<ArticleDetailsResponse>(`/article/detail?id=${params.id}&type=${params.type}`);
    return response.data;
  }

  /**
   * 创建文章
   */
  static async createArticle(params: CreateArticleParams): Promise<CreateArticleResponse> {
    const formData = new URLSearchParams();
    formData.append("title", params.title);
    formData.append("content", params.content);
    formData.append("type", String(params.type));
    if (params.label) formData.append("label", params.label);
    if (params.category) formData.append("category", params.category);

    const response = await http.post<CreateArticleResponse>("/article/create", formData.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    return response.data;
  }

  /**
   * 删除文章
   */
  static async deleteArticle(params: DeleteArticleParams): Promise<DeleteArticleResponse> {
    const formData = new URLSearchParams();
    formData.append("ids", params.ids);
    const response = await http.post<DeleteArticleResponse>("/article/delete", formData.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    return response.data;
  }

  /**
   * 审核文章
   */
  static async verifyArticle(params: VerifyArticleParams) {
    const formData = new URLSearchParams();
    formData.append("id", String(params.id));
    formData.append("state", String(params.state));

    return http.post("/article/verify", formData.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
  }

  /**
   * 更新文章内容
   */
  static async updateArticleContent(params: UpdateArticleContentParams) {
    const formData = new URLSearchParams();
    formData.append("id", String(params.id));
    formData.append("title", params.title);
    formData.append("content", params.content);

    return http.post("/article/update", formData.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
  }

  /**
   * 更新文章分类
   */
  static async updateArticleCategories(params: UpdateArticleCategoryParams): Promise<UpdateArticleCategoryResponse> {
    const formData = new URLSearchParams();
    formData.append("id", String(params.id));
    formData.append("add_category_ids", params.add_category_ids);
    formData.append("del_category_ids", params.del_category_ids);

    const response = await http.post<UpdateArticleCategoryResponse>("/article/update_category", formData.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    return response.data;
  }

  static async switchArticleState(params: SwitchArticleStateParams) {
    const formData = new URLSearchParams();
    formData.append("id", String(params.id));
    formData.append("new_state", String(params.state));

    return http.post("/article/switch_state", formData.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
  }

  /**
   * 获取管理端文章统计数据
   */
  static async getAdminArticleStats(params?: {
    category_id?: string | number;
    role?: number;
    days?: number;
    keyword?: string;
  }): Promise<ArticleStatsResponse> {
    let url = `/article/admin/stats`;
    const queryParts: string[] = [];
    if (params?.category_id !== undefined && params?.category_id !== "") {
      queryParts.push(`category_id=${params.category_id}`);
    }
    if (params?.role !== undefined && params?.role !== -1) {
      queryParts.push(`role=${params.role}`);
    }
    if (params?.days !== undefined) {
      queryParts.push(`days=${params.days}`);
    }
    if (params?.keyword !== undefined && params?.keyword !== "") {
      queryParts.push(`keyword=${encodeURIComponent(params.keyword)}`);
    }
    if (queryParts.length) url += `?${queryParts.join("&")}`;

    const response = await http.get<ArticleStatsResponse>(url);
    return response.data;
  }
}

export default ArticleService;
