import http from '../utils/http';
import type { Subject } from '../types';

/**
 * 创建学科参数
 */
export interface CreateSubjectParams {
    name: string;
    color: string;
}

/**
 * 创建学科响应
 */
export interface CreateSubjectResponse {
    id: number | string;
    name: string;
    color: string;
}

/**
 * 删除学科参数
 */
export interface DeleteSubjectParams {
    ids: string; // 逗号分隔的ID
}

/**
 * 删除学科响应
 */
export interface DeleteSubjectResponse {
    ids: Array<number | string>;
}

/**
 * 学科详情响应
 */
export interface SubjectDetailsResponse {
    details: Subject[];
}

/**
 * 创建作业参数
 */
export interface CreateAssignmentParams {
    sid: number | string;
    name: string;
    color: string;
}

/**
 * 创建作业响应
 */
export interface CreateAssignmentResponse {
    id: number | string;
    name: string;
    color: string;
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
export class SubjectService {
    /**
     * 创建学科 (Admin)
     */
    static async createSubject(params: CreateSubjectParams): Promise<CreateSubjectResponse> {
        const formData = new URLSearchParams();
        formData.append('name', params.name);
        formData.append('color', params.color);

        const response = await http.post<CreateSubjectResponse>('/subject/create', formData.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        return response.data;
    }

    /**
     * 删除学科 (Admin)
     */
    static async deleteSubjects(params: DeleteSubjectParams): Promise<DeleteSubjectResponse> {
        const formData = new URLSearchParams();
        formData.append('ids', params.ids);

        const response = await http.post<DeleteSubjectResponse>('/subject/delete', formData.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        return response.data;
    }

    /**
     * 获取学科详情
     */
    static async getSubjectDetails(): Promise<SubjectDetailsResponse> {
        const response = await http.get<SubjectDetailsResponse>('/subject/details');
        return response.data;
    }

    /**
     * 创建作业 (Admin)
     */
    static async createAssignment(params: CreateAssignmentParams): Promise<CreateAssignmentResponse> {
        const formData = new URLSearchParams();
        formData.append('sid', String(params.sid));
        formData.append('name', params.name);
        formData.append('color', params.color);

        const response = await http.post<CreateAssignmentResponse>('/assignment/create', formData.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        return response.data;
    }

    /**
     * 删除作业 (Admin)
     */
    static async deleteAssignments(params: DeleteAssignmentParams): Promise<DeleteAssignmentResponse> {
        const formData = new URLSearchParams();
        formData.append('ids', params.ids);

        const response = await http.post<DeleteAssignmentResponse>('/assignment/delete', formData.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        return response.data;
    }
}

export default SubjectService;
