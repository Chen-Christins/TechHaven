import React from "react";
import styles from "./PageSkeleton.module.css";
import Skeleton from "../skeleton/Skeleton";

const PageSkeleton: React.FC = () => {
    return (
        <div className={styles.pageSkeleton}>
            {/* 主内容区域骨架 */}
            <main className={styles.mainSkeleton}>
                <div className={styles.leftColumn}>
                    {/* 搜索框骨架 */}
                    <div className={styles.searchSkeleton}>
                        <Skeleton variant="rounded" width="100%" height={48} />
                    </div>

                    {/* 文章列表骨架 */}
                    <div className={styles.articleListSkeleton}>
                        {Array.from({ length: 5 }, (_, index) => (
                            <div key={index} className={styles.articleCardSkeleton}>
                                <div className={styles.articleHeader}>
                                    <Skeleton variant="text" width="70%" height={24} />
                                    <Skeleton variant="text" width={120} height={16} />
                                </div>
                                <div className={styles.articleContent}>
                                    <Skeleton variant="text" lines={3} />
                                </div>
                                <div className={styles.articleFooter}>
                                    <Skeleton variant="circular" width={24} height={24} />
                                    <Skeleton variant="text" width={80} height={16} />
                                    <div className={styles.articleTags}>
                                        <Skeleton variant="rectangular" width={60} height={20} />
                                        <Skeleton variant="rectangular" width={60} height={20} />
                                        <Skeleton variant="rectangular" width={60} height={20} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={styles.rightColumn}>
                    {/* 搜索面板骨架 */}
                    <div className={styles.searchPanelSkeleton}>
                        <Skeleton variant="rounded" width="100%" height={40} />
                    </div>

                    {/* 标签面板骨架 */}
                    <div className={styles.tagPanelSkeleton}>
                        <Skeleton variant="text" width={80} height={20} />
                        <div className={styles.tagCloud}>
                            {Array.from({ length: 8 }, (_, index) => (
                                <Skeleton
                                    key={index}
                                    variant="rectangular"
                                    width={40 + Math.random() * 40}
                                    height={24}
                                />
                            ))}
                        </div>
                    </div>

                    {/* 订阅框骨架 */}
                    <div className={styles.subscribeSkeleton}>
                        <Skeleton variant="rounded" width="100%" height={120} />
                    </div>

                    {/* 分类面板骨架 */}
                    <div className={styles.categorySkeleton}>
                        <Skeleton variant="text" width={80} height={20} />
                        {Array.from({ length: 4 }, (_, index) => (
                            <div key={index} className={styles.categoryItem}>
                                <Skeleton variant="text" width={100} height={16} />
                                <Skeleton variant="text" width={30} height={14} />
                            </div>
                        ))}
                    </div>

                    {/* 统计面板骨架 */}
                    <div className={styles.statsSkeleton}>
                        <Skeleton variant="rounded" width="100%" height={100} />
                    </div>

                    {/* 日历骨架 */}
                    <div className={styles.calendarSkeleton}>
                        <Skeleton variant="rounded" width="100%" height={200} />
                    </div>
                </div>
            </main>

            {/* 页脚骨架 */}
            <footer className={styles.footerSkeleton}>
                <div className={styles.footerContent}>
                    <Skeleton variant="text" width={120} height={16} />
                    <Skeleton variant="text" width={200} height={14} />
                </div>
            </footer>
        </div>
    );
};

export default PageSkeleton;
