import React, { useState, useEffect, useMemo } from 'react';
import { FaFilter, FaPlus, FaEdit, FaTrash, FaEye, FaChevronLeft, FaChevronRight, FaAngleDoubleLeft, FaAngleDoubleRight, FaUsers } from 'react-icons/fa';
import CustomSelect from '../../components/customSelect/CustomSelect';
import Input from '../../components/input/Input';
import Button from '../../components/button/Button';
import Loading from '../../components/loading/Loading';
import type { SelectOption } from '../../types/index';
import styles from './UserManagement.module.css';
import { AuthService } from '../../services/authService';

// 用户接口定义
interface User {
    id: string | number;
    username: string;
    email: string;
    avatar: string;
    role: string;
    status: string;
    createdAt: string;
    lastLogin: string;
    articleCount: number;
    commentCount: number;
}

// 统计数据接口
interface UserStats {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    inactiveUsers: number;
}

// 筛选条件接口
interface FilterOptions {
    search: string;
    role: string;
    status: string;
    dateRange: string;
}

const UserManagement: React.FC = () => {
    // 状态管理
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState<UserStats>({
        totalUsers: 0,
        activeUsers: 0,
        newUsers: 0,
        inactiveUsers: 0
    });
    const [filters, setFilters] = useState<FilterOptions>({
        search: '',
        role: '',
        status: '',
        dateRange: ''
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);

    const usersPerPage = 15; // 每页显示15条数据

    // 加载用户数据
    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                // 1. 获取所有用户ID
                const userIds = await AuthService.listUsers();
                
                // 2. 并行获取所有用户详情
                // 注意：如果用户量非常大，这里应该分批获取或只获取当前页
                // 但由于API限制，目前只能这样获取完整信息以支持前端筛选
                const userPromises = userIds.map(id => AuthService.getUserInfo(id));
                const responses = await Promise.all(userPromises);
                
                console.log('用户详情响应:', responses);

                const fetchedUsers: User[] = responses
                    .filter(res => res.code === '200' || res.code === 200)
                    .map(res => {
                        const userData = res.data;
                        // 映射后端状态码到前端状态字符串
                        // 假设 0: active, 1: inactive, 2: pending (需要根据实际后端定义调整)
                        let statusStr = 'active';
                        if (userData.status === 1) statusStr = 'inactive';
                        if (userData.status === 2) statusStr = 'pending';

                        return {
                            id: userData.id,
                            username: userData.name || userData.account,
                            email: userData.email,
                            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || userData.account)}&background=random`,
                            role: userData.role,
                            status: statusStr,
                            // API没有createdAt，暂时用login_time或当前时间
                            createdAt: new Date(Number(userData.login_time) * 1000).toISOString(), 
                            lastLogin: new Date(Number(userData.login_time) * 1000).toISOString(),
                            articleCount: 0, // API未提供
                            commentCount: 0  // API未提供
                        };
                    });

                setUsers(fetchedUsers);

                // 计算统计数据
                const totalUsers = fetchedUsers.length;
                const activeUsers = fetchedUsers.filter(user => user.status === 'active').length;
                const newUsers = fetchedUsers.filter(user => {
                    const createdAt = new Date(user.createdAt);
                    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                    return createdAt > thirtyDaysAgo;
                }).length;
                const inactiveUsers = fetchedUsers.filter(user => user.status === 'inactive').length;

                setStats({
                    totalUsers,
                    activeUsers,
                    newUsers,
                    inactiveUsers
                });

            } catch (error) {
                console.error('获取用户列表失败:', error);
                // 可以添加错误提示
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    // 筛选用户数据
    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            // 搜索筛选
            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                if (!user.username.toLowerCase().includes(searchTerm) &&
                    !user.email.toLowerCase().includes(searchTerm)) {
                    return false;
                }
            }

            // 角色筛选
            if (filters.role && user.role !== filters.role) {
                return false;
            }

            // 状态筛选
            if (filters.status && user.status !== filters.status) {
                return false;
            }

            // 日期范围筛选
            if (filters.dateRange) {
                const userDate = new Date(user.createdAt);
                const now = new Date();
                let startDate: Date;

                switch (filters.dateRange) {
                    case '7days':
                        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        break;
                    case '30days':
                        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                        break;
                    case '90days':
                        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                        break;
                    default:
                        return true;
                }

                if (userDate < startDate) {
                    return false;
                }
            }

            return true;
        });
    }, [users, filters]);

    // 分页计算
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
    const startIndex = (currentPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    const currentUsers = filteredUsers.slice(startIndex, endIndex);

    // 重置页码
    useEffect(() => {
        setCurrentPage(1);
    }, [filters]);

    // 筛选选项数据
    const roleOptions: SelectOption[] = [
        { id: '', name: '全部角色', color: '#6c757d' },
        { id: 'admin', name: '管理员', color: '#dc3545' },
        { id: 'moderator', name: '版主', color: '#28a745' },
        { id: 'user', name: '普通用户', color: '#007bff' }
    ];

    const statusOptions: SelectOption[] = [
        { id: '', name: '全部状态', color: '#6c757d' },
        { id: 'active', name: '活跃', color: '#28a745' },
        { id: 'inactive', name: '非活跃', color: '#ffc107' },
        { id: 'pending', name: '待审核', color: '#fd7e14' }
    ];

    const dateRangeOptions: SelectOption[] = [
        { id: '', name: '全部时间', color: '#6c757d' },
        { id: '7days', name: '最近7天', color: '#17a2b8' },
        { id: '30days', name: '最近30天', color: '#17a2b8' },
        { id: '90days', name: '最近90天', color: '#17a2b8' }
    ];

    // 处理CustomSelect选择
    const handleSelectChange = (field: keyof FilterOptions) => {
        return (selectedOption: SelectOption | null) => {
            setFilters(prev => ({
                ...prev,
                [field]: selectedOption?.id || ''
            }));
        };
    };

    // 处理筛选条件变化（用于搜索框）
    const handleFilterChange = (field: keyof FilterOptions, value: string) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // 清除筛选条件
    const clearFilters = () => {
        setFilters({
            search: '',
            role: '',
            status: '',
            dateRange: ''
        });
    };

    
    // 删除用户
    const deleteUser = (userId: string | number) => {
        if (window.confirm('确定要删除这个用户吗？此操作不可恢复。')) {
            // TODO: 调用后端删除接口 (目前API文档未提供删除用户接口，仅有删除文章/分类等)
            // 暂时只更新前端状态
            setUsers(prev => prev.filter(user => user.id !== userId));
        }
    };

    // 格式化日期
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
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
            <div className={styles.userManagement}>
                <Loading text="加载用户数据中..." size="large" />
            </div>
        );
    }

    return (
        <div className={styles.userManagement}>
            {/* 页面头部 */}
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>用户管理</h1>
                    <p className={styles.pageDescription}>
                        管理系统中的所有用户账户，包括权限设置和状态管理
                    </p>
                </div>
                <div className={styles.headerActions}>
                    <button className={`${styles.btn} ${styles.btnPrimary}`}>
                        <FaPlus />
                        添加用户
                    </button>
                </div>
            </div>

            {/* 统计卡片 */}
            <div className={styles.statsContainer}>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.primary}`}>
                        <FaUsers />
                    </div>
                    <div className={styles.statValue}>{stats.totalUsers}</div>
                    <div className={styles.statLabel}>总用户数</div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.success}`}>
                        <FaEye />
                    </div>
                    <div className={styles.statValue}>{stats.activeUsers}</div>
                    <div className={styles.statLabel}>活跃用户</div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.warning}`}>
                        <FaPlus />
                    </div>
                    <div className={styles.statValue}>{stats.newUsers}</div>
                    <div className={styles.statLabel}>新用户（30天）</div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.error}`}>
                        <FaTrash />
                    </div>
                    <div className={styles.statValue}>{stats.inactiveUsers}</div>
                    <div className={styles.statLabel}>非活跃用户</div>
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
                        <label className={styles.filterLabel}>搜索用户</label>
                        <Input
                            placeholder="用户名或邮箱"
                            value={filters.search}
                            onChange={(value) => handleFilterChange('search', value)}
                            allowClear={true}
                            size="large"
                            style={{ minHeight: '46px', height: '50px' }}
                        />
                    </div>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>用户角色</label>
                        <CustomSelect
                            name="用户角色"
                            options={roleOptions}
                            value={roleOptions.find(option => option.id === filters.role) || null}
                            onChange={handleSelectChange('role')}
                            placeholder="选择角色..."
                            className="adminCustomSelect"
                            hideBadge={true}
                        />
                    </div>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>账户状态</label>
                        <CustomSelect
                            name="账户状态"
                            options={statusOptions}
                            value={statusOptions.find(option => option.id === filters.status) || null}
                            onChange={handleSelectChange('status')}
                            placeholder="选择状态..."
                            className="adminCustomSelect"
                            hideBadge={true}
                        />
                    </div>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>注册时间</label>
                        <CustomSelect
                            name="注册时间"
                            options={dateRangeOptions}
                            value={dateRangeOptions.find(option => option.id === filters.dateRange) || null}
                            onChange={handleSelectChange('dateRange')}
                            placeholder="选择时间范围..."
                            className="adminCustomSelect"
                            hideBadge={true}
                        />
                    </div>
                </div>
            </div>

            {/* 用户表格 */}
            <div className={styles.tableContainer}>
                <div className={styles.tableHeader}>
                    <h3 className={styles.tableTitle}>用户列表</h3>
                    <div className={styles.tableActions}>
                        <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                            共 {filteredUsers.length} 个用户
                        </span>
                    </div>
                </div>
                <table className={styles.usersTable}>
                    <thead>
                        <tr>
                            <th>用户信息</th>
                            <th>角色</th>
                            <th>状态</th>
                            <th>注册时间</th>
                            <th>最后登录</th>
                            <th>文章数</th>
                            <th>评论数</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentUsers.map((user) => (
                            <tr key={user.id}>
                                <td>
                                    <div className={styles.userInfo}>
                                        <img
                                            src={user.avatar}
                                            alt={user.username}
                                            className={styles.userAvatar}
                                        />
                                        <div className={styles.userDetails}>
                                            <div className={styles.userName}>{user.username}</div>
                                            <div className={styles.userEmail}>{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span className={`${styles.roleBadge} ${styles[user.role]}`}>
                                        {user.role === 'admin' ? '管理员' :
                                         user.role === 'moderator' ? '版主' : '普通用户'}
                                    </span>
                                </td>
                                <td>
                                    <span className={`${styles.statusBadge} ${styles[user.status]}`}>
                                        <span className={styles.statusIndicator}></span>
                                        {user.status === 'active' ? '活跃' :
                                         user.status === 'inactive' ? '非活跃' : '待审核'}
                                    </span>
                                </td>
                                <td>{formatDate(user.createdAt)}</td>
                                <td>{formatDate(user.lastLogin)}</td>
                                <td>{user.articleCount}</td>
                                <td>{user.commentCount}</td>
                                <td>
                                    <div className={styles.actionButtons}>
                                        <button
                                            className={`${styles.actionButton} ${styles.edit}`}
                                            title="编辑用户"
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            className={`${styles.actionButton} ${styles.edit}`}
                                            title="查看详情"
                                        >
                                            <FaEye />
                                        </button>
                                        <Button
                                            color="error"
                                            variant="ghost"
                                            size="small"
                                            onClick={() => deleteUser(user.id)}
                                            className={styles.actionButton}
                                            aria-label="删除用户"
                                        >
                                            <FaTrash />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* 分页 */}
                <div className={styles.paginationContainer}>
                    <div className={styles.paginationInfo}>
                        显示 {startIndex + 1} - {Math.min(endIndex, filteredUsers.length)} 条，
                        共 {filteredUsers.length} 条记录
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
            </div>
        </div>
    );
};

export default UserManagement;
