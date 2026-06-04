/**
 * עמוד הכנה למקווה - רשימת בדיקות וניקוי טופס
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ArrowRight, Trash2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// רשימת ההכנות המלאה למקווה
const PREPARATION_STEPS = [
  { id: 'cut-nails', text: 'גזירת ציפורני הידיים והרגליים וניקוין היטב' },
  { id: 'remove-makeup', text: 'הסרת איפור, תכשירים קוסמטיים, תכשיטים ועגילים' },
  { id: 'remove-bath', text: 'רחיצה יסודית במים חמים וסבון בכל קפלי הגוף' },
  { id: 'wash-hair', text: 'חפיפת שיער הראש בשפו (ללא מרכך) וכל מקום שיש בו שיער במים חמים וסירוקם' },
  { id: 'clean-teeth', text: 'ניקוי שיניים ביסודיות עם מברשת ' },
  { id: 'remove-bandages', text: 'הסרת פלסטרים, תחבושות, דבק או שרידי גלד רך' },
  { id: 'bathroom', text: 'התפנות בשירותים לפני הטבילה' },
  { id: 'final-check', text: 'בדיקה עצמית בעיון מול המראה שאין שום חציצה על הגוף' },
];

export default function MikvehPrepPage() {
  const router = useRouter();
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);

  // טעינת הנתונים השמורים מתוך ה-localStorage בעת עמידת העמוד
  useEffect(() => {
    const saved = localStorage.getItem('mikveh_prep_checklist');
    if (saved) {
      try {
        setCheckedItems(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
    setMounted(true);
  }, []);

  // שמירת השינויים ב-localStorage בכל פעם שמסמנים/מורידים V
  const toggleItem = (id: string) => {
    const updated = { ...checkedItems, [id]: !checkedItems[id] };
    setCheckedItems(updated);
    localStorage.setItem('mikveh_prep_checklist', JSON.stringify(updated));
  };

  // פונקציית ניקוי הטופס לחלוטין
  const clearForm = () => {
    if (confirm('האם את בטוחה שברצונך לאפס ולנקות את כל רשימת ההכנות?')) {
      setCheckedItems({});
      localStorage.removeItem('mikveh_prep_checklist');
    }
  };

  // מניעת שגיאות הידרציה (Hydration) ב-Next.js
  if (!mounted) return null;

  const completedCount = PREPARATION_STEPS.filter(step => checkedItems[step.id]).length;
  const isAllCompleted = completedCount === PREPARATION_STEPS.length;

  return (
    <div className="min-h-screen bg-slate-50/50" dir="rtl">
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
          <h1 className="text-xl font-bold font-hebrew text-gray-800">הכנה לטבילה</h1>
          <div className="w-20" /> {/* איזון ויזואלי */}
        </div>
      </header>

      <main className="container mx-auto max-w-2xl py-8 px-4">
        {/* כרטיסיית התקדמות דינמית */}
        <Card className={cn(
          "mb-6 transition-all border",
          isAllCompleted ? "bg-emerald-50 border-emerald-200" : "bg-indigo-50/50 border-indigo-100"
        )}>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{isAllCompleted ? '✨' : '📝'}</span>
              <div>
                <p className="font-semibold text-sm text-gray-800">ההספק שלך</p>
                <p className="text-xs text-muted-foreground">
                  השלמת {completedCount} מתוך {PREPARATION_STEPS.length} הכנות נדרשות
                </p>
              </div>
            </div>
            {isAllCompleted && (
              <div className="flex items-center gap-1 text-emerald-700 font-medium text-sm">
                <CheckCircle2 className="h-4 w-4" />
                <span>מוכנה לטבילה!</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* רשימת הצ'קליסט המרכזית */}
        <Card className="bg-white shadow-sm border-gray-100">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-lg font-bold text-gray-800 font-hebrew">דף בדיקות והכנות למקווה</CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-gray-100">
            {PREPARATION_STEPS.map((step, index) => {
              const isChecked = !!checkedItems[step.id];
              return (
                <label
                  key={step.id}
                  className={cn(
                    "flex items-start gap-4 p-4 cursor-pointer transition-colors select-none",
                    isChecked ? "bg-slate-50/40" : "hover:bg-slate-50/70"
                  )}
                >
                  {/* מספר סודר */}
                  <span className="text-xs font-mono text-gray-400 mt-1">{index + 1}.</span>
                  
                  {/* תיבת סימון בעיצוב מותאם */}
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleItem(step.id)}
                    className="mt-1 h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer transition-transform active:scale-95"
                  />
                  
                  {/* טקסט המשימה */}
                  <span className={cn(
                    "text-sm font-hebrew text-gray-700 leading-relaxed flex-1",
                    isChecked && "line-through text-gray-400 font-normal"
                  )}>
                    {step.text}
                  </span>
                </label>
              );
            })}
          </CardContent>
        </Card>

        {/* כפתורי פעולה בתחתית העמוד */}
        <div className="mt-6 flex justify-end">
          <Button
            variant="outline"
            onClick={clearForm}
            className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300 gap-2 font-hebrew font-medium shadow-sm"
          >
            <Trash2 className="h-4 w-4" />
            ניקוי טופס ואיפוס
          </Button>
        </div>
      </main>
    </div>
  );
}