import type React from "react";
import styles from './IndexPage.module.css';
import ArticleList from "../../components/articleList/ArticleList";
import StatsPanel from "../../components/StatsPanel/StatsPanel";
import SubscribeBox from "../../components/SubscribeBox/SubscribeBox";
import Calendar from "../../components/calendar/Calendar";
import CategoryPanel from "../../components/categoryPanel/CategoryPanel";
import Navbar from "../../components/navbar/Navbar";

const IndexPage: React.FC = () => {
	return (
		<div className={styles.index}>
			{/* 顶部导航栏 */}
			<Navbar />

			{/* 主内容区（左右分栏） */}
			<div className={styles.mainContent}>
				{/* 左侧：文章列表（占2/3宽度） */}
				<div className={styles.leftColumn}>
					<ArticleList />
				</div>

				{/* 右侧：侧边栏（占1/3宽度） */}
				<div className={styles.rightColumn}>
					<SubscribeBox />
					<CategoryPanel />
					{/* <TagPanel /> */}
					<StatsPanel />
					<Calendar />
				</div>
			</div>
		</div>
	)
};

export default IndexPage;