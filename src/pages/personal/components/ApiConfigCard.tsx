import React, { useState, useEffect, useRef } from "react";
import { FaRobot, FaKey, FaGlobe, FaCogs } from "react-icons/fa";
import Input from "@/components/input/Input";
import CustomSelect from "@/components/customSelect/CustomSelect";
import type { SelectOption } from "@/types/index";
import { message } from "@/components/message/Message";
import { AuthService } from "@/services/authService";
import styles from "../PersonalCenter.module.css";

type ApiType = "openai" | "claude" | "glm";

const PROTOCOL_OPTIONS: SelectOption[] = [
  { id: "openai", name: "OpenAI 兼容协议", color: "#10a37f" },
  { id: "claude", name: "Anthropic 兼容协议", color: "#d97706" },
  { id: "glm", name: "智谱 GLM 兼容协议", color: "#4a6cf7" },
];

const DEFAULTS: Record<ApiType, { url: string; keyPlaceholder: string; defaultModel: string }> = {
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

/**
 * 各协议在 dsh runtime 中落到的字段。
 * provider 经 TECHHAVEN_DSH_PROVIDER_* 映射为 dsh 的 provider route；
 * model / maxTokens 对应 dsh InitializeParams 同名参数；
 * 凭据与 base URL 以环境变量注入隔离子进程（Gateway 只注入这三项，不继承其他环境密钥）。
 * 见 services/techhaven-gateway/.env.example 与 src/aiConfig.ts。
 */
const DSH_FIELD: Record<ApiType, { key: string; baseUrl: string; provider: string }> = {
  openai: { key: "OPENAI_API_KEY", baseUrl: "OPENAI_BASE_URL", provider: "TECHHAVEN_DSH_PROVIDER_OPENAI" },
  claude: { key: "ANTHROPIC_API_KEY", baseUrl: "ANTHROPIC_BASE_URL", provider: "TECHHAVEN_DSH_PROVIDER_CLAUDE" },
  glm: { key: "ZHIPUAI_API_KEY", baseUrl: "ZHIPUAI_BASE_URL", provider: "TECHHAVEN_DSH_PROVIDER_GLM" },
};

/**
 * 与 Gateway `src/aiConfig.ts` 的失败关闭规则对齐：
 * 这些情况原本要到创建会话时才报 412，这里提前到表单拦截。
 */
function validateUrl(raw: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return "接口地址必须是完整 URL（需包含 https:// 前缀）";
  }
  if (parsed.username || parsed.password) return "接口地址不能内嵌用户名或密码";
  if (parsed.search || parsed.hash) return "接口地址不能带查询参数或锚点";
  const host = parsed.hostname;
  const isLoopback = host === "localhost" || host === "::1" || host === "[::1]" || host.startsWith("127.");
  if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && isLoopback)) {
    return "Agent 运行要求 HTTPS 接口地址（本机回环地址除外）";
  }
  return null;
}

function validateApiKey(raw: string): string | null {
  if (raw.length > 8192) return "密钥长度超出合理范围（上限 8192 字符），请核对是否复制了多余内容";
  if (/[*•]/.test(raw)) return "请填入完整密钥：脱敏串（含 * 或 •）无法用于运行";
  if (!/^[\x21-\x7e]+$/.test(raw)) return "密钥只能包含可打印 ASCII 字符，不能含空格或换行";
  return null;
}

function validateMaxTokens(raw: string): string | null {
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) return "最大生成长度必须是正整数";
  if (parsed > 1_000_000) return "最大生成长度超出合理范围（上限 1000000）";
  return null;
}

function validateReasoningEffort(raw: string): string | null {
  if (!/^[\x21-\x7e]{1,64}$/.test(raw)) {
    return "推理档位必须是 1~64 个可见 ASCII 字符（常见：minimal / low / medium / high / max）";
  }
  return null;
}

const ApiConfigCard: React.FC = () => {
  const [apiType, setApiType] = useState<ApiType>("openai");
  const [url, setUrl] = useState(DEFAULTS.openai.url);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [reasoningEffort, setReasoningEffort] = useState("");
  const [maxTokens, setMaxTokens] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const maskedKeyRef = useRef("");
  const keyTouchedRef = useRef(false);
  // 保存从后端加载的原始配置，切类型时恢复
  const savedConfigRef = useRef<{
    type: ApiType;
    url: string;
    api_key: string;
    model: string;
    reasoning_effort: string;
    max_tokens: string;
  } | null>(null);

  const current = DEFAULTS[apiType];
  const dsh = DSH_FIELD[apiType];

  const applyConfig = (config: {
    type: ApiType;
    url: string;
    api_key: string;
    model: string;
    reasoning_effort: string;
    max_tokens: string;
  }) => {
    setApiType(config.type);
    setUrl(config.url);
    setApiKey(config.api_key);
    maskedKeyRef.current = config.api_key;
    setModel(config.model);
    setReasoningEffort(config.reasoning_effort);
    setMaxTokens(config.max_tokens);
  };

  useEffect(() => {
    AuthService.getAiConfig()
      .then((config) => {
        if (config) {
          const t: ApiType = config.type === "claude" || config.type === "glm" ? config.type : "openai";
          const saved = {
            type: t,
            url: config.url || DEFAULTS[t].url,
            api_key: config.api_key || "",
            model: config.model || "",
            reasoning_effort: config.reasoning_effort || "",
            max_tokens: config.max_tokens ? String(config.max_tokens) : "",
          };
          savedConfigRef.current = saved;
          applyConfig(saved);
        }
      })
      .catch((err) => {
        console.error("加载 AI 配置失败:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleTypeChange = (type: ApiType) => {
    const prevDefault = DEFAULTS[apiType].url;
    setApiType(type);
    // 如果 URL 还是旧协议的默认地址，自动切到新协议默认地址
    if (url === prevDefault || url.trim() === "") {
      setUrl(DEFAULTS[type].url);
    }
    // key / model / max_tokens 保持不变，因为用户只有一个配置
  };

  const handleSave = async () => {
    // 与 Gateway 失败关闭规则对齐：这些错误原本要到创建会话时才以 412 暴露，这里提前拦截
    if (!url.trim()) {
      message.warn("请输入接口地址");
      return;
    }
    const urlError = validateUrl(url.trim());
    if (urlError) {
      message.warn(urlError);
      return;
    }
    if (keyTouchedRef.current && !apiKey.trim()) {
      // 用户改过但清空了字段：按「沿用已保存密钥」语义放行（提交空串即保留），提示而非拦截
      message.warn("已清空密钥输入：保存后将沿用已保存的密钥，如需更换请重新输入完整密钥");
    } else if (keyTouchedRef.current) {
      const keyError = validateApiKey(apiKey.trim());
      if (keyError) {
        message.warn(keyError);
        return;
      }
    } else if (!maskedKeyRef.current) {
      message.warn("请输入 API 密钥");
      return;
    }
    if (maxTokens.trim()) {
      const tokensError = validateMaxTokens(maxTokens.trim());
      if (tokensError) {
        message.warn(tokensError);
        return;
      }
    } else if (apiType === "claude") {
      message.warn("Claude 系列必须填写最大生成长度 (max_tokens)");
      return;
    }
    if (reasoningEffort.trim()) {
      const effortError = validateReasoningEffort(reasoningEffort.trim());
      if (effortError) {
        message.warn(effortError);
        return;
      }
    }

    setSaving(true);
    try {
      const keyToSend = keyTouchedRef.current ? apiKey.trim() : "";
      await AuthService.saveAiConfig({
        type: apiType,
        url: url.trim(),
        api_key: keyToSend,
        model: model.trim() || undefined,
        reasoning_effort: reasoningEffort.trim() || undefined,
        max_tokens: maxTokens.trim() ? Number(maxTokens) : undefined,
      });
      // 更新本地缓存，防止切走再切回来时丢失刚保存的配置
      savedConfigRef.current = {
        type: apiType,
        url: url.trim(),
        api_key: keyToSend,
        model: model.trim(),
        reasoning_effort: reasoningEffort.trim(),
        max_tokens: maxTokens.trim(),
      };
      if (keyTouchedRef.current) {
        maskedKeyRef.current = apiKey.trim();
      }
      keyTouchedRef.current = false;
      message.success("配置已保存");
    } catch (err: any) {
      message.error(err?.message || "保存失败");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div className={styles.editCard}>
      <div className={styles.editCardHeader}>
        <FaRobot className={styles.editCardIcon} />
        <span>AI 接口配置</span>
      </div>
      <div className={styles.editCardBody}>
        {/* 协议类型 */}
        <div className={styles.editFormGroup}>
          <label className={styles.editLabel}>协议类型</label>
          <CustomSelect
            name="协议类型"
            options={PROTOCOL_OPTIONS}
            value={PROTOCOL_OPTIONS.find((o) => o.id === apiType) || null}
            onChange={(option) => {
              if (option) handleTypeChange(option.id as ApiType);
            }}
            hideBadge
            placeholder="请选择协议类型..."
          />
          <span className={styles.editHint}>
            每个用户仅支持配置一套接口，切换协议类型不会清空已填写的内容。对应 dsh 的 provider route（经{" "}
            <span className={styles.editHintCode}>{dsh.provider}</span> 映射）
          </span>
        </div>

        {/* 第二步：通用配置 */}
        <div className={styles.editFormGroup}>
          <label className={styles.editLabel}>
            <FaGlobe size={12} style={{ marginRight: 4 }} />
            接口地址 (URL)
          </label>
          <Input value={url} onChange={(v) => setUrl(v)} placeholder={current.url} size="large" />
          <span className={styles.editHint}>
            {apiType === "openai"
              ? "支持 OpenAI 兼容接口，可填写中转/代理地址"
              : apiType === "claude"
                ? "支持 Anthropic 兼容接口，可填写中转/代理地址"
                : "支持智谱 GLM 兼容接口，可填写中转/代理地址"}
            。将作为 dsh 环境变量 <span className={styles.editHintCode}>{dsh.baseUrl}</span> 注入，末尾的 /chat/completions 或
            /messages 会自动剥离
          </span>
        </div>

        <div className={styles.editFormGroup}>
          <label className={styles.editLabel}>
            <FaKey size={12} style={{ marginRight: 4 }} />
            API 密钥 (Key)
          </label>
          <Input
            type="password"
            autoComplete="new-password"
            maxLength={8192}
            value={apiKey}
            onChange={(v) => {
              setApiKey(v);
              keyTouchedRef.current = true;
            }}
            placeholder={current.keyPlaceholder}
            size="large"
          />
          <span className={styles.editHint}>
            {maskedKeyRef.current ? "已保存密钥（脱敏显示），如需修改请重新输入" : "密钥加密存储，仅你可见"}。将作为 dsh 环境变量{" "}
            <span className={styles.editHintCode}>{dsh.key}</span> 注入会话专属子进程，不进入浏览器存储，也不会出现在会话视图或日志中
          </span>
        </div>

        {/* 第三步：附加配置 */}
        <div className={styles.editFormGroup}>
          <label className={styles.editLabel}>
            <FaCogs size={12} style={{ marginRight: 4 }} />
            模型名称 (Model)
          </label>
          <Input value={model} onChange={(v) => setModel(v)} placeholder={`如 ${current.defaultModel}`} maxLength={256} size="large" />
          <span className={styles.editHint}>
            对应 dsh 的 model 参数。留空则使用默认模型 {current.defaultModel}，也可输入其他模型名
          </span>
        </div>

        <div className={styles.editFormGroup}>
          <label className={styles.editLabel}>推理档位 (Reasoning Effort)</label>
          <Input
            value={reasoningEffort}
            onChange={(v) => setReasoningEffort(v)}
            placeholder="选填，如 medium / high / max"
            maxLength={64}
            size="large"
          />
          <span className={styles.editHint}>
            对应 dsh 的 reasoningEffort 参数。常见值：minimal / low / medium / high / max（具体支持范围取决于模型）；留空使用模型默认
          </span>
        </div>

        <div className={styles.editFormGroup}>
          <label className={styles.editLabel}>
            最大生成长度 (max_tokens)
            {apiType === "claude" && <span style={{ color: "#ef4444", marginLeft: 4 }}>*必填</span>}
            {(apiType === "openai" || apiType === "glm") && (
              <span style={{ color: "var(--text-tertiary)", marginLeft: 4 }}>(选填)</span>
            )}
          </label>
          <Input
            type="number"
            value={maxTokens}
            onChange={(v) => setMaxTokens(v)}
            placeholder={apiType === "claude" ? "必填，如 4096" : "选填，如 2048"}
            size="large"
          />
          <span className={styles.editHint}>
            {apiType === "claude" ? "Claude API 要求必须指定 max_tokens，建议不超过 4096" : "可选，留空使用模型默认值"}
            。对应 dsh 的 maxTokens 参数
          </span>
        </div>

        <button className={styles.editSaveBtn} onClick={handleSave} disabled={saving}>
          <FaKey />
          {saving ? "保存中..." : "保存配置"}
        </button>
      </div>
    </div>
  );
};

export default ApiConfigCard;
