/**
 * מודול וסתות קבועות
 * ─────────────────────────────────────────────
 * שלושה סוגי וסת קבועה:
 *  1. יום החודש  — אותו יום עברי, אותה עונה, 3 חודשים ברצף
 *  2. יום ל'     — כל 30 יום (בדיוק), אותה עונה, 3 פעמים ברצף
 *  3. הפלגה      — אותו מרווח בין וסת לוסת, אותה עונה, 3 פעמים ברצף
 *
 * ביטול: 3 פעמים שהוסת הקבוע עבר ולא באה בעונתו — מתבטל
 *
 * כשיש וסת קבועה:
 *  • יום החודש קבוע → פרישה רק ביום החודש (לא יום ל', לא הפלגה)
 *  • יום ל' קבוע    → פרישה רק ביום ל' (לא יום חודש, לא הפלגה)
 *  • הפלגה קבועה   → פרישה רק ביום הפלגה (לא יום חודש, לא יום ל')
 */

import {
  VesetEvent,
  HefsekhTahara,
  HalachicSettings,
  UserLocation,
  OnahType,
  CalculatedVeset,
} from '@/types';
import {
  getHebrewDayOfMonth,
  getSameHebrewDayNextMonth,
} from '../hebrew-calendar';

// ─────────────────────────────────────────────
// טיפוסים
// ─────────────────────────────────────────────

export type KavuaType = 'yom_hachodesh' | 'yom_30' | 'haflagah';

export interface VesetKavua {
  type: KavuaType;
  /** תאריכי הוסתות שיצרו את הקביעות (3 האחרונות) */
  basedOn: VesetEvent[];
  /** התאריך הבא שבו צריכה לפרוש */
  nextDates: CalculatedVeset[]; // עד 3 חודשים קדימה
  /** כמה פעמים עבר ולא באה (לצורך ביטול) */
  missedCount: number;
  /** האם עדיין בתוקף */
  isActive: boolean;
  /** פרטים: יום עברי / מרווח ימים */
  detail: string;
}

// ─────────────────────────────────────────────
// עזר: השוואת עונות
// ─────────────────────────────────────────────

function sameOnah(a: OnahType, b: OnahType) {
  return a === b;
}

// ─────────────────────────────────────────────
// עזר: הוסף חודשים עבריים (מחזיר תאריך גרגוריאני)
// ─────────────────────────────────────────────

function addHebrewMonths(date: Date, months: number): Date {
  let result = date;
  for (let i = 0; i < months; i++) {
    result = getSameHebrewDayNextMonth(result);
  }
  return result;
}

// ─────────────────────────────────────────────
// 1. בדיקת וסת קבועה ביום החודש
// ─────────────────────────────────────────────

export function checkYomHachodeshKavua(
  sorted: VesetEvent[] // מסודר מהישן לחדש
): { isKavua: boolean; events: VesetEvent[]; hebrewDay: number; onah: OnahType } | null {
  if (sorted.length < 3) return null;

  // בודקים שלוש אחרונות
  const last3 = sorted.slice(-3);
  const hebrewDays = last3.map(e => getHebrewDayOfMonth(e.date));
  const onot       = last3.map(e => e.onah);

  const allSameDay  = hebrewDays.every(d => d === hebrewDays[0]);
  const allSameOnah = onot.every(o => sameOnah(o, onot[0]));

  if (!allSameDay || !allSameOnah) return null;

  return {
    isKavua:    true,
    events:     last3,
    hebrewDay:  hebrewDays[0],
    onah:       onot[0],
  };
}

// ─────────────────────────────────────────────
// 2. בדיקת וסת קבועה יום ל'
// ─────────────────────────────────────────────

export function checkYom30Kavua(
  sorted: VesetEvent[]
): { isKavua: boolean; events: VesetEvent[]; onah: OnahType } | null {
  if (sorted.length < 3) return null;

  const last3 = sorted.slice(-3);

  for (let i = 1; i < last3.length; i++) {
    const diff = Math.round(
      (last3[i].date.getTime() - last3[i - 1].date.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diff !== 30) return null;
  }

  const onot = last3.map(e => e.onah);
  if (!onot.every(o => sameOnah(o, onot[0]))) return null;

  return { isKavua: true, events: last3, onah: onot[0] };
}

// ─────────────────────────────────────────────
// 3. בדיקת וסת קבועה הפלגה
// ─────────────────────────────────────────────

export function checkHaflagahKavua(
  sorted: VesetEvent[],
  hefsekhHistory: HefsekhTahara[],
  settings: HalachicSettings
): { isKavua: boolean; events: VesetEvent[]; interval: number; onah: OnahType } | null {
  if (sorted.length < 4) return null; // צריך 4 וסתות כדי לקבל 3 הפלגות

  const last4 = sorted.slice(-4);
  const intervals: number[] = [];

  for (let i = 1; i < last4.length; i++) {
    let interval: number;

    if (settings.method === 'chabad') {
      const prevHefsek = hefsekhHistory.find(h => h.vesetEventId === last4[i - 1].id);
      if (!prevHefsek) return null;
      interval = Math.round(
        (last4[i].date.getTime() - prevHefsek.date.getTime()) / (1000 * 60 * 60 * 24)
      );
    } else {
      interval = Math.round(
        (last4[i].date.getTime() - last4[i - 1].date.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    intervals.push(interval);
  }

  // כל 3 הפלגות שוות
  if (!intervals.every(iv => iv === intervals[0])) return null;

  const onot = last4.slice(1).map(e => e.onah); // עונות שלוש האחרונות
  if (!onot.every(o => sameOnah(o, onot[0]))) return null;

  return {
    isKavua:  true,
    events:   last4.slice(1), // 3 האחרונות
    interval: intervals[0],
    onah:     onot[0],
  };
}

// ─────────────────────────────────────────────
// בדיקת ביטול: כמה פעמים עבר ולא באה
// ─────────────────────────────────────────────

/**
 * בודק כמה פעמים "עבר" יום הפרישה הקבוע ולא הייתה וסת
 * מחזיר מספר (0–3). אם ≥ 3 → הוסת מתבטל.
 */
export function countMissedOccurrences(
  kavuaType: KavuaType,
  kavuaDates: Date[], // תאריכים צפויים לפרישה
  actualEvents: VesetEvent[]
): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let missed = 0;

  for (const expected of kavuaDates) {
    const exp = new Date(expected);
    exp.setHours(0, 0, 0, 0);

    // רק תאריכים שעברו
    if (exp >= today) continue;

    // בדיקה אם הייתה וסת ב±1 יום מהצפוי
    const came = actualEvents.some(e => {
      const d = new Date(e.date);
      d.setHours(0, 0, 0, 0);
      return Math.abs(d.getTime() - exp.getTime()) <= 86400000;
    });

    if (!came) missed++;
    if (missed >= 3) return 3;
  }

  return missed;
}

// ─────────────────────────────────────────────
// בניית תאריכי פרישה קדימה (3 חודשים)
// ─────────────────────────────────────────────

function buildFutureDates(
  type: KavuaType,
  baseDate: Date,
  onah: OnahType,
  interval?: number // רק להפלגה
): CalculatedVeset[] {
  const results: CalculatedVeset[] = [];

  for (let i = 1; i <= 3; i++) {
    let nextDate: Date;
    let reason: string;

    switch (type) {
      case 'yom_hachodesh':
        nextDate = addHebrewMonths(baseDate, i);
        reason   = `וסת קבועה – יום החודש (חודש ${i})`;
        break;

      case 'yom_30':
        nextDate = new Date(baseDate);
        nextDate.setDate(nextDate.getDate() + 30 * i);
        reason   = `וסת קבועה – יום ל' (פעם ${i})`;
        break;

      case 'haflagah':
        nextDate = new Date(baseDate);
        nextDate.setDate(nextDate.getDate() + (interval ?? 30) * i);
        reason   = `וסת קבועה – הפלגה (${interval} יום, פעם ${i})`;
        break;
    }

    results.push({
      type:     type === 'yom_hachodesh' ? 'yom_hachodesh'
               : type === 'yom_30'       ? 'yom_30'
               :                           'haflagah',
      date:     nextDate!,
      onah,
      reason:   reason!,
      isActive: true,
    });
  }

  return results;
}

// ─────────────────────────────────────────────
// פונקציה ראשית: מחשבת את כל הוסתות הקבועות
// ─────────────────────────────────────────────

export interface KavuaAnalysis {
  /** וסת קבועה פעילה (אם קיימת — רק אחת בכל פעם לפי סדר עדיפות) */
  activeKavua: VesetKavua | null;
  /**
   * אילו סוגי פרישה יש להציג:
   *  - אם יש קבועה → רק הסוג הקבוע
   *  - אם אין → כל הסוגים (חודש + ל' + הפלגה)
   */
  showTypes: KavuaType[];
  /** הודעה למשתמשת */
  message: string | null;
}

export function analyzeKavuot(
  vesetHistory: VesetEvent[],
  hefsekhHistory: HefsekhTahara[],
  settings: HalachicSettings,
  location: UserLocation
): KavuaAnalysis {
  if (vesetHistory.length < 3) {
    return { activeKavua: null, showTypes: ['yom_hachodesh', 'yom_30', 'haflagah'], message: null };
  }

  const sorted = [...vesetHistory].sort((a, b) => a.date.getTime() - b.date.getTime());
  const lastEvent = sorted[sorted.length - 1];

  // ── 1. בדיקת יום החודש ──
  const yomHachodesh = checkYomHachodeshKavua(sorted);
  if (yomHachodesh) {
    const futureDates = buildFutureDates('yom_hachodesh', lastEvent.date, yomHachodesh.onah);
    const missed = countMissedOccurrences('yom_hachodesh', futureDates.map(f => f.date), sorted);

    if (missed < 3) {
      const kavua: VesetKavua = {
        type:        'yom_hachodesh',
        basedOn:     yomHachodesh.events,
        nextDates:   futureDates,
        missedCount: missed,
        isActive:    true,
        detail:      `יום ${yomHachodesh.hebrewDay} בחודש העברי, ${yomHachodesh.onah === 'day' ? 'ביום' : 'בלילה'}`,
      };
      return {
        activeKavua: kavua,
        showTypes:   ['yom_hachodesh'],
        message:     `✅ נקבעה וסת קבועה ביום החודש — פרישה רק ביום ${yomHachodesh.hebrewDay} בחודש`,
      };
    }
  }

  // ── 2. בדיקת יום ל' ──
  const yom30 = checkYom30Kavua(sorted);
  if (yom30) {
    const futureDates = buildFutureDates('yom_30', lastEvent.date, yom30.onah);
    const missed = countMissedOccurrences('yom_30', futureDates.map(f => f.date), sorted);

    if (missed < 3) {
      const kavua: VesetKavua = {
        type:        'yom_30',
        basedOn:     yom30.events,
        nextDates:   futureDates,
        missedCount: missed,
        isActive:    true,
        detail:      `כל 30 יום, ${yom30.onah === 'day' ? 'ביום' : 'בלילה'}`,
      };
      return {
        activeKavua: kavua,
        showTypes:   ['yom_30'],
        message:     `✅ נקבעה וסת קבועה יום ל' — פרישה כל 30 יום`,
      };
    }
  }

  // ── 3. בדיקת הפלגה ──
  const haflagah = checkHaflagahKavua(sorted, hefsekhHistory, settings);
  if (haflagah) {
    const futureDates = buildFutureDates('haflagah', lastEvent.date, haflagah.onah, haflagah.interval);
    const missed = countMissedOccurrences('haflagah', futureDates.map(f => f.date), sorted);

    if (missed < 3) {
      const kavua: VesetKavua = {
        type:        'haflagah',
        basedOn:     haflagah.events,
        nextDates:   futureDates,
        missedCount: missed,
        isActive:    true,
        detail:      `כל ${haflagah.interval} יום, ${haflagah.onah === 'day' ? 'ביום' : 'בלילה'}`,
      };
      return {
        activeKavua: kavua,
        showTypes:   ['haflagah'],
        message:     `✅ נקבעה וסת קבועה הפלגה — פרישה כל ${haflagah.interval} יום`,
      };
    }
  }

  // ── אין קבועה ──
  return {
    activeKavua: null,
    showTypes:   ['yom_hachodesh', 'yom_30', 'haflagah'],
    message:     null,
  };
}
