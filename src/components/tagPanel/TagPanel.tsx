import React from "react";
import { FaTags } from "react-icons/fa";
import styles from "./TagPanel.module.css";
import type { Tag } from "@/types/index";
import Skeleton from "../skeleton/Skeleton";

export interface TagPanelProps {
  tags: Tag[];
  tagSize?: "small" | "medium" | "large";
  layout?: "default" | "inline" | "vertical" | "centered";
  maxCount?: number;
  gap?: number;
  className?: string;
  loading?: boolean;
  selectedTagId?: string | number;
  onTagClick?: (tag: Tag) => void;
}

const TagPanel: React.FC<TagPanelProps> = ({
  tags,
  tagSize = "medium",
  layout = "default",
  maxCount,
  gap = 8,
  className = "",
  loading = false,
  selectedTagId,
  onTagClick,
}) => {
  const handleTagClick = (tag: Tag) => {
    if (onTagClick) {
      onTagClick(tag);
    }
  };

  const displayTags = maxCount && tags.length > maxCount ? tags.slice(0, maxCount) : tags;

  const hiddenCount = maxCount && tags.length > maxCount ? tags.length - maxCount : 0;

  const panelClasses = [styles.tagPanel, styles[`panel${layout.charAt(0).toUpperCase() + layout.slice(1)}`], className]
    .filter(Boolean)
    .join(" ");

  // 使用内联样式设置 gap
  const panelStyle: React.CSSProperties = {
    gap: `${gap}px`,
  };

  return (
    <div className={panelClasses} style={panelStyle}>
      <h3 className={styles.panelTitle}>
        <FaTags className={styles.titleIcon} /> 文章标签
      </h3>
      <div className={styles.content}>
        {loading ? (
          // 加载状态显示骨架屏
          <div className={styles.tagSkeletonContainer}>
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton
                key={index}
                variant="rectangular"
                width={40 + Math.random() * 40}
                height={tagSize === "small" ? 20 : tagSize === "large" ? 32 : 24}
                className={styles.tagSkeleton}
              />
            ))}
          </div>
        ) : displayTags && displayTags.length > 0 ? (
          displayTags.map((tag) => (
            <span
              key={tag.id}
              className={`${styles.tag} ${styles[`tag${tagSize.charAt(0).toUpperCase() + tagSize.slice(1)}`]} ${selectedTagId === tag.id ? styles.tagSelected : ""}`}
              style={{ backgroundColor: tag.color }}
              onClick={() => handleTagClick(tag)}
              title={tag.name}
            >
              {tag.name}
            </span>
          ))
        ) : (
          <div className={styles.emptyPlaceholder} style={{ color: "var(--text-secondary)" }}>
            暂无标签
          </div>
        )}

        {!loading && hiddenCount > 0 && (
          <span
            className={`${styles.tag} ${styles[`tag${tagSize.charAt(0).toUpperCase() + tagSize.slice(1)}`]}`}
            style={{ backgroundColor: "#6b7280" }}
            title={`还有 ${hiddenCount} 个标签`}
          >
            +{hiddenCount}
          </span>
        )}
      </div>
    </div>
  );
};

export default TagPanel;
