/**
 * פונקציות עזר כלליות
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * משלב classes של Tailwind בצורה חכמה
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * פורמט תאריך לעברית
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(date);
}

/**
 * פורמט תאריך קצר
 */
export function formatDateShort(date: Date): string {
  return new Intl.DateTimeFormat('he-IL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

/**
 * פורמט שעה
 */
export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('he-IL', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

/**
 * בדיקה אם שני תאריכים זהים (ללא שעות)
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * קבלת תחילת היום (00:00:00)
 */
export function startOfDay(date: Date): Date {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
}

/**
 * קבלת סוף היום (23:59:59)
 */
export function endOfDay(date: Date): Date {
  const newDate = new Date(date);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
}

/**
 * הוספת ימים לתאריך
 */
export function addDays(date: Date, days: number): Date {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
}

/**
 * הוספת חודשים לתאריך
 */
export function addMonths(date: Date, months: number): Date {
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() + months);
  return newDate;
}

/**
 * קבלת תחילת החודש
 */
export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * קבלת סוף החודש
 */
export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/**
 * קבלת כל הימים בחודש
 */
export function getDaysInMonth(date: Date): Date[] {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  const days: Date[] = [];
  
  const current = new Date(start);
  while (current <= end) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  return days;
}

/**
 * המרת string ISO לתאריך
 */
export function parseISODate(dateString: string): Date {
  return new Date(dateString);
}

/**
 * המרת תאריך ל-ISO string (YYYY-MM-DD)
 */
export function toISODateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * בדיקה אם תאריך בעבר
 */
export function isPast(date: Date): boolean {
  return date < new Date();
}

/**
 * בדיקה אם תאריך בעתיד
 */
export function isFuture(date: Date): boolean {
  return date > new Date();
}

/**
 * בדיקה אם תאריך היום
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * קבלת הפרש ימים בין תאריכים
 */
export function daysBetween(date1: Date, date2: Date): number {
  const oneDay = 1000 * 60 * 60 * 24;
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.floor(diffTime / oneDay);
}

/**
 * sleep - המתנה async
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * debounce - עיכוב ביצוע פונקציה
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * ולידציה של תאריך
 */
export function isValidDate(date: any): date is Date {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * המרת שעה string ל-Date
 */
export function timeStringToDate(
  date: Date,
  timeString: string
): Date {
  const [hours, minutes] = timeString.split(':').map(Number);
  const newDate = new Date(date);
  newDate.setHours(hours, minutes, 0, 0);
  return newDate;
}

/**
 * בדיקת תקינות פורמט שעה (HH:MM)
 */
export function isValidTimeFormat(time: string): boolean {
  const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return regex.test(time);
}
