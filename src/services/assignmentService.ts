import http from "../utils/http";

/**
 * 创建作业参数
 */
export interface CreateAssignmentParams {
    id?: string | number;
    name: string;
    subject_name: string;
    end_time: string;
    file_size: number;
    status: number | string;
    priority: number;
    file_type: string;
    description: string;
}

/**
 * 创建作业响应
 */
export interface CreateAssignmentResponse {
    id: number | string;
    name: string;
    subject_name: string;
    end_time: number;
    file_size: number;
    status: string;
    file_type: string;
    description: string;
    create_time: number;
}

export interface GetAdminAssignmentsParams {
    page_num: number;
    page_size: number;
    state?: number;
}

export interface GetAdminAssignmentsResponse {
    total: number;
    list: Array<{
        id: string | number;
        name: string;
        subject_name: string;
        end_time: number;
        status: string;
        priority: number;
        create_time: number;
        file_size: number;
        file_type: string;
        description: string;
    }>;
}

/**
 * 删除作业参数
 */
export interface DeleteAssignmentParams {
    ids: string; // 逗号分隔的ID
}

/**
 * 删除作业响应
 */
export interface DeleteAssignmentResponse {
    ids: Array<number | string>;
}

/**
 * 学科与作业服务类
 */
export class AssignmentService {
    /**
     * 创建作业 (Admin)
     */
    static async createAssignment(params: CreateAssignmentParams): Promise<CreateAssignmentResponse> {
        const formData = new URLSearchParams();
        if (params.id !== undefined && params.id !== null && params.id !== "") {
            formData.append("id", String(params.id));
        }
        formData.append("name", params.name);
        formData.append("subject_name", params.subject_name);
        formData.append("end_time", params.end_time);
        formData.append("file_size", String(params.file_size));
        formData.append("status", String(params.status));
        formData.append("priority", String(params.priority));
        formData.append("file_type", params.file_type);
        formData.append("description", params.description);

        const response = await http.post<CreateAssignmentResponse>("/assignment/create", formData.toString(), {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });
        return response.data;
    }

    /**
     * 分页获取作业列表 (Admin)
     */
    static async getAdminAssignments(params: GetAdminAssignmentsParams): Promise<GetAdminAssignmentsResponse> {
        let url = `/assignment/admin/lists?page_num=${params.page_num}&page_size=${params.page_size}`;
        if (params.state != -1 && params.state !== undefined) {
            url += `&state=${params.state}`;
        }

        const response = await http.get<GetAdminAssignmentsResponse>(url);
        return response.data;
    }

    /**
     * 删除作业 (Admin)
     */
    static async deleteAssignments(params: DeleteAssignmentParams): Promise<DeleteAssignmentResponse> {
        const formData = new URLSearchParams();
        formData.append("ids", params.ids);

        const response = await http.post<DeleteAssignmentResponse>("/assignment/delete", formData.toString(), {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });
        return response.data;
    }
}

export default AssignmentService;
