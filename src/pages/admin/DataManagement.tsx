import React, { useState, useEffect, useMemo } from 'react';
import {
    FaDatabase,
    FaDownload,
    FaTrash,
    FaFilter,
    FaPlus,
    FaChevronLeft,
    FaChevronRight,
    FaAngleDoubleLeft,
    FaAngleDoubleRight,
    FaFileExport,
    FaFileImport,
    FaHdd,
    FaCloudUploadAlt,
    FaChartLine,
    FaCalendar,
    FaUser,
    FaFileAlt,
    FaComment,
    FaTags,
    FaArchive,
    FaBroom,
    FaCheckCircle,
    FaSync,
    FaSave,
    FaServer
} from 'react-icons/fa';
import CustomSelect from '../../components/customSelect/CustomSelect';
import Input from '../../components/input/Input';
import Loading from '../../components/loading/Loading';
import { confirm } from '../../components/confirm/Confirm';
import type { SelectOption } from '../../types/index';
import styles from './DataManagement.module.css';

// 备份记录接口
interface BackupRecord {
    id: string;
    name: string;
    type: 'full' | 'incremental' | 'manual';
    size: number;
    fileCount: number;
    status: 'completed' | 'processing' | 'failed';
    createdAt: string;
    completedAt?: string;
    createdBy: string;
    description: string;
    downloadUrl?: string;
}

// 数据统计接口
interface DataStats {
    totalSize: number;
    usedSize: number;
    availableSize: number;
    totalRecords: number;
    articles: number;
    users: number;
    comments: number;
    categories: number;
    tags: number;
    backups: number;
}

// 导出记录接口
interface ExportRecord {
    id: string;
    name: string;
    type: 'articles' | 'users' | 'comments' | 'full';
    format: 'json' | 'csv' | 'xlsx';
    size: number;
    recordCount: number;
    status: 'completed' | 'processing' | 'failed';
    createdAt: string;
    createdBy: string;
    downloadUrl?: string;
}

// 筛选条件接口
interface FilterOptions {
    search: string;
    type: string;
    status: string;
    dateRange: string;
}

const DataManagement: React.FC = () => {
    // 状态管理
    const [activeTab, setActiveTab] = useState<'overview' | 'backups' | 'exports'>('overview');
    const [backups, setBackups] = useState<BackupRecord[]>([]);
    const [exports, setExports] = useState<ExportRecord[]>([]);
    const [stats, setStats] = useState<DataStats>({
        totalSize: 0,
        usedSize: 0,
        availableSize: 0,
        totalRecords: 0,
        articles: 0,
        users: 0,
        comments: 0,
        categories: 0,
        tags: 0,
        backups: 0
    });
    const [filters, setFilters] = useState<FilterOptions>({
        search: '',
        type: '',
        status: '',
        dateRange: ''
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);

    const itemsPerPage = 15; // 每页显示15条数据

    // 模拟备份记录数据
    const mockBackups: BackupRecord[] = [
        {
            id: 'backup_1',
            name: '系统完整备份',
            type: 'full',
            size: 2048576, // 2MB
            fileCount: 1250,
            status: 'completed',
            createdAt: '2024-11-20 02:00:00',
            completedAt: '2024-11-20 02:15:00',
            createdBy: '系统自动',
            description: '包含所有系统数据的完整备份',
            downloadUrl: '/api/backups/download/backup_1'
        },
        {
            id: 'backup_2',
            name: '每日增量备份',
            type: 'incremental',
            size: 512000, // 512KB
            fileCount: 45,
            status: 'completed',
            createdAt: '2024-11-21 02:00:00',
            completedAt: '2024-11-21 02:03:00',
            createdBy: '系统自动',
            description: '昨日变更数据的增量备份',
            downloadUrl: '/api/backups/download/backup_2'
        },
        {
            id: 'backup_3',
            name: '手动备份',
            type: 'manual',
            size: 1024000, // 1MB
            fileCount: 320,
            status: 'processing',
            createdAt: '2024-11-22 10:30:00',
            createdBy: '管理员A',
            description: '管理员手动触发的备份任务'
        },
        {
            id: 'backup_4',
            name: '系统完整备份',
            type: 'full',
            size: 2457600, // 2.4MB
            fileCount: 1350,
            status: 'completed',
            createdAt: '2024-11-19 02:00:00',
            completedAt: '2024-11-19 02:18:00',
            createdBy: '系统自动',
            description: '包含所有系统数据的完整备份',
            downloadUrl: '/api/backups/download/backup_4'
        },
        {
            id: 'backup_5',
            name: '数据迁移备份',
            type: 'manual',
            size: 0,
            fileCount: 0,
            status: 'failed',
            createdAt: '2024-11-18 15:45:00',
            createdBy: '管理员B',
            description: '数据迁移前的备份，执行失败'
        }
    ];

    // 模拟导出记录数据
    const mockExports: ExportRecord[] = [
        {
            id: 'export_1',
            name: '文章数据导出',
            type: 'articles',
            format: 'xlsx',
            size: 256000, // 256KB
            recordCount: 1250,
            status: 'completed',
            createdAt: '2024-11-21 14:30:00',
            createdBy: '管理员A',
            downloadUrl: '/api/exports/download/export_1'
        },
        {
            id: 'export_2',
            name: '用户数据导出',
            type: 'users',
            format: 'csv',
            size: 128000, // 128KB
            recordCount: 500,
            status: 'completed',
            createdAt: '2024-11-20 10:15:00',
            createdBy: '管理员B',
            downloadUrl: '/api/exports/download/export_2'
        },
        {
            id: 'export_3',
            name: '完整数据导出',
            type: 'full',
            format: 'json',
            size: 1048576, // 1MB
            recordCount: 2500,
            status: 'processing',
            createdAt: '2024-11-22 09:00:00',
            createdBy: '管理员A'
        },
        {
            id: 'export_4',
            name: '评论数据导出',
            type: 'comments',
            format: 'xlsx',
            size: 64000, // 64KB
            recordCount: 890,
            status: 'completed',
            createdAt: '2024-11-19 16:45:00',
            createdBy: '管理员C',
            downloadUrl: '/api/exports/download/export_4'
        },
        {
            id: 'export_5',
            name: '分类数据导出',
            type: 'articles',
            format: 'csv',
            size: 32000, // 32KB
            recordCount: 45,
            status: 'completed',
            createdAt: '2024-11-18 11:20:00',
            createdBy: '管理员A',
            downloadUrl: '/api/exports/download/export_5'
        }
    ];

    // 加载数据
    useEffect(() => {
        setLoading(true);
        // 模拟API调用
        setTimeout(() => {
            setBackups(mockBackups);
            setExports(mockExports);

            // 计算统计数据
            const totalSize = 50 * 1024 * 1024 * 1024; // 50GB
            const usedSize = 15.5 * 1024 * 1024 * 1024; // 15.5GB
            const availableSize = totalSize - usedSize;

            setStats({
                totalSize,
                usedSize,
                availableSize,
                totalRecords: 5000,
                articles: 1250,
                users: 500,
                comments: 890,
                categories: 15,
                tags: 45,
                backups: mockBackups.length
            });

            setLoading(false);
        }, 1000);
    }, []);

    // 筛选数据
    const filteredBackups = useMemo(() => {
        return backups.filter(backup => {
            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                if (!backup.name.toLowerCase().includes(searchTerm) &&
                    !backup.description.toLowerCase().includes(searchTerm)) {
                    return false;
                }
            }
            if (filters.type && backup.type !== filters.type) {
                return false;
            }
            if (filters.status && backup.status !== filters.status) {
                return false;
            }
            return true;
        });
    }, [backups, filters]);

    const filteredExports = useMemo(() => {
        return exports.filter(exportItem => {
            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                if (!exportItem.name.toLowerCase().includes(searchTerm)) {
                    return false;
                }
            }
            if (filters.type && exportItem.type !== filters.type) {
                return false;
            }
            if (filters.status && exportItem.status !== filters.status) {
                return false;
            }
            return true;
        });
    }, [exports, filters]);

    // 分页计算
    const currentData = activeTab === 'backups' ? filteredBackups : filteredExports;
    const totalPages = Math.ceil(currentData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = currentData.slice(startIndex, endIndex);

    // 重置页码
    useEffect(() => {
        setCurrentPage(1);
    }, [filters, activeTab]);

    // 筛选选项数据
    const backupTypeOptions: SelectOption[] = [
        { id: '', name: '全部类型', color: '#6c757d' },
        { id: 'full', name: '完整备份', color: '#007bff' },
        { id: 'incremental', name: '增量备份', color: '#17a2b8' },
        { id: 'manual', name: '手动备份', color: '#6c757d' }
    ];

    const exportTypeOptions: SelectOption[] = [
        { id: '', name: '全部类型', color: '#6c757d' },
        { id: 'articles', name: '文章数据', color: '#007bff' },
        { id: 'users', name: '用户数据', color: '#17a2b8' },
        { id: 'comments', name: '评论数据', color: '#28a745' },
        { id: 'full', name: '完整数据', color: '#007bff' }
    ];

    const statusOptions: SelectOption[] = [
        { id: '', name: '全部状态', color: '#6c757d' },
        { id: 'completed', name: '已完成', color: '#28a745' },
        { id: 'processing', name: '处理中', color: '#ffc107' },
        { id: 'failed', name: '失败', color: '#dc3545' }
    ];

    // 处理选择变化
    const handleSelectChange = (field: keyof FilterOptions) => {
        return (selectedOption: SelectOption | null) => {
            setFilters(prev => ({
                ...prev,
                [field]: selectedOption?.id || ''
            }));
        };
    };

    // 处理搜索变化
    const handleFilterChange = (field: keyof FilterOptions, value: string) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // 清除筛选
    const clearFilters = () => {
        setFilters({
            search: '',
            type: '',
            status: '',
            dateRange: ''
        });
    };

    // 创建备份
    const createBackup = async (type: 'full' | 'incremental') => {
        await confirm({
            title: '创建备份',
            content: (
                <div>
                    <p>确定要创建{type === 'full' ? '完整' : '增量'}备份吗？</p>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        {type === 'full' ? '完整备份包含所有系统数据，耗时较长' : '增量备份只包含变更数据，速度较快'}
                    </p>
                </div>
            ),
            confirmText: '确认备份',
            cancelText: '取消',
            onConfirm: async () => {
                const newBackup: BackupRecord = {
                    id: `backup_${Date.now()}`,
                    name: `${type === 'full' ? '系统完整' : '增量'}备份`,
                    type,
                    size: 0,
                    fileCount: 0,
                    status: 'processing',
                    createdAt: new Date().toLocaleString('zh-CN'),
                    createdBy: '当前管理员',
                    description: type === 'full' ? '手动触发的完整备份' : '手动触发的增量备份'
                };

                setBackups(prev => [newBackup, ...prev]);

                // 模拟备份完成
                setTimeout(() => {
                    setBackups(prev => prev.map(backup =>
                        backup.id === newBackup.id
                            ? {
                                ...backup,
                                status: 'completed',
                                size: type === 'full' ? 2048576 : 512000,
                                fileCount: type === 'full' ? 1250 : 45,
                                completedAt: new Date().toLocaleString('zh-CN'),
                                downloadUrl: `/api/backups/download/${newBackup.id}`
                            }
                            : backup
                    ));
                }, 3000);
            }
        });
    };

    // 导出数据
    const exportData = async (type: 'articles' | 'users' | 'comments' | 'full') => {
        await confirm({
            title: '导出数据',
            content: (
                <div>
                    <p>确定要导出{type === 'articles' ? '文章' : type === 'users' ? '用户' : type === 'comments' ? '评论' : '完整'}数据吗？</p>
                </div>
            ),
            confirmText: '确认导出',
            cancelText: '取消',
            onConfirm: async () => {
                const newExport: ExportRecord = {
                    id: `export_${Date.now()}`,
                    name: `${type === 'articles' ? '文章' : type === 'users' ? '用户' : type === 'comments' ? '评论' : '完整'}数据导出`,
                    type,
                    format: 'xlsx',
                    size: 0,
                    recordCount: 0,
                    status: 'processing',
                    createdAt: new Date().toLocaleString('zh-CN'),
                    createdBy: '当前管理员'
                };

                setExports(prev => [newExport, ...prev]);

                // 模拟导出完成
                setTimeout(() => {
                    const mockSize = type === 'full' ? 1048576 : type === 'articles' ? 256000 : type === 'users' ? 128000 : 64000;
                    const mockCount = type === 'full' ? 2500 : type === 'articles' ? 1250 : type === 'users' ? 500 : 890;

                    setExports(prev => prev.map(exportItem =>
                        exportItem.id === newExport.id
                            ? {
                                ...exportItem,
                                status: 'completed',
                                size: mockSize,
                                recordCount: mockCount,
                                downloadUrl: `/api/exports/download/${newExport.id}`
                            }
                            : exportItem
                    ));
                }, 2000);
            }
        });
    };

    // 下载文件
    const downloadFile = (item: BackupRecord | ExportRecord) => {
        const url = (item as BackupRecord).downloadUrl || (item as ExportRecord).downloadUrl;
        if (url) {
            window.open(url, '_blank');
        }
    };

    // 删除记录
    const deleteRecord = async (item: BackupRecord | ExportRecord) => {
        await confirm({
            title: '删除记录',
            content: (
                <div>
                    <p>确定要删除"{(item as BackupRecord).name || (item as ExportRecord).name}"记录吗？</p>
                    <p style={{ color: 'var(--error-color)' }}>
                        删除后无法恢复，相关文件也会被删除。
                    </p>
                </div>
            ),
            confirmText: '确认删除',
            cancelText: '取消',
            onConfirm: async () => {
                if ('fileCount' in item) {
                    setBackups(prev => prev.filter(backup => backup.id !== item.id));
                } else {
                    setExports(prev => prev.filter(exportItem => exportItem.id !== item.id));
                }
            }
        });
    };

    // 清理数据
    const cleanupData = async () => {
        await confirm({
            title: '清理数据',
            content: (
                <div>
                    <p>确定要清理过期数据吗？</p>
                    <p style={{ color: 'var(--warning-color)' }}>
                        这将删除30天前的临时文件和失效记录。
                    </p>
                </div>
            ),
            confirmText: '确认清理',
            cancelText: '取消',
            onConfirm: async () => {
                // 模拟清理过程
                alert('数据清理完成');
            }
        });
    };

    // 格式化文件大小
    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '-';
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    };

    // 格式化日期
    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // 生成页码数组
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            const start = Math.max(1, currentPage - 2);
            const end = Math.min(totalPages, start + maxVisiblePages - 1);

            if (start > 1) {
                pages.push(1);
                if (start > 2) pages.push('...');
            }

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (end < totalPages) {
                if (end < totalPages - 1) pages.push('...');
                pages.push(totalPages);
            }
        }

        return pages;
    };

    if (loading) {
        return (
            <div className={styles.dataManagement}>
                <Loading text="加载数据管理中..." size="large" />
            </div>
        );
    }

    return (
        <div className={styles.dataManagement}>
            {/* 页面头部 */}
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>数据管理</h1>
                    <p className={styles.pageDescription}>
                        管理系统数据备份、导出和存储空间
                    </p>
                </div>
                <div className={styles.headerActions}>
                    <button className={`${styles.btn} ${styles.btnPrimary}`}>
                        <FaPlus />
                        数据操作
                    </button>
                </div>
            </div>

            {/* 标签页切换 */}
            <div className={styles.tabContainer}>
                <button
                    className={`${styles.tabButton} ${activeTab === 'overview' ? styles.active : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    <FaChartLine />
                    数据概览
                </button>
                <button
                    className={`${styles.tabButton} ${activeTab === 'backups' ? styles.active : ''}`}
                    onClick={() => setActiveTab('backups')}
                >
                    <FaArchive />
                    备份管理
                </button>
                <button
                    className={`${styles.tabButton} ${activeTab === 'exports' ? styles.active : ''}`}
                    onClick={() => setActiveTab('exports')}
                >
                    <FaFileExport />
                    导出管理
                </button>
            </div>

            {activeTab === 'overview' && (
                <>
                    {/* 存储统计 */}
                    <div className={styles.storageSection}>
                        <div className={styles.storageHeader}>
                            <h3 className={styles.sectionTitle}>
                                <FaHdd />
                                存储概览
                            </h3>
                            <button
                                className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`}
                                onClick={cleanupData}
                            >
                                <FaBroom />
                                清理数据
                            </button>
                        </div>
                        <div className={styles.storageCards}>
                            <div className={styles.storageCard}>
                                <div className={styles.storageIcon}>
                                    <FaServer />
                                </div>
                                <div className={styles.storageInfo}>
                                    <div className={styles.storageLabel}>总容量</div>
                                    <div className={styles.storageValue}>{formatFileSize(stats.totalSize)}</div>
                                </div>
                            </div>
                            <div className={styles.storageCard}>
                                <div className={`${styles.storageIcon} ${styles.used}`}>
                                    <FaDatabase />
                                </div>
                                <div className={styles.storageInfo}>
                                    <div className={styles.storageLabel}>已使用</div>
                                    <div className={styles.storageValue}>{formatFileSize(stats.usedSize)}</div>
                                </div>
                            </div>
                            <div className={styles.storageCard}>
                                <div className={`${styles.storageIcon} ${styles.available}`}>
                                    <FaHdd />
                                </div>
                                <div className={styles.storageInfo}>
                                    <div className={styles.storageLabel}>可用空间</div>
                                    <div className={styles.storageValue}>{formatFileSize(stats.availableSize)}</div>
                                </div>
                            </div>
                        </div>
                        <div className={styles.storageBar}>
                            <div className={styles.storageProgress} style={{ width: `${(stats.usedSize / stats.totalSize) * 100}%` }}></div>
                        </div>
                    </div>

                    {/* 数据统计 */}
                    <div className={styles.statsSection}>
                        <h3 className={styles.sectionTitle}>
                            <FaChartLine />
                            数据统计
                        </h3>
                        <div className={styles.statsGrid}>
                            <div className={styles.statCard}>
                                <div className={`${styles.statIcon} ${styles.primary}`}>
                                    <FaFileAlt />
                                </div>
                                <div className={styles.statValue}>{stats.articles}</div>
                                <div className={styles.statLabel}>文章数量</div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={`${styles.statIcon} ${styles.success}`}>
                                    <FaUser />
                                </div>
                                <div className={styles.statValue}>{stats.users}</div>
                                <div className={styles.statLabel}>用户数量</div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={`${styles.statIcon} ${styles.info}`}>
                                    <FaComment />
                                </div>
                                <div className={styles.statValue}>{stats.comments}</div>
                                <div className={styles.statLabel}>评论数量</div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={`${styles.statIcon} ${styles.warning}`}>
                                    <FaTags />
                                </div>
                                <div className={styles.statValue}>{stats.tags}</div>
                                <div className={styles.statLabel}>标签数量</div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={`${styles.statIcon} ${styles.secondary}`}>
                                    <FaArchive />
                                </div>
                                <div className={styles.statValue}>{stats.backups}</div>
                                <div className={styles.statLabel}>备份记录</div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={`${styles.statIcon} ${styles.error}`}>
                                    <FaDatabase />
                                </div>
                                <div className={styles.statValue}>{stats.totalRecords}</div>
                                <div className={styles.statLabel}>总记录数</div>
                            </div>
                        </div>
                    </div>

                    {/* 快速操作 */}
                    <div className={styles.quickActions}>
                        <h3 className={styles.sectionTitle}>
                            <FaSync />
                            快速操作
                        </h3>
                        <div className={styles.actionCards}>
                            <button className={styles.actionCard} onClick={() => createBackup('full')}>
                                <div className={styles.actionIcon}>
                                    <FaCloudUploadAlt />
                                </div>
                                <div className={styles.actionContent}>
                                    <div className={styles.actionTitle}>完整备份</div>
                                    <div className={styles.actionDescription}>创建系统完整数据备份</div>
                                </div>
                            </button>
                            <button className={styles.actionCard} onClick={() => createBackup('incremental')}>
                                <div className={styles.actionIcon}>
                                    <FaSave />
                                </div>
                                <div className={styles.actionContent}>
                                    <div className={styles.actionTitle}>增量备份</div>
                                    <div className={styles.actionDescription}>备份变更数据</div>
                                </div>
                            </button>
                            <button className={styles.actionCard} onClick={() => exportData('full')}>
                                <div className={styles.actionIcon}>
                                    <FaFileExport />
                                </div>
                                <div className={styles.actionContent}>
                                    <div className={styles.actionTitle}>导出数据</div>
                                    <div className={styles.actionDescription}>导出系统数据</div>
                                </div>
                            </button>
                            <button className={styles.actionCard}>
                                <div className={styles.actionIcon}>
                                    <FaFileImport />
                                </div>
                                <div className={styles.actionContent}>
                                    <div className={styles.actionTitle}>导入数据</div>
                                    <div className={styles.actionDescription}>从文件导入数据</div>
                                </div>
                            </button>
                        </div>
                    </div>
                </>
            )}

            {(activeTab === 'backups' || activeTab === 'exports') && (
                <>
                    {/* 筛选区域 */}
                    <div className={styles.filterSection}>
                        <div className={styles.filterHeader}>
                            <h3 className={styles.filterTitle}>
                                <FaFilter />
                                筛选条件
                            </h3>
                            <div className={styles.filterActions}>
                                <button
                                    className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`}
                                    onClick={clearFilters}
                                >
                                    清除筛选
                                </button>
                            </div>
                        </div>
                        <div className={styles.filterForm}>
                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>
                                    {activeTab === 'backups' ? '搜索备份' : '搜索导出'}
                                </label>
                                <Input
                                    placeholder={activeTab === 'backups' ? '备份名称或描述' : '导出名称'}
                                    value={filters.search}
                                    onChange={(value) => handleFilterChange('search', value)}
                                    allowClear={true}
                                    size="large"
                                    style={{ minHeight: '46px', height: '50px' }}
                                />
                            </div>
                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>
                                    {activeTab === 'backups' ? '备份类型' : '导出类型'}
                                </label>
                                <CustomSelect
                                    name="类型"
                                    options={activeTab === 'backups' ? backupTypeOptions : exportTypeOptions}
                                    value={(activeTab === 'backups' ?
                                        backupTypeOptions.find(option => option.id === filters.type) :
                                        exportTypeOptions.find(option => option.id === filters.type)
                                    ) || null}
                                    onChange={handleSelectChange('type')}
                                    placeholder="选择类型..."
                                    className="adminCustomSelect"
                                    hideBadge={true}
                                />
                            </div>
                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>状态</label>
                                <CustomSelect
                                    name="状态"
                                    options={statusOptions}
                                    value={statusOptions.find(option => option.id === filters.status) || null}
                                    onChange={handleSelectChange('status')}
                                    placeholder="选择状态..."
                                    className="adminCustomSelect"
                                    hideBadge={true}
                                />
                            </div>
                        </div>
                    </div>

                    {/* 数据表格 */}
                    <div className={styles.tableContainer}>
                        <div className={styles.tableHeader}>
                            <h3 className={styles.tableTitle}>
                                {activeTab === 'backups' ? '备份记录' : '导出记录'}
                            </h3>
                            <div className={styles.tableActions}>
                                <button
                                    className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`}
                                    onClick={() => activeTab === 'backups' ? createBackup('full') : exportData('full')}
                                >
                                    <FaPlus />
                                    {activeTab === 'backups' ? '创建备份' : '导出数据'}
                                </button>
                                <span style={{ fontSize: '14px', color: 'var(--text-secondary)', marginLeft: '12px' }}>
                                    共 {currentData.length} 条记录
                                </span>
                            </div>
                        </div>

                        {activeTab === 'backups' ? (
                            <table className={styles.recordsTable}>
                                <thead>
                                    <tr>
                                        <th>备份信息</th>
                                        <th>类型</th>
                                        <th>大小</th>
                                        <th>文件数量</th>
                                        <th>状态</th>
                                        <th>创建时间</th>
                                        <th>操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentItems.length > 0 ? (
                                        currentItems.map((backup) => (
                                            <tr key={backup.id}>
                                                <td>
                                                    <div className={styles.recordInfo}>
                                                        <div className={styles.recordIcon}>
                                                            <FaArchive />
                                                        </div>
                                                        <div className={styles.recordDetails}>
                                                            <div className={styles.recordName}>{backup.name}</div>
                                                            <div className={styles.recordMeta}>
                                                                <span><FaUser /> {backup.createdBy}</span>
                                                            </div>
                                                            <div className={styles.recordDescription}>{(backup as BackupRecord).description}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`${styles.typeBadge} ${styles[backup.type]}`}>
                                                        {backup.type === 'full' && '完整'}
                                                        {backup.type === 'incremental' && '增量'}
                                                        {backup.type === 'manual' && '手动'}
                                                    </span>
                                                </td>
                                                <td>{formatFileSize(backup.size)}</td>
                                                <td>{(backup as BackupRecord).fileCount}</td>
                                                <td>
                                                    <span className={`${styles.statusBadge} ${styles[backup.status]}`}>
                                                        <span className={styles.statusIndicator}></span>
                                                        {backup.status === 'completed' && '已完成'}
                                                        {backup.status === 'processing' && '处理中'}
                                                        {backup.status === 'failed' && '失败'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className={styles.timeInfo}>
                                                        <div><FaCalendar /> {formatDate(backup.createdAt)}</div>
                                                        {(backup as BackupRecord).completedAt ? (
                                                            <div><FaCheckCircle /> {formatDate((backup as BackupRecord).completedAt)}</div>
                                                        ) : null}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className={styles.actionButtons}>
                                                        <button
                                                            className={`${styles.actionButton} ${styles.download}`}
                                                            title="下载备份"
                                                            onClick={() => downloadFile(backup)}
                                                            disabled={backup.status !== 'completed'}
                                                        >
                                                            <FaDownload />
                                                        </button>
                                                        <button
                                                            className={`${styles.actionButton} ${styles.delete}`}
                                                            title="删除记录"
                                                            onClick={() => deleteRecord(backup)}
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                                                暂无数据
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        ) : (
                            <table className={styles.recordsTable}>
                                <thead>
                                    <tr>
                                        <th>导出信息</th>
                                        <th>类型</th>
                                        <th>格式</th>
                                        <th>大小</th>
                                        <th>记录数量</th>
                                        <th>状态</th>
                                        <th>创建时间</th>
                                        <th>操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentItems.length > 0 ? (
                                        currentItems.map((exportItem) => (
                                            <tr key={exportItem.id}>
                                                <td>
                                                    <div className={styles.recordInfo}>
                                                        <div className={styles.recordIcon}>
                                                            <FaFileExport />
                                                        </div>
                                                        <div className={styles.recordDetails}>
                                                            <div className={styles.recordName}>{exportItem.name}</div>
                                                            <div className={styles.recordMeta}>
                                                                <span><FaUser /> {exportItem.createdBy}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`${styles.typeBadge} ${styles[exportItem.type]}`}>
                                                        {exportItem.type === 'articles' && '文章'}
                                                        {exportItem.type === 'users' && '用户'}
                                                        {exportItem.type === 'comments' && '评论'}
                                                        {exportItem.type === 'full' && '完整'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={styles.formatBadge}>
                                                        {(exportItem as ExportRecord).format.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td>{formatFileSize(exportItem.size)}</td>
                                                <td>{(exportItem as ExportRecord).recordCount}</td>
                                                <td>
                                                    <span className={`${styles.statusBadge} ${styles[exportItem.status]}`}>
                                                        <span className={styles.statusIndicator}></span>
                                                        {exportItem.status === 'completed' && '已完成'}
                                                        {exportItem.status === 'processing' && '处理中'}
                                                        {exportItem.status === 'failed' && '失败'}
                                                    </span>
                                                </td>
                                                <td>{formatDate(exportItem.createdAt)}</td>
                                                <td>
                                                    <div className={styles.actionButtons}>
                                                        <button
                                                            className={`${styles.actionButton} ${styles.download}`}
                                                            title="下载文件"
                                                            onClick={() => downloadFile(exportItem)}
                                                            disabled={exportItem.status !== 'completed'}
                                                        >
                                                            <FaDownload />
                                                        </button>
                                                        <button
                                                            className={`${styles.actionButton} ${styles.delete}`}
                                                            title="删除记录"
                                                            onClick={() => deleteRecord(exportItem)}
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                                                暂无数据
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}

                        {/* 分页 */}
                        {totalPages >= 1 && (
                            <div className={styles.paginationContainer}>
                                <div className={styles.paginationInfo}>
                                    显示 {startIndex + 1} - {Math.min(endIndex, currentData.length)} 条，
                                    共 {currentData.length} 条记录
                                </div>
                                <div className={styles.paginationControls}>
                                    <button
                                        className={styles.paginationButton}
                                        onClick={() => setCurrentPage(1)}
                                        disabled={currentPage === 1}
                                    >
                                        <FaAngleDoubleLeft />
                                    </button>
                                    <button
                                        className={styles.paginationButton}
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        <FaChevronLeft />
                                    </button>

                                    {getPageNumbers().map((page, index) => (
                                        <React.Fragment key={index}>
                                            {page === '...' ? (
                                                <span className={styles.paginationEllipsis}>...</span>
                                            ) : (
                                                <button
                                                    className={`${styles.paginationButton} ${currentPage === page ? styles.active : ''}`}
                                                    onClick={() => setCurrentPage(page as number)}
                                                >
                                                    {page}
                                                </button>
                                            )}
                                        </React.Fragment>
                                    ))}

                                    <button
                                        className={styles.paginationButton}
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                    >
                                        <FaChevronRight />
                                    </button>
                                    <button
                                        className={styles.paginationButton}
                                        onClick={() => setCurrentPage(totalPages)}
                                        disabled={currentPage === totalPages}
                                    >
                                        <FaAngleDoubleRight />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default DataManagement;