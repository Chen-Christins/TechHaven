import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    FaCloudUploadAlt,
    FaFileAlt,
    FaTrash,
    FaArrowLeft,
    FaClock,
    FaInfoCircle,
    FaCheckCircle,
    FaExclamationCircle,
    FaBookOpen,
} from "react-icons/fa";
import Navbar from "../../components/navbar/Navbar";
import Footer from "../../components/footer/Footer";
import message from "../../components/message/Message";
import AuthRequired from "../../components/auth/AuthRequired";
import AssignmentSubmitSkeleton from "../../components/assignment/AssignmentSubmitSkeleton";
import AssignmentService from "../../services/assignmentService";
import FileService from "../../services/fileService";
import styles from "./AssignmentSubmit.module.css";

interface Assignment {
    id: string | number;
    name: string;
    description: string;
    subject_name: string;
    end_time: number;
    status: string;
    priority: number;
    file_size: number;
    file_type: string;
}

const STATUS_MAP: { [key: string]: string } = {
    "0": "pending", // 进行中
    "1": "open", // 已提交
    "2": "closed", // 已逾期
};

const AssignmentSubmit: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [files, setFiles] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchAssignmentDetail = async () => {
            if (!id) {
                message.error("作业ID不能为空");
                navigate("/assignments");
                return;
            }

            try {
                setLoading(true);
                setError(null);
                const response = await AssignmentService.getAssignmentDetail({ id });
                setAssignment(response);
            } catch (err: any) {
                setError(err.message || "获取作业详情失败");
                // 如果不是资源不存在才弹窗提示
                if (!err.message || !/不存在|not found|404/i.test(err.message)) {
                    message.error(err.message || "获取作业详情失败");
                }
                // 延迟跳转，让用户看到错误信息
                setTimeout(() => {
                    navigate("/assignments");
                }, 2000);
            } finally {
                setLoading(false);
            }
        };

        fetchAssignmentDetail();
    }, [id, navigate]);

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const droppedFiles = Array.from(e.dataTransfer.files);
        validateAndAddFiles(droppedFiles);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files);
            validateAndAddFiles(selectedFiles);
        }
    };

    const validateAndAddFiles = (newFiles: File[]) => {
        if (!assignment) return;

        const validFiles: File[] = [];
        const maxFileSize = assignment.file_size; // API返回的文件大小（MB）

        newFiles.forEach((file) => {
            const fileSizeMB = file.size / (1024 * 1024);
            if (fileSizeMB > maxFileSize) {
                message.error(`文件 ${file.name} 超过大小限制 (${maxFileSize}MB)`);
                return;
            }

            // 检查文件类型（根据API返回的file_type字段进行验证）
            const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
            const allowedTypes = assignment.file_type.split(",").map((type) => type.trim());

            if (!allowedTypes.includes(fileExtension)) {
                message.error(`文件 ${file.name} 格式不支持，仅支持 ${assignment.file_type}`);
                return;
            }

            validFiles.push(file);
        });

        setFiles((prev) => [...prev, ...validFiles]);
    };

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (files.length === 0) {
            message.warn("请至少上传一个文件");
            return;
        }

        if (!assignment) {
            message.error("作业信息获取失败，请刷新页面重试");
            return;
        }

        setSubmitting(true);
        setUploadProgress(0);
        try {
            // 只支持单文件分块上传（如需多文件可循环）
            const file = files[0];
            const result = await FileService.uploadFileByChunks({
                dir_name: `${assignment.name}`,
                biz_type: "assignment_submission",
                biz_id: String(assignment.id),
                file,
                onProgress: (progress) => {
                    setUploadProgress(progress);
                },
            });

            if (result.success) {
                message.success("作业提交成功！");
                navigate("/assignments");
            } else {
                message.error(result.error || "提交失败，请重试");
            }
        } catch (error: any) {
            console.error("提交失败:", error);
            const errorMessage = error.response?.data?.message || error.message || "提交失败，请重试";
            message.error(errorMessage);
        } finally {
            setSubmitting(false);
            setUploadProgress(0);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp * 1000);
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        const h = String(date.getHours()).padStart(2, "0");
        const min = String(date.getMinutes()).padStart(2, "0");
        return `${y}-${m}-${d} ${h}:${min}`;
    };

    const PRIORITY_NUMBER_MAP_STR: Record<number, string> = {
        1: "low",
        2: "medium",
        3: "high",
        4: "urgent",
    };

    const getPriorityBadge = (priority: number) => {
        const priorityStr = PRIORITY_NUMBER_MAP_STR[priority] || "medium";
        switch (priorityStr) {
            case "urgent":
                return <span className={`${styles.priorityBadge} ${styles.priorityUrgent}`}>紧急</span>;
            case "high":
                return <span className={`${styles.priorityBadge} ${styles.priorityHigh}`}>高优先级</span>;
            case "medium":
                return <span className={`${styles.priorityBadge} ${styles.priorityMedium}`}>中优先级</span>;
            case "low":
                return <span className={`${styles.priorityBadge} ${styles.priorityLow}`}>低优先级</span>;
            default:
                return <span className={`${styles.priorityBadge} ${styles.priorityMedium}`}>中优先级</span>;
        }
    };

    const getStatusBadge = (status: string) => {
        const statusString = STATUS_MAP[status] || "pending";
        switch (statusString) {
            case "open":
                return (
                    <span className={`${styles.statusBadge} ${styles.statusSubmitted}`}>
                        <FaCheckCircle /> 开启中
                    </span>
                );
            case "closed":
                return (
                    <span className={`${styles.statusBadge} ${styles.statusLate}`}>
                        <FaExclamationCircle /> 已关闭
                    </span>
                );
            default:
                return (
                    <span className={`${styles.statusBadge} ${styles.statusPending}`}>
                        <FaClock /> 进行中
                    </span>
                );
        }
    };

    const isAssignmentOpen = () => {
        const statusString = STATUS_MAP[assignment?.status || "0"] || "pending";
        return statusString !== "closed";
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <Navbar />
                <div className={styles.mainContent}>
                    <AuthRequired message="您需要登录后才能查看作业详情和提交作业。">
                        <AssignmentSubmitSkeleton />
                    </AuthRequired>
                </div>
                <Footer companyName="TechBlog" startYear={2025} />
            </div>
        );
    }

    if (error || !assignment) {
        return (
            <div className={styles.container}>
                <Navbar />
                <div className={styles.mainContent}>
                    <AuthRequired message="您需要登录后才能查看作业详情和提交作业。">
                        <div className={styles.errorContainer}>
                            <FaExclamationCircle className={styles.errorIcon} />
                            <h2 className={styles.errorTitle}>加载失败</h2>
                            <p className={styles.errorMessage}>{error || "未找到该作业"}</p>
                            <button className={styles.btn} onClick={() => navigate("/assignments")}>
                                返回作业列表
                            </button>
                        </div>
                    </AuthRequired>
                </div>
                <Footer companyName="TechBlog" startYear={2025} />
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <Navbar />

            <div className={styles.mainContent}>
                <AuthRequired message="您需要登录后才能查看作业详情和提交作业。">
                    <div className={styles.card}>
                        <div
                            style={{
                                marginBottom: "2rem",
                                paddingBottom: "0.6rem",
                                borderBottom: "1px solid var(--border-secondary)",
                            }}
                        >
                            <button className={styles.backButton} onClick={() => navigate(-1)}>
                                <FaArrowLeft /> 返回上一页
                            </button>
                            <div className={styles.headerContent}>
                                <div className={styles.titleGroup}>
                                    <h1 className={styles.pageTitle}>{assignment.name}</h1>
                                    <div className={styles.courseName}>
                                        <FaBookOpen /> {assignment.subject_name}
                                    </div>
                                </div>
                                {getStatusBadge(assignment.status)}
                            </div>
                        </div>

                        <div style={{ marginBottom: "2rem" }}>
                            <div className={styles.sectionHeader}>
                                <div className={styles.sectionIcon}>
                                    <FaInfoCircle />
                                </div>
                                <h2 className={styles.sectionTitle}>任务详情</h2>
                            </div>

                            <div className={styles.infoGrid}>
                                <div className={styles.infoCard}>
                                    <span className={styles.infoLabel}>截止时间</span>
                                    <span className={`${styles.infoValue} ${styles.deadlineValue}`}>
                                        {formatDate(assignment.end_time)}
                                    </span>
                                </div>
                                <div className={styles.infoCard}>
                                    <span className={styles.infoLabel}>优先级</span>
                                    <span className={styles.infoValue}>{getPriorityBadge(assignment.priority)}</span>
                                </div>
                                <div className={styles.infoCard}>
                                    <span className={styles.infoLabel}>文件大小限制</span>
                                    <span className={styles.infoValue}>{Math.round(assignment.file_size)} MB</span>
                                </div>
                                <div className={styles.infoCard}>
                                    <span className={styles.infoLabel}>允许文件格式</span>
                                    <span className={styles.infoValue}>{assignment.file_type}</span>
                                </div>
                            </div>

                            <div className={styles.description}>{assignment.description}</div>
                        </div>

                        <div>
                            <div className={styles.sectionHeader}>
                                <div className={styles.sectionIcon}>
                                    <FaCloudUploadAlt />
                                </div>
                                <h2 className={styles.sectionTitle}>任务提交</h2>
                            </div>

                            <div className={styles.uploadContainer}>
                                <div
                                    className={`${styles.uploadArea} ${isDragging ? styles.active : ""} ${!isAssignmentOpen() ? styles.disabled : ""}`}
                                    onDragEnter={isAssignmentOpen() ? handleDragEnter : undefined}
                                    onDragLeave={isAssignmentOpen() ? handleDragLeave : undefined}
                                    onDragOver={isAssignmentOpen() ? handleDragOver : undefined}
                                    onDrop={isAssignmentOpen() ? handleDrop : undefined}
                                    onClick={isAssignmentOpen() ? () => fileInputRef.current?.click() : undefined}
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        style={{ display: "none" }}
                                        multiple
                                        onChange={handleFileSelect}
                                        disabled={!isAssignmentOpen()}
                                    />
                                    <div className={styles.uploadContent}>
                                        <div className={styles.uploadIconWrapper}>
                                            <FaCloudUploadAlt />
                                        </div>
                                        <div className={styles.uploadTitle}>
                                            {isAssignmentOpen()
                                                ? "点击或拖拽文件到此处上传"
                                                : "任务已关闭，无法上传文件"}
                                        </div>
                                        <div className={styles.uploadDesc}>
                                            {isAssignmentOpen()
                                                ? `支持 ${assignment.file_type} 格式文件`
                                                : "请联系管理员重新开启作业提交"}
                                        </div>
                                        <div className={styles.uploadLimit}>
                                            单个文件不超过 {Math.round(assignment.file_size)}MB
                                        </div>
                                    </div>
                                </div>

                                {files.length > 0 && (
                                    <div className={styles.fileList}>
                                        {files.map((file, index) => (
                                            <div key={index} className={styles.fileItem}>
                                                <div className={styles.fileLeft}>
                                                    <div className={styles.fileTypeIcon}>
                                                        <FaFileAlt />
                                                    </div>
                                                    <div className={styles.fileDetails}>
                                                        <div className={styles.fileName}>{file.name}</div>
                                                        <div className={styles.fileSize}>
                                                            {formatFileSize(file.size)}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    className={styles.deleteBtn}
                                                    onClick={() => removeFile(index)}
                                                    title="移除文件"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className={styles.actionBar}>
                                <button
                                    className={`${styles.btn} ${styles.btnSecondary}`}
                                    onClick={() => navigate(-1)}
                                    disabled={submitting}
                                >
                                    取消
                                </button>
                                <button
                                    className={`${styles.btn} ${styles.btnPrimary}`}
                                    onClick={handleSubmit}
                                    disabled={submitting || files.length === 0 || !isAssignmentOpen()}
                                >
                                    {submitting
                                        ? uploadProgress > 0 && uploadProgress < 100
                                            ? `上传中...${uploadProgress}%`
                                            : "提交中..."
                                        : !isAssignmentOpen()
                                          ? "作业已关闭"
                                          : "确认提交"}
                                </button>
                                {/* 上传进度条 */}
                                {submitting && uploadProgress > 0 && uploadProgress < 100 && (
                                    <div className={styles.progressBarWrapper}>
                                        <div className={styles.progressBar} style={{ width: `${uploadProgress}%` }} />
                                        <span className={styles.progressText}>{uploadProgress}%</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </AuthRequired>
            </div>

            <Footer companyName="TechBlog" startYear={2025} />
        </div>
    );
};

export default AssignmentSubmit;
