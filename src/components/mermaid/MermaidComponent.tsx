import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import styles from "./MermaidComponent.module.css";

// 初始化 Mermaid 全局配置（模块级别，仅执行一次）
mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  securityLevel: "loose",
  fontFamily: "monospace",
  fontSize: 14,
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    curve: "basis",
  },
});

interface MermaidComponentProps {
  code: string;
}

const MermaidComponent: React.FC<MermaidComponentProps> = ({ code }) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (elementRef.current) {
      try {
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        mermaid
          .render(id, code)
          .then(({ svg }) => {
            if (elementRef.current) {
              elementRef.current.innerHTML = svg;
            }
          })
          .catch((err) => {
            setError(`Mermaid 渲染错误: ${err.message}`);
          });
      } catch (err: any) {
        setError(`Mermaid 渲染错误: ${err.message}`);
      }
    }
  }, [code]);

  if (error) {
    return (
      <div className={styles.error}>
        <div className={styles.errorMessage}>{error}</div>
        <pre className={styles.errorCode}>{code}</pre>
      </div>
    );
  }

  return <div ref={elementRef} className={styles.diagram} />;
};

export default MermaidComponent;
