import React, { useState, useCallback, type ReactNode, type ForwardedRef } from "react";
import Radio from "../radio/Radio";
import styles from "./RadioGroup.module.css";

export interface RadioOption {
  label: ReactNode;
  value: string | number;
  disabled?: boolean;
}

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

  const [internalValue, setInternalValue] = useState<string | number | undefined>(defaultValue);
  const isControlled = propsValue !== undefined;
  const value = isControlled ? propsValue : internalValue;

  const handleChange = useCallback(
    (optionValue: string | number) => {
      if (disabled) return;
      if (!isControlled) setInternalValue(optionValue);
      if (onChange) onChange(optionValue);
    },
    [disabled, isControlled, onChange],
  );

  const groupClasses = [styles.radioGroup, styles[`layout-${layout}`], className].filter(Boolean).join(" ");

  return (
    <div ref={ref} className={groupClasses} style={style} role="radiogroup" aria-disabled={disabled} {...restProps}>
      {options.map((option) => {
        const isChecked = value === option.value;
        const isOptionDisabled = disabled || !!option.disabled;
        return (
          <Radio
            key={option.value}
            value={option.value}
            checked={isChecked}
            onChange={() => handleChange(option.value)}
            name={name}
            disabled={isOptionDisabled}
            size={size}
          >
            {option.label}
          </Radio>
        );
      })}
    </div>
  );
});

RadioGroup.displayName = "RadioGroup";

export default RadioGroup;
