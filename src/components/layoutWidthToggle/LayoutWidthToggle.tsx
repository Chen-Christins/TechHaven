import React from "react";
import { StretchHorizontal } from "lucide-react";
import { useLayoutWidth } from "../../contexts/LayoutWidthContext";
import styles from "./LayoutWidthToggle.module.css";

const MODE_META = {
  default: { label: "默认", nextLabel: "较宽" },
  wide: { label: "较宽", nextLabel: "全宽" },
  full: { label: "全宽", nextLabel: "默认" },
} as const;

const LayoutWidthToggle: React.FC = () => {
  const { mode, cycleMode } = useLayoutWidth();
  const currentMode = MODE_META[mode];

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={cycleMode}
      aria-label={`当前布局宽度：${currentMode.label}，点击切换到${currentMode.nextLabel}`}
      title={`布局宽度：${currentMode.label}，点击切换到${currentMode.nextLabel}`}
    >
      <StretchHorizontal className={styles.icon} size={16} />
      <span className={styles.label}>{currentMode.label}</span>
    </button>
  );
};

export default LayoutWidthToggle;
