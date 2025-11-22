import React, { useState, useEffect, useMemo } from 'react';
import {
    FaComments,
    FaFilter,
    FaPlus,
    FaReply,
    FaTrash,
    FaBan,
    FaCheck,
    FaEye,
    FaEyeSlash,
    FaChevronLeft,
    FaChevronRight,
    FaAngleDoubleLeft,
    FaAngleDoubleRight,
    FaUser,
    FaFileAlt,
    FaClock,
    FaExclamationTriangle,
    FaStar,
    FaFlag
} from 'react-icons/fa';
import CustomSelect from '../../components/customSelect/CustomSelect';
import Input from '../../components/input/Input';
import Loading from '../../components/loading/Loading';
import { confirm } from '../../components/confirm/Confirm';
import type { SelectOption } from '../../types/index';
import styles from './CommentManagement.module.css';

// 评论接口
interface Comment {
    id: string;
    content: string;
    author: {
        id: string;
        name: string;
        email: string;
        avatar?: string;
    };
    article: {
        id: string;
        title: string;
    };
    parentId?: string;
    status: 'approved' | 'pending' | 'rejected' | 'spam';
    createdAt: string;
    updatedAt?: string;
    likes: number;
    replies: number;
    isReported: boolean;
    reportCount: number;
    ip?: string;
    userAgent?: string;
}

// 筛选条件接口
interface FilterOptions {
    search: string;
    status: string;
    articleId: string;
    dateRange: string;
    isReported: string;
}

const CommentManagement: React.FC = () => {
    // 状态管理
    const [comments, setComments] = useState<Comment[]>([]);
    const [filters, setFilters] = useState<FilterOptions>({
        search: '',
        status: '',
        articleId: '',
        dateRange: '',
        isReported: ''
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [selectedComments, setSelectedComments] = useState<string[]>([]);
    const [showReplies, setShowReplies] = useState<string[]>([]);

    const itemsPerPage = 10;

    // 模拟评论数据
    const mockComments: Comment[] = [
        {
            id: 'comment_1',
            content: '这篇文章写得非常好，对我帮助很大！作者辛苦了，期待看到更多优质内容。',
            author: {
                id: 'user_1',
                name: '张三',
                email: 'zhangsan@example.com',
                avatar: '/avatars/user1.jpg'
            },
            article: {
                id: 'article_1',
                title: 'React 18 新特性详解'
            },
            status: 'approved',
            createdAt: '2024-11-22 10:30:00',
            likes: 15,
            replies: 3,
            isReported: false,
            reportCount: 0
        },
        {
            id: 'comment_2',
            content: '我觉得这个观点有待商榷，实际项目中可能会有其他考虑因素。',
            author: {
                id: 'user_2',
                name: '李四',
                email: 'lisi@example.com'
            },
            article: {
                id: 'article_2',
                title: '前端性能优化最佳实践'
            },
            status: 'pending',
            createdAt: '2024-11-22 09:15:00',
            likes: 5,
            replies: 1,
            isReported: false,
            reportCount: 0
        },
        {
            id: 'comment_3',
            content: '垃圾内容，完全是在浪费时间。',
            author: {
                id: 'user_3',
                name: '匿名用户',
                email: 'anonymous@spam.com'
            },
            article: {
                id: 'article_1',
                title: 'React 18 新特性详解'
            },
            status: 'spam',
            createdAt: '2024-11-21 15:45:00',
            likes: 0,
            replies: 0,
            isReported: true,
            reportCount: 3
        },
        {
            id: 'comment_4',
            content: '作者能否详细解释一下这个概念？我在实际开发中遇到了类似的问题。',
            author: {
                id: 'user_4',
                name: '王五',
                email: 'wangwu@example.com'
            },
            article: {
                id: 'article_3',
                title: 'TypeScript 高级技巧'
            },
            status: 'approved',
            createdAt: '2024-11-21 14:20:00',
            likes: 8,
            replies: 2,
            isReported: false,
            reportCount: 0
        },
        {
            id: 'comment_5',
            content: '很好的教程！我已经按照步骤实现了，效果很棒。',
            author: {
                id: 'user_5',
                name: '赵六',
                email: 'zhaoliu@example.com'
            },
            article: {
                id: 'article_4',
                title: 'Vue 3 Composition API 实战'
            },
            parentId: 'comment_1',
            status: 'approved',
            createdAt: '2024-11-21 13:10:00',
            likes: 3,
            replies: 0,
            isReported: false,
            reportCount: 0
        },
        {
            id: 'comment_6',
            content: '代码示例有错误，请检查一下第15行。另外建议添加错误处理的说明。',
            author: {
                id: 'user_6',
                name: '技术达人',
                email: 'tech@example.com'
            },
            article: {
                id: 'article_2',
                title: '前端性能优化最佳实践'
            },
            status: 'rejected',
            createdAt: '2024-11-20 16:30:00',
            likes: 2,
            replies: 0,
            isReported: false,
            reportCount: 0
        },
        {
            id: 'comment_7',
            content: '这个方法太复杂了，有没有更简单的实现方式？',
            author: {
                id: 'user_7',
                name: '新手小白',
                email: 'newbie@example.com'
            },
            article: {
                id: 'article_3',
                title: 'TypeScript 高级技巧'
            },
            status: 'pending',
            createdAt: '2024-11-20 11:45:00',
            likes: 1,
            replies: 1,
            isReported: false,
            reportCount: 0
        },
        {
            id: 'comment_8',
            content: '非常有价值的分享，收藏了！感谢作者的详细讲解。',
            author: {
                id: 'user_8',
                name: '学习者',
                email: 'learner@example.com'
            },
            article: {
                id: 'article_5',
                title: 'Node.js 微服务架构'
            },
            status: 'approved',
            createdAt: '2024-11-20 10:20:00',
            likes: 12,
            replies: 0,
            isReported: false,
            reportCount: 0
        },
        {
            id: 'comment_9',
            content: '这个解决方案很实用，我已经在我的项目中应用了，效果很好。',
            author: {
                id: 'user_9',
                name: '开发者小明',
                email: 'xiaoming@example.com'
            },
            article: {
                id: 'article_6',
                title: 'Docker 容器化部署指南'
            },
            status: 'approved',
            createdAt: '2024-11-20 09:45:00',
            likes: 18,
            replies: 2,
            isReported: false,
            reportCount: 0
        },
        {
            id: 'comment_10',
            content: '请问有没有相关的视频教程？文字教程有时候不够直观。',
            author: {
                id: 'user_10',
                name: '视频爱好者',
                email: 'video@example.com'
            },
            article: {
                id: 'article_1',
                title: 'React 18 新特性详解'
            },
            status: 'pending',
            createdAt: '2024-11-20 08:30:00',
            likes: 6,
            replies: 1,
            isReported: false,
            reportCount: 0
        },
        {
            id: 'comment_11',
            content: '文章写得很好，但是代码示例有些地方可以优化，比如可以使用更现代的语法。',
            author: {
                id: 'user_11',
                name: '代码优化师',
                email: 'optimizer@example.com'
            },
            article: {
                id: 'article_2',
                title: '前端性能优化最佳实践'
            },
            status: 'approved',
            createdAt: '2024-11-19 16:20:00',
            likes: 9,
            replies: 1,
            isReported: false,
            reportCount: 0
        },
        {
            id: 'comment_12',
            content: '这个方法在浏览器兼容性方面有什么考虑吗？',
            author: {
                id: 'user_12',
                name: '兼容性专家',
                email: 'compat@example.com'
            },
            article: {
                id: 'article_3',
                title: 'TypeScript 高级技巧'
            },
            status: 'pending',
            createdAt: '2024-11-19 15:15:00',
            likes: 4,
            replies: 0,
            isReported: false,
            reportCount: 0
        },
        {
            id: 'comment_13',
            content: '太棒了！这个教程解决了我困扰很久的问题。',
            author: {
                id: 'user_13',
                name: '问题解决者',
                email: 'solver@example.com'
            },
            article: {
                id: 'article_4',
                title: 'Vue 3 Composition API 实战'
            },
            status: 'approved',
            createdAt: '2024-11-19 14:10:00',
            likes: 22,
            replies: 0,
            isReported: false,
            reportCount: 0
        },
        {
            id: 'comment_14',
            content: '建议增加一些实际项目中的应用案例，这样读者更容易理解。',
            author: {
                id: 'user_14',
                name: '案例收集者',
                email: 'cases@example.com'
            },
            article: {
                id: 'article_5',
                title: 'Node.js 微服务架构'
            },
            status: 'approved',
            createdAt: '2024-11-19 13:05:00',
            likes: 7,
            replies: 0,
            isReported: false,
            reportCount: 0
        },
        {
            id: 'comment_15',
            content: '内容很好，但是排版可以再优化一下，图片位置不太合适。',
            author: {
                id: 'user_15',
                name: 'UI设计师',
                email: 'designer@example.com'
            },
            article: {
                id: 'article_6',
                title: 'Docker 容器化部署指南'
            },
            status: 'approved',
            createdAt: '2024-11-19 12:00:00',
            likes: 11,
            replies: 0,
            isReported: false,
            reportCount: 0
        },
        {
            id: 'comment_16',
            content: '有没有相关的源码可以参考？想学习一下具体的实现。',
            author: {
                id: 'user_16',
                name: '源码爱好者',
                email: 'source@example.com'
            },
            article: {
                id: 'article_1',
                title: 'React 18 新特性详解'
            },
            status: 'pending',
            createdAt: '2024-11-19 10:55:00',
            likes: 8,
            replies: 0,
            isReported: false,
            reportCount: 0
        },
        {
            id: 'comment_17',
            content: '这个框架和其他框架相比有什么优势吗？',
            author: {
                id: 'user_17',
                name: '技术对比者',
                email: 'compare@example.com'
            },
            article: {
                id: 'article_2',
                title: '前端性能优化最佳实践'
            },
            status: 'approved',
            createdAt: '2024-11-19 09:50:00',
            likes: 5,
            replies: 2,
            isReported: false,
            reportCount: 0
        },
        {
            id: 'comment_18',
            content: '学习到了很多，感谢分享！期待更多优质内容。',
            author: {
                id: 'user_18',
                name: '感恩读者',
                email: 'thanks@example.com'
            },
            article: {
                id: 'article_3',
                title: 'TypeScript 高级技巧'
            },
            status: 'approved',
            createdAt: '2024-11-19 08:45:00',
            likes: 15,
            replies: 0,
            isReported: false,
            reportCount: 0
        },
        {
            id: 'comment_19',
            content: '内容很全面，但是篇幅有点长，建议拆分成系列文章。',
            author: {
                id: 'user_19',
                name: '阅读顾问',
                email: 'reader@example.com'
            },
            article: {
                id: 'article_4',
                title: 'Vue 3 Composition API 实战'
            },
            status: 'approved',
            createdAt: '2024-11-18 17:40:00',
            likes: 3,
            replies: 1,
            isReported: false,
            reportCount: 0
        },
        {
            id: 'comment_20',
            content: '这个架构设计很巧妙，但是在高并发情况下表现如何？',
            author: {
                id: 'user_20',
                name: '架构师',
                email: 'architect@example.com'
            },
            article: {
                id: 'article_5',
                title: 'Node.js 微服务架构'
            },
            status: 'pending',
            createdAt: '2024-11-18 16:35:00',
            likes: 12,
            replies: 0,
            isReported: false,
            reportCount: 0
        },
        {
            id: 'comment_21',
            content: '有没有遇到什么坑？新手想避坑。',
            author: {
                id: 'user_21',
                name: '避坑新手',
                email: 'newbie2@example.com'
            },
            article: {
                id: 'article_6',
                title: 'Docker 容器化部署指南'
            },
            status: 'approved',
            createdAt: '2024-11-18 15:30:00',
            likes: 20,
            replies: 3,
            isReported: false,
            reportCount: 0
        },
        {
            id: 'comment_22',
            content: '这个API在新版本中有变化吗？',
            author: {
                id: 'user_22',
                name: '版本关注者',
                email: 'version@example.com'
            },
            article: {
                id: 'article_1',
                title: 'React 18 新特性详解'
            },
            status: 'approved',
            createdAt: '2024-11-18 14:25:00',
            likes: 6,
            replies: 1,
            isReported: false,
            reportCount: 0
        },
        {
            id: 'comment_23',
            content: '性能提升明显吗？有具体的测试数据吗？',
            author: {
                id: 'user_23',
                name: '性能测试员',
                email: 'perf@example.com'
            },
            article: {
                id: 'article_2',
                title: '前端性能优化最佳实践'
            },
            status: 'approved',
            createdAt: '2024-11-18 13:20:00',
            likes: 14,
            replies: 0,
            isReported: false,
            reportCount: 0
        },
        {
            id: 'comment_24',
            content: '类型定义很详细，对于大型项目很有帮助。',
            author: {
                id: 'user_24',
                name: 'TypeScript粉丝',
                email: 'tsfan@example.com'
            },
            article: {
                id: 'article_3',
                title: 'TypeScript 高级技巧'
            },
            status: 'approved',
            createdAt: '2024-11-18 12:15:00',
            likes: 16,
            replies: 0,
            isReported: false,
            reportCount: 0
        },
        {
            id: 'comment_25',
            content: 'Composition API确实比Options API更灵活，推荐使用。',
            author: {
                id: 'user_25',
                name: 'Vue专家',
                email: 'vueexpert@example.com'
            },
            article: {
                id: 'article_4',
                title: 'Vue 3 Composition API 实战'
            },
            status: 'approved',
            createdAt: '2024-11-18 11:10:00',
            likes: 19,
            replies: 1,
            isReported: false,
            reportCount: 0
        },
        {
            id: 'comment_26',
            content: '服务拆分的粒度如何把握？太细会增加复杂度。',
            author: {
                id: 'user_26',
                name: '微服务思考者',
                email: 'micro@example.com'
            },
            article: {
                id: 'article_5',
                title: 'Node.js 微服务架构'
            },
            status: 'pending',
            createdAt: '2024-11-18 10:05:00',
            likes: 8,
            replies: 2,
            isReported: false,
            reportCount: 0
        },
        {
            id: 'comment_27',
            content: 'Dockerfile的优化建议可以再详细一些，比如多阶段构建。',
            author: {
                id: 'user_27',
                name: 'Docker优化师',
                email: 'docker@example.com'
            },
            article: {
                id: 'article_6',
                title: 'Docker 容器化部署指南'
            },
            status: 'approved',
            createdAt: '2024-11-18 09:00:00',
            likes: 13,
            replies: 0,
            isReported: false,
            reportCount: 0
        },
        {
            id: 'comment_28',
            content: 'Concurrent Mode的使用场景能再详细介绍一下吗？',
            author: {
                id: 'user_28',
                name: '并发学习者',
                email: 'concurrent@example.com'
            },
            article: {
                id: 'article_1',
                title: 'React 18 新特性详解'
            },
            status: 'pending',
            createdAt: '2024-11-17 16:50:00',
            likes: 7,
            replies: 0,
            isReported: false,
            reportCount: 0
        },
        {
            id: 'comment_29',
            content: '这些优化技巧在移动端效果如何？',
            author: {
                id: 'user_29',
                name: '移动开发',
                email: 'mobile@example.com'
            },
            article: {
                id: 'article_2',
                title: '前端性能优化最佳实践'
            },
            status: 'approved',
            createdAt: '2024-11-17 15:45:00',
            likes: 10,
            replies: 1,
            isReported: false,
            reportCount: 0
        },
        {
            id: 'comment_30',
            content: '泛型的使用让代码更加类型安全，学习到了！',
            author: {
                id: 'user_30',
                name: '泛型学习者',
                email: 'generic@example.com'
            },
            article: {
                id: 'article_3',
                title: 'TypeScript 高级技巧'
            },
            status: 'approved',
            createdAt: '2024-11-17 14:40:00',
            likes: 11,
            replies: 0,
            isReported: false,
            reportCount: 0
        }
    ];

    // 加载数据
    useEffect(() => {
        setLoading(true);
        setTimeout(() => {
            setComments(mockComments);
            setLoading(false);
        }, 800);
    }, []);

    // 筛选数据
    const filteredComments = useMemo(() => {
        return comments.filter(comment => {
            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                if (!comment.content.toLowerCase().includes(searchTerm) &&
                    !comment.author.name.toLowerCase().includes(searchTerm) &&
                    !comment.article.title.toLowerCase().includes(searchTerm)) {
                    return false;
                }
            }
            if (filters.status && comment.status !== filters.status) {
                return false;
            }
            if (filters.isReported) {
                const reported = filters.isReported === 'true';
                if (comment.isReported !== reported) {
                    return false;
                }
            }
            return true;
        });
    }, [comments, filters]);

    // 分页计算
    const totalPages = Math.ceil(filteredComments.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = filteredComments.slice(startIndex, endIndex);

    // 重置页码
    useEffect(() => {
        setCurrentPage(1);
    }, [filters]);

    // 筛选选项数据
    const statusOptions: SelectOption[] = [
        { id: '', name: '全部状态' },
        { id: 'approved', name: '已通过' },
        { id: 'pending', name: '待审核' },
        { id: 'rejected', name: '已拒绝' },
        { id: 'spam', name: '垃圾评论' }
    ];

    const reportedOptions: SelectOption[] = [
        { id: '', name: '全部' },
        { id: 'true', name: '被举报' },
        { id: 'false', name: '正常' }
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
            status: '',
            articleId: '',
            dateRange: '',
            isReported: ''
        });
    };

    // 批量操作
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedComments(currentItems.map(comment => comment.id));
        } else {
            setSelectedComments([]);
        }
    };

    const handleSelectComment = (commentId: string, checked: boolean) => {
        if (checked) {
            setSelectedComments(prev => [...prev, commentId]);
        } else {
            setSelectedComments(prev => prev.filter(id => id !== commentId));
        }
    };

    // 批准评论
    const approveComments = async (commentIds: string[]) => {
        await confirm({
            title: '批准评论',
            content: `确定要批准选中的 ${commentIds.length} 条评论吗？`,
            confirmText: '确认批准',
            cancelText: '取消',
            onConfirm: async () => {
                setComments(prev => prev.map(comment =>
                    commentIds.includes(comment.id)
                        ? { ...comment, status: 'approved' as const, updatedAt: new Date().toLocaleString('zh-CN') }
                        : comment
                ));
                setSelectedComments([]);
            }
        });
    };

    // 拒绝评论
    const rejectComments = async (commentIds: string[]) => {
        await confirm({
            title: '拒绝评论',
            content: `确定要拒绝选中的 ${commentIds.length} 条评论吗？`,
            confirmText: '确认拒绝',
            cancelText: '取消',
            onConfirm: async () => {
                setComments(prev => prev.map(comment =>
                    commentIds.includes(comment.id)
                        ? { ...comment, status: 'rejected' as const, updatedAt: new Date().toLocaleString('zh-CN') }
                        : comment
                ));
                setSelectedComments([]);
            }
        });
    };

    // 标记为垃圾评论
    const markAsSpam = async (commentIds: string[]) => {
        await confirm({
            title: '标记垃圾评论',
            content: `确定要将选中的 ${commentIds.length} 条评论标记为垃圾评论吗？`,
            confirmText: '确认标记',
            cancelText: '取消',
            onConfirm: async () => {
                setComments(prev => prev.map(comment =>
                    commentIds.includes(comment.id)
                        ? { ...comment, status: 'spam' as const, isReported: true, reportCount: comment.reportCount + 1, updatedAt: new Date().toLocaleString('zh-CN') }
                        : comment
                ));
                setSelectedComments([]);
            }
        });
    };

    // 删除评论
    const deleteComments = async (commentIds: string[]) => {
        await confirm({
            title: '删除评论',
            content: `确定要删除选中的 ${commentIds.length} 条评论吗？删除后无法恢复。`,
            confirmText: '确认删除',
            cancelText: '取消',
            onConfirm: async () => {
                setComments(prev => prev.filter(comment => !commentIds.includes(comment.id)));
                setSelectedComments([]);
            }
        });
    };

    // 切换回复显示
    const toggleReplies = (commentId: string) => {
        setShowReplies(prev =>
            prev.includes(commentId)
                ? prev.filter(id => id !== commentId)
                : [...prev, commentId]
        );
    };

    // 格式化日期
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // 获取回复评论
    const getReplies = (parentId: string) => {
        return comments.filter(comment => comment.parentId === parentId);
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
            <div className={styles.commentManagement}>
                <Loading text="加载评论管理中..." size="large" />
            </div>
        );
    }

    return (
        <div className={styles.commentManagement}>
            {/* 页面头部 */}
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>评论管理</h1>
                    <p className={styles.pageDescription}>
                        管理用户评论、审核内容和处理举报
                    </p>
                </div>
                <div className={styles.headerActions}>
                    <span style={{ fontSize: '14px', color: 'var(--text-secondary)', marginRight: '12px' }}>
                        共 {filteredComments.length} 条评论
                    </span>
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
                        <label className={styles.filterLabel}>搜索评论</label>
                        <Input
                            placeholder="评论内容、作者或文章标题"
                            value={filters.search}
                            onChange={(value) => handleFilterChange('search', value)}
                            allowClear={true}
                            size="large"
                            style={{ minHeight: '46px', height: '50px' }}
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
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>举报状态</label>
                        <CustomSelect
                            name="举报状态"
                            options={reportedOptions}
                            value={reportedOptions.find(option => option.id === filters.isReported) || null}
                            onChange={handleSelectChange('isReported')}
                            placeholder="选择举报状态..."
                            className="adminCustomSelect"
                            hideBadge={true}
                        />
                    </div>
                </div>
            </div>

            {/* 批量操作栏 */}
            {selectedComments.length > 0 && (
                <div className={styles.batchActions}>
                    <div className={styles.batchInfo}>
                        已选择 {selectedComments.length} 条评论
                    </div>
                    <div className={styles.batchButtons}>
                        <button
                            className={`${styles.btn} ${styles.btnSuccess} ${styles.btnSm}`}
                            onClick={() => approveComments(selectedComments)}
                        >
                            <FaCheck />
                            批准
                        </button>
                        <button
                            className={`${styles.btn} ${styles.btnWarning} ${styles.btnSm}`}
                            onClick={() => rejectComments(selectedComments)}
                        >
                            <FaBan />
                            拒绝
                        </button>
                        <button
                            className={`${styles.btn} ${styles.btnDanger} ${styles.btnSm}`}
                            onClick={() => markAsSpam(selectedComments)}
                        >
                            <FaExclamationTriangle />
                            标记垃圾
                        </button>
                        <button
                            className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`}
                            onClick={() => deleteComments(selectedComments)}
                        >
                            <FaTrash />
                            删除
                        </button>
                    </div>
                </div>
            )}

            {/* 评论列表 */}
            <div className={styles.commentsContainer}>
                {currentItems.map((comment) => {
                    const replies = getReplies(comment.id);
                    const hasReplies = replies.length > 0;
                    const showReplyList = showReplies.includes(comment.id);

                    return (
                        <div key={comment.id} className={styles.commentCard}>
                            <div className={styles.commentHeader}>
                                <div className={styles.commentMeta}>
                                    <input
                                        type="checkbox"
                                        checked={selectedComments.includes(comment.id)}
                                        onChange={(e) => handleSelectComment(comment.id, e.target.checked)}
                                        className={styles.commentCheckbox}
                                    />
                                    <div className={styles.authorInfo}>
                                        <div className={styles.authorAvatar}>
                                            {comment.author.avatar ? (
                                                <img src={comment.author.avatar} alt={comment.author.name} />
                                            ) : (
                                                <FaUser />
                                            )}
                                        </div>
                                        <div className={styles.authorDetails}>
                                            <div className={styles.authorName}>{comment.author.name}</div>
                                            <div className={styles.authorEmail}>{comment.author.email}</div>
                                        </div>
                                    </div>
                                    <div className={styles.commentInfo}>
                                        <span className={`${styles.statusBadge} ${styles[comment.status]}`}>
                                            {comment.status === 'approved' && '已通过'}
                                            {comment.status === 'pending' && '待审核'}
                                            {comment.status === 'rejected' && '已拒绝'}
                                            {comment.status === 'spam' && '垃圾评论'}
                                        </span>
                                        {comment.isReported && (
                                            <span className={styles.reportedBadge}>
                                                <FaFlag />
                                                举报 {comment.reportCount}
                                            </span>
                                        )}
                                        <span className={styles.commentTime}>
                                            <FaClock />
                                            {formatDate(comment.createdAt)}
                                        </span>
                                    </div>
                                </div>
                                <div className={styles.commentActions}>
                                    {comment.status === 'pending' && (
                                        <>
                                            <button
                                                className={`${styles.actionButton} ${styles.approve}`}
                                                title="批准"
                                                onClick={() => approveComments([comment.id])}
                                            >
                                                <FaCheck />
                                            </button>
                                            <button
                                                className={`${styles.actionButton} ${styles.reject}`}
                                                title="拒绝"
                                                onClick={() => rejectComments([comment.id])}
                                            >
                                                <FaBan />
                                            </button>
                                        </>
                                    )}
                                    <button
                                        className={`${styles.actionButton} ${styles.spam}`}
                                        title="标记垃圾"
                                        onClick={() => markAsSpam([comment.id])}
                                    >
                                        <FaExclamationTriangle />
                                    </button>
                                    <button
                                        className={`${styles.actionButton} ${styles.delete}`}
                                        title="删除"
                                        onClick={() => deleteComments([comment.id])}
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>

                            <div className={styles.commentContent}>
                                <div className={styles.articleLink}>
                                    <FaFileAlt />
                                    文章：{comment.article.title}
                                </div>
                                <div className={styles.contentText}>
                                    {comment.content}
                                </div>
                                <div className={styles.commentStats}>
                                    <span className={styles.statItem}>
                                        <FaStar />
                                        {comment.likes} 赞
                                    </span>
                                    {hasReplies && (
                                        <button
                                            className={styles.statItem}
                                            onClick={() => toggleReplies(comment.id)}
                                        >
                                            <FaReply />
                                            {replies.length} 回复
                                            {showReplyList ? <FaEyeSlash /> : <FaEye />}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* 回复列表 */}
                            {hasReplies && showReplyList && (
                                <div className={styles.repliesList}>
                                    {replies.map(reply => (
                                        <div key={reply.id} className={styles.replyItem}>
                                            <div className={styles.replyHeader}>
                                                <div className={styles.replyAuthor}>
                                                    <div className={styles.replyAvatar}>
                                                        {reply.author.avatar ? (
                                                            <img src={reply.author.avatar} alt={reply.author.name} />
                                                        ) : (
                                                            <FaUser />
                                                        )}
                                                    </div>
                                                    <div className={styles.replyInfo}>
                                                        <span className={styles.replyName}>{reply.author.name}</span>
                                                        <span className={styles.replyTime}>{formatDate(reply.createdAt)}</span>
                                                        <span className={`${styles.statusBadge} ${styles[reply.status]} ${styles.small}`}>
                                                            {reply.status === 'approved' && '已通过'}
                                                            {reply.status === 'pending' && '待审核'}
                                                            {reply.status === 'rejected' && '已拒绝'}
                                                            {reply.status === 'spam' && '垃圾评论'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className={styles.replyActions}>
                                                    <button
                                                        className={`${styles.actionButton} ${styles.small}`}
                                                        title="删除"
                                                        onClick={() => deleteComments([reply.id])}
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className={styles.replyContent}>
                                                {reply.content}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
                <div className={styles.paginationContainer}>
                    <div className={styles.paginationInfo}>
                        显示 {startIndex + 1} - {Math.min(endIndex, filteredComments.length)} 条，
                        共 {filteredComments.length} 条评论
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
    );
};

export default CommentManagement;