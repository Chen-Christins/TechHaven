import React, { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { RdPlatformService } from "../services/rdPlatformService";
import type { RdOrgInfo } from "../types/rdPlatform";

interface RdOrgContextType {
  orgs: RdOrgInfo[];
  userOrgIds: string[];
  isAdmin: boolean;
  loading: boolean;
  selectedOrgId: string;
  setSelectedOrgId: (id: string) => void;
  /** 实际传给 API 的 organizationIds 参数 */
  filterOrgIds: string[] | undefined;
  /** orgId → orgName 映射，用于详情展示 */
  orgNameMap: Record<string, string>;
  /** 用户在所有组织中的最高角色（1-5），用于前端权限判断 */
  maxOrgRole: number;
}

const RdOrgContext = createContext<RdOrgContextType>({
  orgs: [],
  userOrgIds: [],
  isAdmin: false,
  loading: true,
  selectedOrgId: "",
  setSelectedOrgId: () => {},
  filterOrgIds: undefined,
  orgNameMap: {},
  maxOrgRole: 1,
});

export const useRdOrg = (): RdOrgContextType => {
  const context = useContext(RdOrgContext);
  return context;
};

export const RdOrgProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [orgs, setOrgs] = useState<RdOrgInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrgId, setSelectedOrgId] = useState("");

  const isAdmin = user?.role === "管理员";

  useEffect(() => {
    if (!user) {
      setOrgs([]);
      setLoading(false);
      return;
    }

    const fetchOrgs = async () => {
      try {
        const list = await RdPlatformService.getMyOrganizations();
        setOrgs(list.map((item) => ({ orgId: item.orgId, orgName: item.orgName, role: item.role })));
      } catch {
        setOrgs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrgs();
  }, [user]);

  const userOrgIds = useMemo(() => orgs.map((o) => o.orgId), [orgs]);

  const maxOrgRole = useMemo(() => {
    if (isAdmin) return 5; // 平台管理员等同于组织管理员权限
    if (orgs.length === 0) return 1;
    return Math.max(...orgs.map((o) => o.role));
  }, [orgs, isAdmin]);

  const filterOrgIds = useMemo<string[] | undefined>(() => {
    if (isAdmin) {
      return selectedOrgId ? [selectedOrgId] : undefined;
    }
    if (selectedOrgId) return [selectedOrgId];
    return userOrgIds.length > 0 ? userOrgIds : undefined;
  }, [isAdmin, selectedOrgId, userOrgIds]);

  const orgNameMap = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    orgs.forEach((o) => {
      map[o.orgId] = o.orgName;
    });
    // 同时注册种子 org ID，方便 mock 模式下详情页也能显示
    map["org_1"] = "前端团队";
    map["org_2"] = "后端团队";
    map["org_3"] = "平台团队";
    return map;
  }, [orgs]);

  return (
    <RdOrgContext.Provider value={{ orgs, userOrgIds, isAdmin, loading, selectedOrgId, setSelectedOrgId, filterOrgIds, orgNameMap, maxOrgRole }}>
      {children}
    </RdOrgContext.Provider>
  );
};

export default RdOrgContext;
