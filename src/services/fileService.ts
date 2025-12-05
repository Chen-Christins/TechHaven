import http from '../utils/http';

/**
 * 文件上传参数
 */
export interface UploadFileParams {
    dir_name: string;
    files: File[];
}

/**
 * 文件服务类
 */
export class FileService {
    /**
     * 上传文件
     * @param params 上传参数
     * @returns 上传结果
     */
    static async uploadFile(params: UploadFileParams) {
        const formData = new FormData();
        formData.append('dir_name', params.dir_name);
        params.files.forEach((file) => {
            formData.append('file', file);
        });

        return http.post('/file/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    }
}

export default FileService;
