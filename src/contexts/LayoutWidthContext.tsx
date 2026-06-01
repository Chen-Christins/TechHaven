import React, { createContext, useContext, useEffect, useState } from "react";

export type LayoutWidthMode = "default" | "wide" | "full";

interface LayoutWidthContextValue {
  mode: LayoutWidthMode;
  setMode: (mode: LayoutWidthMode) => void;
  cycleMode: () => void;
}

const STORAGE_KEY = "layout-width-mode";
const WIDTH_MODES: LayoutWidthMode[] = ["default", "wide", "full"];

const LayoutWidthContext = createContext<LayoutWidthContextValue | undefined>(undefined);

function getInitialMode(): LayoutWidthMode {
  if (typeof window === "undefined") {
    return "default";
  }

  const savedMode = window.localStorage.getItem(STORAGE_KEY);
  if (savedMode === "default" || savedMode === "wide" || savedMode === "full") {
    return savedMode;
  }

  return "default";
}

export const LayoutWidthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<LayoutWidthMode>(getInitialMode);

  useEffect(() => {
    document.documentElement.setAttribute("data-width-mode", mode);
    window.localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const cycleMode = () => {
    const currentIndex = WIDTH_MODES.indexOf(mode);
    const nextIndex = (currentIndex + 1) % WIDTH_MODES.length;
    setMode(WIDTH_MODES[nextIndex]);
  };

  return <LayoutWidthContext.Provider value={{ mode, setMode, cycleMode }}>{children}</LayoutWidthContext.Provider>;
};

export function useLayoutWidth(): LayoutWidthContextValue {
  const context = useContext(LayoutWidthContext);
  if (!context) {
    throw new Error("useLayoutWidth must be used within a LayoutWidthProvider");
  }

  return context;
}
