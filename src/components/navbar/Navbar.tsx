import React, { useState, type MouseEvent } from 'react';
import styles from './Navbar.module.css';

// 定义导航项类型
interface NavItem {
	text: string;
	icon?: React.ReactNode | string | React.ComponentType;
	onClick?: (event: MouseEvent<HTMLButtonElement>, index: number) => void;
	disabled?: boolean;
}

// 定义组件属性类型
interface NavbarProps {
	items: NavItem[];
	activeIndex?: number;
	onItemClick?: (index: number) => void;
	className?: string;
	orientation?: 'horizontal' | 'vertical';
}

const Navbar: React.FC<NavbarProps> = ({
	items = [],
	activeIndex = 0,
	onItemClick,
	className = '',
	orientation = 'horizontal',
	...props
}) => {
	const [currentActive, setCurrentActive] = useState<number>(activeIndex);

	const handleItemClick = (index: number, itemOnClick?: NavItem['onClick']) => (e: MouseEvent<HTMLButtonElement>) => {
		setCurrentActive(index);

		// 调用自定义点击事件
		if (itemOnClick) {
			itemOnClick(e, index);
		}

		// 调用父组件的回调
		if (onItemClick) {
			onItemClick(index);
		}
	};

	// 渲染图标辅助函数
	const renderIcon = (icon: NavItem['icon']) => {
		if (!icon) return null;

		// 如果是字符串，可能是图片URL或emoji
		if (typeof icon === 'string') {
			// 检查是否是URL
			if (icon.startsWith('http') || icon.startsWith('/')) {
				return <img src={icon} alt="" className={styles.iconImage} />;
			}
			// 否则当作文本/emoji处理
			return <span className={styles.iconText}>{icon}</span>;
		}

		// 如果是函数组件，渲染它
		if (typeof icon === 'function') {
			const IconComponent = icon;
			return <IconComponent />;
		}

		// 如果是React元素，直接渲染
		return icon;
	};

	return (
		<nav
			className={`${styles.navbar} ${styles[`navbar__${orientation}`]} ${className}`}
			{...props}
		>
			<ul className={styles.navList}>
				{items.map((item, index) => {
					const isActive = index === currentActive;

					return (
						<li key={index} className={styles.navItem}>
							<button
								type="button"
								className={`${styles.navLink} ${isActive ? styles.active : ''}`}
								onClick={handleItemClick(index, item.onClick)}
								disabled={item.disabled}
							>
								{/* 图标部分 */}
								{item.icon && (
									<span className={styles.icon}>
										{renderIcon(item.icon)}
									</span>
								)}

								{/* 文字内容 */}
								<span className={styles.text}>{item.text}</span>

								{/* 激活状态指示器 */}
								{isActive && <div className={styles.activeIndicator}></div>}
							</button>
						</li>
					);
				})}
			</ul>
		</nav>
	);
};

export default Navbar;