/**
 * דף לוח השנה הראשי
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarGrid } from '@/components/calendar/CalendarGrid';
import { AddVesetModal } from '@/components/calendar/AddVesetModal';
import { AddHefsekhModal } from '@/components/calendar/AddHefsekhModal';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Plus, Settings, LogOut } from 'lucide-react';
import { supabase, getCurrentUser, signOut } from '@/lib/supabase/client';
import { getUserHistory, addVesetEvent } from '@/lib/supabase/vesatot';
import { TaharaCalculator } from '@/lib/halacha/calculator';
import { HalachicSettings, UserLocation, VesetHistory } from '@/types';

export default function CalendarPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showHefsekhModal, setShowHefsekhModal] = useState(false);
  const [history, setHistory] = useState<VesetHistory>({ events: [], hefsekhTaharot: [] });
  const [calculatedDates, setCalculatedDates] = useState<Map<string, any>>(new Map());
  const [settings, setSettings] = useState<HalachicSettings | null>(null);
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // טעינת נתונים ראשונית
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async (isRefresh = false) => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/login');
        return;
      }

      setUserId(user.id);

      // טעינת פרופיל
      const { data: profile, error: profileError } = await supabase
        .from('users_profile')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      if (!profile.onboarding_completed) {
        router.push('/onboarding');
        return;
      }

      // הגדרת הגדרות
      const userSettings: HalachicSettings = {
        method: profile.halachic_method,
        orZarua: profile.or_zarua,
        yom31: profile.yom_31,
        maatLeat: profile.maat_leat,
      };
      setSettings(userSettings);

      const userLocation: UserLocation = {
        latitude: parseFloat(profile.latitude),
        longitude: parseFloat(profile.longitude),
        timezone: profile.timezone,
        locationName: profile.location_name,
      };
      setLocation(userLocation);

      // טעינת היסטוריה
      const userHistory = await getUserHistory(user.id);
      setHistory(userHistory);

      // חישוב תאריכים
      if (userHistory.events.length > 0) {
        calculateDates(userHistory, userSettings, userLocation);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      alert('שגיאה בטעינת נתונים');
    } finally {
      if (!isRefresh) {
        setLoading(false);
      }
    }
  };

  const calculateDates = (
    hist: VesetHistory,
    sett: HalachicSettings,
    loc: UserLocation
  ) => {
    const calculator = new TaharaCalculator(sett, loc);
    
    // חישוב לטווח של 3 חודשים
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 11); // מהלוח יראה 11 חודשיפ אחורה
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 4); // הלוח יראה 4 חודשים קדימה את החישובים 

    const dateMap = calculator.calculateForRange(startDate, endDate, hist);
    setCalculatedDates(dateMap);
  };

  const handleAddVeset = async (data: any) => {
    if (!userId || !settings || !location) return;

    try {
      // חישוב העונה אוטומטית לפי השעה
      const [hours, minutes] = data.time.split(':').map(Number);
      const fullDate = new Date(data.date);
      fullDate.setHours(hours, minutes, 0, 0);
      
      // קביעת העונה לפי זמני זריחה ושקיעה
      const { determineOnah } = await import('@/lib/halacha/onot');
      const calculatedOnah = determineOnah(fullDate, location);

      //  שמירה ב-Supabase
      await addVesetEvent(
        userId,
        data.date,
        data.time,
        calculatedOnah,
        data.notes
      );

      // 2. רענון נתונים מקומי
      const userHistory = await getUserHistory(userId);
      setHistory(userHistory);
      calculateDates(userHistory, settings, location);

      // 3. יצירת התראות פרישה קבועות (30 וחודש)
      const { createVesetReminders, saveScheduledNotifications } = await import('@/lib/notifications');
      const calculator = new TaharaCalculator(settings, location);
      const result = calculator.calculateAll(userHistory);

      // מסננים רק את יום ה-30 ויום החודש מתוך התאריכים האסורים המחושבים
      const fixedVesetDays = result.prohibitedDates.filter(day => 
        day.vesetTypes?.some(t => ['yom_30', 'yom_hachodesh'].includes(t))
      );
      
      const reminders = createVesetReminders(userId, fixedVesetDays);
      await saveScheduledNotifications(reminders);

      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding veset:', error);
      alert('שגיאה בהוספת וסת');
    }
  };

  const handleAddHefsekh = async (data: any) => {
    if (!userId || !location) return;

    try {
      // חישוב העונה אוטומטית לפי השעה
      const [hours, minutes] = data.time.split(':').map(Number);
      const fullDate = new Date(data.date);
      fullDate.setHours(hours, minutes, 0, 0);
      
      const { determineOnah } = await import('@/lib/halacha/onot');
      const calculatedOnah = determineOnah(fullDate, location);

      const { addHefsekhTahara } = await import('@/lib/supabase/vesatot');
      await addHefsekhTahara(
        userId,
        data.vesetEventId,
        data.date,
        data.time,
        calculatedOnah
      );

// 1. רענון נתונים
      const userHistory = await getUserHistory(userId);
      setHistory(userHistory);
      calculateDates(userHistory, settings, location);

      // 2. חישוב כל התאריכים לאחר ההפסק
      const calculator = new TaharaCalculator(settings, location);
      const result = calculator.calculateAll(userHistory);

      // 3. הגדרת התראות מורחבות
      if (result) {
        const { 
          createCleanDaysNotifications, 
          createMikvahNotification,
          createVesetReminders,
          saveScheduledNotifications 
        } = await import('@/lib/notifications');

        const notifications = [
          ...createCleanDaysNotifications(userId, result.cleanDays),
          ...(result.mikvahNight ? [createMikvahNotification(userId, result.mikvahNight)] : []),
          // הוספת יום ההפלגה - עכשיו הוא מחושב נכון לפי חב"ד!
          ...createVesetReminders(userId, result.prohibitedDates.filter(d => d.vesetTypes?.includes('haflagah') && d.date > new Date())) // Only future haflagah
        ];

        await saveScheduledNotifications(notifications);
        alert(`✅ הוגדרו תזכורות לימים הנקיים, לטבילה וליום ההפלגה!`);
      }
      
      setShowHefsekhModal(false);
    } catch (error) {
      console.error('Error adding hefsekh:', error);
      alert('שגיאה בהוספת הפסק טהרה');
    }
  };

  const calculateDatesAfterHefsekh = async (hefsekhDate: Date) => {
    if (!settings || !location) return null;
    
    const calculator = new TaharaCalculator(settings, location);
    return calculator.calculateAll(history);
  };

  const setupCleanDaysNotifications = async (
    cleanDays: any[],
    mikvahNight: any
  ) => {
    try {
      const { 
        createCleanDaysNotifications, 
        createMikvahNotification,
        subscribeToPushNotifications 
      } = await import('@/lib/notifications');

      // בקשת הרשאה להתראות
      const hasPermission = await subscribeToPushNotifications(userId!);
      
      if (hasPermission) {
        const notifications = createCleanDaysNotifications(userId!, cleanDays);
        
        if (mikvahNight) {
          notifications.push(createMikvahNotification(userId!, mikvahNight));
        }

        // TODO: שמירת ההתראות ב-DB או תזמון דרך Service Worker
        console.log('✅ הגדרנו', notifications.length, 'תזכורות');
        alert(`✅ הוגדרו ${notifications.length} תזכורות לימים הנקיים וליל הטבילה!`);
      } else {
        alert('⚠️ לא הצלחנו להפעיל התראות. אנא אפשר התראות בהגדרות הדפדפן.');
      }
    } catch (error) {
      console.error('Error setting up notifications:', error);
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold font-hebrew">לוח הטהרה שלי</h1>
          
          <div className="flex gap-2">
            <Button
              variant="default"
              onClick={() => setShowAddModal(true)}
            >
              <Plus className="h-5 w-5 ml-2" />
              הוסף וסת
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowHefsekhModal(true)}
            >
              <Plus className="h-5 w-5 ml-2" />
              הפסק טהרה
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => router.push('/settings')}
            >
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto py-8">
        {/* סטטוס נוכחי */}
        {history.events.length > 0 && (
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">ℹ️</span>
                <div>
                  <p className="font-semibold">סטטוס נוכחי</p>
                  <p className="text-sm text-muted-foreground">
                    הווסת האחרונה: {history.events[0]?.date.toLocaleDateString('he-IL')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* אזהרה אם אין נתונים */}
        {history.events.length === 0 && (
          <Card className="mb-6 bg-yellow-50 border-yellow-200">
            <CardContent className="p-4 text-center">
              <p className="font-semibold mb-2">עדיין לא הוזנו וסתות</p>
              <p className="text-sm text-muted-foreground mb-4">
                כדי שהמערכת תוכל לחשב תאריכים, יש להזין לפחות וסת אחת
              </p>
              <Button onClick={() => setShowAddModal(true)}>
                הוסף וסת ראשונה
              </Button>
            </CardContent>
          </Card>
        )}

        {/* לוח השנה */}
        <CalendarGrid
          currentDate={new Date()}
          calculatedDates={calculatedDates}
          onDateClick={(day) => {
            console.log('Clicked:', day);
            // כאן אפשר להוסיף מודאל עם פרטים על היום
          }}
        />
      </main>

      {/* Modal להוספת וסת */}
      <AddVesetModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddVeset}
      />

      {/* Modal להוספת הפסק טהרה */}
      <AddHefsekhModal
        isOpen={showHefsekhModal}
        onClose={() => setShowHefsekhModal(false)}
        onSubmit={handleAddHefsekh}
        recentVesatot={history.events.slice(0, 5)} // 5 וסתות אחרונות
      />
    </div>
  );
}
