import React, { useState, useEffect, useMemo } from "react";
import {
    FaPlus,
    FaFilter,
    FaEdit,
    FaTrash,
    FaEye,
    FaChevronLeft,
    FaChevronRight,
    FaAngleDoubleLeft,
    FaAngleDoubleRight,
    FaUsers,
    FaKey,
    FaShieldAlt,
    FaLock,
    FaUnlock,
    FaUserCog,
    FaUserTag,
} from "react-icons/fa";
import CustomSelect from "../../components/customSelect/CustomSelect";
import Input from "../../components/input/Input";
import Loading from "../../components/loading/Loading";
import { confirm } from "../../components/confirm/Confirm";
import type { SelectOption } from "../../types/index";
import styles from "./PermissionManagement.module.css";

// 权限接口定义
interface Permission {
    id: string;
    name: string;
    code: string;
    description: string;
    module: string;
    category: "system" | "content" | "user" | "admin";
}

// 角色接口定义
interface Role {
    id: string;
    name: string;
    code: string;
    description: string;
    permissions: string[];
    userCount: number;
    createdAt: string;
    updatedAt: string;
    isSystem: boolean;
    color: string;
}

// 用户权限接口定义
interface UserPermission {
    id: string;
    userId: string;
    username: string;
    email: string;
    avatar: string;
    roles: string[];
    permissions: string[];
    status: "active" | "inactive";
    lastLogin: string;
}

// 统计数据接口
interface PermissionStats {
    totalRoles: number;
    totalUsers: number;
    activePermissions: number;
    systemRoles: number;
}

// 筛选条件接口
interface FilterOptions {
    search: string;
    type: string;
    status: string;
    module: string;
}

const PermissionManagement: React.FC = () => {
    // 状态管理
    const [activeTab, setActiveTab] = useState<"roles" | "users">("roles");
    const [roles, setRoles] = useState<Role[]>([]);
    const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
    const [stats, setStats] = useState<PermissionStats>({
        totalRoles: 0,
        totalUsers: 0,
        activePermissions: 0,
        systemRoles: 0,
    });
    const [filters, setFilters] = useState<FilterOptions>({
        search: "",
        type: "",
        status: "",
        module: "",
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);

    const itemsPerPage = 15; // 每页显示15条数据

    // 模拟权限数据
    const mockPermissions: Permission[] = [
        // 系统权限
        {
            id: "perm_1",
            name: "系统管理",
            code: "system.admin",
            description: "管理系统设置和配置",
            module: "系统",
            category: "system",
        },
        {
            id: "perm_2",
            name: "用户管理",
            code: "user.manage",
            description: "管理系统用户",
            module: "系统",
            category: "system",
        },
        {
            id: "perm_3",
            name: "角色管理",
            code: "role.manage",
            description: "管理系统角色",
            module: "系统",
            category: "system",
        },
        {
            id: "perm_4",
            name: "权限管理",
            code: "permission.manage",
            description: "管理系统权限",
            module: "系统",
            category: "system",
        },

        // 内容权限
        {
            id: "perm_5",
            name: "文章发布",
            code: "article.publish",
            description: "发布文章到系统",
            module: "内容",
            category: "content",
        },
        {
            id: "perm_6",
            name: "文章审核",
            code: "article.review",
            description: "审核待发布文章",
            module: "内容",
            category: "content",
        },
        {
            id: "perm_7",
            name: "文章编辑",
            code: "article.edit",
            description: "编辑已发布文章",
            module: "内容",
            category: "content",
        },
        {
            id: "perm_8",
            name: "文章删除",
            code: "article.delete",
            description: "删除系统文章",
            module: "内容",
            category: "content",
        },
        {
            id: "perm_9",
            name: "评论管理",
            code: "comment.manage",
            description: "管理系统评论",
            module: "内容",
            category: "content",
        },
        {
            id: "perm_10",
            name: "分类管理",
            code: "category.manage",
            description: "管理文章分类",
            module: "内容",
            category: "content",
        },

        // 用户权限
        {
            id: "perm_11",
            name: "个人资料编辑",
            code: "profile.edit",
            description: "编辑个人资料",
            module: "用户",
            category: "user",
        },
        {
            id: "perm_12",
            name: "密码修改",
            code: "password.change",
            description: "修改个人密码",
            module: "用户",
            category: "user",
        },
        {
            id: "perm_13",
            name: "用户查看",
            code: "user.view",
            description: "查看用户信息",
            module: "用户",
            category: "user",
        },

        // 管理权限
        {
            id: "perm_14",
            name: "数据导出",
            code: "data.export",
            description: "导出系统数据",
            module: "管理",
            category: "admin",
        },
        {
            id: "perm_15",
            name: "日志查看",
            code: "log.view",
            description: "查看系统日志",
            module: "管理",
            category: "admin",
        },
        {
            id: "perm_16",
            name: "统计分析",
            code: "analytics.view",
            description: "查看系统统计",
            module: "管理",
            category: "admin",
        },
    ];

    // 模拟角色数据
    const mockRoles: Role[] = [
        {
            id: "role_1",
            name: "超级管理员",
            code: "super_admin",
            description: "拥有系统所有权限的超级管理员",
            permissions: mockPermissions.map((p) => p.id),
            userCount: 2,
            createdAt: "2024-01-01",
            updatedAt: "2024-11-20",
            isSystem: true,
            color: "#dc2626",
        },
        {
            id: "role_2",
            name: "管理员",
            code: "admin",
            description: "系统管理员，拥有大部分管理权限",
            permissions: [
                "perm_2",
                "perm_5",
                "perm_6",
                "perm_7",
                "perm_8",
                "perm_9",
                "perm_10",
                "perm_14",
                "perm_15",
                "perm_16",
            ],
            userCount: 5,
            createdAt: "2024-01-01",
            updatedAt: "2024-11-18",
            isSystem: true,
            color: "#f59e0b",
        },
        {
            id: "role_3",
            name: "编辑",
            code: "editor",
            description: "内容编辑，可以管理和审核内容",
            permissions: ["perm_5", "perm_6", "perm_7", "perm_9", "perm_10"],
            userCount: 12,
            createdAt: "2024-01-15",
            updatedAt: "2024-11-17",
            isSystem: false,
            color: "#3b82f6",
        },
        {
            id: "role_4",
            name: "作者",
            code: "author",
            description: "内容创作者，可以发布和编辑自己的文章",
            permissions: ["perm_5", "perm_7", "perm_11", "perm_12"],
            userCount: 48,
            createdAt: "2024-01-20",
            updatedAt: "2024-11-16",
            isSystem: false,
            color: "#10b981",
        },
        {
            id: "role_5",
            name: "普通用户",
            code: "user",
            description: "普通用户，基础权限",
            permissions: ["perm_11", "perm_12", "perm_13"],
            userCount: 156,
            createdAt: "2024-01-25",
            updatedAt: "2024-11-15",
            isSystem: false,
            color: "#6b7280",
        },
        {
            id: "role_6",
            name: "审核员",
            code: "moderator",
            description: "内容审核员，负责内容审核",
            permissions: ["perm_6", "perm_9", "perm_11", "perm_12", "perm_13"],
            userCount: 8,
            createdAt: "2024-02-01",
            updatedAt: "2024-11-14",
            isSystem: false,
            color: "#8b5cf6",
        },
    ];

    // 模拟用户权限数据
    const mockUserPermissions: UserPermission[] = Array.from({ length: 100 }, (_, index) => {
        const userRoles = [
            { roles: ["role_1"], name: "超级管理员" },
            { roles: ["role_2"], name: "管理员" },
            { roles: ["role_3"], name: "编辑" },
            { roles: ["role_4"], name: "作者" },
            { roles: ["role_5"], name: "普通用户" },
            { roles: ["role_6"], name: "审核员" },
            { roles: ["role_3", "role_6"], name: "编辑+审核员" },
            { roles: ["role_2", "role_3"], name: "管理员+编辑" },
        ];
        const roleAssignment = userRoles[Math.floor(Math.random() * userRoles.length)];
        const isActive = Math.random() > 0.1;

        return {
            id: `user_perm_${index + 1}`,
            userId: `user_${index + 1}`,
            username: `用户${index + 1}`,
            email: `user${index + 1}@example.com`,
            avatar: `https://picsum.photos/id/${index + 10}/100`,
            roles: roleAssignment.roles,
            permissions: roleAssignment.roles.flatMap(
                (roleId) => mockRoles.find((r) => r.id === roleId)?.permissions || [],
            ),
            status: isActive ? "active" : "inactive",
            lastLogin: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        };
    });

    // 加载数据
    useEffect(() => {
        setLoading(true);
        // 模拟API调用
        setTimeout(() => {
            setRoles(mockRoles);
            setUserPermissions(mockUserPermissions);

            // 计算统计数据
            const totalRoles = mockRoles.length;
            const totalUsers = mockUserPermissions.length;
            const activePermissions = mockPermissions.length;
            const systemRoles = mockRoles.filter((role) => role.isSystem).length;

            setStats({
                totalRoles,
                totalUsers,
                activePermissions,
                systemRoles,
            });

            setLoading(false);
        }, 1000);
    }, []);

    // 筛选数据
    const filteredRoles = useMemo(() => {
        return roles.filter((role) => {
            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                if (
                    !role.name.toLowerCase().includes(searchTerm) &&
                    !role.description.toLowerCase().includes(searchTerm)
                ) {
                    return false;
                }
            }
            if (filters.type && filters.type !== "all") {
                if (filters.type === "system" && !role.isSystem) return false;
                if (filters.type === "custom" && role.isSystem) return false;
            }
            return true;
        });
    }, [roles, filters]);

    const filteredUserPermissions = useMemo(() => {
        return userPermissions.filter((user) => {
            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                if (
                    !user.username.toLowerCase().includes(searchTerm) &&
                    !user.email.toLowerCase().includes(searchTerm)
                ) {
                    return false;
                }
            }
            if (filters.status && user.status !== filters.status) {
                return false;
            }
            return true;
        });
    }, [userPermissions, filters]);

    // 分页计算
    const currentData = activeTab === "roles" ? filteredRoles : filteredUserPermissions;
    const totalPages = Math.ceil(currentData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentRoles = useMemo(
        () => filteredRoles.slice(startIndex, endIndex),
        [filteredRoles, startIndex, endIndex],
    );

    const currentUserPermissions = useMemo(
        () => filteredUserPermissions.slice(startIndex, endIndex),
        [filteredUserPermissions, startIndex, endIndex],
    );

    // 重置页码
    useEffect(() => {
        setCurrentPage(1);
    }, [filters, activeTab]);

    // 筛选选项数据
    const typeOptions: SelectOption[] = [
        { id: "all", name: "全部类型", color: "#6c757d" },
        { id: "system", name: "系统角色", color: "#dc3545" },
        { id: "custom", name: "自定义角色", color: "#007bff" },
    ];

    const statusOptions: SelectOption[] = [
        { id: "", name: "全部状态", color: "#6c757d" },
        { id: "active", name: "活跃", color: "#28a745" },
        { id: "inactive", name: "非活跃", color: "#dc3545" },
    ];

    // 处理选择变化
    const handleSelectChange = (field: keyof FilterOptions) => {
        return (selectedOption: SelectOption | null) => {
            setFilters((prev) => ({
                ...prev,
                [field]: selectedOption?.id || "",
            }));
        };
    };

    // 处理搜索变化
    const handleFilterChange = (field: keyof FilterOptions, value: string) => {
        setFilters((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    // 清除筛选
    const clearFilters = () => {
        setFilters({
            search: "",
            type: "",
            status: "",
            module: "",
        });
    };

    // 删除角色
    const deleteRole = async (role: Role) => {
        if (role.isSystem) {
            alert("系统角色不能删除");
            return;
        }

        await confirm({
            title: "删除角色",
            content: (
                <div>
                    <p>
                        确定要删除角色 "<strong>{role.name}</strong>" 吗？
                    </p>
                    <p style={{ color: "var(--warning-color)" }}>删除角色后，所有使用该角色的用户将失去相应权限。</p>
                </div>
            ),
            confirmText: "确认删除",
            cancelText: "取消",
            onConfirm: async () => {
                setRoles((prev) => prev.filter((r) => r.id !== role.id));
            },
        });
    };

    // 切换用户状态
    const toggleUserStatus = (userPermission: UserPermission) => {
        const newStatus = userPermission.status === "active" ? "inactive" : "active";
        setUserPermissions((prev) =>
            prev.map((user) => (user.id === userPermission.id ? { ...user, status: newStatus } : user)),
        );
    };

    // 格式化日期
    const formatDate = (dateString: string) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
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
                if (start > 2) pages.push("...");
            }

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (end < totalPages) {
                if (end < totalPages - 1) pages.push("...");
                pages.push(totalPages);
            }
        }

        return pages;
    };

    // 获取角色名称
    const getRoleNames = (roleIds: string[]) => {
        return roleIds
            .map((roleId) => {
                const role = roles.find((r) => r.id === roleId);
                return role ? role.name : "未知角色";
            })
            .join(", ");
    };

    if (loading) {
        return (
            <div className={styles.permissionManagement}>
                <Loading text="加载权限数据中..." size="large" />
            </div>
        );
    }

    return (
        <div className={styles.permissionManagement}>
            {/* 页面头部 */}
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>权限管理</h1>
                    <p className={styles.pageDescription}>管理系统角色和权限，控制用户访问范围</p>
                </div>
                <div className={styles.headerActions}>
                    <button className={`${styles.btn} ${styles.btnPrimary}`}>
                        <FaPlus />
                        新增角色
                    </button>
                </div>
            </div>

            {/* 统计卡片 */}
            <div className={styles.statsContainer}>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.primary}`}>
                        <FaUserTag />
                    </div>
                    <div className={styles.statValue}>{stats.totalRoles}</div>
                    <div className={styles.statLabel}>总角色数</div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.success}`}>
                        <FaUsers />
                    </div>
                    <div className={styles.statValue}>{stats.totalUsers}</div>
                    <div className={styles.statLabel}>总用户数</div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.info}`}>
                        <FaKey />
                    </div>
                    <div className={styles.statValue}>{stats.activePermissions}</div>
                    <div className={styles.statLabel}>活跃权限</div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.warning}`}>
                        <FaShieldAlt />
                    </div>
                    <div className={styles.statValue}>{stats.systemRoles}</div>
                    <div className={styles.statLabel}>系统角色</div>
                </div>
            </div>

            {/* 标签页切换 */}
            <div className={styles.tabContainer}>
                <button
                    className={`${styles.tabButton} ${activeTab === "roles" ? styles.active : ""}`}
                    onClick={() => setActiveTab("roles")}
                >
                    <FaUserTag />
                    角色管理
                </button>
                <button
                    className={`${styles.tabButton} ${activeTab === "users" ? styles.active : ""}`}
                    onClick={() => setActiveTab("users")}
                >
                    <FaUsers />
                    用户权限
                </button>
            </div>

            {/* 筛选区域 */}
            <div className={styles.filterSection}>
                <div className={styles.filterHeader}>
                    <h3 className={styles.filterTitle}>
                        <FaFilter />
                        筛选条件
                    </h3>
                    <div className={styles.filterActions}>
                        <button className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`} onClick={clearFilters}>
                            清除筛选
                        </button>
                    </div>
                </div>
                <div className={styles.filterForm}>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>{activeTab === "roles" ? "搜索角色" : "搜索用户"}</label>
                        <Input
                            placeholder={activeTab === "roles" ? "角色名称或描述" : "用户名或邮箱"}
                            value={filters.search}
                            onChange={(value) => handleFilterChange("search", value)}
                            allowClear={true}
                            size="large"
                            style={{ minHeight: "46px", height: "50px" }}
                        />
                    </div>
                    {activeTab === "roles" && (
                        <div className={styles.filterGroup}>
                            <label className={styles.filterLabel}>角色类型</label>
                            <CustomSelect
                                name="角色类型"
                                options={typeOptions}
                                value={typeOptions.find((option) => option.id === filters.type) || null}
                                onChange={handleSelectChange("type")}
                                placeholder="选择类型..."
                                className="adminCustomSelect"
                                hideBadge={true}
                            />
                        </div>
                    )}
                    {activeTab === "users" && (
                        <div className={styles.filterGroup}>
                            <label className={styles.filterLabel}>用户状态</label>
                            <CustomSelect
                                name="用户状态"
                                options={statusOptions}
                                value={statusOptions.find((option) => option.id === filters.status) || null}
                                onChange={handleSelectChange("status")}
                                placeholder="选择状态..."
                                className="adminCustomSelect"
                                hideBadge={true}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* 数据表格 */}
            <div className={styles.tableContainer}>
                <div className={styles.tableHeader}>
                    <h3 className={styles.tableTitle}>{activeTab === "roles" ? "角色列表" : "用户权限列表"}</h3>
                    <div className={styles.tableActions}>
                        <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                            共 {currentData.length} 条记录
                        </span>
                    </div>
                </div>

                {activeTab === "roles" ? (
                    <table className={styles.rolesTable}>
                        <thead>
                            <tr>
                                <th>角色信息</th>
                                <th>权限数量</th>
                                <th>用户数量</th>
                                <th>创建时间</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentRoles.length > 0 ? (
                                currentRoles.map((role) => (
                                    <tr key={role.id}>
                                        <td>
                                            <div className={styles.roleInfo}>
                                                <div
                                                    className={styles.roleIcon}
                                                    style={{ backgroundColor: role.color }}
                                                >
                                                    {role.isSystem ? <FaShieldAlt /> : <FaUserTag />}
                                                </div>
                                                <div className={styles.roleDetails}>
                                                    <div className={styles.roleName}>
                                                        {role.name}
                                                        {role.isSystem && (
                                                            <span className={styles.systemTag}>
                                                                <FaLock /> 系统
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className={styles.roleCode}>{role.code}</div>
                                                    <div className={styles.roleDescription}>{role.description}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className={styles.permissionCount}>
                                                <FaKey /> {role.permissions.length}
                                            </div>
                                        </td>
                                        <td>
                                            <div className={styles.userCount}>
                                                <FaUsers /> {role.userCount}
                                            </div>
                                        </td>
                                        <td>{formatDate(role.createdAt)}</td>
                                        <td>
                                            <div className={styles.actionButtons}>
                                                <button
                                                    className={`${styles.actionButton} ${styles.edit}`}
                                                    title="编辑角色"
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    className={`${styles.actionButton} ${styles.edit}`}
                                                    title="查看权限"
                                                >
                                                    <FaEye />
                                                </button>
                                                {!role.isSystem && (
                                                    <button
                                                        className={`${styles.actionButton} ${styles.delete}`}
                                                        title="删除角色"
                                                        onClick={() => deleteRole(role)}
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={5}
                                        style={{
                                            textAlign: "center",
                                            padding: "40px",
                                            color: "var(--text-secondary)",
                                        }}
                                    >
                                        暂无数据
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                ) : (
                    <table className={styles.usersTable}>
                        <thead>
                            <tr>
                                <th>用户信息</th>
                                <th>角色</th>
                                <th>权限数量</th>
                                <th>状态</th>
                                <th>最后登录</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentUserPermissions.length > 0 ? (
                                currentUserPermissions.map((userPermission) => (
                                    <tr key={userPermission.id}>
                                        <td>
                                            <div className={styles.userInfo}>
                                                <img
                                                    src={userPermission.avatar}
                                                    alt={userPermission.username}
                                                    className={styles.userAvatar}
                                                />
                                                <div className={styles.userDetails}>
                                                    <div className={styles.userName}>{userPermission.username}</div>
                                                    <div className={styles.userEmail}>{userPermission.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className={styles.userRoles}>{getRoleNames(userPermission.roles)}</div>
                                        </td>
                                        <td>
                                            <div className={styles.permissionCount}>
                                                <FaKey /> {userPermission.permissions.length}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`${styles.statusBadge} ${styles[userPermission.status]}`}>
                                                <span className={styles.statusIndicator}></span>
                                                {userPermission.status === "active" ? "活跃" : "非活跃"}
                                            </span>
                                        </td>
                                        <td>{formatDate(userPermission.lastLogin)}</td>
                                        <td>
                                            <div className={styles.actionButtons}>
                                                <button
                                                    className={`${styles.actionButton} ${styles.edit}`}
                                                    title="编辑权限"
                                                >
                                                    <FaUserCog />
                                                </button>
                                                <button
                                                    className={`${styles.actionButton} ${styles[userPermission.status === "active" ? "unpublish" : "publish"]}`}
                                                    title={userPermission.status === "active" ? "禁用用户" : "启用用户"}
                                                    onClick={() => toggleUserStatus(userPermission)}
                                                >
                                                    {userPermission.status === "active" ? <FaLock /> : <FaUnlock />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={6}
                                        style={{
                                            textAlign: "center",
                                            padding: "40px",
                                            color: "var(--text-secondary)",
                                        }}
                                    >
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
                            显示 {startIndex + 1} - {Math.min(endIndex, currentData.length)} 条， 共{" "}
                            {currentData.length} 条记录
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
                                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                            >
                                <FaChevronLeft />
                            </button>

                            {getPageNumbers().map((page, index) => (
                                <React.Fragment key={index}>
                                    {page === "..." ? (
                                        <span className={styles.paginationEllipsis}>...</span>
                                    ) : (
                                        <button
                                            className={`${styles.paginationButton} ${currentPage === page ? styles.active : ""}`}
                                            onClick={() => setCurrentPage(page as number)}
                                        >
                                            {page}
                                        </button>
                                    )}
                                </React.Fragment>
                            ))}

                            <button
                                className={styles.paginationButton}
                                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
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
        </div>
    );
};

export default PermissionManagement;
