/**
 * קומפוננטת CalendarGrid - רשת לוח שנה מלאה
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

export function CalendarGrid({
  currentDate,
  calculatedDates,
  onDateClick,
  onMonthChange,
}: CalendarGridProps) {
  const [viewDate, setViewDate] = useState(currentDate);

  // בניית ימי החודש
  const monthDays = useMemo(() => {
    const start = startOfMonth(viewDate);
    const end = endOfMonth(viewDate);
    const days: CalendarDayType[] = [];

    // התחלה מיום ראשון של השבוע הראשון
    const firstDayOfWeek = start.getDay();
    const startDate = new Date(start);
    startDate.setDate(startDate.getDate() - firstDayOfWeek);

    // 42 ימים (6 שבועות)
    for (let i = 0; i < 42; i++) {
      const currentDay = new Date(startDate);
      currentDay.setDate(currentDay.getDate() + i);

      const isCurrentMonth = 
        currentDay.getMonth() === viewDate.getMonth() &&
        currentDay.getFullYear() === viewDate.getFullYear();

      const isToday = 
        currentDay.toDateString() === new Date().toDateString();

     const dateKey = `${currentDay.getFullYear()}-${String(currentDay.getMonth() + 1).padStart(2, '0')}-${String(currentDay.getDate()).padStart(2, '0')}`;
      const calculatedDate = calculatedDates?.get(dateKey);

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

  // כותרת החודש
  const monthTitle = useMemo(() => {
    const gregorianMonth = viewDate.toLocaleDateString('he-IL', { 
      month: 'long',
      year: 'numeric',
    });
    const hebrewMonth = getHebrewMonthName(viewDate);
    const hebrewYear = getHebrewYear(viewDate);

    return `${gregorianMonth} | ${hebrewMonth} ${hebrewYear}`;
  }, [viewDate]);

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      {/* כותרת + ניווט */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={handleToday}>
          היום
        </Button>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextMonth}
            aria-label="חודש הבא"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <h2 className="text-2xl font-bold font-hebrew min-w-[300px] text-center">
            {monthTitle}
          </h2>

          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevMonth}
            aria-label="חודש קודם"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <div className="w-20"></div>
      </div>

      {/* מקרא */}
      <div className="mb-4">
        <CalendarLegend />
      </div>

      {/* כותרות ימי השבוע */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'].map((day) => (
          <div
            key={day}
            className="text-center font-semibold text-sm text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* רשת הימים */}
      <div className="grid grid-cols-7 gap-2">
        {monthDays.map((day, index) => (
          <CalendarDay
            key={index}
            day={day}
            onClick={onDateClick}
          />
        ))}
      </div>
    </div>
  );
}
