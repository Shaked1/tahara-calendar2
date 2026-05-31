/**
 * מודול התראות מלא
 * ─────────────────────────────────────────────
 * סוגי התראות:
 *  1. תזכורת לנסות הפסק טהרה (יום 4 / יום 5 לפי שיטה)
 *  2. בדיקות יומיות כשיש הפסק (06:30 + שעתיים לפני שקיעה)
 *  3. תזכורת יומיים לפני הטבילה
 *  4. תזכורת ביום הטבילה
 *  5. תזכורות ימי פרישה (יום חודש / יום ל' / הפלגה) — תחילת עונה + סוף עונה
 *
 * שליחה: מייל (Resend) + Push Notification (Web Push)
 */

import { supabase } from '@/lib/supabase/client';
import {
  VesetEvent,
  HefsekhTahara,
  CalculatedDate,
  HalachicSettings,
  UserLocation,
} from '@/types';

// ─────────────────────────────────────────────
// טיפוסים
// ─────────────────────────────────────────────

export type NotificationType =
  | 'hefsek_reminder'      // תזכורת לנסות הפסק
  | 'clean_day_morning'    // בדיקת בוקר (06:30)
  | 'clean_day_afternoon'  // בדיקת צהריים (שעתיים לפני שקיעה)
  | 'pre_mikvah'           // יומיים לפני טבילה
  | 'mikvah_day'           // יום הטבילה
  | 'veset_start_onah'     // תחילת עונת פרישה
  | 'veset_end_onah';      // סוף עונת פרישה

export interface NotificationPayload {
  userId: string;
  userEmail: string;
  scheduledFor: Date;
  title: string;
  body: string;
  type: NotificationType;
}

// ─────────────────────────────────────────────
// עזר: חישוב שקיעה מקורב (NOAA פשוט)
// ─────────────────────────────────────────────

function calcSunset(date: Date, lat: number, lng: number): Date {
  const rad = Math.PI / 180;
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const B    = (360 / 365) * (dayOfYear - 81) * rad;
  const eot  = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
  const noon = 12 - lng / 15 - eot / 60;
  const decl = 23.45 * Math.sin(B) * rad;
  const cosH = -Math.tan(lat * rad) * Math.tan(decl);
  const H    = Math.abs(cosH) > 1 ? 6 : Math.acos(cosH) / rad;
  const sunsetUtc = noon + H / 15;

  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  d.setTime(d.getTime() + sunsetUtc * 3600 * 1000);
  return d;
}

function twoHoursBeforeSunset(date: Date, location: UserLocation): Date {
  const sunset = calcSunset(date, location.latitude, location.longitude);
  return new Date(sunset.getTime() - 2 * 60 * 60 * 1000);
}

// ─────────────────────────────────────────────
// עזר: בניית תאריך עם שעה
// ─────────────────────────────────────────────

function atTime(date: Date, hours: number, minutes: number): Date {
  const d = new Date(date);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function formatDateHe(date: Date): string {
  return date.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', weekday: 'long' });
}

// ─────────────────────────────────────────────
// 1. תזכורת לנסות הפסק טהרה
//    יום 4 = מרן עובדיה / בן איש חי / הרב אליהו
//    יום 5 = חב"ד
// ─────────────────────────────────────────────

export function buildHefsekReminders(
  userId: string,
  userEmail: string,
  vesetEvent: VesetEvent,
  settings: HalachicSettings,
  location: UserLocation
): NotificationPayload[] {
  const notifications: NotificationPayload[] = [];

  // קביעת היום הרלוונטי לפי שיטה
  const dayOffset = settings.method === 'chabad' ? 4 : 3; // יום 5 = +4, יום 4 = +3 (יום הראייה = יום 1)

  const hefsekDay = new Date(vesetEvent.date);
  hefsekDay.setDate(hefsekDay.getDate() + dayOffset);
  hefsekDay.setHours(0, 0, 0, 0);

  const dayLabel  = settings.method === 'chabad' ? 'החמישי' : 'הרביעי';
  const methodHe  = settings.method === 'chabad'
    ? 'חב"ד'
    : settings.method === 'ben_ish_chai'
      ? 'בן איש חי'
      : settings.method === 'ovadia_yosef'
        ? 'מרן הרב עובדיה יוסף'
        : 'הרב מרדכי אליהו';

  // התראת בוקר — 07:00
  notifications.push({
    userId,
    userEmail,
    scheduledFor: atTime(hefsekDay, 7, 0),
    title:        '🌅 תזכורת — הפסק טהרה',
    body:         `היום הוא יום ${dayLabel} למחזור. לפי שיטת ${methodHe} ניתן לנסות לעשות הפסק טהרה לפני השקיעה.`,
    type:         'hefsek_reminder',
  });

  // התראה שעתיים לפני שקיעה
  const afternoonTime = twoHoursBeforeSunset(hefsekDay, location);
  notifications.push({
    userId,
    userEmail,
    scheduledFor: afternoonTime,
    title:        '⏰ תזכורת — הפסק טהרה לפני השקיעה',
    body:         `עוד כשעתיים השקיעה. זו ההזדמנות האחרונה להיום לעשות הפסק טהרה.`,
    type:         'hefsek_reminder',
  });

  return notifications;
}

// ─────────────────────────────────────────────
// 2. בדיקות יומיות — 7 ימים נקיים
//    06:30 בוקר + שעתיים לפני שקיעה
// ─────────────────────────────────────────────

export function buildCleanDayReminders(
  userId: string,
  userEmail: string,
  cleanDays: CalculatedDate[],
  location: UserLocation
): NotificationPayload[] {
  const notifications: NotificationPayload[] = [];

  cleanDays.forEach(day => {
    if (!day.cleanDayNumber) return;

    const num  = day.cleanDayNumber;
    const date = new Date(day.date);

    // בוקר — 06:30
    notifications.push({
      userId,
      userEmail,
      scheduledFor: atTime(date, 6, 30),
      title:        `☀️ בדיקת בוקר — יום נקי ${num}`,
      body:         `בוקר טוב! היום יום נקי ${num} מתוך 7. זכרי לעשות בדיקה בבוקר.`,
      type:         'clean_day_morning',
    });

    // שעתיים לפני שקיעה
    const afternoonTime = twoHoursBeforeSunset(date, location);
    notifications.push({
      userId,
      userEmail,
      scheduledFor: afternoonTime,
      title:        `🌅 בדיקת אחר הצהריים — יום נקי ${num}`,
      body:         `עוד כשעתיים השקיעה. זכרי לעשות בדיקה לפני ${num === 7 ? 'הטבילה הערב! 💧' : 'סוף היום.'}`,
      type:         'clean_day_afternoon',
    });
  });

  return notifications;
}

// ─────────────────────────────────────────────
// 3. תזכורת יומיים לפני הטבילה
// ─────────────────────────────────────────────

export function buildPreMikvahReminder(
  userId: string,
  userEmail: string,
  mikvahNight: CalculatedDate
): NotificationPayload {
  const mikvahDate = new Date(mikvahNight.date);
  const twoDaysBefore = new Date(mikvahDate);
  twoDaysBefore.setDate(twoDaysBefore.getDate() - 2);

  return {
    userId,
    userEmail,
    scheduledFor: atTime(twoDaysBefore, 9, 0),
    title:        '💧 עוד יומיים — ליל הטבילה',
    body:         `בעוד יומיים, ב${formatDateHe(mikvahDate)}, הוא ליל הטבילה שלך. זמן טוב להתכונן.`,
    type:         'pre_mikvah',
  };
}

// ─────────────────────────────────────────────
// 4. תזכורת ביום הטבילה
// ─────────────────────────────────────────────

export function buildMikvahDayReminder(
  userId: string,
  userEmail: string,
  mikvahNight: CalculatedDate,
  location: UserLocation
): NotificationPayload[] {
  const notifications: NotificationPayload[] = [];
  const date = new Date(mikvahNight.date);

  // בוקר — 09:00
  notifications.push({
    userId,
    userEmail,
    scheduledFor: atTime(date, 9, 0),
    title:        '💧 הערב — ליל הטבילה!',
    body:         'הערב הוא ליל הטבילה שלך. טבילה כשרה ומבורכת!',
    type:         'mikvah_day',
  });

  // שעה לפני שקיעה — תזכורת אחרונה
  const sunset = calcSunset(date, location.latitude, location.longitude);
  const oneHourBefore = new Date(sunset.getTime() - 60 * 60 * 1000);
  notifications.push({
    userId,
    userEmail,
    scheduledFor: oneHourBefore,
    title:        '🌙 עוד שעה — צאת הכוכבים',
    body:         'בעוד כשעה צאת הכוכבים. הכיני את עצמך לטבילה. טבילה כשרה!',
    type:         'mikvah_day',
  });

  return notifications;
}

// ─────────────────────────────────────────────
// 5. תזכורות ימי פרישה
//    תחילת עונה + סוף עונה
// ─────────────────────────────────────────────

const VESET_TYPE_HE: Record<string, string> = {
  yom_hachodesh: 'יום החודש',
  yom_30:        'יום השלושים',
  haflagah:      'יום ההפלגה',
};

export function buildVesetDayReminders(
  userId: string,
  userEmail: string,
  prohibitedDate: CalculatedDate,
  location: UserLocation
): NotificationPayload[] {
  const notifications: NotificationPayload[] = [];

  const vesetTypes = (prohibitedDate.vesetTypes ?? [])
    .filter(t => ['yom_hachodesh', 'yom_30', 'haflagah'].includes(t));

  if (vesetTypes.length === 0) return [];

  const typeLabels = vesetTypes.map(t => VESET_TYPE_HE[t] ?? t).join(' + ');
  const date       = new Date(prohibitedDate.date);
  const onah       = prohibitedDate.onah;

  // תחילת העונה
  let startOfOnah: Date;
  if (onah === 'night') {
    // עונת לילה מתחילה בשקיעה
    startOfOnah = calcSunset(date, location.latitude, location.longitude);
    // 15 דקות לפני תחילת העונה
    const reminderTime = new Date(startOfOnah.getTime() - 15 * 60 * 1000);
    notifications.push({
      userId,
      userEmail,
      scheduledFor: reminderTime,
      title:        `⚠️ עוד 15 דקות — תחילת עונת פרישה`,
      body:         `בעוד כרבע שעה מתחילה עונת הפרישה של ${typeLabels}. זכרי לפרוש כהלכה.`,
      type:         'veset_start_onah',
    });
  } else {
    // עונת יום — 06:30 בבוקר
    notifications.push({
      userId,
      userEmail,
      scheduledFor: atTime(date, 6, 30),
      title:        `⚠️ היום — יום פרישה (${typeLabels})`,
      body:         `היום יום פרישה של ${typeLabels} — עונת יום. זכרי לפרוש מהזריחה.`,
      type:         'veset_start_onah',
    });
  }

  // סוף העונה — תזכורת שהפרישה הסתיימה
  if (onah === 'day') {
    const sunset = calcSunset(date, location.latitude, location.longitude);
    notifications.push({
      userId,
      userEmail,
      scheduledFor: new Date(sunset.getTime() + 5 * 60 * 1000), // 5 דקות אחרי שקיעה
      title:        `✅ עונת הפרישה הסתיימה`,
      body:         `עונת הפרישה של ${typeLabels} הסתיימה עם שקיעת השמש.`,
      type:         'veset_end_onah',
    });
  } else {
    // עונת לילה מסתיימת בזריחה
    const tomorrow = new Date(date);
    tomorrow.setDate(tomorrow.getDate() + 1);
    // קירוב זריחה: שקיעה - 13 שעות
    const sunrise = new Date(calcSunset(date, location.latitude, location.longitude).getTime() - 13 * 3600 * 1000);
    notifications.push({
      userId,
      userEmail,
      scheduledFor: new Date(sunrise.getTime() + 5 * 60 * 1000),
      title:        `✅ עונת הפרישה הסתיימה`,
      body:         `עונת הפרישה של ${typeLabels} הסתיימה עם הזריחה.`,
      type:         'veset_end_onah',
    });
  }

  return notifications;
}

// ─────────────────────────────────────────────
// שמירה ל-Supabase (scheduled_notifications)
// ─────────────────────────────────────────────

export async function saveAllNotifications(
  notifications: NotificationPayload[]
): Promise<void> {
  if (notifications.length === 0) return;

  const rows = notifications
    .map(n => {
      const dateObj = n.scheduledFor instanceof Date ? n.scheduledFor : new Date(n.scheduledFor);

      if (isNaN(dateObj.getTime())) {
        console.error("❌ התגלה תאריך לא תקין עבור התראה:", n);
        return null; 
      }

      return {
        user_id:       n.userId,
        user_email:    n.userEmail,       // 👈 קיים במיגרציה 002
        scheduled_for: dateObj.toISOString(),
        title:         n.title,
        body:          n.body,            // 👈 העמודה שה-DB חיפש
        type:          n.type,
        sent:          false,             // 👈 שינינו ב-DB מ-is_sent ל-sent
      };
    })
    .filter(row => row !== null);

  if (rows.length === 0) return;

  const { error } = await supabase
    .from('scheduled_notifications')
    .insert(rows as any[]);

  if (error) {
    console.error('Error saving notifications details:', error.message, error.details);
    throw error;
  }
}

// ─────────────────────────────────────────────
// מחיקת התראות ישנות של משתמש (לפני חישוב חדש)
// ─────────────────────────────────────────────

export async function clearPendingNotifications(
  userId: string,
  types?: NotificationType[]
): Promise<void> {
  let query = supabase
    .from('scheduled_notifications')
    .delete()
    .eq('user_id', userId)
    .eq('sent', false)
    .gt('scheduled_for', new Date().toISOString());

  if (types && types.length > 0) {
    (query as any).in('type', types);
  }

  const { error } = await query;
  if (error) console.error('Error clearing notifications:', error);
}

// ─────────────────────────────────────────────
// Web Push — רישום + שליחה
// ─────────────────────────────────────────────

export async function requestPushPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  const result = await Notification.requestPermission();
  return result === 'granted';
}

export async function showPushNotification(
  title: string,
  body: string,
  options?: { icon?: string; badge?: string; tag?: string }
): Promise<void> {
  const granted = await requestPushPermission();
  if (!granted) return;

  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      body,
      icon:  options?.icon  ?? '/icons/icon-192x192.png',
      badge: options?.badge ?? '/icons/icon-72x72.png',
      tag:   options?.tag,
      dir:   'rtl',
      lang:  'he',
    } as any);
  } else {
    new Notification(title, { body, dir: 'rtl', lang: 'he' });
  }
}

// ─────────────────────────────────────────────
// פונקציה ראשית — מחשבת ושומרת את כל ההתראות
// למחזור נוכחי שלם
// ─────────────────────────────────────────────

export async function scheduleAllNotificationsForCycle(params: {
  userId:      string;
  userEmail:   string;
  vesetEvent:  VesetEvent;
  hefsekh:     HefsekhTahara | null;
  cleanDays:   CalculatedDate[];
  mikvahNight: CalculatedDate | null;
  prohibitedDates: CalculatedDate[];
  settings:    HalachicSettings;
  location:    UserLocation;
}): Promise<number> {
  const {
    userId, userEmail, vesetEvent, hefsekh,
    cleanDays, mikvahNight, prohibitedDates,
    settings, location,
  } = params;

  const all: NotificationPayload[] = [];
  const now = new Date();

  // 1. תזכורות הפסק טהרה (רק אם עוד לא נעשה הפסק)
  if (!hefsekh) {
    all.push(...buildHefsekReminders(userId, userEmail, vesetEvent, settings, location)
      .filter(n => n.scheduledFor > now));
  }

  // 2. בדיקות ימים נקיים (רק אם יש הפסק)
  if (hefsekh && cleanDays.length > 0) {
    all.push(...buildCleanDayReminders(userId, userEmail, cleanDays, location)
      .filter(n => n.scheduledFor > now));
  }

  // 3. + 4. תזכורות טבילה
  if (mikvahNight) {
    const preMikvah = buildPreMikvahReminder(userId, userEmail, mikvahNight);
    if (preMikvah.scheduledFor > now) all.push(preMikvah);

    all.push(...buildMikvahDayReminder(userId, userEmail, mikvahNight, location)
      .filter(n => n.scheduledFor > now));
  }

  // 5. תזכורות ימי פרישה (3 חודשים קדימה)
  const futurePrisha = prohibitedDates.filter(d => {
    const types = d.vesetTypes ?? [];
    return (
      d.date > now &&
      types.some(t => ['yom_hachodesh', 'yom_30', 'haflagah'].includes(t))
    );
  });

  futurePrisha.forEach(pd => {
    all.push(...buildVesetDayReminders(userId, userEmail, pd, location)
      .filter(n => n.scheduledFor > now));
  });

  // מחיקת ישנות + שמירת חדשות
  await clearPendingNotifications(userId);
  if (all.length > 0) await saveAllNotifications(all);

  return all.length;
}