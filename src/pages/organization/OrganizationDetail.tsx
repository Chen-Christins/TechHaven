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
import Skeleton from '../../components/skeleton/Skeleton';
import styles from './OrganizationDetail.module.css';
import OrganizationService from '../../services/organizationService';
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

const PAGE_SIZE = 10;

const OrganizationDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [org, setOrg] = useState<OrganizationDetail | null>(null);
    const [joined, setJoined] = useState(false);
    const [page, setPage] = useState(1);

    useEffect(() => {
        const fetchDetail = async () => {
            setLoading(true);
            try {
                // TODO: Replace with real API call
                // const res = await OrganizationService.getOrganizationDetail({ id });
                // setOrg(res.data);
                // setJoined(res.data.joined);
                // Mock data for demo
                setOrg({
                    id: id || '',
                    name: '前端技术研究社',
                    type: '学生社团',
                    status: 'active',
                    description: '专注于前端前沿技术研究与分享，定期举办技术交流会和项目实战。',
                    memberCount: 3,
                    members: [
                        { id: '1', name: '张三', avatar: '', role: '会长' },
                        { id: '2', name: '李四', avatar: '', role: '副会长' },
                        { id: '3', name: '王五', avatar: '', role: '成员' }
                    ]
                });
                setJoined(false);
            } catch (e) {
                message.error('获取组织详情失败');
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id]);

    const handleJoin = async () => {
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
                <button className={styles.backBtn} onClick={() => navigate(-1)}><FaArrowLeft /> 返回</button>
                {loading || !org ? (
                    <Skeleton variant="rectangular" width="100%" height={200} />
                ) : (
                    <div className={styles.detailCard}>
                        <div className={styles.header}>
                            <span className={styles.orgName}><FaBuilding /> {org.name}</span>
                            <span className={styles.orgType}>{org.type}</span>
                            <span className={org.status === 'active' ? styles.statusActive : styles.statusInactive}>
                                {org.status === 'active' ? <FaCheckCircle /> : <FaLock />} {org.status === 'active' ? '正常' : '停用'}
                            </span>
                            {!joined && (
                                <button className={styles.joinBtn} onClick={handleJoin} style={{ marginLeft: 'auto' }}>
                                    <FaPlus /> 申请加入
                                </button>
                            )}
                            {joined && (
                                <span className={styles.joined} style={{ marginLeft: 'auto' }}>已申请加入</span>
                            )}
                        </div>
                        <div className={styles.description}>{org.description}</div>
                        <div className={styles.memberSection}>
                            <div className={styles.memberHeader}>
                                <FaUserFriends /> 成员列表 ({org.memberCount})
                            </div>
                            <table className={styles.memberTable}>
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
                                    {org.members.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(member => (
                                        <tr key={member.id} className={styles.tableRow}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <img
                                                        src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random`}
                                                        alt={member.name}
                                                        className={styles.memberAvatar}
                                                        style={{ width: 36, height: 36, borderRadius: '50%' }}
                                                    />
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span className={styles.memberName}>{member.name}</span>
                                                        {member.email && <span className={styles.memberEmail}>{member.email}</span>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={styles.memberRole}>
                                                    {member.role === '会长' && <FaCrown style={{ color: '#f7b500', marginRight: 4 }} />}
                                                    {member.role === '副会长' && <FaUserShield style={{ color: '#4caf50', marginRight: 4 }} />}
                                                    {member.role === '成员' && <FaUser style={{ color: '#2196f3', marginRight: 4 }} />}
                                                    {member.role || '成员'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={member.status === 'active' ? styles.statusActive : styles.statusInactive}>
                                                    <span className={styles.statusIndicator}></span>
                                                    {member.status === 'active' ? '活跃' : '非活跃'}
                                                </span>
                                            </td>
                                            <td>{member.joinTime || '-'}</td>
                                            <td>
                                                <button className={styles.actionBtn} title="查看详情" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}>
                                                    <FaEye />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {/* 分页区块 */}
                            {org.members.length > PAGE_SIZE && (
                                <div className={styles.pagination}>
                                    <button className={styles.pageBtn} disabled={page === 1} onClick={() => setPage(page - 1)}>上一页</button>
                                    <span>第 {page} 页 / 共 {Math.ceil(org.members.length / PAGE_SIZE)} 页</span>
                                    <button className={styles.pageBtn} disabled={page === Math.ceil(org.members.length / PAGE_SIZE)} onClick={() => setPage(page + 1)}>下一页</button>
                                </div>
                            )}
                        </div>
                        {/* 申请加入按钮已移至header最右侧 */}
                    </div>
                )}
            </div>
            <Footer companyName="TechBlog" startYear={2025} />
        </div>
    );
};

export default OrganizationDetail;
