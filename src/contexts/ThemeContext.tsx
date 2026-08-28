import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

// 主题风格（skin），与明暗色正交：data-skin="time" | ...
export type ThemePreset = "time" | "monochrome" | "mint" | "ocean" | "sakura" | "cyberpunk" | "gold" | "lavender";

export const PRESET_KEYS: ThemePreset[] = ["time", "monochrome", "mint", "ocean", "sakura", "cyberpunk", "gold", "lavender"];

interface ThemeContextType {
  theme: Theme;
  preset: ThemePreset;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setPreset: (preset: ThemePreset) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [hasManualTheme, setHasManualTheme] = useState(() => localStorage.getItem("theme") !== null);
  const [theme, setThemeState] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme;
    }

    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }

    return "light";
  });
  const [preset, setPreset] = useState<ThemePreset>(() => {
    const savedPreset = localStorage.getItem("theme-preset");
    return PRESET_KEYS.includes(savedPreset as ThemePreset) ? (savedPreset as ThemePreset) : "time";
  });

  useEffect(() => {
    // 立即更新 DOM 上的 data-theme 属性和 class
    document.documentElement.setAttribute("data-theme", theme);

    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    if (hasManualTheme) {
      localStorage.setItem("theme", theme);
    } else {
      localStorage.removeItem("theme");
    }
  }, [theme, hasManualTheme]);

  // 更新 DOM 上的 data-skin 属性（主题风格）
  useEffect(() => {
    document.documentElement.setAttribute("data-skin", preset);
    localStorage.setItem("theme-preset", preset);
  }, [preset]);

  // 监听系统主题变化
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      // 只有在用户没有手动设置主题时才跟随系统主题
      if (!hasManualTheme) {
        setThemeState(e.matches ? "dark" : "light");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [hasManualTheme]);

  const toggleTheme = () => {
    setHasManualTheme(true);
    setThemeState((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  const setTheme = (newTheme: Theme) => {
    setHasManualTheme(true);
    setThemeState(newTheme);
  };

  const value: ThemeContextType = {
    theme,
    preset,
    toggleTheme,
    setTheme,
    setPreset,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
