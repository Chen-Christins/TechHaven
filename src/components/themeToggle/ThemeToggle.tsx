import React from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Sun, Moon } from "lucide-react";
import styles from "./ThemeToggle.module.css";

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      className={styles.themeToggle}
      onClick={toggleTheme}
      aria-label={theme === "light" ? "切换到暗色主题" : "切换到浅色主题"}
      title={theme === "light" ? "切换到暗色主题" : "切换到浅色主题"}
    >
      <div className={styles.toggleContainer}>
        {theme === "light" ? <Moon className={styles.icon} size={18} /> : <Sun className={styles.icon} size={18} />}
      </div>
    </button>
  );
};

export default ThemeToggle;
