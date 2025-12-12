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

export interface MemberStats {
    totalMembers: number;
    activeMembers: number;
    leaderMembers: number;
    deputyMembers: number;
    regularMembers: number;
}

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

export interface TaskForm {
    title: string;
    description: string;
    priority: Task["priority"];
    assignee: string;
    due_date: string;
}
