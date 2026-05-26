import React, { useState, useEffect, useMemo } from "react";
import {
  FaFilter,
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaUsers,
} from "react-icons/fa";
import CustomSelect from "../../components/customSelect/CustomSelect";
import Input from "../../components/input/Input";
import Button from "../../components/button/Button";
import Loading from "../../components/loading/Loading";
import Avatar from "../../components/avatar/Avatar";
import Modal from "../../components/modal/Modal";
import { confirm } from "../../components/confirm/Confirm";
import message from "../../components/message/Message";
import type { SelectOption } from "../../types/index";
import styles from "./UserManagement.module.css";
import { AuthService } from "../../services/authService";
import { formatToChinaTime } from "../../utils/utils";

// 用户接口定义
interface UserListItem {
  id: string | number;
  username: string;
  email: string;
  avatar: string;
  role: number;
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

const MAP_STR_ROLE_NUM: Record<string, number> = {
  admin: 2,
  editor: 3,
  checker: 4,
  user: 1,
};

const MAP_NUM_ROLE_STR: Record<number, string> = {
  2: "管理员",
  3: "编辑",
  4: "审核者",
  1: "普通用户",
};

const MAP_ROLE_CSS: Record<number, string> = {
  1: "user",
  2: "admin",
  3: "editor",
  4: "checker",
};

const UserManagement: React.FC = () => {
  // 状态管理
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    newUsers: 0,
    inactiveUsers: 0,
  });
  const [filters, setFilters] = useState<FilterOptions>({
    search: "",
    role: "",
    status: "",
    dateRange: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    account: "",
    email: "",
    passwd: "",
    role: 1,
    state: 1,
  });
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
  const [detailUser, setDetailUser] = useState<UserListItem | null>(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);

  const usersPerPage = 15; // 每页显示15条数据

  // 加载统计数据
  const fetchStats = async () => {
    try {
      const statsRsp = await AuthService.getAdminUserStats();
      setStats({
        totalUsers: statsRsp.total_users,
        activeUsers: statsRsp.active_users,
        newUsers: statsRsp.new_users_30d,
        inactiveUsers: statsRsp.inactive_users,
      });
    } catch (error) {
      console.error("获取用户统计失败:", error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // 加载用户数据
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const dateRangeMap: Record<string, number> = {
          "7days": 7,
          "30days": 30,
          "90days": 90,
        };

        const params: any = {
          page_num: currentPage,
          page_size: usersPerPage,
        };

        if (filters.role) params.role = MAP_STR_ROLE_NUM[filters.role];
        // 假设 1=active, 2=inactive (根据实际后端定义调整)
        if (filters.status) params.state = filters.status === "active" ? 1 : 2;
        if (filters.dateRange) params.regis_range = dateRangeMap[filters.dateRange];

        const rsp = await AuthService.listUsersAdmin(params);

        let fetchedUsers: UserListItem[] = [];
        if (Array.isArray(rsp.list) && rsp.list.length > 0) {
          fetchedUsers = rsp.list.map((user) => ({
            id: user.id,
            username: user.name,
            email: user.email,
            avatar: user.avatar || `https://picsum.photos/id/${(Number(user.id) % 100) + 1}/80`,
            role: user.role,
            status: user.state === 1 ? "active" : "inactive",
            createdAt: formatToChinaTime(user.create_time),
            lastLogin: formatToChinaTime(user.login_time),
            articleCount: 0, // 随机文章数，实际应从接口获取
            commentCount: 0, // 随机评论数，实际应从接口获取
          }));
        }
        setUsers(fetchedUsers);
        setTotalUsers(rsp.total);
      } catch (error) {
        console.error("获取用户列表失败:", error);
        // 可以添加错误提示
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentPage, filters.role, filters.status, filters.dateRange]);

  // 筛选用户数据
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // 搜索筛选
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        if (!user.username.toLowerCase().includes(searchTerm) && !user.email.toLowerCase().includes(searchTerm)) {
          return false;
        }
      }
      return true;
    });
  }, [users, filters.search]);

  // 分页计算
  const totalPages = Math.ceil(totalUsers / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + users.length;
  const currentUsers = filteredUsers;

  // 筛选选项数据
  const roleOptions: SelectOption[] = [
    { id: "", name: "全部角色", color: "#6c757d" },
    { id: "admin", name: "管理员", color: "#dc3545" },
    { id: "checker", name: "审核者", color: "#28a745" },
    { id: "editor", name: "编辑", color: "#ffc107" },
    { id: "user", name: "普通用户", color: "#007bff" },
  ];

  const statusOptions: SelectOption[] = [
    { id: "", name: "全部状态", color: "#6c757d" },
    { id: "active", name: "活跃", color: "#28a745" },
    { id: "inactive", name: "非活跃", color: "#ffc107" },
  ];

  const createRoleOptions: SelectOption[] = [
    { id: "1", name: "普通用户", color: "#007bff" },
    { id: "2", name: "管理员", color: "#dc3545" },
    { id: "3", name: "编辑", color: "#ffc107" },
    { id: "4", name: "审核者", color: "#28a745" },
  ];

  const createStateOptions: SelectOption[] = [
    { id: "1", name: "活跃", color: "#28a745" },
    { id: "2", name: "非活跃", color: "#ffc107" },
  ];

  const dateRangeOptions: SelectOption[] = [
    { id: "", name: "全部时间", color: "#6c757d" },
    { id: "7days", name: "最近7天", color: "#17a2b8" },
    { id: "30days", name: "最近30天", color: "#17a2b8" },
    { id: "90days", name: "最近90天", color: "#17a2b8" },
  ];

  // 处理CustomSelect选择
  const handleSelectChange = (field: keyof FilterOptions) => {
    return (selectedOption: SelectOption | null) => {
      setFilters((prev) => ({
        ...prev,
        [field]: selectedOption?.id || "",
      }));
      setCurrentPage(1);
    };
  };

  // 处理筛选条件变化（用于搜索框）
  const handleFilterChange = (field: keyof FilterOptions, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // 清除筛选条件
  const clearFilters = () => {
    setFilters({
      search: "",
      role: "",
      status: "",
      dateRange: "",
    });
    setCurrentPage(1);
  };

  // 打开创建用户模态框
  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      account: "",
      email: "",
      passwd: "",
      role: 1,
      state: 1,
    });
    setIsModalVisible(true);
  };

  // 打开编辑用户模态框
  const openEditModal = (user: UserListItem) => {
    setEditingUser(user);
    setFormData({
      account: user.username,
      email: user.email,
      passwd: "",
      role: user.role,
      state: user.status === "active" ? 1 : 2,
    });
    setIsModalVisible(true);
  };

  // 打开查看详情模态框
  const openDetailModal = (user: UserListItem) => {
    setDetailUser(user);
    setIsDetailVisible(true);
  };

  // 提交表单（创建/编辑）
  const handleFormSubmit = async () => {
    if (!formData.account.trim()) {
      message.error("请输入用户名");
      return;
    }
    if (!formData.email.trim()) {
      message.error("请输入邮箱");
      return;
    }
    if (!editingUser && (!formData.passwd || formData.passwd.length < 6)) {
      message.error("密码至少需要6位");
      return;
    }

    setSubmitting(true);
    try {
      if (editingUser) {
        // 编辑模式
        const updateParams: any = {
          user_id: editingUser.id,
          account: formData.account.trim(),
          email: formData.email.trim(),
          role: formData.role,
          state: formData.state,
        };
        if (formData.passwd) {
          updateParams.passwd = formData.passwd;
        }
        await AuthService.updateUserAdmin(updateParams);
        message.success("用户信息已更新");
      } else {
        // 创建模式
        await AuthService.createUserAdmin({
          account: formData.account.trim(),
          email: formData.email.trim(),
          passwd: formData.passwd,
          role: formData.role,
          state: formData.state,
        });
        message.success("用户创建成功");
      }
      setIsModalVisible(false);
      // 刷新用户列表
      const rsp = await AuthService.listUsersAdmin({ page_num: 1, page_size: usersPerPage });
      let fetchedUsers: UserListItem[] = [];
      if (Array.isArray(rsp.list) && rsp.list.length > 0) {
        fetchedUsers = rsp.list.map((user) => ({
          id: user.id,
          username: user.name,
          email: user.email,
          avatar: user.avatar || `https://picsum.photos/id/${(Number(user.id) % 100) + 1}/80`,
          role: user.role,
          status: user.state === 1 ? "active" : "inactive",
          createdAt: formatToChinaTime(user.create_time),
          lastLogin: formatToChinaTime(user.login_time),
          articleCount: 0,
          commentCount: 0,
        }));
      }
      setUsers(fetchedUsers);
      setTotalUsers(rsp.total);
      fetchStats();
    } catch (error: any) {
      message.error(error.message || (editingUser ? "更新用户失败" : "创建用户失败"));
    } finally {
      setSubmitting(false);
    }
  };

  // 删除用户
  const deleteUser = async (userId: string | number) => {
    const isConfirmed = await confirm({
      title: "确认删除",
      content: "确定要删除这个用户吗？此操作不可恢复。",
      confirmText: "删除",
      cancelText: "取消",
    });
    if (!isConfirmed) return;

    try {
      await AuthService.deleteUserAdmin(userId);
      message.success("用户已删除");
      setUsers((prev) => prev.filter((user) => user.id !== userId));
      setTotalUsers((prev) => prev - 1);
      fetchStats();
    } catch (error: any) {
      message.error(error.message || "删除用户失败");
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
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
          <p className={styles.pageDescription}>管理系统中的所有用户账户，包括权限设置和状态管理</p>
        </div>
        <div className={styles.headerActions}>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={openCreateModal}>
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
            <button className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`} onClick={clearFilters}>
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
              onChange={(value) => handleFilterChange("search", value)}
              allowClear={true}
              size="large"
              style={{ minHeight: "46px", height: "50px" }}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>用户角色</label>
            <CustomSelect
              name="用户角色"
              options={roleOptions}
              value={roleOptions.find((option) => option.id === filters.role) || null}
              onChange={handleSelectChange("role")}
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
              value={statusOptions.find((option) => option.id === filters.status) || null}
              onChange={handleSelectChange("status")}
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
              value={dateRangeOptions.find((option) => option.id === filters.dateRange) || null}
              onChange={handleSelectChange("dateRange")}
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
            <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>共 {totalUsers} 个用户</span>
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
            {currentUsers.length > 0 ? (
              currentUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className={styles.userInfo}>
                      <Avatar src={user.avatar} name={user.username} size={40} />
                      <div className={styles.userDetails}>
                        <div className={styles.userName}>{user.username}</div>
                        <div className={styles.userEmail}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.roleBadge} ${styles[MAP_ROLE_CSS[user.role] || "user"]}`}>
                      {MAP_NUM_ROLE_STR[user.role] || user.role}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles[user.status]}`}>
                      <span className={styles.statusIndicator}></span>
                      {user.status === "active" ? "活跃" : user.status === "inactive" ? "非活跃" : "待审核"}
                    </span>
                  </td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>{formatDate(user.lastLogin)}</td>
                  <td>{user.articleCount}</td>
                  <td>{user.commentCount}</td>
                  <td>
                    <div className={styles.actionButtons}>
                      <button className={`${styles.actionButton} ${styles.edit}`} title="编辑用户" onClick={() => openEditModal(user)}>
                        <FaEdit />
                      </button>
                      <button className={`${styles.actionButton} ${styles.edit}`} title="查看详情" onClick={() => openDetailModal(user)}>
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
              ))
            ) : (
              <tr>
                <td
                  colSpan={8}
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

        {/* 分页 */}
        {totalPages >= 1 && (
          <div className={styles.paginationContainer}>
            <div className={styles.paginationInfo}>
              显示 {startIndex + 1} - {Math.min(endIndex, totalUsers)} 条， 共 {totalUsers} 条记录
            </div>
            <div className={styles.paginationControls}>
              <button className={styles.paginationButton} onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
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

      {/* 创建/编辑用户模态框 */}
      <Modal
        visible={isModalVisible}
        title={editingUser ? "编辑用户" : "添加用户"}
        onClose={() => setIsModalVisible(false)}
        width={560}
        footer={
          <>
            <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setIsModalVisible(false)} disabled={submitting}>
              取消
            </button>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleFormSubmit} disabled={submitting}>
              {submitting ? "保存中..." : editingUser ? "保存修改" : "确认创建"}
            </button>
          </>
        }
      >
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>用户名 *</label>
          <Input
            placeholder="请输入用户名"
            value={formData.account}
            onChange={(value) => setFormData({ ...formData, account: value })}
            className={styles.formInput}
            size="large"
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>邮箱 *</label>
          <Input
            placeholder="请输入邮箱地址"
            value={formData.email}
            onChange={(value) => setFormData({ ...formData, email: value })}
            className={styles.formInput}
            size="large"
            type="email"
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>密码{editingUser ? "" : " *"}</label>
          <Input
            placeholder={editingUser ? "留空则不修改密码" : "请输入密码（至少6位）"}
            value={formData.passwd}
            onChange={(value) => setFormData({ ...formData, passwd: value })}
            className={styles.formInput}
            size="large"
            type="password"
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>用户角色 *</label>
          <CustomSelect
            name="用户角色"
            options={createRoleOptions}
            value={createRoleOptions.find((o) => Number(o.id) === formData.role) || null}
            onChange={(option) => setFormData({ ...formData, role: option ? Number(option.id) : 1 })}
            placeholder="选择角色..."
            hideBadge={true}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>账户状态</label>
          <CustomSelect
            name="账户状态"
            options={createStateOptions}
            value={createStateOptions.find((o) => Number(o.id) === formData.state) || null}
            onChange={(option) => setFormData({ ...formData, state: option ? Number(option.id) : 1 })}
            placeholder="选择状态..."
            hideBadge={true}
          />
        </div>
      </Modal>

      {/* 查看用户详情模态框 */}
      <Modal
        visible={isDetailVisible}
        title="用户详情"
        onClose={() => setIsDetailVisible(false)}
        width={520}
        footer={
          <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setIsDetailVisible(false)}>
            关闭
          </button>
        }
      >
        {detailUser && (
          <div style={{ padding: "8px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
              <Avatar src={detailUser.avatar} name={detailUser.username} size={64} />
              <div>
                <div style={{ fontSize: "18px", fontWeight: 600 }}>{detailUser.username}</div>
                <div style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "2px" }}>{detailUser.email}</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "4px" }}>角色</div>
                <div style={{ fontSize: "15px", fontWeight: 500 }}>
                  <span className={`${styles.roleBadge} ${styles[MAP_ROLE_CSS[detailUser.role] || "user"]}`}>
                    {MAP_NUM_ROLE_STR[detailUser.role] || detailUser.role}
                  </span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "4px" }}>状态</div>
                <div style={{ fontSize: "15px" }}>
                  <span className={`${styles.statusBadge} ${styles[detailUser.status]}`}>
                    <span className={styles.statusIndicator}></span>
                    {detailUser.status === "active" ? "活跃" : detailUser.status === "inactive" ? "非活跃" : "待审核"}
                  </span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "4px" }}>注册时间</div>
                <div style={{ fontSize: "15px" }}>{detailUser.createdAt}</div>
              </div>
              <div>
                <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "4px" }}>最后登录</div>
                <div style={{ fontSize: "15px" }}>{detailUser.lastLogin}</div>
              </div>
              <div>
                <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "4px" }}>文章数</div>
                <div style={{ fontSize: "15px" }}>{detailUser.articleCount}</div>
              </div>
              <div>
                <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "4px" }}>评论数</div>
                <div style={{ fontSize: "15px" }}>{detailUser.commentCount}</div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UserManagement;
