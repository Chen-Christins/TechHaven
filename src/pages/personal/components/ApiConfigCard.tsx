import React, { useState, useEffect, useRef } from "react";
import { FaRobot, FaKey, FaGlobe, FaCogs } from "react-icons/fa";
import Input from "../../../components/input/Input";
import { message } from "../../../components/message/Message";
import { AuthService } from "../../../services/authService";
import styles from "../PersonalCenter.module.css";

type ApiType = "openai" | "claude";

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
};

const ApiConfigCard: React.FC = () => {
  const [apiType, setApiType] = useState<ApiType>("openai");
  const [url, setUrl] = useState(DEFAULTS.openai.url);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [maxTokens, setMaxTokens] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const maskedKeyRef = useRef("");
  const keyTouchedRef = useRef(false);
  // 保存从后端加载的原始配置，切类型时恢复
  const savedConfigRef = useRef<{ type: ApiType; url: string; api_key: string; model: string; max_tokens: string } | null>(null);

  const current = DEFAULTS[apiType];

  const applyConfig = (config: { type: ApiType; url: string; api_key: string; model: string; max_tokens: string }) => {
    setApiType(config.type);
    setUrl(config.url);
    setApiKey(config.api_key);
    maskedKeyRef.current = config.api_key;
    setModel(config.model);
    setMaxTokens(config.max_tokens);
  };

  useEffect(() => {
    AuthService.getAiConfig()
      .then((config) => {
        if (config) {
          const t: ApiType = config.type === "claude" ? "claude" : "openai";
          const saved = {
            type: t,
            url: config.url || DEFAULTS[t].url,
            api_key: config.api_key || "",
            model: config.model || "",
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
    const saved = savedConfigRef.current;
    // 切回已保存的类型 → 恢复原配置
    if (saved && saved.type === type) {
      applyConfig(saved);
      keyTouchedRef.current = false;
      return;
    }
    // 切到不同类型 → 用默认值
    setApiType(type);
    setUrl(DEFAULTS[type].url);
    setModel("");
    setMaxTokens("");
    setApiKey("");
    maskedKeyRef.current = "";
    keyTouchedRef.current = false;
  };

  const handleSave = async () => {
    if (!url.trim()) {
      message.warn("请输入接口地址");
      return;
    }
    if (!apiKey.trim()) {
      message.warn("请输入 API 密钥");
      return;
    }
    if (apiType === "claude" && !maxTokens.trim()) {
      message.warn("Claude 系列必须填写最大生成长度 (max_tokens)");
      return;
    }

    setSaving(true);
    try {
      const keyToSend = keyTouchedRef.current ? apiKey.trim() : "";
      await AuthService.saveAiConfig({
        type: apiType,
        url: url.trim(),
        api_key: keyToSend,
        model: model.trim() || undefined,
        max_tokens: maxTokens.trim() ? Number(maxTokens) : undefined,
      });
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
        {/* 第一步：接口类型 */}
        <div className={styles.editFormGroup}>
          <label className={styles.editLabel}>接口类型</label>
          <div style={{ display: "flex", gap: 12 }}>
            {(["openai", "claude"] as ApiType[]).map((type) => {
              const active = apiType === type;
              return (
                <label
                  key={type}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 20px",
                    border: `1px solid ${active ? "var(--primary)" : "var(--border-primary)"}`,
                    borderRadius: 10,
                    cursor: "pointer",
                    backgroundColor: active ? "rgba(59,130,246,0.06)" : "var(--bg-primary)",
                    fontSize: 14,
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  <input
                    type="radio"
                    name="apiType"
                    checked={active}
                    onChange={() => handleTypeChange(type)}
                    style={{ accentColor: "var(--primary)" }}
                  />
                  {type === "openai" ? "OpenAI 系列" : "Claude 系列"}
                </label>
              );
            })}
          </div>
        </div>

        {/* 第二步：通用配置 */}
        <div className={styles.editFormGroup}>
          <label className={styles.editLabel}>
            <FaGlobe size={12} style={{ marginRight: 4 }} />
            接口地址 (URL)
          </label>
          <Input value={url} onChange={(v) => setUrl(v)} placeholder={current.url} size="large" />
          <span className={styles.editHint}>
            {apiType === "openai" ? "支持 OpenAI 兼容接口，可填写中转/代理地址" : "支持 Anthropic 兼容接口，可填写中转/代理地址"}
          </span>
        </div>

        <div className={styles.editFormGroup}>
          <label className={styles.editLabel}>
            <FaKey size={12} style={{ marginRight: 4 }} />
            API 密钥 (Key)
          </label>
          <Input
            type="password"
            value={apiKey}
            onChange={(v) => {
              setApiKey(v);
              keyTouchedRef.current = true;
            }}
            placeholder={current.keyPlaceholder}
            size="large"
          />
          <span className={styles.editHint}>
            {maskedKeyRef.current ? "已保存密钥（脱敏显示），如需修改请重新输入" : "密钥加密存储，仅你可见"}
          </span>
        </div>

        {/* 第三步：附加配置 */}
        <div className={styles.editFormGroup}>
          <label className={styles.editLabel}>
            <FaCogs size={12} style={{ marginRight: 4 }} />
            模型名称 (Model)
          </label>
          <Input value={model} onChange={(v) => setModel(v)} placeholder={`如 ${current.defaultModel}`} size="large" />
          <span className={styles.editHint}>留空则使用默认模型 {current.defaultModel}，也可输入其他模型名</span>
        </div>

        <div className={styles.editFormGroup}>
          <label className={styles.editLabel}>
            最大生成长度 (max_tokens)
            {apiType === "claude" && <span style={{ color: "#ef4444", marginLeft: 4 }}>*必填</span>}
            {apiType === "openai" && <span style={{ color: "var(--text-tertiary)", marginLeft: 4 }}>(选填)</span>}
          </label>
          <Input
            type="number"
            value={maxTokens}
            onChange={(v) => setMaxTokens(v)}
            placeholder={apiType === "claude" ? "必填，如 4096" : "选填，如 2048"}
            size="large"
          />
          <span className={styles.editHint}>
            {apiType === "claude" ? "Claude API 要求必须指定 max_tokens，建议不超过 4096" : "OpenAI 可选，留空使用模型默认值"}
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
