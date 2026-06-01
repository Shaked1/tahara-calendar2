/**
 * דף הרשמה
 */

'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase/client';

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // ולידציה
    if (password !== confirmPassword) {
      setError('הסיסמאות אינן תואמות');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים');
      setLoading(false);
      return;
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        // יצירת פרופיל בסיסי
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

        // מעבר ל-onboarding
        router.push('/onboarding');
      }
    } catch (err: any) {
      setError(err.message || 'שגיאה בהרשמה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-hebrew">הרשמה</CardTitle>
          <CardDescription>
            צרי חשבון חדש כדי להתחיל להשתמש במערכת
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSignUp}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">
                אימייל <span className="text-red-500">*</span>
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                סיסמה <span className="text-red-500">*</span>
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="לפחות 6 תווים"
                required
                minLength={6}
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                אימות סיסמה <span className="text-red-500">*</span>
              </label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="הזן סיסמה שוב"
                required
                minLength={6}
                disabled={loading}
              />
            </div>

            {/* הצהרה */}
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-xs">
              <p className="font-semibold mb-1">⚠️ חשוב לדעת:</p>
              <p className="text-muted-foreground">
                מערכת זו היא כלי עזר בלבד ואינה מחליפה התייעצות עם רב פוסק.
                כל שאלה הלכתית חייבת להיות מופנית לרב מוסמך.
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'נרשם...' : 'הרשמה'}
            </Button>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">כבר יש לך חשבון? </span>
              <Link href="/login" className="text-primary hover:underline font-medium">
                התחבר כאן
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
