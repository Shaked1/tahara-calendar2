/**
 * דף Onboarding - קליטה ראשונית
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { MethodSelector } from '@/components/onboarding/MethodSelector';
import { HistoryInput } from '@/components/onboarding/HistoryInput';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase/client';
import { HalachicSettings } from '@/types';
import { addVesetEvent } from '@/lib/supabase/vesatot';

type OnboardingStep = 'auth' | 'method' | 'history' | 'complete';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>('auth');
  const [loading, setLoading] = useState(false);

  // Auth
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  // Settings
  const [halachicSettings, setHalachicSettings] = useState<Partial<HalachicSettings>>({
    method: 'ovadia_yosef',
    orZarua: false,
    yom31: false,
    maatLeat: false,
  });

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // יצירת פרופיל
        const { error: profileError } = await supabase
          .from('users_profile')
          .insert({
            id: data.user.id,
            email: data.user.email!,
            halachic_method: 'ovadia_yosef',
            or_zarua: false,
            yom_31: false,
            maat_leat: false,
            latitude: 31.7683, // ירושלים ברירת מחדל
            longitude: 35.2137,
            timezone: 'Asia/Jerusalem',
            location_name: 'ירושלים',
            onboarding_completed: false,
          }as any);

        if (profileError) throw profileError;

        setUserId(data.user.id);
        setStep('method');
      }
    } catch (err: any) {
      alert(err.message || 'שגיאה בהרשמה');
    } finally {
      setLoading(false);
    }
  };

  const handleMethodComplete = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const { error } = await (supabase
        .from('users_profile') as any)
        .update({
          halachic_method: halachicSettings.method,
          or_zarua: halachicSettings.orZarua,
          yom_31: halachicSettings.yom31,
          maat_leat: halachicSettings.maatLeat,
        })
        .eq('id', userId);

      if (error) throw error;

      setStep('history');
    } catch (err: any) {
      alert(err.message || 'שגיאה בשמירת הגדרות');
    } finally {
      setLoading(false);
    }
  };

  const handleHistoryComplete = async (entries: any[]) => {
    if (!userId) return;

    setLoading(true);
    try {
      // שמירת כל הוסתות
      for (const entry of entries) {
        await addVesetEvent(
          userId,
          new Date(entry.date),
          entry.time,
          entry.onah
        );
      }

      // סימון onboarding כהושלם
      const { error } = await (supabase
        .from('users_profile') as any)
        .update({ onboarding_completed: true })
        .eq('id', userId);

      if (error) throw error;

      setStep('complete');
      
      // מעבר ללוח שנה אחרי 2 שניות
      setTimeout(() => {
        router.push('/calendar');
      }, 2000);
    } catch (err: any) {
      alert(err.message || 'שגיאה בשמירת נתונים');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2">
            {['הרשמה', 'בחירת שיטה', 'היסטוריה', 'סיום'].map((label, index) => {
              const stepIndex = ['auth', 'method', 'history', 'complete'].indexOf(step);
              const isActive = index <= stepIndex;
              
              return (
                <div key={label} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className={`mr-2 text-sm ${isActive ? 'font-medium' : 'text-muted-foreground'}`}>
                    {label}
                  </span>
                  {index < 3 && <div className="w-12 h-0.5 bg-gray-200 mx-2" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <Card>
          <CardContent className="p-8">
            {step === 'auth' && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold font-hebrew">ברוכה הבאה!</h2>
                  <p className="text-muted-foreground">
                    בואי ניצור לך חשבון ונתחיל לעקוב אחרי הטהרה שלך
                  </p>
                </div>

                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">אימייל</label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">סיסמה</label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="לפחות 6 תווים"
                      minLength={6}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'יוצר חשבון...' : 'המשך'}
                  </Button>
                </form>
              </div>
            )}

            {step === 'method' && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold font-hebrew">בחירת שיטה הלכתית</h2>
                  <p className="text-muted-foreground">
                    בחרי את השיטה ההלכתית לפיה את נוהגת
                  </p>
                </div>

                <MethodSelector
                  onSelect={setHalachicSettings}
                  initialSettings={halachicSettings}
                />

                <Button onClick={handleMethodComplete} className="w-full" disabled={loading}>
                  {loading ? 'שומר...' : 'המשך'}
                </Button>
              </div>
            )}

            {step === 'history' && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold font-hebrew">הזנת היסטוריה</h2>
                  <p className="text-muted-foreground">
                    הזיני את הוסתות האחרונות שלך לחישובים מדויקים
                  </p>
                </div>

                <HistoryInput onComplete={handleHistoryComplete} />
              </div>
            )}

            {step === 'complete' && (
              <div className="text-center space-y-6 py-12">
                <div className="text-6xl">✅</div>
                <h2 className="text-3xl font-bold font-hebrew">כל הכבוד!</h2>
                <p className="text-lg text-muted-foreground">
                  החשבון שלך מוכן. מעביר אותך ללוח השנה...
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
