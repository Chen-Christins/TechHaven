import React from 'react';
import styles from './TagPanel.module.css';
import type { Tag } from '../../types/index';

export interface TagPanelProps {
	tags: Tag[];
	tagSize?: 'small' | 'medium' | 'large';
	layout?: 'default' | 'inline' | 'vertical' | 'centered';
	maxCount?: number;
	gap?: number; // 新增 gap 属性
	className?: string;
	onTagClick?: (tag: Tag) => void;
}

const TagPanel: React.FC<TagPanelProps> = ({
	tags,
	tagSize = 'medium',
	layout = 'default',
	maxCount,
	gap = 8, // 默认值
	className = '',
	onTagClick,
}) => {
	const handleTagClick = (tag: Tag) => {
		if (onTagClick) {
			onTagClick(tag);
		}
	};

	const displayTags = maxCount && tags.length > maxCount
		? tags.slice(0, maxCount)
		: tags;

	const hiddenCount = maxCount && tags.length > maxCount
		? tags.length - maxCount
		: 0;

	const panelClasses = [
		styles.tagPanel,
		styles[`panel${layout.charAt(0).toUpperCase() + layout.slice(1)}`],
		className,
	]
		.filter(Boolean)
		.join(' ');

	// 使用内联样式设置 gap
	const panelStyle: React.CSSProperties = {
		gap: `${gap}px`,
	};

	return (
		<div className={panelClasses} style={panelStyle}>
			<h3 className={styles.panelTitle}>文章标签</h3>
			<div className={styles.content}>
                {displayTags.map((tag) => (
                    <span
                        key={tag.id}
                        className={`${styles.tag} ${styles[`tag${tagSize.charAt(0).toUpperCase() + tagSize.slice(1)}`]}`}
                        style={{ backgroundColor: tag.color }}
                        onClick={() => handleTagClick(tag)}
                        title={tag.name}
                    >
                        {tag.name}
                    </span>
                ))}
            </div>

			{hiddenCount > 0 && (
				<span
					className={`${styles.tag} ${styles[`tag${tagSize.charAt(0).toUpperCase() + tagSize.slice(1)}`]}`}
					style={{ backgroundColor: '#6b7280' }}
					title={`还有 ${hiddenCount} 个标签`}
				>
					+{hiddenCount}
				</span>
			)}
		</div>
	);
};

export default TagPanel;