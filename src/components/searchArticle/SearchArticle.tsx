import React, { useState } from 'react';
import styles from './SearchArticle.module.css';
import SearchBox from '../searchBox/SearchBox';

const SearchPanel: React.FC = () => {
    const [searchValue, setSearchValue] = useState('');
    const [searchResults, setSearchResults] = useState<string[]>([]);
    const handleSearch = (value: string) => {
        console.log('搜索:', value);
        // 模拟搜索逻辑
        setSearchResults([`结果1 (${value})`, `结果2 (${value})`, `结果3 (${value})`]);
    };

    const handleChange = (value: string) => {
        setSearchValue(value);
    };

    return (
        <div className={styles.SearchArticlePanel}>
            <h3 className={styles.panelTitle}>文章搜索</h3>
            <SearchBox placeholder="搜索文章..." onSearch={handleSearch} onChange={handleChange} />
        </div>
    );
};

export default SearchPanel;