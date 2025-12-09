import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Assuming react-router-dom is used
import {
    FaBuilding,
    FaCheckCircle,
    FaPlus,
    FaUserFriends, // Icon for member count
    FaSignInAlt, // For login button if not authenticated
    FaLock, // For empty state if not authenticated
    FaClipboardList, // For empty state if no orgs
    FaArrowRight
} from 'react-icons/fa';
import Navbar from '../../components/navbar/Navbar';
import Footer from '../../components/footer/Footer';
import Skeleton from '../../components/skeleton/Skeleton';
import { useAuth } from '../../contexts/AuthContext'; // Assuming AuthContext exists
import styles from './OrganizationList.module.css';
import OrganizationService from '../../services/organizationService';
import message from '../../components/message/Message';
import { confirm } from '../../components/confirm/Confirm';

interface Organization {
    id: string;
    name: string;
    type: string;
    status: 'active' | 'inactive';
    description?: string;
    memberCount: number;
    // Add other fields if necessary, e.g., createdAt, owner
}

// 移除 mock 数据，使用真实接口


const OrganizationList: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated, loading: authLoading } = useAuth(); // Assuming useAuth provides these
    const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [loading, setLoading] = useState(true);
    const [organizations, setOrganizations] = useState<Organization[]>([]);

    useEffect(() => {
        const fetchOrgs = async () => {
            setLoading(true);
            try {
                let statusParam: number | undefined = undefined;
                if (filter === 'active') statusParam = 1;
                if (filter === 'inactive') statusParam = 0;
                const res = await OrganizationService.getOrganizationLists(statusParam !== undefined ? { status: statusParam } : {});
                console.log('Fetched organizations:', res);
                const mapped = (res.list || []).map((item: any) => ({
                    id: String(item.id),
                    name: item.name,
                    type: item.type,
                    status: item.status === 1 ? 'active' : 'inactive' as 'active' | 'inactive',
                    description: item.description,
                    memberCount: item.memberCount || 0 // 如果接口有成员数字段
                }));
                setOrganizations(mapped);
            } catch (e) {
                message.error('获取组织列表失败');
            } finally {
                setTimeout(() => setLoading(false), 100);
            }
        };
        fetchOrgs();
    }, [filter]);

    const filteredOrganizations = organizations.filter(org => {
        if (filter === 'all') return true;
        return org.status === filter;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <span className={`${styles.statusBadge} ${styles.statusActive}`}><FaCheckCircle /> 正常</span>;
            case 'inactive':
                return <span className={`${styles.statusBadge} ${styles.statusInactive}`}><FaLock /> 停用</span>; // Using FaLock for inactive
            default:
                return null;
        }
    };

    return (
        <div className={styles.container}>
            <Navbar />
            
            <div className={styles.mainContent}>
                {!authLoading && !isAuthenticated ? (
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
                            您需要登录后才能查看和管理组织列表。
                        </p>
                        <button 
                            onClick={() => navigate('/auth')}
                            className={styles.loginBtn}
                        >
                            <FaSignInAlt /> 立即登录
                        </button>
                    </div>
                ) : (
                    <>
                        <div className={styles.pageHeader}>
                            <h1 className={styles.pageTitle}><FaBuilding /> 组织列表</h1>
                            <div className={styles.filterBar}>
                                <button 
                                    className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
                                    onClick={() => setFilter('all')}
                                >
                                    全部
                                </button>
                                <button 
                                    className={`${styles.filterBtn} ${filter === 'active' ? styles.active : ''}`}
                                    onClick={() => setFilter('active')}
                                >
                                    正常
                                </button>
                                <button 
                                    className={`${styles.filterBtn} ${filter === 'inactive' ? styles.active : ''}`}
                                    onClick={() => setFilter('inactive')}
                                >
                                    停用
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <div className={styles.grid}>
                                {/* 骨架屏加载状态 */}
                                {Array.from({ length: 6 }).map((_, index) => (
                                    <div key={index} className={styles.card}>
                                        <div className={styles.cardHeader}>
                                            <Skeleton variant="rectangular" width={100} height={24} style={{ borderRadius: '6px' }} />
                                            <Skeleton variant="rounded" width={80} height={24} style={{ borderRadius: '30px' }} />
                                        </div>
                                        
                                        <div style={{ margin: '1rem 0' }}>
                                            <Skeleton variant="text" width="80%" height={28} style={{ marginBottom: '0.5rem' }} />
                                            <Skeleton variant="text" lines={2} />
                                        </div>
                                        
                                        <div className={styles.cardFooter}>
                                            <div style={{ width: '120px' }}>
                                                <Skeleton variant="text" width="100%" />
                                            </div>
                                            <Skeleton variant="rectangular" width={100} height={36} style={{ borderRadius: '8px' }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredOrganizations.length > 0 ? (
                            <div className={styles.grid}>
                                {filteredOrganizations.map(org => (
                                    <div key={org.id} className={styles.card}>
                                        <div className={styles.cardHeader}>
                                            <span className={styles.courseBadge}>{org.type}</span>
                                            {getStatusBadge(org.status)}
                                        </div>
                                        
                                        <h3 className={styles.cardTitle}>{org.name}</h3>
                                        <p className={styles.cardDesc}>{org.description}</p>
                                        
                                        <div className={styles.cardFooter}>
                                            <div className={styles.cardMetric}> {/* Changed from deadline to cardMetric */}
                                                <FaUserFriends />
                                                {org.memberCount} 成员
                                            </div>
                                            <button 
                                                className={`${styles.actionBtn} ${styles.btnPrimary}`}
                                                onClick={() => navigate(`/organization/detail/${org.id}`)}
                                            >
                                                查看详情<FaArrowRight />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <FaClipboardList className={styles.emptyIcon} />
                                <h3 className={styles.emptyText}>暂无组织</h3>
                                <p className={styles.emptySubtext}>当前筛选条件下没有找到相关组织</p>
                            </div>
                        )}
                    </>
                )}
            </div>
            
            <Footer companyName="TechBlog" startYear={2025} />
        </div>
    );
};

export default OrganizationList;

