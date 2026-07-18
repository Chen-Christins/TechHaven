import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import type { CustomSelectProps, SelectOption } from "@/types/index";
import styles from "./CustomSelect.module.css";

const CustomSelect: React.FC<CustomSelectProps> = ({
  name,
  options,
  showDate = false,
  placeholder = `请选择${name}...`,
  value,
  onChange,
  className = "",
  hideBadge = false,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpwards, setOpenUpwards] = useState(false);
  const [selectedOption, setSelectedOption] = useState<SelectOption | null>(value || null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 同步外部value变化
  useEffect(() => {
    if (value !== undefined) {
      setSelectedOption(value);
      const index = value ? options.findIndex((opt) => opt.id === value.id) : -1;
      setSelectedIndex(index);
    }
  }, [value, options]);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
  }, []);

  // 点击外部关闭下拉框（包括 portal 渲染的下拉框）
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const insideContainer = containerRef.current?.contains(target);
      const insideDropdown = dropdownRef.current?.contains(target);
      if (!insideContainer && !insideDropdown) {
        closeDropdown();
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [closeDropdown]);

  const toggleDropdown = () => {
    if (disabled) return;
    if (isOpen) {
      closeDropdown();
    } else {
      openDropdown();
    }
  };

  const openDropdown = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownHeight = 320;

      const pos = { left: rect.left, width: rect.width, top: 0 };
      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        // 向上展开
        setOpenUpwards(true);
        pos.top = rect.top - 5; // 下拉框底部对齐到容器顶部上方 5px
      } else {
        // 向下展开
        setOpenUpwards(false);
        pos.top = rect.bottom + 5;
      }
      setDropdownPos(pos);
    }

    setIsOpen(true);
    setSearchTerm("");
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 0);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredOptions = options.filter((option) => option.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const selectOption = (option: SelectOption) => {
    const oldIndex = selectedIndex;
    const newIndex = options.findIndex((opt) => opt.id === option.id);

    setSelectedOption(option);
    setSelectedIndex(newIndex);

    // 调用onChange回调
    if (onChange) {
      onChange(option, newIndex, oldIndex);
    }
  };

  const clearSelection = () => {
    const oldIndex = selectedIndex;

    setSelectedOption(null);
    setSelectedIndex(-1);

    // 调用onChange回调
    if (onChange) {
      onChange(null, -1, oldIndex);
    }
  };

  const getDisplayValue = () => {
    return selectedOption ? selectedOption.name : placeholder;
  };

  const isPlaceholder = !selectedOption;

  return (
    <div ref={containerRef} className={`${styles.container} ${className}`}>
      {/* 选择框 */}
      <div
        className={`${styles.select} ${isOpen ? styles.selectOpen : ""} ${disabled ? styles.selectDisabled : ""}`}
        onClick={toggleDropdown}
      >
        <div className={`${styles.value} ${isPlaceholder ? styles.placeholder : ""}`}>{getDisplayValue()}</div>
        <div className={styles.arrow}>
          <i className="bi bi-chevron-down"></i>
        </div>
      </div>

      {/* 下拉框 (Portal 到 body，避免父级 overflow 裁切) */}
      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className={`${styles.dropdown} ${styles.dropdownOpen} ${openUpwards ? styles.dropdownUp : ""}`}
            style={{
              position: "fixed",
              top: openUpwards ? "auto" : dropdownPos.top,
              bottom: openUpwards ? window.innerHeight - dropdownPos.top : "auto",
              left: dropdownPos.left,
              width: dropdownPos.width,
              zIndex: 99999,
            }}
          >
            <div className={styles.search}>
              <input
                ref={searchInputRef}
                type="text"
                placeholder={`搜索${name}...`}
                className={styles.searchInput}
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
            <div className={styles.options}>
              {filteredOptions.length === 0 ? (
                <div className={styles.noResults}>未找到匹配的{name}</div>
              ) : (
                filteredOptions.map((option) => (
                  <div
                    key={option.id}
                    className={`${styles.option} ${selectedOption?.id === option.id ? styles.optionSelected : ""}`}
                    onClick={() => selectOption(option)}
                  >
                    {option.avatar ? (
                      <img className={styles.avatar} src={option.avatar} alt="" />
                    ) : (
                      option.color && <div className={styles.tagColor} style={{ backgroundColor: option.color }} />
                    )}
                    <div className={styles.optionText}>{option.name}</div>
                    {showDate && option.date && <div className={styles.optionCount}>{option.date}</div>}
                  </div>
                ))
              )}
            </div>
          </div>,
          document.body,
        )}

      {/* 选中标签 */}
      {selectedOption && !hideBadge && (
        <div className={styles.badge}>
          <span>{selectedOption.name}</span>
          <span className={styles.closeBtn} title="清除选择" onClick={clearSelection}>
            <i className="bi bi-x"></i>
          </span>
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
