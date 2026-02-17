import React, { useState, useCallback, type KeyboardEvent, type ReactNode, type ForwardedRef } from "react";
import styles from "./Radio.module.css";

// 定义选项类型
export interface RadioOption {
  label: ReactNode;
  value: string | number;
  disabled?: boolean;
}

// 定义组件属性类型
interface RadioGroupProps {
  options?: RadioOption[];
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (value: string | number) => void;
  name?: string;
  disabled?: boolean;
  layout?: "horizontal" | "vertical";
  size?: "small" | "default" | "large";
  className?: string;
  style?: React.CSSProperties;
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>((props, ref: ForwardedRef<HTMLDivElement>) => {
  const {
    options = [],
    value: propsValue,
    defaultValue,
    onChange,
    name,
    disabled = false,
    layout = "horizontal",
    size = "default",
    className = "",
    style,
    ...restProps
  } = props;

  // 状态管理
  const [internalValue, setInternalValue] = useState<string | number | undefined>(defaultValue);

  // 受控模式判断
  const isControlled = propsValue !== undefined;
  const value = isControlled ? propsValue : internalValue;

  // 处理选择变化
  const handleChange = useCallback(
    (optionValue: string | number) => {
      if (disabled) return;

      if (!isControlled) {
        setInternalValue(optionValue);
      }

      if (onChange) {
        onChange(optionValue);
      }
    },
    [disabled, isControlled, onChange],
  );

  // 处理键盘事件
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>, optionValue: string | number) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleChange(optionValue);
      }
    },
    [handleChange],
  );

  // 构建类名
  const groupClasses = [
    styles.radioGroup,
    styles[`layout-${layout}`],
    styles[`size-${size}`],
    disabled ? styles.disabled : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div ref={ref} className={groupClasses} style={style} role="radiogroup" aria-disabled={disabled} {...restProps}>
      {options.map((option, _index) => {
        const isChecked = value === option.value;
        const isOptionDisabled = disabled || option.disabled;

        const radioClasses = [styles.radioWrapper, isChecked ? styles.checked : "", isOptionDisabled ? styles.disabled : ""]
          .filter(Boolean)
          .join(" ");

        return (
          <label key={option.value} className={radioClasses} htmlFor={`${name || "radio"}-${option.value}`}>
            <input
              type="radio"
              id={`${name || "radio"}-${option.value}`}
              name={name}
              value={option.value}
              checked={isChecked}
              disabled={isOptionDisabled}
              onChange={() => handleChange(option.value)}
              onKeyDown={(e) => handleKeyDown(e, option.value)}
              className={styles.radioInput}
            />
            <span className={styles.radioIndicator}>
              <span className={styles.radioDot} />
            </span>
            <span className={styles.radioLabel}>{option.label}</span>
          </label>
        );
      })}
    </div>
  );
});

RadioGroup.displayName = "RadioGroup";

export default RadioGroup;
