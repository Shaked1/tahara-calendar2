
/**
 * מודול התראות - כולל תזכורות פרישה 3 ימים מראש
 */

import { CalculatedDate } from '@/types';
import { supabase } from '@/lib/supabase/client';

export interface NotificationSchedule {
  userId: string;
  date: Date;
  time: string;
  type: 'morning' | 'evening' | 'veset_reminder';
  message: string;
  cleanDayNumber?: number;
  subject?: string; // עבור מיילים
}

/**
 * 1. יצירת תזכורות עבור 7 ימים נקיים (מעודכן ל-07:00 ו-14:00)
 */
export function createCleanDaysNotifications(
  userId: string,
  cleanDays: CalculatedDate[]
): NotificationSchedule[] {
  const notifications: NotificationSchedule[] = [];

  cleanDays.forEach((day) => {
    if (!day.cleanDayNumber) return;

    // תזכורת בוקר - 07:00
    notifications.push({
      userId,
      date: day.date,
      time: '07:00',
      type: 'morning',
      message: `🌅 בוקר טוב! זכרי לעשות בדיקה - יום נקי ${day.cleanDayNumber} מתוך 7`,
      cleanDayNumber: day.cleanDayNumber,
      subject: 'תזכורת בדיקת בוקר'
    });

    // תזכורת צהריים - 14:00 (לפני שקיעה)
    notifications.push({
      userId,
      date: day.date,
      time: '14:00',
      type: 'evening',
      message: `🌆 תזכורת צהריים: זכרי לעשות בדיקה לפני השקיעה - יום נקי ${day.cleanDayNumber} מתוך 7`,
      cleanDayNumber: day.cleanDayNumber,
      subject: 'תזכורת בדיקת הפסק/צהריים'
    });
  });

  return notifications;
}

/**
 * 2. יצירת תזכורות לימי פרישה (3 ימים מראש וביום עצמו)
 */
export function createVesetReminders(
  userId: string,
  prohibitedDates: CalculatedDate[]
): NotificationSchedule[] {
  const notifications: NotificationSchedule[] = [];

  // נסנן רק ימים שהם ימי פרישה (הפלגה, חודש, 30)
  const vesetDays = prohibitedDates.filter(day => 
    day.vesetTypes && day.vesetTypes.some(t => ['yom_30', 'yom_hachodesh', 'haflagah'].includes(t))
  );

  vesetDays.forEach((day) => {
    const typesHe = day.vesetTypes?.map(t => {
      if (t === 'yom_30') return 'יום ה-30';
      if (t === 'yom_hachodesh') return 'יום החודש';
      if (t === 'haflagah') return 'יום ההפלגה';
      return '';
    }).join(' ו-');

    // א. תזכורת 3 ימים מראש (שעה 20:00 בערב)
    const threeDaysBefore = new Date(day.date);
    threeDaysBefore.setDate(threeDaysBefore.getDate() - 3);
    
    notifications.push({
      userId,
      date: threeDaysBefore,
      time: '20:00',
      type: 'veset_reminder',
      message: `🔔 שימי לב: בעוד 3 ימים יחול יום פרישה (${typesHe}).`,
      subject: 'תזכורת מוקדמת ליום פרישה'
    });

    // ב. תזכורת ביום הפרישה עצמו (08:00 בבוקר)
    notifications.push({
      userId,
      date: day.date,
      time: '08:00',
      type: 'veset_reminder',
      message: `⚠️ היום יום פרישה (${typesHe}). זכרי לפרוש כהלכה בעונה המתאימה.`,
      subject: 'היום יום פרישה'
    });
  });

  return notifications;
}

/**
 * שליחת מייל משולבת (לוגיקה כללית)
 */
export async function processAndSendNotifications(
  userEmail: string,
  notifications: NotificationSchedule[]
) {
  for (const n of notifications) {
    // כאן תזמני את המייל לצאת ב-n.date ובשעה n.time
    // אם את משתמשת ב-Node.js בשרת, אפשר להשתמש ב-Cron Jobs או ב-Queues
    await sendEmailNotification(userEmail, n.subject || 'תזכורת טהרה', n.message);
    
    // שליחת Push לטלפון (אם המשתמש באפליקציה כרגע)
    await showLocalNotification(n.subject || 'תזכורת', n.message);
  }
}



/**
 * יצירת תזכורת לליל טבילה
 */
export function createMikvahNotification(
  userId: string,
  mikvahNight: CalculatedDate
): NotificationSchedule {
  return {
    userId,
    date: mikvahNight.date,
    time: '18:00',
    type: 'evening',
    message: '💧 הערב ליל טבילה! זכרי לצאת לטבילה אחרי צאת הכוכבים',
  };
}

/**
 * שליחת התראה למייל (דמה - צריך אינטגרציה עם שירות מייל)
 */
export async function sendEmailNotification(
  email: string,
  subject: string,
  message: string
): Promise<boolean> {
  try {
    // כאן תשלב עם שירות מייל כמו SendGrid, AWS SES, וכו'
    console.log('📧 Email notification:', { email, subject, message });
    
    // TODO: אינטגרציה אמיתית
    // await fetch('/api/send-email', {
    //   method: 'POST',
    //   body: JSON.stringify({ email, subject, message })
    // });
    
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * רישום להתראות Push (דורש Service Worker)
 */
export async function subscribeToPushNotifications(
  userId: string
): Promise<boolean> {
  try {
    if (!('Notification' in window)) {
      console.log('התראות לא נתמכות בדפדפן זה');
      return false;
    }

    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      console.log('המשתמש לא נתן הרשאה להתראות');
      return false;
    }

    // TODO: רישום ל-Push Service
    console.log('✅ התראות הופעלו למשתמש:', userId);
    return true;
  } catch (error) {
    console.error('Error subscribing to notifications:', error);
    return false;
  }
}

/**
 * שליחת התראה מקומית (בדפדפן)
 */
export async function showLocalNotification(
  title: string,
  message: string,
  options?: NotificationOptions
): Promise<void> {
  try {
    if (!('Notification' in window)) {
      return;
    }

    if (Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        ...options,
      });
    }
  } catch (error) {
    console.error('Error showing notification:', error);
  }
}

/**
 * תזמון התראות (לשימוש עתידי עם Service Worker)
 */
export interface ScheduledNotification {
  id: string;
  userId: string;
  scheduledFor: Date;
  title: string;
  body: string;
  sent: boolean;
}

/**
 * שמירת התראות מתוזמנות (לדוגמה - צריך DB אמיתי)
 */
export async function saveScheduledNotifications(
  notifications: NotificationSchedule[]
): Promise<void> {
  try {
    if (notifications.length === 0) return;
    
    const userId = notifications[0]?.userId;
    if (!userId) return;

    // 1. מחיקת התראות ישנות שטרם נשלחו
    await supabase
      .from('scheduled_notifications')
      .delete()
      .eq('user_id', userId)
      .eq('is_sent', false);

    // 2. הכנת הנתונים למערך
    const dataToInsert = notifications.map(n => {
      // יצירת אובייקט תאריך ושעה מדויק
      const [hours, minutes] = n.time.split(':').map(Number);
      const scheduledDate = new Date(n.date);
      scheduledDate.setHours(hours, minutes, 0, 0);

      return {
        user_id: userId,
        scheduled_for: scheduledDate.toISOString(),
        title: n.subject || 'תזכורת טהרה',
        body: n.message,
        type: mapNotificationType(n.type, n.message),
        is_sent: false
      };
    });

    // 3. שמירה ב-Supabase עם Casting למערך any כדי להעלים שגיאות טיפוסים
    const { error: insertError } = await supabase
      .from('scheduled_notifications')
      .insert(dataToInsert as any[]);

    if (insertError) throw insertError;

    console.log('✅ Notifications saved successfully');

  } catch (error) {
    console.error('Error saving notifications:', error);
  }
}

/**
 * פונקציית עזר לתרגום הסוגים עבור ה-DB
 */
function mapNotificationType(type: string, message: string): string {
  if (type === 'veset_reminder') return 'veset_reminder';
  if (message.includes('טבילה')) return 'mikvah_night';
  if (type === 'morning' || type === 'evening') return 'clean_day';
  return 'general';
}