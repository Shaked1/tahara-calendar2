/**
 * דף Onboarding - קליטה ראשונית
 */

'use client';
// 💡 שימי לב: מחקנו מפה את ה-export const dynamic שגרם לבעיות ב-Build הקודם! 
// הפיכת ה-Layout הכללי ל-force-dynamic תטפל בזה בצורה הרבה יותר נקייה.

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
          } as any);

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

  const handleHistoryComplete = async (entries: any[] = []) => {
    if (!userId) return;

    setLoading(true);
    try {
      // שמירת הוסתות רק אם המשתמשת אכן הכניסה נתונים
      if (entries && entries.length > 0) {
        for (const entry of entries) {
          await addVesetEvent(
            userId,
            new Date(entry.date),
            entry.time,
            entry.onah
          );
        }
      }

      // סימון onboarding כהושלם (קורה בכל מקרה, גם ללא וסתות)
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
    /* במחשב: py-8 (הרווח המקורי מהגג). במובייל: min-h-[100dvh] ורווח קטן py-4 שלא יקטע */
    <div className="min-h-[100dvh] md:min-h-screen bg-gradient-to-b from-background to-secondary/20 py-4 md:py-8 px-4 flex flex-col justify-start md:justify-center font-sans antialiased">
      {/* במחשב: max-w-3xl המקורי שלך. במובייל: מתכווץ אוטומטית ל-max-w-xl כדי להתאים למסך */}
      <div className="w-full max-w-xl md:max-w-3xl mx-auto flex flex-col gap-4 md:gap-8">
        
        {/* Progress Bar: במחשב הוא מרווח כמו קודם, במובייל הוא מתנקה מסביב כדי לחסוך מקום */}
        <div className="w-full p-3 md:p-0 md:bg-transparent md:border-none md:shadow-none bg-background/60 backdrop-blur-sm rounded-xl border border-border/40 shadow-sm mb-0 md:mb-8">
          <div className="flex items-center justify-center gap-2">
            {['הרשמה', 'בחירת שיטה', 'היסטוריה', 'סיום'].map((label, index) => {
              const stepIndex = ['auth', 'method', 'history', 'complete'].indexOf(step);
              const isActive = index <= stepIndex;
              const isCurrent = index === stepIndex;
              
              return (
                <div key={label} className="flex items-center flex-1 md:flex-initial justify-center">
                  <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-center">
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {index + 1}
                    </div>
                    {/* במובייל מציג רק את השלב הנוכחי כדי שלא יישבר, במחשב (md) מציג תמיד את הכל כמו בעיצוב הישן */}
                    <span className={`text-[11px] sm:text-xs md:text-sm mr-2 ${
                      isActive ? 'font-medium' : 'text-muted-foreground'
                    } ${isCurrent ? 'block' : 'hidden md:inline-block'}`}>
                      {label}
                    </span>
                  </div>
                  {index < 3 && <div className={`w-8 sm:w-12 h-0.5 mx-1 sm:mx-2 ${index < stepIndex ? 'bg-primary' : 'bg-gray-200'}`} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content Card */}
        <Card className="md:border md:shadow-sm border-border/50">
          {/* פדינג: במחשב p-8 בדיוק כמו בעיצוב הישן. במובייל (מסכים קטנים מ-md) הוא יורד ל-p-5 כדי למנוע את קטיעת המסך */}
          <CardContent className="p-5 md:p-8">
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

                {/* במובייל מגביל גובה עם גלילה פנימית כדי שהכפתור לא ייחתך, במחשב נפתח רגיל */}
                <div className="max-h-[50vh] md:max-h-none overflow-y-auto md:overflow-visible px-1">
                  <MethodSelector
                    onSelect={setHalachicSettings}
                    initialSettings={halachicSettings}
                  />
                </div>

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
                    הזיני את הוסתות האחרונות שלך לחישובים מדויקים (אופציונלי)
                  </p>
                </div>

                {/* במובייל מגביל גובה עם גלילה פנימית כדי שהכפתור לא ייחתך, במחשב נפתח רגיל */}
                <div className="max-h-[50vh] md:max-h-none overflow-y-auto md:overflow-visible px-1">
                  <HistoryInput onComplete={handleHistoryComplete} />
                </div>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => handleHistoryComplete([])}
                    disabled={loading}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors underline underline-offset-4"
                  >
                    אין לי וסתות קודמות להזין (התחילי דף חלק)
                  </button>
                </div>
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