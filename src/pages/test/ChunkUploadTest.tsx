import React, { useState } from "react";
import FileService from "../../services/fileService";
import message from "../../components/message/Message";
import styles from "./ChunkUploadTest.module.css";

interface ChunkStatus {
  index: number;
  status: "pending" | "uploading" | "uploaded" | "error";
}

const ChunkUploadTest: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [chunkStatuses, setChunkStatuses] = useState<ChunkStatus[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [uploadResult, setUploadResult] = useState<any>(null);

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);

      // 计算分块数量
      const chunkSize = 2 * 1024 * 1024; // 2MB
      const chunkCount = Math.ceil(file.size / chunkSize);

      // 初始化分块状态
      const statuses: ChunkStatus[] = [];
      for (let i = 0; i < chunkCount; i++) {
        statuses.push({ index: i, status: "pending" });
      }
      setChunkStatuses(statuses);

      setLogs([]);
      setUploadResult(null);
      setProgress(0);

      addLog(`选择了文件: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB, ${chunkCount} 个分块)`);
    }
  };

  const updateChunkStatus = (chunkIndex: number, status: ChunkStatus["status"]) => {
    setChunkStatuses((prev) => prev.map((chunk) => (chunk.index === chunkIndex ? { ...chunk, status } : chunk)));
  };

  const handleUpload = async () => {
    if (!selectedFile || uploading) return;

    setUploading(true);
    setProgress(0);
    setLogs([]);
    setUploadResult(null);

    addLog("开始上传...");

    try {
      const result = await FileService.uploadFileByChunks({
        dir_name: "test",
        biz_type: "test",
        biz_id: "1",
        file: selectedFile,
        chunkSize: 2 * 1024 * 1024, // 2MB
        maxRetries: 3,
        onProgress: (progress) => {
          setProgress(progress);
          addLog(`上传进度: ${progress}%`);
        },
        onChunkUploaded: (chunkIndex, totalChunks) => {
          updateChunkStatus(chunkIndex, "uploaded");
          addLog(`分块 ${chunkIndex + 1}/${totalChunks} 上传成功`);
        },
      });

      setUploadResult(result);

      if (result.success) {
        message.success("文件上传成功！");
        addLog(`✅ 上传成功！文件路径: ${result.filePath}`);
      } else {
        message.error(result.error || "上传失败");
        addLog(`❌ 上传失败: ${result.error}`);
      }
    } catch (error: any) {
      message.error(error.message || "上传出错");
      addLog(`❌ 上传出错: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);

      // 计算分块数量
      const chunkSize = 2 * 1024 * 1024; // 2MB
      const chunkCount = Math.ceil(file.size / chunkSize);

      // 初始化分块状态
      const statuses: ChunkStatus[] = [];
      for (let i = 0; i < chunkCount; i++) {
        statuses.push({ index: i, status: "pending" });
      }
      setChunkStatuses(statuses);

      setLogs([]);
      setUploadResult(null);
      setProgress(0);

      addLog(`拖拽了文件: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB, ${chunkCount} 个分块)`);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className={styles.container}>
      <h1>分块上传测试工具</h1>
      <p>这个工具用于测试大文件分块上传功能，验证是否还有重复上传问题。</p>

      <div className={styles.uploadArea} onDragOver={handleDragOver} onDrop={handleDrop}>
        <input type="file" id="fileInput" onChange={handleFileSelect} className={styles.fileInput} />
        <label htmlFor="fileInput" className={styles.uploadLabel}>
          <div className={styles.uploadIcon}>📁</div>
          <p>点击选择文件或拖拽文件到此处</p>
        </label>
      </div>

      {selectedFile && (
        <div className={styles.fileInfo}>
          <h3>文件信息</h3>
          <p>
            <strong>文件名:</strong> {selectedFile.name}
          </p>
          <p>
            <strong>文件大小:</strong> {formatFileSize(selectedFile.size)}
          </p>
          <p>
            <strong>分块数量:</strong> {chunkStatuses.length}
          </p>
          <p>
            <strong>分块大小:</strong> 2MB
          </p>
        </div>
      )}

      <div className={styles.buttonGroup}>
        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleUpload} disabled={!selectedFile || uploading}>
          {uploading ? "上传中..." : "开始上传"}
        </button>
        <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={clearLogs}>
          清空日志
        </button>
      </div>

      {(uploading || progress > 0) && (
        <div className={styles.progressContainer}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }}>
              {progress}%
            </div>
          </div>
        </div>
      )}

      {chunkStatuses.length > 0 && (
        <div className={styles.chunkInfo}>
          <h3>分块状态</h3>
          <div className={styles.chunkGrid}>
            {chunkStatuses.map((chunk) => (
              <div
                key={chunk.index}
                className={`${styles.chunkItem} ${styles[`chunk${chunk.status.charAt(0).toUpperCase() + chunk.status.slice(1)}`]}`}
              >
                分块 {chunk.index}
                {chunk.status === "uploaded" && " ✓"}
                {chunk.status === "uploading" && " ..."}
                {chunk.status === "error" && " ✗"}
              </div>
            ))}
          </div>
          <div className={styles.legend}>
            <span className={`${styles.legendItem} ${styles.legendPending}`}>待上传</span>
            <span className={`${styles.legendItem} ${styles.legendUploading}`}>上传中</span>
            <span className={`${styles.legendItem} ${styles.legendUploaded}`}>已上传</span>
            <span className={`${styles.legendItem} ${styles.legendError}`}>错误</span>
          </div>
        </div>
      )}

      <div className={styles.logContainer}>
        <h3>上传日志</h3>
        <div className={styles.log}>
          {logs.length === 0 ? (
            <div className={styles.emptyLog}>等待上传开始...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className={styles.logEntry}>
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      {uploadResult && (
        <div className={`${styles.result} ${uploadResult.success ? styles.success : styles.error}`}>
          <h3>上传结果</h3>
          <p>
            <strong>状态:</strong> {uploadResult.success ? "成功" : "失败"}
          </p>
          {uploadResult.success && (
            <p>
              <strong>文件路径:</strong> {uploadResult.filePath}
            </p>
          )}
          {uploadResult.uploadId && (
            <p>
              <strong>Upload ID:</strong> {uploadResult.uploadId}
            </p>
          )}
          {uploadResult.error && (
            <p>
              <strong>错误信息:</strong> {uploadResult.error}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ChunkUploadTest;
