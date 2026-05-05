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
import { determineOnah,oppositeOnah } from './onot';

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
export function calculateHaflagahFromHistory( // Renamed to indicate it uses full history
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
 * חישוב הפלגה עבור זוג וסתות ספציפי.
 * שימושי לחישוב היסטורי עבור כל מחזור בנפרד.
 */
export function calculateHaflagahForSpecificPair(
  latestVeset: VesetEvent,
  previousVeset: VesetEvent,
  hefsekhHistory: HefsekhTahara[],
  settings: HalachicSettings,
  location: UserLocation
): HaflagahResult | null {
  let interval: number;
  let nextDate: Date;

  if (settings.method === 'chabad') {
    const prevHefsek = hefsekhHistory.find(h => h.vesetEventId === previousVeset.id);
    if (!prevHefsek) return null;

    interval = Math.floor((latestVeset.date.getTime() - prevHefsek.date.getTime()) / (1000 * 60 * 60 * 24));

    const currentHefsek = hefsekhHistory.find(h => h.vesetEventId === latestVeset.id);
    if (!currentHefsek) return null;

    nextDate = new Date(currentHefsek.date);
    nextDate.setDate(nextDate.getDate() + interval);
    
  } else {
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
 * מחשב את כל הוסתות (קבועות ותוספות) עבור הווסת האחרונה
 * (זה ישמש לחיזוי וסתות עתידיות בלבד)
 */
export function calculateFutureVesatot( // Renamed
  vesetHistory: VesetEvent[],
  hefsekhHistory: HefsekhTahara[],
  settings: HalachicSettings,
  location: UserLocation
): CalculatedVeset[] {
  if (vesetHistory.length === 0) return [];
  const lastVeset = [...vesetHistory].sort((a, b) => b.date.getTime() - a.date.getTime())[0];
  let allVesatot: CalculatedVeset[] = [];
  
  // 1. חישוב בסיסי
  allVesatot.push(calculateYomHachodesh(lastVeset, location));
  allVesatot.push(calculateYom30(lastVeset, location));
  
  const haflagah = calculateHaflagahFromHistory(vesetHistory, hefsekhHistory, settings, location);
  if (vesetHistory.length >= 2 && haflagah) { // Ensure there are at least two events for haflagah
    allVesatot.push({
      type: 'haflagah',
      date: haflagah.nextDate,
      onah: haflagah.onah,
      reason: 'הפלגה',
      isActive: true,
    });
  }

  // 2. תוספות לפי בחירת המשתמשת
  if (settings.yom31) {
    const d31 = new Date(lastVeset.date);
    d31.setDate(d31.getDate() + 30);
    allVesatot.push({ type: 'yom_30', date: d31, onah: lastVeset.onah, reason: 'יום 31', isActive: true });
  }
  
  if (settings.maatLeat) {
    // 1. קודם כל מחשבים מתי יוצא יום ה-30 המקורי (הוספת 29 ימים מיום הראייה)
    const day30Date = new Date(lastVeset.date);
    day30Date.setHours(0, 0, 0, 0);
    day30Date.setDate(day30Date.getDate() + 29);

    const mlDate = new Date(day30Date);
    let mlOnah: OnahType;

    if (lastVeset.onah === 'day') {
      // אם יום ה-30 ביום -> עונה קודמת היא לילה של היום שלפני (מורידים יום)
      mlDate.setDate(mlDate.getDate() - 1);
      mlOnah = 'night';
    } else {
      // אם יום ה-30 בלילה -> עונה עוקבת היא יום של היום שאחרי (מוסיפים יום)
      mlDate.setDate(mlDate.getDate() + 1);
      mlOnah = 'day';
    }

    allVesatot.push({ type: 'yom_30', date: mlDate, onah: mlOnah, reason: 'מעת לעת', isActive: true });
  }

  // 3. אור זרוע (עונה סמוכה לפני הוסת)
  if (settings.orZarua) {
    const orZaruaList: CalculatedVeset[] = [];
    
    allVesatot.forEach(v => {
      const prevOnah = oppositeOnah(v.onah);
      const prevDate = new Date(v.date);

      // תיקון אור זרוע לפי דרישת משתמש:
      // 1. אם הוסת ביום (למשל ח' סיון יום), האור זרוע הוא בלילה שלפני (ז' סיון לילה) -> מורידים יום בתאריך הלועזי.
      // 2. אם הוסת בלילה (למשל ח' סיון לילה), האור זרוע הוא ביום של אותו יום (ח' סיון יום) -> התאריך הלועזי נשאר זהה.
      if (v.onah === 'day') {
        prevDate.setDate(prevDate.getDate() - 1);
      }
      // במקרה של לילה, v.onah === 'night', ה-prevDate נשאר ללא שינוי וה-prevOnah הופך ל-'day'

      orZaruaList.push({
        type: v.type,
        date: prevDate,
        onah: prevOnah,
        reason: `אור זרוע (${v.reason})`,
        isActive: true,
      });
    });
    
    allVesatot.push(...orZaruaList);
  }
  
  return allVesatot;
}

/**
 * פונקציה זו מיועדת לחישוב היסטורי עבור כל מחזור בנפרד.
 */
export function calculateHistoricalVesatotForEvent(
  currentVeset: VesetEvent,
  previousVeset: VesetEvent | null,
  hefsekhHistory: HefsekhTahara[],
  settings: HalachicSettings,
  location: UserLocation
): CalculatedVeset[] {
  // מערך לוסתות המקור (חודש, 30, 31, הפלגה) - עליהן נחשב אור זרוע
  let baseVesatot: CalculatedVeset[] = [];
  // מערך לוסתות נגזרות (מעת לעת, אור זרוע)
  let derivedVesatot: CalculatedVeset[] = [];

  // 1. חישוב וסתות מקור: יום החודש ויום 30
  baseVesatot.push(calculateYomHachodesh(currentVeset, location));
  baseVesatot.push(calculateYom30(currentVeset, location));

  // 2. חישוב הפלגה
  if (previousVeset) {
    const haflagah = calculateHaflagahForSpecificPair(currentVeset, previousVeset, hefsekhHistory, settings, location);
    if (haflagah) {
      baseVesatot.push({
        type: 'haflagah',
        date: haflagah.nextDate,
        onah: haflagah.onah,
        reason: 'הפלגה',
        isActive: true,
      });
    }
  }

  // 3. יום 31 (אם מוגדר)
  if (settings.yom31) {
    const d31 = new Date(currentVeset.date);
    d31.setDate(d31.getDate() + 30);
    baseVesatot.push({ 
      type: 'yom_30', 
      date: d31, 
      onah: currentVeset.onah, 
      reason: 'יום 31', 
      isActive: true 
    });
  }

  // 4. חישוב אור זרוע - מחושב אך ורק על וסתות המקור
  if (settings.orZarua) {
    baseVesatot.forEach(v => {
      const prevOnah = oppositeOnah(v.onah);
      const prevDate = new Date(v.date);
      if (v.onah === 'day') {
        prevDate.setDate(prevDate.getDate() - 1);
      }
      derivedVesatot.push({
        type: v.type,
        date: prevDate,
        onah: prevOnah,
        reason: `אור זרוע (${v.reason})`,
        isActive: true,
      });
    });
  }

  // 5. חישוב מעת לעת עבור יום 30 ויום 31[cite: 3]
  if (settings.maatLeat) {
    // מסננים מהמקור רק את ימי ה-30 וה-31
    const relevantDays = baseVesatot.filter(v => v.reason === 'פרישה יום 30' || v.reason === 'יום 31');
    
    relevantDays.forEach(v => {
      const mlDate = new Date(v.date);
      let mlOnah: OnahType;

      if (v.onah === 'day') {
        mlDate.setDate(mlDate.getDate() - 1);
        mlOnah = 'night';
      } else {
        mlDate.setDate(mlDate.getDate() + 1);
        mlOnah = 'day';
      }

      derivedVesatot.push({ 
        type: 'yom_30', 
        date: mlDate, 
        onah: mlOnah, 
        reason: `מעת לעת (${v.reason})`, 
        isActive: true 
      });
    });
  }

  // החזרת כל הוסתות יחד
  return [...baseVesatot, ...derivedVesatot];
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
  const vesatot = calculateFutureVesatot(
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
