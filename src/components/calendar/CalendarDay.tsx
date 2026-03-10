/**
 * קומפוננטת יום בודד בלוח השנה
 */

'use client';

import { CalendarDay as CalendarDayType } from '@/types';
import { getOnahIcon } from '@/lib/halacha/onot';
import { cn } from '@/lib/utils';

interface CalendarDayProps {
  day: CalendarDayType;
  onClick?: (day: CalendarDayType) => void;
}

export function CalendarDay({ day, onClick }: CalendarDayProps) {
  const { 
    gregorianDate, 
    hebrewDate, 
    calculatedDate, 
    isToday, 
    isCurrentMonth 
  } = day;

  // קביעת סגנון לפי סטטוס
  const getStatusClasses = () => {
    if (!calculatedDate) {
      return 'bg-white hover:bg-gray-50';
    }

    switch (calculatedDate.status) {
      case 'hefsek_day':
        return  'bg-green-50 border-green-200 text-green-900 hover:bg-green-100';
      case 'prohibited':
        return 'bg-red-50 border-red-200 text-red-900 hover:bg-red-100';
      case 'clean_day':
        return 'bg-blue-50 border-blue-200 text-blue-900 hover:bg-blue-100';
      case 'mikvah_night':
        return   'bg-blue-300 border-blue-700 text-white hover:bg-blue-700 ';
      
      case 'permitted':
      default:
        return 'bg-white hover:bg-gray-50';
    }
  };

  // אייקון העונה
  const onahIcon = calculatedDate ? getOnahIcon(calculatedDate.onah) : null;

  return (
    <button
      onClick={() => onClick?.(day)}
      className={cn(
        'relative p-2 rounded-lg border transition-all group',
        'relative p-2 rounded-lg border transition-all',
        'min-h-[80px] flex flex-col items-center justify-start',
        'focus:outline-none focus:ring-2 focus:ring-primary',
        getStatusClasses(),
        !isCurrentMonth && 'opacity-40',
        isToday && 'ring-2 ring-primary font-bold'
      )}
    >
      {/* תאריך גרגוריאני */}
      <div className="text-xs text-gray-600">
        {gregorianDate.getDate()}
      </div>

      {/* תאריך עברי */}
      <div className="text-lg font-hebrew mt-1">
        {hebrewDate}
      </div>

      {/* אייקון עונה */}
      {onahIcon && (
        <div className="text-sm mt-1">
          {onahIcon}
        </div>
      )}

      {/* מספר יום נקי (אם רלוונטי) */}
      {calculatedDate?.cleanDayNumber && (
        <div className="absolute top-1 left-1 bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
          {calculatedDate.cleanDayNumber}
        </div>
      )}
      {/* סימון מיוחד ליום ההפסק (כחול) */}
      {calculatedDate?.status === 'hefsek_day' && (
        <div className="absolute bottom-1 right-1 text-[10px] font-bold uppercase">
          הפסק
        </div>
      )}

      {/* סימון יום הטבילה */}
      {calculatedDate?.status === 'mikvah_night' && (
        <div className="absolute bottom-1 right-1 text-xl">
          💧
        </div>
      )}

      {/* סימון יום זה */}
      {isToday && (
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></div>
      )}

      {/* חפשי את המקום בתוך ה-return שבו את מציגה אייקונים או טקסט נוסף */}
      {/* סימון ימי פרישה משולבים */}
      {calculatedDate?.vesetTypes?.some(t => ['yom_30', 'yom_hachodesh', 'haflagah'].includes(t)) && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-[9px] md:text-[10px] font-bold text-red-700 bg-white/90 px-1.5 py-0.5 rounded-md leading-tight text-center border border-red-200 shadow-sm max-w-[90%]">
            פרישה<br/>
            {(() => {
              const types = [];
              if (calculatedDate.vesetTypes.includes('yom_30')) types.push('30');
              if (calculatedDate.vesetTypes.includes('yom_hachodesh')) types.push('חודש');
              if (calculatedDate.vesetTypes.includes('haflagah')) types.push('הפלגה');
              return types.join(' + ');
            })()}
          </span>
        </div>
      )}
      {/* חלונית הסבר שמופיעה במעבר עכבר על ימי פרישה */}
      {calculatedDate?.vesetTypes?.some(t => ['yom_30', 'yom_hachodesh', 'haflagah'].includes(t)) && (
        <div className="absolute hidden group-hover:block z-50 bg-black text-white text-sm p-3 rounded-md shadow-2xl -top-16 left-1/2 transform -translate-x-1/2 w-56 text-center leading-tight">
          יש לפרוש בתחילת העונה ובסוף העונה 
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-8 border-transparent border-t-black"></div>
        </div>
      )}
    </button>
  );
}

/**
 * מקרא לצבעים (Legend)
 */
export function CalendarLegend() {
  return (
    <div className="flex flex-wrap gap-4 justify-center p-4 bg-gray-50 rounded-lg">
      <LegendItem 
        color="bg-red-50 border-red-200" 
        label="אסור (וסת/נידה)" 
      />
      <LegendItem 
       color="bg-green-50 border-green-200"
        label="הפסק טהרה"
      />
      <LegendItem 
        color="bg-blue-50 border-blue-200" 
        label="יום נקי" 
      />
      <LegendItem 
        color="bg-blue-300 border-blue-700 text-white" 
        label="ליל מקווה" 
      />
      <LegendItem 
        color="bg-white" 
        label="מותר" 
      />
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn('w-4 h-4 rounded border', color)} />
      <span className="text-sm">{label}</span>
    </div>
  );
}
