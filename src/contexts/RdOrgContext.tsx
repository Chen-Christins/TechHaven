import React, { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router-dom";
import { RdPlatformService } from "../services/RdPlatformService.ts";
import type { RdOrgInfo } from "../types/RdPlatform.ts";
import { isAdmin as checkIsAdmin } from "../types/Roles.ts";
import { FaBuilding, FaHome, FaLock } from "react-icons/fa";

interface RdOrgContextType {
    orgs: RdOrgInfo[];
    userOrgIds: string[];
    isAdmin: boolean;
    loading: boolean;
    /** orgId → orgName 映射，用于详情展示 */
    orgNameMap: Record<string, string>;
    /** 用户在所有组织中的最高角色（1-5），用于前端权限判断 */
    maxOrgRole: number;
    /** 当前选中组织的角色（选中具体组织时返回该组织角色，全部组织时返回最高角色） */
    currentOrgRole: number;
    /** 当前选中的组织 ID */
    selectedOrgId: string;
    setSelectedOrgId: (orgId: string) => void;
}

const RdOrgContext = createContext<RdOrgContextType>({
    orgs: [],
    userOrgIds: [],
    isAdmin: false,
    loading: true,
    orgNameMap: {},
    maxOrgRole: 1,
    currentOrgRole: 1,
    selectedOrgId: "",
    setSelectedOrgId: () => {},
});

export const useRdOrg = (): RdOrgContextType => {
    const context = useContext(RdOrgContext);
    return context;
};

export const RdOrgProvider: React.FC<{ children: ReactNode; initialOrgId?: string }> = ({ children, initialOrgId = "" }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [orgs, setOrgs] = useState<RdOrgInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrgId, setSelectedOrgId] = useState(initialOrgId);

    const isAdmin = checkIsAdmin(user?.role);

    useEffect(() => {
        if (!user) {
            setOrgs([]);
            setSelectedOrgId("");
            setLoading(false);
            return;
        }

        const fetchOrgs = async () => {
            try {
                const list = await RdPlatformService.getMyOrganizations();
                const mapped = list.map((item) => ({ orgId: item.orgId, orgName: item.orgName, role: item.role }));
                setOrgs(mapped);
                if (mapped.length > 0) {
                    // URL 传入的 orgId 有效则使用，否则默认选中第一个
                    if (initialOrgId && mapped.some((o) => o.orgId === initialOrgId)) {
                        setSelectedOrgId(initialOrgId);
                    } else if (!selectedOrgId) {
                        setSelectedOrgId(mapped[0].orgId);
                    }
                }
            } catch {
                setOrgs([]);
            } finally {
                setLoading(false);
            }
        };

        fetchOrgs();
    }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

    const userOrgIds = useMemo(() => orgs.map((o) => o.orgId), [orgs]);

    const maxOrgRole = useMemo(() => {
        if (isAdmin) {
            return 5;
        } // 平台管理员等同于组织管理员权限
        if (orgs.length === 0) {
            return 1;
        }
        return Math.max(...orgs.map((o) => o.role));
    }, [orgs, isAdmin]);

    const currentOrgRole = useMemo(() => {
        if (isAdmin) {
            return 5;
        }
        if (!selectedOrgId) {
            return maxOrgRole;
        }
        // 选中具体组织 → 返回该组织下的角色
        const org = orgs.find((o) => o.orgId === selectedOrgId);
        return org ? org.role : maxOrgRole;
    }, [isAdmin, selectedOrgId, orgs, maxOrgRole]);

    const orgNameMap = useMemo<Record<string, string>>(() => {
        const map: Record<string, string> = {};
        orgs.forEach((o) => {
            map[o.orgId] = o.orgName;
        });
        return map;
    }, [orgs]);

    if (loading) {
        return (
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100vh",
                    fontSize: "16px",
                    color: "var(--text-secondary)",
                }}
            >
                加载组织信息...
            </div>
        );
    }

    if (orgs.length === 0) {
        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100vh",
                    backgroundColor: "transparent",
                    color: "var(--text-primary)",
                    padding: "20px",
                }}
            >
                <div
                    style={{
                        fontSize: "64px",
                        color: "#f0a020",
                        marginBottom: "24px",
                        opacity: 0.9,
                    }}
                >
                    <FaLock />
                </div>
                <h1
                    style={{
                        fontSize: "28px",
                        fontWeight: "bold",
                        marginBottom: "12px",
                        color: "var(--text-primary)",
                    }}
                >
                    暂无组织
                </h1>
                <p
                    style={{
                        fontSize: "16px",
                        color: "var(--text-secondary)",
                        marginBottom: "32px",
                        textAlign: "center",
                        maxWidth: "480px",
                        lineHeight: "1.6",
                    }}
                >
                    您还没有加入任何组织，请先加入或创建一个组织后再使用研发平台。
                    <br />
                    请前往组织页面查找并申请加入您所属的团队，或联系组织管理员为您开通权限。
                </p>
                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
                    <button
                        onClick={() => navigate("/organizations/list")}
                        style={{
                            padding: "10px 24px",
                            backgroundColor: "var(--primary)",
                            color: "#fff",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "15px",
                            fontWeight: "500",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                        }}
                    >
                        <FaBuilding /> 加入组织
                    </button>
                    <button
                        onClick={() => navigate("/")}
                        style={{
                            padding: "10px 24px",
                            backgroundColor: "transparent",
                            color: "var(--text-primary)",
                            border: "1px solid var(--border-primary)",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "15px",
                            fontWeight: "500",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                        }}
                    >
                        <FaHome /> 返回首页
                    </button>
                    <button
                        onClick={() => logout()}
                        style={{
                            padding: "10px 24px",
                            backgroundColor: "transparent",
                            color: "var(--text-primary)",
                            border: "1px solid var(--border-primary)",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "15px",
                            fontWeight: "500",
                        }}
                    >
                        切换账号
                    </button>
                </div>
            </div>
        );
    }

    return (
        <RdOrgContext.Provider
            value={{ orgs, userOrgIds, isAdmin, loading, orgNameMap, maxOrgRole, currentOrgRole, selectedOrgId, setSelectedOrgId }}
        >
            {children}
        </RdOrgContext.Provider>
    );
};

export default RdOrgContext;
