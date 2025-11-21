import React from 'react';
import styles from './SearchArticle.module.css';
import SearchBox from '../searchBox/SearchBox';

const SearchPanel: React.FC = () => {
    const handleSearch = (value: string) => {
        console.log('搜索:', value);
        // 模拟搜索逻辑
    };

    const handleChange = (value: string) => {
        console.log('输入变化:', value);
    };

    return (
        <div className={styles.SearchArticlePanel}>
            <h3 className={styles.panelTitle}>文章搜索</h3>
            <SearchBox placeholder="搜索文章..." onSearch={handleSearch} onChange={handleChange} />
        </div>
    );
};

export default SearchPanel;