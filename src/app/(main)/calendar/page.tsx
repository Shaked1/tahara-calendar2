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
import { Plus, Settings, LogOut, Menu, Bell, Info } from 'lucide-react';
import { supabase, getCurrentUser, signOut } from '@/lib/supabase/client';
import { getUserHistory, addVesetEvent } from '@/lib/supabase/vesatot';
import { TaharaCalculator } from '@/lib/halacha/calculator';
import { HalachicSettings, UserLocation, VesetHistory } from '@/types';
import { useNotifications } from '@/hooks/useNotifications';
import { getZmanimForDate, formatTime } from '@/lib/zmanim';

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
      if (!user) {
        router.push('/login');
        return;
      }

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
        method: (profile as any).halachic_method,
        orZarua: (profile as any).or_zarua,
        yom31: (profile as any).yom_31,
        maatLeat: (profile as any).maat_leat,
      };
      setSettings(userSettings);

      const userLocation: UserLocation = {
        latitude: parseFloat((profile as any).latitude),
        longitude: parseFloat((profile as any).longitude),
        timezone: (profile as any).timezone,
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

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // ─────────────────────────────────────────────────────────────
  // חישוב והפקת הסטטוס של היום הנוכחי (היום בלונג-פורמט)
  // ─────────────────────────────────────────────────────────────
// חילוץ מידע מפורט על הסטטוס של היום הנוכחי (עבור ה-Card בראש העמוד)
  const todayStatusInfo = useMemo(() => {
    if (loading) return { label: 'טוען נתונים...', details: '', variant: 'loading' };
    
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    const cd = calculatedDates?.get(todayKey);
    if (!cd) return { label: 'אין מידע הלכתי ליום זה', details: 'נא להזין וסתות כדי לחשב', variant: 'normal' };

    // הגדרת מיקום קבוע כברירת מחדל כדי למנוע קריסה ושגיאות Scope
    const locationToUse: UserLocation = {
      locationName: 'Rehovot',
      latitude: 31.8928,
      longitude: 34.8113,
      timezone: 'Asia/Jerusalem'
    };

    // שליפת הזמנים האמיתיים
    const dailyZmanim = getZmanimForDate(today, locationToUse);
    
    const sunriseStr = dailyZmanim?.sunrise ? formatTime(new Date(dailyZmanim.sunrise)) : '--:--';
    const sunsetStr = dailyZmanim?.sunset ? formatTime(new Date(dailyZmanim.sunset)) : '--:--';

    switch (cd.status) {
      case 'prohibited': {
        const vesetTypes = cd.vesetTypes?.map((t: string) => {
          if (t === 'haflaga') return 'תאריך הפלגה';
          if (t === 'yom_hachodesh') return 'יום החודש';
          if (t === 'onah_beinonit') return 'עונה בינונית';
          return t;
        }).join(' + ') || 'עונת פרישה';

        let timeRange = '';
        const activeOnot = cd.activeOnot || [];

        if (activeOnot.includes('night') && activeOnot.includes('day')) {
          timeRange = `מעת לעת (משקיעה ${sunsetStr} עד שקיעה למחרת)`;
        } else if (activeOnot.includes('night')) {
          timeRange = `עונת לילה (משקיעה ${sunsetStr} עד זריחה ${sunriseStr})`;
        } else if (activeOnot.includes('day')) {
          timeRange = `עונת יום (מזריחה ${sunriseStr} עד שקיעה ${sunsetStr})`;
        } else {
          timeRange = `מזריחה ${sunriseStr} עד שקיעה ${sunsetStr}`;
        }

        return {
          label: `יום פרישה (${vesetTypes})`,
          details: `זמן הפרישה: ${timeRange}`,
          variant: 'prohibited'
        };
      }
      
      case 'clean_day':
        return {
          label: `יום נקי (${cd.cleanDayNumber || 1} מתוך 7)`,
          details: 'יש לבצע בדיקות בעונה זו כנדרש.',
          variant: 'clean'
        };
        
      case 'mikvah_night':
        return {
          label: 'ליל טבילה',
          details: `הטבילה התקפה החל מצאת הכוכבים (שקיעה ב-${sunsetStr}).`,
          variant: 'mikvah'
        };
        
      case 'hefsekh_tahara':
        return {
          label: 'יום הפסק טהרה',
          details: `יש לבצע בדיקת הפסק לפני השקיעה (${sunsetStr}).`,
          variant: 'hefsekh'
        };
        
      default:
        return {
          label: 'מותרת לביתה',
          details: 'יום זה מותר על פי החישוב ההלכתי.',
          variant: 'normal'
        };
    }
  }, [calculatedDates, loading]); // <--- כאן הורדנו את userLocation מרשימת התלויות
  
  // פונקציית עזר לעיצוב כרטיס הסטטוס לפי סוגו
  const getCardStyles = (variant: string) => {
    switch (variant) {
      case 'prohibited': return 'bg-red-50 border-red-200 text-red-900 text-red-700';
      case 'hefsek': return 'bg-emerald-50 border-emerald-200 text-emerald-900 text-emerald-700';
      case 'clean': return 'bg-sky-50 border-sky-200 text-sky-900 text-sky-700';
      case 'mikvah': return 'bg-indigo-50 border-indigo-200 text-indigo-900 text-indigo-700';
      default: return 'bg-slate-50 border-slate-200 text-slate-900 text-slate-700';
    }
  };

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

      {/* Header מותאם רספונסיבית */}
      <header className="border-b bg-card sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-3 md:py-4 flex items-center justtodayStatusInfoify-between">
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

          <div className="flex gap-1 md:gap-2 items-center">
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
        
        {/* כרטיס סטטוס דינמי משודרג */}
        {todayStatusInfo && (
          <Card className={`mb-4 md:mb-6 shadow-sm border transition-all ${getCardStyles(todayStatusInfo.variant).split(' ').slice(0,2).join(' ')}`}>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-start gap-3">
                <span className="text-xl md:text-2xl mt-0.5">
                  {todayStatusInfo.variant === 'prohibited' ? '🚫' : 
                   todayStatusInfo.variant === 'hefsek' ? '✅' : 
                   todayStatusInfo.variant === 'clean' ? '🔵' : 
                   todayStatusInfo.variant === 'mikvah' ? '💧' : 'ℹ️'}
                </span>
                <div>
                  <h3 className={`font-bold text-sm md:text-base ${getCardStyles(todayStatusInfo.variant).split(' ')[2]}`}>
                    סטטוס נוכחי: {todayStatusInfo.label}
                  </h3>
                  <p className={`text-xs md:text-sm mt-0.5 ${getCardStyles(todayStatusInfo.variant).split(' ')[3]}`}>
                    {todayStatusInfo.details}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
            onDateClick={(day) => {
              console.log('Clicked:', day);
            }}
          />
        </div>
      </main>

      {/* כפתורי פעולה צפים (FAB) לנייד */}
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