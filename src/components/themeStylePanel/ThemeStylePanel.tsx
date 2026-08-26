import React from "react";
import { FaPalette, FaCheck } from "react-icons/fa";
import { useTheme, type ThemePreset } from "@/contexts/ThemeContext";
import styles from "./ThemeStylePanel.module.css";

const PRESETS: { key: ThemePreset; name: string; desc: string; bg: string; header: string; accent: string }[] = [
  {
    key: "default",
    name: "默认",
    desc: "现代扁平风",
    bg: "#f8fafc",
    header: "#1e293b",
    accent: "#3b82f6",
  },
  {
    key: "time",
    name: "时代周刊",
    desc: "纸刊衬线风",
    bg: "#f6f1e7",
    header: "#c8102e",
    accent: "#c8102e",
  },
  {
    key: "monochrome",
    name: "极简黑白",
    desc: "黑白高级风",
    bg: "#fafafa",
    header: "#111111",
    accent: "#111111",
  },
  {
    key: "mint",
    name: "护眼豆绿",
    desc: "柔和护眼",
    bg: "#f4f7f0",
    header: "#6f9a5e",
    accent: "#a3b88d",
  },
  {
    key: "ocean",
    name: "海洋蓝",
    desc: "蓝白清新",
    bg: "#f0f6fb",
    header: "#0e7cb5",
    accent: "#4aa3d8",
  },
  {
    key: "sakura",
    name: "樱花粉",
    desc: "粉白少女感",
    bg: "#fff5f7",
    header: "#e87a9a",
    accent: "#f48fb1",
  },
  {
    key: "cyberpunk",
    name: "赛博朋克",
    desc: "霓虹科技感",
    bg: "#f4f2ff",
    header: "#7c5cff",
    accent: "#00b8d9",
  },
  {
    key: "gold",
    name: "暗金奢华",
    desc: "黑金低调",
    bg: "#faf6ee",
    header: "#b8860b",
    accent: "#d4a24e",
  },
  {
    key: "lavender",
    name: "薰衣草紫",
    desc: "紫白柔和",
    bg: "#f7f5ff",
    header: "#7c5cff",
    accent: "#a58aff",
  },
];

const ThemeStylePanel: React.FC = () => {
  const { preset, setPreset } = useTheme();

  return (
    <div className={styles.panel}>
      <h3 className={styles.panelTitle}>
        <FaPalette className={styles.titleIcon} /> 主题风格
      </h3>
      <div className={styles.presetList}>
        {PRESETS.map((item) => {
          const active = preset === item.key;
          return (
            <button
              key={item.key}
              type="button"
              className={`${styles.presetItem} ${active ? styles.presetActive : ""}`}
              onClick={() => setPreset(item.key)}
              aria-pressed={active}
              title={item.desc}
            >
              <span className={styles.preview} style={{ backgroundColor: item.bg }}>
                <span className={styles.previewHeader} style={{ color: item.header }}>
                  TechHaven
                </span>
                <span className={styles.previewBar} style={{ backgroundColor: item.accent }} />
                <span className={styles.previewLine} style={{ backgroundColor: item.header }} />
                <span className={styles.previewLine} style={{ backgroundColor: item.header, opacity: 0.45 }} />
              </span>
              <span className={styles.presetInfo}>
                <span className={styles.presetName}>
                  {item.name}
                  {active && <FaCheck className={styles.checkIcon} />}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ThemeStylePanel;
