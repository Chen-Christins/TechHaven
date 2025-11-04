import Navbar from '../components/navbar/Navbar';

function SampleNavBar() {
	const HomeIcon = () => <span>🏠</span>;
	const UserIcon = () => <span>👤</span>;
	const ChartIcon = () => <span>📊</span>;

	const navItems = [
		{
			text: '首页',
			icon: <HomeIcon />,
			onClick: (_e: any, index: any) => console.log('点击首页', index)
		},
		{
			text: '用户管理',
			icon: <UserIcon />,
		},
		{
			text: '数据统计',
			icon: ChartIcon,
		},
		{
			text: '系统设置',
			icon: 'https://example.com/settings-icon.png', // 图片URL
			disabled: true
		},
		{
			text: '关于我们',
			icon: 'ℹ️', // Emoji也可以
		}
	];

	const handleNavClick = (index: any) => {
		console.log('导航项被点击:', index);
		// 这里可以处理路由跳转等逻辑
	};

	return (
		<>
			<div style={{ padding: '20px' }}>
				<h2>横向导航栏示例</h2>
				<Navbar
					items={navItems}
					onItemClick={handleNavClick}
					className="custom-navbar"
				/>

				<h2 style={{ marginTop: '40px' }}>纵向导航栏示例</h2>
				<Navbar
					items={navItems}
					orientation="vertical"
					onItemClick={handleNavClick}
				/>
			</div>
		</>
	)
}

export default SampleNavBar;
