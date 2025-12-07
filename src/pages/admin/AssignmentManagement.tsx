import React, { useState, useEffect } from 'react';
import {
    FaPlus,
    FaSearch,
    FaEdit,
    FaTrash,
    FaEye,
    FaChevronLeft,
    FaChevronRight,
    FaBookOpen,
    FaClock,
    FaCheckCircle,
    FaTimesCircle,
    FaFilter
} from 'react-icons/fa';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import locale from 'antd/es/date-picker/locale/zh_CN';
import CustomSelect from '../../components/customSelect/CustomSelect';
import Input from '../../components/input/Input';
import Loading from '../../components/loading/Loading';
import { confirm } from '../../components/confirm/Confirm';
import message from '../../components/message/Message';
import Modal from '../../components/modal/Modal';
import styles from './AssignmentManagement.module.css';

// 模拟作业数据接口
interface Assignment {
    id: string;
    title: string;
    courseName: string;
    deadline: string;
    status: 'active' | 'draft' | 'closed';
    submissionCount: number;
    totalStudents: number;
    createdAt: string;
    description?: string;
    maxFileSize?: number; // MB
    allowedTypes?: string[];
}

// 模拟数据
const MOCK_ASSIGNMENTS: Assignment[] = [
    {
        id: '1',
        title: 'Web前端开发期末大作业',
        courseName: 'Web前端开发技术',
        deadline: '2025-12-31 23:59:59',
        status: 'active',
        submissionCount: 45,
        totalStudents: 60,
        createdAt: '2025-09-01',
        description: '请完成一个完整的Web前端项目，包含HTML、CSS和JavaScript。',
        maxFileSize: 50,
        allowedTypes: ['.zip', '.rar', '.7z']
    },
    {
        id: '2',
        title: '计算机网络实验报告',
        courseName: '计算机网络',
        deadline: '2025-11-15 12:00:00',
        status: 'closed',
        submissionCount: 58,
        totalStudents: 60,
        createdAt: '2025-10-01',
        description: '完成实验一至实验四的实验报告，并打包上传。',
        maxFileSize: 20,
        allowedTypes: ['.pdf', '.doc', '.docx']
    },
    {
        id: '3',
        title: '数据库课程设计',
        courseName: '数据库系统原理',
        deadline: '2025-10-01 00:00:00',
        status: 'closed',
        submissionCount: 55,
        totalStudents: 58,
        createdAt: '2025-09-15',
        description: '设计一个简单的数据库管理系统，包含ER图和SQL脚本。',
        maxFileSize: 30,
        allowedTypes: ['.zip', '.pdf']
    },
    {
        id: '4',
        title: '算法分析与设计作业',
        courseName: '算法分析与设计',
        deadline: '2026-01-10 23:59:59',
        status: 'active',
        submissionCount: 12,
        totalStudents: 60,
        createdAt: '2025-11-20',
        description: '完成课后习题3.1至3.5。',
        maxFileSize: 10,
        allowedTypes: ['.pdf', '.jpg', '.png']
    },
    {
        id: '5',
        title: '操作系统实验一',
        courseName: '操作系统',
        deadline: '2025-12-20 23:59:59',
        status: 'draft',
        submissionCount: 0,
        totalStudents: 60,
        createdAt: '2025-12-01',
        description: '实现进程调度算法。',
        maxFileSize: 15,
        allowedTypes: ['.cpp', '.c', '.txt']
    }
];

const AssignmentManagement: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    
    // 模态框状态
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isPreviewVisible, setIsPreviewVisible] = useState(false);
    const [currentAssignment, setCurrentAssignment] = useState<Assignment | null>(null);
    const [formData, setFormData] = useState<Partial<Assignment>>({
        title: '',
        courseName: '',
        deadline: '',
        status: 'draft',
        description: '',
        maxFileSize: 50,
        allowedTypes: []
    });

    const pageSize = 10;

    useEffect(() => {
        // 模拟加载数据
        const timer = setTimeout(() => {
            setAssignments(MOCK_ASSIGNMENTS);
            setLoading(false);
        }, 800);
        return () => clearTimeout(timer);
    }, []);

    // 打开创建模态框
    const openCreateModal = () => {
        setCurrentAssignment(null);
        setFormData({
            title: '',
            courseName: '',
            deadline: '',
            status: 'draft',
            description: '',
            maxFileSize: 50,
            allowedTypes: []
        });
        setIsModalVisible(true);
    };

    // 打开编辑模态框
    const openEditModal = (assignment: Assignment) => {
        setCurrentAssignment(assignment);
        setFormData({
            title: assignment.title,
            courseName: assignment.courseName,
            deadline: assignment.deadline,
            status: assignment.status,
            description: assignment.description || '',
            maxFileSize: assignment.maxFileSize || 50,
            allowedTypes: assignment.allowedTypes || []
        });
        setIsModalVisible(true);
    };

    // 打开预览模态框
    const openPreviewModal = (assignment: Assignment) => {
        setCurrentAssignment(assignment);
        setIsPreviewVisible(true);
    };

    // 处理表单提交
    const handleSubmit = () => {
        if (!formData.title || !formData.courseName || !formData.deadline) {
            message.error('请填写完整信息');
            return;
        }

        setLoading(true);
        setTimeout(() => {
            if (currentAssignment) {
                // 编辑模式
                setAssignments(prev => prev.map(item => 
                    item.id === currentAssignment.id 
                        ? { ...item, ...formData } as Assignment 
                        : item
                ));
                message.success('作业更新成功');
            } else {
                // 创建模式
                const newAssignment: Assignment = {
                    id: String(Date.now()),
                    ...formData as any,
                    submissionCount: 0,
                    totalStudents: 60,
                    createdAt: new Date().toISOString().split('T')[0]
                };
                setAssignments(prev => [newAssignment, ...prev]);
                message.success('作业发布成功');
            }
            setIsModalVisible(false);
            setLoading(false);
        }, 500);
    };

    // 筛选逻辑
    const filteredAssignments = assignments.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.courseName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // 分页逻辑
    const totalPages = Math.ceil(filteredAssignments.length / pageSize);
    const currentData = filteredAssignments.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const handleDelete = async (id: string) => {
        const isConfirmed = await confirm({
            title: '确认删除',
            content: '您确定要删除这个作业吗？删除后无法恢复，且所有学生的提交记录也将被删除。',
            confirmText: '删除',
            cancelText: '取消'
        });
        
        if (isConfirmed) {
            setLoading(true);
            // 模拟API调用
            setTimeout(() => {
                setAssignments(prev => prev.filter(item => item.id !== id));
                message.success('作业已删除');
                setLoading(false);
            }, 500);
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <span className={`${styles.statusBadge} ${styles.statusActive}`}><FaCheckCircle /> 进行中</span>;
            case 'draft':
                return <span className={`${styles.statusBadge} ${styles.statusDraft}`}><FaEdit /> 草稿</span>;
            case 'closed':
                return <span className={`${styles.statusBadge} ${styles.statusClosed}`}><FaTimesCircle /> 已结束</span>;
            default:
                return null;
        }
    };

    // 统计数据
    const stats = {
        total: assignments.length,
        active: assignments.filter(a => a.status === 'active').length,
        closed: assignments.filter(a => a.status === 'closed').length,
        draft: assignments.filter(a => a.status === 'draft').length
    };

    if (loading) return <Loading />;

    return (
        <div className={styles.container}>
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>作业管理</h1>
                    <p className={styles.pageDescription}>管理课程作业发布、编辑及查看提交情况</p>
                </div>
                <div className={styles.headerActions}>
                    <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={openCreateModal}>
                        <FaPlus /> 发布作业
                    </button>
                </div>
            </div>

            <div className={styles.statsContainer}>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.primary}`}>
                        <FaBookOpen />
                    </div>
                    <div className={styles.statValue}>{stats.total}</div>
                    <div className={styles.statLabel}>总作业数</div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.success}`}>
                        <FaCheckCircle />
                    </div>
                    <div className={styles.statValue}>{stats.active}</div>
                    <div className={styles.statLabel}>进行中</div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.error}`}>
                        <FaTimesCircle />
                    </div>
                    <div className={styles.statValue}>{stats.closed}</div>
                    <div className={styles.statLabel}>已结束</div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.warning}`}>
                        <FaEdit />
                    </div>
                    <div className={styles.statValue}>{stats.draft}</div>
                    <div className={styles.statLabel}>草稿箱</div>
                </div>
            </div>

            <div className={styles.filterSection}>
                <div className={styles.filterHeader}>
                    <h3 className={styles.filterTitle}>
                        <FaFilter />
                        筛选条件
                    </h3>
                </div>
                <div className={styles.filterForm}>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>搜索作业</label>
                        <Input 
                            placeholder="搜索作业标题或课程名称..." 
                            value={searchTerm}
                            onChange={(value) => setSearchTerm(value)}
                            prefix={<FaSearch />}
                            size="large"
                            style={{ minHeight: '46px', height: '50px' }}
                        />
                    </div>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>作业状态</label>
                        <CustomSelect
                            name="状态筛选"
                            options={[
                                { id: 'all', name: '所有状态', color: 'var(--text-secondary)' },
                                { id: 'active', name: '进行中', color: 'var(--success)' },
                                { id: 'closed', name: '已结束', color: 'var(--error)' },
                                { id: 'draft', name: '草稿', color: 'var(--warning)' }
                            ]}
                            value={{ 
                                id: statusFilter, 
                                name: statusFilter === 'all' ? '所有状态' : 
                                      statusFilter === 'active' ? '进行中' : 
                                      statusFilter === 'closed' ? '已结束' : '草稿',
                                color: '' 
                            }}
                            onChange={(option) => setStatusFilter(option ? String(option.id) : 'all')}
                            placeholder="状态筛选"
                            hideBadge={true}
                        />
                    </div>
                </div>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>作业标题</th>
                            <th>所属课程</th>
                            <th>截止时间</th>
                            <th>提交情况</th>
                            <th>状态</th>
                            <th>创建时间</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentData.length > 0 ? (
                            currentData.map(item => (
                                <tr key={item.id}>
                                    <td>
                                        <div style={{ fontWeight: 500 }}>{item.title}</div>
                                    </td>
                                    <td>{item.courseName}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                            <FaClock /> {item.deadline}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '13px' }}>
                                            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{item.submissionCount}</span>
                                            <span style={{ color: 'var(--text-secondary)' }}> / {item.totalStudents}</span>
                                        </div>
                                        <div style={{ 
                                            width: '100px', 
                                            height: '4px', 
                                            background: 'var(--border-secondary)', 
                                            borderRadius: '2px',
                                            margin: '4px auto 0',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{ 
                                                width: `${(item.submissionCount / item.totalStudents) * 100}%`, 
                                                height: '100%', 
                                                background: 'var(--primary)' 
                                            }} />
                                        </div>
                                    </td>
                                    <td>{getStatusBadge(item.status)}</td>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{item.createdAt}</td>
                                    <td>
                                        <div className={styles.actionButtons}>
                                            <button 
                                                className={styles.actionBtn} 
                                                title="查看详情"
                                                onClick={() => openPreviewModal(item)}
                                            >
                                                <FaEye />
                                            </button>
                                            <button 
                                                className={styles.actionBtn} 
                                                title="编辑"
                                                onClick={() => openEditModal(item)}
                                            >
                                                <FaEdit />
                                            </button>
                                            <button 
                                                className={`${styles.actionBtn} ${styles.delete}`} 
                                                title="删除"
                                                onClick={() => handleDelete(item.id)}
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
            </div>

            {totalPages > 1 && (
                <div className={styles.pagination}>
                    <span className={styles.pageInfo}>
                        第 {currentPage} 页 / 共 {totalPages} 页
                    </span>
                    <div className={styles.pageButtons}>
                        <button 
                            className={styles.pageBtn}
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                        >
                            <FaChevronLeft />
                        </button>
                        {Array.from({ length: totalPages }).map((_, i) => (
                            <button
                                key={i + 1}
                                className={`${styles.pageBtn} ${currentPage === i + 1 ? styles.active : ''}`}
                                onClick={() => setCurrentPage(i + 1)}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button 
                            className={styles.pageBtn}
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                        >
                            <FaChevronRight />
                        </button>
                    </div>
                </div>
            )}

            {/* 创建/编辑模态框 */}
            <Modal
                visible={isModalVisible}
                title={currentAssignment ? '编辑作业' : '发布新作业'}
                onClose={() => setIsModalVisible(false)}
                width={600}
                footer={
                    <>
                        <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setIsModalVisible(false)}>
                            取消
                        </button>
                        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleSubmit}>
                            {currentAssignment ? '保存修改' : '立即发布'}
                        </button>
                    </>
                }
            >
                <div className={styles.formGroup}>
                    <label className={styles.formLabel}>作业标题</label>
                    <Input 
                        placeholder="请输入作业标题" 
                        value={formData.title || ''}
                        onChange={(value) => setFormData({...formData, title: value})}
                        className={styles.formInput}
                    />
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.formLabel}>所属课程</label>
                    <Input 
                        placeholder="请输入课程名称" 
                        value={formData.courseName || ''}
                        onChange={(value) => setFormData({...formData, courseName: value})}
                        className={styles.formInput}
                    />
                </div>
                <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>截止时间</label>
                        <DatePicker 
                            showTime
                            locale={locale}
                            value={formData.deadline ? dayjs(formData.deadline) : null}
                            onChange={(_, dateString) => setFormData({...formData, deadline: Array.isArray(dateString) ? dateString[0] : dateString})}
                            className={styles.formInput}
                            style={{ width: '100%' }}
                            placeholder="请选择截止时间"
                            format="YYYY-MM-DD HH:mm:ss"
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>文件大小限制 (MB)</label>
                        <Input 
                            type="number"
                            placeholder="请输入最大文件大小" 
                            value={String(formData.maxFileSize || '')}
                            onChange={(value) => setFormData({...formData, maxFileSize: Number(value)})}
                            className={styles.formInput}
                        />
                    </div>
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.formLabel}>作业状态</label>
                    <CustomSelect
                        name="状态选择"
                        options={[
                            { id: 'active', name: '进行中', color: 'var(--success)' },
                            { id: 'closed', name: '已结束', color: 'var(--error)' },
                            { id: 'draft', name: '草稿', color: 'var(--warning)' }
                        ]}
                        value={{ 
                            id: formData.status || 'draft', 
                            name: formData.status === 'active' ? '进行中' : 
                                  formData.status === 'closed' ? '已结束' : '草稿',
                            color: '' 
                        }}
                        onChange={(option) => setFormData({...formData, status: option?.id as any})}
                        placeholder="请选择状态"
                        hideBadge={true}
                    />
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.formLabel}>允许文件格式 (用逗号分隔)</label>
                    <Input 
                        placeholder="例如: .pdf, .doc, .zip" 
                        value={formData.allowedTypes?.join(', ') || ''}
                        onChange={(value) => setFormData({
                            ...formData, 
                            allowedTypes: value.split(/[,，]/).map(t => t.trim()).filter(t => t)
                        })}
                        className={styles.formInput}
                    />
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.formLabel}>作业描述</label>
                    <textarea 
                        className={styles.formTextarea}
                        placeholder="请输入作业详细描述..."
                        value={formData.description || ''}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                </div>
            </Modal>

            {/* 预览模态框 */}
            <Modal
                visible={isPreviewVisible}
                title="作业详情预览"
                onClose={() => setIsPreviewVisible(false)}
                width={600}
                footer={
                    <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setIsPreviewVisible(false)}>
                        关闭
                    </button>
                }
            >
                {currentAssignment && (
                    <div>
                        <div className={styles.detailGroup}>
                            <div className={styles.detailLabel}>作业标题</div>
                            <div className={styles.detailValue} style={{ fontSize: '18px', fontWeight: 600 }}>
                                {currentAssignment.title}
                            </div>
                        </div>
                        
                        <div className={styles.detailRow}>
                            <div className={styles.detailGroup}>
                                <div className={styles.detailLabel}>所属课程</div>
                                <div className={styles.detailValue}>{currentAssignment.courseName}</div>
                            </div>
                            <div className={styles.detailGroup}>
                                <div className={styles.detailLabel}>当前状态</div>
                                <div className={styles.detailValue}>{getStatusBadge(currentAssignment.status)}</div>
                            </div>
                        </div>

                        <div className={styles.detailRow}>
                            <div className={styles.detailGroup}>
                                <div className={styles.detailLabel}>截止时间</div>
                                <div className={styles.detailValue}>{currentAssignment.deadline}</div>
                            </div>
                            <div className={styles.detailGroup}>
                                <div className={styles.detailLabel}>创建时间</div>
                                <div className={styles.detailValue}>{currentAssignment.createdAt}</div>
                            </div>
                        </div>

                        <div className={styles.detailRow}>
                            <div className={styles.detailGroup}>
                                <div className={styles.detailLabel}>文件大小限制</div>
                                <div className={styles.detailValue}>{currentAssignment.maxFileSize ? `${currentAssignment.maxFileSize} MB` : '未设置'}</div>
                            </div>
                            <div className={styles.detailGroup}>
                                <div className={styles.detailLabel}>允许文件格式</div>
                                <div className={styles.detailValue}>{currentAssignment.allowedTypes?.join(', ') || '不限'}</div>
                            </div>
                        </div>

                        <div className={styles.detailGroup}>
                            <div className={styles.detailLabel}>提交情况</div>
                            <div className={styles.detailValue}>
                                已提交 {currentAssignment.submissionCount} / 共 {currentAssignment.totalStudents} 人
                                <div style={{ 
                                    width: '100%', 
                                    height: '6px', 
                                    background: 'var(--bg-secondary)', 
                                    borderRadius: '3px',
                                    marginTop: '8px',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{ 
                                        width: `${(currentAssignment.submissionCount / currentAssignment.totalStudents) * 100}%`, 
                                        height: '100%', 
                                        background: 'var(--primary)' 
                                    }} />
                                </div>
                            </div>
                        </div>

                        <div className={styles.detailGroup}>
                            <div className={styles.detailLabel}>作业描述</div>
                            <div className={styles.detailValue} style={{ 
                                background: 'var(--bg-secondary)', 
                                padding: '12px', 
                                borderRadius: '6px',
                                minHeight: '80px'
                            }}>
                                {currentAssignment.description || '暂无描述'}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AssignmentManagement;
