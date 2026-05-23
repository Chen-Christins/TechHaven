import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { decodeId } from "../../utils/hashId";
import Navbar from "../../components/navbar/Navbar";
import Footer from "../../components/footer/Footer";
import OrganizationDetailSkeleton from "../../components/organization/OrganizationDetailSkeleton";
import AuthRequired from "../../components/auth/AuthRequired";
import { useAuth } from "../../contexts/AuthContext";
import styles from "./OrganizationDetail.module.css";
import OrganizationService from "../../services/organizationService";
import type { GetOrganizationDetailResponse, JoinOrganizationResponse } from "../../services/organizationService";
import message from "../../components/message/Message";
import { confirm } from "../../components/confirm/Confirm";
import OrganizationInfo from "../../components/organization/OrganizationInfo";
import OrganizationTabs from "../../components/organization/OrganizationTabs";
import type { Member, OrganizationDetail as OrganizationDetailType, MemberStats, Task } from "../../components/organization/types";
import { FaUser, FaUserShield, FaCrown, FaUserCheck, FaCode } from "react-icons/fa";
import Input from "../../components/input/Input";
import DatePicker from "../../components/input/DatePicker";
import CustomSelect from "../../components/customSelect/CustomSelect";
import Modal from "../../components/modal/Modal";
import AssignmentService from "../../services/assignmentService";
// import type { Assignment } from '../../types';

const MAP_STATUS_TO_TEXT: Record<number, string> = {
  0: "申请中",
  1: "已加入",
  2: "已拒绝",
  3: "已退出",
};

const MAP_ROLE_TO_TEXT: Record<number, string> = {
  1: "普通成员",
  2: "报告者",
  3: "开发者",
  4: "研发主管",
  5: "组织管理员",
};

// 状态映射
const STATE_STR_MAP_NUMBER: Record<string, number> = {
  draft: 0,
  active: 1,
  closed: 2,
};

const STATE_NUMBER_MAP_STR: Record<number, string> = {
  0: "draft",
  1: "active",
  2: "closed",
};

// 优先级映射
const PRIORITY_STR_MAP_NUMBER: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 3,
  urgent: 4,
};

const PRIORITY_NUMBER_MAP_STR: Record<number, string> = {
  1: "low",
  2: "medium",
  3: "high",
  4: "urgent",
};

const PAGE_SIZE = 15;
const TASKS_PAGE_SIZE = 15; // 任务列表每页显示的条数

const OrganizationDetail: React.FC = () => {
  const { id: encodedId } = useParams<{ id: string }>();
  const id = encodedId ? decodeId(encodedId) : null;
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [org, setOrg] = useState<OrganizationDetailType | null>(null);
  const [page, setPage] = useState(1);
  const [membersTotal, setMembersTotal] = useState(0);
  const [stats, setStats] = useState<MemberStats>({
    totalMembers: 0,
    activeMembers: 0,
    orgAdminMembers: 0,
    devLeadMembers: 0,
    regularMembers: 0,
  });
  const [userRole, setUserRole] = useState<"leader" | "admin" | "member" | "guest" | null>(null);
  const [showPendingRequests, setShowPendingRequests] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<Member[]>([]);
  const [pendingRequestsLoading, setPendingRequestsLoading] = useState(false);
  const [pendingRequestsPage, setPendingRequestsPage] = useState(1);
  const [pendingRequestsTotal, setPendingRequestsTotal] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // 用于强制刷新的触发器
  const [isRefreshing, setIsRefreshing] = useState(false); // 刷新状态
  const [pendingRequestsRefreshTrigger, setPendingRequestsRefreshTrigger] = useState(0); // 用于强制刷新待处理请求的触发器
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [taskPreviewModalVisible, setTaskPreviewModalVisible] = useState(false);
  const [memberPreviewModalVisible, setMemberPreviewModalVisible] = useState(false);
  const [taskCreateModalVisible, setTaskCreateModalVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
  const [selectedRole, setSelectedRole] = useState(1);
  // 任务表单数据
  const [taskFormData, setTaskFormData] = useState({
    title: "",
    description: "",
    courseName: "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    due_date: "",
    maxFileSize: 0,
    status: "draft" as "draft" | "active" | "closed",
    assignee: "",
    allowedTypes: [] as string[],
  });
  // 文件格式输入框和允许类型
  const [allowedTypesInput, setAllowedTypesInput] = useState("");
  const [allowedTypes, setAllowedTypes] = useState<string[]>([]);
  // 任务相关状态
  const [showTasks, setShowTasks] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksPage, setTasksPage] = useState(1);
  const [tasksTotal, setTasksTotal] = useState(0);

  // Determine if current user is admin/leader of the organization
  // Role thresholds: 5=组织管理员→leader, 4=研发主管→admin, 1-3=member, 0/undefined=guest
  const checkUserRole = useCallback(
    (role: number | undefined) => {
      if (!currentUser) return null;
      if (!role || role === 0) return "guest";
      if (role >= 5) return "leader";
      if (role === 4) return "admin";
      return "member";
    },
    [currentUser],
  );

  // 获取组织详情
  useEffect(() => {
    const fetchDetail = async () => {
      if (!currentUser) return;
      setLoading(true);
      try {
        if (!id) throw new Error("无效的组织ID");
        const res: GetOrganizationDetailResponse = await OrganizationService.getOrganizationDetail({ id });
        // 只填充基础信息，不填充成员，不主动请求成员列表
        const orgDetail: OrganizationDetailType = {
          id: String(res.id),
          name: res.name,
          type: res.type,
          status: res.status === 1 || res.status === "active" ? "active" : "inactive",
          description: res.description,
          memberCount: 0,
          members: [],
          user_in_org:
            typeof res.user_in_org !== "undefined" && res.user_in_org >= 0 ? MAP_STATUS_TO_TEXT[res.user_in_org] : undefined,
          user_role: typeof res.user_role !== "undefined" && res.user_role > 0 ? MAP_ROLE_TO_TEXT[res.user_role] : undefined,
        };
        setOrg(orgDetail);
        const role = checkUserRole(res.user_role);
        setUserRole(role);
      } catch (e) {
        message.error("获取组织详情失败");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id, currentUser, checkUserRole]);

  // Function to fetch organization members using the new API (真正分页)
  const fetchMembersList = useCallback(
    async (pageNum: number = 1) => {
      if (!currentUser || !id) return;

      // 设置刷新状态
      setIsRefreshing(true);

      try {
        const res = await OrganizationService.getOrganizationUserLists({
          id: id,
          page_num: pageNum,
          page_size: PAGE_SIZE,
          status: 1, // status 1 means approved/active members
        });
        if (res && res.list) {
          const members: Member[] = res.list.map((item) => ({
            id: String(item.id),
            user_id: String(item.user_id),
            name: item.name,
            avatar: item.avatar,
            role: MAP_ROLE_TO_TEXT[item.role],
            status: "active",
            email: item.email,
            joinTime: new Date(item.join_time * 1000).toISOString().split("T")[0],
          }));

          setMembersTotal(res.total || 0);
          setStats({
            totalMembers: res.total || 0,
            activeMembers: members.length,
            orgAdminMembers: members.filter((m) => m.role === "组织管理员").length,
            devLeadMembers: members.filter((m) => m.role === "研发主管").length,
            regularMembers: members.filter((m) => m.role === "普通成员").length,
          });

          setOrg((prevOrg) => (prevOrg ? { ...prevOrg, members, memberCount: res.total || 0 } : prevOrg));
        } else if (res && res.list && res.list.length === 0) {
          // 如果有响应但列表为空，更新为空状态
          setMembersTotal(0);
          setStats({
            totalMembers: 0,
            activeMembers: 0,
            orgAdminMembers: 0,
            devLeadMembers: 0,
            regularMembers: 0,
          });

          setOrg((prevOrg) => (prevOrg ? { ...prevOrg, members: [], memberCount: 0 } : prevOrg));
        }
        // 如果没有响应数据，保持当前状态不变，避免清空已有数据
      } catch (error) {
        console.error("获取组织成员列表失败:", error);
        message.error("获取成员列表失败");

        // 在错误情况下，不清空已有数据，保持当前状态
        // 这样可以避免网络错误导致成员列表突然消失
      } finally {
        // 确保在完成请求后重置刷新状态
        setIsRefreshing(false);
      }
    },
    [id, currentUser],
  );

  // 成员列表
  useEffect(() => {
    if (!id || !currentUser) return;
    // 只有在成员列表标签页（非待处理请求）才加载成员
    if (!showPendingRequests && !showTasks) {
      fetchMembersList(page);
    }
  }, [id, currentUser, org?.id, page, refreshTrigger, showPendingRequests, showTasks, fetchMembersList]);

  // 待处理请求
  useEffect(() => {
    if (!id || !currentUser) return;
    if (showPendingRequests && (userRole === "leader" || userRole === "admin")) {
      fetchPendingRequests(pendingRequestsPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, currentUser, org?.id, showPendingRequests, pendingRequestsPage, pendingRequestsRefreshTrigger]);

  // Function to fetch pending join requests if user is an admin/leader (真正分页)
  const fetchPendingRequests = async (pageNum: number = 1) => {
    if (!currentUser || !id || !userRole || (userRole !== "leader" && userRole !== "admin")) return;
    setPendingRequestsLoading(true);
    try {
      const pendingRes = await OrganizationService.getOrganizationUserLists({
        id: id,
        page_num: pageNum,
        page_size: PAGE_SIZE,
        status: 0,
      });
      const pendingRequests: (Member & { user_id: string })[] = (pendingRes.list || []).map((item) => ({
        id: String(item.id),
        name: item.name,
        avatar: item.avatar,
        role: "pending",
        status: "active",
        email: item.email,
        joinTime: new Date(item.join_time * 1000).toISOString().split("T")[0],
        user_id: String(item.user_id),
      }));
      setPendingRequestsTotal(pendingRes.total || pendingRequests.length);
      setPendingRequests(pendingRequests);
    } catch (err) {
      console.error("获取待处理请求失败:", err);
      message.error("获取待处理请求失败");
    } finally {
      setPendingRequestsLoading(false);
    }
  };

  // Function to handle accept/reject a pending request
  const handleActionPendingRequest = async (requestId: string, action: "accept" | "reject") => {
    const ok = await confirm({
      title: action === "accept" ? "确认接受" : "确认拒绝",
      content: action === "accept" ? "确定要接受该用户加入组织吗？" : "确定要拒绝该用户加入组织吗？",
      confirmText: action === "accept" ? "接受" : "拒绝",
      cancelText: "取消",
    });
    if (!ok) return;

    try {
      // 审核接口 state: 1=同意, 2=拒绝
      const state = action === "accept" ? 1 : 2;
      // 查找 user_id
      const pending = pendingRequests.find((req) => req.id === requestId);
      if (!pending) throw new Error("未找到待处理用户");
      await OrganizationService.organizationJoinCheck({
        user_id: String(pending.user_id ?? ""),
        org_id: id!,
        state,
        role: 1, // 新成员默认为普通成员
      });
      // Update local state to remove the request
      setPendingRequests((prev) => prev.filter((req) => req.id !== requestId));

      if (action === "accept") {
        message.success("已接受用户加入组织");
      } else {
        message.success("已拒绝用户加入组织");
      }
      // 审核后刷新待处理请求列表
      setPendingRequestsRefreshTrigger((prev) => prev + 1);
      // 如果接受请求，同时更新组织详情以获取最新的成员计数
      if (action === "accept" && id && currentUser) {
        const res: GetOrganizationDetailResponse = await OrganizationService.getOrganizationDetail({ id: id! });
        setOrg((prevOrg) =>
          prevOrg
            ? {
                ...prevOrg,
                user_in_org:
                  typeof res.user_in_org !== "undefined" && res.user_in_org >= 0 ? MAP_STATUS_TO_TEXT[res.user_in_org] : undefined,
                user_role: typeof res.user_role !== "undefined" && res.user_role > 0 ? MAP_ROLE_TO_TEXT[res.user_role] : undefined,
              }
            : prevOrg,
        );
      }
    } catch (err) {
      console.error(action === "accept" ? "接受请求失败" : "拒绝请求失败:", err);
      message.error(action === "accept" ? "接受请求失败" : "拒绝请求失败");
    }
  };

  // Function to handle kicking a member
  const handleKickMember = async (member: Member) => {
    const ok = await confirm({
      title: "确认踢出",
      content: `确定要将 ${member.name} 踢出组织吗？`,
      confirmText: "踢出",
      cancelText: "取消",
    });
    if (!ok) return;

    try {
      await OrganizationService.kickOrganizationMember({
        id: member.id,
        user_id: member.user_id,
        org_id: id!,
      });

      // Remove member from local state
      setOrg((prevOrg: OrganizationDetailType | null) =>
        prevOrg
          ? {
              ...prevOrg,
              members: prevOrg.members.filter((m: Member) => m.id !== member.id),
              memberCount: Math.max(0, prevOrg.memberCount - 1),
            }
          : prevOrg,
      );

      // Update stats
      setStats((prevStats) => ({
        ...prevStats,
        totalMembers: Math.max(0, prevStats.totalMembers - 1),
        activeMembers: Math.max(0, prevStats.activeMembers - 1),
        orgAdminMembers: member.role === "组织管理员" ? Math.max(0, prevStats.orgAdminMembers - 1) : prevStats.orgAdminMembers,
        devLeadMembers: member.role === "研发主管" ? Math.max(0, prevStats.devLeadMembers - 1) : prevStats.devLeadMembers,
        regularMembers: member.role === "普通成员" ? Math.max(0, prevStats.regularMembers - 1) : prevStats.regularMembers,
      }));

      message.success(`已将 ${member.name} 踢出组织`);
    } catch (err) {
      message.error("踢出成员失败");
    }
  };

  // Function to handle setting member role
  const handleSetMemberRole = (member: Member) => {
    const roleOptions = [
      { value: 1, label: "普通成员" },
      { value: 2, label: "报告者" },
      { value: 3, label: "开发者" },
      { value: 4, label: "研发主管" },
      { value: 5, label: "组织管理员" },
    ];

    const currentRole = roleOptions.find((r) => r.label === member.role)?.value || 1;

    setSelectedMember(member);
    setSelectedRole(currentRole);
    setRoleModalVisible(true);
  };

  // Function to confirm role selection
  const handleConfirmRole = async () => {
    if (!selectedMember) return;

    const roleOptions = [
      { value: 1, label: "普通成员" },
      { value: 2, label: "报告者" },
      { value: 3, label: "开发者" },
      { value: 4, label: "研发主管" },
      { value: 5, label: "组织管理员" },
    ];

    const currentRole = roleOptions.find((r) => r.label === selectedMember.role)?.value || 1;

    if (selectedRole === currentRole) {
      message.warn("该用户已经是这个角色");
      setRoleModalVisible(false);
      return;
    }

    try {
      await OrganizationService.setOrganizationMemberRole({
        id: selectedMember.id,
        user_id: selectedMember.user_id!,
        org_id: id!,
        role: selectedRole,
      });

      // Update member role in local state
      setOrg((prevOrg: OrganizationDetailType | null) =>
        prevOrg
          ? {
              ...prevOrg,
              members: prevOrg.members.map((m: Member) =>
                m.id === selectedMember.id ? { ...m, role: MAP_ROLE_TO_TEXT[selectedRole] } : m,
              ),
            }
          : prevOrg,
      );

      // Update stats
      const oldRoleLabel = selectedMember.role;
      const newRoleLabel = MAP_ROLE_TO_TEXT[selectedRole];

      setStats((prevStats) => {
        const newStats = { ...prevStats };

        // Decrease old role count
        if (oldRoleLabel === "组织管理员") newStats.orgAdminMembers = Math.max(0, newStats.orgAdminMembers - 1);
        else if (oldRoleLabel === "研发主管") newStats.devLeadMembers = Math.max(0, newStats.devLeadMembers - 1);
        else if (oldRoleLabel === "普通成员") newStats.regularMembers = Math.max(0, newStats.regularMembers - 1);

        // Increase new role count
        if (newRoleLabel === "组织管理员") newStats.orgAdminMembers += 1;
        else if (newRoleLabel === "研发主管") newStats.devLeadMembers += 1;
        else if (newRoleLabel === "普通成员") newStats.regularMembers += 1;

        return newStats;
      });

      message.success(`已将 ${selectedMember.name} 的角色设置为 ${newRoleLabel}`);
      setRoleModalVisible(false);
    } catch (err) {
      console.error("设置角色失败:", err);
      message.error("设置角色失败");
    }
  };

  // Function to check if current user can manage a specific member
  const canManageMember = (member: Member) => {
    if (!userRole || userRole === "guest" || userRole === "member") return false;

    // 研发主管不能管理组织管理员和自己
    if (userRole === "admin") {
      if (member.role === "组织管理员") return false;
      if (member.name === currentUser?.name) return false;
    }

    // 组织管理员不能管理自己
    if (userRole === "leader" && member.name === currentUser?.name) return false;

    return true;
  };

  // Function to check if current user can set role for a specific member
  const canSetRole = (member: Member) => {
    if (!userRole || userRole === "guest" || userRole === "member") return false;

    // 研发主管不能设置组织管理员的角色，也不能设置自己的角色
    if (userRole === "admin") {
      if (member.role === "组织管理员") return false;
      if (member.name === currentUser?.name) return false;
      return true;
    }

    // 组织管理员可以设置任何人的角色（除了自己）
    if (userRole === "leader") {
      return member.name !== currentUser?.name;
    }

    return false;
  };

  // Function to get available role options based on current user's role
  const getAvailableRoleOptions = () => {
    if (userRole === "admin") {
      // 研发主管只能设置普通成员/报告者/开发者
      return [
        { value: 1, label: "普通成员", icon: <FaUser />, description: "基础成员权限" },
        { value: 2, label: "报告者", icon: <FaUserCheck />, description: "可创建需求和缺陷" },
        { value: 3, label: "开发者", icon: <FaCode />, description: "可参与开发工作" },
      ];
    } else if (userRole === "leader") {
      // 组织管理员可以设置任何角色
      return [
        { value: 1, label: "普通成员", icon: <FaUser />, description: "基础成员权限" },
        { value: 2, label: "报告者", icon: <FaUserCheck />, description: "可创建需求和缺陷" },
        { value: 3, label: "开发者", icon: <FaCode />, description: "可参与开发工作" },
        { value: 4, label: "研发主管", icon: <FaUserShield />, description: "可管理所有工单" },
        { value: 5, label: "组织管理员", icon: <FaCrown />, description: "组织最高权限" },
      ];
    }
    return [];
  };
  // 任务相关函数
  const fetchTasksList = useCallback(
    async (pageNum: number = 1) => {
      if (!currentUser || !id) return;

      setTasksLoading(true);
      try {
        // 使用真实的组织任务列表接口
        const status = -1; // -1表示获取所有状态的任务
        const response = await AssignmentService.getOrganizationAssignments({
          org_id: id,
          page_num: pageNum,
          page_size: TASKS_PAGE_SIZE,
          status: status,
        });
        console.log("任务列表响应:", response);
        const list = response.list || [];
        // 转换接口数据为Task类型
        const taskList: Task[] = list.map((item) => {
          return {
            id: String(item.id),
            title: item.name,
            description: item.description,
            priority: PRIORITY_NUMBER_MAP_STR[item.priority] as "low" | "medium" | "high" | "urgent",
            assignee: "", // 接口中没有assignee信息，暂时留空
            assignee_name: item.assigned_by || undefined,
            status: STATE_NUMBER_MAP_STR[item.status] as "draft" | "active" | "closed",
            creator: "", // 接口中没有creator信息，暂时留空
            creator_name: item.assigned_by || "未知",
            created_at: new Date(item.end_time * 1000).toISOString(),
            updated_at: new Date(item.end_time * 1000).toISOString(),
            due_date: new Date(item.end_time * 1000).toISOString(),
            allowedTypes: item.file_type ? item.file_type.split(",") : [],
            org_id: id,
            assign_id: item.assign_id || "",
            courseName: item.subject_name,
            maxFileSize: item.max_size,
            deadline: new Date(item.end_time * 1000).toLocaleString("zh-CN"),
          };
        });

        // 分页时总是替换任务列表
        setTasks(taskList);
        setTasksTotal(response.total);
        setTasksPage(pageNum);
      } catch (error) {
        console.error("获取任务列表失败:", error);
        message.error("获取任务列表失败");
      } finally {
        setTasksLoading(false);
      }
    },
    [currentUser, id],
  );

  // 监听showTasks变化，当切换到任务标签页时自动加载任务列表
  useEffect(() => {
    if (showTasks && id && currentUser) {
      // 每次切换到任务标签页都重新加载，确保数据最新
      fetchTasksList(1);
    }
  }, [showTasks, id, currentUser, fetchTasksList]);

  // 创建任务
  const handleCreateTask = () => {
    setSelectedTask(null);
    setTaskFormData({
      title: "",
      description: "",
      priority: "medium",
      due_date: "",
      assignee: "",
      maxFileSize: 0,
      courseName: "",
      status: "draft",
      allowedTypes: [] as string[],
    });
    // 同时清空文件格式相关的状态
    setAllowedTypesInput("");
    setAllowedTypes([]);
    setTaskCreateModalVisible(true);
  };

  // 预览任务
  const handleViewTask = (_task: Task) => {
    setTaskPreviewModalVisible(true);
    setSelectedTask(_task);
  };

  // 预览成员
  const handleViewMember = (member: Member) => {
    setSelectedMember(member);
    setMemberPreviewModalVisible(true);
  };

  // 编辑任务
  const handleEditTask = (_task: Task) => {
    setSelectedTask(_task);
    const allowedTypes = _task.allowedTypes || [];
    setTaskFormData({
      title: _task.title,
      description: _task.description,
      priority: _task.priority,
      due_date: _task.due_date || "",
      assignee: _task.assignee || "",
      maxFileSize: _task.maxFileSize || 0,
      courseName: _task.courseName || "",
      status: _task.status || "draft",
      allowedTypes: allowedTypes,
    });
    // 同时设置allowedTypesInput和allowedTypes状态
    setAllowedTypesInput(allowedTypes.join(", "));
    setAllowedTypes(allowedTypes);
    setTaskCreateModalVisible(true);
  };

  // 提交任务表单
  const handleTaskSubmit = async () => {
    // 验证表单
    if (!taskFormData.title.trim()) {
      message.error("请输入任务标题");
      return;
    }
    if (!taskFormData.description.trim()) {
      message.error("请输入任务描述");
      return;
    }
    if (!taskFormData.courseName.trim()) {
      message.error("请输入所属类型");
      return;
    }
    if (!taskFormData.due_date) {
      message.error("请选择截止时间");
      return;
    }

    try {
      if (selectedTask) {
        // 编辑模式 - 使用创建接口带上assign_id来更新任务
        const endTime = Math.floor(new Date(taskFormData.due_date).getTime() / 1000);
        const status = STATE_STR_MAP_NUMBER[taskFormData.status || "draft"];
        const priority = PRIORITY_STR_MAP_NUMBER[taskFormData.priority || "medium"];

        await AssignmentService.createOrganizationAssignment({
          assign_id: selectedTask.assign_id, // 使用任务ID作为assign_id来更新
          org_id: id || "",
          name: taskFormData.title,
          subject_name: taskFormData.courseName,
          end_time: endTime,
          max_size: taskFormData.maxFileSize || 50,
          status: status,
          priority: priority,
          file_type: allowedTypes.join(","),
          description: taskFormData.description,
        });

        // 更新成功后，重新获取任务列表以确保数据同步
        await fetchTasksList(1);
        message.success("任务更新成功");
      } else {
        // 创建模式 - 调用真实的创建接口
        const endTime = Math.floor(new Date(taskFormData.due_date).getTime() / 1000);
        const status = STATE_STR_MAP_NUMBER[taskFormData.status || "draft"];
        const priority = PRIORITY_STR_MAP_NUMBER[taskFormData.priority || "medium"];

        const response = await AssignmentService.createOrganizationAssignment({
          org_id: id || "",
          name: taskFormData.title,
          subject_name: taskFormData.courseName,
          end_time: endTime,
          max_size: taskFormData.maxFileSize || 50,
          status: status,
          priority: priority,
          file_type: allowedTypes.join(",") || "",
          description: taskFormData.description,
        });

        // 创建成功后，添加新任务到列表
        const newTask: Task = {
          id: response.id,
          title: response.name,
          description: response.description,
          priority: taskFormData.priority,
          due_date: taskFormData.due_date,
          assignee: taskFormData.assignee,
          assignee_name: !response.assigned_by ? "待分配" : undefined,
          status: taskFormData.status || "draft",
          creator: currentUser?.id || "unknown",
          creator_name: currentUser?.name || "未知用户",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          assign_id: response.assign_id || "",
          org_id: id || 0,
          allowedTypes: taskFormData.allowedTypes || [],
          courseName: taskFormData.courseName,
          maxFileSize: taskFormData.maxFileSize || 50,
          deadline: taskFormData.due_date,
        };
        setTasks((prev) => [newTask, ...prev]);
        setTasksTotal((prev) => prev + 1);
        message.success("任务创建成功");
      }
      setTaskCreateModalVisible(false);
    } catch (error: any) {
      console.error("操作失败:", error);
      message.error(error.message || "操作失败");
    }
  };

  // 删除任务
  const handleDeleteTask = async (task: Task) => {
    const ok = await confirm({
      title: "确认删除",
      content: `确定要删除任务 "${task.title}" 吗？`,
      confirmText: "删除",
      cancelText: "取消",
    });
    if (!ok) return;

    try {
      // 使用真实的删除接口
      await AssignmentService.deleteAssignments({
        ids: String(task.assign_id),
      });

      // 删除成功后，重新获取任务列表以确保数据同步
      await fetchTasksList(tasksPage);
      message.success("任务删除成功");
    } catch (error) {
      console.error("删除任务失败:", error);
      message.error("删除任务失败");
    }
  };

  // 任务列表分页处理
  const handleTasksPageChange = (newPage: number) => {
    setTasksPage(newPage);
    fetchTasksList(newPage);
  };

  // 检查是否可以管理任务
  const canManageTask = () => {
    return userRole === "leader" || userRole === "admin";
  };

  const handleJoin = async () => {
    if (!currentUser) {
      message.warn("请先登录后再申请加入组织");
      return;
    }

    if (org?.status !== "active") {
      message.warn("该组织已停用，无法申请加入");
      return;
    }
    const ok = await confirm({
      title: "申请加入组织",
      content: "确定要申请加入该组织吗？",
      confirmText: "确认加入",
      cancelText: "取消",
    });
    if (!ok) return;
    try {
      // The join API returns updated organization information
      const joinRes: JoinOrganizationResponse = await OrganizationService.joinOrganization({ id: id! });

      // Update organization status but preserve existing member data
      setOrg((prevOrg: OrganizationDetailType | null) => {
        if (!prevOrg) return prevOrg;

        return {
          ...prevOrg,
          user_in_org:
            typeof joinRes.user_in_org !== "undefined" && joinRes.user_in_org >= 0
              ? MAP_STATUS_TO_TEXT[joinRes.user_in_org]
              : undefined,
        };
      });
      message.success("已申请加入组织");
    } catch (e) {
      message.error("申请加入失败");
      // Refresh the organization data to ensure consistency
      if (id && currentUser) {
        try {
          const res: GetOrganizationDetailResponse = await OrganizationService.getOrganizationDetail({ id });
          const orgDetail: OrganizationDetailType = {
            id: String(res.id),
            name: res.name,
            type: res.type,
            status: res.status === 1 || res.status === "active" ? "active" : "inactive",
            description: res.description,
            memberCount: Array.isArray((res as any).members) ? (res as any).members.length : 0,
            members: Array.isArray((res as any).members) ? (res as any).members : [],
            user_in_org: res.user_in_org ? MAP_STATUS_TO_TEXT[res.user_in_org] : undefined,
            user_role: typeof res.user_role !== "undefined" && res.user_role > 0 ? MAP_ROLE_TO_TEXT[res.user_role] : undefined,
          };
          setOrg(orgDetail);
          const role = checkUserRole(res.user_role);
          setUserRole(role);
        } catch (refreshError) {
          console.error("刷新组织数据失败:", refreshError);
        }
      }
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
              {org && (
                <>
                  <OrganizationInfo org={org} stats={stats} onJoin={handleJoin} />

                  <OrganizationTabs
                    org={org}
                    userRole={userRole}
                    currentUser={currentUser}
                    showPendingRequests={showPendingRequests}
                    showTasks={showTasks}
                    members={org?.members || []}
                    membersTotal={membersTotal}
                    page={page}
                    isRefreshing={isRefreshing}
                    pendingRequests={pendingRequests}
                    pendingRequestsTotal={pendingRequestsTotal}
                    pendingRequestsPage={pendingRequestsPage}
                    pendingRequestsLoading={pendingRequestsLoading}
                    tasks={tasks}
                    tasksTotal={tasksTotal}
                    tasksPage={tasksPage}
                    tasksLoading={tasksLoading}
                    roleModalVisible={roleModalVisible}
                    taskPreviewModalVisible={taskPreviewModalVisible}
                    memberPreviewModalVisible={memberPreviewModalVisible}
                    selectedMember={selectedMember}
                    selectedRole={selectedRole}
                    getAvailableRoleOptions={getAvailableRoleOptions}
                    onTabChange={(showPending, showTasks) => {
                      setShowPendingRequests(showPending);
                      setShowTasks(showTasks);
                    }}
                    onRefreshMembers={() => setRefreshTrigger((prev) => prev + 1)}
                    onRefreshPending={() => setPendingRequestsRefreshTrigger((prev) => prev + 1)}
                    onPageChange={setPage}
                    onPendingPageChange={setPendingRequestsPage}
                    onTasksPageChange={handleTasksPageChange}
                    onActionPendingRequest={handleActionPendingRequest}
                    onKickMember={handleKickMember}
                    onSetMemberRole={handleSetMemberRole}
                    onRoleModalClose={() => setRoleModalVisible(false)}
                    onTaskPreviewModalClose={() => setTaskPreviewModalVisible(false)}
                    onMemberPreviewModalClose={() => setMemberPreviewModalVisible(false)}
                    onViewMember={handleViewMember}
                    onRoleChange={setSelectedRole}
                    onConfirmRole={handleConfirmRole}
                    onCreateTask={handleCreateTask}
                    onRefreshTasks={(page) => fetchTasksList(page || 1)}
                    onEditTask={handleEditTask}
                    onViewTask={handleViewTask}
                    onDeleteTask={handleDeleteTask}
                    canManageMember={canManageMember}
                    canSetRole={canSetRole}
                    canManageTask={canManageTask}
                    selectedTask={selectedTask}
                  />
                  {/* 申请加入按钮已移至header最右侧 */}
                </>
              )}
            </div>
          )}
        </AuthRequired>
      </div>
      {/* 创建/编辑任务模态框 */}
      <Modal
        visible={taskCreateModalVisible}
        title={selectedTask ? "编辑任务" : "创建任务"}
        onClose={() => setTaskCreateModalVisible(false)}
        width={600}
        footer={
          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <button className={styles.cancelButton} onClick={() => setTaskCreateModalVisible(false)}>
              取消
            </button>
            <button className={styles.confirmButton} onClick={handleTaskSubmit}>
              {selectedTask ? "保存修改" : "创建任务"}
            </button>
          </div>
        }
      >
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>任务标题 *</label>
          <Input
            placeholder="请输入任务标题"
            value={taskFormData.title}
            onChange={(value) => setTaskFormData({ ...taskFormData, title: value })}
            className={styles.formInput}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>所属类型 *</label>
          <Input
            placeholder="请输入类型名称"
            value={taskFormData.courseName || ""}
            onChange={(value) => setTaskFormData({ ...taskFormData, courseName: value })}
            className={styles.formInput}
          />
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>截止时间 *</label>
            <DatePicker
              showTime
              value={taskFormData.due_date ? new Date(taskFormData.due_date) : undefined}
              onChange={(date) =>
                setTaskFormData({
                  ...taskFormData,
                  due_date: date ? date.toISOString() : "",
                })
              }
              size="large"
              style={{ width: "100%" }}
              placeholder="请选择截止时间"
              format="YYYY-MM-DD HH:mm:ss"
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>文件大小限制 (MB) *</label>
            <Input
              type="number"
              placeholder="请输入最大文件大小 (不超过96MB)"
              value={String(taskFormData.maxFileSize || "")}
              onChange={(value) => {
                const num = Number(value);
                if (num > 96) {
                  message.error("文件大小不能超过96MB");
                  return;
                }
                setTaskFormData({ ...taskFormData, maxFileSize: num });
              }}
              className={styles.formInput}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: "20px" }}>
          <div className={styles.formGroup} style={{ flex: 1 }}>
            <label className={styles.formLabel}>任务状态 *</label>
            <CustomSelect
              name="状态选择"
              options={[
                { id: "active", name: "进行中", color: "var(--success)" },
                { id: "closed", name: "已结束", color: "var(--error)" },
                { id: "draft", name: "草稿", color: "var(--warning)" },
              ]}
              value={{
                id: taskFormData.status || "draft",
                name: taskFormData.status === "active" ? "进行中" : taskFormData.status === "closed" ? "已结束" : "草稿",
                color: "",
              }}
              onChange={(option) => setTaskFormData({ ...taskFormData, status: option?.id as any })}
              placeholder="请选择状态"
              hideBadge={true}
            />
          </div>
          <div className={styles.formGroup} style={{ flex: 1 }}>
            <label className={styles.formLabel}>优先级 *</label>
            <CustomSelect
              name="优先级选择"
              options={[
                { id: "low", name: "低", color: "#6c757d" },
                { id: "medium", name: "中", color: "#ffc107" },
                { id: "high", name: "高", color: "#ff9800" },
                { id: "urgent", name: "紧急", color: "#dc3545" },
              ]}
              value={{
                id: taskFormData.priority || "medium",
                name:
                  taskFormData.priority === "low"
                    ? "低"
                    : taskFormData.priority === "medium"
                      ? "中"
                      : taskFormData.priority === "high"
                        ? "高"
                        : "紧急",
                color: "",
              }}
              onChange={(option) => setTaskFormData({ ...taskFormData, priority: option?.id as any })}
              placeholder="请选择优先级"
              hideBadge={true}
            />
          </div>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>允许文件格式 (用逗号分隔) *</label>
          <Input
            placeholder="例如: .pdf, .doc, .zip"
            value={allowedTypesInput}
            onChange={(value) => {
              setAllowedTypesInput(value);
              const types = value
                .split(/[,，]/)
                .map((t) => t.trim())
                .filter((t) => t);
              setAllowedTypes(types);
              setTaskFormData({ ...taskFormData, allowedTypes: types });
            }}
            className={styles.formInput}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>任务描述 *</label>
          <textarea
            className={styles.formTextarea}
            placeholder="请输入任务详细描述..."
            value={taskFormData.description}
            onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
          />
        </div>
      </Modal>

      <Footer companyName="TechBlog" startYear={2025} />
    </div>
  );
};

export default OrganizationDetail;
