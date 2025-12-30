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
 * 分块上传参数
 */
export interface ChunkUploadParams {
    dir_name: string;
    biz_type: string;
    biz_id: string;
    file: File;
    chunkSize?: number; // 分块大小，默认5MB
    maxRetries?: number; // 最大重试次数，默认3次
    onProgress?: (progress: number) => void; // 进度回调
    onChunkUploaded?: (chunkIndex: number, totalChunks: number) => void; // 分块上传完成回调
}

/**
 * 分块上传状态跟踪
 */
class ChunkUploadTracker {
    private static instance: ChunkUploadTracker;
    private uploadingChunks: Map<string, Set<number>> = new Map(); // uploadId -> Set<chunkIndex>
    private uploadedChunks: Map<string, Set<number>> = new Map(); // uploadId -> Set<chunkIndex>

    private constructor() {}

    public static getInstance(): ChunkUploadTracker {
        if (!ChunkUploadTracker.instance) {
            ChunkUploadTracker.instance = new ChunkUploadTracker();
        }
        return ChunkUploadTracker.instance;
    }

    /**
     * 标记分块正在上传
     */
    public markUploading(uploadId: string, chunkIndex: number): boolean {
        if (!this.uploadingChunks.has(uploadId)) {
            this.uploadingChunks.set(uploadId, new Set());
        }

        const uploadingSet = this.uploadingChunks.get(uploadId)!;

        // 如果已经上传或正在上传，返回 false
        if (this.uploadedChunks.get(uploadId)?.has(chunkIndex) || uploadingSet.has(chunkIndex)) {
            return false;
        }

        uploadingSet.add(chunkIndex);
        return true;
    }

    /**
     * 标记分块上传完成
     */
    public markUploaded(uploadId: string, chunkIndex: number): void {
        // 从正在上传的集合中移除
        this.uploadingChunks.get(uploadId)?.delete(chunkIndex);

        // 添加到已上传集合
        if (!this.uploadedChunks.has(uploadId)) {
            this.uploadedChunks.set(uploadId, new Set());
        }
        this.uploadedChunks.get(uploadId)!.add(chunkIndex);
    }

    /**
     * 检查分块是否已上传
     */
    public isUploaded(uploadId: string, chunkIndex: number): boolean {
        return this.uploadedChunks.get(uploadId)?.has(chunkIndex) || false;
    }

    /**
     * 清理上传记录
     */
    public clearUpload(uploadId: string): void {
        this.uploadingChunks.delete(uploadId);
        this.uploadedChunks.delete(uploadId);
    }

    /**
     * 获取已上传分块数量
     */
    public getUploadedCount(uploadId: string): number {
        return this.uploadedChunks.get(uploadId)?.size || 0;
    }
}

/**
 * 分块上传状态
 */
export interface ChunkUploadStatus {
    uploadId: string;
    status: "uploading" | "completed" | "error" | "cancelled";
    fileName: string;
    totalSize: number;
    totalChunks: number;
    receivedChunks: number;
    progress: string;
    error?: string;
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
     * 分块上传文件
     * @param params 分块上传参数
     * @returns 上传结果
     */
    static async uploadFileByChunks(params: ChunkUploadParams): Promise<{
        success: boolean;
        filePath?: string;
        error?: string;
        uploadId?: string;
    }> {
        const {
            dir_name,
            biz_type,
            biz_id,
            file,
            chunkSize = 2 * 1024 * 1024, // 默认2MB
            maxRetries = 3,
            onProgress,
            onChunkUploaded,
        } = params;

        let uploadId: string = "";
        let totalChunks: number = 0;
        const tracker = ChunkUploadTracker.getInstance();

        try {
            // 1. 初始化分块上传
            const initResult = await this.initializeChunkUpload({
                file_name: file.name,
                total_size: file.size,
                chunk_size: chunkSize,
                dir_name,
                biz_type,
                biz_id,
            });

            if (!initResult.success || !initResult.uploadId) {
                throw new Error(initResult.error || "初始化分块上传失败");
            }

            uploadId = initResult.uploadId;
            totalChunks = Math.ceil(file.size / chunkSize);

            // 2. 分块上传（串行，避免并发问题）
            for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
                // 检查是否已经上传过
                if (tracker.isUploaded(uploadId, chunkIndex)) {
                    console.log(`分块 ${chunkIndex} 已上传，跳过`);
                    continue;
                }

                const start = chunkIndex * chunkSize;
                const end = Math.min(start + chunkSize, file.size);
                const chunk = file.slice(start, end);
                const chunkOffset = start;

                let retries = 0;
                let uploaded = false;

                // 重试机制
                while (retries <= maxRetries && !uploaded) {
                    // 检查是否可以上传（避免并发重复上传）
                    if (!tracker.markUploading(uploadId, chunkIndex)) {
                        // 如果已经被其他进程标记为正在上传，等待一段时间后重试
                        console.log(`分块 ${chunkIndex} 正在被其他进程上传，等待...`);
                        await new Promise((resolve) => setTimeout(resolve, 500));
                        retries++;
                        continue;
                    }

                    try {
                        await this.uploadChunk({
                            uploadId,
                            chunkIndex,
                            chunkOffset,
                            chunk,
                            chunkSize: end - start,
                        });

                        // 标记为已上传
                        tracker.markUploaded(uploadId, chunkIndex);
                        uploaded = true;

                        // 更新进度
                        if (onProgress) {
                            const uploadedCount = tracker.getUploadedCount(uploadId);
                            const progress = Math.round((uploadedCount / totalChunks) * 100);
                            onProgress(progress);
                        }

                        if (onChunkUploaded) {
                            onChunkUploaded(chunkIndex, totalChunks);
                        }
                    } catch (error: any) {
                        // 如果是重复上传错误，标记为成功并继续
                        if (error.message && error.message.includes("Chunk already received")) {
                            console.log(`分块 ${chunkIndex} 已存在，标记为成功`);
                            tracker.markUploaded(uploadId, chunkIndex);
                            uploaded = true;
                            continue;
                        }

                        retries++;
                        if (retries > maxRetries) {
                            throw new Error(`分块 ${chunkIndex} 上传失败，已重试 ${maxRetries} 次: ${error.message}`);
                        }
                        // 等待一段时间后重试（指数退避）
                        const delay = Math.min(1000 * Math.pow(2, retries - 1), 5000);
                        console.log(`分块 ${chunkIndex} 上传失败，${delay}ms 后重试 (${retries}/${maxRetries})`);
                        await new Promise((resolve) => setTimeout(resolve, delay));
                    }
                }
            }

            // 3. 完成上传
            const completeResult = await this.completeChunkUpload(uploadId);

            if (!completeResult.success || !completeResult.filePath) {
                throw new Error(completeResult.error || "完成上传失败");
            }

            // 清理跟踪记录
            tracker.clearUpload(uploadId);

            return {
                success: true,
                filePath: completeResult.filePath,
                uploadId: uploadId,
            };
        } catch (error) {
            // 发生错误时取消上传
            if (uploadId) {
                try {
                    await this.cancelChunkUpload(uploadId);
                } catch (cancelError) {
                    console.error("取消上传失败:", cancelError);
                }
                // 清理跟踪记录
                tracker.clearUpload(uploadId);
            }

            return {
                success: false,
                error: error instanceof Error ? error.message : "上传失败",
            };
        }
    }

    /**
     * 初始化分块上传
     */
    private static async initializeChunkUpload(params: {
        file_name: string;
        total_size: number;
        chunk_size: number;
        dir_name: string;
        biz_type: string;
        biz_id: string;
    }): Promise<{ success: boolean; uploadId?: string; error?: string }> {
        try {
            const headers = {
                "X-Upload-Type": "chunked",
                "X-Upload-Filename": encodeURIComponent(params.file_name),
                "X-Upload-Total-Size": params.total_size.toString(),
                "X-Upload-Total-Chunks": Math.ceil(params.total_size / params.chunk_size).toString(),
                "X-Upload-Chunk-Size": params.chunk_size.toString(),
                "X-Upload-Biz-Info": encodeURIComponent(`${params.biz_type}|${params.biz_id}`),
                "X-Upload-Dir-Name": encodeURIComponent(params.dir_name),
            };
            const result = await http.post(
                "/upload/init",
                {},
                {
                    headers,
                    timeout: 15000, // 15秒超时
                },
            );
            return {
                success: true,
                uploadId: result.data?.upload_id,
            };
        } catch (error: any) {
            return {
                success: false,
                error: error?.message || "初始化失败",
            };
        }
    }

    /**
     * 上传单个分块
     */
    private static async uploadChunk(params: {
        uploadId: string;
        chunkIndex: number;
        chunkOffset: number;
        chunk: Blob;
        chunkSize: number;
    }): Promise<void> {
        const headers = {
            "X-Upload-Type": "chunked",
            "X-Upload-Id": encodeURIComponent(params.uploadId),
            "X-Upload-Chunk-Index": params.chunkIndex.toString(),
            "X-Upload-Chunk-Offset": params.chunkOffset.toString(),
            "X-Upload-Chunk-Size": params.chunkSize.toString(),
        };
        // 直接传 chunk 二进制作为 data，content-type 由 axios 自动处理
        // 增加更长的超时时间以适应大文件上传
        const result = await http.post("/upload/chunk", params.chunk, {
            headers,
            timeout: 30000, // 30秒超时
        });
        if (result.code !== 200 && result.code !== "200") {
            throw new Error(result.message || "分块上传失败");
        }
    }

    /**
     * 完成分块上传
     */
    private static async completeChunkUpload(uploadId: string): Promise<{
        success: boolean;
        filePath?: string;
        error?: string;
    }> {
        try {
            const headers = {
                "X-Upload-Type": "chunked",
                "X-Upload-Id": encodeURIComponent(uploadId),
            };
            const result = await http.post(
                "/upload/complete",
                {},
                {
                    headers,
                    timeout: 30000, // 30秒超时，服务器可能需要时间合并文件
                },
            );
            return {
                success: true,
                filePath: result.data?.file_path,
            };
        } catch (error: any) {
            return {
                success: false,
                error: error?.message || "完成上传失败",
            };
        }
    }

    /**
     * 取消分块上传
     */
    private static async cancelChunkUpload(uploadId: string): Promise<void> {
        const headers = {
            "X-Upload-Type": "chunked",
            "X-Upload-Id": encodeURIComponent(uploadId),
        };
        await http.post("/upload/cancel", {}, { headers });
    }

    /**
     * 查询分块上传状态
     */
    static async getChunkUploadStatus(uploadId: string): Promise<ChunkUploadStatus | null> {
        try {
            const headers = {
                "X-Upload-Type": "chunked",
                "X-Upload-Id": encodeURIComponent(uploadId),
            };
            const result = await http.get("/upload/status", { headers });
            if (!result.data) return null;
            return {
                uploadId: result.data.uploadId,
                status: result.data.status,
                fileName: result.data.fileName,
                totalSize: parseInt(result.data.totalSize),
                totalChunks: parseInt(result.data.totalChunks),
                receivedChunks: parseInt(result.data.receivedChunks),
                progress: result.data.progress,
            };
        } catch (error) {
            console.error("查询上传状态失败:", error);
            return null;
        }
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
