// 个人中心中组织的类型定义
export interface PersonalOrganization {
  id: string;
  name: string;
  type: string;
  description?: string;
  memberCount: number;
  role: "会长" | "管理员" | "成员";
  createTime?: string;
  status?: "active" | "inactive";
  avatar?: string;
}

// 组织成员
export interface Member {
  id: string;
  user_id: string;
  name: string;
  avatar?: string;
  role?: string;
  status?: "active" | "inactive";
  email?: string;
  joinTime?: string;
}

// 组织详情
export interface OrganizationDetail {
  id: string;
  name: string;
  type: string;
  status: "active" | "inactive";
  description?: string;
  memberCount: number;
  members: Member[];
  user_in_org?: string;
  user_role?: string;
}

// 成员统计
export interface MemberStats {
  totalMembers: number;
  activeMembers: number;
  orgAdminMembers: number;
  devLeadMembers: number;
  regularMembers: number;
}

// 组织内任务
export interface Task {
  deadline: string;
  maxFileSize: number;
  courseName: string;
  status: "draft" | "active" | "closed";
  id: number | string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  assignee: string;
  assign_id: string | number;
  assignee_name?: string;
  creator: string | number;
  creator_name: string;
  created_at: string;
  allowedTypes: string[];
  updated_at?: string;
  due_date: string;
  org_id: number | string;
}

// 任务表单
export interface TaskForm {
  title: string;
  description: string;
  priority: Task["priority"];
  assignee: string;
  due_date: string;
}
