import http from "../utils/http";

/**
 * 文件上传参数
 */
export interface UploadFileParams {
    dir_name: string;
    biz_type: string;
    biz_id: string;
    files: File[];
}

/**
 * 文件下载参数
 */
export interface DownloadFileParams {
    url: string;
    fileName: string;
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
        formData.append("dir_name", params.dir_name);
        formData.append("biz_info", params.biz_type + "|" + params.biz_id);
        params.files.forEach((file) => {
            formData.append("file", file);
        });

        return http.upload("/file/upload", formData);
    }

    /**
     * 通过POST请求下载文件（适配C++后台接口）
     * @param apiUrl 后端下载接口地址
     * @param url 文件资源路径（如 /upload/xxx.pdf）
     * @param fileName 下载保存的文件名
     * @param headers 可选，自定义请求头
     */
    static async downloadFile(url: string, fileName: string) {
        console.log("FileService.downloadFile called with url:", url, "fileName:", fileName);

        // 使用POST请求下载文件，Content-Type为application/x-www-form-urlencoded
        const params = new URLSearchParams();
        params.append("url", url);
        params.append("fileName", fileName);
        const res = await fetch("/file/download", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params.toString(),
            credentials: "include",
        });

        if (!res.ok) throw new Error("下载失败");
        const contentType = res.headers.get("Content-Type");
        if (contentType && contentType.includes("application/json")) {
            const errMsg = await res.text();
            throw new Error(errMsg);
        }
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
    }
}

export default FileService;
