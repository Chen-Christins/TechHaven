// ============================================================
// 角色定义（平台角色 + 组织角色）
// ============================================================

// ===== 平台角色（站点级，后端返回数值）=====

export const PlatformRole = {
    USER: 1,
    ADMIN: 2,
    EDITOR: 3,
    CHECKER: 4,
} as const;

export type PlatformRole = (typeof PlatformRole)[keyof typeof PlatformRole];

/** 平台角色 → 中文显示名 */
export const PlatformRoleLabel: Record<PlatformRole, string> = {
    [PlatformRole.USER]: "用户",
    [PlatformRole.ADMIN]: "管理员",
    [PlatformRole.EDITOR]: "编辑",
    [PlatformRole.CHECKER]: "审核员",
};

/** 平台角色 → CSS 类名 */
export const PlatformRoleCSS: Record<PlatformRole, string> = {
    [PlatformRole.USER]: "user",
    [PlatformRole.ADMIN]: "admin",
    [PlatformRole.EDITOR]: "editor",
    [PlatformRole.CHECKER]: "checker",
};

/** 英文键 → 平台角色数值（UserManagement 筛选用） */
export const PlatformRoleByKey: Record<string, PlatformRole> = {
    user: PlatformRole.USER,
    admin: PlatformRole.ADMIN,
    editor: PlatformRole.EDITOR,
    checker: PlatformRole.CHECKER,
};

// ===== 组织角色 =====

export const OrgRole = {
    MEMBER: 1,
    REPORTER: 2,
    DEVELOPER: 3,
    DEV_LEAD: 4,
    ORG_ADMIN: 5,
} as const;

export type OrgRole = (typeof OrgRole)[keyof typeof OrgRole];

/** 组织角色 → 中文显示名 */
export const OrgRoleLabel: Record<OrgRole, string> = {
    [OrgRole.MEMBER]: "普通成员",
    [OrgRole.REPORTER]: "报告者",
    [OrgRole.DEVELOPER]: "开发者",
    [OrgRole.DEV_LEAD]: "研发主管",
    [OrgRole.ORG_ADMIN]: "组织管理员",
};

// ===== 组织权限判断 =====

export const OrgPermission = {
    /** 能否创建需求/缺陷 */
    canCreate: (role: number) => role >= OrgRole.REPORTER,
    /** 能否创建任务 */
    canCreateTask: (role: number) => role >= OrgRole.DEV_LEAD,
    /** 能否编辑工单（报告者及以上） */
    canEdit: (role: number) => role >= OrgRole.REPORTER,
    /** 能否删除工单（研发主管及以上） */
    canDelete: (role: number) => role >= OrgRole.DEV_LEAD,
    /** 能否管理组织成员 */
    canManageMembers: (role: number) => role >= OrgRole.ORG_ADMIN,
};

// ===== 平台角色辅助函数 =====

/** 是否为管理员 */
export const isAdmin = (role?: number | null): boolean => Number(role) === PlatformRole.ADMIN;

/** 是否为普通用户 */
export const isNormalUser = (role?: number | null): boolean => Number(role) === PlatformRole.USER;

/** 是否有私信权限（非普通用户） */
export const canChat = (role?: number | null): boolean => !isNormalUser(role);
