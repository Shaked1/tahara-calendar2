/**
 * דף הגדרות
 */

'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { ArrowRight, Save, User, MapPin, Scale, LogOut } from 'lucide-react';
import { supabase, getCurrentUser, signOut } from '@/lib/supabase/client';
import { HalachicMethod } from '@/types';

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // הגדרות משתמש
  const [email, setEmail] = useState('');
  const [halachicMethod, setHalachicMethod] = useState<HalachicMethod>('ovadia_yosef');
  const [orZarua, setOrZarua] = useState(false);
  const [yom31, setYom31] = useState(false);
  const [maatLeat, setMaatLeat] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState('31.7683');
  const [longitude, setLongitude] = useState('35.2137');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/login');
        return;
      }

      setUserId(user.id);
      setEmail(user.email || '');

      // טעינת הגדרות
      const { data, error } = await (supabase
        .from('users_profile') as any)
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setHalachicMethod(data.halachic_method as HalachicMethod);
      setOrZarua(data.or_zarua);
      setYom31(data.yom_31);
      setMaatLeat(data.maat_leat);
      setLocationName(data.location_name || '');
      setLatitude(data.latitude.toString());
      setLongitude(data.longitude.toString());
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!userId) return;

    setSaving(true);
    try {
      const { error } = await (supabase
        .from('users_profile') as any)
        .update({
          halachic_method: halachicMethod,
          or_zarua: orZarua,
          yom_31: yom31,
          maat_leat: maatLeat,
          location_name: locationName || null,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
        })
        .eq('id', userId);

      if (error) throw error;

      alert('ההגדרות נשמרו בהצלחה! ✓');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('שגיאה בשמירת הגדרות');
    } finally {
      setSaving(false);
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
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/calendar')}
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold font-hebrew">הגדרות</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="space-y-6">
          {/* פרטי משתמש */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <CardTitle>פרטי משתמש</CardTitle>
              </div>
              <CardDescription>
                מידע אישי וחשבון
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  אימייל
                </label>
                <Input
                  type="email"
                  value={email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  לא ניתן לשנות את כתובת האימייל
                </p>
              </div>
            </CardContent>
          </Card>

          {/* הגדרות הלכתיות */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                <CardTitle>הגדרות הלכתיות</CardTitle>
              </div>
              <CardDescription>
                בחירת שיטה הלכתית ותוספות
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* שיטה הלכתית */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  שיטה הלכתית
                </label>
                <select
                  value={halachicMethod}
                  onChange={(e) => setHalachicMethod(e.target.value as HalachicMethod)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="ovadia_yosef">רב עובדיה יוסף</option>
                  <option value="ben_ish_chai">בן איש חי</option>
                  <option value="chazon_ish">חזון איש</option>
                  <option value="chabad">חב"ד</option>
                </select>
              </div>

              {/* תוספות */}
              <div className="space-y-3 pt-2">
                <p className="text-sm font-medium">תוספות הלכתיות:</p>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={orZarua}
                    onChange={(e) => setOrZarua(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span>אור זרוע (יום 31)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={yom31}
                    onChange={(e) => setYom31(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span>יום 31 נוסף</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={maatLeat}
                    onChange={(e) => setMaatLeat(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span>מעת לעת (24 שעות)</span>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* מיקום */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <CardTitle>מיקום</CardTitle>
              </div>
              <CardDescription>
                להתאמת זמני זריחה ושקיעה
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  שם מיקום
                </label>
                <Input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="ירושלים, תל אביב..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    קו רוחב (Latitude)
                  </label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    קו אורך (Longitude)
                  </label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-xs">
                <p className="font-semibold mb-1">💡 טיפ:</p>
                <p className="text-muted-foreground">
                  חפש ב-Google את המיקום שלך + "coordinates" כדי לקבל את הקואורדינטות המדויקות.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* כפתורי פעולה */}
          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1"
            >
              <Save className="h-4 w-4 ml-2" />
              {saving ? 'שומר...' : 'שמור שינויים'}
            </Button>

            <Button
              variant="outline"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 ml-2" />
              התנתק
            </Button>
          </div>

          {/* אזהרה הלכתית */}
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div className="text-sm">
                  <p className="font-semibold mb-1">חשוב לדעת:</p>
                  <p className="text-muted-foreground">
                    שינוי בהגדרות ההלכתיות משפיע על החישובים.
                    מומלץ להתייעץ עם רב פוסק לפני ביצוע שינויים.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
