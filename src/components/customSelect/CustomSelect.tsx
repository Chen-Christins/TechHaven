import React, { useState, useRef, useEffect } from 'react';
import type { CustomSelectProps, SelectOption } from '../../types/index';
import styles from './CustomSelect.module.css';

const CustomSelect: React.FC<CustomSelectProps> = ({
    name,
    options,
    showDate = false,
    placeholder = `请选择${name}...`,
    value,
    onChange,
    className = ''
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState<SelectOption | null>(value || null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(-1);

    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // 同步外部value变化
    useEffect(() => {
        if (value !== undefined) {
            setSelectedOption(value);
            const index = value ? options.findIndex(opt => opt.id === value.id) : -1;
            setSelectedIndex(index);
        }
    }, [value, options]);

    // 点击外部关闭下拉框
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                closeDropdown();
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

    const toggleDropdown = () => {
        if (isOpen) {
            closeDropdown();
        } else {
            openDropdown();
        }
    };

    const openDropdown = () => {
        setIsOpen(true);
        setSearchTerm('');
        // 延迟focus以确保dropdown已经打开
        setTimeout(() => {
            searchInputRef.current?.focus();
        }, 0);
    };

    const closeDropdown = () => {
        setIsOpen(false);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const filteredOptions = options.filter(option =>
        option.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectOption = (option: SelectOption) => {
        const oldIndex = selectedIndex;
        const newIndex = options.findIndex(opt => opt.id === option.id);

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
        <div
            ref={containerRef}
            className={`${styles.container} ${className}`}
        >
            {/* 选择框 */}
            <div
                className={`${styles.select} ${isOpen ? styles.selectOpen : ''}`}
                onClick={toggleDropdown}
            >
                <div className={`${styles.value} ${isPlaceholder ? styles.placeholder : ''}`}>
                    {getDisplayValue()}
                </div>
                <div className={styles.arrow}>
                    <i className="bi bi-chevron-down"></i>
                </div>
            </div>

            {/* 下拉框 */}
            <div className={`${styles.dropdown} ${isOpen ? styles.dropdownOpen : ''}`}>
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
                        <div className={styles.noResults}>
                            未找到匹配的{name}
                        </div>
                    ) : (
                        filteredOptions.map(option => (
                            <div
                                key={option.id}
                                className={`${styles.option} ${selectedOption?.id === option.id ? styles.optionSelected : ''
                                    }`}
                                onClick={() => selectOption(option)}
                            >
                                {option.color && (
                                    <div
                                        className={styles.tagColor}
                                        style={{ backgroundColor: option.color }}
                                    />
                                )}
                                <div className={styles.optionText}>{option.name}</div>
                                {showDate && option.date && (
                                    <div className={styles.optionCount}>{option.date}</div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* 选中标签 */}
            {selectedOption && (
                <div className={styles.badge}>
                    <span>{selectedOption.name}</span>
                    <span
                        className={styles.closeBtn}
                        title="清除选择"
                        onClick={clearSelection}
                    >
                        <i className="bi bi-x"></i>
                    </span>
                </div>
            )}
        </div>
    );
};

export default CustomSelect;