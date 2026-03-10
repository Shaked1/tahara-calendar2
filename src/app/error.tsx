/**
 * דף Error גלובלי
 */

'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // לוג השגיאה (בפרודקשן - שלח לשרת)
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/20 p-4">
      <div className="text-center space-y-8 max-w-md">
        {/* אייקון */}
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-6">
            <AlertTriangle className="h-16 w-16 text-destructive" />
          </div>
        </div>

        {/* כותרת */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold font-hebrew">
            אופס! משהו השתבש
          </h1>
          <p className="text-muted-foreground">
            התרחשה שגיאה בלתי צפויה במערכת
          </p>
        </div>

        {/* פרטי שגיאה (רק בדבאג) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="p-4 bg-muted rounded-lg text-right text-xs overflow-auto max-h-32">
            <code className="text-destructive">{error.message}</code>
          </div>
        )}

        {/* פעולות */}
        <div className="flex flex-col gap-3">
          <Button onClick={reset} size="lg" className="w-full">
            <RefreshCw className="h-5 w-5 ml-2" />
            נסה שוב
          </Button>
          <Link href="/">
            <Button variant="outline" size="lg" className="w-full">
              <Home className="h-5 w-5 ml-2" />
              חזרה לדף הבית
            </Button>
          </Link>
        </div>

        {/* טיפ */}
        <div className="text-sm text-muted-foreground border-t pt-6">
          <p className="mb-2">אם השגיאה נמשכת:</p>
          <ul className="list-disc list-inside space-y-1 text-right">
            <li>רענן את הדף</li>
            <li>נקה את ה-cache של הדפדפן</li>
            <li>נסה להתחבר שוב</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
