import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaClock,
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
import styles from "./AssignmentList.module.css";

interface Assignment {
    id: string;
    title: string;
    description: string;
    courseName: string;
    deadline: string;
    status: "pending" | "submitted" | "late";
}

const MOCK_ASSIGNMENTS: Assignment[] = [
    {
        id: "1",
        title: "Web前端开发期末大作业",
        description:
            "请设计并实现一个响应式的个人博客系统。要求包含首页、文章列表、文章详情、个人中心等页面。技术栈要求使用 React + TypeScript。",
        courseName: "Web前端开发技术",
        deadline: "2025-12-31 23:59:59",
        status: "pending",
    },
    {
        id: "2",
        title: "计算机网络实验报告",
        description: "完成Wireshark抓包实验，分析TCP三次握手过程，并撰写实验报告。",
        courseName: "计算机网络",
        deadline: "2025-11-15 12:00:00",
        status: "submitted",
    },
    {
        id: "3",
        title: "数据库课程设计",
        description: "设计一个图书管理系统的数据库模型，包括E-R图、关系模式设计以及SQL建表语句。",
        courseName: "数据库系统原理",
        deadline: "2025-10-01 00:00:00",
        status: "late",
    },
    {
        id: "4",
        title: "算法分析与设计作业",
        description: "实现快速排序算法，并分析其时间复杂度和空间复杂度。",
        courseName: "算法分析与设计",
        deadline: "2026-01-10 23:59:59",
        status: "pending",
    },
];

const AssignmentList: React.FC = () => {
    const navigate = useNavigate();
    const [filter, setFilter] = useState<"all" | "pending" | "submitted" | "late">("all");
    const [dataLoading, setDataLoading] = useState(true);

    useEffect(() => {
        // 模拟数据加载延迟
        const timer = setTimeout(() => {
            setDataLoading(false);
        }, 800);
        return () => clearTimeout(timer);
    }, []);

    const filteredAssignments = MOCK_ASSIGNMENTS.filter((item) => {
        if (filter === "all") return true;
        return item.status === filter;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "submitted":
                return (
                    <span className={`${styles.statusBadge} ${styles.statusSubmitted}`}>
                        <FaCheckCircle /> 已提交
                    </span>
                );
            case "late":
                return (
                    <span className={`${styles.statusBadge} ${styles.statusLate}`}>
                        <FaExclamationCircle /> 已逾期
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
                                    className={`${styles.filterBtn} ${filter === "pending" ? styles.active : ""}`}
                                    onClick={() => setFilter("pending")}
                                >
                                    进行中
                                </button>
                                <button
                                    className={`${styles.filterBtn} ${filter === "submitted" ? styles.active : ""}`}
                                    onClick={() => setFilter("submitted")}
                                >
                                    已提交
                                </button>
                                <button
                                    className={`${styles.filterBtn} ${filter === "late" ? styles.active : ""}`}
                                    onClick={() => setFilter("late")}
                                >
                                    已逾期
                                </button>
                            </div>
                        </div>

                        {dataLoading ? (
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
                                            <span className={styles.courseBadge}>{item.courseName}</span>
                                            {getStatusBadge(item.status)}
                                        </div>

                                        <h3 className={styles.cardTitle}>{item.title}</h3>
                                        <p className={styles.cardDesc}>{item.description}</p>

                                        <div className={styles.cardFooter}>
                                            <div className={styles.deadline}>
                                                <FaCalendarAlt />
                                                {item.deadline.split(" ")[0]} 截止
                                            </div>
                                            <button
                                                className={`${styles.actionBtn} ${item.status === "submitted" ? styles.btnSecondary : styles.btnPrimary}`}
                                                onClick={() => navigate(`/assignment/submit/${item.id}`)}
                                            >
                                                {item.status === "submitted" ? "查看详情" : "去提交"} <FaArrowRight />
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
