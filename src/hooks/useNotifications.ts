/**
 * useNotifications — hook לניהול התראות
 * רושם Service Worker, מבקש הרשאה, ומתזמן את כל ההתראות
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
  CalculatedDate,
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

  // ── בקשת הרשאת Push ───────────────────────────
  const askPermission = useCallback(async () => {
    const granted = await requestPushPermission();
    setPushGranted(granted);
    return granted;
  }, []);

  // ── תזמון כל ההתראות ─────────────────────────
  const scheduleNotifications = useCallback(async () => {
    if (!userId || !settings || !location || history.events.length === 0) return;

    setLoading(true);
    try {
      // קבלת מייל המשתמשת
      const { data: { user } } = await supabase.auth.getUser();
      const userEmail = user?.email ?? '';

      // חישוב תוצאות
      const calculator = new TaharaCalculator(settings, location);
      const result     = calculator.calculateAll(history);

      // מיון אירועים
      const sortedEvents = [...history.events].sort(
        (a, b) => b.date.getTime() - a.date.getTime()
      );
      const latestVeset = sortedEvents[0];
      if (!latestVeset) return;

      // מציאת ההפסק הנוכחי
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
      console.log(`✅ תוזמנו ${count} התראות`);
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
  }, [
    userId,
    history.events.length,
    history.hefsekhTaharot.length,
  ]);

  return { pushGranted, scheduled, loading, askPermission, scheduleNotifications };
}
