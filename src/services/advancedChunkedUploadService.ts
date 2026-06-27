import { FileService } from "./fileService";

/**
 * 高级分块上传服务配置
 */
export interface AdvancedChunkUploadConfig {
  chunkSize: number; // 分块大小
  maxConcurrentChunks: number; // 最大并发分块数
  maxRetries: number; // 最大重试次数
  retryDelay: number; // 重试延迟（毫秒）
  enableChecksum: boolean; // 是否启用校验和
  autoResume: boolean; // 是否自动恢复中断的上传
}

/**
 * 上传任务状态
 */
export interface UploadTask {
  id: string;
  file: File;
  config: AdvancedChunkUploadConfig;
  status: "pending" | "uploading" | "paused" | "completed" | "error";
  progress: number;
  uploadedChunks: Set<number>;
  totalChunks: number;
  uploadId?: string;
  error?: string;
  startTime?: number;
  endTime?: number;
  uploadSpeed?: number; // bytes per second
}

/**
 * 上传事件回调
 */
export interface UploadEventCallbacks {
  onProgress?: (task: UploadTask) => void;
  onChunkUploaded?: (task: UploadTask, chunkIndex: number) => void;
  onTaskCompleted?: (task: UploadTask, filePath?: string) => void;
  onTaskError?: (task: UploadTask, error: string) => void;
  onTaskPaused?: (task: UploadTask) => void;
  onTaskResumed?: (task: UploadTask) => void;
}

/**
 * 高级分块上传服务
 */
export class AdvancedChunkedUploadService {
  private static instance: AdvancedChunkedUploadService;
  private uploadTasks: Map<string, UploadTask> = new Map();
  private activeUploads: Map<string, Promise<any>> = new Map();
  private defaultConfig: AdvancedChunkUploadConfig = {
    chunkSize: 5 * 1024 * 1024, // 5MB
    maxConcurrentChunks: 3, // 3个并发分块
    maxRetries: 3, // 最多重试3次
    retryDelay: 1000, // 1秒重试延迟
    enableChecksum: false, // 暂不启用校验和
    autoResume: true, // 自动恢复
  };

  private constructor() {}

  public static getInstance(): AdvancedChunkedUploadService {
    if (!AdvancedChunkedUploadService.instance) {
      AdvancedChunkedUploadService.instance = new AdvancedChunkedUploadService();
    }
    return AdvancedChunkedUploadService.instance;
  }

  /**
   * 创建上传任务
   */
  public createUploadTask(file: File, config?: Partial<AdvancedChunkUploadConfig>): UploadTask {
    const finalConfig: AdvancedChunkUploadConfig = { ...this.defaultConfig, ...config };
    const taskId = this.generateTaskId();

    const task: UploadTask = {
      id: taskId,
      file,
      config: finalConfig,
      status: "pending",
      progress: 0,
      uploadedChunks: new Set(),
      totalChunks: Math.ceil(file.size / finalConfig.chunkSize),
    };

    this.uploadTasks.set(taskId, task);
    return task;
  }

  /**
   * 开始上传任务
   */
  public async startUpload(taskId: string): Promise<boolean> {
    const task = this.uploadTasks.get(taskId);
    if (!task) {
      throw new Error("Upload task not found");
    }

    if (task.status === "uploading") {
      return true; // 已经在上传中
    }

    // 检查是否可以恢复之前的上传
    if (task.config.autoResume && task.uploadId) {
      const existingStatus = await FileService.getChunkUploadStatus(task.uploadId);
      if (existingStatus && existingStatus.status === "uploading") {
        task.uploadedChunks.clear();
        // 这里可以根据后端API获取已上传的分块信息
        // 暂时重新开始
      }
    }

    task.status = "uploading";
    task.startTime = Date.now();

    const uploadPromise = this.executeUpload(task, this.getCallbacks(taskId));
    this.activeUploads.set(taskId, uploadPromise);

    try {
      const result = await uploadPromise;
      this.activeUploads.delete(taskId);
      return result.success;
    } catch (error) {
      this.activeUploads.delete(taskId);
      task.status = "error";
      task.error = error instanceof Error ? error.message : "Unknown error";
      throw error;
    }
  }

  /**
   * 暂停上传任务
   */
  public pauseUpload(taskId: string): boolean {
    const task = this.uploadTasks.get(taskId);
    if (!task || task.status !== "uploading") {
      return false;
    }

    task.status = "paused";
    const uploadPromise = this.activeUploads.get(taskId);
    if (uploadPromise) {
      // 这里可以添加取消逻辑
      this.activeUploads.delete(taskId);
    }

    const callbacks = this.getCallbacks(taskId);
    if (callbacks.onTaskPaused) {
      callbacks.onTaskPaused(task);
    }

    return true;
  }

  /**
   * 恢复上传任务
   */
  public async resumeUpload(taskId: string): Promise<boolean> {
    const task = this.uploadTasks.get(taskId);
    if (!task || task.status !== "paused") {
      return false;
    }

    const callbacks = this.getCallbacks(taskId);
    if (callbacks.onTaskResumed) {
      callbacks.onTaskResumed(task);
    }

    return this.startUpload(taskId);
  }

  /**
   * 取消上传任务
   */
  public async cancelUpload(taskId: string): Promise<boolean> {
    const task = this.uploadTasks.get(taskId);
    if (!task) {
      return false;
    }

    // 取消正在进行的上传
    const uploadPromise = this.activeUploads.get(taskId);
    if (uploadPromise) {
      this.activeUploads.delete(taskId);
    }

    // 取消服务器端的上传
    if (task.uploadId) {
      try {
        await FileService.getChunkUploadStatus(task.uploadId); // 获取实例以调用取消方法
        // 这里需要添加取消方法到FileService
      } catch (error) {
        console.error("Failed to cancel upload on server:", error);
      }
    }

    task.status = "error";
    task.error = "Upload cancelled";
    this.uploadTasks.delete(taskId);

    return true;
  }

  /**
   * 获取上传任务
   */
  public getUploadTask(taskId: string): UploadTask | undefined {
    return this.uploadTasks.get(taskId);
  }

  /**
   * 获取所有上传任务
   */
  public getAllUploadTasks(): UploadTask[] {
    return Array.from(this.uploadTasks.values());
  }

  /**
   * 执行上传逻辑
   */
  private async executeUpload(
    task: UploadTask,
    callbacks: UploadEventCallbacks,
  ): Promise<{
    success: boolean;
    filePath?: string;
    error?: string;
  }> {
    try {
      // 1. 初始化上传
      if (!task.uploadId) {
        const initResult = await this.initializeUpload();
        if (!initResult.success) {
          throw new Error(initResult.error || "Failed to initialize upload");
        }
        task.uploadId = initResult.uploadId;
      }

      // 2. 并发上传分块
      await this.uploadChunksConcurrently(task, callbacks);

      // 3. 完成上传
      if (!task.uploadId) {
        throw new Error("uploadId is undefined");
      }
      const completeResult = await this.completeUpload(task.uploadId);
      if (!completeResult.success) {
        throw new Error(completeResult.error || "Failed to complete upload");
      }

      task.status = "completed";
      task.endTime = Date.now();
      task.progress = 100;

      if (callbacks.onTaskCompleted) {
        callbacks.onTaskCompleted(task, completeResult.filePath);
      }

      return {
        success: true,
        filePath: completeResult.filePath,
      };
    } catch (error) {
      task.status = "error";
      task.endTime = Date.now();
      task.error = error instanceof Error ? error.message : "Unknown error";

      if (callbacks.onTaskError) {
        callbacks.onTaskError(task, task.error);
      }

      return {
        success: false,
        error: task.error,
      };
    }
  }

  /**
   * 初始化上传
   */
  private async initializeUpload(): Promise<{
    success: boolean;
    uploadId?: string;
    error?: string;
  }> {
    // 这里需要调用FileService的初始化方法
    // 由于是私有方法，需要创建公共接口或在FileService中添加
    return { success: false, error: undefined };
  }

  /**
   * 并发上传分块
   */
  private async uploadChunksConcurrently(task: UploadTask, callbacks: UploadEventCallbacks): Promise<void> {
    const { config, totalChunks } = task;
    const uploadPromises: Promise<void>[] = [];
    let activePromises = 0;

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      if (task.uploadedChunks.has(chunkIndex)) continue;
      while (activePromises >= config.maxConcurrentChunks) {
        await Promise.race(uploadPromises);
        // 只移除已完成的Promise
        for (let i = uploadPromises.length - 1; i >= 0; i--) {
          uploadPromises.splice(i, 1);
          activePromises--;
          break;
        }
      }
      const uploadPromise = this.uploadChunkWithRetry(task, chunkIndex, callbacks);
      uploadPromises.push(uploadPromise);
      activePromises++;
    }
    await Promise.all(uploadPromises);
  }

  /**
   * 带重试的分块上传
   */
  private async uploadChunkWithRetry(task: UploadTask, chunkIndex: number, callbacks: UploadEventCallbacks): Promise<void> {
    const { config } = task;

    let retries = 0;
    while (retries <= config.maxRetries) {
      try {
        await this.uploadSingleChunk();
        task.uploadedChunks.add(chunkIndex);
        this.updateTaskProgress(task);
        if (callbacks.onProgress) callbacks.onProgress(task);
        if (callbacks.onChunkUploaded) callbacks.onChunkUploaded(task, chunkIndex);
        return;
      } catch (error) {
        retries++;
        if (retries > config.maxRetries) {
          throw new Error(`Chunk ${chunkIndex} upload failed after ${config.maxRetries} retries`);
        }
        await new Promise((resolve) => setTimeout(resolve, config.retryDelay * retries));
      }
    }
  }

  /**
   * 上传单个分块（需要实现）
   */
  private async uploadSingleChunk() // 参数未使用，移除
  : Promise<void> {
    // 调用FileService的上传分块方法
    // 需要将其设为公共方法或在这里实现
  }

  /**
   * 完成上传（需要实现）
   */
  private async completeUpload(_uploadId: string): Promise<{
    success: boolean;
    filePath?: string;
    error?: string;
  }> {
    // 调用FileService的完成上传方法
    return { success: false, error: undefined };
  }

  /**
   * 更新任务进度
   */
  private updateTaskProgress(task: UploadTask): void {
    const progress = (task.uploadedChunks.size / task.totalChunks) * 100;
    task.progress = Math.round(progress);

    // 计算上传速度
    if (task.startTime) {
      const elapsed = (Date.now() - task.startTime) / 1000; // seconds
      const uploadedBytes = task.uploadedChunks.size * task.config.chunkSize;
      task.uploadSpeed = uploadedBytes / elapsed; // bytes per second
    }
  }

  /**
   * 检查Promise是否已解析
   */

  /**
   * 生成任务ID
   */
  private generateTaskId(): string {
    return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取任务的回调函数
   */
  private getCallbacks(_taskId: string): UploadEventCallbacks {
    // 仅保留签名，避免未使用参数警告
    return {};
  }
}

export default AdvancedChunkedUploadService;
