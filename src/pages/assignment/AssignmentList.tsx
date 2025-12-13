import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaCheckCircle,
    FaExclamationCircle,
    FaArrowRight,
    FaCalendarAlt,
    FaClipboardList,
    FaTasks,
} from "react-icons/fa";
import Navbar from "../../components/navbar/Navbar";
import Footer from "../../components/footer/Footer";
import Skeleton from "../../components/skeleton/Skeleton";
import AuthRequired from "../../components/auth/AuthRequired";
import AssignmentService from "../../services/assignmentService";
import styles from "./AssignmentList.module.css";

interface Assignment {
    id: string | number;
    name: string;
    description: string;
    subject_name: string;
    end_time: number;
    status: number;
    priority: number;
    create_time: number;
    file_size: number;
    file_type: string;
}

const STATUS_MAP: { [key: number]: string } = {
    1: "open",      // 开启中
    2: "closed",    // 已关闭
};

const AssignmentList: React.FC = () => {
    const navigate = useNavigate();
    const [filter, setFilter] = useState<"all" | "open" | "closed">("all");
    const [dataLoading, setDataLoading] = useState(true);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAssignments = async () => {
            try {
                setDataLoading(true);
                setError(null);
                const response = await AssignmentService.getUserAssignments();
                setAssignments(response.list);
            } catch (err: any) {
                setError(err.message || "获取作业列表失败");
            } finally {
                setDataLoading(false);
            }
        };

        fetchAssignments();
    }, []);

    const filteredAssignments = assignments.filter((item) => {
        if (filter === "all") return true;
        const statusString = STATUS_MAP[item.status] || "pending";
        return statusString === filter;
    });

    const getStatusBadge = (status: number) => {
        const statusString = STATUS_MAP[status] || "open";
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
                    <span className={`${styles.statusBadge} ${styles.statusSubmitted}`}>
                        <FaCheckCircle /> 开启中
                    </span>
                );
        }
    };

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp * 1000);
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    return (
        <div className={styles.container}>
            <Navbar />
            <div className={styles.mainContent}>
                <AuthRequired message="您需要登录后才能查看和管理您的作业列表。">
                    <>
                        <div className={styles.pageHeader}>
                            <h1 className={styles.pageTitle}>
                                <FaTasks /> 我的任务
                            </h1>
                            <div className={styles.filterBar}>
                                <button
                                    className={`${styles.filterBtn} ${filter === "all" ? styles.active : ""}`}
                                    onClick={() => setFilter("all")}
                                >
                                    全部
                                </button>
                                                                <button
                                    className={`${styles.filterBtn} ${filter === "open" ? styles.active : ""}`}
                                    onClick={() => setFilter("open")}
                                >
                                    开启中
                                </button>
                                <button
                                    className={`${styles.filterBtn} ${filter === "closed" ? styles.active : ""}`}
                                    onClick={() => setFilter("closed")}
                                >
                                    已关闭
                                </button>
                            </div>
                        </div>

                        {error ? (
                            <div className={styles.errorState}>
                                <FaExclamationCircle className={styles.errorIcon} />
                                <h3 className={styles.errorText}>加载失败</h3>
                                <p className={styles.errorSubtext}>{error}</p>
                            </div>
                        ) : dataLoading ? (
                            <div className={styles.grid}>
                                {/* 骨架屏加载状态 */}
                                {Array.from({ length: 6 }).map((_, index) => (
                                    <div key={index} className={styles.card}>
                                        <div className={styles.cardHeader}>
                                            <Skeleton
                                                variant="rectangular"
                                                width={100}
                                                height={24}
                                                style={{ borderRadius: "6px" }}
                                            />
                                            <Skeleton
                                                variant="rounded"
                                                width={80}
                                                height={24}
                                                style={{ borderRadius: "30px" }}
                                            />
                                        </div>

                                        <div style={{ margin: "1rem 0" }}>
                                            <Skeleton
                                                variant="text"
                                                width="80%"
                                                height={28}
                                                style={{ marginBottom: "0.5rem" }}
                                            />
                                            <Skeleton variant="text" lines={2} />
                                        </div>

                                        <div className={styles.cardFooter}>
                                            <div className={styles.deadline} style={{ width: "120px" }}>
                                                <Skeleton variant="text" width="100%" />
                                            </div>
                                            <Skeleton
                                                variant="rectangular"
                                                width={100}
                                                height={36}
                                                style={{ borderRadius: "8px" }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredAssignments.length > 0 ? (
                            <div className={styles.grid}>
                                {filteredAssignments.map((item) => (
                                    <div key={item.id} className={styles.card}>
                                        <div className={styles.cardHeader}>
                                            <span className={styles.courseBadge}>{item.subject_name}</span>
                                            {getStatusBadge(item.status)}
                                        </div>

                                        <h3 className={styles.cardTitle}>{item.name}</h3>
                                        <p className={styles.cardDesc}>{item.description}</p>

                                        <div className={styles.cardFooter}>
                                            <div className={styles.deadline}>
                                                <FaCalendarAlt />
                                                {formatDate(item.end_time)} 截止
                                            </div>
                                            <button
                                                className={`${styles.actionBtn} ${STATUS_MAP[item.status] === "closed" ? styles.btnSecondary : styles.btnPrimary}`}
                                                onClick={() => navigate(`/assignment/submit/${item.id}`)}
                                            >
                                                {STATUS_MAP[item.status] === "closed" ? "查看详情" : "去提交"} <FaArrowRight />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <FaClipboardList className={styles.emptyIcon} />
                                <h3 className={styles.emptyText}>暂无作业</h3>
                                <p className={styles.emptySubtext}>当前筛选条件下没有找到相关作业</p>
                            </div>
                        )}
                    </>
                </AuthRequired>
            </div>

            <Footer companyName="TechBlog" startYear={2025} />
        </div>
    );
};

export default AssignmentList;