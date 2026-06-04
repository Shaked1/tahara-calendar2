/**
 * עמוד איתור מקוואות - מפה אינטראקטיבית וחיפוש כתובות
 */

'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

// טעינה דינמית של רכיב המפה ללא רינדור צד שרת כדי למנוע קריסות (SSR Window error)
const MikvehMap = dynamic(() => import('@/components/calendar/MikvehMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[calc(100vh-200px)] w-full flex items-center justify-center">
      <div className="text-center space-y-2">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="text-sm text-gray-500 font-hebrew">טוען את המפה...</p>
      </div>
    </div>
  ),
});

export default function FindMikvehPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col" dir="rtl">
      {/* סרגל עליון */}
      <header className="border-b bg-white sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/calendar')}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors"
          >
            <ArrowRight className="h-5 w-5" />
            <span>חזרה ללוח השנה</span>
          </button>
          <h1 className="text-xl font-bold font-hebrew text-gray-800">מציאת מקווה קרוב</h1>
          <div className="w-20" /> {/* איזון ויזואלי */}
        </div>
      </header>

      {/* מפה */}
      <main className="flex-1 py-6 container mx-auto max-w-5xl">
        <MikvehMap />
      </main>
    </div>
  );
}