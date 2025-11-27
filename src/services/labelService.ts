/**
 * 删除标签请求参数类型
 */
export interface DeleteLabelParams {
    ids: string; // 逗号分隔的标签id字符串，如 "1,2,3"
}

/**
 * 删除标签响应类型
 */
export interface DeleteLabelResponse {
    deletedIds: Array<string | number>;
}
import http from '../utils/http';

/**
 * 创建标签请求参数类型
 */
export interface CreateLabelParams {
    name: string;
    color: string;
}

/**
 * 创建标签响应类型
 */
export interface CreateLabelResponse {
    id: string | number;
    name: string;
    color: string;
}

/**
 * 查询标签请求参数类型
 */
export interface QueryLabelParams {
    // 否则可传 `ids` 来查询指定标签id列表（逗号分隔）。
    ids?: string; // 逗号分隔的标签id字符串，如 "1,2,3"
    user_id?: string | number;
}

/**
 * 标签信息类型
 */
export interface LabelInfo {
    id: string | number;
    name: string;
    color: string;
}

/**
 * 标签服务类
 * 专门处理标签相关操作
 */
export class LabelService {
    /**
     * 删除标签
     * @param params 删除参数
     * @returns 删除结果
     */
    static async deleteLabel(params: DeleteLabelParams): Promise<DeleteLabelResponse> {
        const formData = new URLSearchParams();
        formData.append('ids', params.ids);
        const response = await http.post<DeleteLabelResponse>('/label/delete', formData.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        return response.data;
    }
    /**
     * 创建标签
     * @param params 标签创建参数
     * @returns 创建响应
     */
    static async createLabel(params: CreateLabelParams): Promise<CreateLabelResponse> {
        const formData = new URLSearchParams();
        formData.append('name', params.name);
        formData.append('color', params.color);
        const response = await http.post<CreateLabelResponse>('/label/create', formData.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        return response.data;
    }

    /**
     * 查询标签详情
     * @param params 查询参数
     * @returns 标签详情列表
     */
    static async queryLabel(params: QueryLabelParams): Promise<LabelInfo[]> {
        const formData = new URLSearchParams();
        // 优先使用 user_id 查询当前用户的所有有效标签
        if (params.user_id !== undefined && params.user_id !== null && params.user_id !== '') {
            formData.append('user_id', String(params.user_id));
        } else {
            // 否则按 ids 查询指定标签
            formData.append('ids', params.ids ?? '');
        }

        const response = await http.post<LabelInfo[]>('/label/query', formData.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        return response.data;
    }
}

export default LabelService;
