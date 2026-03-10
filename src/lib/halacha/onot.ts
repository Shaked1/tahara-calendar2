/**
 * מודול חישוב עונות (יום/לילה)
 * 
 * עונת היום: מזריחה עד שקיעה
 * עונת הלילה: משקיעה עד זריחה
 */

import { OnahType, DayZmanim, UserLocation } from '@/types';
import { getZmanimForDate } from '../zmanim';

/**
 * קובע את העונה לפי שעת האירוע
 * @param eventDate תאריך ושעת האירוע
 * @param location מיקום המשתמש
 * @returns 'day' או 'night'
 */
export function determineOnah(
  eventDate: Date,
  location: UserLocation
): OnahType {
  const zmanim = getZmanimForDate(eventDate, location);
  
  const eventTime = eventDate.getTime();
  const sunriseTime = new Date(zmanim.sunrise).getTime();
  const sunsetTime = new Date(zmanim.sunset).getTime();
  
  // אם השעה בין זריחה לשקיעה = עונת יום
  if (eventTime >= sunriseTime && eventTime < sunsetTime) {
    return 'day';
  }
  
  // אחרת = עונת לילה
  return 'night';
}

/**
 * קובע את העונה לפי תאריך ושעה (string)
 * אם לא הוזנה שעה, ברירת מחדל: 08:00 (עונת יום)
 */
export function determineOnahFromDateAndTime(
  date: Date,
  time: string | undefined,
  location: UserLocation
): OnahType {
  // אם לא הוזנה שעה - ברירת מחדל: 08:00
  const timeToUse = time || '08:00';
  
  // יצירת Date עם השעה המדויקת
  const [hours, minutes] = timeToUse.split(':').map(Number);
  const fullDate = new Date(date);
  fullDate.setHours(hours, minutes, 0, 0);
  
  return determineOnah(fullDate, location);
}

/**
 * מחזיר את העונה המנוגדת
 */
export function oppositeOnah(onah: OnahType): OnahType {
  return onah === 'day' ? 'night' : 'day';
}

/**
 * מחזיר את שם העונה בעברית
 */
export function getOnahName(onah: OnahType): string {
  return onah === 'day' ? 'יום' : 'לילה';
}

/**
 * בודק אם שתי עונות זהות
 */
export function isSameOnah(onah1: OnahType, onah2: OnahType): boolean {
  return onah1 === onah2;
}

/**
 * מחזיר את תחילת העונה הנוכחית
 * @param date התאריך הנדרש
 * @param onah העונה
 * @param location מיקום
 * @returns תאריך תחילת העונה
 */
export function getOnahStart(
  date: Date,
  onah: OnahType,
  location: UserLocation
): Date {
  const zmanim = getZmanimForDate(date, location);
  
  if (onah === 'day') {
    return zmanim.sunrise;
  } else {
    // עונת לילה מתחילה בשקיעה של היום הקודם
    const prevDay = new Date(date);
    prevDay.setDate(prevDay.getDate() - 1);
    const prevZmanim = getZmanimForDate(prevDay, location);
    return prevZmanim.sunset;
  }
}

/**
 * מחזיר את סוף העונה הנוכחית
 * @param date התאריך הנדרש
 * @param onah העונה
 * @param location מיקום
 * @returns תאריך סוף העונה
 */
export function getOnahEnd(
  date: Date,
  onah: OnahType,
  location: UserLocation
): Date {
  const zmanim = getZmanimForDate(date, location);
  
  if (onah === 'day') {
    return zmanim.sunset;
  } else {
    // עונת לילה מסתיימת בזריחה
    return zmanim.sunrise;
  }
}

/**
 * מחזיר את העונה של תאריך ושעה ספציפיים
 * שימושי לווסתות שהוזנו עם שעה
 */
export function getOnahForDateTime(
  date: Date,
  hours: number,
  minutes: number,
  location: UserLocation
): OnahType {
  const fullDate = new Date(date);
  fullDate.setHours(hours, minutes, 0, 0);
  
  return determineOnah(fullDate, location);
}

/**
 * בודק אם תאריך נתון הוא בתוך עונה מסוימת
 */
export function isDateInOnah(
  checkDate: Date,
  onah: OnahType,
  location: UserLocation
): boolean {
  const actualOnah = determineOnah(checkDate, location);
  return actualOnah === onah;
}

/**
 * מחשב את מספר העונות בין שני תאריכים
 * כל יום יש 2 עונות (יום + לילה)
 */
export function countOnotBetweenDates(
  startDate: Date,
  endDate: Date
): number {
  const daysDiff = Math.floor(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  // כל יום = 2 עונות
  return daysDiff * 2;
}

/**
 * מחזיר אייקון לעונה (לתצוגה ב-UI)
 */
export function getOnahIcon(onah: OnahType): string {
  return onah === 'day' ? '☀️' : '🌙';
}
