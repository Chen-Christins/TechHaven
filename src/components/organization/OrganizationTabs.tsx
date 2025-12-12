import React from "react";
import {
    FaCrown,
    FaUserShield,
    FaUser,
    FaEye,
    FaSync,
    FaUserMinus,
    FaCog,
    FaTasks,
    FaEdit,
    FaTrash,
    FaCalendarAlt,
    FaFlag,
    FaHourglassHalf,
    FaPlayCircle,
    FaStopCircle,
    FaCheck,
    FaTimes,
    FaPlus,
} from "react-icons/fa";
import type { Member, Task, OrganizationDetail } from "./types";
import styles from "../../pages/organization/OrganizationDetail.module.css";
import Modal from "../modal/Modal";
// import Input from '../input/Input';
// import DatePicker from '../datePicker/DatePicker';
// import dayjs from 'dayjs';
import "dayjs/locale/zh-cn";
// import locale from 'antd/es/date-picker/locale/zh_CN';
// import CustomSelect from '../../components/customSelect/CustomSelect';

interface OrganizationTabsProps {
    org: OrganizationDetail | null;
    userRole: "leader" | "admin" | "member" | "guest" | null;
    currentUser?: any;
    showPendingRequests: boolean;
    showTasks: boolean;
    members: Member[];
    membersTotal: number;
    page: number;
    isRefreshing: boolean;
    pendingRequests: Member[];
    pendingRequestsTotal: number;
    pendingRequestsPage: number;
    pendingRequestsLoading: boolean;
    tasks: Task[];
    tasksTotal: number;
    tasksPage: number;
    tasksLoading: boolean;
    roleModalVisible: boolean;
    selectedTask: Task | null;
    taskPreviewModalVisible: boolean;
    selectedMember: Member | null;
    selectedRole: number;
    getAvailableRoleOptions: () => any[];
    onTabChange: (showPending: boolean, showTasks: boolean) => void;
    onRefreshMembers: () => void;
    onRefreshPending: () => void;
    onPageChange: (newPage: number) => void;
    onPendingPageChange: (newPage: number) => void;
    onTasksPageChange: (newPage: number) => void;
    onActionPendingRequest: (requestId: string, action: "accept" | "reject") => void;
    onKickMember: (member: Member) => void;
    onSetMemberRole: (member: Member) => void;
    onRoleModalClose: () => void;
    onTaskPreviewModalClose: () => void;
    onRoleChange: (role: number) => void;
    onConfirmRole: () => void;
    onCreateTask: () => void;
    onRefreshTasks: (page?: number) => void;
    onEditTask: (task: Task) => void;
    onViewTask: (task: Task) => void;
    onDeleteTask: (task: Task) => void;
    canManageMember: (member: Member) => boolean;
    canSetRole: (member: Member) => boolean;
    canManageTask: () => boolean;
}

const PAGE_SIZE = 15;
const TASKS_PAGE_SIZE = 15; // 任务列表每页显示的条数

const statusClassMap = {
    "draft": styles.statusDraft,
    "active": styles.statusActive,
    "closed": styles.statusClosed,
  // 其它状态...
};

const OrganizationTabs: React.FC<OrganizationTabsProps> = ({
    userRole,
    showPendingRequests,
    showTasks,
    members,
    membersTotal,
    page,
    isRefreshing,
    pendingRequests,
    pendingRequestsTotal,
    pendingRequestsPage,
    pendingRequestsLoading,
    tasks,
    tasksTotal,
    tasksPage,
    tasksLoading,
    roleModalVisible,
    taskPreviewModalVisible,
    selectedMember,
    selectedRole,
    selectedTask,
    getAvailableRoleOptions,
    onTabChange,
    onRefreshMembers,
    onRefreshPending,
    onPageChange,
    onPendingPageChange,
    onTasksPageChange,
    onActionPendingRequest,
    onKickMember,
    onSetMemberRole,
    onRoleModalClose,
    onTaskPreviewModalClose,
    onRoleChange,
    onConfirmRole,
    onCreateTask,
    onRefreshTasks,
    onEditTask,
    onViewTask,
    onDeleteTask,
    canManageMember,
    canSetRole,
    canManageTask,
}) => {
    return (
        <div className={styles.tableContainer}>
            {/* Tab切换按钮 */}
            {userRole === "leader" || userRole === "admin" ? (
                <div className={styles.tabsHeader}>
                    <button
                        className={`${styles.tabButton} ${!showPendingRequests && !showTasks ? styles.activeTab : ""}`}
                        onClick={() => onTabChange(false, false)}
                    >
                        成员列表
                    </button>
                    <button
                        className={`${styles.tabButton} ${showPendingRequests ? styles.activeTab : ""}`}
                        onClick={() => onTabChange(true, false)}
                    >
                        待处理请求
                    </button>
                    <button
                        className={`${styles.tabButton} ${showTasks ? styles.activeTab : ""}`}
                        onClick={() => onTabChange(false, true)}
                    >
                        任务列表
                    </button>
                </div>
            ) : (
                <></>
            )}

            {/* 成员列表视图 */}
            {!showPendingRequests && !showTasks && (
                <>
                    {!(userRole === "leader" || userRole === "admin") ? (
                        <div className={styles.tableHeader}>
                            <h3 className={styles.tableTitle}>成员列表</h3>
                            <div className={styles.tableActions}>
                                <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                                    共 {membersTotal} 个成员
                                </span>
                                <button
                                    className={`${styles.refreshButton} ${isRefreshing ? styles.loading : ""}`}
                                    title="刷新成员列表"
                                    onClick={onRefreshMembers}
                                    disabled={isRefreshing}
                                    style={{ marginLeft: "8px" }}
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
                            {members && members.length > 0 ? (
                                members.map((member) => (
                                    <tr key={member.id} className={styles.tableRow}>
                                        <td>
                                            <div className={styles.userInfo}>
                                                <img
                                                    src={
                                                        member.avatar ||
                                                        `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random`
                                                    }
                                                    alt={member.name}
                                                    className={styles.userAvatar}
                                                />
                                                <div className={styles.userDetails}>
                                                    <div className={styles.userName}>{member.name}</div>
                                                    {member.email && (
                                                        <div className={styles.userEmail}>{member.email}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span
                                                className={`${styles.roleBadge} ${member.role === "会长" ? styles.admin : member.role === "管理员" ? styles.moderator : styles.user}`}
                                            >
                                                {member.role === "会长" && (
                                                    <FaCrown style={{ color: "#f7b500", marginRight: 4 }} />
                                                )}
                                                {member.role === "管理员" && (
                                                    <FaUserShield style={{ color: "#4caf50", marginRight: 4 }} />
                                                )}
                                                {member.role === "成员" && (
                                                    <FaUser style={{ color: "#2196f3", marginRight: 4 }} />
                                                )}
                                                {member.role || "成员"}
                                            </span>
                                        </td>
                                        <td>
                                            <span
                                                className={`${styles.statusBadge} ${member.status === "active" ? styles.active : styles.inactive}`}
                                            >
                                                <span className={styles.statusIndicator}></span>
                                                {member.status === "active" ? "活跃" : "非活跃"}
                                            </span>
                                        </td>
                                        <td>{member.joinTime || "-"}</td>
                                        <td>
                                            <div className={styles.actionButtons}>
                                                <button
                                                    className={`${styles.actionButton} ${styles.viewButton}`}
                                                    title="查看详情"
                                                >
                                                    <FaEye />
                                                </button>
                                                {canManageMember(member) && (
                                                    <>
                                                        <button
                                                            className={`${styles.actionButton} ${styles.kickButton}`}
                                                            title="踢出组织"
                                                            onClick={() => onKickMember(member)}
                                                        >
                                                            <FaUserMinus />
                                                        </button>
                                                        {canSetRole(member) && (
                                                            <button
                                                                className={`${styles.actionButton} ${styles.roleButton}`}
                                                                title="设置角色"
                                                                onClick={() => onSetMemberRole(member)}
                                                            >
                                                                <FaCog />
                                                            </button>
                                                        )}
                                                    </>
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
                                显示 {(page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, membersTotal)} 条， 共{" "}
                                {membersTotal} 条记录
                            </div>
                            <div className={styles.paginationControls}>
                                <button
                                    className={styles.paginationButton}
                                    disabled={page === 1}
                                    onClick={() => onPageChange(page - 1)}
                                >
                                    上一页
                                </button>
                                {Array.from({ length: Math.ceil(membersTotal / PAGE_SIZE) }, (_, i) => (
                                    <button
                                        key={i + 1}
                                        className={`${styles.paginationButton} ${page === i + 1 ? styles.active : ""}`}
                                        onClick={() => onPageChange(i + 1)}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    className={styles.paginationButton}
                                    disabled={page === Math.ceil(membersTotal / PAGE_SIZE)}
                                    onClick={() => onPageChange(page + 1)}
                                >
                                    下一页
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* 待处理请求视图 */}
            {showPendingRequests && (userRole === "leader" || userRole === "admin") && (
                <>
                    <div className={styles.tableHeader}>
                        <h3 className={styles.tableTitle}>待处理请求</h3>
                        <div className={styles.tableActions}>
                            <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                                共 {pendingRequests.length} 个请求
                            </span>
                            <button
                                className={`${styles.refreshButton} ${pendingRequestsLoading ? styles.loading : ""}`}
                                title="刷新待处理请求"
                                onClick={onRefreshPending}
                                disabled={pendingRequestsLoading}
                                style={{ marginLeft: "8px" }}
                            >
                                <FaSync />
                            </button>
                        </div>
                    </div>
                    {pendingRequestsLoading ? (
                        <div style={{ padding: "20px", textAlign: "center" }}>
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
                                    pendingRequests.map((request) => (
                                        <tr key={request.id} className={styles.tableRow}>
                                            <td>
                                                <div className={styles.userInfo}>
                                                    <img
                                                        src={
                                                            request.avatar ||
                                                            `https://ui-avatars.com/api/?name=${encodeURIComponent(request.name)}&background=random`
                                                        }
                                                        alt={request.name}
                                                        className={styles.userAvatar}
                                                    />
                                                    <div className={styles.userDetails}>
                                                        <div className={styles.userName}>{request.name}</div>
                                                        {request.email && (
                                                            <div className={styles.userEmail}>{request.email}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{request.joinTime || "-"}</td>
                                            <td>
                                                <div className={styles.actionButtons}>
                                                    <button
                                                        className={`${styles.actionButton} ${styles.acceptButton}`}
                                                        title="接受"
                                                        onClick={() => onActionPendingRequest(request.id, "accept")}
                                                    >
                                                        <FaCheck />
                                                    </button>
                                                    <button
                                                        className={`${styles.actionButton} ${styles.rejectButton}`}
                                                        title="拒绝"
                                                        onClick={() => onActionPendingRequest(request.id, "reject")}
                                                    >
                                                        <FaTimes />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={3}
                                            style={{
                                                textAlign: "center",
                                                padding: "40px",
                                                color: "var(--text-secondary)",
                                            }}
                                        >
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
                                显示 {(pendingRequestsPage - 1) * PAGE_SIZE + 1} -{" "}
                                {Math.min(pendingRequestsPage * PAGE_SIZE, pendingRequestsTotal)} 条， 共{" "}
                                {pendingRequestsTotal} 条记录
                            </div>
                            <div className={styles.paginationControls}>
                                <button
                                    className={styles.paginationButton}
                                    disabled={pendingRequestsPage === 1}
                                    onClick={() => onPendingPageChange(pendingRequestsPage - 1)}
                                >
                                    上一页
                                </button>
                                {Array.from({ length: Math.ceil(pendingRequestsTotal / PAGE_SIZE) }, (_, i) => (
                                    <button
                                        key={i + 1}
                                        className={`${styles.paginationButton} ${pendingRequestsPage === i + 1 ? styles.active : ""}`}
                                        onClick={() => onPendingPageChange(i + 1)}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    className={styles.paginationButton}
                                    disabled={pendingRequestsPage === Math.ceil(pendingRequestsTotal / PAGE_SIZE)}
                                    onClick={() => onPendingPageChange(pendingRequestsPage + 1)}
                                >
                                    下一页
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* 任务列表视图 */}
            {showTasks && (
                <>
                    <div className={styles.tableHeader}>
                        <h3 className={styles.tableTitle}>任务列表</h3>
                        <div className={styles.tableActions}>
                            <button
                                className={styles.refreshButton}
                                onClick={() => onRefreshTasks()}
                                title="刷新任务列表"
                            >
                                <FaSync />
                            </button>
                            {(userRole === "leader" || userRole === "admin") && (
                                <button className={styles.createButton} onClick={onCreateTask}>
                                    <FaPlus /> 创建任务
                                </button>
                            )}
                        </div>
                    </div>

                    {tasksLoading ? (
                        <p>正在加载任务列表...</p>
                    ) : tasks.length === 0 ? (
                        <div className={styles.emptyState}>
                            <FaTasks className={styles.emptyIcon} />
                            <h3 className={styles.emptyTitle}>暂无任务</h3>
                            <p className={styles.emptySubtext}>
                                {userRole === "leader" || userRole === "admin"
                                    ? '点击"创建任务"按钮来创建第一个任务'
                                    : "当前组织还没有发布任何任务"}
                            </p>
                        </div>
                    ) : (
                        <table className={styles.usersTable}>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: "left" }}>任务信息</th>
                                    <th>优先级</th>
                                    <th>负责人</th>
                                    <th>截止时间</th>
                                    <th>状态</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.length > 0 ? (
                                    tasks.map((task) => (
                                        <tr key={task.id} className={styles.tableRow}>
                                            <td>
                                                <div className={styles.userInfo}>
                                                    <div
                                                        className={styles.userAvatar}
                                                        style={{
                                                            background: "var(--primary-light)",
                                                            color: "var(--primary)",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                        }}
                                                    >
                                                        <FaTasks />
                                                    </div>
                                                    <div className={styles.userDetails}>
                                                        <div className={styles.userName}>{task.title}</div>
                                                        {task.description && (
                                                            <div
                                                                className={styles.userEmail}
                                                                style={{
                                                                    marginTop: "4px",
                                                                    fontSize: "12px",
                                                                    color: "var(--text-secondary)",
                                                                    lineHeight: "1.4",
                                                                }}
                                                            >
                                                                {task.description}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ textAlign: "center" }}>
                                                <span className={`${styles.priorityBadge} ${styles[task.priority]}`}>
                                                    <FaFlag />
                                                    {task.priority === "low" && "低"}
                                                    {task.priority === "medium" && "中"}
                                                    {task.priority === "high" && "高"}
                                                    {task.priority === "urgent" && "紧急"}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: "center" }}>
                                                {task.assignee_name || (
                                                    <span
                                                        style={{
                                                            color: "var(--text-secondary)",
                                                            fontStyle: "italic",
                                                        }}
                                                    >
                                                        未分配
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ textAlign: "center" }}>
                                                {task.due_date ? (
                                                    <span
                                                        style={{
                                                            color: "var(--warning)",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: "4px",
                                                            justifyContent: "center",
                                                        }}
                                                    >
                                                        <FaCalendarAlt />
                                                        {new Date(task.due_date).toLocaleDateString()}
                                                    </span>
                                                ) : (
                                                    <span
                                                        style={{
                                                            color: "var(--text-secondary)",
                                                            fontStyle: "italic",
                                                        }}
                                                    >
                                                        无截止日期
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ textAlign: "center" }}>
                                                <span className={`${styles.statusBadge} ${styles[task.status]}`}>
                                                    {task.status === "draft" && <FaHourglassHalf />}
                                                    {task.status === "draft" && "草稿"}
                                                    {task.status === "active" && <FaPlayCircle />}
                                                    {task.status === "active" && "进行中"}
                                                    {task.status === "closed" && <FaStopCircle />}
                                                    {task.status === "closed" && "已关闭"}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: "center" }}>
                                                <div
                                                    className={styles.actionButtons}
                                                    style={{ justifyContent: "center" }}
                                                >
                                                    <button
                                                        className={styles.actionButton}
                                                        title="查看详情"
                                                        onClick={() => onViewTask(task)}
                                                    >
                                                        <FaEye />
                                                    </button>
                                                    {canManageTask() && (
                                                        <>
                                                            <button
                                                                className={styles.actionButton}
                                                                title="编辑任务"
                                                                onClick={() => onEditTask(task)}
                                                            >
                                                                <FaEdit />
                                                            </button>
                                                            <button
                                                                className={`${styles.actionButton} ${styles.rejectButton}`}
                                                                title="删除任务"
                                                                onClick={() => onDeleteTask(task)}
                                                            >
                                                                <FaTrash />
                                                            </button>
                                                        </>
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
                                            暂无任务
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                    {/* 分页区块 - 任务列表 */}
                    {tasksTotal > 0 && (
                        <div className={styles.pagination}>
                            <div className={styles.paginationInfo}>
                                显示 {(tasksPage - 1) * TASKS_PAGE_SIZE + 1} - {Math.min(tasksPage * TASKS_PAGE_SIZE, tasksTotal)} 条， 共{" "}
                                {tasksTotal} 条记录
                            </div>
                            <div className={styles.paginationControls}>
                                <button
                                    className={styles.paginationButton}
                                    disabled={tasksPage === 1}
                                    onClick={() => onTasksPageChange(tasksPage - 1)}
                                >
                                    上一页
                                </button>
                                {Array.from({ length: Math.ceil(tasksTotal / TASKS_PAGE_SIZE) }, (_, i) => (
                                    <button
                                        key={i + 1}
                                        className={`${styles.paginationButton} ${tasksPage === i + 1 ? styles.active : ""}`}
                                        onClick={() => onRefreshTasks(i + 1)}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    className={styles.paginationButton}
                                    disabled={tasksPage === Math.ceil(tasksTotal / TASKS_PAGE_SIZE)}
                                    onClick={() => onTasksPageChange(tasksPage + 1)}
                                >
                                    下一页
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Role Selection Modal */}
            <Modal
                visible={roleModalVisible}
                title={`设置 ${selectedMember?.name} 的角色`}
                onClose={onRoleModalClose}
                footer={
                    <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                        <button onClick={onRoleModalClose} className={styles.cancelButton}>
                            取消
                        </button>
                        <button onClick={onConfirmRole} className={styles.confirmButton}>
                            确认
                        </button>
                    </div>
                }
                width="450px"
                size="small"
            >
                <div className={styles.roleSelectionContainer}>
                    <p className={styles.roleSelectionDescription}>请为 {selectedMember?.name} 选择合适的角色</p>
                    <div className={styles.roleOptions}>
                        {getAvailableRoleOptions().map((role) => (
                            <label
                                key={role.value}
                                className={`${styles.roleOption} ${selectedRole === role.value ? styles.selectedRole : ""}`}
                            >
                                <input
                                    type="radio"
                                    name="role"
                                    value={role.value}
                                    checked={selectedRole === role.value}
                                    onChange={(e) => onRoleChange(parseInt(e.target.value))}
                                    style={{ display: "none" }}
                                />
                                <div className={styles.roleOptionContent}>
                                    <div className={styles.roleIcon}>{role.icon}</div>
                                    <div className={styles.roleInfo}>
                                        <div className={styles.roleLabel}>{role.label}</div>
                                        <div className={styles.roleDescription}>{role.description}</div>
                                    </div>
                                    <div className={styles.roleRadio}>
                                        <div className={styles.radioCircle}></div>
                                    </div>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>
            </Modal>

            {/* 预览模态框 */}
            <Modal
                visible={taskPreviewModalVisible}
                title="任务详情预览"
                onClose={onTaskPreviewModalClose}
                width={600}
                footer={
                    <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={onTaskPreviewModalClose}>
                        关闭
                    </button>
                }
            >
                {selectedTask ? (
                    <div>
                        <div className={styles.detailGroup}>
                            <div className={styles.detailLabel}>任务标题</div>
                            <div className={styles.detailValue} style={{ fontSize: "18px", fontWeight: 600 }}>
                                {selectedTask.title}
                            </div>
                        </div>
                        <div className={styles.detailRow}>
                            <div className={styles.detailGroup}>
                                <div className={styles.detailLabel}>优先级</div>
                                <div className={styles.detailValue}>
                                    <span className={`${styles.priorityBadge} ${styles[selectedTask.priority]}`}>
                                        <FaFlag />
                                        {selectedTask.priority === "low" && "低"}
                                        {selectedTask.priority === "medium" && "中"}
                                        {selectedTask.priority === "high" && "高"}
                                        {selectedTask.priority === "urgent" && "紧急"}
                                    </span>
                                </div>
                            </div>
                            <div className={styles.detailGroup}>
                                <div className={styles.detailLabel}>当前状态</div>
                                <div className={styles.detailValue}>
                                    <span className={`${styles.statusBadge} ${statusClassMap[selectedTask.status] || ""}`}>
                                        {selectedTask.status === "draft" && <FaHourglassHalf />}
                                        {selectedTask.status === "draft" && "草稿"}
                                        {selectedTask.status === "active" && <FaPlayCircle />}
                                        {selectedTask.status === "active" && "进行中"}
                                        {selectedTask.status === "closed" && <FaStopCircle />}
                                        {selectedTask.status === "closed" && "已关闭"}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className={styles.detailRow}>
                            <div className={styles.detailGroup}>
                                <div className={styles.detailLabel}>负责人</div>
                                <div className={styles.detailValue}>
                                    {selectedTask.assignee_name || selectedTask.assignee || "未分配"}
                                </div>
                            </div>
                            <div className={styles.detailGroup}>
                                <div className={styles.detailLabel}>截止时间</div>
                                <div className={styles.detailValue}>
                                    {selectedTask.due_date
                                        ? new Date(selectedTask.due_date).toLocaleString()
                                        : "无截止日期"}
                                </div>
                            </div>
                        </div>
                        <div className={styles.detailRow}>
                            <div className={styles.detailGroup}>
                                <div className={styles.detailLabel}>文件大小限制</div>
                                <div className={styles.detailValue}>
                                    {selectedTask.maxFileSize ? `${selectedTask.maxFileSize} MB` : "未设置"}
                                </div>
                            </div>
                            <div className={styles.detailGroup}>
                                <div className={styles.detailLabel}>允许文件格式</div>
                                <div className={styles.detailValue}>
                                    {selectedTask.allowedTypes?.join(", ") || "不限"}
                                </div>
                            </div>
                        </div>
                        <div className={styles.detailGroup}>
                            <div className={styles.detailLabel}>任务描述</div>
                            <div
                                className={styles.detailValue}
                                style={{
                                    background: "var(--bg-secondary)",
                                    padding: "12px",
                                    borderRadius: "6px",
                                    minHeight: "80px",
                                }}
                            >
                                {selectedTask.description || "暂无描述"}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div
                        style={{
                            textAlign: "center",
                            color: "var(--text-secondary)",
                            padding: "40px",
                        }}
                    >
                        未选择任务
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default OrganizationTabs;
