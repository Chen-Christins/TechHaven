import React, { useState } from "react";
import styles from "./Avatar.module.css";

const PALETTE = [
  "#f97316",
  "#ef4444",
  "#8b5cf6",
  "#3b82f6",
  "#06b6d4",
  "#22c55e",
  "#e11d48",
  "#7c3aed",
  "#0284c7",
  "#15803d",
  "#ea580c",
  "#db2777",
  "#6366f1",
  "#0891b2",
  "#65a30d",
];

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (Math.imul(31, h) + name.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function getInitials(name: string): string {
  if (!name) return "?";
  // 中文名取最后两个字或最后一个字
  if (/[\u4e00-\u9fff]/.test(name)) {
    const chars = name.replace(/[^\u4e00-\u9fff]/g, "");
    return chars.length > 1 ? chars.slice(-2) : chars;
  }
  // 英文名取首字母大写，最多两个
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

const Avatar: React.FC<AvatarProps> = ({ src, name, size = 40, className, style }) => {
  const [imgError, setImgError] = useState(false);
  const showImage = src && !imgError;

  const bgColor = PALETTE[hashName(name) % PALETTE.length];
  const initials = getInitials(name);

  return (
    <div
      className={`${styles.avatar} ${className || ""}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        ...(!showImage ? { backgroundColor: bgColor } : {}),
        ...style,
      }}
      title={name}
      role="img"
      aria-label={name}
    >
      {showImage ? (
        <img src={src!} alt={name} className={styles.img} onError={() => setImgError(true)} style={{ width: size, height: size }} />
      ) : (
        <span className={styles.initials}>{initials}</span>
      )}
    </div>
  );
};

export default Avatar;
