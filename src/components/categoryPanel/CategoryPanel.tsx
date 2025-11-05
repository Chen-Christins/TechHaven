import React, { useState } from 'react';
import type { Category } from '../../types/index';
import { FaChevronDown, FaChevronRight } from 'react-icons/fa';
import styles from './CategoryPanel.module.css';

// 模拟分类数据
const mockCategories: Category[] = [
	{
		id: 1,
		name: "前端开发",
		count: 86,
		children: [
			{ id: 11, name: "框架", count: 32 },
			{ id: 12, name: "CSS", count: 18 },
			{ id: 13, name: "JavaScript", count: 36 }
		]
	},
	{
		id: 2,
		name: "后端开发",
		count: 54,
		children: [
			{ id: 21, name: "Node.js", count: 28 },
			{ id: 22, name: "Java", count: 26 }
		]
	},
	{
		id: 3,
		name: "工程化",
		count: 29,
		children: [
			{ id: 31, name: "构建工具", count: 15 },
			{ id: 32, name: "CI/CD", count: 14 }
		]
	},
	{
		id: 4,
		name: "性能优化",
		count: 12
	}
];

const CategoryPanel: React.FC = () => {
	const [expanded, setExpanded] = useState<Record<number, boolean>>({
		1: true // 默认展开第一个分类
	});

	const toggleExpand = (categoryId: number) => {
		setExpanded(prev => ({
			...prev,
			[categoryId]: !prev[categoryId]
		}));
	};

	return (
		<div className={styles.categoryPanel}>
			<h3 className={styles.panelTitle}>文章分类</h3>
			<ul className={styles.categoryList}>
				{mockCategories.map(category => {
					const hasChildren = !!category.children?.length;
					const isExpanded = expanded[category.id];

					return (
						<li key={category.id} className={styles.parentItem}>
							{/* 父分类容器 */}
							<div
								className={styles.parentCategory}
								onClick={(e) => {
									// 点击箭头或文字区域都能展开/折叠
									if (hasChildren) {
										toggleExpand(category.id);
										e.preventDefault(); // 阻止链接跳转
									}
								}}
							>
								{/* 展开/折叠按钮 */}
								{hasChildren && (
									<div className={styles.toggleBtn}>
										{isExpanded ? (
											<FaChevronDown className={styles.chevron} />
										) : (
											<FaChevronRight className={styles.chevron} />
										)}
									</div>
								)}

								{/* 父分类链接 */}
								<a
									href={`/category/${category.id}`}
									className={styles.parentLink}
								>
									<span className={styles.parentName}>{category.name}</span>
									<span className={styles.parentCount}>{category.count}</span>
								</a>
							</div>

							{/* 子分类列表（带动画过渡） */}
							{hasChildren && (
								<div
									className={`${styles.childrenContainer} ${isExpanded ? styles.expanded : styles.collapsed
										}`}
								>
									<ul className={styles.childrenList}>
										{category.children?.map(child => (
											<li key={child.id} className={styles.childItem}>
												<a
													href={`/category/${category.id}/${child.id}`}
													className={styles.childLink}
												>
													<span className={styles.childName}>{child.name}</span>
													<span className={styles.childCount}>{child.count}</span>
												</a>
											</li>
										))}
									</ul>
								</div>
							)}
						</li>
					);
				})}
			</ul>
		</div>
	);
};

export default CategoryPanel;