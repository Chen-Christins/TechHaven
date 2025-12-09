import http from '../utils/http';

/**
 * 创建作业参数
 */
export interface CreateOrganizationParams {
    id?: string | number;
    name: string;
    type: string;
    status: number | string;
    description?: string;
}

/**
 * 创建作业响应
 */
export interface CreateOrganizationResponse {
    id: number | string;
    name: string;
    type: string;
    status: number | string;
    description: string;
    create_time: number;
}

export interface GetAdminOrganizationsParams {
    page_num: number;
    page_size: number;
    status?: number;
}

export interface GetAdminOrganizationsResponse {
    total: number;
    list: Array<{
        id: number | string;
        name: string;
        type: string;
        status: number | string;
        description: string;
        create_time: number;
    }>;
}

/**
 * 删除作业参数
 */
export interface DeleteOrganizationParams {
    ids: string; // 逗号分隔的ID
}

/**
 * 删除作业响应
 */
export interface DeleteOrganizationResponse {
    ids: Array<number | string>;
}

/**
 * 获取作业列表参数
 */
export interface GetOrganizationListsParams {
    status?: number;
}

/**
 * 获取作业列表响应
 */
export interface GetOrganizationListsResponse {
    total: number;
    list: Array<{
        id: number | string;
        name: string;
        type: string;
        status: number | string;
        description: string;
    }>;
}

/**
 * 学科与作业服务类
 */
export class AssignmentService {

    /**
     * 创建作业 (Admin)
     */
    static async createOrganization(params: CreateOrganizationParams): Promise<CreateOrganizationResponse> {
        const formData = new URLSearchParams();
        if (params.id !== undefined && params.id !== null && params.id !== '') {
            formData.append('id', String(params.id));
        }
        formData.append('name', params.name);
        formData.append('type', params.type);
        formData.append('status', String(params.status));
        if (params.description) {
            formData.append('desc', params.description);
        }

        const response = await http.post<CreateOrganizationResponse>('/organization/create', formData.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        return response.data;
    }

    /**
     * 分页获取作业列表 (Admin)
     */
    static async getAdminOrganizations(params: GetAdminOrganizationsParams): Promise<GetAdminOrganizationsResponse> {
        let url = `/organization/admin/lists?page_num=${params.page_num}&page_size=${params.page_size}`;
        if (params.status != -1 && params.status !== undefined) {
            url += `&status=${params.status}`;
        }

        const response = await http.get<GetAdminOrganizationsResponse>(url);
        return response.data;
    }

    /**
     * 删除作业 (Admin)
     */
    static async deleteOrganizations(params: DeleteOrganizationParams): Promise<DeleteOrganizationResponse> {
        const formData = new URLSearchParams();
        formData.append('ids', params.ids);

        const response = await http.post<DeleteOrganizationResponse>('/organization/delete', formData.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        return response.data;
    }

    /**
     * 获取作业列表
     */
    static async getOrganizationLists(params: GetOrganizationListsParams): Promise<GetOrganizationListsResponse> {
        let url = '/organization/list?';
        if (params.status != -1 && params.status !== undefined && params.status !== null) {
            url += `status=${params.status}`;
        }

        const response = await http.get<GetOrganizationListsResponse>(url);
        return response.data;
    }
}

export default AssignmentService;
