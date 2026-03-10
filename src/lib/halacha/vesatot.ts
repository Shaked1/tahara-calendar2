/**
 * מודול חישוב וסתות
 * כולל: יום החודש, יום 30, הפלגה
 */

import {
  VesetEvent,
  HefsekhTahara,
  CalculatedVeset,
  VesetType,
  OnahType,
  HalachicSettings,
  UserLocation,
  HaflagahResult,
} from '@/types';
import { 
  getSameHebrewDayNextMonth,
  getHebrewDayOfMonth,
  formatHebrewDateShort,
} from '../hebrew-calendar';
import { determineOnah } from './onot';

/**
 * חישוב "יום החודש" - וסת קבועה לפי התאריך העברי
 */
export function calculateYomHachodesh(
  lastVeset: VesetEvent,
  location: UserLocation
): CalculatedVeset {
  // אותו תאריך עברי בחודש הבא
  const nextDate = getSameHebrewDayNextMonth(lastVeset.date);
  
  return {
    type: 'yom_hachodesh',
    date: nextDate,
    onah: lastVeset.onah, // באותה עונה
    reason: `יום החודש`,
    isActive: true,
  };
}

/**
 * חישוב "יום 30" (יום השלושים)
 * יום הראייה נחשב כיום 1, לכן מוסיפים 29 ימים
 */
export function calculateYom30(
  lastVeset: VesetEvent,
  location: UserLocation
): CalculatedVeset {
  const day30 = new Date(lastVeset.date);
  
  // איפוס שעות למניעת בעיות אזורי זמן
  day30.setHours(0, 0, 0, 0); 
  
  // הוספת 29 ימים (כך שיום הראייה + 29 = יום ה-30)
  day30.setDate(day30.getDate() + 29);
  
  return {
    type: 'yom_30',
    date: day30,
    onah: lastVeset.onah, // באותה עונה של הראייה
    reason: `פרישה יום 30`, 
    isActive: true,
  };
}

/**
 * חישוב הפלגה - המרווח בין שתי וסתות
 * השיטה משתנה לפי הפוסק
 */
export function calculateHaflagah(
  vesetHistory: VesetEvent[],
  hefsekhHistory: HefsekhTahara[],
  settings: HalachicSettings,
  location: UserLocation
): HaflagahResult | null {
  if (vesetHistory.length < 2) return null;

  const sortedVesatot = [...vesetHistory].sort((a, b) => b.date.getTime() - a.date.getTime());
  const latestVeset = sortedVesatot[0];
  const previousVeset = sortedVesatot[1];

  let interval: number;
  let nextDate: Date;

  if (settings.method === 'chabad') {
    // 1. מציאת ההפסק של הווסת הקודמת (כ"ג שבט)
    const prevHefsek = hefsekhHistory.find(h => h.vesetEventId === previousVeset.id);
    if (!prevHefsek) return null; // חייבים הפסק בשביל חישוב חב"ד

    // 2. חישוב המרווח: מתחילת הווסת הנוכחית (2.3) פחות ההפסק הקודם (10.2)
    // 20 ימים במקרה שלך
    interval = Math.floor((latestVeset.date.getTime() - prevHefsek.date.getTime()) / (1000 * 60 * 60 * 24));

    // 3. מציאת ההפסק הנוכחי (7.3 - י"ח אדר)
    const currentHefsek = hefsekhHistory.find(h => h.vesetEventId === latestVeset.id);
    if (!currentHefsek) return null;

    // 4. חישוב יום הפרישה: הפסק נוכחי + ימי ההפלגה (7.3 + 20 יום = 27.3 - ט' ניסן)
    nextDate = new Date(currentHefsek.date);
    nextDate.setDate(nextDate.getDate() + interval);
    
  } else {
    // שיטה רגילה: תחילת וסת עד תחילת וסת
    interval = Math.floor((latestVeset.date.getTime() - previousVeset.date.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    nextDate = new Date(latestVeset.date);
    nextDate.setDate(nextDate.getDate() + (interval - 1));
  }

  return {
    interval,
    nextDate,
    onah: latestVeset.onah,
    basedOnEvents: { from: previousVeset, to: latestVeset }
  };
}
/**
 * מחשב את כל הוסתות הקבועות עבור הווסת האחרונה
 */
export function calculateAllVesatot(
  vesetHistory: VesetEvent[],
  hefsekhHistory: HefsekhTahara[],
  settings: HalachicSettings,
  location: UserLocation
): CalculatedVeset[] {
  if (vesetHistory.length === 0) {
    return [];
  }
  
  const sortedVesatot = [...vesetHistory].sort(
    (a, b) => b.date.getTime() - a.date.getTime()
  );
  
  const lastVeset = sortedVesatot[0];
  const vesatot: CalculatedVeset[] = [];
  
  // 1. יום החודש
  vesatot.push(calculateYomHachodesh(lastVeset, location));
  
  // 2. יום 30
  vesatot.push(calculateYom30(lastVeset, location));
  
  // 3. הפלגה
  const haflagah = calculateHaflagah(
    vesetHistory,
    hefsekhHistory,
    settings,
    location
  );
  
  if (haflagah) {
    vesatot.push({
      type: 'haflagah',
      date: haflagah.nextDate,
      onah: haflagah.onah,
      reason: `הפלגה: ${haflagah.interval} ימים מהווסת הקודמת`,
      isActive: true,
    });
  }
  
  return vesatot;
}

/**
 * בודק אם תאריך נתון הוא יום וסת
 */
export function isVesetDay(
  checkDate: Date,
  vesatot: CalculatedVeset[]
): CalculatedVeset | null {
  for (const veset of vesatot) {
    // השוואת תאריכים (ללא שעות)
    const vesetDateOnly = new Date(veset.date);
    vesetDateOnly.setHours(0, 0, 0, 0);
    
    const checkDateOnly = new Date(checkDate);
    checkDateOnly.setHours(0, 0, 0, 0);
    
    if (vesetDateOnly.getTime() === checkDateOnly.getTime()) {
      return veset;
    }
  }
  
  return null;
}

/**
 * חישוב וסתות עבור טווח תאריכים
 * שימושי להצגה בלוח שנה
 */
export function calculateVesatotForRange(
  startDate: Date,
  endDate: Date,
  vesetHistory: VesetEvent[],
  hefsekhHistory: HefsekhTahara[],
  settings: HalachicSettings,
  location: UserLocation
): CalculatedVeset[] {
  const vesatot = calculateAllVesatot(
    vesetHistory,
    hefsekhHistory,
    settings,
    location
  );
  
  // סינון לטווח התאריכים המבוקש
  return vesatot.filter(veset => {
    const vesetTime = veset.date.getTime();
    return vesetTime >= startDate.getTime() && vesetTime <= endDate.getTime();
  });
}

/**
 * בדיקה האם יש וסת קבועה (3 פעמים ברצף באותו מרווח)
 */
export function hasFixedVeset(vesetHistory: VesetEvent[]): boolean {
  if (vesetHistory.length < 3) {
    return false;
  }
  
  const sorted = [...vesetHistory].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );
  
  // בדיקת 3 האחרונות
  const intervals: number[] = [];
  for (let i = sorted.length - 1; i >= sorted.length - 3 && i > 0; i--) {
    const interval = Math.floor(
      (sorted[i].date.getTime() - sorted[i - 1].date.getTime()) /
      (1000 * 60 * 60 * 24)
    );
    intervals.push(interval);
  }
  
  // בדיקה שכל המרווחים זהים (±1 יום)
  if (intervals.length < 2) return false;
  
  const firstInterval = intervals[0];
  return intervals.every(
    interval => Math.abs(interval - firstInterval) <= 1
  );
}

/**
 * מחזיר את סוג הווסת בעברית
 */
export function getVesetTypeName(type: VesetType): string {
  const names: Record<VesetType, string> = {
    yom_hachodesh: 'יום החודש',
    yom_30: 'יום 30',
    haflagah: 'הפלגה',
    minimum_days: '5 ימים',
    
  };
  
  return names[type];
}

/**
 * חישוב וסתות נוספות לפי תוספות הלכתיות
 */
export function calculateAdditionalVesatot(
  lastVeset: VesetEvent,
  settings: HalachicSettings,
  location: UserLocation
): CalculatedVeset[] {
  const additional: CalculatedVeset[] = [];
  
  // אור זרוע - יום 31
  if (settings.orZarua || settings.yom31) {
    const day31 = new Date(lastVeset.date);
    day31.setDate(day31.getDate() + 31);
    
    additional.push({
      type: 'yom_30', // משתמשים באותו type
      date: day31,
      onah: lastVeset.onah,
      reason: 'יום 31 (אור זרוע)',
      isActive: true,
    });
  }
  
  return additional;
}
