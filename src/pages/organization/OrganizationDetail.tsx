import React, { useEffect, useState } from 'react';
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
    FaEye
} from 'react-icons/fa';
import Navbar from '../../components/navbar/Navbar';
import Footer from '../../components/footer/Footer';
import OrganizationDetailSkeleton from '../../components/organization/OrganizationDetailSkeleton';
import AuthRequired from '../../components/auth/AuthRequired';
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
                    members: Array.isArray((res as any).members) ? (res as any).members : [],
                };
                setOrg(orgDetail);
                // 统计信息
                const totalMembers = orgDetail.members.length;
                const activeMembers = orgDetail.members.filter(member => member.status === 'active').length;
                const leaderMembers = orgDetail.members.filter(member => member.role === '会长').length;
                const deputyMembers = orgDetail.members.filter(member => member.role === '管理员').length;
                const regularMembers = orgDetail.members.filter(member => member.role === '成员').length;
                setStats({ totalMembers, activeMembers, leaderMembers, deputyMembers, regularMembers });
                setJoined(false); // TODO: 可根据接口返回判断是否已加入
            } catch (e) {
                message.error('获取组织详情失败');
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id]);

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

                            {/* 成员表格 */}
                            <div className={styles.tableContainer}>
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
