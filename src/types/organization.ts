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
