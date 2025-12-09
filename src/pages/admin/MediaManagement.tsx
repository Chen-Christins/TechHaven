import React, { useState, useEffect, useMemo } from 'react';
import {
    FaFilter,
        FaTrash,
    FaEdit,
    FaEye,
    FaDownload,
    FaUser,
    FaFile,
    FaFolder,
    FaCopy,
    FaCut,
    FaTimesCircle,
    FaChevronLeft,
    FaChevronRight,
    FaAngleDoubleLeft,
    FaAngleDoubleRight,
    FaTh,
    FaList,
    FaImage,
    FaVideo,
    FaFileAudio,
    FaFilePdf,
    FaFileArchive,
    FaFileWord,
    FaFileExcel,
    FaFilePowerpoint,
    FaFileCode,
    FaFileAlt,
    FaTag
} from 'react-icons/fa';
import CustomSelect from '../../components/customSelect/CustomSelect';
import Input from '../../components/input/Input';
import Loading from '../../components/loading/Loading';
import { confirm } from '../../components/confirm/Confirm';
import type { SelectOption } from '../../types/index';
import styles from './MediaManagement.module.css';

// 媒体文件接口
interface MediaFile {
    id: string;
    name: string;
    originalName: string;
    type: 'image' | 'video' | 'audio' | 'document' | 'archive' | 'other';
    mimeType: string;
    size: number;
    url: string;
    thumbnailUrl?: string;
    dimensions?: {
        width: number;
        height: number;
    };
    duration?: number; // 视频/音频时长（秒）
    author: {
        id: string;
        name: string;
    };
    folder: string;
    tags: string[];
    alt?: string;
    description?: string;
    createdAt: string;
    updatedAt?: string;
    downloads: number;
    isPublic: boolean;
}

// 文件夹接口
interface Folder {
    id: string;
    name: string;
    parentId?: string;
    path: string;
    fileCount: number;
    size: number;
    createdAt: string;
    updatedAt?: string;
}

// 筛选条件接口
interface FilterOptions {
    search: string;
    type: string;
    folder: string;
    dateRange: string;
    tags: string;
}

const MediaManagement: React.FC = () => {
    // 状态管理
    const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
        const [filters, setFilters] = useState<FilterOptions>({
        search: '',
        type: '',
        folder: '',
        dateRange: '',
        tags: ''
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
        const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [previewFile, setPreviewFile] = useState<MediaFile | null>(null);

    const itemsPerPage = 5;

    // 模拟文件夹数据
    const mockFolders: Folder[] = [
        {
            id: 'folder_1',
            name: '文章图片',
            path: '/articles/images',
            fileCount: 45,
            size: 15728640,
            createdAt: '2024-11-01 10:00:00'
        },
        {
            id: 'folder_2',
            name: '用户头像',
            path: '/users/avatars',
            fileCount: 120,
            size: 8388608,
            createdAt: '2024-11-01 10:00:00'
        },
        {
            id: 'folder_3',
            name: '视频素材',
            path: '/videos',
            fileCount: 15,
            size: 1073741824,
            createdAt: '2024-11-01 10:00:00'
        },
        {
            id: 'folder_4',
            name: '文档资料',
            path: '/documents',
            fileCount: 32,
            size: 52428800,
            createdAt: '2024-11-01 10:00:00'
        },
        {
            id: 'folder_5',
            name: '备份文件',
            path: '/backups',
            fileCount: 8,
            size: 2147483648,
            createdAt: '2024-11-01 10:00:00'
        }
    ];

    // 模拟媒体文件数据
    const mockMediaFiles: MediaFile[] = [
        {
            id: 'media_1',
            name: 'react-logo.png',
            originalName: 'react-logo-original.png',
            type: 'image',
            mimeType: 'image/png',
            size: 25600,
            url: '/media/react-logo.png',
            thumbnailUrl: '/media/thumbnails/react-logo-thumb.png',
            dimensions: { width: 512, height: 512 },
            author: {
                id: 'user_1',
                name: '管理员'
            },
            folder: '/articles/images',
            tags: ['react', 'logo', 'frontend'],
            alt: 'React Logo',
            description: 'React官方标志图片',
            createdAt: '2024-11-20 10:30:00',
            downloads: 45,
            isPublic: true
        },
        {
            id: 'media_2',
            name: 'tutorial-video.mp4',
            originalName: 'react-tutorial-complete.mp4',
            type: 'video',
            mimeType: 'video/mp4',
            size: 52428800,
            url: '/media/tutorial-video.mp4',
            thumbnailUrl: '/media/thumbnails/tutorial-video-thumb.jpg',
            dimensions: { width: 1920, height: 1080 },
            duration: 1800, // 30分钟
            author: {
                id: 'user_2',
                name: '内容创作者'
            },
            folder: '/videos',
            tags: ['tutorial', 'react', 'video'],
            description: 'React完整教程视频',
            createdAt: '2024-11-20 09:15:00',
            downloads: 128,
            isPublic: true
        },
        {
            id: 'media_3',
            name: 'user-avatar-1.jpg',
            originalName: 'profile-pic.jpg',
            type: 'image',
            mimeType: 'image/jpeg',
            size: 15360,
            url: '/media/user-avatar-1.jpg',
            thumbnailUrl: '/media/thumbnails/user-avatar-1-thumb.jpg',
            dimensions: { width: 200, height: 200 },
            author: {
                id: 'user_3',
                name: '张三'
            },
            folder: '/users/avatars',
            tags: ['avatar', 'user'],
            alt: '用户头像',
            createdAt: '2024-11-19 14:20:00',
            downloads: 12,
            isPublic: false
        },
        {
            id: 'media_4',
            name: 'background-music.mp3',
            originalName: 'background-music-01.mp3',
            type: 'audio',
            mimeType: 'audio/mpeg',
            size: 3145728,
            url: '/media/background-music.mp3',
            duration: 240, // 4分钟
            author: {
                id: 'user_1',
                name: '管理员'
            },
            folder: '/audio',
            tags: ['music', 'background', 'audio'],
            description: '背景音乐文件',
            createdAt: '2024-11-19 11:45:00',
            downloads: 67,
            isPublic: true
        },
        {
            id: 'media_5',
            name: 'project-documentation.pdf',
            originalName: 'API_Documentation_v2.pdf',
            type: 'document',
            mimeType: 'application/pdf',
            size: 1048576,
            url: '/media/project-documentation.pdf',
            thumbnailUrl: '/media/thumbnails/project-documentation-thumb.jpg',
            author: {
                id: 'user_4',
                name: '技术文档编写者'
            },
            folder: '/documents',
            tags: ['documentation', 'pdf', 'api'],
            description: '项目API文档第二版',
            createdAt: '2024-11-18 16:30:00',
            downloads: 234,
            isPublic: true
        },
        {
            id: 'media_6',
            name: 'website-backup.zip',
            originalName: 'website-backup-2024-11-18.zip',
            type: 'archive',
            mimeType: 'application/zip',
            size: 536870912,
            url: '/media/website-backup.zip',
            author: {
                id: 'user_1',
                name: '管理员'
            },
            folder: '/backups',
            tags: ['backup', 'archive', 'zip'],
            description: '网站完整备份文件',
            createdAt: '2024-11-18 02:00:00',
            downloads: 8,
            isPublic: false
        },
        {
            id: 'media_7',
            name: 'chart-data.xlsx',
            originalName: 'monthly-report-2024-11.xlsx',
            type: 'document',
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            size: 524288,
            url: '/media/chart-data.xlsx',
            thumbnailUrl: '/media/thumbnails/chart-data-thumb.jpg',
            author: {
                id: 'user_5',
                name: '数据分析师'
            },
            folder: '/documents',
            tags: ['excel', 'data', 'chart'],
            description: '11月份数据报告表格',
            createdAt: '2024-11-17 15:20:00',
            downloads: 45,
            isPublic: true
        },
        {
            id: 'media_8',
            name: 'code-snippet.js',
            originalName: 'utility-functions.js',
            type: 'document',
            mimeType: 'application/javascript',
            size: 8192,
            url: '/media/code-snippet.js',
            thumbnailUrl: '/media/thumbnails/code-snippet-thumb.jpg',
            author: {
                id: 'user_6',
                name: '前端开发'
            },
            folder: '/code',
            tags: ['javascript', 'code', 'utility'],
            description: '常用工具函数代码片段',
            createdAt: '2024-11-17 10:15:00',
            downloads: 89,
            isPublic: true
        },
        {
            id: 'media_9',
            name: 'presentation.pptx',
            originalName: 'company-introduction-2024.pptx',
            type: 'document',
            mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            size: 2097152,
            url: '/media/presentation.pptx',
            thumbnailUrl: '/media/thumbnails/presentation-thumb.jpg',
            author: {
                id: 'user_7',
                name: '市场部'
            },
            folder: '/documents',
            tags: ['powerpoint', 'presentation', 'company'],
            description: '公司介绍演示文稿',
            createdAt: '2024-11-16 14:45:00',
            downloads: 156,
            isPublic: true
        },
        {
            id: 'media_10',
            name: 'product-image.jpg',
            originalName: 'product-hero-banner.jpg',
            type: 'image',
            mimeType: 'image/jpeg',
            size: 102400,
            url: '/media/product-image.jpg',
            thumbnailUrl: '/media/thumbnails/product-image-thumb.jpg',
            dimensions: { width: 1200, height: 600 },
            author: {
                id: 'user_8',
                name: '设计师'
            },
            folder: '/articles/images',
            tags: ['product', 'banner', 'marketing'],
            alt: '产品横幅图片',
            description: '产品展示横幅图片',
            createdAt: '2024-11-16 09:30:00',
            downloads: 234,
            isPublic: true
        },
        {
            id: 'media_11',
            name: 'intro-video.webm',
            originalName: 'website-intro-animation.webm',
            type: 'video',
            mimeType: 'video/webm',
            size: 8388608,
            url: '/media/intro-video.webm',
            thumbnailUrl: '/media/thumbnails/intro-video-thumb.jpg',
            dimensions: { width: 1280, height: 720 },
            duration: 45, // 45秒
            author: {
                id: 'user_9',
                name: '视频制作师'
            },
            folder: '/videos',
            tags: ['animation', 'intro', 'webm'],
            description: '网站开场动画视频',
            createdAt: '2024-11-15 13:20:00',
            downloads: 178,
            isPublic: true
        },
        {
            id: 'media_12',
            name: 'icon-set.svg',
            originalName: 'ui-icons-complete.svg',
            type: 'image',
            mimeType: 'image/svg+xml',
            size: 4096,
            url: '/media/icon-set.svg',
            thumbnailUrl: '/media/thumbnails/icon-set-thumb.jpg',
            author: {
                id: 'user_10',
                name: 'UI设计师'
            },
            folder: '/assets/icons',
            tags: ['icons', 'svg', 'ui'],
            alt: 'UI图标集合',
            description: '完整的UI图标集合SVG文件',
            createdAt: '2024-11-15 11:10:00',
            downloads: 267,
            isPublic: true
        },
        {
            id: 'media_13',
            name: 'podcast-episode.mp3',
            originalName: 'tech-talk-episode-42.mp3',
            type: 'audio',
            mimeType: 'audio/mpeg',
            size: 12582912,
            url: '/media/podcast-episode.mp3',
            duration: 1800, // 30分钟
            author: {
                id: 'user_11',
                name: '播客主播'
            },
            folder: '/podcasts',
            tags: ['podcast', 'tech', 'audio'],
            description: '技术播客第42期',
            createdAt: '2024-11-14 16:45:00',
            downloads: 342,
            isPublic: true
        },
        {
            id: 'media_14',
            name: 'database-backup.sql',
            originalName: 'production-backup-2024-11-14.sql',
            type: 'document',
            mimeType: 'application/sql',
            size: 67108864,
            url: '/media/database-backup.sql',
            thumbnailUrl: '/media/thumbnails/database-backup-thumb.jpg',
            author: {
                id: 'user_1',
                name: '管理员'
            },
            folder: '/backups',
            tags: ['database', 'sql', 'backup'],
            description: '生产数据库备份文件',
            createdAt: '2024-11-14 03:00:00',
            downloads: 5,
            isPublic: false
        },
        {
            id: 'media_15',
            name: 'font-family.woff2',
            originalName: 'custom-font-regular.woff2',
            type: 'other',
            mimeType: 'font/woff2',
            size: 24576,
            url: '/media/font-family.woff2',
            author: {
                id: 'user_12',
                name: '字体设计师'
            },
            folder: '/assets/fonts',
            tags: ['font', 'woff2', 'custom'],
            description: '自定义字体文件',
            createdAt: '2024-11-13 12:30:00',
            downloads: 89,
            isPublic: true
        }
    ];

    // 加载数据
    useEffect(() => {
        setLoading(true);
        setTimeout(() => {
            setMediaFiles(mockMediaFiles);
            setLoading(false);
        }, 800);
    }, []);

    // 筛选数据
    const filteredFiles = useMemo(() => {
        return mediaFiles.filter(file => {
            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                if (!file.name.toLowerCase().includes(searchTerm) &&
                    !file.originalName.toLowerCase().includes(searchTerm) &&
                    !file.description?.toLowerCase().includes(searchTerm) &&
                    !file.tags.some(tag => tag.toLowerCase().includes(searchTerm))) {
                    return false;
                }
            }
            if (filters.type && file.type !== filters.type) {
                return false;
            }
            if (filters.folder && file.folder !== filters.folder) {
                return false;
            }
            if (filters.tags) {
                const selectedTags = filters.tags.split(',').map(tag => tag.trim());
                if (!selectedTags.every(tag => file.tags.includes(tag))) {
                    return false;
                }
            }
            return true;
        });
    }, [mediaFiles, filters]);

    // 分页计算
    const totalPages = Math.ceil(filteredFiles.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = filteredFiles.slice(startIndex, endIndex);

    // 重置页码
    useEffect(() => {
        setCurrentPage(1);
    }, [filters]);

    // 筛选选项数据
    const typeOptions: SelectOption[] = [
        { id: '', name: '全部类型', color: '#6c757d' },
        { id: 'image', name: '图片', color: '#007bff' },
        { id: 'video', name: '视频', color: '#dc3545' },
        { id: 'audio', name: '音频', color: '#28a745' },
        { id: 'document', name: '文档', color: '#17a2b8' },
        { id: 'archive', name: '压缩包', color: '#6c757d' },
        { id: 'other', name: '其他', color: '#6c757d' }
    ];

    const folderOptions: SelectOption[] = [
        { id: '', name: '全部文件夹', color: '#6c757d' },
        ...mockFolders.map(folder => ({
            id: folder.path,
            name: `${folder.name} (${folder.fileCount}个文件)`,
            color: '#007bff'
        }))
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
            folder: '',
            dateRange: '',
            tags: ''
        });
    };

    // 文件选择
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedFiles(currentItems.map(file => file.id));
        } else {
            setSelectedFiles([]);
        }
    };

    const handleSelectFile = (fileId: string, checked: boolean) => {
        if (checked) {
            setSelectedFiles(prev => [...prev, fileId]);
        } else {
            setSelectedFiles(prev => prev.filter(id => id !== fileId));
        }
    };

    // 删除文件
    const deleteFiles = async (fileIds: string[]) => {
        await confirm({
            title: '删除文件',
            content: `确定要删除选中的 ${fileIds.length} 个文件吗？删除后无法恢复。`,
            confirmText: '确认删除',
            cancelText: '取消',
            onConfirm: async () => {
                setMediaFiles(prev => prev.filter(file => !fileIds.includes(file.id)));
                setSelectedFiles([]);
            }
        });
    };

    // 预览文件
    const handlePreviewFile = (file: MediaFile) => {
        setPreviewFile(file);
        setShowPreviewModal(true);
    };

    // 下载文件
    const downloadFile = (file: MediaFile) => {
        // 模拟下载
        const link = document.createElement('a');
        link.href = file.url;
        link.download = file.originalName;
        link.click();

        // 更新下载计数
        setMediaFiles(prev => prev.map(f =>
            f.id === file.id ? { ...f, downloads: f.downloads + 1 } : f
        ));
    };

    // 格式化文件大小
    const formatFileSize = (bytes: number) => {
        const sizes = ['B', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 B';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    };

    // 格式化时长
    const formatDuration = (seconds?: number) => {
        if (!seconds) return '-';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    // 获取文件图标
    const getFileIcon = (type: string, mimeType?: string) => {
        switch (type) {
            case 'image':
                return <FaImage />;
            case 'video':
                return <FaVideo />;
            case 'audio':
                return <FaFileAudio />;
            case 'document':
                if (mimeType?.includes('pdf')) return <FaFilePdf />;
                if (mimeType?.includes('word') || mimeType?.includes('document')) return <FaFileWord />;
                if (mimeType?.includes('excel') || mimeType?.includes('spreadsheet')) return <FaFileExcel />;
                if (mimeType?.includes('powerpoint') || mimeType?.includes('presentation')) return <FaFilePowerpoint />;
                if (mimeType?.includes('javascript') || mimeType?.includes('code')) return <FaFileCode />;
                return <FaFileAlt />;
            case 'archive':
                return <FaFileArchive />;
            default:
                return <FaFile />;
        }
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
            <div className={styles.mediaManagement}>
                <Loading text="加载媒体库中..." size="large" />
            </div>
        );
    }

    return (
        <div className={styles.mediaManagement}>
            {/* 页面头部 */}
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>媒体库管理</h1>
                    <p className={styles.pageDescription}>
                        管理图片、视频、文档等媒体文件
                    </p>
                </div>
                            </div>

            {/* 文件夹导航 */}
            <div className={styles.folderNavigation}>
                <div className={styles.breadcrumb}>
                    <FaFolder />
                    <span className={styles.currentPath}>/</span>
                </div>
                <div className={styles.folderGrid}>
                    {mockFolders.map(folder => (
                        <div key={folder.id} className={styles.folderCard}>
                            <div className={styles.folderIcon}>
                                <FaFolder />
                            </div>
                            <div className={styles.folderInfo}>
                                <div className={styles.folderName}>{folder.name}</div>
                                <div className={styles.folderMeta}>
                                    <span>{folder.fileCount} 个文件</span>
                                    <span>{formatFileSize(folder.size)}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 筛选区域 */}
            <div className={styles.filterSection}>
                <div className={styles.filterHeader}>
                    <h3 className={styles.filterTitle}>
                        <FaFilter />
                        筛选条件
                    </h3>
                    <div className={styles.filterActions}>
                        <div className={styles.viewToggle}>
                            <button
                                className={`${styles.viewButton} ${viewMode === 'grid' ? styles.active : ''}`}
                                onClick={() => setViewMode('grid')}
                                title="网格视图"
                            >
                                <FaTh />
                            </button>
                            <button
                                className={`${styles.viewButton} ${viewMode === 'list' ? styles.active : ''}`}
                                onClick={() => setViewMode('list')}
                                title="列表视图"
                            >
                                <FaList />
                            </button>
                        </div>
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
                        <label className={styles.filterLabel}>搜索文件</label>
                        <Input
                            placeholder="文件名、描述或标签"
                            value={filters.search}
                            onChange={(value) => handleFilterChange('search', value)}
                            allowClear={true}
                            size="large"
                            style={{ minHeight: '46px', height: '50px' }}
                        />
                    </div>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>文件类型</label>
                        <CustomSelect
                            name="类型"
                            options={typeOptions}
                            value={typeOptions.find(option => option.id === filters.type) || null}
                            onChange={handleSelectChange('type')}
                            placeholder="选择类型..."
                            className="adminCustomSelect"
                            hideBadge={true}
                        />
                    </div>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>文件夹</label>
                        <CustomSelect
                            name="文件夹"
                            options={folderOptions}
                            value={folderOptions.find(option => option.id === filters.folder) || null}
                            onChange={handleSelectChange('folder')}
                            placeholder="选择文件夹..."
                            className="adminCustomSelect"
                            hideBadge={true}
                        />
                    </div>
                </div>
            </div>

            {/* 批量操作栏 */}
            {selectedFiles.length > 0 && (
                <div className={styles.batchActions}>
                    <div className={styles.batchInfo}>
                        已选择 {selectedFiles.length} 个文件
                    </div>
                    <div className={styles.batchButtons}>
                        <button className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`}>
                            <FaCopy />
                            复制
                        </button>
                        <button className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`}>
                            <FaCut />
                            剪切
                        </button>
                        <button className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`}>
                            <FaFolder />
                            移动
                        </button>
                        <button
                            className={`${styles.btn} ${styles.btnDanger} ${styles.btnSm}`}
                            onClick={() => deleteFiles(selectedFiles)}
                        >
                            <FaTrash />
                            删除
                        </button>
                    </div>
                </div>
            )}

            {/* 文件统计 */}
            <div className={styles.statsBar}>
                <div className={styles.statItem}>
                    <span className={styles.statLabel}>总文件数：</span>
                    <span className={styles.statValue}>{filteredFiles.length}</span>
                </div>
                <div className={styles.statItem}>
                    <span className={styles.statLabel}>总大小：</span>
                    <span className={styles.statValue}>
                        {formatFileSize(filteredFiles.reduce((total, file) => total + file.size, 0))}
                    </span>
                </div>
            </div>

            {/* 文件列表/网格 */}
            <div className={styles.filesContainer}>
                {viewMode === 'grid' ? (
                    <div className={styles.filesGrid}>
                        {currentItems.length > 0 ? (
                            currentItems.map(file => (
                            <div key={file.id} className={styles.fileCard}>
                                <div className={styles.fileCheckbox}>
                                    <input
                                        type="checkbox"
                                        checked={selectedFiles.includes(file.id)}
                                        onChange={(e) => handleSelectFile(file.id, e.target.checked)}
                                    />
                                </div>
                                <div className={styles.filePreview}>
                                    {file.type === 'image' && file.thumbnailUrl ? (
                                        <img src={file.thumbnailUrl} alt={file.alt || file.name} />
                                    ) : (
                                        <div className={styles.fileIcon}>
                                            {getFileIcon(file.type, file.mimeType)}
                                        </div>
                                    )}
                                </div>
                                <div className={styles.fileInfo}>
                                    <div className={styles.fileName} title={file.originalName}>
                                        {file.name}
                                    </div>
                                    <div className={styles.fileMeta}>
                                        <span>{formatFileSize(file.size)}</span>
                                        {file.dimensions && (
                                            <span>{file.dimensions.width}×{file.dimensions.height}</span>
                                        )}
                                        {file.duration && (
                                            <span>{formatDuration(file.duration)}</span>
                                        )}
                                    </div>
                                    <div className={styles.fileAuthor}>
                                        <FaUser />
                                        {file.author.name}
                                    </div>
                                    <div className={styles.fileTags}>
                                        {file.tags.slice(0, 2).map(tag => (
                                            <span key={tag} className={styles.tag}>
                                                <FaTag />
                                                {tag}
                                            </span>
                                        ))}
                                        {file.tags.length > 2 && (
                                            <span className={styles.moreTags}>+{file.tags.length - 2}</span>
                                        )}
                                    </div>
                                </div>
                                <div className={styles.fileActions}>
                                    <button
                                        className={`${styles.actionButton} ${styles.preview}`}
                                        title="预览"
                                        onClick={() => handlePreviewFile(file)}
                                    >
                                        <FaEye />
                                    </button>
                                    <button
                                        className={`${styles.actionButton} ${styles.download}`}
                                        title="下载"
                                        onClick={() => downloadFile(file)}
                                    >
                                        <FaDownload />
                                    </button>
                                    <button
                                        className={`${styles.actionButton} ${styles.edit}`}
                                        title="编辑"
                                    >
                                        <FaEdit />
                                    </button>
                                    <button
                                        className={`${styles.actionButton} ${styles.delete}`}
                                        title="删除"
                                        onClick={() => deleteFiles([file.id])}
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                            暂无数据
                        </div>
                    )}
                    </div>
                ) : (
                    <div className={styles.filesList}>
                        <div className={styles.listHeader}>
                            <div className={styles.listCheckbox}>
                                <input
                                    type="checkbox"
                                    checked={selectedFiles.length === currentItems.length && currentItems.length > 0}
                                    onChange={(e) => handleSelectAll(e.target.checked)}
                                />
                            </div>
                            <div className={styles.listName}>文件名</div>
                            <div className={styles.listType}>类型</div>
                            <div className={styles.listSize}>大小</div>
                            <div className={styles.listAuthor}>上传者</div>
                            <div className={styles.listDate}>上传时间</div>
                            <div className={styles.listDownloads}>下载</div>
                            <div className={styles.listActions}>操作</div>
                        </div>
                        {currentItems.length > 0 ? (
                            currentItems.map(file => (
                                <div key={file.id} className={styles.listItem}>
                                <div className={styles.listCheckbox}>
                                    <input
                                        type="checkbox"
                                        checked={selectedFiles.includes(file.id)}
                                        onChange={(e) => handleSelectFile(file.id, e.target.checked)}
                                    />
                                </div>
                                <div className={styles.listName}>
                                    <div className={styles.listFileIcon}>
                                        {getFileIcon(file.type, file.mimeType)}
                                    </div>
                                    <div className={styles.listFileName}>
                                        <div className={styles.nameText}>{file.name}</div>
                                        <div className={styles.originalName}>{file.originalName}</div>
                                    </div>
                                </div>
                                <div className={styles.listType}>
                                    <span className={styles.typeBadge}>{file.type}</span>
                                </div>
                                <div className={styles.listSize}>{formatFileSize(file.size)}</div>
                                <div className={styles.listAuthor}>
                                    <span>{file.author.name}</span>
                                </div>
                                <div className={styles.listDate}>
                                    <span>{file.createdAt}</span>
                                </div>
                                <div className={styles.listDownloads}>
                                    <span>{file.downloads}</span>
                                </div>
                                <div className={styles.listActions}>
                                    <button
                                        className={`${styles.actionButton} ${styles.small}`}
                                        title="预览"
                                        onClick={() => handlePreviewFile(file)}
                                    >
                                        <FaEye />
                                    </button>
                                    <button
                                        className={`${styles.actionButton} ${styles.small}`}
                                        title="下载"
                                        onClick={() => downloadFile(file)}
                                    >
                                        <FaDownload />
                                    </button>
                                    <button
                                        className={`${styles.actionButton} ${styles.small}`}
                                        title="删除"
                                        onClick={() => deleteFiles([file.id])}
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                            暂无数据
                        </div>
                    )}
                    </div>
                )}

                {/* 分页 */}
                {totalPages >= 1 && (
                    <div className={styles.paginationContainer}>
                        <div className={styles.paginationInfo}>
                            显示 {startIndex + 1} - {Math.min(endIndex, filteredFiles.length)} 条，
                            共 {filteredFiles.length} 个文件
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

            {/* 预览模态框 */}
            {showPreviewModal && previewFile && (
                <div className={styles.previewModal} onClick={() => setShowPreviewModal(false)}>
                    <div className={styles.previewContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.previewHeader}>
                            <h3>{previewFile.name}</h3>
                            <button
                                className={styles.closeButton}
                                onClick={() => setShowPreviewModal(false)}
                            >
                                <FaTimesCircle />
                            </button>
                        </div>
                        <div className={styles.previewBody}>
                            {previewFile.type === 'image' ? (
                                <img src={previewFile.url} alt={previewFile.alt || previewFile.name} />
                            ) : previewFile.type === 'video' ? (
                                <video controls src={previewFile.url} />
                            ) : previewFile.type === 'audio' ? (
                                <audio controls src={previewFile.url} />
                            ) : (
                                <div className={styles.filePreviewPlaceholder}>
                                    {getFileIcon(previewFile.type, previewFile.mimeType)}
                                    <p>无法预览此文件类型</p>
                                </div>
                            )}
                        </div>
                        <div className={styles.previewFooter}>
                            <div className={styles.previewInfo}>
                                <span>大小：{formatFileSize(previewFile.size)}</span>
                                {previewFile.dimensions && (
                                    <span>尺寸：{previewFile.dimensions.width}×{previewFile.dimensions.height}</span>
                                )}
                                {previewFile.duration && (
                                    <span>时长：{formatDuration(previewFile.duration)}</span>
                                )}
                                <span>上传者：{previewFile.author.name}</span>
                            </div>
                            <div className={styles.previewActions}>
                                <button
                                    className={`${styles.btn} ${styles.btnPrimary}`}
                                    onClick={() => downloadFile(previewFile)}
                                >
                                    <FaDownload />
                                    下载
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MediaManagement;