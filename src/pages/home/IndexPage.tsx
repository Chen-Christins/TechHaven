import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import styles from "./IndexPage.module.css";
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
import LabelService from "../../services/labelService";
import PageSkeleton from "../../components/pageSkeleton/PageSkeleton";
import { useAuth } from "../../contexts/AuthContext";

const IndexPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const searchQuery = searchParams.get("q") || undefined;

  const [tags, setTags] = useState<{ id: string | number; color: string; name: string }[]>([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [selectedLabelId, setSelectedLabelId] = useState<string | number | undefined>(undefined);
  const [selectedLabelName, setSelectedLabelName] = useState<string | undefined>(undefined);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | number | undefined>(undefined);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | undefined>(undefined);

  const handleSearch = useCallback(
    (query: string) => {
      const trimmed = query.trim();
      if (trimmed) {
        setSearchParams({ q: trimmed, page: "1" });
        setSelectedLabelId(undefined);
        setSelectedLabelName(undefined);
        setSelectedCategoryId(undefined);
        setSelectedCategoryName(undefined);
      } else {
        // 清空搜索时回到默认列表
        const params = new URLSearchParams(searchParams);
        params.delete("q");
        params.delete("page");
        setSearchParams(params);
      }
    },
    [searchParams, setSearchParams],
  );

  // 获取标签（使用 LabelService），仅在已登录时请求
  useEffect(() => {
    const fetchTags = async () => {
      setTagsLoading(true);
      if (!user || !user.id) {
        setTags([]);
        setTagsLoading(false);
        return;
      }

      try {
        const res = await LabelService.queryLabel({ user_id: user.id });
        const mapped = (res || []).map((t: any) => ({
          id: t.id,
          name: t.name,
          color: t.color || "#61dafb",
        }));
        setTags(mapped);
      } catch (err) {
        console.error("获取标签失败:", err);
        setTags([]);
      } finally {
        setTagsLoading(false);
      }
    };

    fetchTags();
  }, [user]);

  // 控制初始加载和内容显示
  useEffect(() => {
    if (!authLoading && !tagsLoading) {
      // 延迟显示内容以创建平滑过渡
      const timer = setTimeout(() => {
        setShowContent(true);
        // 稍后延迟移除骨架屏，确保过渡动画完成
        setTimeout(() => {
          setIsInitialLoad(false);
        }, 100);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [authLoading, tagsLoading]);

  return (
    <div className={styles.index}>
      {/* 导航栏：直接渲染，不参与骨架屏加载 */}
      <Navbar />

      {/* 主内容区域 */}
      {isInitialLoad ? (
        <PageSkeleton />
      ) : (
        <div className={`${styles.mainContent} ${showContent ? styles.contentVisible : styles.contentHidden}`}>
          {/* 左侧：文章列表 */}
          <div className={styles.leftColumn}>
            <ArticleList
              labelId={selectedLabelId}
              labelName={selectedLabelName}
              categoryId={selectedCategoryId}
              categoryName={selectedCategoryName}
              searchQuery={searchQuery}
            />
          </div>

          {/* 右侧：侧边栏 */}
          <div className={styles.rightColumn}>
            {/* 标签面板可能仍在加载，显示局部加载状态 */}
            <SearchPanel defaultValue={searchQuery} onSearch={handleSearch} />
            <TagPanel
              tags={tags}
              loading={tagsLoading}
              selectedTagId={selectedLabelId}
              onTagClick={(tag) => {
                if (selectedLabelId === tag.id) {
                  // 再次点击取消选中
                  setSelectedLabelId(undefined);
                  setSelectedLabelName(undefined);
                } else {
                  setSelectedLabelId(tag.id);
                  setSelectedLabelName(tag.name);
                  // 清除分类筛选
                  setSelectedCategoryId(undefined);
                  setSelectedCategoryName(undefined);
                }
              }}
            />
            <SubscribeBox />
            <CategoryPanel
              selectedCategoryId={selectedCategoryId}
              onCategoryClick={(id, name) => {
                if (selectedCategoryId === id) {
                  // 再次点击取消选中
                  setSelectedCategoryId(undefined);
                  setSelectedCategoryName(undefined);
                } else {
                  setSelectedCategoryId(id);
                  setSelectedCategoryName(name);
                  // 清除标签筛选
                  setSelectedLabelId(undefined);
                  setSelectedLabelName(undefined);
                }
              }}
            />
            <StatsPanel />
            <Calendar />
          </div>
        </div>
      )}

      <Footer startYear={2025} />
      <BackToTop />
    </div>
  );
};

export default IndexPage;
