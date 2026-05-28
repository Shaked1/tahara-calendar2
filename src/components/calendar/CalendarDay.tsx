/**
 * קומפוננטת יום בודד בלוח השנה
 * כל יום מחולק לעונת יום ☀️ ועונת לילה 🌙
 * כל עונה מקבלת צבע עצמאי לפי הסטטוס שלה
 */

'use client';

import { useState } from 'react';
import { CalendarDay as CalendarDayType, CalculatedDate } from '@/types';
import { cn } from '@/lib/utils';

interface CalendarDayProps {
  day: CalendarDayType;
  onClick?: (day: CalendarDayType) => void;
}

// ─────────────────────────────────────────────
// לוגיקת עונות: קובעת אם כל עונה פעילה ומה צבעה
// ─────────────────────────────────────────────

/**
 * מחשבת מה הסטטוס של עונת היום וליל עבור יום נתון.
 *
 * חוקים:
 *  - prohibited  →  כל העונות שב-activeOnot אדומות; שאר העונות רגילות
 *  - hefsek_day  →  onah=day ירוקה, שאר רגיל
 *  - clean_day   →  שתי העונות כחולות (הימים הנקיים חלים על יום ולילה)
 *  - mikvah_night→  רק עונת לילה כחולה כהה; עונת יום כחולה בהירה
 *  - permitted   →  שתי עונות ריקות
 */
function resolveOnahStatuses(cd: CalculatedDate | undefined): {
  dayStatus: string;
  nightStatus: string;
  dayCleanNumber: number | undefined;
  nightCleanNumber: number | undefined;
} {
  const empty = {
    dayStatus: 'permitted',
    nightStatus: 'permitted',
    dayCleanNumber: undefined,
    nightCleanNumber: undefined,
  };

  if (!cd) return empty;

  const status = cd.status;
  const activeOnot: string[] = cd.activeOnot ?? [];

  switch (status) {
    case 'prohibited': {
      // אם activeOnot ריק – נחשב שניהם אסורים
      const hasDay   = activeOnot.length === 0 || activeOnot.includes('day');
      const hasNight = activeOnot.length === 0 || activeOnot.includes('night');
      return {
        dayStatus:   hasDay   ? 'prohibited' : 'permitted',
        nightStatus: hasNight ? 'prohibited' : 'permitted',
        dayCleanNumber: undefined,
        nightCleanNumber: undefined,
      };
    }

    case 'hefsek_day':
      return {
        dayStatus:   'hefsek_day',
        nightStatus: 'permitted',
        dayCleanNumber: undefined,
        nightCleanNumber: undefined,
      };

    case 'clean_day':
      return {
        dayStatus:   'clean_day',
        nightStatus: 'clean_day',
        dayCleanNumber:   cd.cleanDayNumber,
        nightCleanNumber: cd.cleanDayNumber,
      };

    case 'mikvah_night':
      return {
        dayStatus:   'clean_day',   // היום ה-7 – ביום עוד יום נקי
        nightStatus: 'mikvah_night',
        dayCleanNumber:   7,
        nightCleanNumber: undefined,
      };

    default:
      return empty;
  }
}

// ─────────────────────────────────────────────
// CSS לפי סטטוס + עונה
// ─────────────────────────────────────────────

function onahBg(status: string, onah: 'day' | 'night'): string {
  switch (status) {
    case 'prohibited':
      return onah === 'day' ? 'bg-red-100' : 'bg-red-200';
    case 'hefsek_day':
      return 'bg-emerald-100';
    case 'clean_day':
      return onah === 'day' ? 'bg-sky-100' : 'bg-sky-50';
    case 'mikvah_night':
      return 'bg-blue-500';
    default:
      return onah === 'day' ? 'bg-white' : 'bg-gray-50';
  }
}

function onahText(status: string, onah: 'day' | 'night'): string {
  switch (status) {
    case 'prohibited':   return 'text-red-700';
    case 'hefsek_day':   return 'text-emerald-700';
    case 'clean_day':    return 'text-sky-700';
    case 'mikvah_night': return 'text-white';
    default:             return 'text-gray-400';
  }
}

// ─────────────────────────────────────────────
// תווית תחתית לימי פרישה
// ─────────────────────────────────────────────

function buildVesetLabel(cd: CalculatedDate | undefined): string {
  if (!cd) return '';
  const types  = cd.vesetTypes ?? [];
  const reasons = cd.reasons ?? (cd.reason ? [cd.reason] : []);

  const parts: string[] = [];
  if (types.includes('actual_veset'))   parts.push('וסת');
  if (types.includes('yom_hachodesh'))  parts.push('יום חודש');
  if (types.includes('yom_30'))         parts.push('יום 30');
  if (types.includes('haflagah'))       parts.push('הפלגה');
  if (reasons.some(r => r.includes('31')))         parts.push('יום 31');
  if (reasons.some(r => r.includes('מעת לעת')))   parts.push('מ"ל');
  if (reasons.some(r => r.includes('אור זרוע')))  parts.push('אור זרוע');
  return parts.join(' + ');
}

// ─────────────────────────────────────────────
// בניית תוכן טולטיפ
// ─────────────────────────────────────────────

function buildTooltipLines(cd: CalculatedDate | undefined): string[] {
  if (!cd) return [];

  const lines: string[] = [];

  // כותרת סטטוס
  const statusLabel: Record<string, string> = {
    prohibited:   '🚫 יום אסור',
    hefsek_day:   '✅ הפסק טהרה',
    clean_day:    `🔵 יום נקי ${cd.cleanDayNumber ? cd.cleanDayNumber + ' מתוך 7' : ''}`,
    mikvah_night: '💧 ליל טבילה',
    permitted:    '✔️ מותר',
  };
  if (statusLabel[cd.status]) lines.push(statusLabel[cd.status]);

  // סיבות (reasons קודם, אחר כך reason כ-fallback)
  const reasons = cd.reasons && cd.reasons.length > 0
    ? cd.reasons
    : cd.reason ? [cd.reason] : [];

  reasons.forEach(r => {
    if (r && !lines.includes(r)) lines.push(r);
  });

  // עונות פעילות
  if (cd.activeOnot && cd.activeOnot.length > 0) {
    const onahHe = cd.activeOnot.map(o => o === 'day' ? 'יום' : 'לילה').join(' + ');
    lines.push(`עונה: ${onahHe}`);
  }

  return lines;
}

// ─────────────────────────────────────────────
// קומפוננטה ראשית
// ─────────────────────────────────────────────

export function CalendarDay({ day, onClick }: CalendarDayProps) {
  const [tooltipOpen, setTooltipOpen] = useState(false);

  const { gregorianDate, hebrewDate, calculatedDate: cd, isToday, isCurrentMonth } = day;

  const { dayStatus, nightStatus, dayCleanNumber, nightCleanNumber } =
    resolveOnahStatuses(cd);

  const vesetLabel  = buildVesetLabel(cd);
  const tooltipLines = buildTooltipLines(cd);
  const hasTooltip  = tooltipLines.length > 0;

  // תאריך עברי – רק היום (ללא שם חודש)
  const hebrewDay = hebrewDate?.split(' ')[0] ?? '';

  return (
    <div className="relative">
      <button
        onClick={() => {
          onClick?.(day);
          if (hasTooltip) setTooltipOpen(v => !v);
        }}
        onMouseEnter={() => hasTooltip && setTooltipOpen(true)}
        onMouseLeave={() => setTooltipOpen(false)}
        className={cn(
          'w-full relative rounded-xl border overflow-hidden flex flex-col',
          'min-h-[88px] transition-all duration-150',
          'focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1',
          !isCurrentMonth && 'opacity-30',
          isToday
            ? 'ring-2 ring-blue-500 ring-offset-1 border-blue-300'
            : 'border-gray-200',
          hasTooltip
            ? 'hover:shadow-lg hover:-translate-y-0.5 cursor-pointer'
            : 'hover:shadow-sm'
        )}
        aria-label={`${gregorianDate.getDate()}/${gregorianDate.getMonth() + 1} - ${hebrewDate}`}
      >
        {/* ── שורת תאריכים ── */}
        <div className="flex items-center justify-between px-2 pt-1 pb-0.5 bg-white border-b border-gray-100 shrink-0 z-10">
          <span className="text-[10px] text-gray-400 tabular-nums">
            {gregorianDate.getDate()}/{gregorianDate.getMonth() + 1}
          </span>
          <span className="text-[13px] font-bold text-gray-700 font-hebrew leading-tight">
            {hebrewDay} {hebrewDate && hebrewDate.includes(' ') ? hebrewDate.split(' ')[1] : ''}
          </span>
        </div>

        {/* ── פיצול יום / לילה ── */}
        <div className="flex flex-1 min-h-0">

          {/* ── עונת יום ☀️ (חצי שמאלי) ── */}
          <div
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 py-1',
              'border-l border-gray-100 transition-colors duration-200',
              onahBg(dayStatus, 'day')
            )}
          >
            <span className="text-[15px] leading-none select-none">☀️</span>

            {/* מספר יום נקי */}
            {dayStatus === 'clean_day' && dayCleanNumber && (
              <span className={cn('text-[11px] font-extrabold leading-none', onahText('clean_day', 'day'))}>
                {dayCleanNumber}
              </span>
            )}

            {/* הפסק */}
            {dayStatus === 'hefsek_day' && (
              <span className="text-[8px] font-bold text-emerald-700 leading-none">הפסק</span>
            )}

            {/* וסת ביום */}
            {dayStatus === 'prohibited' && (
              <span className="text-[8px] font-bold text-red-600 leading-none">אסור</span>
            )}
          </div>

          {/* ── עונת לילה 🌙 (חצי ימני) ── */}
          <div
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 py-1',
              'transition-colors duration-200',
              onahBg(nightStatus, 'night')
            )}
          >
            <span className="text-[15px] leading-none select-none">🌙</span>

            {/* ליל מקווה */}
            {nightStatus === 'mikvah_night' && (
              <span className="text-[14px] leading-none select-none">💧</span>
            )}

            {/* מספר יום נקי בלילה */}
            {nightStatus === 'clean_day' && nightCleanNumber && (
              <span className={cn('text-[11px] font-extrabold leading-none', onahText('clean_day', 'night'))}>
                {nightCleanNumber}
              </span>
            )}

            {/* וסת בלילה */}
            {nightStatus === 'prohibited' && (
              <span className="text-[8px] font-bold text-red-700 leading-none">אסור</span>
            )}
          </div>
        </div>

        {/* ── תווית פרישה (בתחתית) ── */}
        {vesetLabel && (
          <div className="shrink-0 px-1 pb-1 flex justify-center">
            <span
              className={cn(
                'text-[7.5px] font-bold px-1 py-0.5 rounded border leading-tight',
                'max-w-full truncate block text-center shadow-sm',
                cd?.vesetTypes?.includes('actual_veset')
                  ? 'bg-red-600 text-white border-red-700'
                  : 'bg-white text-red-700 border-red-300'
              )}
            >
              {vesetLabel}
            </span>
          </div>
        )}

        {/* ── נקודת "היום" ── */}
        {isToday && (
          <span className="absolute top-1 left-1.5 w-1.5 h-1.5 rounded-full bg-blue-500" />
        )}
      </button>

      {/* ── Tooltip (מעל הכפתור, לא חותך) ── */}
      {hasTooltip && tooltipOpen && (
        <div
          className={cn(
            'absolute z-[100] bottom-full mb-2 left-1/2 -translate-x-1/2',
            'w-52 rounded-xl bg-slate-900 border border-slate-700',
            'text-white text-[11px] shadow-2xl pointer-events-none',
            'animate-in fade-in duration-100'
          )}
          role="tooltip"
        >
          {/* כותרת */}
          <div className="px-3 py-2 border-b border-slate-700 font-bold text-center text-[12px]">
            {gregorianDate.getDate()}/{gregorianDate.getMonth() + 1} — {hebrewDate}
          </div>

          {/* שורות */}
          <ul className="px-3 py-2 space-y-1 text-right">
            {tooltipLines.map((line, i) => (
              <li key={i} className="leading-tight">{line}</li>
            ))}
          </ul>

          {/* חץ למטה */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// מקרא
// ─────────────────────────────────────────────

export function CalendarLegend() {
  const items = [
    { icon: '☀️', bg: 'bg-red-100',    border: 'border-red-300',    label: 'אסור ביום'        },
    { icon: '🌙', bg: 'bg-red-200',    border: 'border-red-400',    label: 'אסור בלילה'       },
    { icon: '☀️', bg: 'bg-emerald-100',border: 'border-emerald-300',label: 'הפסק טהרה'        },
    { icon: '☀️', bg: 'bg-sky-100',    border: 'border-sky-300',    label: 'יום נקי – יום'    },
    { icon: '🌙', bg: 'bg-sky-50',     border: 'border-sky-200',    label: 'יום נקי – לילה'   },
    { icon: '🌙', bg: 'bg-blue-500',   border: 'border-blue-700',   label: 'ליל מקווה'         },
    { icon: '',   bg: 'bg-white',      border: 'border-gray-200',   label: 'מותר'              },
  ];

  return (
    <div className="flex flex-wrap gap-2 justify-center p-3 bg-gray-50 rounded-xl border border-gray-200">
      {items.map(({ icon, bg, border, label }) => (
        <div key={label} className="flex items-center gap-1.5 text-xs text-gray-600">
          <div className={cn('w-5 h-5 rounded border flex items-center justify-center text-[11px]', bg, border)}>
            {icon}
          </div>
          <span className="font-hebrew">{label}</span>
        </div>
      ))}
    </div>
  );
}
