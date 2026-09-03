interface AgentLabEnv {
  DEV?: boolean;
  VITE_ENABLE_AGENT_TEST?: string;
}

/**
 * Agent 实验室默认只在 Vite 开发服务器开放；测试站必须在构建时显式开启。
 * 该开关仅控制界面可见性，不能代替研发平台的登录与组织权限校验。
 */
export const resolveAgentLabEnabled = (env: AgentLabEnv): boolean => {
  return env.DEV === true || env.VITE_ENABLE_AGENT_TEST?.trim().toLowerCase() === "true";
};

export const AGENT_LAB_ENABLED = resolveAgentLabEnabled(import.meta.env);
