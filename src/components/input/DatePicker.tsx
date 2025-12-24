import React, { useState, useRef, useEffect, useCallback } from "react";
import styles from "./DatePicker.module.css";
import Input from "../input/Input";

// 定义 showTime 配置接口
interface ShowTimeConfig {
    format?: string;
    hourStep?: number;
    minuteStep?: number;
    secondStep?: number;
    disabledHours?: () => number[];
    disabledMinutes?: (hour: number) => number[];
    disabledSeconds?: (hour: number, minute: number) => number[];
    hideDisabledOptions?: boolean;
    showHour?: boolean;
    showMinute?: boolean;
    showSecond?: boolean;
}

// 定义日期选择器的属性接口
interface DatePickerProps {
    value?: Date;
    defaultValue?: Date;
    onChange?: (date: Date | null) => void;
    placeholder?: string;
    disabled?: boolean;
    allowClear?: boolean;
    format?: string;
    className?: string;
    style?: React.CSSProperties;
    size?: "small" | "default" | "large";
    minDate?: Date;
    maxDate?: Date;
    showTime?: boolean | ShowTimeConfig;
    picker?: "date" | "year" | "month" | "time";
}

// 日期选择器组件
const DatePicker: React.FC<DatePickerProps> = ({
    value,
    defaultValue,
    onChange,
    placeholder = "请选择日期",
    disabled = false,
    allowClear = true,
    format,
    className = "",
    style,
    size = "default",
    minDate,
    maxDate,
    showTime = false,
    picker = "date",
}) => {
    const [selectedDate, setSelectedDate] = useState<Date | null>(value || defaultValue || null);
    const [currentViewDate, setCurrentViewDate] = useState<Date>(selectedDate || new Date());
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [inputValue, setInputValue] = useState<string>("");
    const [currentHour, setCurrentHour] = useState<number>(0);
    const [currentMinute, setCurrentMinute] = useState<number>(0);
    const [currentSecond, setCurrentSecond] = useState<number>(0);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // 判断是否为受控模式
    const isControlled = value !== undefined;
    const displayedDate = isControlled ? value : selectedDate;

    // 获取 showTime 配置
    const showTimeConfig = typeof showTime === "object" ? showTime : {};
    const isShowTime = Boolean(showTime);

    // 根据 picker 和 showTime 确定默认格式
    const getDefaultFormat = () => {
        if (format) return format;

        if (picker === "year") return "YYYY";
        if (picker === "month") return "YYYY-MM";
        if (picker === "time") {
            const timeFormat = showTimeConfig.format || "HH:mm:ss";
            return timeFormat;
        }

        if (isShowTime) {
            const timeFormat = showTimeConfig.format || "HH:mm:ss";
            return `YYYY-MM-DD ${timeFormat}`;
        }

        return "YYYY-MM-DD";
    };

    const actualFormat = getDefaultFormat();

    // 星期和月份的中文显示
    const weekDays = ["日", "一", "二", "三", "四", "五", "六"];
    const monthNames = [
        "一月",
        "二月",
        "三月",
        "四月",
        "五月",
        "六月",
        "七月",
        "八月",
        "九月",
        "十月",
        "十一月",
        "十二月",
    ];

    // 格式化日期
    const formatDate = useCallback((date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hour = String(date.getHours()).padStart(2, "0");
        const minute = String(date.getMinutes()).padStart(2, "0");
        const second = String(date.getSeconds()).padStart(2, "0");

        let result = actualFormat;
        result = result.replace("YYYY", String(year));
        result = result.replace("MM", month);
        result = result.replace("DD", day);
        result = result.replace("HH", hour);
        result = result.replace("mm", minute);
        result = result.replace("ss", second);

        return result;
    }, [actualFormat]);

    // 解析日期字符串
    const parseDate = (dateStr: string): Date | null => {
        if (!dateStr) return null;
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? null : date;
    };

    // 获取月份的日期数据
    const getMonthDays = (year: number, month: number) => {
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = [];

        // 上月剩余天数
        for (let i = firstDay - 1; i >= 0; i--) {
            days.push({
                day: new Date(year, month, -i).getDate(),
                isCurrentMonth: false,
                date: new Date(year, month, -i),
            });
        }

        // 当月天数
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            days.push({
                day: i,
                isCurrentMonth: true,
                date: date,
            });
        }

        // 下月开始天数
        const remainingDays = 42 - days.length; // 6行 * 7天
        for (let i = 1; i <= remainingDays; i++) {
            days.push({
                day: i,
                isCurrentMonth: false,
                date: new Date(year, month + 1, i),
            });
        }

        return days;
    };

    // 检查日期是否可选
    const isDateSelectable = (date: Date): boolean => {
        if (minDate && date < minDate) return false;
        if (maxDate && date > maxDate) return false;
        return true;
    };

    // 检查日期是否为今天
    const isToday = (date: Date): boolean => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    // 检查日期是否被选中
    const isSelected = (date: Date): boolean => {
        return displayedDate?.toDateString() === date.toDateString();
    };

    // 切换月份
    const changeMonth = (direction: "prev" | "next") => {
        setCurrentViewDate(
            (prev) => new Date(prev.getFullYear(), prev.getMonth() + (direction === "prev" ? -1 : 1), 1),
        );
    };

    // 切换年份
    const changeYear = (direction: "prev" | "next") => {
        setCurrentViewDate(
            (prev) => new Date(prev.getFullYear() + (direction === "prev" ? -1 : 1), prev.getMonth(), 1),
        );
    };

    // 选择日期
    const selectDate = (date: Date) => {
        if (!isDateSelectable(date)) return;

        // 如果显示时间，需要设置时间
        let finalDate = new Date(date);
        if (isShowTime) {
            finalDate.setHours(currentHour, currentMinute, currentSecond);
        }

        if (!isControlled) {
            setSelectedDate(finalDate);
        }
        setInputValue(formatDate(finalDate));
        setIsOpen(false);
        if (onChange) {
            onChange(finalDate);
        }
    };

    // 时间选择处理
    const handleTimeChange = (type: "hour" | "minute" | "second", value: number) => {
        switch (type) {
            case "hour":
                setCurrentHour(value);
                break;
            case "minute":
                setCurrentMinute(value);
                break;
            case "second":
                setCurrentSecond(value);
                break;
        }

        // 如果有选中的日期，实时更新
        if (displayedDate) {
            const updatedDate = new Date(displayedDate);
            if (type === "hour") updatedDate.setHours(value);
            if (type === "minute") updatedDate.setMinutes(value);
            if (type === "second") updatedDate.setSeconds(value);

            if (!isControlled) {
                setSelectedDate(updatedDate);
            }
            setInputValue(formatDate(updatedDate));
            if (onChange) {
                onChange(updatedDate);
            }
        }
    };

    // 生成小时选项
    const generateHours = () => {
        const hours = [];
        const disabledHours = showTimeConfig.disabledHours?.() || [];
        for (let i = 0; i < 24; i++) {
            if (!showTimeConfig.hideDisabledOptions || !disabledHours.includes(i)) {
                hours.push(i);
            }
        }
        return hours;
    };

    // 生成分钟选项
    const generateMinutes = (hour: number) => {
        const minutes = [];
        const disabledMinutes = showTimeConfig.disabledMinutes?.(hour) || [];
        const step = showTimeConfig.minuteStep || 1;
        for (let i = 0; i < 60; i += step) {
            if (!showTimeConfig.hideDisabledOptions || !disabledMinutes.includes(i)) {
                minutes.push(i);
            }
        }
        return minutes;
    };

    // 生成秒选项
    const generateSeconds = (hour: number, minute: number) => {
        const seconds = [];
        const disabledSeconds = showTimeConfig.disabledSeconds?.(hour, minute) || [];
        const step = showTimeConfig.secondStep || 1;
        for (let i = 0; i < 60; i += step) {
            if (!showTimeConfig.hideDisabledOptions || !disabledSeconds.includes(i)) {
                seconds.push(i);
            }
        }
        return seconds;
    };

    // 清除日期
    const handleClear = () => {
        if (!isControlled) {
            setSelectedDate(null);
        }
        setInputValue("");
        setIsOpen(false);
        if (onChange) {
            onChange(null);
        }
    };

    // 处理输入框变化
    const handleInputChange = (value: string) => {
        setInputValue(value);
        const date = parseDate(value);
        if (date && isDateSelectable(date)) {
            if (!isControlled) {
                setSelectedDate(date);
            }
            if (onChange) {
                onChange(date);
            }
        }
    };

    // 点击外部关闭下拉框
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // 同步外部value变化
    useEffect(() => {
        if (displayedDate) {
            setInputValue(formatDate(displayedDate));
            setCurrentViewDate(displayedDate);
            setCurrentHour(displayedDate.getHours());
            setCurrentMinute(displayedDate.getMinutes());
            setCurrentSecond(displayedDate.getSeconds());
        } else {
            setInputValue("");
            const now = new Date();
            setCurrentHour(now.getHours());
            setCurrentMinute(now.getMinutes());
            setCurrentSecond(now.getSeconds());
        }
    }, [displayedDate, formatDate]);

    const year = currentViewDate.getFullYear();
    const month = currentViewDate.getMonth();
    const days = getMonthDays(year, month);

    // 渲染时间选择器
    const renderTimePicker = () => {
        if (!isShowTime && picker !== "time") return null;

        const hours = generateHours();
        const minutes = generateMinutes(currentHour);
        const seconds = generateSeconds(currentHour, currentMinute);
        const showHour = showTimeConfig.showHour !== false;
        const showMinute = showTimeConfig.showMinute !== false;
        const showSecond = showTimeConfig.showSecond !== false;

        return (
            <div className={styles.timePicker}>
                {showHour && (
                    <div className={styles.timeColumn}>
                        <div className={styles.timeLabel}>时</div>
                        <div className={styles.timeList}>
                            {hours.map((hour) => (
                                <button
                                    key={hour}
                                    type="button"
                                    className={`${styles.timeOption} ${currentHour === hour ? styles.selected : ""}`}
                                    onClick={() => handleTimeChange("hour", hour)}
                                >
                                    {String(hour).padStart(2, "0")}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                {showMinute && (
                    <div className={styles.timeColumn}>
                        <div className={styles.timeLabel}>分</div>
                        <div className={styles.timeList}>
                            {minutes.map((minute) => (
                                <button
                                    key={minute}
                                    type="button"
                                    className={`${styles.timeOption} ${currentMinute === minute ? styles.selected : ""}`}
                                    onClick={() => handleTimeChange("minute", minute)}
                                >
                                    {String(minute).padStart(2, "0")}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                {showSecond && (
                    <div className={styles.timeColumn}>
                        <div className={styles.timeLabel}>秒</div>
                        <div className={styles.timeList}>
                            {seconds.map((second) => (
                                <button
                                    key={second}
                                    type="button"
                                    className={`${styles.timeOption} ${currentSecond === second ? styles.selected : ""}`}
                                    onClick={() => handleTimeChange("second", second)}
                                >
                                    {String(second).padStart(2, "0")}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // 渲染日期选择器
    const renderDatePicker = () => {
        if (picker === "time") return null;

        return (
            <>
                <div className={styles.datePickerHeader}>
                    <div className={styles.headerNavigation}>
                        <div className={styles.yearMonthNavigation}>
                            {picker !== "year" && (
                                <>
                                    <button
                                        type="button"
                                        className={styles.navButton}
                                        onClick={() => changeYear("prev")}
                                    >
                                        «
                                    </button>
                                    {picker !== "month" && (
                                        <button
                                            type="button"
                                            className={styles.navButton}
                                            onClick={() => changeMonth("prev")}
                                        >
                                            ‹
                                        </button>
                                    )}
                                </>
                            )}
                            <span className={styles.headerText}>
                                {picker === "year"
                                    ? `${Math.floor(year / 10) * 10 - 1} - ${Math.floor(year / 10) * 10 + 10} 年代`
                                    : `${year}年 ${picker === "month" ? "" : monthNames[month]}`}
                            </span>
                            {picker !== "year" && (
                                <>
                                    {picker !== "month" && (
                                        <button
                                            type="button"
                                            className={styles.navButton}
                                            onClick={() => changeMonth("next")}
                                        >
                                            ›
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        className={styles.navButton}
                                        onClick={() => changeYear("next")}
                                    >
                                        »
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {picker !== "year" && picker !== "month" && (
                    <div className={styles.datePickerBody}>
                        <div className={styles.weekHeader}>
                            {weekDays.map((day) => (
                                <div key={day} className={styles.weekDay}>
                                    {day}
                                </div>
                            ))}
                        </div>

                        <div className={styles.daysGrid}>
                            {days.map((dayData, index) => {
                                const { day, isCurrentMonth, date } = dayData;
                                const selectable = isDateSelectable(date);
                                const today = isToday(date);
                                const selected = isSelected(date);

                                return (
                                    <button
                                        key={index}
                                        type="button"
                                        className={`
                                            ${styles.dayCell}
                                            ${!isCurrentMonth ? styles.otherMonth : ""}
                                            ${today ? styles.today : ""}
                                            ${selected ? styles.selected : ""}
                                            ${!selectable ? styles.disabled : ""}
                                        `}
                                        onClick={() => selectable && selectDate(date)}
                                        disabled={!selectable}
                                    >
                                        {day}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {picker === "month" && (
                    <div className={styles.monthsGrid}>
                        {monthNames.map((monthName, index) => {
                            const monthDate = new Date(year, index, 1);
                            const selectable = isDateSelectable(monthDate);
                            const selected =
                                displayedDate?.getMonth() === index && displayedDate?.getFullYear() === year;

                            return (
                                <button
                                    key={monthName}
                                    type="button"
                                    className={`
                                        ${styles.monthCell}
                                        ${selected ? styles.selected : ""}
                                        ${!selectable ? styles.disabled : ""}
                                    `}
                                    onClick={() => selectable && selectDate(monthDate)}
                                    disabled={!selectable}
                                >
                                    {monthName}
                                </button>
                            );
                        })}
                    </div>
                )}

                {picker === "year" && (
                    <div className={styles.yearsGrid}>
                        {Array.from({ length: 12 }, (_, i) => {
                            const startYear = Math.floor(year / 10) * 10 - 1;
                            const yearValue = startYear + i;
                            const yearDate = new Date(yearValue, 0, 1);
                            const selectable = isDateSelectable(yearDate);
                            const selected = displayedDate?.getFullYear() === yearValue;

                            return (
                                <button
                                    key={yearValue}
                                    type="button"
                                    className={`
                                        ${styles.yearCell}
                                        ${selected ? styles.selected : ""}
                                        ${!selectable ? styles.disabled : ""}
                                    `}
                                    onClick={() => selectable && selectDate(yearDate)}
                                    disabled={!selectable}
                                >
                                    {yearValue}
                                </button>
                            );
                        })}
                    </div>
                )}
            </>
        );
    };

    return (
        <div className={`${styles.datePicker} ${className}`} style={style} ref={dropdownRef}>
            <Input
                value={inputValue}
                onChange={handleInputChange}
                placeholder={placeholder}
                disabled={disabled}
                allowClear={allowClear && !!displayedDate}
                onClear={handleClear}
                size={size}
                readOnly
                suffix={
                    <span className={styles.calendarIcon} onClick={() => !disabled && setIsOpen(!isOpen)}>
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                    </span>
                }
                onFocus={() => !disabled && setIsOpen(true)}
            />

            {isOpen && !disabled && (
                <div
                    className={`${styles.datePickerDropdown} ${
                        picker === "time" ? styles.timeOnly : isShowTime ? styles.withTime : ""
                    }`}
                >
                    {picker !== "time" && (
                        <div className={styles.datePickerContent}>
                            {renderDatePicker()}
                            {!isShowTime && (
                                <div className={styles.datePickerFooter}>
                                    <button
                                        type="button"
                                        className={styles.todayButton}
                                        onClick={() => selectDate(new Date())}
                                        disabled={!isDateSelectable(new Date())}
                                    >
                                        今天
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                    {renderTimePicker()}
                </div>
            )}
        </div>
    );
};

export default DatePicker;
