import { useEffect } from "react";

export function useDevToolsProtection() {
  useEffect(() => {
    if (import.meta.env.DEV) return;

    const cleanups: (() => void)[] = [];

    // 判断事件目标是否为输入类元素（输入框内允许正常选择/复制）
    const isInputElement = (target: EventTarget | null): boolean => {
      if (!target || !(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
    };

    // 判断事件目标是否在允许复制的区域内（研发平台查看详情等场景）
    const isAllowCopyArea = (target: EventTarget | null): boolean => {
      if (!target || !(target instanceof HTMLElement)) return false;
      return target.closest('[data-allow-copy="true"]') !== null;
    };

    // 1. 全局禁用文本选择（CSS 层面，输入框及允许复制区域除外）
    const style = document.createElement("style");
    style.textContent = `
      body { -webkit-user-select: none !important; user-select: none !important; }
      input, textarea, [contenteditable], [data-allow-copy="true"], [data-allow-copy="true"] * { -webkit-user-select: text !important; user-select: text !important; }
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

    // 3. 阻止右键菜单（输入框及允许复制区域除外）
    const handleContextMenu = (e: MouseEvent) => {
      if (isInputElement(e.target) || isAllowCopyArea(e.target)) return;
      e.preventDefault();
      e.stopPropagation();
    };
    document.addEventListener("contextmenu", handleContextMenu, true);
    cleanups.push(() => document.removeEventListener("contextmenu", handleContextMenu, true));

    // 4. 阻止文本选择（输入框及允许复制区域除外）
    const handleSelectStart = (e: Event) => {
      if (isInputElement(e.target) || isAllowCopyArea(e.target)) return;
      e.preventDefault();
      e.stopPropagation();
    };
    document.addEventListener("selectstart", handleSelectStart, true);
    cleanups.push(() => document.removeEventListener("selectstart", handleSelectStart, true));

    // 5. 阻止复制/剪切事件（输入框及允许复制区域除外）
    const handleCopyCut = (e: ClipboardEvent) => {
      if (isInputElement(e.target) || isAllowCopyArea(e.target)) return;
      e.preventDefault();
      e.clipboardData?.clearData();
    };
    document.addEventListener("copy", handleCopyCut, true);
    document.addEventListener("cut", handleCopyCut, true);
    cleanups.push(() => {
      document.removeEventListener("copy", handleCopyCut, true);
      document.removeEventListener("cut", handleCopyCut, true);
    });

    return () => {
      cleanups.forEach((fn) => fn());
    };
  }, []);
}
