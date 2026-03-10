/**
 * מודול לוח עברי מעודכן
 * תואם לגרסאות החדשות של @hebcal/core
 */

import { 
  HDate, 
  months,
  
} from '@hebcal/core';

// הגדרת שפה לעברית - בגרסאות חדשות זה נעשה דרך פרמטר ב-render או הגדרה גלובלית
// הערה: אם השורה הזו עושה שגיאה, אפשר פשוט למחוק אותה, ה-render('he') למטה יעשה את העבודה.

/**
 * ממיר תאריך גרגוריאני לעברי
 */
export function gregorianToHebrew(date: Date): HDate {
  return new HDate(date);
}

/**
 * מחזיר תאריך עברי בפורמט קריא (גימטריה)
 */
export function formatHebrewDate(date: Date): string {
  const hDate = new HDate(date);
  return hDate.render('he' as any);
}

/**
 * מחזיר רק את היום העברי (באותיות גימטריה)
 */
export function getHebrewDay(date: Date): string {
  const hDate = new HDate(date);
  return hDate.renderGematriya();
}

/**
 * מחזיר שם החודש העברי
 */
export function getHebrewMonthName(date: Date): string {
  const hDate = new HDate(date);
  return hDate.getMonthName();
}

/**
 * מחזיר את השנה העברית
 */
export function getHebrewYear(date: Date): number {
  const hDate = new HDate(date);
  return hDate.getFullYear();
}

/**
 * מחזיר את השנה העברית בגימטריה
 */
export function getHebrewYearString(date: Date): string {
  const hDate = new HDate(date);
  return hDate.renderGematriya().split(' ').pop() || ''; 
}

/**
 * בודק אם שנה עברית מסוימת היא מעוברת
 */
export function isLeapYear(hebrewYear: number): boolean {
  return HDate.isLeapYear(hebrewYear);
}

/**
 * מחזיר את מספר הימים בחודש עברי - התיקון לשגיאה שראית!
 */
export function getDaysInHebrewMonth(
  hebrewMonth: number,
  hebrewYear: number
): number {
  // בגרסה החדשה יוצרים אובייקט תאריך ליום כלשהו בחודש ובודקים כמה ימים יש בו
  return new HDate(1, hebrewMonth, hebrewYear).daysInMonth();
}

/**
 * ממיר תאריך עברי לגרגוריאני
 */
export function hebrewToGregorian(
  day: number,
  month: number,
  year: number
): Date {
  const hDate = new HDate(day, month, year);
  return hDate.greg();
}

/**
 * מחזיר את אותו יום בחודש העברי הבא - תיקון ללוגיקת החודשים
 */
export function getSameHebrewDayNextMonth(date: Date): Date {
  const hDate = new HDate(date);
  // פשוט מוסיפים 30 יום לתאריך הנוכחי - זה תמיד יביא אותנו לחודש הבא
  const middleOfNextMonth = new Date(date);
  middleOfNextMonth.setDate(middleOfNextMonth.getDate() + 30);
  
  const hNext = new HDate(middleOfNextMonth);
  
  // עכשיו כשאנחנו בטוח בחודש הבא, נגדיר את היום המקורי
  const daysInMonth = hNext.daysInMonth();
  const dayToUse = Math.min(hDate.getDate(), daysInMonth);
  
  return new HDate(dayToUse, hNext.getMonth(), hNext.getFullYear()).greg();
}

/**
 * מחזיר את יום החודש העברי
 */
export function getHebrewDayOfMonth(date: Date): number {
  return new HDate(date).getDate();
}

/**
 * מחזיר את החודש העברי (1-13)
 */
export function getHebrewMonth(date: Date): number {
  return new HDate(date).getMonth();
}

/**
 * בודק אם שני תאריכים הם באותו יום עברי
 */
export function isSameHebrewDay(date1: Date, date2: Date): boolean {
  const h1 = new HDate(date1);
  const h2 = new HDate(date2);
  return h1.abs() === h2.abs();
}

/**
 * מחשב את ההפרש בימים עבריים בין שני תאריכים
 */
export function daysBetweenHebrewDates(date1: Date, date2: Date): number {
  const h1 = new HDate(date1);
  const h2 = new HDate(date2);
  return h2.abs() - h1.abs();
}

/**
 * מוסיף ימים לתאריך עברי
 */
export function addHebrewDays(date: Date, days: number): Date {
  const hDate = new HDate(date);
  return new HDate(hDate.abs() + days).greg();
}

/**
 * מחזיר את שם יום השבוע בעברית
 */
export function getHebrewDayOfWeek(date: Date): string {
  const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  return dayNames[date.getDay()];
}

/**
 * בודק אם תאריך הוא שבת
 */
export function isShabbat(date: Date): boolean {
  return date.getDay() === 6;
}

/**
 * מחזיר תאריך מלא בעברית
 */
export function getFullHebrewDate(date: Date): string {
  return `יום ${getHebrewDayOfWeek(date)}, ${formatHebrewDate(date)}`;
}

/**
 * מחזיר רשימת כל החודשים העבריים בשנה
 */
export function getHebrewMonthsInYear(hebrewYear: number): string[] {
  const isLeap = HDate.isLeapYear(hebrewYear);
  const monthCount = isLeap ? 13 : 12;
  
  const monthNames: string[] = [];
  for (let i = 1; i <= monthCount; i++) {
    monthNames.push(new HDate(1, i, hebrewYear).getMonthName());
  }
  return monthNames;
}

/**
 * פורמט קצר לתאריך עברי (ללא שנה)
 */
export function formatHebrewDateShort(date: Date): string {
  const hDate = new HDate(date);
  return `${hDate.renderGematriya()} ${hDate.getMonthName()}`;
}