import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  type ForwardedRef,
  type MouseEvent,
  type CompositionEvent,
  type ChangeEvent,
  type ReactNode,
} from "react";
import styles from "./Selector.module.css";

// 定义选项类型
export interface Option {
  label: ReactNode;
  value: string | number;
  disabled?: boolean;
}

// 定义组件属性类型
interface SelectorProps {
  options?: Option[];
  value?: string | number | (string | number)[];
  defaultValue?: string | number | (string | number)[];
  onChange?: (value: string | number | (string | number)[], option: Option | Option[] | null) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  allowClear?: boolean;
  mode?: "single" | "multiple";
  showSearch?: boolean;
  size?: "small" | "default" | "large";
  className?: string;
  style?: React.CSSProperties;
  prefix?: ReactNode;
  suffix?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onDropdownVisibleChange?: (open: boolean) => void;
}

const Selector = React.forwardRef<HTMLDivElement, SelectorProps>((props, ref: ForwardedRef<HTMLDivElement>) => {
  const {
    options = [],
    value: propsValue,
    defaultValue,
    onChange,
    placeholder = "请选择",
    disabled = false,
    loading = false,
    allowClear = false,
    mode = "single",
    showSearch = false,
    size = "default",
    className = "",
    style,
    prefix,
    suffix,
    open: propsOpen,
    defaultOpen = false,
    onDropdownVisibleChange,
    ...restProps
  } = props;

  // 状态管理
  const [internalValue, setInternalValue] = useState<string | number | (string | number)[]>(
    defaultValue || (mode === "multiple" ? [] : ""),
  );
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [searchValue, setSearchValue] = useState("");
  const [isComposing, setIsComposing] = useState(false);

  // 引用
  const selectorRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 受控模式判断
  const isControlled = propsValue !== undefined;
  const value = isControlled ? propsValue : internalValue;
  const dropdownOpen = propsOpen !== undefined ? propsOpen : isOpen;

  // 过滤选项（支持搜索）
  const filteredOptions = useCallback((): Option[] => {
    if (!showSearch || !searchValue) return options;

    return options.filter((option) => String(option.label).toLowerCase().includes(searchValue.toLowerCase()));
  }, [options, searchValue, showSearch]);

  // 获取显示文本
  const getDisplayText = useCallback((): string => {
    if (mode === "multiple" && Array.isArray(value)) {
      if (value.length === 0) return placeholder;
      const selectedLabels = value.map((val) => {
        const option = options.find((opt) => opt.value === val);
        return option ? String(option.label) : String(val);
      });
      return selectedLabels.join(", ");
    }

    if (!value && value !== 0) {
      return placeholder;
    }

    const selectedOption = options.find((opt) => opt.value === value);
    return selectedOption ? String(selectedOption.label) : String(value);
  }, [value, options, mode, placeholder]);

  // 处理选择
  const handleSelect = useCallback(
    (option: Option) => {
      if (option.disabled) return;

      let newValue: string | number | (string | number)[];
      let selectedOption: Option | Option[] | null = null;

      if (mode === "multiple") {
        const currentValue = Array.isArray(value) ? value : [];
        const valueIndex = currentValue.indexOf(option.value);

        if (valueIndex > -1) {
          // 取消选择
          newValue = [...currentValue];
          newValue.splice(valueIndex, 1);
          selectedOption = options.filter((opt) => Array.isArray(value) && value.includes(opt.value));
        } else {
          // 添加选择
          newValue = [...currentValue, option.value];
          selectedOption = [...options.filter((opt) => currentValue.includes(opt.value)), option];
        }
      } else {
        newValue = option.value;
        selectedOption = option;
        // 单选模式下选择后关闭下拉
        setIsOpen(false);
        onDropdownVisibleChange && onDropdownVisibleChange(false);
      }

      if (!isControlled) {
        setInternalValue(newValue);
      }

      onChange && onChange(newValue, selectedOption);
      setSearchValue("");
    },
    [mode, value, isControlled, onChange, onDropdownVisibleChange, options],
  );

  // 清除选择
  const handleClear = useCallback(
    (e: MouseEvent<HTMLSpanElement>) => {
      e.stopPropagation();
      if (disabled || loading) return;

      const newValue = mode === "multiple" ? [] : "";
      if (!isControlled) {
        setInternalValue(newValue);
      }

      onChange && onChange(newValue, mode === "multiple" ? [] : null);
    },
    [disabled, loading, mode, isControlled, onChange],
  );

  // 切换下拉状态
  const toggleDropdown = useCallback(() => {
    if (disabled || loading) return;

    const newOpenState = !dropdownOpen;
    if (propsOpen === undefined) {
      setIsOpen(newOpenState);
    }
    onDropdownVisibleChange && onDropdownVisibleChange(newOpenState);

    // 展开时聚焦搜索输入框
    if (newOpenState && showSearch && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [dropdownOpen, disabled, loading, propsOpen, onDropdownVisibleChange, showSearch]);

  // 处理搜索输入
  const handleSearchChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (!isComposing) {
        setSearchValue(e.target.value);
      }
    },
    [isComposing],
  );

  // 处理中文输入法
  const handleCompositionStart = useCallback(() => {
    setIsComposing(true);
  }, []);

  const handleCompositionEnd = useCallback((e: CompositionEvent<HTMLInputElement>) => {
    setIsComposing(false);
    setSearchValue(e.currentTarget.value);
  }, []);

  // 点击外部关闭下拉
  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
        if (propsOpen === undefined) {
          setIsOpen(false);
        }
        onDropdownVisibleChange && onDropdownVisibleChange(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen, propsOpen, onDropdownVisibleChange]);

  // 构建类名
  const selectorClasses = [
    styles.selector,
    styles[`size-${size}`],
    disabled ? styles.disabled : "",
    loading ? styles.loading : "",
    dropdownOpen ? styles.open : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const dropdownClasses = [styles.dropdown, styles[`dropdown-size-${size}`]].filter(Boolean).join(" ");

  return (
    <div ref={ref || selectorRef} className={selectorClasses} style={style} {...restProps}>
      {/* 选择器主体 */}
      <div className={styles.selectorInput} onClick={toggleDropdown}>
        {prefix && <span className={styles.prefix}>{prefix}</span>}

        <div className={styles.selectorValue}>
          {showSearch && dropdownOpen ? (
            <input
              ref={searchInputRef}
              className={styles.searchInput}
              value={searchValue}
              onChange={handleSearchChange}
              onCompositionStart={handleCompositionStart}
              onCompositionEnd={handleCompositionEnd}
              placeholder={getDisplayText() === placeholder ? placeholder : ""}
              disabled={disabled || loading}
            />
          ) : (
            <span className={styles.displayText}>{getDisplayText()}</span>
          )}
        </div>

        <span className={styles.suffixArea}>
          {/* 修复清除按钮的条件判断 */}
          {allowClear &&
            (mode === "multiple" ? Array.isArray(value) && value.length > 0 : value !== "" && value !== undefined && value !== null) &&
            !disabled &&
            !loading && (
              <span className={styles.clearIcon} onClick={handleClear}>
                ×
              </span>
            )}
          {suffix}
          {loading ? <span className={styles.loadingIcon}>⏳</span> : <span className={styles.arrowIcon}>▼</span>}
        </span>
      </div>

      {/* 下拉面板 */}
      {dropdownOpen && (
        <div className={dropdownClasses}>
          <div className={styles.dropdownContent}>
            {filteredOptions().length === 0 ? (
              <div className={styles.noData}>暂无数据</div>
            ) : (
              filteredOptions().map((option, index) => {
                // 修复 includes 方法的使用
                const isSelected = mode === "multiple" ? Array.isArray(value) && value.includes(option.value) : value === option.value;

                const optionClasses = [styles.option, isSelected ? styles.selected : "", option.disabled ? styles.disabledOption : ""]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <div key={option.value || index} className={optionClasses} onClick={() => !option.disabled && handleSelect(option)}>
                    {mode === "multiple" && <span className={styles.checkbox}>{isSelected ? "✓" : ""}</span>}
                    <span className={styles.optionLabel}>{option.label}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
});

Selector.displayName = "Selector";

export default Selector;
