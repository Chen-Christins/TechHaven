import React, { type MouseEvent, type ReactNode } from "react";
import styles from "./Button.module.css"; // 导入 CSS Module 样式

// 定义组件的 Props 类型
interface ButtonProps {
  children: ReactNode;
  color?: "primary" | "secondary" | "success" | "warning" | "error" | "info";
  variant?: "solid" | "outline" | "ghost";
  size?: "tiny" | "small" | "medium" | "large";
  disabled?: boolean;
  loading?: boolean;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  type?: "button" | "submit" | "reset";
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  color = "primary",
  variant = "solid",
  size = "medium",
  disabled = false,
  loading = false,
  onClick,
  type = "button",
  className = "",
  ...props
}) => {
  // 动态构建 className
  const buttonClasses = [
    styles.btn, // 基础按钮样式
    styles[`btn__${color}`], // 颜色样式，例如 btn__primary
    styles[`btn__${variant}`], // 变体样式，例如 btn__solid
    styles[`btn__${size}`], // 尺寸样式，例如 btn__medium
    disabled ? styles["btn--disabled"] : "", // 禁用状态
    loading ? styles["btn--loading"] : "", // 加载状态
    className, // 用户传入的额外类名
  ]
    .filter(Boolean)
    .join(" ");

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading && onClick) {
      onClick(e);
    }
  };

  return (
    <button type={type} className={buttonClasses} disabled={disabled || loading} onClick={handleClick} {...props}>
      {loading && <span className={styles.btnSpinner}></span>}
      {children}
    </button>
  );
};

export default Button;
