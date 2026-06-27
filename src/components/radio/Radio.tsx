import React, { useCallback, useState, type ChangeEvent, type KeyboardEvent, type ReactNode } from "react";
import styles from "./Radio.module.css";

// 定义组件属性类型
interface RadioProps {
  value: string | number;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (
    checked: boolean,
    value: string | number,
    event: ChangeEvent<HTMLInputElement> | KeyboardEvent<HTMLInputElement>,
  ) => void;
  name?: string;
  disabled?: boolean;
  size?: "small" | "default" | "large";
  className?: string;
  style?: React.CSSProperties;
  children?: ReactNode;
}

const Radio: React.FC<RadioProps> = ({
  value,
  checked: propsChecked,
  defaultChecked = false,
  onChange,
  name,
  disabled = false,
  size = "default",
  className = "",
  style,
  children,
  ...restProps
}) => {
  // 状态管理
  const [internalChecked, setInternalChecked] = useState(defaultChecked);

  // 受控模式判断
  const isControlled = propsChecked !== undefined;
  const checked = isControlled ? propsChecked : internalChecked;

  // 处理变化
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;

      if (!isControlled) {
        setInternalChecked(e.target.checked);
      }

      if (onChange) {
        onChange(e.target.checked, value, e);
      }
    },
    [disabled, isControlled, onChange, value],
  );

  // 处理键盘事件
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (!disabled) {
          const newChecked = !checked;
          if (!isControlled) {
            setInternalChecked(newChecked);
          }
          if (onChange) {
            onChange(newChecked, value, e);
          }
        }
      }
    },
    [checked, disabled, isControlled, onChange, value],
  );

  // 构建类名
  const radioClasses = [
    styles.radioWrapper,
    styles[`size-${size}`],
    checked ? styles.checked : "",
    disabled ? styles.disabled : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <label className={radioClasses} style={style}>
      <input
        type="radio"
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        name={name}
        className={styles.radioInput}
        {...restProps}
      />
      <span className={styles.radioIndicator}>
        <span className={styles.radioDot} />
      </span>
      {children && <span className={styles.radioLabel}>{children}</span>}
    </label>
  );
};

export default Radio;
