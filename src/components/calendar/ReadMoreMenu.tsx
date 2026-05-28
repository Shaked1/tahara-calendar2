/**
 * קומפוננטת ReadMoreMenu - תפריט קריאה נוספת
 * קישורים למקורות הלכתיים
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { BookOpen, ExternalLink, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RabbiSource {
  name: string;
  subtitle: string;
  url: string;
  icon: string;
  color: string;
  textColor: string;
  borderColor: string;
}

const RABBI_SOURCES: RabbiSource[] = [
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

interface ReadMoreMenuProps {
  className?: string;
}

export function ReadMoreMenu({ className }: ReadMoreMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // סגירת התפריט בלחיצה מחוץ לו
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={menuRef} className={cn('relative', className)}>
      {/* כפתור פתיחת תפריט */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200',
          'font-medium text-sm font-hebrew',
          isOpen
            ? 'bg-indigo-600 text-white border-indigo-700 shadow-md'
            : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-400 hover:shadow-sm'
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <BookOpen className="h-4 w-4" />
        <span>קרא עוד</span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* תפריט נפתח */}
      {isOpen && (
        <div
          className={cn(
            'absolute top-full mt-2 right-0 z-50',
            'w-72 rounded-xl border border-gray-200 bg-white shadow-xl',
            'animate-in fade-in slide-in-from-top-2 duration-150',
            'overflow-hidden'
          )}
          role="menu"
        >
          {/* כותרת התפריט */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-l from-indigo-50 to-white border-b border-gray-100">
            <div>
              <h3 className="font-bold text-sm text-gray-800 font-hebrew">מקורות הלכתיים</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">לחצי על הספר לקריאה מקוונת</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 rounded-md p-1 hover:bg-gray-100 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* רשימת ספרים */}
          <div className="p-2 space-y-1.5">
            {RABBI_SOURCES.map((source) => (
              <a
                key={source.name}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border transition-all duration-150',
                  'group cursor-pointer',
                  source.color,
                  source.borderColor
                )}
                role="menuitem"
                onClick={() => setIsOpen(false)}
              >
                {/* אייקון */}
                <div className="text-2xl flex-shrink-0 leading-none">
                  {source.icon}
                </div>

                {/* פרטים */}
                <div className="flex-1 min-w-0 text-right">
                  <div className={cn('font-bold text-sm font-hebrew leading-tight', source.textColor)}>
                    {source.name}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5 truncate font-hebrew">
                    {source.subtitle}
                  </div>
                </div>

                {/* חץ קישור */}
                <ExternalLink
                  className={cn(
                    'h-3.5 w-3.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity',
                    source.textColor
                  )}
                />
              </a>
            ))}
          </div>

          {/* הערה בתחתית */}
          <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50">
            <p className="text-[10px] text-gray-400 text-center font-hebrew leading-tight">
              הקישורים פותחים מקורות חיצוניים בלשונית חדשה
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
