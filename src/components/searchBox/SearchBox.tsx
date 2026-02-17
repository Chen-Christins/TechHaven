import React, { useState, useRef, useEffect } from "react";
import styles from "./SearchBox.module.css";

// 搜索图标组件
const SearchIcon = () => (
  <svg className={styles.searchIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

// 清除图标组件
const ClearIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// 组件属性类型定义
export interface SearchProps {
  /** 输入框的值 */
  value?: string;
  /** 输入框默认值 */
  defaultValue?: string;
  /** 输入框占位符 */
  placeholder?: string;
  /** 搜索按钮文本 */
  buttonText?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否显示清除按钮 */
  showClear?: boolean;
  /** 是否自动获取焦点 */
  autoFocus?: boolean;
  /** 变体样式 */
  variant?: "default" | "outline" | "filled";
  /** 尺寸 */
  size?: "small" | "medium" | "large";
  /** 错误状态 */
  error?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 输入框变化时的回调 */
  onChange?: (value: string) => void;
  /** 搜索时的回调 */
  onSearch?: (value: string) => void;
  /** 输入框获得焦点时的回调 */
  onFocus?: () => void;
  /** 输入框失去焦点时的回调 */
  onBlur?: () => void;
  /** 按下回车键时的回调 */
  onPressEnter?: (value: string) => void;
}

const SearchBox: React.FC<SearchProps> = ({
  value,
  defaultValue = "",
  placeholder = "请输入搜索内容...",
  buttonText = "",
  disabled = false,
  showClear = true,
  autoFocus = false,
  variant = "default",
  size = "medium",
  error = false,
  className = "",
  onChange,
  onSearch,
  onFocus,
  onBlur,
  onPressEnter,
}) => {
  const [inputValue, setInputValue] = useState(value || defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  // 同步外部value变化
  useEffect(() => {
    if (value !== undefined) {
      setInputValue(value);
    }
  }, [value]);

  // 自动聚焦
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // 处理输入变化
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange?.(newValue);
  };

  // 处理搜索
  const handleSearch = () => {
    if (!disabled) {
      onSearch?.(inputValue);
    }
  };

  // 处理清除
  const handleClear = () => {
    setInputValue("");
    onChange?.("");
    // 清除后重新聚焦到输入框
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !disabled) {
      handleSearch();
      onPressEnter?.(inputValue);
    }
  };

  // 构建容器类名
  const containerClasses = [
    styles.searchContainer,
    styles[`variant${variant.charAt(0).toUpperCase() + variant.slice(1)}`],
    styles[`size${size.charAt(0).toUpperCase() + size.slice(1)}`],
    disabled ? styles.disabled : "",
    error ? styles.error : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClasses}>
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={styles.searchInput}
      />

      {showClear && inputValue && !disabled && (
        <button type="button" className={styles.clearButton} onClick={handleClear} aria-label="清除搜索内容">
          <ClearIcon />
        </button>
      )}

      <button type="button" className={styles.searchButton} onClick={handleSearch} disabled={disabled}>
        <SearchIcon />
        <span className={styles.searchButtonText}>{buttonText}</span>
      </button>
    </div>
  );
};

export default SearchBox;
