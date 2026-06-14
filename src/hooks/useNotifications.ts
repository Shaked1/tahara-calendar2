/**
 * useNotifications — hook לניהול התראות
 */

'use client';

import { useEffect, useCallback, useState } from 'react';
import {
  scheduleAllNotificationsForCycle,
  requestPushPermission,
} from '@/lib/notifications';
import {
  HalachicSettings,
  UserLocation,
  VesetHistory,
} from '@/types';
import { TaharaCalculator } from '@/lib/halacha/calculator';
import { supabase } from '@/lib/supabase/client';

interface UseNotificationsProps {
  userId:   string | null;
  history:  VesetHistory;
  settings: HalachicSettings | null;
  location: UserLocation | null;
}

export function useNotifications({
  userId,
  history,
  settings,
  location,
}: UseNotificationsProps) {
  const [pushGranted, setPushGranted] = useState(false);
  const [scheduled,   setScheduled]   = useState(0);
  const [loading,     setLoading]     = useState(false);

  // ── רישום Service Worker ──────────────────────
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(() => console.log('SW registered'))
        .catch(e => console.error('SW registration failed:', e));
    }
  }, []);

  // ── בקשת הרשאת Push ושמירת ה-Subscription ──
  const askPermission = useCallback(async () => {
    try {
      const granted = await requestPushPermission();
      setPushGranted(granted);
      
      if (granted && userId && 'serviceWorker' in navigator) {
        // משיגים את ה-registration של ה-Service Worker כשהוא מוכן
        const registration = await navigator.serviceWorker.ready;
        
        // משיגים את ה-subscription הקיים או יוצרים אחד במידת הצורך
        // (מומלץ להשתמש ב-subscribe אם גוגל/דפדפן דורש חידוש, אך פה נשען על המנגנון הקיים)
        let subscription = await registration.pushManager.getSubscription();
        
        // אם אין subscription פעיל, ננסה לרשום אותו (דורש VAPID Key בדרך כלל בתוך ה-options)
        if (!subscription) {
          // במידה ויש לך VAPID Public Key, מומלץ להפעיל כאן את הרישום בפועל:
          // subscription = await registration.pushManager.subscribe({
          //   userVisibleOnly: true,
          //   applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)
          // });
        }

        if (subscription) {
          // שומרים או מעדכנים (Upsert) בטבלה החדשה
          // אנו מגדירים ל-from בצורה מפורשת את שם הטבלה ואת הטיפוס שלה מתוך קובץ ה-database.ts
          const { error } = await supabase
          .from('user_subscriptions')
            .upsert({
              user_id: userId,
              subscription: subscription.toJSON() as any, // המרה ל-any פותרת את ההתאמה ל-JSONB בדאטהבייס
              updated_at: new Date().toISOString()
            } as any); // הגדרת האובייקט כולו כ-any מונעת מ-TypeScript להכשיל את ה-upsert בגלל חוסר התאמה של שדות דינמיים

          if (error) {
            console.error('Error saving subscription to Supabase:', error);
          } else {
            console.log('Subscription successfully saved to Supabase.');
          }
        }
      }
      
      return granted;
    } catch (error) {
      console.error('Error during askPermission flow:', error);
      return false;
    }
  }, [userId]);

  // ── תזמון התראות במערכת (מייל + דאטהבייס) ──
  const scheduleNotifications = useCallback(async () => {
    if (!userId || !settings || !location || history.events.length === 0) return;

    setLoading(true);
    try {
      const user = await supabase.auth.getUser();
      const userEmail = user.data.user?.email ?? '';

      const calculator = new TaharaCalculator(settings, location);
      const result     = calculator.calculateAll(history);

      const sortedEvents = [...history.events].sort(
        (a, b) => b.date.getTime() - a.date.getTime()
      );
      const latestVeset = sortedEvents[0];
      if (!latestVeset) return;

      const currentHefsekh = history.hefsekhTaharot
        .filter(h => h.vesetEventId === latestVeset.id)
        .sort((a, b) => b.date.getTime() - a.date.getTime())[0] ?? null;

      const count = await scheduleAllNotificationsForCycle({
        userId,
        userEmail,
        vesetEvent:      latestVeset,
        hefsekh:         currentHefsekh,
        cleanDays:       result.cleanDays,
        mikvahNight:     result.mikvahNight ?? null,
        prohibitedDates: result.prohibitedDates,
        settings,
        location,
      });

      setScheduled(count);
    } catch (e) {
      console.error('Error scheduling notifications:', e);
    } finally {
      setLoading(false);
    }
  }, [userId, history, settings, location]);

  // ── הרצה אוטומטית כשיש נתונים ────────────────
  useEffect(() => {
    if (userId && settings && location && history.events.length > 0) {
      scheduleNotifications();
    }
  }, [scheduleNotifications, userId, settings, location, history.events.length]);

  return {
    pushGranted,
    scheduled,
    loading,
    askPermission,
    scheduleNotifications,
  };
}