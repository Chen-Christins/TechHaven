import React, { useCallback, useEffect, useState } from "react";
import styles from "./Calendar.module.css";
import { ArticleService } from "@/services/articleService";

interface DayInfo {
  day: number;
  isCurrentMonth: boolean;
  hasArticle: boolean;
}

// 获取当前月份的日期网格数据
const getMonthDays = (year: number, month: number, articleDays: number[]): DayInfo[] => {
  const firstDay = new Date(year, month, 1).getDay(); // 当月第一天是星期几（0=周日）
  const daysInMonth = new Date(year, month + 1, 0).getDate(); // 当月总天数
  const days: DayInfo[] = [];

  // 补全上月剩余天数（灰色显示）
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({
      day: new Date(year, month, -i).getDate(),
      isCurrentMonth: false,
      hasArticle: false,
    });
  }

  // 当月天数
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      day: i,
      isCurrentMonth: true,
      hasArticle: articleDays.includes(i),
    });
  }

  return days;
};

const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [days, setDays] = useState<DayInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthNames = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];

  // 获取指定月份的文章日期
  const fetchArticleDays = useCallback(async (y: number, m: number) => {
    setLoading(true);
    try {
      const articleDays = await ArticleService.getCalendarDays(y, m + 1); // API 月份为 1-based
      setDays(getMonthDays(y, m, articleDays));
    } catch {
      // 请求失败时回退为空列表
      setDays(getMonthDays(y, m, []));
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始化和月份切换时拉取数据
  useEffect(() => {
    fetchArticleDays(year, month);
  }, [year, month, fetchArticleDays]);

  // 切换月份
  const changeMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), direction === "prev" ? prev.getMonth() - 1 : prev.getMonth() + 1, 1));
  };

  return (
    <div className={styles.calendar}>
      <h3 className={styles.panelTitle}>站点日历</h3>
      <div className={styles.calendarHeader}>
        <button className={styles.monthBtn} onClick={() => changeMonth("prev")} disabled={loading}>
          ←
        </button>
        <span className={styles.monthYear}>
          {year}年 {monthNames[month]}
        </span>
        <button className={styles.monthBtn} onClick={() => changeMonth("next")} disabled={loading}>
          →
        </button>
      </div>
      <div className={styles.weekDays}>
        {["日", "一", "二", "三", "四", "五", "六"].map((day) => (
          <div key={day} className={styles.weekDay}>
            {day}
          </div>
        ))}
      </div>
      <div className={`${styles.calendarDays} ${loading ? styles.loading : ""}`}>
        {days.map((day, index) => (
          <div
            key={index}
            className={`${styles.calendarDay} 
              ${!day.isCurrentMonth ? styles.otherMonth : ""} 
              ${day.hasArticle ? styles.hasArticle : ""}`}
          >
            {day.day}
            {day.hasArticle && <div className={styles.articleDot}></div>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Calendar;
