import ThemeStylePanel from "../components/themeStylePanel/ThemeStylePanel";
import ThemeToggle from "../components/themeToggle/ThemeToggle";
import LayoutWidthToggle from "../components/layoutWidthToggle/LayoutWidthToggle";
import { useTheme } from "../contexts/ThemeContext";

function SampleThemeStylePanel() {
  const { preset } = useTheme();

  const presetNames: Record<string, string> = {
    default: "默认",
    time: "时代周刊",
    monochrome: "极简黑白",
    mint: "护眼豆绿",
    ocean: "海洋蓝",
    sakura: "樱花粉",
    cyberpunk: "赛博朋克",
    gold: "暗金奢华",
    lavender: "薰衣草紫",
    pi: "Pi 极客",
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          padding: "20px",
          maxWidth: "560px",
        }}
      >
        <h2>主题风格面板示例</h2>
        <p style={{ color: "var(--text-secondary)" }}>
          当前风格：{presetNames[preset] || preset}。可配合右上角的明暗切换（各风格 × 浅色/深色）预览效果。
        </p>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <ThemeToggle />
          <LayoutWidthToggle />
        </div>
        <ThemeStylePanel />
        <div
          style={{
            padding: "1.2rem",
            borderRadius: "8px",
            border: "1px solid var(--border-primary)",
            backgroundColor: "var(--card-bg)",
          }}
        >
          <h3 style={{ marginBottom: "8px" }}>标题预览</h3>
          <p style={{ color: "var(--text-secondary)" }}>正文内容预览 — The quick brown fox jumps over the lazy dog.</p>
        </div>
      </div>
    </>
  );
}

export default SampleThemeStylePanel;
