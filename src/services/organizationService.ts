import http from "../utils/http";

/**
 * 创建组织参数
 */
export interface CreateOrganizationParams {
  id?: string | number;
  name: string;
  type: string;
  status: number | string;
  description?: string;
}

/**
 * 创建组织响应
 */
export interface CreateOrganizationResponse {
  id: number | string;
  name: string;
  type: string;
  status: number | string;
  description: string;
  create_time: number;
}

export interface GetAdminOrganizationsParams {
  page_num: number;
  page_size: number;
  status?: number;
}

export interface GetAdminOrganizationsResponse {
  total: number;
  list: Array<{
    id: number | string;
    name: string;
    type: string;
    status: number | string;
    description: string;
    create_time: number;
    count: number;
  }>;
}

/**
 * 删除组织参数
 */
/**
 * 管理端组织统计响应类型
 */
export interface OrganizationStatsResponse {
  total_organizations: number;
  active_organizations: number;
  inactive_organizations: number;
}

export interface DeleteOrganizationParams {
  ids: string; // 逗号分隔的ID
}

/**
 * 删除组织响应
 */
export interface DeleteOrganizationResponse {
  ids: Array<number | string>;
}

/**
 * 获取组织列表参数
 */
export interface GetOrganizationListsParams {
  status?: number;
}

/**
 * 获取组织列表响应
 */
export interface GetOrganizationListsResponse {
  total: number;
  list: Array<{
    id: number | string;
    name: string;
    type: string;
    status: number | string;
    description: string;
    count: number;
  }>;
}

/**
 * 获取组织详情参数
 */
export interface GetOrganizationDetailParams {
  id: number | string;
}

/**
 * 获取组织详情响应
 */
export interface GetOrganizationDetailResponse {
  id: number | string;
  name: string;
  type: string;
  status: number | string;
  description: string;
  user_in_org?: number;
  user_role?: number;
}

export interface JoinOrganizationParams {
  id: number | string;
}

export interface JoinOrganizationResponse {
  id: number | string;
  name: string;
  type: string;
  status: number | string;
  description: string;
  user_in_org: number;
}

export interface organizationUserListsParams {
  id: number | string;
  page_num: number;
  page_size: number;
  status: 0 | 1 | 2 | 3;
}

export interface organizationUserListsResponse {
  total: number;
  list: Array<{
    id: number | string;
    user_id: number | string;
    name: string;
    avatar: string;
    email: string;
    role: number;
    join_time: number;
  }>;
}

export interface organizationJoinCheckParams {
  user_id: number | string;
  org_id: number | string;
  state: number;
}

export interface organizationJoinCheckResponse {
  success: number;
}

export interface organizationKickParams {
  id: number | string;
  user_id: number | string;
  org_id: number | string;
}

export interface organizationKickResponse {
  success: number;
}

export interface organizationSetRoleParams {
  id: number | string;
  user_id: number | string;
  org_id: number | string;
  role: number;
}

export interface organizationSetRoleResponse {
  id: number | string;
  user_id: number | string;
  name: string;
  avatar: string;
  email: string;
  role: number;
  status: number;
  join_time: number;
}

export interface userOrganizationListsParams {}

export interface userOrganizationListsResponse {
  list: Array<{
    id: number | string;
    org_id: number | string;
    org_name: string;
    org_description: string;
    type: string;
    role: number;
    join_time: number;
    count: number;
  }>;
}
/**
 * 组织服务类
 */
export class OrganizationService {
  /**
   * 创建组织
   */
  static async createOrganization(params: CreateOrganizationParams): Promise<CreateOrganizationResponse> {
    const formData = new URLSearchParams();
    if (params.id !== undefined && params.id !== null && params.id !== "") {
      formData.append("id", String(params.id));
    }
    formData.append("name", params.name);
    formData.append("type", params.type);
    formData.append("status", String(params.status));
    if (params.description) {
      formData.append("desc", params.description);
    }

    const response = await http.post<CreateOrganizationResponse>("/organization/create", formData.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    return response.data;
  }

  /**
   * 分页获取组织列表 (Admin)
   */
  static async getAdminOrganizations(params: GetAdminOrganizationsParams): Promise<GetAdminOrganizationsResponse> {
    let url = `/organization/admin/lists?page_num=${params.page_num}&page_size=${params.page_size}`;
    if (params.status != -1 && params.status !== undefined) {
      url += `&status=${params.status}`;
    }

    const response = await http.get<GetAdminOrganizationsResponse>(url);
    return response.data;
  }

  /**
   * 获取管理端组织统计数据
   */
  static async getAdminOrganizationStats(): Promise<OrganizationStatsResponse> {
    const response = await http.get<OrganizationStatsResponse>("/organization/admin/stats");
    return response.data;
  }

  /**
   * 删除组织 (Admin)
   */
  static async deleteOrganizations(params: DeleteOrganizationParams): Promise<DeleteOrganizationResponse> {
    const formData = new URLSearchParams();
    formData.append("ids", params.ids);

    const response = await http.post<DeleteOrganizationResponse>("/organization/delete", formData.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    return response.data;
  }

  /**
   * 获取组织列表
   */
  static async getOrganizationLists(params: GetOrganizationListsParams): Promise<GetOrganizationListsResponse> {
    let url = "/organization/list?";
    if (params.status != -1 && params.status !== undefined && params.status !== null) {
      url += `status=${params.status}`;
    }

    const response = await http.get<GetOrganizationListsResponse>(url);
    return response.data;
  }

  /**
   * 获取组织详情
   */
  static async getOrganizationDetail(params: GetOrganizationDetailParams): Promise<GetOrganizationDetailResponse> {
    const url = `/organization/detail?id=${params.id}`;

    const response = await http.get<GetOrganizationDetailResponse>(url);
    return response.data;
  }

  /**
   * 加入组织
   */
  static async joinOrganization(params: JoinOrganizationParams): Promise<JoinOrganizationResponse> {
    const formData = new URLSearchParams();
    formData.append("id", String(params.id));

    const response = await http.post<JoinOrganizationResponse>("/organization/join", formData.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    return response.data;
  }

  static async getOrganizationUserLists(params: organizationUserListsParams): Promise<organizationUserListsResponse> {
    const url = `/organization/user_list?id=${params.id}&page_num=${params.page_num}&page_size=${params.page_size}&status=${params.status}`;

    const response = await http.get<organizationUserListsResponse>(url);
    return response.data;
  }

  static async organizationJoinCheck(params: organizationJoinCheckParams): Promise<organizationJoinCheckResponse> {
    const formData = new URLSearchParams();
    formData.append("user_id", String(params.user_id));
    formData.append("org_id", String(params.org_id));
    formData.append("state", String(params.state));

    const response = await http.post<organizationJoinCheckResponse>("/organization/join_check", formData.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    return response.data;
  }

  static async userOrganizationLists(): Promise<userOrganizationListsResponse> {
    const url = `/user/organization/list`;

    const response = await http.get<userOrganizationListsResponse>(url);
    return response.data;
  }

  /**
   * 踢出组织成员
   */
  static async kickOrganizationMember(params: organizationKickParams): Promise<organizationKickResponse> {
    const formData = new URLSearchParams();
    formData.append("id", String(params.id));
    formData.append("user_id", String(params.user_id));
    formData.append("org_id", String(params.org_id));

    const response = await http.post<organizationKickResponse>("/organization/user_kick", formData.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    return response.data;
  }

  /**
   * 设置组织成员角色
   */
  static async setOrganizationMemberRole(params: organizationSetRoleParams): Promise<organizationSetRoleResponse> {
    const formData = new URLSearchParams();
    formData.append("id", String(params.id));
    formData.append("user_id", String(params.user_id));
    formData.append("org_id", String(params.org_id));
    formData.append("role", String(params.role));

    const response = await http.post<organizationSetRoleResponse>("/organization/user_switch_role", formData.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    return response.data;
  }
}

export default OrganizationService;
