import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { decodeId } from "../../utils/hashId";
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
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import Navbar from "../../components/navbar/Navbar";
import Footer from "../../components/footer/Footer";
import AuthRequired from "../../components/auth/AuthRequired";
import Skeleton from "../../components/skeleton/Skeleton";
import AssignmentService from "../../services/assignmentService";
import styles from "./AssignmentSubmissions.module.css";
import message from "../../components/message/Message";
import FileService from "../../services/fileService";
import ErrorState from "../../components/errorState/ErrorState";

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

// 文件级别的接口（对应API的AssignmentSubmissionItem）
interface SubmissionFile {
  id: string | number;
  file_name: string;
  file_path: string;
  file_size: number;
  score?: number;
  feedback?: string;
}

// 用户提交级别的接口（对应API的GetAssignmentSubmissionsResponse）
interface AssignmentSubmissionItem {
  user_id: string | number;
  user_name: string;
  user_avatar?: string;
  submit_time: number;
  status: number;
  total?: number;
  list?: Array<SubmissionFile>;
}

const AssignmentSubmissions: React.FC = () => {
  const { id: encodedId } = useParams();
  const id = encodedId ? decodeId(encodedId) : null;
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<AssignmentSubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10); // 每页显示10条记录
  const [expandedSubmissions, setExpandedSubmissions] = useState<Set<string | number>>(new Set());
  const [downloadingFiles, setDownloadingFiles] = useState<Set<string | number>>(new Set());
  const [downloadingAll, setDownloadingAll] = useState<Set<string | number>>(new Set());

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

        // 获取提交列表
        const submissionsResponse = await AssignmentService.getAssignmentSubmissions({ id });

        // 新API可能返回的数据结构：
        // 1. 单个用户提交对象（当前用户查看自己的提交）
        // 2. 用户提交数组（教师查看所有用户的提交）
        let submissionsData: AssignmentSubmissionItem[] = [];

        if (Array.isArray(submissionsResponse)) {
          // 返回的是用户提交数组
          submissionsData = submissionsResponse;
        } else if (submissionsResponse && typeof submissionsResponse === "object") {
          // 单个用户提交对象，包装成数组
          submissionsData = [submissionsResponse];
        }

        setSubmissions(submissionsData);
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

  const getStatusBadge = (status: number, submitTime: number, endTime: number) => {
    // 根据API文档：0-未提交，1-已提交，2-迟交
    if (status === 1) {
      // 已提交，检查是否迟交
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
    } else if (status === 2) {
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

  const handleDownload = async (file: SubmissionFile) => {
    // 防止重复点击
    if (downloadingFiles.has(file.id)) {
      return;
    }

    try {
      // 添加到下载中状态
      setDownloadingFiles((prev) => new Set(prev).add(file.id));

      await FileService.downloadFile(file.file_path, file.file_name);
    } catch (err: any) {
      message.error(err.message || "下载失败");
    } finally {
      // 从下载中状态移除
      setDownloadingFiles((prev) => {
        const newSet = new Set(prev);
        newSet.delete(file.id);
        return newSet;
      });
    }
  };

  const handleDownloadAll = async (submission: AssignmentSubmissionItem) => {
    // 防止重复点击
    if (downloadingAll.has(submission.user_id)) {
      return;
    }

    try {
      // 添加到下载中状态
      setDownloadingAll((prev) => new Set(prev).add(submission.user_id));

      // 这里应该调用打包下载的API
      // 暂时使用循环下载单个文件作为替代方案
      if (submission.list && submission.list.length > 0) {
        for (const file of submission.list) {
          await FileService.downloadFile(file.file_path, file.file_name);
        }
      }
    } catch (err: any) {
      message.error(err.message || "打包下载失败");
    } finally {
      // 从下载中状态移除
      setDownloadingAll((prev) => {
        const newSet = new Set(prev);
        newSet.delete(submission.user_id);
        return newSet;
      });
    }
  };

  const getTotalFileSize = (files: SubmissionFile[]) => {
    return files.reduce((total, file) => total + file.file_size, 0);
  };

  const toggleSubmissionExpansion = (submissionId: string | number) => {
    setExpandedSubmissions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(submissionId)) {
        newSet.delete(submissionId);
      } else {
        newSet.add(submissionId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <Navbar />
        <div className={styles.mainContent}>
          <AuthRequired message="您需要登录后才能查看作业提交详情。">
            <div className={styles.loadingContainer}>
              {/* 头部骨架 */}
              <div className={styles.loadingHeader}>
                <Skeleton variant="rectangular" width={80} height={20} style={{ marginBottom: "1rem" }} />
                <div className={styles.loadingHeaderContent}>
                  <div className={styles.loadingTitleGroup}>
                    <Skeleton variant="rectangular" width={200} height={32} style={{ marginBottom: "0.5rem" }} />
                    <Skeleton variant="rectangular" width={120} height={24} />
                  </div>
                  <div className={styles.loadingStats}>
                    <Skeleton variant="rectangular" width={100} height={20} style={{ marginRight: "1.5rem" }} />
                    <Skeleton variant="rectangular" width={120} height={20} />
                  </div>
                </div>
              </div>

              {/* 作业描述骨架 */}
              <div className={styles.loadingDescription}>
                <Skeleton variant="rectangular" width={120} height={24} style={{ marginBottom: "0.75rem" }} />
                <Skeleton variant="text" lines={2} style={{ marginBottom: "2rem" }} />
              </div>

              {/* 提交列表骨架 */}
              <div className={styles.loadingSubmissions}>
                <Skeleton variant="rectangular" width={100} height={24} style={{ marginBottom: "1rem" }} />
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className={styles.loadingSubmissionCard}>
                    <div className={styles.loadingSubmissionHeader}>
                      <div className={styles.loadingUserInfo}>
                        <Skeleton variant="circular" width={48} height={48} style={{ marginRight: "1rem" }} />
                        <div>
                          <Skeleton variant="rectangular" width={120} height={20} style={{ marginBottom: "0.5rem" }} />
                          <Skeleton variant="rectangular" width={100} height={16} />
                        </div>
                      </div>
                      <div className={styles.loadingStatus}>
                        <Skeleton variant="rectangular" width={80} height={24} style={{ marginRight: "0.5rem" }} />
                        <Skeleton variant="rectangular" width={50} height={24} />
                      </div>
                    </div>
                    <div className={styles.loadingFileInfo}>
                      <div className={styles.loadingFileDetails}>
                        <Skeleton variant="circular" width={32} height={32} style={{ marginRight: "0.75rem" }} />
                        <div>
                          <Skeleton variant="rectangular" width={150} height={18} style={{ marginBottom: "0.25rem" }} />
                          <Skeleton variant="rectangular" width={80} height={14} />
                        </div>
                      </div>
                      <Skeleton variant="rectangular" width={80} height={36} style={{ borderRadius: "6px" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </AuthRequired>
        </div>
        <Footer startYear={2025} />
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className={styles.container}>
        <Navbar />
        <div className={styles.mainContent}>
          <AuthRequired message="您需要登录后才能查看作业提交详情。">
            <ErrorState
              title="加载失败"
              message={error || "未找到该作业"}
              icon={<FaExclamationCircle />}
              actionText="返回作业列表"
              onAction={() => navigate("/assignments")}
            />
          </AuthRequired>
        </div>
        <Footer startYear={2025} />
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
                      <div key={submission.user_id} className={styles.submissionCard}>
                        <div className={styles.submissionHeader}>
                          <div className={styles.userInfo}>
                            <div className={styles.avatar}>
                              {submission.user_avatar ? <img src={submission.user_avatar} alt={submission.user_name} /> : <FaUser />}
                            </div>
                            <div className={styles.userDetails}>
                              <h4 className={styles.username}>{submission.user_name}</h4>
                              <p className={styles.submitTime}>
                                <FaClock /> {formatDate(submission.submit_time)}
                              </p>
                            </div>
                          </div>
                          <div className={styles.submissionStatus}>
                            {getStatusBadge(submission.status, submission.submit_time, assignment.end_time)}
                            {getScoreBadge(submission.list && submission.list.length > 0 ? submission.list[0].score : undefined)}
                          </div>
                        </div>

                        {/* 文件信息显示 */}
                        {submission.list && submission.list.length > 0 && (
                          <>
                            <div className={styles.fileInfo}>
                              <div className={styles.fileDetails}>
                                <FaFileAlt className={styles.fileIcon} />
                                <div>
                                  <p className={styles.fileName}>
                                    {submission.list && submission.list.length === 1
                                      ? submission.list[0]!.file_name
                                      : submission.list
                                        ? `${submission.list.length} 个文件`
                                        : "0 个文件"}
                                  </p>
                                  <p className={styles.fileSize}>总大小: {formatFileSize(getTotalFileSize(submission.list || []))}</p>
                                </div>
                              </div>
                              <div className={styles.fileActions}>
                                {submission.list && submission.list.length === 1 ? (
                                  <button
                                    className={`${styles.downloadBtn} ${downloadingFiles.has(submission.list![0].id) ? styles.downloading : ""}`}
                                    onClick={() => handleDownload(submission.list![0])}
                                    disabled={downloadingFiles.has(submission.list![0].id)}
                                  >
                                    {downloadingFiles.has(submission.list![0].id) ? (
                                      <>
                                        <FaDownload className={styles.spinning} /> 下载中...
                                      </>
                                    ) : (
                                      <>
                                        <FaDownload /> 下载
                                      </>
                                    )}
                                  </button>
                                ) : (
                                  <>
                                    <button
                                      className={`${styles.downloadAllBtn} ${downloadingAll.has(submission.user_id) ? styles.downloading : ""}`}
                                      onClick={() => handleDownloadAll(submission)}
                                      disabled={downloadingAll.has(submission.user_id)}
                                    >
                                      {downloadingAll.has(submission.user_id) ? (
                                        <>
                                          <FaDownload className={styles.spinning} /> 打包中...
                                        </>
                                      ) : (
                                        <>
                                          <FaDownload /> 打包下载
                                        </>
                                      )}
                                    </button>
                                    <button className={styles.toggleBtn} onClick={() => toggleSubmissionExpansion(submission.user_id)}>
                                      {expandedSubmissions.has(submission.user_id) ? (
                                        <>
                                          <FaChevronUp /> 收起
                                        </>
                                      ) : (
                                        <>
                                          <FaChevronDown /> 展开
                                        </>
                                      )}
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* 可折叠的多文件列表 */}
                            {submission.list && submission.list.length > 1 && expandedSubmissions.has(submission.user_id) && (
                              <div className={styles.filesList}>
                                <div className={styles.filesListHeader}>
                                  <span>文件列表 ({submission.list?.length || 0})</span>
                                </div>
                                {submission.list.map((file) => (
                                  <div key={file.id} className={styles.fileItem}>
                                    <div className={styles.fileInfo}>
                                      <div className={styles.fileDetails}>
                                        <div className={styles.fileTypeIcon}>
                                          <FaFileAlt />
                                        </div>
                                        <div>
                                          <p className={styles.fileName}>{file.file_name}</p>
                                          <p className={styles.fileSize}>{formatFileSize(file.file_size)}</p>
                                        </div>
                                      </div>
                                      <button
                                        className={`${styles.downloadBtn} ${downloadingFiles.has(file.id) ? styles.downloading : ""}`}
                                        onClick={() => handleDownload(file)}
                                        disabled={downloadingFiles.has(file.id)}
                                      >
                                        {downloadingFiles.has(file.id) ? <FaDownload className={styles.spinning} /> : <FaDownload />}
                                      </button>
                                    </div>

                                    {/* 单个文件的反馈 */}
                                    {file.feedback && (
                                      <div className={styles.feedback}>
                                        <h5 className={styles.feedbackTitle}>文件评语</h5>
                                        <p className={styles.feedbackContent}>{file.feedback}</p>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )}

                        {/* 整体反馈 */}
                        {submission.list && submission.list.length === 1 && submission.list[0].feedback && (
                          <div className={styles.feedback}>
                            <h5 className={styles.feedbackTitle}>教师评语</h5>
                            <p className={styles.feedbackContent}>{submission.list[0]!.feedback}</p>
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
      <Footer startYear={2025} />
    </div>
  );
};

export default AssignmentSubmissions;
