/**
 * מחלקה מרכזית לחישובי טהרה
 * משלבת את כל המודולים: עונות, וסתות, 7 ימים נקיים
 */

import {
  HalachicSettings,
  UserLocation,
  VesetEvent,
  HefsekhTahara,
  CalculatedDate,
  TaharaCalculationResult,
  CalculatedVeset,
  VesetHistory,
} from '@/types';

import { 
  calculateAllVesatot,
  calculateAdditionalVesatot,
  isVesetDay,
} from './vesatot';

import {
  calculateFullTaharaProcess,
  getDateStatus,
} from './sevenCleanDays';

import { determineOnah } from './onot';
import { formatHebrewDateShort } from '../hebrew-calendar';

/**
 * מחלקה ראשית לכל חישובי הטהרה
 */
export class TaharaCalculator {
  private settings: HalachicSettings;
  private location: UserLocation;

  constructor(settings: HalachicSettings, location: UserLocation) {
    this.settings = settings;
    this.location = location;
  }

  /**
   * חישוב מלא של כל התאריכים האסורים והמיוחדים
   */
  calculateAll(history: VesetHistory): TaharaCalculationResult {
    const { events, hefsekhTaharot } = history;

    if (events.length === 0) {
      return {
        prohibitedDates: [],
        cleanDays: [],
        mikvahNight: undefined,
        nextVesatot: [],
      };
    }

    // מיון אירועים לפי תאריך (חדש לישן)
    const sortedEvents = [...events].sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    );

    const latestEvent = sortedEvents[0];
    
    // מציאת הפסק טהרה אחרון (אם קיים)
    const latestHefsek = hefsekhTaharot
      .filter(h => h.vesetEventId === latestEvent.id)
      .sort((a, b) => b.date.getTime() - a.date.getTime())[0];

    // 1. חישוב ימי איסור ו-7 ימים נקיים
    const taharaProcess = calculateFullTaharaProcess(
      latestEvent,
      latestHefsek || null,
      this.location
    );
    if (taharaProcess.hefsekDay) {
      taharaProcess.prohibitedDays.push(taharaProcess.hefsekDay);
    }
    // 2. חישוב וסתות קבועות
    const vesatot = calculateAllVesatot(
      events,
      hefsekhTaharot,
      this.settings,
      this.location
    );

    // 3. וסתות נוספות (אור זרוע, יום 31)
    const additionalVesatot = calculateAdditionalVesatot(
      latestEvent,
      this.settings,
      this.location
    );

    const allVesatot = [...vesatot, ...additionalVesatot];
  
   // בדיקה זמנית לדיבגינג - תמחקי אחרי שנפתור
    console.log("--- בדיקת וסתות לפני מיזוג ---");
    allVesatot.forEach(v => {
      console.log(`סוג: ${v.type}, תאריך: ${v.date.toDateString()}, עונה: ${v.onah}`);
    });

    // 4. שילוב וסתות עם ימי איסור
    const prohibitedDatesWithVesatot = this.mergeProhibitedDates(
      taharaProcess.prohibitedDays,
      allVesatot
    );

    return {
      prohibitedDates: prohibitedDatesWithVesatot,
      cleanDays: taharaProcess.cleanDays,
      mikvahNight: taharaProcess.mikvahNight || undefined,
      nextVesatot: allVesatot,
    };
  }

  /**
   * מיזוג ימי איסור עם ימי וסת
   */
  private mergeProhibitedDates(
    prohibitedDays: CalculatedDate[],
    vesatot: CalculatedVeset[]
  ): CalculatedDate[] {
    const merged = [...prohibitedDays];

    // הוספת ימי וסת
    for (const veset of vesatot) {
          // מחפשים אם התאריך הזה כבר מופיע ברשימה (למשל כיום איסור או כווסת אחרת)
          const existingIndex = merged.findIndex(d => 
            this.isSameDay(d.date, veset.date)
          );

      if (existingIndex === -1) {
        merged.push({
          date: veset.date,
          hebrewDate: formatHebrewDateShort(veset.date),
          status: 'prohibited',
          onah: veset.onah,
          vesetTypes: [veset.type],
          // אם זה יום 30, נכתוב את הטקסט המבוקש ב-reason
          reason: veset.reason,
        });
      } else {
        // אם התאריך כבר קיים, אנחנו מוסיפים את הסוג החדש למערך הקיים
        if (!merged[existingIndex].vesetTypes.includes(veset.type)) {
          merged[existingIndex].vesetTypes.push(veset.type);
          
          // מעדכנים את הסיבה שתכלול את שני הדברים
          merged[existingIndex].reason += ` + ${veset.reason}`;
        }
      }
    }

    // מיון לפי תאריך
    return merged.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * חישוב סטטוס של תאריך ספציפי
   */
  getDateStatus(
    date: Date,
    history: VesetHistory
  ): CalculatedDate | null {
    const result = this.calculateAll(history);

    // בדיקה בימי איסור
    const prohibited = result.prohibitedDates.find(d =>
      this.isSameDay(d.date, date)
    );
    if (prohibited) return prohibited;

    // בדיקה בימים נקיים
    const cleanDay = result.cleanDays.find(d =>
      this.isSameDay(d.date, date)
    );
    if (cleanDay) return cleanDay;

    // בדיקה בליל מקווה
    if (result.mikvahNight && this.isSameDay(result.mikvahNight.date, date)) {
      return result.mikvahNight;
    }

    // תאריך מותר
    return {
      date,
      hebrewDate: formatHebrewDateShort(date),
      status: 'permitted',
      onah: determineOnah(date, this.location),
      vesetTypes: [],
      reason: 'יום רגיל - מותר',
    };
  }

  /**
   * חישוב עבור טווח תאריכים (לוח שנה)
   */
  calculateForRange(
    startDate: Date,
    endDate: Date,
    history: VesetHistory
  ): Map<string, CalculatedDate> {
    const result = this.calculateAll(history);
    const dateMap = new Map<string, CalculatedDate>();

    // מעבר על כל הימים בטווח
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = this.getDateKey(currentDate);
      const status = this.getDateStatus(currentDate, history);
      
      if (status) {
        dateMap.set(dateKey, status);
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dateMap;
  }

  /**
   * בדיקה אם שני תאריכים זהים (ללא שעות)
   */
private isSameDay(date1: Date | string, date2: Date | string): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

  /**
   * יצירת מפתח ייחודי לתאריך (YYYY-MM-DD)
   */
  private getDateKey(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * עדכון הגדרות הלכתיות
   */
  updateSettings(newSettings: Partial<HalachicSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  /**
   * עדכון מיקום
   */
  updateLocation(newLocation: Partial<UserLocation>): void {
    this.location = { ...this.location, ...newLocation };
  }

  /**
   * בדיקה מהירה: האם היום אסור?
   */
  isTodayProhibited(history: VesetHistory): boolean {
    const today = new Date();
    const status = this.getDateStatus(today, history);
    return status?.status === 'prohibited';
  }

  /**
   * קבלת הווסת הבא הקרוב ביותר
   */
  getNextVeset(history: VesetHistory): CalculatedVeset | null {
    const result = this.calculateAll(history);
    const today = new Date();

    // סינון וסתות עתידיים
    const futureVesatot = result.nextVesatot
      .filter(v => v.date > today)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    return futureVesatot[0] || null;
  }

  /**
   * קבלת ליל הטבילה הבא
   */
  getNextMikvahNight(history: VesetHistory): CalculatedDate | null {
    const result = this.calculateAll(history);
    const today = new Date();

    if (result.mikvahNight && result.mikvahNight.date > today) {
      return result.mikvahNight;
    }

    return null;
  }

  /**
   * ספירת ימים נקיים שעברו
   */
  getCleanDaysCompleted(history: VesetHistory): number {
    const result = this.calculateAll(history);
    const today = new Date();

    const completedDays = result.cleanDays.filter(
      d => d.date < today
    );

    return completedDays.length;
  }

  /**
   * בדיקת תקינות הנתונים
   */
  validateHistory(history: VesetHistory): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // בדיקה שיש לפחות אירוע אחד
    if (history.events.length === 0) {
      errors.push('חייבת להיות לפחות וסת אחת רשומה');
    }

    // בדיקת סדר כרונולוגי
    const sortedEvents = [...history.events].sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );

    for (let i = 1; i < sortedEvents.length; i++) {
      const prev = sortedEvents[i - 1];
      const curr = sortedEvents[i];

      if (curr.date <= prev.date) {
        errors.push(`וסת מ-${curr.date} מתרחשת לפני או באותו זמן כמו וסת קודמת`);
      }
    }

    // בדיקת הפסקי טהרה
    for (const hefsek of history.hefsekhTaharot) {
      const relatedVeset = history.events.find(
        e => e.id === hefsek.vesetEventId
      );

      if (!relatedVeset) {
        errors.push(`הפסק טהרה ללא וסת מקושרת`);
      } else if (hefsek.date < relatedVeset.date) {
        errors.push(`הפסק טהרה לפני תחילת הווסת`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * ייצוא הגדרות נוכחיות
   */
  exportSettings(): HalachicSettings {
    return { ...this.settings };
  }

  /**
   * ייצוא מיקום נוכחי
   */
  exportLocation(): UserLocation {
    return { ...this.location };
  }
}

/**
 * פונקציית עזר ליצירת מחשבון חדש
 */
export function createTaharaCalculator(
  settings: HalachicSettings,
  location: UserLocation
): TaharaCalculator {
  return new TaharaCalculator(settings, location);
}
