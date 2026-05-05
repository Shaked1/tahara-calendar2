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

  // 1. לוגיקת האייקונים המשופרת - שיניתי לשימוש בפונקציה ישר ב-JSX או השמה למשתנה
  const renderOnotIcons = () => {
    if (!calculatedDate) return null;

    // שימוש במערך העונות הפעילות במקום חיפוש טקסטואלי בסיבות
    const onot = calculatedDate.activeOnot || [calculatedDate.onah];
    const hasDay = onot.includes('day');
    const hasNight = onot.includes('night');
    
    if (hasDay && hasNight) {
      return <span>☀️+🌙</span>;
    }
    
    return <span>{getOnahIcon(onot[0])}</span>;
  };

  const getStatusClasses = () => {
    // הגנה: אם אין מידע מחושב, זה יום רגיל
    if (!calculatedDate) return 'bg-white hover:bg-gray-50';

    // צביעה באדום אם זה יום פרישה (וסת) או יום איסור
    const isVeset = calculatedDate.vesetTypes && calculatedDate.vesetTypes.length > 0;
    const isProhibited = calculatedDate.status === 'prohibited';

    if (isVeset || isProhibited) {
      return 'bg-red-50 border-red-300 text-red-900 hover:bg-red-100 shadow-sm';
    }

    // שימוש ב-Switch בטוח
    switch (calculatedDate.status) {
      case 'hefsek_day':
        return 'bg-green-50 border-green-200 text-green-900 hover:bg-green-100';
      case 'clean_day':
        return 'bg-blue-50 border-blue-200 text-blue-900 hover:bg-blue-100';
      case 'mikvah_night':
        return 'bg-blue-500 border-blue-700 text-white hover:bg-blue-700';
      default:
        return 'bg-white hover:bg-gray-50';
    }
  };

  return (
    <button
      onClick={() => onClick?.(day)}
      className={cn(
        'relative p-2 rounded-lg border transition-all group',
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

      {/* אייקון עונה (קריאה לפונקציה שכתבת למעלה) */}
      <div className="text-sm mt-1 font-medium">
        {renderOnotIcons()}
      </div>

      {/* מספר יום נקי */}
      {calculatedDate?.cleanDayNumber && (
        <div className="absolute top-1 left-1 bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
          {calculatedDate.cleanDayNumber}
        </div>
      )}

      {/* סימון הפסק/טבילה */}
      {calculatedDate?.status === 'hefsek_day' && (
        <div className="absolute bottom-1 right-1 text-[10px] font-bold uppercase">הפסק</div>
      )}
      {calculatedDate?.status === 'mikvah_night' && (
        <div className="absolute bottom-1 right-1 text-xl">💧</div>
      )}

      {/* סימון ימי פרישה משולבים */}
      {calculatedDate?.vesetTypes && calculatedDate.vesetTypes.length > 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-[9px] md:text-[10px] font-bold text-red-700 bg-white/90 px-1.5 py-0.5 rounded-md leading-tight text-center border border-red-200 shadow-sm max-w-[95%]">
            {calculatedDate.vesetTypes.includes('actual_veset') ? "ראיית וסת" : 
            (calculatedDate.reasons?.some(r => r.includes('אור זרוע')) ? "אור זרוע" : "פרישה")}
            <br/>
            {(() => {
              const labels = [];
              if (calculatedDate.vesetTypes.includes('yom_30')) labels.push('30');
              if (calculatedDate.vesetTypes.includes('yom_hachodesh')) labels.push('חודש');
              if (calculatedDate.vesetTypes.includes('haflagah')) labels.push('הפלגה');
              if (calculatedDate.reasons?.some(r => r.includes('31'))) labels.push('31');
              if (calculatedDate.reasons?.some(r => r.includes('מעת לעת'))) labels.push('מ"ל');
              return labels.join(' + ');
            })()}
          </span>
        </div>
      )}

      {/* Tooltip פירוט */}
      {calculatedDate?.vesetTypes && calculatedDate.vesetTypes.length > 0 && (
        <div className="absolute hidden group-hover:block z-50 bg-slate-900 text-white text-[11px] p-2 rounded-lg shadow-2xl -top-16 left-1/2 transform -translate-x-1/2 w-52 text-center leading-tight border border-slate-700">
          <div className="font-bold mb-1 border-b border-slate-700 pb-1 text-[10px]">פירוט פרישה:</div>
          <div className="flex flex-col gap-1">
            {calculatedDate.reasons?.map((reason, index) => (
              <div key={index} className="flex items-center justify-center gap-1">
                <span>•</span>
                <span>{reason}</span>
              </div>
            ))}
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
        </div>
      )}

      {/* סימון "היום" */}
      {isToday && (
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></div>
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
