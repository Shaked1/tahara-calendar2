'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // <-- יבוא הראוטר המובנה של Next.js
import { X, BookOpen, CheckSquare, MapPin, ExternalLink, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// המקורות ההלכתיים שלקחנו מ-ReadMoreMenu שלך
const RABBI_SOURCES = [
  {
    name: 'הרב עובדיה יוסף זצ"ל',
    subtitle: 'שו"ת יביע אומר - הלכות נידה',
    url: 'https://www.toratemetfreeware.com/online/f_01826.html',
    icon: '📖',
    color: 'bg-amber-50 hover:bg-amber-100',
    textColor: 'text-amber-900',
    borderColor: 'border-amber-200 hover:border-amber-400',
  },
  {
    name: 'הרב מרדכי אליהו זצ"ל',
    subtitle: 'דרכי טהרה - ספר הלכה מקיף',
    url: 'https://harav.org/sefer/%D7%93%D7%A8%D7%9B%D7%99-%D7%98%D7%94%D7%A8%D7%94/',
    icon: '📚',
    color: 'bg-blue-50 hover:bg-blue-100',
    textColor: 'text-blue-900',
    borderColor: 'border-blue-200 hover:border-blue-400',
  },
  {
    name: 'חב"ד',
    subtitle: 'שמירת הטהרה - מנהגי חב"ד',
    url: 'https://chabadshop.com/products/%D7%A9%D7%9E%D7%99%D7%A8%D7%AA-%D7%94%D7%98%D7%94%D7%A8%D7%94?srsltid=AfmBOoqSmOeZPLQmpouQ9apHOSTuBxTQmCjyC-SCghbzYDYRd2WK7kA6',
    icon: '🕍',
    color: 'bg-purple-50 hover:bg-purple-100',
    textColor: 'text-purple-900',
    borderColor: 'border-purple-200 hover:border-purple-400',
  },
];

interface SidebarMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SidebarMenu({ isOpen, onClose }: SidebarMenuProps) {
  const router = useRouter(); // <-- הגדרת הראוטר בתוך הקומפוננטה
  const [isReadMoreOpen, setIsReadMoreOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      {/* מסך רקע כהה מטושטש */}
      <div
        className={cn(
          "fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* תפריט הצד */}
      <aside
        dir="rtl"
        className={cn(
          "fixed top-0 right-0 h-full w-80 bg-card border-l shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col bg-white",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* כותרת התפריט */}
        <div className="p-4 border-b flex items-center justify-between bg-slate-50">
          <h2 className="text-lg font-bold font-hebrew text-gray-800">אפשרויות ותוכן</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* תוכן הניווט */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          
          {/* אפשרות 1: אקורדיון קרא עוד (מקורות הלכתיים) */}
          <div className="border rounded-xl overflow-hidden bg-white">
            <button
              onClick={() => setIsReadMoreOpen(!isReadMoreOpen)}
              className="w-full flex items-center justify-between p-3.5 text-right font-medium text-sm text-gray-700 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-indigo-600" />
                <span>קרא עוד / מקורות הלכתיים</span>
              </div>
              <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform", isReadMoreOpen && "rotate-180")} />
            </button>
            
            {isReadMoreOpen && (
              <div className="p-2 bg-slate-50/50 border-t space-y-1.5">
                {RABBI_SOURCES.map((source) => (
                  <a
                    key={source.name}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'flex items-center gap-3 p-2.5 rounded-lg border transition-all duration-150 bg-white shadow-sm',
                      source.borderColor
                    )}
                  >
                    <div className="text-xl">{source.icon}</div>
                    <div className="flex-1 min-w-0 text-right">
                      <div className={cn('font-bold text-xs font-hebrew', source.textColor)}>{source.name}</div>
                      <div className="text-[10px] text-gray-500 truncate">{source.subtitle}</div>
                    </div>
                    <ExternalLink className={cn('h-3.5 w-3.5 opacity-60', source.textColor)} />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* אפשרות 2: מעבר לעמוד הכנות למקווה */}
          <button
            onClick={() => {
              router.push('/mikveh-prep'); // עכשיו הראוטר מוגדר ולא יקרוס
              onClose();
            }}
            className="w-full flex items-center justify-between p-3.5 border rounded-xl bg-white text-right font-medium text-sm text-gray-700 hover:bg-slate-50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <CheckSquare className="h-5 w-5 text-emerald-600" />
              <span>הכנה למקווה (רשימת בדיקות)</span>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-400 -rotate-90 group-hover:text-emerald-600 transition-transform" />
          </button>

          {/* אפשרות 3: מציאת מקווה קרוב */}
          <a
            href="https://mymikve.org.il/" // קישור לדף חיפוש מקוואות בישראל
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between p-3.5 border rounded-xl bg-white text-right font-medium text-sm text-gray-700 hover:bg-slate-50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-rose-600" />
              <span>מציאת מקווה קרוב</span>
            </div>
            <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-rose-600 transition-colors" />
          </a>

        </div>

        {/* תחתית התפריט */}
        <div className="p-4 border-t bg-slate-50 text-center text-xs text-gray-400">
          לוח הטהרה שלי © {new Date().getFullYear()}
        </div>
      </aside>
    </>
  );
}