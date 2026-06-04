import React from "react";
import styles from "./SearchArticle.module.css";
import SearchBox from "../searchBox/SearchBox";

interface SearchPanelProps {
  defaultValue?: string;
  onSearch?: (query: string) => void;
}

const SearchPanel: React.FC<SearchPanelProps> = ({ defaultValue, onSearch }) => {
  return (
    <div className={styles.SearchArticlePanel}>
      <h3 className={styles.panelTitle}>搜索文章</h3>
      <SearchBox
        placeholder="搜索文章..."
        value={defaultValue ?? ""}
        onChange={(value) => {
          if (value.trim() === "") onSearch?.("");
        }}
        onSearch={(value) => onSearch?.(value)}
      />
    </div>
  );
};

export default SearchPanel;
