/**
 * קומפוננטת CalendarGrid - רשת לוח שנה מלאה
 * מעביר prevNightDate לכל יום כדי לאפשר תצוגת לילה-לפני-יום
 */

'use client';

import { useState, useMemo } from 'react';
import { CalendarDay as CalendarDayType, CalendarMonth } from '@/types';
import { CalendarDay, CalendarLegend } from './CalendarDay';
import { Button } from '@/components/ui/Button';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import {
  formatHebrewDateShort,
  getHebrewMonthName,
  getHebrewYear,
  getHebrewDayOfWeek,
} from '@/lib/hebrew-calendar';
import { startOfMonth, endOfMonth, addMonths } from '@/lib/utils';

interface CalendarGridProps {
  currentDate: Date;
  calculatedDates?: Map<string, any>;
  onDateClick?: (day: CalendarDayType) => void;
  onMonthChange?: (date: Date) => void;
}

/** מחזיר מפתח תאריך YYYY-MM-DD */
function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function CalendarGrid({
  currentDate,
  calculatedDates,
  onDateClick,
  onMonthChange,
}: CalendarGridProps) {
  const [viewDate, setViewDate] = useState(currentDate);

  const monthDays = useMemo(() => {
    const start = startOfMonth(viewDate);
    const end = endOfMonth(viewDate);
    const days: CalendarDayType[] = [];

    const firstDayOfWeek = start.getDay();
    const startDate = new Date(start);
    startDate.setDate(startDate.getDate() - firstDayOfWeek);

    for (let i = 0; i < 42; i++) {
      const currentDay = new Date(startDate);
      currentDay.setDate(currentDay.getDate() + i);

      const isCurrentMonth =
        currentDay.getMonth() === viewDate.getMonth() &&
        currentDay.getFullYear() === viewDate.getFullYear();

      const isToday = currentDay.toDateString() === new Date().toDateString();

      const key = dateKey(currentDay);
      const calculatedDate = calculatedDates?.get(key);

      days.push({
        gregorianDate: currentDay,
        hebrewDate: formatHebrewDateShort(currentDay),
        hebrewMonth: getHebrewMonthName(currentDay),
        hebrewYear: getHebrewYear(currentDay),
        dayOfWeek: getHebrewDayOfWeek(currentDay),
        calculatedDate,
        isToday,
        isCurrentMonth,
      });
    }

    return days;
  }, [viewDate, calculatedDates]);

  const handlePrevMonth = () => {
    const newDate = addMonths(viewDate, -1);
    setViewDate(newDate);
    onMonthChange?.(newDate);
  };

  const handleNextMonth = () => {
    const newDate = addMonths(viewDate, 1);
    setViewDate(newDate);
    onMonthChange?.(newDate);
  };

  const handleToday = () => {
    const today = new Date();
    setViewDate(today);
    onMonthChange?.(today);
  };

  const monthTitle = useMemo(() => {
    const gregorianMonth = viewDate.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
    const hebrewMonth = getHebrewMonthName(viewDate);
    const hebrewYear  = getHebrewYear(viewDate);
    return `${gregorianMonth} | ${hebrewMonth} ${hebrewYear}`;
  }, [viewDate]);

  return (
    <div className="w-full max-w-6xl mx-auto p-2 md:p-4">
      {/* כותרת + ניווט */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 w-full">

        <div className="w-full sm:w-auto flex justify-center sm:justify-start order-1">
          <Button
            variant="outline"
            onClick={handleToday}
            className="w-full sm:w-auto px-6 shadow-sm font-medium"
          >
            היום
          </Button>
        </div>

        <div className="flex items-center justify-between sm:justify-center gap-2 md:gap-4 order-2 w-full sm:w-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextMonth}
            aria-label="חודש הבא"
            className="h-9 w-9 md:h-10 md:w-10 rounded-full border shadow-sm sm:border-none sm:shadow-none"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <h2 className="text-lg md:text-2xl font-bold font-hebrew text-center flex-1 sm:flex-none min-w-[200px] md:min-w-[300px] text-slate-900 px-1">
            {monthTitle}
          </h2>

          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevMonth}
            aria-label="חודש קודם"
            className="h-9 w-9 md:h-10 md:w-10 rounded-full border shadow-sm sm:border-none sm:shadow-none"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <div className="hidden sm:block w-20 order-3" />
      </div>

      {/* מקרא */}
      <div className="mb-4 overflow-x-auto pb-1">
        <CalendarLegend />
      </div>

      {/* כותרות ימי השבוע */}
      <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
        {['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'].map((day) => (
          <div key={day} className="text-center font-bold text-xs md:text-sm text-muted-foreground py-1 md:py-2">
            {day}
          </div>
        ))}
      </div>

      {/* רשת הימים */}
      <div className="grid grid-cols-7 gap-1 md:gap-2">
        {monthDays.map((day, index) => {
          // מחפש את נתוני הלילה של היום הקודם
          // לילה של יום D מוצגת בתא של יום D+1
          const prevDate = new Date(day.gregorianDate);
          prevDate.setDate(prevDate.getDate() - 1);
          const prevKey = dateKey(prevDate);
          const prevDayData = calculatedDates?.get(prevKey);

          // prevNightDate = נתוני הלילה מה-CD של יום קודם
          // אנחנו בודקים אם יש activeOnot שכוללות 'night' ביום הקודם
          let prevNightDate = undefined;
          if (prevDayData && (
            prevDayData.status === 'prohibited' ||
            prevDayData.status === 'clean_day' ||
            prevDayData.status === 'mikvah_night'
          )) {
            // מחלץ רק את נתוני הלילה
            const activeOnot: string[] = prevDayData.activeOnot ?? [];
            const hasNight = activeOnot.length === 0 || activeOnot.includes('night');

            if (hasNight || prevDayData.status === 'clean_day' || prevDayData.status === 'mikvah_night') {
              prevNightDate = prevDayData;
            }
          }

          return (
            <CalendarDay
              key={index}
              day={day}
              prevNightDate={prevNightDate}
              onClick={onDateClick}
            />
          );
        })}
      </div>
    </div>
  );
}
