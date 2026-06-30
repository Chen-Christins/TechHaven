import React from "react";
import styles from "./SearchArticle.module.css";
import SearchBox from "../searchBox/SearchBox";

interface SearchPanelProps {
  onSearch?: (keyword: string) => void;
}

const SearchPanel: React.FC<SearchPanelProps> = ({ onSearch }) => {
  const handleSearch = (value: string) => {
    onSearch?.(value.trim());
  };

  return (
    <div className={styles.SearchArticlePanel}>
      <h3 className={styles.panelTitle}>搜索文章</h3>
      <SearchBox placeholder="搜索文章..." onSearch={handleSearch} />
    </div>
  );
};

export default SearchPanel;
