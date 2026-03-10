/**
 * דף 404 - דף לא נמצא
 */

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/20 p-4">
      <div className="text-center space-y-8 max-w-md">
        {/* 404 */}
        <div>
          <h1 className="text-9xl font-bold text-primary/20 font-hebrew">404</h1>
          <div className="text-4xl font-bold mt-4 font-hebrew">
            העמוד לא נמצא
          </div>
        </div>

        {/* הסבר */}
        <div className="space-y-2">
          <p className="text-lg text-muted-foreground">
            מצטערים, הדף שחיפשת לא קיים במערכת
          </p>
          <p className="text-sm text-muted-foreground">
            ייתכן שהקישור שגוי או שהדף הועבר למיקום אחר
          </p>
        </div>

        {/* פעולות */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button size="lg" className="w-full sm:w-auto">
              <Home className="h-5 w-5 ml-2" />
              חזרה לדף הבית
            </Button>
          </Link>
          <Link href="/calendar">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              <Search className="h-5 w-5 ml-2" />
              ללוח השנה
            </Button>
          </Link>
        </div>

        {/* קישורים מועילים */}
        <div className="pt-8 border-t">
          <p className="text-sm text-muted-foreground mb-3">
            אולי תרצי לבקר ב:
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link href="/login">
              <Button variant="ghost" size="sm">התחברות</Button>
            </Link>
            <Link href="/about">
              <Button variant="ghost" size="sm">אודות</Button>
            </Link>
            <Link href="/onboarding">
              <Button variant="ghost" size="sm">הרשמה</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
