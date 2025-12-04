import http from '../utils/http';

/**
 * 查询分类请求参数类型
 */
export interface QueryCategoryParams {
    ids?: string; // 逗号分隔的分类id字符串
    user_id?: string | number;
}

/**
 * 查询分类响应类型
 */
export interface CategoryInfo {
    id: string | number;
    name: string;
    color: string;
    parent_id: string | number;
}

export interface QueryCategoryResponse {
    categories: CategoryInfo[];
}

/**
 * 删除分类请求参数类型
 */
export interface DeleteCategoryParams {
    ids: string; // 逗号分隔的分类id字符串
}

/**
 * 删除分类响应类型
 */
export interface DeleteCategoryResponse {
    ids: Array<string | number>;
}

/**
 * 创建分类请求参数类型
 */
export interface CreateCategoryParams {
    name: string;
    color: string;
    parent_id?: string | number;
}

/**
 * 创建分类响应类型
 */
export interface CreateCategoryResponse {
    id: string | number;
    name: string;
    color: string;
    parent_id: string | number;
}

/**
 * 分类服务类
 * 专门处理分类相关操作
 */
export class CategoryService {
    /**
     * 查询分类详情
     * @param params 查询参数
     * @returns 分类详情列表
     */
    static async queryCategory(params: QueryCategoryParams): Promise<CategoryInfo[]> {
        let url = '/category/query?';
        if (params.ids) url += `ids=${params.ids}&`;
        if (params.user_id) url += `user_id=${params.user_id}`;
        
        const response = await http.get<CategoryInfo[]>(url);
        return response.data;
    }

    /**
     * 删除分类
     * @param params 删除参数
     * @returns 删除结果
     */
    static async deleteCategory(params: DeleteCategoryParams): Promise<DeleteCategoryResponse> {
        const formData = new URLSearchParams();
        formData.append('ids', params.ids);
        const response = await http.post<DeleteCategoryResponse>('/category/delete', formData.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        return response.data;
    }

    /**
     * 创建分类
     * @param params 分类创建参数
     * @returns 创建响应
     */
    static async createCategory(params: CreateCategoryParams): Promise<CreateCategoryResponse> {
        const formData = new URLSearchParams();
        formData.append('name', params.name);
        formData.append('color', params.color);
        if (params.parent_id !== undefined && params.parent_id !== null && params.parent_id !== '') {
            formData.append('parent_id', String(params.parent_id));
        }
        const response = await http.post<CreateCategoryResponse>('/category/create', formData.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        return response.data;
    }
}

export default CategoryService;
