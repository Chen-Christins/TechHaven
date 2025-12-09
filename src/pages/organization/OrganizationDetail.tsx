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
    FaTimes
} from 'react-icons/fa';
import Navbar from '../../components/navbar/Navbar';
import Footer from '../../components/footer/Footer';
import OrganizationDetailSkeleton from '../../components/organization/OrganizationDetailSkeleton';
import AuthRequired from '../../components/auth/AuthRequired';
import { useAuth } from '../../contexts/AuthContext';
import styles from './OrganizationDetail.module.css';
import OrganizationService from '../../services/organizationService';
import type { GetOrganizationDetailResponse } from '../../services/organizationService';
import message from '../../components/message/Message';
import { confirm } from '../../components/confirm/Confirm';

interface Member {
    id: string;
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
}

interface MemberStats {
    totalMembers: number;
    activeMembers: number;
    leaderMembers: number;
    deputyMembers: number;
    regularMembers: number;
}

const PAGE_SIZE = 10;

const OrganizationDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [org, setOrg] = useState<OrganizationDetail | null>(null);
    const [joined, setJoined] = useState(false);
    const [page, setPage] = useState(1);
    const [stats, setStats] = useState<MemberStats>({
        totalMembers: 0,
        activeMembers: 0,
        leaderMembers: 0,
        deputyMembers: 0,
        regularMembers: 0
    });
    const [userRole, setUserRole] = useState<'leader' | 'admin' | 'member' | null>(null);
    const [showPendingRequests, setShowPendingRequests] = useState(false);
    const [pendingRequests, setPendingRequests] = useState<Member[]>([]);
    const [pendingRequestsLoading, setPendingRequestsLoading] = useState(false);
    const [pendingRequestsPage, setPendingRequestsPage] = useState(1);

    // Determine if current user is admin/leader of the organization
    const checkUserRole = useCallback((orgMembers: Member[] | undefined) => {
        if (!orgMembers || !currentUser) return null;

        const userMember = orgMembers.find(member => member.id === String(currentUser.id));
        if (!userMember) return null;

        if (userMember.role === '会长') return 'leader';
        if (userMember.role === '管理员') return 'admin';
        return 'member';
    }, [currentUser]);

    const mockUsers: Member[] = [
        { id: '1', name: '张三', role: '会长', status: 'active', joinTime: '2023-01-01', email: 'zhangsan@example.com' },
        { id: '2', name: '李四', role: '管理员', status: 'active', joinTime: '2023-02-01', email: 'lisi@example.com' },
        { id: '3', name: '王五', role: '成员', status: 'inactive', joinTime: '2023-03-01', email: 'wangwu@example.com' },
        { id: '4', name: '赵六', role: '成员', status: 'active', joinTime: '2023-04-01', email: 'zhaoliu@example.com' }
    ];

    useEffect(() => {
        const fetchDetail = async () => {
            setLoading(true);
            try {
                if (!id) throw new Error('无效的组织ID');
                const res: GetOrganizationDetailResponse = await OrganizationService.getOrganizationDetail({ id });
                // 兼容后端返回字段
                const orgDetail: OrganizationDetail = {
                    id: String(res.id),
                    name: res.name,
                    type: res.type,
                    status: res.status === 1 || res.status === 'active' ? 'active' : 'inactive',
                    description: res.description,
                    memberCount: Array.isArray((res as any).members) ? (res as any).members.length : 0,
                    members: Array.isArray((res as any).members) ? (res as any).members : mockUsers,
                };
                setOrg(orgDetail);
                // 统计信息
                const totalMembers = orgDetail.members.length;
                const activeMembers = orgDetail.members.filter(member => member.status === 'active').length;
                const leaderMembers = orgDetail.members.filter(member => member.role === '会长').length;
                const deputyMembers = orgDetail.members.filter(member => member.role === '管理员').length;
                const regularMembers = orgDetail.members.filter(member => member.role === '成员').length;
                setStats({ totalMembers, activeMembers, leaderMembers, deputyMembers, regularMembers });

                // Check user role in organization
                const role = checkUserRole(orgDetail.members);
                setUserRole(role);

                setJoined(false); // TODO: 可根据接口返回判断是否已加入
            } catch (e) {
                message.error('获取组织详情失败');
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id, currentUser, checkUserRole]);

    // Function to fetch pending join requests if user is an admin/leader
    const fetchPendingRequests = async () => {
        if (!id || !userRole || (userRole !== 'leader' && userRole !== 'admin')) return;

        setPendingRequestsLoading(true);
        try {
            // TODO: Replace with actual API call to fetch pending join requests
            // const pendingRes = await OrganizationService.getPendingRequests({ orgId: id });
            // For now, use mock data
            const mockPendingRequests: Member[] = [
                { id: '101', name: '钱七', avatar: '', role: 'pending', status: 'active', joinTime: '2025-01-10', email: 'qianqi@example.com' },
                { id: '102', name: '孙八', avatar: '', role: 'pending', status: 'active', joinTime: '2025-01-11', email: 'sunba@example.com' },
            ];
            setPendingRequests(mockPendingRequests);
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
            // TODO: Replace with actual API call to accept/reject request
            // await OrganizationService[action === 'accept' ? 'acceptJoinRequest' : 'rejectJoinRequest']({
            //     orgId: id,
            //     userId: requestId
            // });

            // Update local state to remove the request
            setPendingRequests(prev => prev.filter(req => req.id !== requestId));

            if (action === 'accept') {
                message.success('已接受用户加入组织');
            } else {
                message.success('已拒绝用户加入组织');
            }
        } catch (err) {
            console.error(action === 'accept' ? '接受请求失败' : '拒绝请求失败:', err);
            message.error(action === 'accept' ? '接受请求失败' : '拒绝请求失败');
        }
    };

    const handleJoin = async () => {
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
            // await OrganizationService.joinOrganization(id);
            setJoined(true);
            message.success('已申请加入组织');
        } catch (e) {
            message.error('申请加入失败');
        }
    };

    // 当用户切换到待处理请求标签时获取数据
    useEffect(() => {
        if (showPendingRequests && (userRole === 'leader' || userRole === 'admin')) {
            fetchPendingRequests();
        }
    }, [showPendingRequests, userRole]); // 在 showPendingRequests 或 userRole 变化时触发

    return (
        <div className={styles.container}>
            <Navbar />
            <div className={styles.mainContent}>
                <AuthRequired message="您需要登录后才能查看组织详情。">
                    {loading || !org ? (
                        <OrganizationDetailSkeleton />
                    ) : (
                        <div className={styles.detailCard}>
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
                                        {!joined && (
                                            <button
                                                className={styles.joinBtn}
                                                onClick={handleJoin}
                                                disabled={org.status !== 'active'}
                                                title={org.status !== 'active' ? '该组织已停用，无法加入' : ''}
                                            >
                                                <FaPlus /> 申请加入
                                            </button>
                                        )}
                                        {joined && (
                                            <span className={styles.joined}>已申请加入</span>
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
                                <div className={styles.tabsHeader}>
                                    <button
                                        className={`${styles.tabButton} ${!showPendingRequests ? styles.activeTab : ''}`}
                                        onClick={() => setShowPendingRequests(false)}
                                    >
                                        成员列表
                                    </button>
                                    {userRole === 'leader' || userRole === 'admin' ? (
                                        <button
                                            className={`${styles.tabButton} ${showPendingRequests ? styles.activeTab : ''}`}
                                            onClick={() => setShowPendingRequests(true)}
                                        >
                                            待处理请求
                                        </button>
                                    ) : null}
                                </div>

                                {/* 成员列表视图 */}
                                {!showPendingRequests && (
                                    <>
                                        <div className={styles.tableHeader}>
                                            <h3 className={styles.tableTitle}>成员列表</h3>
                                            <div className={styles.tableActions}>
                                                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                                                    共 {stats.totalMembers} 个成员
                                                </span>
                                            </div>
                                        </div>
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
                                                    org.members.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(member => (
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
                                        {org?.members && org.members.length > 0 && (
                                            <div className={styles.pagination}>
                                                <div className={styles.paginationInfo}>
                                                    显示 {(page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, org.members.length)} 条，
                                                    共 {org.members.length} 条记录
                                                </div>
                                                <div className={styles.paginationControls}>
                                                    <button
                                                        className={styles.paginationButton}
                                                        disabled={page === 1 || org.members.length <= PAGE_SIZE}
                                                        onClick={() => setPage(page - 1)}
                                                    >
                                                        上一页
                                                    </button>
                                                    <button
                                                        className={`${styles.paginationButton} ${page === 1 ? styles.active : ''}`}
                                                        disabled={org.members.length <= PAGE_SIZE}
                                                        onClick={() => setPage(1)}
                                                    >
                                                        1
                                                    </button>
                                                    {Math.ceil(org.members.length / PAGE_SIZE) > 1 && (
                                                        <button
                                                            className={`${styles.paginationButton} ${page === Math.ceil(org.members.length / PAGE_SIZE) ? styles.active : ''}`}
                                                            onClick={() => setPage(Math.ceil(org.members.length / PAGE_SIZE))}
                                                        >
                                                            {Math.ceil(org.members.length / PAGE_SIZE)}
                                                        </button>
                                                    )}
                                                    <button
                                                        className={styles.paginationButton}
                                                        disabled={page === Math.ceil(org.members.length / PAGE_SIZE) || org.members.length <= PAGE_SIZE}
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
                                        <div className={styles.tableHeader}>
                                            <h3 className={styles.tableTitle}>待处理请求</h3>
                                            <div className={styles.tableActions}>
                                                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                                                    共 {pendingRequests.length} 个请求
                                                </span>
                                            </div>
                                        </div>
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
                                                        pendingRequests
                                                            .slice((pendingRequestsPage - 1) * PAGE_SIZE, pendingRequestsPage * PAGE_SIZE)
                                                            .map(request => (
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
                                        {pendingRequests.length > 0 && (
                                            <div className={styles.pagination}>
                                                <div className={styles.paginationInfo}>
                                                    显示 {(pendingRequestsPage - 1) * PAGE_SIZE + 1} - {Math.min(pendingRequestsPage * PAGE_SIZE, pendingRequests.length)} 条，
                                                    共 {pendingRequests.length} 条记录
                                                </div>
                                                <div className={styles.paginationControls}>
                                                    <button
                                                        className={styles.paginationButton}
                                                        disabled={pendingRequestsPage === 1 || pendingRequests.length <= PAGE_SIZE}
                                                        onClick={() => setPendingRequestsPage(pendingRequestsPage - 1)}
                                                    >
                                                        上一页
                                                    </button>
                                                    <button
                                                        className={`${styles.paginationButton} ${pendingRequestsPage === 1 ? styles.active : ''}`}
                                                        disabled={pendingRequests.length <= PAGE_SIZE}
                                                        onClick={() => setPendingRequestsPage(1)}
                                                    >
                                                        1
                                                    </button>
                                                    {Math.ceil(pendingRequests.length / PAGE_SIZE) > 1 && (
                                                        <button
                                                            className={`${styles.paginationButton} ${pendingRequestsPage === Math.ceil(pendingRequests.length / PAGE_SIZE) ? styles.active : ''}`}
                                                            onClick={() => setPendingRequestsPage(Math.ceil(pendingRequests.length / PAGE_SIZE))}
                                                        >
                                                            {Math.ceil(pendingRequests.length / PAGE_SIZE)}
                                                        </button>
                                                    )}
                                                    <button
                                                        className={styles.paginationButton}
                                                        disabled={pendingRequestsPage === Math.ceil(pendingRequests.length / PAGE_SIZE) || pendingRequests.length <= PAGE_SIZE}
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
                        </div>
                    )}
                </AuthRequired>
            </div>
            <Footer companyName="TechBlog" startYear={2025} />
        </div>
    );
};

export default OrganizationDetail;
