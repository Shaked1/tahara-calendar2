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
  calculateFutureVesatot,
  calculateHistoricalVesatotForEvent, // New function
  } from './vesatot';

import {
  calculateFullTaharaProcess,
} from './sevenCleanDays';

import { determineOnah } from './onot';
import { formatHebrewDateShort } from '../hebrew-calendar';
import { analyzeKavuot } from './vesatotKavuot';

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

  private calculateFutureWithKavua(
    events: VesetEvent[],
    hefsekhTaharot: HefsekhTahara[]
  ): CalculatedVeset[] {
    // 1. ניתוח קביעות
    const kavuaAnalysis = analyzeKavuot(
      events,
      hefsekhTaharot,
      this.settings,
      this.location
    );

    // 2. אם יש קבועה — מחזיר את 3 תאריכי הפרישה שחושבו ב-analyzeKavuot
    //    (nextDates כבר מכיל 3 חודשים קדימה בדיוק)
    if (kavuaAnalysis.activeKavua) {
      return kavuaAnalysis.activeKavua.nextDates;
    }

    // 3. אין קבועה — מחזיר את כל הפרישות הרגילות (חודש + ל' + הפלגה)
    return calculateFutureVesatot(
      events,
      hefsekhTaharot,
      this.settings,
      this.location
    );
  }

  /**
   * חישוב מלא של כל התאריכים האסורים והמיוחדים
   */
  calculateAll(history: VesetHistory): TaharaCalculationResult {
    const { events, hefsekhTaharot } = history; // hefsekhTaharot is now used for all cycles

    if (events.length === 0) {
      return {
        prohibitedDates: [],
        cleanDays: [],
        mikvahNight: undefined, // Changed to null for consistency
        nextVesatot: [],
      };
    }

    // Sort events from oldest to newest for chronological processing
    const sortedEvents = [...events].sort((a, b) => a.date.getTime() - b.date.getTime());

    // ── ניתוח קביעות קודם לכל ──
    const kavuaAnalysis = analyzeKavuot(events, hefsekhTaharot, this.settings, this.location);
    const allowedVesetTypes = kavuaAnalysis.showTypes;

    const allProhibitedDates: CalculatedDate[] = [];
    const allCleanDays: CalculatedDate[] = [];
    let latestMikvahNight: CalculatedDate | undefined = undefined;
    let nextVesatotPredictions: CalculatedVeset[] = [];

    // Iterate through each veset event to calculate its associated tahara process and historical vesatot
    for (let i = 0; i < sortedEvents.length; i++) {
      const currentVeset = sortedEvents[i];
      const previousVeset = i > 0 ? sortedEvents[i - 1] : undefined;

      // Find the hefsekh for the current veset event
      const hefsekForCurrentVeset = hefsekhTaharot
        .filter(h => h.vesetEventId === currentVeset.id)
        .sort((a, b) => b.date.getTime() - a.date.getTime())[0]; // Get the latest hefsek for this specific veset


      // יצירת רצף ימי הנידה (הצבע האדום)
      const startDate = new Date(currentVeset.date);
      // אם יש הפסק - עוצרים בו. אם אין - ממשיכים עד היום
      const endDate = hefsekForCurrentVeset ? new Date(hefsekForCurrentVeset.date) : new Date();
      
      let iterator = new Date(startDate);
      iterator.setHours(0, 0, 0, 0);

      const compareEndDate = new Date(endDate);
      compareEndDate.setHours(0, 0, 0, 0);

      // 2. אם קיים הפסק, נוריד יום אחד כדי שהלולאה תעצור יום לפני
      if (hefsekForCurrentVeset) {
        compareEndDate.setDate(compareEndDate.getDate() - 1);
      }

      // 3. לולאת הצביעה באדום (עכשיו היא תעצור לפני ההפסק)
      while (iterator <= compareEndDate) {
        const isFirstDay = iterator.getTime() === new Date(startDate).setHours(0, 0, 0, 0);

        allProhibitedDates.push({
          date: new Date(iterator),
          hebrewDate: formatHebrewDateShort(iterator),
          status: 'prohibited',
          onah: isFirstDay ? currentVeset.onah : 'day',
          vesetTypes: ['actual_veset'], 
          reason: isFirstDay ? 'ראיית וסת' : 'ימי נידה',
          reasons: isFirstDay ? ['ראיית וסת'] : ['ימי נידה'],
          activeOnot: isFirstDay ? [currentVeset.onah] : ['day', 'night']
        });
        
        iterator.setDate(iterator.getDate() + 1);
      }

      // Calculate the full tahara process for this cycle (prohibited days, hefsek, clean days, mikvah night)
      const taharaProcess = calculateFullTaharaProcess(
        currentVeset,
        hefsekForCurrentVeset || undefined,
        this.location
      );

      // Aggregate prohibited days (including the hefsek day if it exists)
      allProhibitedDates.push(...taharaProcess.prohibitedDays);
      if (taharaProcess.hefsekDay) {
        allProhibitedDates.push(taharaProcess.hefsekDay);
      }

      // Aggregate clean days
      allCleanDays.push(...taharaProcess.cleanDays);
      
      // Keep track of the latest mikvah night (only one can be "active" at a time)
      if (taharaProcess.mikvahNight) {
        latestMikvahNight = taharaProcess.mikvahNight;
      }

      // Calculate historical vesatot (yom hachodesh, yom 30, haflagah, etc.) for this specific event
      // These are the vesatot that would have been relevant *after* this currentVeset occurred
      const historicalVesatotForThisEvent = calculateHistoricalVesatotForEvent(
        currentVeset,
        previousVeset || null,
        hefsekhTaharot, // Pass full hefsekh history for haflagah calculation
        this.settings,
        this.location
      );
      // סינון: אם יש קבועה — רק הסוג הקבוע עובר. אחרת — הכל עובר.
      const filteredHistorical = historicalVesatotForThisEvent.filter(
        v => ((allowedVesetTypes || []) as string[]).includes(v.type)
      );
      allProhibitedDates.push(...filteredHistorical.map(veset => ({
        date: veset.date,
        hebrewDate: formatHebrewDateShort(veset.date),
        status: 'prohibited' as const,
        onah: veset.onah,
        vesetTypes: [veset.type],
        reason: veset.reason,
        reasons: [veset.reason],
        activeOnot: [veset.onah],
      })));
    }
  

    // After processing all historical events, calculate future veset predictions based on the absolute latest event
    nextVesatotPredictions = this.calculateFutureWithKavua(
      events,
      hefsekhTaharot
    );

    // Merge all collected prohibited dates, clean days, and the latest mikvah night into a single set of CalculatedDate objects
    const finalCalculatedDates = this.mergeAllCalculatedDates(
      allProhibitedDates,
      allCleanDays,
      latestMikvahNight,
      nextVesatotPredictions // Also merge future predictions into the main prohibited list
    );

    return {
      prohibitedDates: finalCalculatedDates.filter(d => d.status === 'prohibited' || d.status === 'hefsek_day'),
      cleanDays: finalCalculatedDates.filter(d => d.status === 'clean_day'),
      mikvahNight: finalCalculatedDates.find(d => d.status === 'mikvah_night') || undefined,
      nextVesatot: nextVesatotPredictions, // This remains future predictions
    };
  }

  /**
   * מיזוג כל סוגי התאריכים המחושבים (אסורים, נקיים, מקווה) למערך אחד,
   * תוך טיפול בהתנגשויות וקביעת עדיפויות.
   */
  private mergeAllCalculatedDates(
  prohibitedDates: CalculatedDate[],
  cleanDays: CalculatedDate[],
  mikvahNight: CalculatedDate | undefined,
  futureVesatot: CalculatedVeset[]
): CalculatedDate[] {
  const dateMap = new Map<string, CalculatedDate>();

  const addOrMerge = (newDate: CalculatedDate) => {
    const key = this.getDateKey(newDate.date);
    if (!dateMap.has(key)) {
      dateMap.set(key, newDate);
      return;
    }

    const existing = dateMap.get(key)!;

    // 1. עדיפות עליונה: וסת ממשית תמיד דורסת תחזיות (כמו יום 30 או הפלגה)
    const isNewActualVeset = newDate.vesetTypes?.includes('actual_veset');
    const isExistingActualVeset = existing.vesetTypes?.includes('actual_veset');

    if (isNewActualVeset && !isExistingActualVeset) {
      dateMap.set(key, newDate);
      return;
    }

    // 2. לוגיקת מיזוג וסדרי עדיפויות
    if (newDate.status === 'prohibited' || newDate.status === 'hefsek_day') {
      if (existing.status !== 'prohibited' && existing.status !== 'hefsek_day') {
        // אם החדש הוא איסור והקיים הוא משהו פחות חמור (כמו מקווה) - נחליף
        dateMap.set(key, newDate);
      } else {
        // שניהם ימי איסור - נמזג סיבות[cite: 3]
        existing.reasons = [...new Set([...(existing.reasons || []), ...(newDate.reasons || [])])];
        existing.vesetTypes = [...new Set([...(existing.vesetTypes || []), ...(newDate.vesetTypes || [])])];
        existing.activeOnot = [...new Set([...(existing.activeOnot || []), ...(newDate.activeOnot || [])])];

        if (newDate.status === 'hefsek_day') {
          existing.status = 'hefsek_day';
        }
      }
    } else if (newDate.status === 'mikvah_night') {
      // ליל טבילה דורס יום נקי, אבל לא דורס יום איסור[cite: 3]
      if (existing.status !== 'prohibited' && existing.status !== 'hefsek_day') {
        dateMap.set(key, newDate);
      }
    } else if (newDate.status === 'clean_day') {
      // יום נקי דורס רק יום רגיל[cite: 3]
      if (existing.status === 'permitted' || !existing.status) {
        dateMap.set(key, newDate);
      }
    }
  };

  // הוספה לפי סדר חשיבות (איסורים קודם)[cite: 3]
  prohibitedDates.forEach(addOrMerge);
  futureVesatot.forEach(veset => addOrMerge({
    date: veset.date,
    hebrewDate: formatHebrewDateShort(veset.date),
    status: 'prohibited',
    onah: veset.onah,
    vesetTypes: [veset.type],
    reason: veset.reason,
    reasons: [veset.reason],
    activeOnot: [veset.onah]
  }));
  cleanDays.forEach(addOrMerge);
  if (mikvahNight) addOrMerge(mikvahNight);

  return Array.from(dateMap.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
}

  /**
   * חישוב סטטוס של תאריך ספציפי
   */
  getDateStatus(
    date: Date,
    history: VesetHistory
  ): CalculatedDate | undefined {
    const result = this.calculateAll(history);

    const prohibited = result.prohibitedDates.find(d => this.isSameDay(d.date, date));
    if (prohibited) return prohibited;

    const cleanDay = result.cleanDays.find(d => this.isSameDay(d.date, date));
    if (cleanDay) return cleanDay;

    if (result.mikvahNight && this.isSameDay(result.mikvahNight.date, date)) {
      return result.mikvahNight;
    }

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
  ): Map<string, CalculatedDate> { // This method should return a map for CalendarGrid
    const result = this.calculateAll(history);
    const dateMap = new Map<string, CalculatedDate>();

    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = this.getDateKey(currentDate);
      // Find the status from the aggregated results
      // Prioritize prohibited > mikvah_night > clean_day > permitted
      const status = result.prohibitedDates.find(d => this.isSameDay(d.date, currentDate)) ||
                     (result.mikvahNight && this.isSameDay(result.mikvahNight.date, currentDate) ? result.mikvahNight : undefined) ||
                     result.cleanDays.find(d => this.isSameDay(d.date, currentDate));
      
      if (status) { // If a specific status is found
        dateMap.set(dateKey, status);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dateMap;
  }

  private isSameDay(date1: Date | string, date2: Date | string): boolean {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  private getDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  updateSettings(newSettings: Partial<HalachicSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  updateLocation(newLocation: Partial<UserLocation>): void {
    this.location = { ...this.location, ...newLocation };
  }

  isTodayProhibited(history: VesetHistory): boolean {
    const today = new Date();
    const status = this.getDateStatus(today, history);
    return status?.status === 'prohibited';
  }

  getNextVeset(history: VesetHistory): CalculatedVeset | undefined {
    const result = this.calculateAll(history);
    const today = new Date();
    const futureVesatot = result.nextVesatot
      .filter(v => v.date > today)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    return futureVesatot[0] || undefined;
  }

  getNextMikvahNight(history: VesetHistory): CalculatedDate | undefined {
    const result = this.calculateAll(history);
    const today = new Date();
    if (result.mikvahNight && result.mikvahNight.date > today) {
      return result.mikvahNight;
    }
    return undefined;
  }

  getCleanDaysCompleted(history: VesetHistory): number {
    const result = this.calculateAll(history);
    const today = new Date();
    const completedDays = result.cleanDays.filter(d => d.date < today);
    return completedDays.length;
  }

  validateHistory(history: VesetHistory): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (history.events.length === 0) errors.push('חייבת להיות לפחות וסת אחת רשומה');
    const sortedEvents = [...history.events].sort((a, b) => a.date.getTime() - b.date.getTime());
    for (let i = 1; i < sortedEvents.length; i++) {
      if (sortedEvents[i].date <= sortedEvents[i-1].date) {
        errors.push(`וסת מ-${sortedEvents[i].date} מתרחשת לפני או באותו זמן כמו וסת קודמת`);
      }
    }
    return { isValid: errors.length === 0, errors };
  }

  exportSettings(): HalachicSettings { return { ...this.settings }; }
  exportLocation(): UserLocation { return { ...this.location }; }
}

export function createTaharaCalculator(
  settings: HalachicSettings,
  location: UserLocation
): TaharaCalculator {
  return new TaharaCalculator(settings, location);
}