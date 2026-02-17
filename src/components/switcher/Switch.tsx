import React, { useState, useRef, useCallback, forwardRef, type ForwardedRef, type KeyboardEvent, type MouseEvent } from "react";
import styles from "./Switch.module.css";

// 定义组件属性类型
interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean, event: MouseEvent<HTMLButtonElement> | KeyboardEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  size?: "small" | "default" | "large";
  onColor?: string;
  offColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

const Switch = forwardRef<HTMLButtonElement, SwitchProps>((props, ref: ForwardedRef<HTMLButtonElement>) => {
  const {
    checked: propsChecked,
    defaultChecked = false,
    onChange,
    disabled = false,
    size = "default",
    onColor = "#1890ff",
    offColor = "#cccccc",
    className = "",
    style,
    ...restProps
  } = props;

  // 状态管理
  const [internalChecked, setInternalChecked] = useState<boolean>(defaultChecked);
  const switchRef = useRef<HTMLButtonElement>(null);

  // 受控模式判断
  const isControlled = propsChecked !== undefined;
  const checked = isControlled ? propsChecked : internalChecked;

  // 处理切换事件
  const handleToggle = useCallback(
    (event: MouseEvent<HTMLButtonElement> | KeyboardEvent<HTMLButtonElement>) => {
      if (disabled) return;

      const newChecked = !checked;

      // 非受控模式下更新内部状态
      if (!isControlled) {
        setInternalChecked(newChecked);
      }

      // 触发回调
      if (onChange) {
        onChange(newChecked, event);
      }
    },
    [checked, disabled, isControlled, onChange],
  );

  // 处理键盘事件
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (disabled) return;

      // 支持空格键和回车键切换
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        handleToggle(event);
      }
    },
    [disabled, handleToggle],
  );

  // 构建类名
  const switchClasses = [
    styles.switch,
    styles[`size-${size}`],
    checked ? styles.checked : "",
    disabled ? styles.disabled : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  // 计算滑块位置和颜色
  const switchStyle: React.CSSProperties = {
    ...style,
    "--on-color": onColor,
    "--off-color": offColor,
  } as React.CSSProperties;

  return (
    <button
      ref={ref || switchRef}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      className={switchClasses}
      style={switchStyle}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      {...restProps}
    >
      <span className={styles.slider}>
        <span className={styles.handle} />
      </span>
    </button>
  );
});

// 添加显示名便于调试
Switch.displayName = "Switch";

export default Switch;
