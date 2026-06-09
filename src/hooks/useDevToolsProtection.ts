import { useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { tokenManager } from "../utils/http";

const SESSION_DETECTED_KEY = "__devtools_detected";

function clearAllData() {
  // 保留 devtools 检测标记，避免跨页面重载后死循环
  const devtoolsDetected = sessionStorage.getItem(SESSION_DETECTED_KEY);

  localStorage.clear();
  sessionStorage.clear();
  tokenManager.clearToken();

  // 恢复检测标记
  if (devtoolsDetected) {
    sessionStorage.setItem(SESSION_DETECTED_KEY, devtoolsDetected);
  }

  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
  }
}

export function useDevToolsProtection() {
  const { logout, isAuthenticated } = useAuth();
  const detectedRef = useRef(false);

  useEffect(() => {
    if (import.meta.env.DEV) return;

    // 跨页面重载持久化检测状态，避免 /auth 页上重复触发导致死循环
    if (sessionStorage.getItem(SESSION_DETECTED_KEY) === "1") {
      detectedRef.current = true;
    }

    const cleanups: (() => void)[] = [];

    const triggerCleanup = async () => {
      if (detectedRef.current) return;
      detectedRef.current = true;
      sessionStorage.setItem(SESSION_DETECTED_KEY, "1");

      // 仅在已登录时调用后端登出接口，避免 "未登录" 错误
      if (isAuthenticated) {
        try {
          await logout();
        } catch {
          // logout API 失败不影响本地清理
        }
      }

      clearAllData();

      // 如果已经在 /auth 页面，不再跳转，避免死循环 reload
      if (window.location.pathname !== "/auth") {
        window.location.href = "/auth";
      }
    };

    // 判断事件目标是否为输入类元素（输入框内允许正常选择/复制）
    const isInputElement = (target: EventTarget | null): boolean => {
      if (!target || !(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
    };

    // 1. 全局禁用文本选择（CSS 层面，输入框除外）
    const style = document.createElement("style");
    style.textContent = `
      body { -webkit-user-select: none !important; user-select: none !important; }
      input, textarea, [contenteditable] { -webkit-user-select: text !important; user-select: text !important; }
    `;
    document.head.appendChild(style);
    cleanups.push(() => style.remove());

    // 2. 阻止键盘快捷键打开开发者工具（不拦截复制粘贴，由 CSS + 事件层处理）
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key.toUpperCase())) ||
        (e.ctrlKey && e.key.toUpperCase() === "U")
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener("keydown", handleKeyDown, true);
    cleanups.push(() => document.removeEventListener("keydown", handleKeyDown, true));

    // 3. 阻止右键菜单（输入框除外）
    const handleContextMenu = (e: MouseEvent) => {
      if (isInputElement(e.target)) return;
      e.preventDefault();
      e.stopPropagation();
    };
    document.addEventListener("contextmenu", handleContextMenu, true);
    cleanups.push(() => document.removeEventListener("contextmenu", handleContextMenu, true));

    // 4. 阻止文本选择（输入框除外）
    const handleSelectStart = (e: Event) => {
      if (isInputElement(e.target)) return;
      e.preventDefault();
      e.stopPropagation();
    };
    document.addEventListener("selectstart", handleSelectStart, true);
    cleanups.push(() => document.removeEventListener("selectstart", handleSelectStart, true));

    // 5. 阻止复制/剪切事件（输入框除外）
    const handleCopyCut = (e: ClipboardEvent) => {
      if (isInputElement(e.target)) return;
      e.preventDefault();
      e.clipboardData?.clearData();
    };
    document.addEventListener("copy", handleCopyCut, true);
    document.addEventListener("cut", handleCopyCut, true);
    cleanups.push(() => {
      document.removeEventListener("copy", handleCopyCut, true);
      document.removeEventListener("cut", handleCopyCut, true);
    });

    // 6. 窗口尺寸差异检测（针对 docked 模式的开发者工具）
    const checkSize = () => {
      const threshold = 160;
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      if (widthDiff > threshold || heightDiff > threshold) {
        triggerCleanup();
      }
    };
    const sizeTimer = setInterval(checkSize, 1000);
    cleanups.push(() => clearInterval(sizeTimer));

    // 7. debugger 时序检测（开发者工具打开时调试语句会暂停执行）
    const checkDebugger = () => {
      const start = performance.now();
      // eslint-disable-next-line no-debugger
      debugger;
      const end = performance.now();
      if (end - start > 100) {
        triggerCleanup();
      }
    };
    const debuggerTimer = setInterval(checkDebugger, 3000);
    cleanups.push(() => clearInterval(debuggerTimer));

    return () => {
      cleanups.forEach((fn) => fn());
    };
  }, [logout]);
}
