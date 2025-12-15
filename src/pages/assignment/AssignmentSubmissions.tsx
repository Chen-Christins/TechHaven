import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    FaArrowLeft,
    FaBookOpen,
    FaCheckCircle,
    FaExclamationCircle,
    FaClock,
    FaFileAlt,
    FaDownload,
    FaUser,
    FaCalendarAlt,
    FaHourglassHalf,
    FaChevronLeft,
    FaChevronRight,
} from "react-icons/fa";
import Navbar from "../../components/navbar/Navbar";
import Footer from "../../components/footer/Footer";
import AuthRequired from "../../components/auth/AuthRequired";
import Skeleton from "../../components/skeleton/Skeleton";
import AssignmentService from "../../services/assignmentService";
import styles from "./AssignmentSubmissions.module.css";

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

interface AssignmentSubmissionItem {
    id: string | number;
    user_id: string | number;
    username: string;
    user_avatar?: string;
    file_name: string;
    file_size: number;
    file_url: string;
    submit_time: number;
    status: "submitted" | "late" | "pending";
    score?: number;
    feedback?: string;
}

const AssignmentSubmissions: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [submissions, setSubmissions] = useState<AssignmentSubmissionItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(3); // 设置为3条每页以便测试分页

    useEffect(() => {
        const fetchData = async () => {
            if (!id) {
                setError("作业ID不能为空");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                // 获取作业详情
                const assignmentResponse = await AssignmentService.getAssignmentDetail({ id });
                setAssignment(assignmentResponse);

                // 获取提交列表 - 暂时使用mock数据
                // const submissionsResponse = await AssignmentService.getAssignmentSubmissions({ id });
                // setSubmissions(submissionsResponse.list || []);

                // Mock数据
                const mockSubmissions: AssignmentSubmissionItem[] = [
                    // {
                    //     id: 1,
                    //     user_id: 101,
                    //     username: "张三",
                    //     user_avatar: "",
                    //     file_name: "数据结构作业.pdf",
                    //     file_size: 2048576,
                    //     file_url: "/files/mock/数据结构作业.pdf",
                    //     submit_time: Math.floor(Date.now() / 1000) - 86400,
                    //     status: "submitted",
                    //     score: 95,
                    //     feedback: "完成得很好！代码逻辑清晰，注释完整。",
                    // },
                    // {
                    //     id: 2,
                    //     user_id: 102,
                    //     username: "李四",
                    //     user_avatar: "",
                    //     file_name: "homework2.docx",
                    //     file_size: 1536000,
                    //     file_url: "/files/mock/homework2.docx",
                    //     submit_time: Math.floor(Date.now() / 1000) - 172800,
                    //     status: "late",
                    //     score: 88,
                    //     feedback: "内容不错，但提交晚了两天。算法实现正确，建议优化时间复杂度。",
                    // },
                    // {
                    //     id: 3,
                    //     user_id: 103,
                    //     username: "王五",
                    //     user_avatar: "",
                    //     file_name: "assignment.zip",
                    //     file_size: 5120000,
                    //     file_url: "/files/mock/assignment.zip",
                    //     submit_time: Math.floor(Date.now() / 1000) - 3600,
                    //     status: "submitted",
                    //     score: 92,
                    //     feedback: "优秀！代码结构良好，测试用例覆盖全面。"
                    // },
                    // {
                    //     id: 4,
                    //     user_id: 104,
                    //     username: "赵六",
                    //     user_avatar: "",
                    //     file_name: "算法实现.cpp",
                    //     file_size: 896000,
                    //     file_url: "/files/mock/算法实现.cpp",
                    //     submit_time: Math.floor(Date.now() / 1000) - 43200,
                    //     status: "submitted",
                    //     score: 85,
                    //     feedback: "基本功能实现正确，但缺少边界条件处理。"
                    // },
                    // {
                    //     id: 5,
                    //     user_id: 105,
                    //     username: "钱七",
                    //     user_avatar: "",
                    //     file_name: "实验报告.pdf",
                    //     file_size: 3072000,
                    //     file_url: "/files/mock/实验报告.pdf",
                    //     submit_time: Math.floor(Date.now() / 1000) - 259200,
                    //     status: "late",
                    //     score: 78,
                    //     feedback: "报告内容详细，但部分实验结果分析不够深入。"
                    // },
                    // {
                    //     id: 6,
                    //     user_id: 106,
                    //     username: "孙八",
                    //     user_avatar: "",
                    //     file_name: "项目代码.tar.gz",
                    //     file_size: 10240000,
                    //     file_url: "/files/mock/项目代码.tar.gz",
                    //     submit_time: Math.floor(Date.now() / 1000) - 7200,
                    //     status: "submitted",
                    //     score: 96,
                    //     feedback: "非常出色的项目！代码规范，功能完善，性能优秀。"
                    // },
                    // {
                    //     id: 7,
                    //     user_id: 107,
                    //     username: "周九",
                    //     user_avatar: "",
                    //     file_name: "数据分析.xlsx",
                    //     file_size: 2560000,
                    //     file_url: "/files/mock/数据分析.xlsx",
                    //     submit_time: Math.floor(Date.now() / 1000) - 10800,
                    //     status: "submitted",
                    //     score: 90,
                    //     feedback: "数据分析准确，图表清晰，结论合理。"
                    // },
                    // {
                    //     id: 8,
                    //     user_id: 108,
                    //     username: "吴十",
                    //     user_avatar: "",
                    //     file_name: "设计稿.psd",
                    //     file_size: 8192000,
                    //     file_url: "/files/mock/设计稿.psd",
                    //     submit_time: Math.floor(Date.now() / 1000) - 14400,
                    //     status: "late",
                    //     score: 82,
                    //     feedback: "设计创意不错，但需要改进配色方案。"
                    // },
                    // {
                    //     id: 9,
                    //     user_id: 109,
                    //     username: "郑十一",
                    //     user_avatar: "",
                    //     file_name: "论文.doc",
                    //     file_size: 128000,
                    //     file_url: "/files/mock/论文.doc",
                    //     submit_time: Math.floor(Date.now() / 1000) - 21600,
                    //     status: "submitted",
                    //     score: 87,
                    //     feedback: "论文结构完整，论据充分，参考文献格式正确。"
                    // }
                ];

                setSubmissions(mockSubmissions);
            } catch (err: any) {
                setError(err.message || "获取数据失败");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    // 分页计算
    const totalPages = Math.ceil(submissions.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const currentSubmissions = submissions.slice(startIndex, endIndex);

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp * 1000);
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        const h = String(date.getHours()).padStart(2, "0");
        const min = String(date.getMinutes()).padStart(2, "0");
        return `${y}-${m}-${d} ${h}:${min}`;
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const getStatusBadge = (status: string, submitTime: number, endTime: number) => {
        if (status === "submitted") {
            if (submitTime > endTime) {
                return (
                    <span className={`${styles.statusBadge} ${styles.statusLate}`}>
                        <FaExclamationCircle /> 迟交
                    </span>
                );
            }
            return (
                <span className={`${styles.statusBadge} ${styles.statusSubmitted}`}>
                    <FaCheckCircle /> 已提交
                </span>
            );
        } else if (status === "late") {
            return (
                <span className={`${styles.statusBadge} ${styles.statusLate}`}>
                    <FaExclamationCircle /> 迟交
                </span>
            );
        } else {
            return (
                <span className={`${styles.statusBadge} ${styles.statusPending}`}>
                    <FaHourglassHalf /> 未提交
                </span>
            );
        }
    };

    const getScoreBadge = (score?: number) => {
        if (score === undefined) return null;

        let className = styles.scoreBadge;
        if (score >= 90) className += ` ${styles.scoreExcellent}`;
        else if (score >= 80) className += ` ${styles.scoreGood}`;
        else if (score >= 70) className += ` ${styles.scoreAverage}`;
        else className += ` ${styles.scorePoor}`;

        return <span className={className}>{score} 分</span>;
    };

    const handleDownload = (submission: AssignmentSubmissionItem) => {
        // 创建一个临时链接来下载文件
        const link = document.createElement("a");
        link.href = submission.file_url;
        link.download = submission.file_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <Navbar />
                <div className={styles.mainContent}>
                    <AuthRequired message="您需要登录后才能查看作业提交详情。">
                        <div className={styles.loadingContainer}>
                            <Skeleton
                                variant="rectangular"
                                width="100%"
                                height={200}
                                style={{ marginBottom: "2rem" }}
                            />
                            <Skeleton variant="text" width="60%" height={32} style={{ marginBottom: "1rem" }} />
                            {Array.from({ length: 3 }).map((_, index) => (
                                <div key={index} className={styles.submissionCard}>
                                    <Skeleton variant="rectangular" width="100%" height={120} />
                                </div>
                            ))}
                        </div>
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
                    <AuthRequired message="您需要登录后才能查看作业提交详情。">
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
                <AuthRequired message="您需要登录后才能查看作业提交详情。">
                    <div className={styles.card}>
                        {/* 头部信息 */}
                        <div className={styles.header}>
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
                                <div className={styles.stats}>
                                    <span className={styles.statItem}>
                                        <FaUser /> {submissions.length} 人提交
                                    </span>
                                    <span className={styles.statItem}>
                                        <FaCalendarAlt /> 截止 {formatDate(assignment.end_time)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 作业描述 */}
                        <div className={styles.descriptionSection}>
                            <h3 className={styles.sectionTitle}>作业描述</h3>
                            <p className={styles.description}>{assignment.description}</p>
                        </div>

                        {/* 提交列表 */}
                        <div className={styles.submissionsSection}>
                            <h3 className={styles.sectionTitle}>提交详情</h3>

                            {submissions.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <FaFileAlt className={styles.emptyIcon} />
                                    <h3 className={styles.emptyText}>暂无提交</h3>
                                    <p className={styles.emptySubtext}>还没有学生提交作业</p>
                                </div>
                            ) : (
                                <>
                                    <div className={styles.submissionsList}>
                                        {currentSubmissions.map((submission) => (
                                            <div key={submission.id} className={styles.submissionCard}>
                                                <div className={styles.submissionHeader}>
                                                    <div className={styles.userInfo}>
                                                        <div className={styles.avatar}>
                                                            {submission.user_avatar ? (
                                                                <img
                                                                    src={submission.user_avatar}
                                                                    alt={submission.username}
                                                                />
                                                            ) : (
                                                                <FaUser />
                                                            )}
                                                        </div>
                                                        <div className={styles.userDetails}>
                                                            <h4 className={styles.username}>{submission.username}</h4>
                                                            <p className={styles.submitTime}>
                                                                <FaClock /> {formatDate(submission.submit_time)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className={styles.submissionStatus}>
                                                        {getStatusBadge(
                                                            submission.status,
                                                            submission.submit_time,
                                                            assignment.end_time,
                                                        )}
                                                        {getScoreBadge(submission.score)}
                                                    </div>
                                                </div>

                                                <div className={styles.fileInfo}>
                                                    <div className={styles.fileDetails}>
                                                        <FaFileAlt className={styles.fileIcon} />
                                                        <div>
                                                            <p className={styles.fileName}>{submission.file_name}</p>
                                                            <p className={styles.fileSize}>
                                                                {formatFileSize(submission.file_size)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        className={styles.downloadBtn}
                                                        onClick={() => handleDownload(submission)}
                                                    >
                                                        <FaDownload /> 下载
                                                    </button>
                                                </div>

                                                {submission.feedback && (
                                                    <div className={styles.feedback}>
                                                        <h5 className={styles.feedbackTitle}>教师评语</h5>
                                                        <p className={styles.feedbackContent}>{submission.feedback}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* 分页组件 */}
                                    {totalPages > 1 && (
                                        <div className={styles.pagination}>
                                            <button
                                                className={`${styles.pageBtn} ${currentPage === 1 ? styles.disabled : ""}`}
                                                onClick={() => setCurrentPage(currentPage - 1)}
                                                disabled={currentPage === 1}
                                            >
                                                <FaChevronLeft />
                                                上一页
                                            </button>

                                            <div className={styles.pageNumbers}>
                                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                                    <button
                                                        key={page}
                                                        className={`${styles.pageNumber} ${currentPage === page ? styles.active : ""}`}
                                                        onClick={() => setCurrentPage(page)}
                                                    >
                                                        {page}
                                                    </button>
                                                ))}
                                            </div>

                                            <button
                                                className={`${styles.pageBtn} ${currentPage === totalPages ? styles.disabled : ""}`}
                                                onClick={() => setCurrentPage(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                            >
                                                下一页
                                                <FaChevronRight />
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </AuthRequired>
            </div>
            <Footer companyName="TechBlog" startYear={2025} />
        </div>
    );
};

export default AssignmentSubmissions;
