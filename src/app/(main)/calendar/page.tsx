/**
 * דף לוח השנה הראשי - מותאם מובייל
 */

'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarGrid } from '@/components/calendar/CalendarGrid';
import { AddVesetModal } from '@/components/calendar/AddVesetModal';
import { AddHefsekhModal } from '@/components/calendar/AddHefsekhModal';
import { SidebarMenu } from '@/components/calendar/SidebarMenu';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Plus, Settings, LogOut, Menu, Bell } from 'lucide-react';
import { supabase, getCurrentUser, signOut } from '@/lib/supabase/client';
import { getUserHistory, addVesetEvent } from '@/lib/supabase/vesatot';
import { TaharaCalculator } from '@/lib/halacha/calculator';
import { HalachicSettings, UserLocation, VesetHistory } from '@/types';
import { useNotifications } from '@/hooks/useNotifications';
import { getZmanimForDate, formatTime } from '@/lib/zmanim';

// ─────────────────────────────────────────────
// טיפוס עבור פרטי הסטטוס
// ─────────────────────────────────────────────

interface TodayStatusInfo {
  label: string;
  sublabel?: string;       // שורה שנייה (למשל "יום 3 מתוך 7")
  details: string;
  variant: string;
  icon: string;
  timeRange?: string;      // שעות הפרישה (רלוונטי רק לימי פרישה)
  onahLabel?: string;      // "עונת יום" / "עונת לילה" / "כל היום"
}

// ─────────────────────────────────────────────
// פונקציות עזר לעיצוב הכרטיס
// ─────────────────────────────────────────────

function getCardStyles(variant: string): { bg: string; border: string; title: string; detail: string; badge: string } {
  switch (variant) {
    case 'prohibited':
      return {
        bg:     'bg-red-50',
        border: 'border-red-200',
        title:  'text-red-900',
        detail: 'text-red-700',
        badge:  'bg-red-100 text-red-800 border-red-300',
      };
    case 'hefsek':
      return {
        bg:     'bg-emerald-50',
        border: 'border-emerald-200',
        title:  'text-emerald-900',
        detail: 'text-emerald-700',
        badge:  'bg-emerald-100 text-emerald-800 border-emerald-300',
      };
    case 'clean':
      return {
        bg:     'bg-sky-50',
        border: 'border-sky-200',
        title:  'text-sky-900',
        detail: 'text-sky-700',
        badge:  'bg-sky-100 text-sky-800 border-sky-300',
      };
    case 'mikvah':
      return {
        bg:     'bg-indigo-50',
        border: 'border-indigo-200',
        title:  'text-indigo-900',
        detail: 'text-indigo-700',
        badge:  'bg-indigo-100 text-indigo-800 border-indigo-300',
      };
    default:
      return {
        bg:     'bg-slate-50',
        border: 'border-slate-200',
        title:  'text-slate-900',
        detail: 'text-slate-600',
        badge:  'bg-slate-100 text-slate-700 border-slate-300',
      };
  }
}

// ─────────────────────────────────────────────
// קומפוננטת כרטיס סטטוס
// ─────────────────────────────────────────────

function TodayStatusCard({ info }: { info: TodayStatusInfo }) {
  const s = getCardStyles(info.variant);

  return (
    <Card className={`mb-4 md:mb-6 shadow-sm border transition-all ${s.bg} ${s.border}`}>
      <CardContent className="p-4 md:p-5">
        <div className="flex items-start gap-3">
          {/* אייקון */}
          <span className="text-2xl md:text-3xl shrink-0 mt-0.5">{info.icon}</span>

          {/* תוכן */}
          <div className="flex-1 min-w-0">
            {/* כותרת + badge עונה */}
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className={`font-bold text-sm md:text-base ${s.title}`}>
                {info.label}
              </h3>
              {info.sublabel && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${s.badge}`}>
                  {info.sublabel}
                </span>
              )}
            </div>

            {/* פרטים ראשיים */}
            {info.details && (
              <p className={`text-xs md:text-sm ${s.detail}`}>{info.details}</p>
            )}

            {/* שעות פרישה — רק לימי איסור */}
            {info.timeRange && (
              <div className={`mt-2 flex flex-wrap items-center gap-2`}>
                {info.onahLabel && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded border ${s.badge}`}>
                    {info.onahLabel}
                  </span>
                )}
                <span className={`text-xs md:text-sm font-medium ${s.detail}`}>
                  🕐 {info.timeRange}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────
// הקומפוננטה הראשית
// ─────────────────────────────────────────────

export default function CalendarPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showHefsekhModal, setShowHefsekhModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [history, setHistory] = useState<VesetHistory>({ events: [], hefsekhTaharot: [] });
  const [calculatedDates, setCalculatedDates] = useState<Map<string, any>>(new Map());
  const [settings, setSettings] = useState<HalachicSettings | null>(null);
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const { askPermission, scheduled } = useNotifications({
    userId,
    history,
    settings,
    location,
  });

  const calculateDates = useCallback((
    hist: VesetHistory,
    sett: HalachicSettings,
    loc: UserLocation
  ) => {
    const calculator = new TaharaCalculator(sett, loc);
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 11);
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 4);
    const dateMap = calculator.calculateForRange(startDate, endDate, hist);
    setCalculatedDates(dateMap);
  }, []);

  const loadUserData = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      if (!user) { router.push('/login'); return; }
      setUserId(user.id);

      const { data: profile, error: profileError } = await supabase
        .from('users_profile')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      if (!profile || !(profile as any).onboarding_completed) {
        router.push('/onboarding');
        return;
      }

      const userSettings: HalachicSettings = {
        method:   (profile as any).halachic_method,
        orZarua:  (profile as any).or_zarua,
        yom31:    (profile as any).yom_31,
        maatLeat: (profile as any).maat_leat,
      };
      setSettings(userSettings);

      const userLocation: UserLocation = {
        latitude:     parseFloat((profile as any).latitude),
        longitude:    parseFloat((profile as any).longitude),
        timezone:     (profile as any).timezone,
        locationName: (profile as any).location_name,
      };
      setLocation(userLocation);

      const userHistory = await getUserHistory(user.id);
      setHistory(userHistory);

      if (userHistory.events.length > 0) {
        calculateDates(userHistory, userSettings, userLocation);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      alert('שגיאה בטעינת נתונים');
    } finally {
      setLoading(false);
    }
  }, [router, calculateDates]);

  useEffect(() => { loadUserData(); }, [loadUserData]);

  // ─────────────────────────────────────────────
  // חישוב סטטוס היום
  // ─────────────────────────────────────────────

  const todayStatusInfo = useMemo((): TodayStatusInfo => {
    if (loading) return { label: 'טוען נתונים...', details: '', variant: 'loading', icon: '⏳' };

    if (!location) return { label: 'אין מידע הלכתי', details: 'נא להשלים הגדרות מיקום', variant: 'normal', icon: 'ℹ️' };

    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const cd = calculatedDates?.get(todayKey);

    // שליפת זמני יום לפי מיקום אמיתי של המשתמשת
    let sunriseStr = '--:--';
    let sunsetStr  = '--:--';
    try {
      const zmanim = getZmanimForDate(today, location);
      sunriseStr = formatTime(new Date(zmanim.sunrise));
      sunsetStr  = formatTime(new Date(zmanim.sunset));
    } catch (e) {
      console.error('zmanim error', e);
    }

    if (!cd) {
      return {
        label:   'מותרת לביתה',
        details: 'אין הגבלות הלכתיות ליום זה.',
        variant: 'normal',
        icon:    '✅',
      };
    }

    // ── אסור ──
    if (cd.status === 'prohibited') {
      const activeOnot: string[] = cd.activeOnot ?? [];
      const vesetTypes: string[] = cd.vesetTypes ?? [];

      // תווית סוגי פרישה
      const typeLabels: string[] = [];
      if (vesetTypes.includes('actual_veset'))  typeLabels.push('ראיית וסת');
      if (vesetTypes.includes('yom_hachodesh')) typeLabels.push('יום החודש');
      if (vesetTypes.includes('yom_30'))        typeLabels.push('יום 30');
      if (vesetTypes.includes('haflagah'))      typeLabels.push('הפלגה');
      if (vesetTypes.includes('minimum_days'))  typeLabels.push('ימי נידה');
      const reasonsArr: string[] = cd.reasons ?? (cd.reason ? [cd.reason] : []);
      reasonsArr.forEach(r => {
        if (r.includes('31') && !typeLabels.includes('יום 31'))               typeLabels.push('יום 31');
        if (r.includes('מעת לעת') && !typeLabels.includes('מעת לעת'))         typeLabels.push('מעת לעת');
        if (r.includes('אור זרוע') && !typeLabels.includes('אור זרוע'))       typeLabels.push('אור זרוע');
      });
      const typesLabel = typeLabels.length > 0 ? typeLabels.join(' + ') : 'עונת פרישה';

      // עונה ושעות
      const bothOnot = activeOnot.includes('day') && activeOnot.includes('night');
      const dayOnly  = activeOnot.includes('day') && !activeOnot.includes('night');
      const nightOnly = activeOnot.includes('night') && !activeOnot.includes('day');
      const unknown  = activeOnot.length === 0;

      let onahLabel: string;
      let timeRange: string;

      if (bothOnot || unknown) {
        onahLabel = 'כל היום';
        timeRange = `מזריחה (${sunriseStr}) עד זריחה למחרת`;
      } else if (dayOnly) {
        onahLabel = 'עונת יום';
        timeRange = `מזריחה (${sunriseStr}) עד שקיעה (${sunsetStr})`;
      } else {
        // nightOnly
        onahLabel = 'עונת לילה';
        timeRange = `משקיעה (${sunsetStr}) עד זריחה למחרת (${sunriseStr})`;
      }

      return {
        label:     'יום פרישה',
        sublabel:  typesLabel,
        details:   'יש לפרוש בזמן המצוין להלן.',
        variant:   'prohibited',
        icon:      '🚫',
        onahLabel,
        timeRange,
      };
    }

    // ── הפסק טהרה ──
    if (cd.status === 'hefsek_day') {
      return {
        label:   'יום הפסק טהרה',
        details: `יש לבצע בדיקת הפסק לפני השקיעה (${sunsetStr}).`,
        variant: 'hefsek',
        icon:    '🌿',
      };
    }

    // ── יום נקי ──
    if (cd.status === 'clean_day') {
      const num = cd.cleanDayNumber ?? '?';
      return {
        label:    'יום נקי',
        sublabel: `יום ${num} מתוך 7`,
        details:  'יש לבצע בדיקות בוקר ואחר הצהריים כנדרש.',
        variant:  'clean',
        icon:     '🔵',
      };
    }

    // ── ליל טבילה ──
    if (cd.status === 'mikvah_night') {
      return {
        label:   'ליל טבילה',
        sublabel: 'יום נקי 7',
        details: `הטבילה תקפה החל מצאת הכוכבים — לאחר שקיעה (${sunsetStr}). טבילה כשרה ומבורכת! 💧`,
        variant: 'mikvah',
        icon:    '✨',
      };
    }

    // ── מותר ──
    return {
      label:   'מותרת לביתה',
      details: 'אין הגבלות הלכתיות ליום זה.',
      variant: 'normal',
      icon:    '✅',
    };
  }, [calculatedDates, loading, location]);

  // ─────────────────────────────────────────────
  // פעולות
  // ─────────────────────────────────────────────

  const handleAddVeset = async (data: any) => {
    if (!userId || !settings || !location) return;
    try {
      const [hours, minutes] = data.time.split(':').map(Number);
      const fullDate = new Date(data.date);
      fullDate.setHours(hours, minutes, 0, 0);
      const { determineOnah } = await import('@/lib/halacha/onot');
      const calculatedOnah = determineOnah(fullDate, location);
      await addVesetEvent(userId, data.date, data.time, calculatedOnah, data.notes);
      const userHistory = await getUserHistory(userId);
      setHistory(userHistory);
      calculateDates(userHistory, settings, location);
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding veset:', error);
      alert('שגיאה בהוספת וסת');
    }
  };

  const handleAddHefsekh = async (data: any) => {
    if (!userId || !location) return;
    try {
      const [hours, minutes] = data.time.split(':').map(Number);
      const fullDate = new Date(data.date);
      fullDate.setHours(hours, minutes, 0, 0);
      const { determineOnah } = await import('@/lib/halacha/onot');
      const calculatedOnah = determineOnah(fullDate, location);
      const { addHefsekhTahara } = await import('@/lib/supabase/vesatot');
      await addHefsekhTahara(userId, data.vesetEventId, data.date, data.time, calculatedOnah);
      const userHistory = await getUserHistory(userId);
      setHistory(userHistory);
      calculateDates(userHistory, settings!, location);
      setShowHefsekhModal(false);
    } catch (error) {
      console.error('Error adding hefsekh:', error);
      alert('שגיאה בהוספת הפסק טהרה');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">טוען...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden pb-24 md:pb-8">
      <SidebarMenu isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-3 md:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(true)}
              className="hover:bg-accent rounded-full h-10 w-10"
            >
              <Menu className="h-5 w-5 md:h-6 md:w-6" />
            </Button>
            <h1 className="text-lg md:text-2xl font-bold font-hebrew text-indigo-950 truncate max-w-[150px] xs:max-w-none">
              לוח הטהרה שלי
            </h1>
          </div>

          <div className="flex w-full justify-end gap-1 md:gap-2 items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={askPermission}
              className="relative h-9 w-9 rounded-full"
              title={`התראות${scheduled > 0 ? ` (${scheduled} מתוזמנות)` : ''}`}
            >
              <Bell className="h-5 w-5 text-gray-600" />
              {scheduled > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-indigo-600 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {scheduled}
                </span>
              )}
            </Button>

            <div className="hidden md:flex gap-2">
              <Button variant="default" onClick={() => setShowAddModal(true)}>
                <Plus className="h-5 w-5 ml-2" />
                הוסף וסת
              </Button>
              <Button variant="secondary" onClick={() => setShowHefsekhModal(true)}>
                <Plus className="h-5 w-5 ml-2" />
                הפסק טהרה
              </Button>
            </div>

            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => router.push('/settings')}>
              <Settings className="h-5 w-5 text-gray-600" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={handleSignOut}>
              <LogOut className="h-5 w-5 text-gray-600" />
            </Button>
          </div>
        </div>
      </header>

      {/* תוכן מרכזי */}
      <main className="container mx-auto px-4 py-4 md:py-8">

        {/* כרטיס סטטוס */}
        <TodayStatusCard info={todayStatusInfo} />

        {history.events.length === 0 && (
          <Card className="mb-4 md:mb-6 bg-yellow-50 border-yellow-200 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="font-semibold mb-1 text-sm md:text-base text-yellow-900">עדיין לא הוזנו וסתות</p>
              <p className="text-xs md:text-sm text-yellow-700 mb-3">
                כדי שהמערכת תוכל לחשב תאריכים, יש להזין לפחות וסת אחת
              </p>
              <Button size="sm" onClick={() => setShowAddModal(true)}>הוסף וסת ראשונה</Button>
            </CardContent>
          </Card>
        )}

        {/* גריד לוח השנה */}
        <div className="overflow-x-auto rounded-xl shadow-sm border bg-white p-2 md:p-4">
          <CalendarGrid
            currentDate={new Date()}
            calculatedDates={calculatedDates}
            onDateClick={(day) => console.log('Clicked:', day)}
          />
        </div>
      </main>

      {/* כפתורי FAB לנייד */}
      <div className="md:hidden fixed bottom-6 left-6 z-40 flex flex-col gap-3">
        <button
          onClick={() => setShowHefsekhModal(true)}
          className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium px-4 py-3 rounded-full shadow-lg border border-slate-300 transition-transform active:scale-95 text-sm"
        >
          <Plus className="h-4 w-4" />
          <span>הפסק טהרה</span>
        </button>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-3.5 rounded-full shadow-xl transition-transform active:scale-95 text-sm"
        >
          <Plus className="h-5 w-5" />
          <span>הוסף וסת</span>
        </button>
      </div>

      {/* מודאלים */}
      <AddVesetModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddVeset}
        location={location || undefined}
      />
      <AddHefsekhModal
        isOpen={showHefsekhModal}
        onClose={() => setShowHefsekhModal(false)}
        onSubmit={handleAddHefsekh}
        recentVesatot={history.events.slice(0, 5)}
      />
    </div>
  );
}
