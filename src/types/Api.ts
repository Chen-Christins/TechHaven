// ============================================================
// AI / API 配置类型与常量
// ============================================================

import type { SelectOption } from "./index";

// ===== 类型定义 =====

export type ApiType = "openai" | "claude" | "glm";

export type ServiceProvider = "openai" | "anthropic" | "zhipu" | "custom";

export type ResponseType = "responses" | "chat_completions" | "messages";

export interface ProviderPreset {
    type: ApiType;
    responseType: ResponseType;
    url: string;
    keyPlaceholder: string;
    defaultModel: string;
}

// ===== 选项常量 =====

/** 服务商选项 */
export const PROVIDER_OPTIONS: SelectOption[] = [
    { id: "openai", name: "OpenAI", color: "#10a37f" },
    { id: "anthropic", name: "Anthropic", color: "#d97706" },
    { id: "zhipu", name: "智谱 AI", color: "#4a6cf7" },
    { id: "custom", name: "自定义兼容服务", color: "#64748b" },
];

/** 协议选项 */
export const PROTOCOL_OPTIONS: SelectOption[] = [
    { id: "openai", name: "OpenAI 兼容协议", color: "#10a37f" },
    { id: "claude", name: "Anthropic 兼容协议", color: "#d97706" },
    { id: "glm", name: "智谱 GLM 兼容协议", color: "#4a6cf7" },
];

/** 响应格式选项（按协议分类） */
export const RESPONSE_OPTIONS: Record<ApiType, SelectOption[]> = {
    openai: [
        { id: "responses", name: "Responses API (/responses)", color: "#10a37f" },
        { id: "chat_completions", name: "Chat Completions (/chat/completions)", color: "#0ea5e9" },
    ],
    claude: [{ id: "messages", name: "Messages API (/messages)", color: "#d97706" }],
    glm: [{ id: "chat_completions", name: "Chat Completions (/chat/completions)", color: "#4a6cf7" }],
};

// ===== 默认配置 =====

/** 各服务商默认配置 */
export const PROVIDER_DEFAULTS: Record<ServiceProvider, ProviderPreset> = {
    openai: {
        type: "openai",
        responseType: "responses",
        url: "https://api.openai.com/v1/responses",
        keyPlaceholder: "sk-...",
        defaultModel: "gpt-4o",
    },
    anthropic: {
        type: "claude",
        responseType: "messages",
        url: "https://api.anthropic.com/v1/messages",
        keyPlaceholder: "sk-ant-...",
        defaultModel: "claude-sonnet-4-6",
    },
    zhipu: {
        type: "glm",
        responseType: "chat_completions",
        url: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
        keyPlaceholder: "xxx.xxxxxxxxxxxxxxxx",
        defaultModel: "glm-4.7-flash",
    },
    custom: {
        type: "openai",
        responseType: "chat_completions",
        url: "https://api.example.com/v1/chat/completions",
        keyPlaceholder: "请输入完整 API Key",
        defaultModel: "gpt-4o",
    },
};

/** 协议类型 → 默认服务商 */
export const DEFAULT_PROVIDER_BY_TYPE: Record<ApiType, ServiceProvider> = {
    openai: "openai",
    claude: "anthropic",
    glm: "zhipu",
};

/** 个人中心 API 配置默认值（简化版，不含 responseType） */
export const PERSONAL_API_DEFAULTS: Record<ApiType, { url: string; keyPlaceholder: string; defaultModel: string }> = {
    openai: {
        url: "https://api.openai.com/v1/chat/completions",
        keyPlaceholder: "sk-...",
        defaultModel: "gpt-4o",
    },
    claude: {
        url: "https://api.anthropic.com/v1/messages",
        keyPlaceholder: "sk-ant-...",
        defaultModel: "claude-sonnet-4-6",
    },
    glm: {
        url: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
        keyPlaceholder: "xxx.xxxxxxxxxxxxxxxx",
        defaultModel: "glm-4.7-flash",
    },
};

// ===== DSH 环境变量映射 =====

/** 协议类型 → DSH 环境变量字段名 */
export const DSH_FIELD: Record<ApiType, { key: string; baseUrl: string; provider: string }> = {
    openai: { key: "OPENAI_API_KEY", baseUrl: "OPENAI_BASE_URL", provider: "TECHHAVEN_DSH_PROVIDER_OPENAI" },
    claude: { key: "ANTHROPIC_API_KEY", baseUrl: "ANTHROPIC_BASE_URL", provider: "TECHHAVEN_DSH_PROVIDER_CLAUDE" },
    glm: { key: "ZHIPUAI_API_KEY", baseUrl: "ZHIPUAI_BASE_URL", provider: "TECHHAVEN_DSH_PROVIDER_GLM" },
};
