import React, { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { RdPlatformService } from "../services/rdPlatformService";
import type { RdOrgInfo } from "../types/rdPlatform";

interface RdOrgContextType {
  orgs: RdOrgInfo[];
  userOrgIds: string[];
  isAdmin: boolean;
  loading: boolean;
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

  const orgNameMap = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    orgs.forEach((o) => {
      map[o.orgId] = o.orgName;
    });
    return map;
  }, [orgs]);

  return (
    <RdOrgContext.Provider value={{ orgs, userOrgIds, isAdmin, loading, orgNameMap, maxOrgRole }}>{children}</RdOrgContext.Provider>
  );
};

export default RdOrgContext;
