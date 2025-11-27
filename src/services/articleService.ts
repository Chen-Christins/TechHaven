/**
 * 文章分页查询请求参数类型
 */
export interface ListArticlesParams {
    user_id: string | number;
    page_from: number;
    page_size?: number;
    state?: number;
}

/**
 * 文章分页查询响应类型
 */
export interface ListArticlesResponse {
    total: number;
    page_from: number;
    page_size: number;
    ids: Array<string | number>;
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
 * 仅包含状态码和 message
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
    type: 0 | 1;
}

/**
 * 文章详情响应类型
 */
export interface ArticleDetailsResponse {
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
    labels?: Array<string>;
}
/**
 * 删除文章请求参数类型
 */
export interface DeleteArticleParams {
    ids: string; // 逗号分隔的文章id字符串，如 "1,2,3,4"
}

/**
 * 删除文章响应类型
 */
export interface DeleteArticleResponse {
    deletedIds: Array<string | number>;
}
import http from '../utils/http';

/**
 * 创建文章请求参数类型
 */
export interface CreateArticleParams {
    title: string;
    content: string;
    type: string;
    label: string;
    category: string;
}

/**
 * 创建文章响应类型
 */
export interface CreateArticleResponse {
    id: string | number;
}

/**
 * 文章服务类
 * 专门处理文章相关操作，如创建文章
 */
export class ArticleService {
    /**
     * 分页获取用户文章列表
     * @param params 查询参数
     * @returns 分页结果
     */
    static async listArticlesByUserIdPages(params: ListArticlesParams): Promise<ListArticlesResponse> {
        const formData = new URLSearchParams();
        formData.append('user_id', String(params.user_id));
        formData.append('page_from', String(params.page_from));
        formData.append('page_size', String(params.page_size ?? 6));
        formData.append('state', String(params.state ?? 0));
        const response = await http.post<ListArticlesResponse>('/article/list', formData.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        return response.data;
    }
    /**
     * 发布文章
     * @param params 发布参数
     * @returns 发布结果
     */
    static async publishArticle(params: PublishArticleParams): Promise<PublishArticleResponse> {
        const formData = new URLSearchParams();
        formData.append('id', String(params.id));
        formData.append('publish_time', String(params.publish_time));
        const response = await http.post<PublishArticleResponse>('/article/publish', formData.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        // 只返回状态码和 message
        return {
            code: response.code,
            msg: response.message
        };
    }
    /**
     * 获取文章详情
     * @param params 详情参数
     * @returns 文章详情
     */
    static async getArticleDetails(params: ArticleDetailsParams): Promise<ArticleDetailsResponse> {
        const formData = new URLSearchParams();
        formData.append('id', String(params.id));
        formData.append('type', String(params.type));
        const response = await http.post<ArticleDetailsResponse>('/article/details', formData.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        return response.data;
    }
    /**
     * 创建文章
     * @param params 文章创建参数
     * @returns 创建响应
     */
    static async createArticle(params: CreateArticleParams): Promise<CreateArticleResponse> {
        // 使用 form-urlencoded 格式发送请求，所有参数都转为字符串且不为 undefined/null
        const formData = new URLSearchParams();
        formData.append('title', params.title ?? '');
        formData.append('content', params.content ?? '');
        formData.append('type', params.type ? String(params.type) : '');
        formData.append('label', params.label ? String(params.label) : '');
        formData.append('category', params.category ? String(params.category) : '');
        const response = await http.post<CreateArticleResponse>('/article/create', formData.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        return response.data;
    }

    /**
     * 删除文章
     * @param params 删除参数
     * @returns 删除结果
     */
    static async deleteArticle(params: DeleteArticleParams): Promise<DeleteArticleResponse> {
        const formData = new URLSearchParams();
        formData.append('ids', params.ids);
        const response = await http.post<DeleteArticleResponse>('/article/delete', formData.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        return response.data;
    }
}

export default ArticleService;
