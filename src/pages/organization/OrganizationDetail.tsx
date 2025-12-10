import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    FaBuilding,
    FaCheckCircle,
    FaLock,
    FaUserFriends,
    FaArrowLeft,
    FaPlus,
    FaUser,
    FaCrown,
    FaUserShield,
    FaUserAlt,
    FaEye,
    FaCheck,
    FaTimes,
    FaSync,
    FaUserMinus,
    FaCog
} from 'react-icons/fa';
import Navbar from '../../components/navbar/Navbar';
import Footer from '../../components/footer/Footer';
import OrganizationDetailSkeleton from '../../components/organization/OrganizationDetailSkeleton';
import AuthRequired from '../../components/auth/AuthRequired';
import { useAuth } from '../../contexts/AuthContext';
import styles from './OrganizationDetail.module.css';
import OrganizationService from '../../services/organizationService';
import type { GetOrganizationDetailResponse, JoinOrganizationResponse } from '../../services/organizationService';
import message from '../../components/message/Message';
import { confirm } from '../../components/confirm/Confirm';

interface Member {
    id: string;
    user_id?: string;
    name: string;
    avatar?: string;
    role?: string;
    status?: 'active' | 'inactive';
    email?: string;
    joinTime?: string;
}

interface OrganizationDetail {
    id: string;
    name: string;
    type: string;
    status: 'active' | 'inactive';
    description?: string;
    memberCount: number;
    members: Member[];
    user_in_org?: string;
    user_role?: string;
}

interface MemberStats {
    totalMembers: number;
    activeMembers: number;
    leaderMembers: number;
    deputyMembers: number;
    regularMembers: number;
}

const MAP_STATUS_TO_TEXT: Record<number, string> = {
    0: "申请中",
    1: "已加入",
    2: "已拒绝",
    3: "已退出"
};

const MAP_ROLE_TO_TEXT: Record<number, string> = {
    1: "成员",
    2: "管理员",
    3: "会长"
};

const PAGE_SIZE = 15;

const OrganizationDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [org, setOrg] = useState<OrganizationDetail | null>(null);
    const [page, setPage] = useState(1);
    const [membersTotal, setMembersTotal] = useState(0);
    const [stats, setStats] = useState<MemberStats>({
        totalMembers: 0,
        activeMembers: 0,
        leaderMembers: 0,
        deputyMembers: 0,
        regularMembers: 0
    });
    const [userRole, setUserRole] = useState<'leader' | 'admin' | 'member' | 'guest' | null>(null);
    const [showPendingRequests, setShowPendingRequests] = useState(false);
    const [pendingRequests, setPendingRequests] = useState<Member[]>([]);
    const [pendingRequestsLoading, setPendingRequestsLoading] = useState(false);
    const [pendingRequestsPage, setPendingRequestsPage] = useState(1);
    const [pendingRequestsTotal, setPendingRequestsTotal] = useState(0);
    const [refreshTrigger, setRefreshTrigger] = useState(0); // 用于强制刷新的触发器
    const [isRefreshing, setIsRefreshing] = useState(false); // 刷新状态
    const [pendingRequestsRefreshTrigger, setPendingRequestsRefreshTrigger] = useState(0); // 用于强制刷新待处理请求的触发器

    // Determine if current user is admin/leader of the organization
    const checkUserRole = useCallback((role: string | undefined) => {
        if (!currentUser) return null;

        if (role === '会长') return 'leader';
        if (role === '管理员') return 'admin';
        if (role === '成员') return 'member';
        return 'guest';
    }, [currentUser]);

    // 获取组织详情
    useEffect(() => {
        const fetchDetail = async () => {
            if (!currentUser) return;
            setLoading(true);
            try {
                if (!id) throw new Error('无效的组织ID');
                const res: GetOrganizationDetailResponse = await OrganizationService.getOrganizationDetail({ id });
                // 只填充基础信息，不填充成员，不主动请求成员列表
                const orgDetail: OrganizationDetail = {
                    id: String(res.id),
                    name: res.name,
                    type: res.type,
                    status: res.status === 1 || res.status === 'active' ? 'active' : 'inactive',
                    description: res.description,
                    memberCount: 0,
                    members: [],
                    user_in_org: (typeof res.user_in_org !== 'undefined' && res.user_in_org >= 0 ? MAP_STATUS_TO_TEXT[res.user_in_org] : undefined),
                    user_role: (typeof res.user_role !== 'undefined' && res.user_role > 0 ? MAP_ROLE_TO_TEXT[res.user_role] : undefined)
                };
                setOrg(orgDetail);
                const role = checkUserRole(orgDetail.user_role);
                setUserRole(role);
            } catch (e) {
                message.error('获取组织详情失败');
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, currentUser, checkUserRole]);

    // Function to fetch organization members using the new API (真正分页)
    const fetchMembersList = useCallback(async (pageNum: number = 1) => {
        if (!currentUser || !id) return;
        // 设置刷新状态
        setIsRefreshing(true);

        try {
            const res = await OrganizationService.getOrganizationUserLists({
                id: id,
                page_num: pageNum,
                page_size: PAGE_SIZE,
                status: 1 // status 1 means approved/active members
            });
            if (res && res.list) {
                const members: Member[] = res.list.map(item => ({
                    id: String(item.id),
                    name: item.name,
                    avatar: item.avatar,
                    role: MAP_ROLE_TO_TEXT[item.role],
                    status: 'active',
                    email: item.email,
                    joinTime: new Date(item.join_time * 1000).toISOString().split('T')[0]
                }));

                setMembersTotal(res.total || 0);
                setStats({
                    totalMembers: res.total || 0,
                    activeMembers: members.length,
                    leaderMembers: members.filter(m => m.role === '会长').length,
                    deputyMembers: members.filter(m => m.role === '管理员').length,
                    regularMembers: members.filter(m => m.role === '成员').length
                });

                setOrg(prevOrg => prevOrg ? { ...prevOrg, members, memberCount: res.total || 0 } : prevOrg);
            } else {
                // 如果没有响应数据，仍然更新状态为0
                setMembersTotal(0);
                setStats({
                    totalMembers: 0,
                    activeMembers: 0,
                    leaderMembers: 0,
                    deputyMembers: 0,
                    regularMembers: 0
                });

                setOrg(prevOrg => prevOrg ? { ...prevOrg, members: [], memberCount: 0 } : prevOrg);
            }
        } catch (error) {
            console.error('获取组织成员列表失败:', error);
            message.error('获取成员列表失败');

            // 在错误情况下也需要更新状态
            setMembersTotal(0);
            setStats({
                totalMembers: 0,
                activeMembers: 0,
                leaderMembers: 0,
                deputyMembers: 0,
                regularMembers: 0
            });

            setOrg(prevOrg => prevOrg ? { ...prevOrg, members: [], memberCount: 0 } : prevOrg);
        } finally {
            // 确保在完成请求后重置刷新状态
            setIsRefreshing(false);
        }
    }, [id, currentUser]);

    // 成员列表分页请求，依赖 id、page、currentUser、org 的基本属性（不包括 members）、refreshTrigger、showPendingRequests、pendingRequestsPage、pendingRequestsRefreshTrigger
    useEffect(() => {
        if (!id || !currentUser) return;

        if (!showPendingRequests) {
            // 显示成员列表时，获取成员数据（所有用户都可以看到成员列表）
            fetchMembersList(page);
        } else {
            // 显示待处理请求时，获取待处理请求数据
            const role = org?.user_role;
            if ((role === '管理员' || role === '会长')) {
                fetchPendingRequests(pendingRequestsPage);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, currentUser, org?.id, page, refreshTrigger, showPendingRequests, pendingRequestsPage, pendingRequestsRefreshTrigger]);

    // Function to fetch pending join requests if user is an admin/leader (真正分页)
    const fetchPendingRequests = async (pageNum: number = 1) => {
        if (!currentUser || !id || !userRole || (userRole !== 'leader' && userRole !== 'admin')) return;
        setPendingRequestsLoading(true);
        try {
            const pendingRes = await OrganizationService.getOrganizationUserLists({
                id: id,
                page_num: pageNum,
                page_size: PAGE_SIZE,
                status: 0
            });
            const pendingRequests: (Member & { user_id: string })[] = (pendingRes.list || []).map(item => ({
                id: String(item.id),
                name: item.name,
                avatar: item.avatar,
                role: 'pending',
                status: 'active',
                email: item.email,
                joinTime: new Date(item.join_time * 1000).toISOString().split('T')[0],
                user_id: String(item.user_id)
            }));
            setPendingRequestsTotal(pendingRes.total || pendingRequests.length);
            setPendingRequests(pendingRequests);
        } catch (err) {
            console.error('获取待处理请求失败:', err);
            message.error('获取待处理请求失败');
        } finally {
            setPendingRequestsLoading(false);
        }
    };

    // Function to handle accept/reject a pending request
    const handleActionPendingRequest = async (requestId: string, action: 'accept' | 'reject') => {
        const ok = await confirm({
            title: action === 'accept' ? '确认接受' : '确认拒绝',
            content: action === 'accept' ? '确定要接受该用户加入组织吗？' : '确定要拒绝该用户加入组织吗？',
            confirmText: action === 'accept' ? '接受' : '拒绝',
            cancelText: '取消',
        });
        if (!ok) return;

        try {
            // 审核接口 state: 1=同意, 2=拒绝
            const state = action === 'accept' ? 1 : 2;
            // 查找 user_id
            const pending = pendingRequests.find(req => req.id === requestId);
            if (!pending) throw new Error('未找到待处理用户');
            await OrganizationService.organizationJoinCheck({
                user_id: String(pending.user_id ?? ''),
                org_id: id!,
                state
            });
            // Update local state to remove the request
            setPendingRequests(prev => prev.filter(req => req.id !== requestId));

            if (action === 'accept') {
                message.success('已接受用户加入组织');
            } else {
                message.success('已拒绝用户加入组织');
            }
            // 审核后刷新待处理请求列表
            setPendingRequestsRefreshTrigger(prev => prev + 1);
            // 如果接受请求，同时更新组织详情以获取最新的成员计数
            if (action === 'accept' && id && currentUser) {
                const res: GetOrganizationDetailResponse = await OrganizationService.getOrganizationDetail({ id: id! });
                setOrg(prevOrg => prevOrg ? {
                    ...prevOrg,
                    user_in_org: (typeof res.user_in_org !== 'undefined' && res.user_in_org >= 0 ? MAP_STATUS_TO_TEXT[res.user_in_org] : undefined),
                    user_role: (typeof res.user_role !== 'undefined' && res.user_role > 0 ? MAP_ROLE_TO_TEXT[res.user_role] : undefined)
                } : prevOrg);
            }
        } catch (err) {
            console.error(action === 'accept' ? '接受请求失败' : '拒绝请求失败:', err);
            message.error(action === 'accept' ? '接受请求失败' : '拒绝请求失败');
        }
    };

    // Function to handle kicking a member
    const handleKickMember = async (member: Member) => {
        const ok = await confirm({
            title: '确认踢出',
            content: `确定要将 ${member.name} 踢出组织吗？`,
            confirmText: '踢出',
            cancelText: '取消',
        });
        if (!ok) return;

        try {
            await OrganizationService.kickOrganizationMember({
                user_id: member.user_id || member.id,
                org_id: id!
            });

            // Remove member from local state
            setOrg(prevOrg => prevOrg ? {
                ...prevOrg,
                members: prevOrg.members.filter(m => m.id !== member.id),
                memberCount: Math.max(0, prevOrg.memberCount - 1)
            } : prevOrg);

            // Update stats
            setStats(prevStats => ({
                ...prevStats,
                totalMembers: Math.max(0, prevStats.totalMembers - 1),
                activeMembers: Math.max(0, prevStats.activeMembers - 1),
                leaderMembers: member.role === '会长' ? Math.max(0, prevStats.leaderMembers - 1) : prevStats.leaderMembers,
                deputyMembers: member.role === '管理员' ? Math.max(0, prevStats.deputyMembers - 1) : prevStats.deputyMembers,
                regularMembers: member.role === '成员' ? Math.max(0, prevStats.regularMembers - 1) : prevStats.regularMembers
            }));

            message.success(`已将 ${member.name} 踢出组织`);
        } catch (err) {
            console.error('踢出成员失败:', err);
            message.error('踢出成员失败');
        }
    };

    // Function to handle setting member role
    const handleSetMemberRole = async (member: Member) => {
        const roleOptions = [
            { value: 1, label: '成员' },
            { value: 2, label: '管理员' },
            { value: 3, label: '会长' }
        ];

        const currentRole = roleOptions.find(r => r.label === member.role)?.value || 1;

        // 创建一个简单的角色选择界面
        const roleSelection = document.createElement('div');
        roleSelection.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            z-index: 1000;
            min-width: 300px;
        `;

        roleSelection.innerHTML = `
            <h3 style="margin: 0 0 15px 0; color: #333;">设置 ${member.name} 的角色</h3>
            <div style="margin-bottom: 15px;">
                ${roleOptions.map((role) => `
                    <label style="display: block; margin-bottom: 8px; cursor: pointer;">
                        <input type="radio" name="role" value="${role.value}" ${role.value === currentRole ? 'checked' : ''} />
                        ${role.label}
                    </label>
                `).join('')}
            </div>
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button id="cancelRole" style="padding: 8px 16px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">取消</button>
                <button id="confirmRole" style="padding: 8px 16px; border: none; background: #007bff; color: white; border-radius: 4px; cursor: pointer;">确认</button>
            </div>
        `;

        // 添加遮罩层
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 999;
        `;

        document.body.appendChild(overlay);
        document.body.appendChild(roleSelection);

        return new Promise<void>((resolve) => {
            const cancelBtn = document.getElementById('cancelRole') as HTMLButtonElement;
            const confirmBtn = document.getElementById('confirmRole') as HTMLButtonElement;

            const cleanup = () => {
                document.body.removeChild(overlay);
                document.body.removeChild(roleSelection);
                resolve();
            };

            cancelBtn.onclick = cleanup;

            confirmBtn.onclick = async () => {
                const selectedInput = roleSelection.querySelector('input[name="role"]:checked') as HTMLInputElement;
                if (!selectedInput) {
                    message.error('请选择一个角色');
                    return;
                }

                const newRoleValue = parseInt(selectedInput.value);
                if (newRoleValue === currentRole) {
                    message.warn('该用户已经是这个角色');
                    cleanup();
                    return;
                }

                try {
                    await OrganizationService.setOrganizationMemberRole({
                        user_id: member.user_id || member.id,
                        org_id: id!,
                        role: newRoleValue
                    });

                    // Update member role in local state
                    setOrg(prevOrg => prevOrg ? {
                        ...prevOrg,
                        members: prevOrg.members.map(m =>
                            m.id === member.id ? { ...m, role: MAP_ROLE_TO_TEXT[newRoleValue] } : m
                        )
                    } : prevOrg);

                    // Update stats
                    const oldRoleLabel = member.role;
                    const newRoleLabel = MAP_ROLE_TO_TEXT[newRoleValue];

                    setStats(prevStats => {
                        const newStats = { ...prevStats };

                        // Decrease old role count
                        if (oldRoleLabel === '会长') newStats.leaderMembers = Math.max(0, newStats.leaderMembers - 1);
                        else if (oldRoleLabel === '管理员') newStats.deputyMembers = Math.max(0, newStats.deputyMembers - 1);
                        else if (oldRoleLabel === '成员') newStats.regularMembers = Math.max(0, newStats.regularMembers - 1);

                        // Increase new role count
                        if (newRoleLabel === '会长') newStats.leaderMembers += 1;
                        else if (newRoleLabel === '管理员') newStats.deputyMembers += 1;
                        else if (newRoleLabel === '成员') newStats.regularMembers += 1;

                        return newStats;
                    });

                    message.success(`已将 ${member.name} 的角色设置为 ${newRoleLabel}`);
                } catch (err) {
                    console.error('设置角色失败:', err);
                    message.error('设置角色失败');
                }

                cleanup();
            };

            overlay.onclick = cleanup;
        });
    };

    // Function to check if current user can manage a specific member
    const canManageMember = (member: Member) => {
        if (!userRole || userRole === 'guest' || userRole === 'member') return false;

        // 管理员不能管理会长和其他管理员
        if (userRole === 'admin') {
            if (member.role === '会长') return false;
            if (member.role === '管理员' && member.name !== currentUser?.name) return false;
        }

        // 会长不能踢自己
        if (userRole === 'leader' && member.name === currentUser?.name) return false;

        return true;
    };

    const handleJoin = async () => {
        if (!currentUser) {
            message.warn('请先登录后再申请加入组织');
            return;
        }

        if (org?.status !== 'active') {
            message.warn('该组织已停用，无法申请加入');
            return;
        }
        const ok = await confirm({
            title: '申请加入组织',
            content: '确定要申请加入该组织吗？',
            confirmText: '确认加入',
            cancelText: '取消',
        });
        if (!ok) return;
        try {
            // The join API returns updated organization information
            const joinRes: JoinOrganizationResponse = await OrganizationService.joinOrganization({ id: id! });

            // Use the response directly to update the organization status
            const orgDetail: OrganizationDetail = {
                id: String(joinRes.id),
                name: joinRes.name,
                type: joinRes.type,
                status: joinRes.status === 1 || joinRes.status === 'active' ? 'active' : 'inactive',
                description: joinRes.description,
                memberCount: 0, // Initialize to 0, since members aren't returned in the join response
                members: [], // Use mock data temporarily
                user_in_org: (typeof joinRes.user_in_org !== 'undefined' && joinRes.user_in_org >= 0 ? MAP_STATUS_TO_TEXT[joinRes.user_in_org] : undefined)
            };
            setOrg(orgDetail);
            message.success('已申请加入组织');
        } catch (e) {
            message.error('申请加入失败');
            // If the join failed, refresh the organization data to ensure consistency
            if (org && currentUser) {  // 添加 currentUser 检查
                const res: GetOrganizationDetailResponse = await OrganizationService.getOrganizationDetail({ id: id! });
                const orgDetail: OrganizationDetail = {
                    id: String(res.id),
                    name: res.name,
                    type: res.type,
                    status: res.status === 1 || res.status === 'active' ? 'active' : 'inactive',
                    description: res.description,
                    memberCount: Array.isArray((res as any).members) ? (res as any).members.length : 0,
                    members: Array.isArray((res as any).members) ? (res as any).members : [],
                    user_in_org: res.user_in_org ? MAP_STATUS_TO_TEXT[res.user_in_org] : undefined
                };
                setOrg(orgDetail);
            }
        }
    };


    return (
        <div className={styles.container}>
            <Navbar />
            <div className={styles.mainContent}>
                <AuthRequired message="您需要登录后才能查看组织详情。">
                    {(loading || !org) ? <OrganizationDetailSkeleton /> : (
                        <div className={styles.detailCard}>
                            {org && (
                                <>
                                    <div className={styles.cardHeader}>
                                        <button className={styles.backBtn} onClick={() => navigate(-1)}><FaArrowLeft /> 返回</button>
                                        <div className={styles.headerContent}>
                                            <div className={styles.titleGroup}>
                                                <h1 className={styles.pageTitle}><FaBuilding /> {org.name}</h1>
                                                <span className={styles.orgType}>{org.type}</span>
                                            </div>
                                            <div className={styles.headerRight}>
                                                <span className={org.status === 'active' ? styles.statusActive : styles.statusInactive}>
                                                    {org.status === 'active' ? <FaCheckCircle /> : <FaLock />} {org.status === 'active' ? '正常' : '停用'}
                                                </span>
                                                {org.user_in_org ? (
                                                    <span className={styles.joined}>{org.user_in_org}</span>
                                                ) : (
                                                    <button
                                                        className={styles.joinBtn}
                                                        onClick={handleJoin}
                                                        disabled={org.status !== 'active'}
                                                        title={org.status !== 'active' ? '该组织已停用，无法加入' : ''}
                                                    >
                                                        <FaPlus /> 申请加入
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={styles.description}>{org.description}</div>

                                    {/* 统计卡片 */}
                                    <div className={styles.statsContainer}>
                                        <div className={styles.statCard}>
                                            <div className={`${styles.statIcon} ${styles.primary}`}>
                                                <FaUserFriends />
                                            </div>
                                            <div className={styles.statValue}>{stats.totalMembers}</div>
                                            <div className={styles.statLabel}>总成员数</div>
                                        </div>
                                        <div className={styles.statCard}>
                                            <div className={`${styles.statIcon} ${styles.success}`}>
                                                <FaCheckCircle />
                                            </div>
                                            <div className={styles.statValue}>{stats.activeMembers}</div>
                                            <div className={styles.statLabel}>活跃成员</div>
                                        </div>
                                        <div className={styles.statCard}>
                                            <div className={`${styles.statIcon} ${styles.warning}`}>
                                                <FaUser />
                                            </div>
                                            <div className={styles.statValue}>{stats.leaderMembers}</div>
                                            <div className={styles.statLabel}>负责人</div>
                                        </div>
                                        <div className={styles.statCard}>
                                            <div className={`${styles.statIcon} ${styles.error}`}>
                                                <FaUserAlt />
                                            </div>
                                            <div className={styles.statValue}>{stats.regularMembers}</div>
                                            <div className={styles.statLabel}>普通成员</div>
                                        </div>
                                    </div>

                                    {/* 成员表格和管理员请求处理 */}
                                    <div className={styles.tableContainer}>
                                        {/* Tab切换按钮 */}
                                        {userRole === 'leader' || userRole === 'admin' ? (
                                            <div className={styles.tabsHeader}>
                                                <button
                                                    className={`${styles.tabButton} ${!showPendingRequests ? styles.activeTab : ''}`}
                                                    onClick={() => setShowPendingRequests(false)}
                                                >
                                                    成员列表
                                                </button>
                                                    <button
                                                        className={`${styles.tabButton} ${showPendingRequests ? styles.activeTab : ''}`}
                                                        onClick={() => setShowPendingRequests(true)}
                                                >
                                                    待处理请求
                                                </button>
                                            </div>
                                        ) : null}

                                        {/* 成员列表视图 */}
                                        {!showPendingRequests && (
                                            <>
                                                {! (userRole === 'leader' || userRole === 'admin') ? (
                                                    <div className={styles.tableHeader}>
                                                        <h3 className={styles.tableTitle}>成员列表</h3>
                                                        <div className={styles.tableActions}>
                                                            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                                                                共 {stats.totalMembers} 个成员
                                                            </span>
                                                            <button
                                                                className={`${styles.refreshButton} ${isRefreshing ? styles.loading : ''}`}
                                                                title="刷新成员列表"
                                                                onClick={() => setRefreshTrigger(prev => prev + 1)}
                                                                disabled={isRefreshing}
                                                                style={{ marginLeft: '8px' }}
                                                            >
                                                                <FaSync />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : null}
                                                <table className={styles.usersTable}>
                                                    <thead>
                                                        <tr>
                                                            <th>用户信息</th>
                                                            <th>角色</th>
                                                            <th>状态</th>
                                                            <th>加入时间</th>
                                                            <th>操作</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {org?.members && org.members.length > 0 ? (
                                                            org.members.map(member => (
                                                                <tr key={member.id} className={styles.tableRow}>
                                                                    <td>
                                                                        <div className={styles.userInfo}>
                                                                            <img
                                                                                src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random`}
                                                                                alt={member.name}
                                                                                className={styles.userAvatar}
                                                                            />
                                                                            <div className={styles.userDetails}>
                                                                                <div className={styles.userName}>{member.name}</div>
                                                                                {member.email && <div className={styles.userEmail}>{member.email}</div>}
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td>
                                                                        <span className={`${styles.roleBadge} ${member.role === '会长' ? styles.admin : member.role === '管理员' ? styles.moderator : styles.user}`}>
                                                                            {member.role === '会长' && <FaCrown style={{ color: '#f7b500', marginRight: 4 }} />}
                                                                            {member.role === '管理员' && <FaUserShield style={{ color: '#4caf50', marginRight: 4 }} />}
                                                                            {member.role === '成员' && <FaUser style={{ color: '#2196f3', marginRight: 4 }} />}
                                                                            {member.role || '成员'}
                                                                        </span>
                                                                    </td>
                                                                    <td>
                                                                        <span className={`${styles.statusBadge} ${member.status === 'active' ? styles.active : styles.inactive}`}>
                                                                            <span className={styles.statusIndicator}></span>
                                                                            {member.status === 'active' ? '活跃' : '非活跃'}
                                                                        </span>
                                                                    </td>
                                                                    <td>{member.joinTime || '-'}</td>
                                                                    <td>
                                                                        <div className={styles.actionButtons}>
                                                                            <button className={styles.actionButton} title="查看详情">
                                                                                <FaEye />
                                                                            </button>
                                                                            {canManageMember(member) && (
                                                                                <>
                                                                                    <button
                                                                                        className={`${styles.actionButton} ${styles.kickButton}`}
                                                                                        title="踢出组织"
                                                                                        onClick={() => handleKickMember(member)}
                                                                                    >
                                                                                        <FaUserMinus />
                                                                                    </button>
                                                                                    <button
                                                                                        className={`${styles.actionButton} ${styles.roleButton}`}
                                                                                        title="设置角色"
                                                                                        onClick={() => handleSetMemberRole(member)}
                                                                                    >
                                                                                        <FaCog />
                                                                                    </button>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                                                                    暂无成员
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                                {/* 分页区块 */}
                                                {membersTotal > 0 && (
                                                    <div className={styles.pagination}>
                                                        <div className={styles.paginationInfo}>
                                                            显示 {(page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, membersTotal)} 条，
                                                            共 {membersTotal} 条记录
                                                        </div>
                                                        <div className={styles.paginationControls}>
                                                            <button
                                                                className={styles.paginationButton}
                                                                disabled={page === 1}
                                                                onClick={() => setPage(page - 1)}
                                                            >
                                                                上一页
                                                            </button>
                                                            {Array.from({ length: Math.ceil(membersTotal / PAGE_SIZE) }, (_, i) => (
                                                                <button
                                                                    key={i + 1}
                                                                    className={`${styles.paginationButton} ${page === i + 1 ? styles.active : ''}`}
                                                                    onClick={() => setPage(i + 1)}
                                                                >
                                                                    {i + 1}
                                                                </button>
                                                            ))}
                                                            <button
                                                                className={styles.paginationButton}
                                                                disabled={page === Math.ceil(membersTotal / PAGE_SIZE)}
                                                                onClick={() => setPage(page + 1)}
                                                            >
                                                                下一页
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {/* 待处理请求视图 - 仅对管理员/会长显示 */}
                                        {showPendingRequests && (userRole === 'leader' || userRole === 'admin') && (
                                            <>
                                                {userRole === 'leader' || userRole === 'admin' ? (
                                                    <div className={styles.tableHeader}>
                                                        <h3 className={styles.tableTitle}>待处理请求</h3>
                                                        <div className={styles.tableActions}>
                                                            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                                                                共 {pendingRequests.length} 个请求
                                                            </span>
                                                            <button
                                                                className={`${styles.refreshButton} ${pendingRequestsLoading ? styles.loading : ''}`}
                                                                title="刷新待处理请求"
                                                                onClick={() => setPendingRequestsRefreshTrigger(prev => prev + 1)}
                                                                disabled={pendingRequestsLoading}
                                                                style={{ marginLeft: '8px' }}
                                                            >
                                                                <FaSync />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : null}
                                                {pendingRequestsLoading ? (
                                                    <div style={{ padding: '20px', textAlign: 'center' }}>
                                                        <p>正在加载待处理请求...</p>
                                                    </div>
                                                ) : (
                                                    <table className={styles.usersTable}>
                                                        <thead>
                                                            <tr>
                                                                <th>用户信息</th>
                                                                <th>申请时间</th>
                                                                <th>操作</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {pendingRequests.length > 0 ? (
                                                                pendingRequests.map(request => (
                                                                        <tr key={request.id} className={styles.tableRow}>
                                                                            <td>
                                                                                <div className={styles.userInfo}>
                                                                                    <img
                                                                                        src={request.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(request.name)}&background=random`}
                                                                                        alt={request.name}
                                                                                        className={styles.userAvatar}
                                                                                    />
                                                                                    <div className={styles.userDetails}>
                                                                                        <div className={styles.userName}>{request.name}</div>
                                                                                        {request.email && <div className={styles.userEmail}>{request.email}</div>}
                                                                                    </div>
                                                                                </div>
                                                                            </td>
                                                                            <td>{request.joinTime || '-'}</td>
                                                                            <td>
                                                                                <div className={styles.actionButtons}>
                                                                                    <button
                                                                                        className={`${styles.actionButton} ${styles.acceptButton}`}
                                                                                        title="接受"
                                                                                        onClick={() => handleActionPendingRequest(request.id, 'accept')}
                                                                                    >
                                                                                        <FaCheck />
                                                                                    </button>
                                                                                    <button
                                                                                        className={`${styles.actionButton} ${styles.rejectButton}`}
                                                                                        title="拒绝"
                                                                                        onClick={() => handleActionPendingRequest(request.id, 'reject')}
                                                                                    >
                                                                                        <FaTimes />
                                                                                    </button>
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    ))
                                                            ) : (
                                                                <tr>
                                                                    <td colSpan={3} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                                                                        暂无待处理请求
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                )}
                                                {/* 分页区块 - 待处理请求 */}
                                                {pendingRequestsTotal > 0 && (
                                                    <div className={styles.pagination}>
                                                        <div className={styles.paginationInfo}>
                                                            显示 {(pendingRequestsPage - 1) * PAGE_SIZE + 1} - {Math.min(pendingRequestsPage * PAGE_SIZE, pendingRequestsTotal)} 条，
                                                            共 {pendingRequestsTotal} 条记录
                                                        </div>
                                                        <div className={styles.paginationControls}>
                                                            <button
                                                                className={styles.paginationButton}
                                                                disabled={pendingRequestsPage === 1}
                                                                onClick={() => setPendingRequestsPage(pendingRequestsPage - 1)}
                                                            >
                                                                上一页
                                                            </button>
                                                            {Array.from({ length: Math.ceil(pendingRequestsTotal / PAGE_SIZE) }, (_, i) => (
                                                                <button
                                                                    key={i + 1}
                                                                    className={`${styles.paginationButton} ${pendingRequestsPage === i + 1 ? styles.active : ''}`}
                                                                    onClick={() => setPendingRequestsPage(i + 1)}
                                                                >
                                                                    {i + 1}
                                                                </button>
                                                            ))}
                                                            <button
                                                                className={styles.paginationButton}
                                                                disabled={pendingRequestsPage === Math.ceil(pendingRequestsTotal / PAGE_SIZE)}
                                                                onClick={() => setPendingRequestsPage(pendingRequestsPage + 1)}
                                                            >
                                                                下一页
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                    {/* 申请加入按钮已移至header最右侧 */}
                                </>
                            )}
                        </div>
                    )}
                </AuthRequired>
            </div>
            <Footer companyName="TechBlog" startYear={2025} />
        </div>
    );
};

export default OrganizationDetail;
