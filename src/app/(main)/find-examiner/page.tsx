'use client';

import { useRouter } from 'next/navigation'; // <-- ה-Import פה מעולה!
import { ArrowRight } from 'lucide-react';

export default function FindExaminerPage() {
  const router = useRouter(); // 🔑 הנה השורה החסרה! כאן אנחנו מאתחלים את הראוטר

  // קישור המפה שסיפקת מתוך Google My Maps
  const mapUrl = "https://www.google.com/maps/d/embed?mid=1ndXhWbZbQjuccEPfIkEi0nAcZNtXNys&usp=sharing";

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] bg-slate-50">
      {/* כותרת העמוד והסבר קצר */}
      <header className="border-b bg-white sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/calendar')}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">
            <ArrowRight className="h-5 w-5" />
            <span>חזרה ללוח השנה</span>
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-indigo-900 font-hebrew"> איתור בודקת טהרה מוסמכת</h1>
          <p className="text-sm text-gray-600 mt-1 font-hebrew">
          מפת פריסה ארצית של בודקות טהרה מוסמכות. ניתן לעשות זום וללחוץ על הסיכות לקבלת פרטי יצירת קשר ושעות זמינות.
          </p>
          <div className="w-20" /> {/* איזון ויזואלי */}
        </div>
      </header>

      {/* מיכל המפה - מותאם רספונסיבית לכל מכשיר נייד ומחשב */}
      <div className="flex-1 w-full bg-white shadow-inner relative border-t border-gray-200">
        <iframe
          src={mapUrl}
          className="absolute top-0 left-0 w-full h-full border-0"
          allowFullScreen={true}
          loading="lazy"
          title="מפת בודקות טהרה"
        ></iframe>
      </div>
    </div>
  );
}