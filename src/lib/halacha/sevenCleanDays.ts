/**
 * מודול חישוב 7 ימים נקיים וליל טבילה
 */

import {
  VesetEvent,
  HefsekhTahara,
  CalculatedDate,
  DateStatus,
  UserLocation,
} from '@/types';
import { formatHebrewDateShort } from '../hebrew-calendar';
import { getOnahName } from './onot';

/**
 * חישוב מינימום 5 ימים לפני הפסק טהרה
 * מיום תחילת הווסת עד ההפסק בפועל
 */
export function calculateMinimumDays(
  vesetEvent: VesetEvent, // שינינו כדי שנוכל לדעת אם היא ראתה ביום או בלילה
  hefsekhDate?: Date
): CalculatedDate[] {
  const prohibitedDates: CalculatedDate[] = [];
  const minimumDays = 5;
  
  // 1. איפוס שעות כדי למנוע בעיות של אזורי זמן (זה מה שגרם לדילוג על היום הראשון)
// תיקון קריטי: יצירת תאריך מקומי ללא התחשבות ב-UTC
  // זה מבטיח שאם כתוב 2026-03-02 ב-DB, זה יישאר 02 בלוח
  const rawDate = new Date(vesetEvent.date);
  const startDate = new Date(rawDate.getFullYear(), rawDate.getMonth(), rawDate.getDate());

  let daysToCalculate = minimumDays;

  // 2. חישוב כמה ימים לצבוע באדום
  if (hefsekhDate) {
    const end = new Date(hefsekhDate);
    end.setHours(0, 0, 0, 0);
    
    // החישוב החדש מבטיח שגם היום הראשון נספר
    const diffTime = Math.abs(end.getTime() - startDate.getTime());
    const daysBetween = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
    daysToCalculate = Math.max(minimumDays, daysBetween);
  }

  // 3. יצירת רשימת הימים האסורים
  for (let i = 0; i < daysToCalculate; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    
    // ביום הראשון (i=0) אנחנו שומרים על העונה המקורית (יום/לילה)
    // בשאר הימים הסטטוס הוא 'day' כברירת מחדל כי כל היום אסור
    const onah = (i === 0) ? vesetEvent.onah : 'day';

    prohibitedDates.push({
      date: currentDate,
      hebrewDate: formatHebrewDateShort(currentDate),
      status: 'prohibited',
      onah: onah,
      vesetTypes: ['minimum_days'],
      reason: `יום ${i + 1} מתוך מינימום 5 ימי נידה`,
    });
  }
  
  return prohibitedDates;
}

/**
 * חישוב 7 ימים נקיים
 * מתחיל מהיום שאחרי הפסק הטהרה
 */
export function calculateSevenCleanDays(
  hefsekhTahara: HefsekhTahara,
  location: UserLocation
): CalculatedDate[] {
  const cleanDays: CalculatedDate[] = [];
  
  // התחלה מיום אחרי ההפסק
  const startDate = new Date(hefsekhTahara.date);
  startDate.setDate(startDate.getDate() + 1);
  
  for (let i = 0; i < 6; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + i);
    
    cleanDays.push({
      date: currentDate,
      hebrewDate: formatHebrewDateShort(currentDate),
      status: 'clean_day',
      onah: 'day',
      vesetTypes: [],
      cleanDayNumber: i + 1,//מחזיר את מספר היום הנקי (1-7)
      reason: `יום נקי ${i + 1} מתוך 7`,
    });
  }
  
  return cleanDays;
}

/**
 * חישוב ליל טבילה
 * היום ה-7 של הימים הנקיים = יום הטבילה
 * הטבילה היא בלילה (אחרי צאת הכוכבים)
 */
export function calculateMikvahNight(
  hefsekhTahara: HefsekhTahara,
  location: UserLocation
): CalculatedDate {
  // היום ה-7 של הימים הנקיים
  const day7 = new Date(hefsekhTahara.date);
  day7.setDate(day7.getDate() + 7);
  
  return {
    date: day7,
    hebrewDate: formatHebrewDateShort(day7),
    status: 'mikvah_night',
    onah: 'night',
    vesetTypes: [],
    reason: 'ליל טבילה (אחרי צאת הכוכבים)',
  };
}

/**
 * חישוב מלא של תהליך הטהרה
 * מתחילת הווסת ועד ליל הטבילה
 */
export function calculateFullTaharaProcess(
  vesetEvent: VesetEvent,
  hefsekhTahara: HefsekhTahara | null,
  location: UserLocation
): {
  prohibitedDays: CalculatedDate[];
  hefsekDay: CalculatedDate | null;
  cleanDays: CalculatedDate[]; // Can be empty if no hefsek
  mikvahNight: CalculatedDate | null;
} {
  // שינוי כאן: משתמשים ב-let במקום const כדי לאפשר סינון מאוחר יותר
  let prohibitedDays = calculateMinimumDays(
    vesetEvent,
    hefsekhTahara?.date
  );
  
  let hefsekDay: CalculatedDate | null = null;
  let cleanDays: CalculatedDate[] = [];
  let mikvahNight: CalculatedDate | null = null;
  
  if (hefsekhTahara) {
    const hDate = new Date(hefsekhTahara.date);
    const hTime = hDate.setHours(0, 0, 0, 0);

    // סינון יום ההפסק מרשימת הימים האדומים
    prohibitedDays = prohibitedDays.filter(day => {
      const dayTime = new Date(day.date).setHours(0, 0, 0, 0);
      return dayTime !== hTime;
    });

    // יצירת אובייקט יום ההפסק (כחול)
    hefsekDay = {
      date: new Date(hefsekhTahara.date),
      hebrewDate: formatHebrewDateShort(new Date(hefsekhTahara.date)),
      status: 'hefsek_day',
      onah: 'day',
      vesetTypes: [],
      reason: 'הפסק טהרה',
    };

    cleanDays = calculateSevenCleanDays(hefsekhTahara, location);
    mikvahNight = calculateMikvahNight(hefsekhTahara, location);
  }
  
  return {
    prohibitedDays,
    hefsekDay,
    cleanDays,
    mikvahNight,
  };
}

/**
 * בודק האם תאריך נתון הוא יום נקי
 */
export function isCleanDay(
  checkDate: Date,
  cleanDays: CalculatedDate[]
): number | null {
  const checkTime = checkDate.getTime();
  
  for (const day of cleanDays) {
    const dayTime = new Date(day.date).setHours(0, 0, 0, 0);
    const checkTime2 = new Date(checkDate).setHours(0, 0, 0, 0);
    
    if (dayTime === checkTime2) {
      return day.cleanDayNumber || null;
    }
  }
  
  return null;
}

/**
 * בודק האם תאריך נתון הוא יום אסור
 */
export function isProhibitedDay(
  checkDate: Date,
  prohibitedDays: CalculatedDate[]
): boolean {
  const checkTime2 = new Date(checkDate).setHours(0, 0, 0, 0);
  
  return prohibitedDays.some(day => {
    const dayTime = new Date(day.date).setHours(0, 0, 0, 0);
    return dayTime === checkTime2;
  });
}

/**
 * בודק האם תאריך נתון הוא ליל טבילה
 */
export function isMikvahNight(
  checkDate: Date,
  mikvahNight: CalculatedDate | null
): boolean {
  if (!mikvahNight) return false;
  
  const checkTime = new Date(checkDate).setHours(0, 0, 0, 0);
  const mikvahTime = new Date(mikvahNight.date).setHours(0, 0, 0, 0);
  
  return checkTime === mikvahTime;
}

/**
 * מחזיר את הסטטוס של תאריך בתהליך הטהרה
 */
export function getDateStatus(
  checkDate: Date,
  prohibitedDays: CalculatedDate[],
  cleanDays: CalculatedDate[],
  mikvahNight: CalculatedDate | null
): DateStatus {
  if (isMikvahNight(checkDate, mikvahNight)) {
    return 'mikvah_night';
  }
  
  if (isCleanDay(checkDate, cleanDays)) {
    return 'clean_day';
  }
  
  if (isProhibitedDay(checkDate, prohibitedDays)) {
    return 'prohibited';
  }
  
  return 'permitted';
}

/**
 * חישוב הימים הנותרים עד הטבילה
 */
export function daysUntilMikvah(
  today: Date,
  mikvahNight: CalculatedDate | null
): number | null {
  if (!mikvahNight) return null;
  
  const todayTime = new Date(today).setHours(0, 0, 0, 0);
  const mikvahTime = new Date(mikvahNight.date).setHours(0, 0, 0, 0);
  
  const diffDays = Math.floor(
    (mikvahTime - todayTime) / (1000 * 60 * 60 * 24)
  );
  
  return diffDays >= 0 ? diffDays : null;
}

/**
 * בדיקת תקינות 7 ימים נקיים
 * האם כל הימים אכן "נקיים" (ללא דימום)
 */
export function validateSevenCleanDays(
  cleanDays: CalculatedDate[],
  actualEvents: VesetEvent[]
): boolean {
  // בדיקה שלא היו אירועי דימום במהלך 7 הימים
  for (const cleanDay of cleanDays) {
    const hasEvent = actualEvents.some(event => {
      const eventTime = new Date(event.date).setHours(0, 0, 0, 0);
      const cleanTime = new Date(cleanDay.date).setHours(0, 0, 0, 0);
      return eventTime === cleanTime;
    });
    
    if (hasEvent) {
      return false; // נמצא דימום ביום נקי - לא תקין
    }
  }
  
  return true;
}

/**
 * מחזיר הסבר מפורט על מצב הטהרה הנוכחי
 */
export function getTaharaStatusExplanation(
  today: Date,
  prohibitedDays: CalculatedDate[],
  cleanDays: CalculatedDate[],
  mikvahNight: CalculatedDate | null
): string {
  const status = getDateStatus(today, prohibitedDays, cleanDays, mikvahNight);
  
  switch (status) {
    case 'prohibited':
      return 'תקופת נידה - אסור';
    
    case 'clean_day':
      const dayNum = isCleanDay(today, cleanDays);
      return `יום נקי ${dayNum} מתוך 7`;
    
    case 'mikvah_night':
      return 'ליל טבילה (אחרי צאת הכוכבים)';
    
    case 'permitted':
      return 'מותר';
    
    default:
      return 'לא ידוע';
  }
}
