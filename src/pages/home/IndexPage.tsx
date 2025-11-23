import type React from "react";
import { useEffect } from 'react';
import styles from './IndexPage.module.css';
import ArticleList from "../../components/articleList/ArticleList";
import StatsPanel from "../../components/StatsPanel/StatsPanel";
import SubscribeBox from "../../components/SubscribeBox/SubscribeBox";
import Calendar from "../../components/calendar/Calendar";
import CategoryPanel from "../../components/categoryPanel/CategoryPanel";
import Navbar from "../../components/navbar/Navbar";
import Footer from "../../components/footer/Footer";
import TagPanel from "../../components/tagPanel/TagPanel";
import SearchPanel from "../../components/searchArticle/SearchArticle";
import BackToTop from "../../components/backToTop/BackToTop";
// import { CookieHelper } from "../../utils/cookieHelper";
import { useAuth } from "../../contexts/AuthContext";
import { AuthService } from "../../services/authService";

const IndexPage: React.FC = () => {
	useAuth();

	// 页面加载时检查cookies状态（用于调试登录后cookies是否保持）
	// useEffect(() => {
	// 	console.log('🏠 主页面加载，检查Cookies状态...');
	// 	CookieHelper.debugCookies();
	// 	console.log('🔍 是否有认证相关Cookies:', CookieHelper.hasAuthCookies());
	// }, []);

	const mockTags = [
		{ id: '1', color: '#3b82f6', name: 'React' },
		{ id: '2', color: '#ef4444', name: 'TypeScript' },
		{ id: '3', color: '#10b981', name: 'CSS Modules' },
		// { id: '4', color: '#f59e0b', name: '前端开发' },
		// { id: '5', color: '#8b5cf6', name: '组件库' },
		// { id: '6', color: '#ec4899', name: 'UI设计' },
		// { id: '7', color: '#ec4899', name: 'UI设计' },
		// { id: '8', color: '#ec4899', name: 'UI设计' },
		// { id: '9', color: '#ec4899', name: 'UI设计' },
		// { id: '10', color: '#ec4899', name: 'UI设计' },
		// { id: '11', color: '#ec4899', name: 'UI设计' },
	];
	return (
		<div className={styles.index}>
			{/* 顶部导航栏 */}
			<Navbar />

			{/* 主内容区（左右分栏） */}
			<div className={styles.mainContent}>
				{/* 左侧：文章列表*/}
				<div className={styles.leftColumn}>
					<ArticleList />
				</div>

				{/* 右侧：侧边栏 */}
				<div className={styles.rightColumn}>
                    <SearchPanel />
					<TagPanel tags={mockTags}/>
					<SubscribeBox />
					<CategoryPanel />
					<StatsPanel />
					<Calendar />
				</div>
			</div>
			<Footer companyName="TechBlog" startYear={2025} />
			<BackToTop />
		</div>
	)
};

export default IndexPage;