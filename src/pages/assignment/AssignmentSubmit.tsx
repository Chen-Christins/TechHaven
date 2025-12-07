import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
    FaLock,
    FaSignInAlt
} from 'react-icons/fa';
import Navbar from '../../components/navbar/Navbar';
import Footer from '../../components/footer/Footer';
import message from '../../components/message/Message';
import { useAuth } from '../../contexts/AuthContext';
import styles from './AssignmentSubmit.module.css';

// 模拟作业数据类型
interface Assignment {
    id: string;
    title: string;
    description: string;
    courseName: string;
    deadline: string;
    status: 'pending' | 'submitted' | 'late';
    maxFileSize: number; // MB
    allowedTypes: string[];
}

// 模拟作业数据列表
const MOCK_ASSIGNMENTS: Assignment[] = [
    {
        id: '1',
        title: 'Web前端开发期末大作业',
        description: '请设计并实现一个响应式的个人博客系统。要求包含首页、文章列表、文章详情、个人中心等页面。技术栈要求使用 React + TypeScript。请提交源代码压缩包以及项目说明文档。',
        courseName: 'Web前端开发技术',
        deadline: '2025-12-31 23:59:59',
        status: 'pending',
        maxFileSize: 50,
        allowedTypes: ['.zip', '.rar', '.7z', '.pdf', '.doc', '.docx']
    },
    {
        id: '2',
        title: '计算机网络实验报告',
        description: '完成Wireshark抓包实验，分析TCP三次握手过程，并撰写实验报告。',
        courseName: '计算机网络',
        deadline: '2025-11-15 12:00:00',
        status: 'submitted',
        maxFileSize: 20,
        allowedTypes: ['.pdf', '.doc', '.docx']
    },
    {
        id: '3',
        title: '数据库课程设计',
        description: '设计一个图书管理系统的数据库模型，包括E-R图、关系模式设计以及SQL建表语句。',
        courseName: '数据库系统原理',
        deadline: '2025-10-01 00:00:00',
        status: 'late',
        maxFileSize: 30,
        allowedTypes: ['.zip', '.pdf']
    },
    {
        id: '4',
        title: '算法分析与设计作业',
        description: '实现快速排序算法，并分析其时间复杂度和空间复杂度。',
        courseName: '算法分析与设计',
        deadline: '2026-01-10 23:59:59',
        status: 'pending',
        maxFileSize: 10,
        allowedTypes: ['.cpp', '.java', '.py', '.txt']
    }
];

const AssignmentSubmit: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated, loading: authLoading } = useAuth();
    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [files, setFiles] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // 模拟获取作业详情
        const foundAssignment = MOCK_ASSIGNMENTS.find(a => a.id === id);
        if (foundAssignment) {
            setTimeout(() => {
                setAssignment(foundAssignment);
            }, 500);
        } else {
            message.error('未找到该作业');
            navigate('/assignments');
        }
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
        
        newFiles.forEach(file => {
            if (file.size > assignment.maxFileSize * 1024 * 1024) {
                message.error(`文件 ${file.name} 超过大小限制 (${assignment.maxFileSize}MB)`);
                return;
            }
            validFiles.push(file);
        });

        setFiles(prev => [...prev, ...validFiles]);
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (files.length === 0) {
            message.warn('请至少上传一个文件');
            return;
        }

        setSubmitting(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            message.success('作业提交成功！');
            navigate('/assignments');
        } catch (error) {
            console.error('提交失败:', error);
            message.error('提交失败，请重试');
        } finally {
            setSubmitting(false);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'submitted':
                return <span className={`${styles.statusBadge} ${styles.statusSubmitted}`}><FaCheckCircle /> 已提交</span>;
            case 'late':
                return <span className={`${styles.statusBadge} ${styles.statusLate}`}><FaExclamationCircle /> 已逾期</span>;
            default:
                return <span className={`${styles.statusBadge} ${styles.statusPending}`}><FaClock /> 进行中</span>;
        }
    };

    if (!authLoading && !isAuthenticated) {
        return (
            <div className={styles.container}>
                <Navbar />
                <div className={styles.mainContent}>
                    <div className={styles.emptyState} style={{ marginTop: '4rem', padding: '6rem 2rem' }}>
                        <div style={{ 
                            fontSize: '4rem', 
                            color: 'var(--text-tertiary)', 
                            marginBottom: '1.5rem',
                            background: 'var(--bg-secondary)',
                            width: '100px',
                            height: '100px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem'
                        }}>
                            <FaLock />
                        </div>
                        <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                            请先登录
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '400px', margin: '0 auto 2rem' }}>
                            您需要登录后才能查看作业详情和提交作业。
                        </p>
                        <button 
                            onClick={() => navigate('/auth')}
                            className={styles.loginBtn}
                        >
                            <FaSignInAlt /> 立即登录
                        </button>
                    </div>
                </div>
                <Footer companyName="TechBlog" startYear={2025} />
            </div>
        );
    }

    if (!assignment) {
        return (
            <div className={styles.container}>
                <Navbar />
                <div className={styles.mainContent} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                    加载中...
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <Navbar />
            
            <div className={styles.mainContent}>
                <div className={styles.card}>
                    <div style={{ marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid var(--border-secondary)' }}>
                        <button className={styles.backButton} onClick={() => navigate(-1)}>
                            <FaArrowLeft /> 返回上一页
                        </button>
                        <div className={styles.headerContent}>
                            <div className={styles.titleGroup}>
                                <h1 className={styles.pageTitle}>{assignment.title}</h1>
                                <div className={styles.courseName}>
                                    <FaBookOpen /> {assignment.courseName}
                                </div>
                            </div>
                            {getStatusBadge(assignment.status)}
                        </div>
                    </div>

                    <div style={{ marginBottom: '3rem' }}>
                        <div className={styles.sectionHeader}>
                            <div className={styles.sectionIcon}>
                                <FaInfoCircle />
                            </div>
                            <h2 className={styles.sectionTitle}>作业详情</h2>
                        </div>
                        
                        <div className={styles.infoGrid}>
                            <div className={styles.infoCard}>
                                <span className={styles.infoLabel}>截止时间</span>
                                <span className={`${styles.infoValue} ${styles.deadlineValue}`}>
                                    {assignment.deadline}
                                </span>
                            </div>
                            <div className={styles.infoCard}>
                                <span className={styles.infoLabel}>文件大小限制</span>
                                <span className={styles.infoValue}>{assignment.maxFileSize} MB</span>
                            </div>
                            <div className={styles.infoCard}>
                                <span className={styles.infoLabel}>允许文件格式</span>
                                <span className={styles.infoValue}>{assignment.allowedTypes.join(', ')}</span>
                            </div>
                        </div>

                        <div className={styles.description}>
                            {assignment.description}
                        </div>
                    </div>

                    <div>
                        <div className={styles.sectionHeader}>
                            <div className={styles.sectionIcon}>
                                <FaCloudUploadAlt />
                            </div>
                            <h2 className={styles.sectionTitle}>作业提交</h2>
                        </div>

                        <div className={styles.uploadContainer}>
                            <div 
                                className={`${styles.uploadArea} ${isDragging ? styles.active : ''}`}
                                onDragEnter={handleDragEnter}
                                onDragLeave={handleDragLeave}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input 
                                    type="file" 
                                    ref={fileInputRef}
                                    style={{ display: 'none' }} 
                                    multiple 
                                    onChange={handleFileSelect}
                                />
                                <div className={styles.uploadContent}>
                                    <div className={styles.uploadIconWrapper}>
                                        <FaCloudUploadAlt />
                                    </div>
                                    <div className={styles.uploadTitle}>
                                        点击或拖拽文件到此处上传
                                    </div>
                                    <div className={styles.uploadDesc}>
                                        支持 {assignment.allowedTypes.join(', ')} 格式文件
                                    </div>
                                    <div className={styles.uploadLimit}>
                                        单个文件不超过 {assignment.maxFileSize}MB
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
                                                    <div className={styles.fileSize}>{formatFileSize(file.size)}</div>
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
                                disabled={submitting || files.length === 0}
                            >
                                {submitting ? '提交中...' : '确认提交'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <Footer companyName="TechBlog" startYear={2025} />
        </div>
    );
};

export default AssignmentSubmit;
