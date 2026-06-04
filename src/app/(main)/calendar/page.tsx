/**
 * דף לוח השנה הראשי - כולל תפריט צד (Sidebar) ושדרוג תצוגת הסטטוס
 */

'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarGrid } from '@/components/calendar/CalendarGrid';
import { AddVesetModal } from '@/components/calendar/AddVesetModal';
import { AddHefsekhModal } from '@/components/calendar/AddHefsekhModal';
import { SidebarMenu } from '@/components/calendar/SidebarMenu'; // רכיב תפריט הצד החדש
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Plus, Settings, LogOut, Menu } from 'lucide-react'; // הוספת אייקון המבורגר
import { supabase, getCurrentUser, signOut } from '@/lib/supabase/client';
import { getUserHistory, addVesetEvent } from '@/lib/supabase/vesatot';
import { TaharaCalculator } from '@/lib/halacha/calculator';
import { HalachicSettings, UserLocation, VesetHistory } from '@/types';
import { useNotifications } from '@/hooks/useNotifications';

export default function CalendarPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showHefsekhModal, setShowHefsekhModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // סטייט לשליטה בתפריט הצד
  const [history, setHistory] = useState<VesetHistory>({ events: [], hefsekhTaharot: [] });
  const [calculatedDates, setCalculatedDates] = useState<Map<string, any>>(new Map());
  const [settings, setSettings] = useState<HalachicSettings | null>(null);
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // ── Hook להתראות ──
  const { askPermission, scheduled } = useNotifications({
    userId,
    history,
    settings,
    location,
  });

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
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 11);
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 4);
    const dateMap = calculator.calculateForRange(startDate, endDate, hist);
    setCalculatedDates(dateMap);
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
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {/* תפריט צד (Sidebar Drawer) */}
      <SidebarMenu isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          
          {/* כפתור המבורגר וכותרת האפליקציה */}
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsSidebarOpen(true)}
              className="hover:bg-accent rounded-full"
            >
              <Menu className="h-6 w-6" />
            </Button>
            <h1 className="text-2xl font-bold font-hebrew">לוח הטהרה שלי</h1>
          </div>

          <div className="flex gap-2 items-center flex-wrap justify-end">
            {/* כפתור הפעלת התראות */}
            <Button
              variant="outline"
              size="sm"
              onClick={askPermission}
              title={`התראות${scheduled > 0 ? ` (${scheduled} מתוזמנות)` : ''}`}
            >
              🔔{scheduled > 0 && <span className="mr-1 text-xs">{scheduled}</span>}
            </Button>

            <Button variant="default" onClick={() => setShowAddModal(true)}>
              <Plus className="h-5 w-5 ml-2" />
              הוסף וסת
            </Button>
            <Button variant="secondary" onClick={() => setShowHefsekhModal(true)}>
              <Plus className="h-5 w-5 ml-2" />
              הפסק טהרה
            </Button>
            <Button variant="ghost" size="icon" onClick={() => router.push('/settings')}>
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

        {history.events.length === 0 && (
          <Card className="mb-6 bg-yellow-50 border-yellow-200">
            <CardContent className="p-4 text-center">
              <p className="font-semibold mb-2">עדיין לא הוזנו וסתות</p>
              <p className="text-sm text-muted-foreground mb-4">
                כדי שהמערכת תוכל לחשב תאריכים, יש להזין לפחות וסת אחת
              </p>
              <Button onClick={() => setShowAddModal(true)}>הוסף וסת ראשונה</Button>
            </CardContent>
          </Card>
        )}

        <CalendarGrid
          currentDate={new Date()}
          calculatedDates={calculatedDates}
          onDateClick={(day) => {
            console.log('Clicked:', day);
          }}
        />
      </main>

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