/**
 * קומפוננטת KavuaStatus
 * מציגה למשתמשת:
 *  • האם יש לה וסת קבועה ומאיזה סוג
 *  • תאריכי הפרישה הקרובים (3 חודשים)
 *  • כמה "פספוסים" כבר נצברו לביטול
 *  • הסבר הלכתי קצר
 */

'use client';

import { useMemo } from 'react';
import { VesetEvent, HefsekhTahara, HalachicSettings, UserLocation } from '@/types';
import { analyzeKavuot, KavuaType, VesetKavua } from '@/lib/halacha/vesatotKavuot';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────
// עזרים
// ─────────────────────────────────────────────

const TYPE_LABEL: Record<KavuaType, string> = {
  yom_hachodesh: 'יום החודש',
  yom_30:        'יום השלושים',
  haflagah:      'הפלגה',
};

const TYPE_ICON: Record<KavuaType, string> = {
  yom_hachodesh: '📅',
  yom_30:        '🔢',
  haflagah:      '↔️',
};

const TYPE_COLOR: Record<KavuaType, { card: string; badge: string; bar: string }> = {
  yom_hachodesh: {
    card:  'border-purple-200 bg-purple-50',
    badge: 'bg-purple-100 text-purple-800 border-purple-200',
    bar:   'bg-purple-400',
  },
  yom_30: {
    card:  'border-blue-200 bg-blue-50',
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    bar:   'bg-blue-400',
  },
  haflagah: {
    card:  'border-teal-200 bg-teal-50',
    badge: 'bg-teal-100 text-teal-800 border-teal-200',
    bar:   'bg-teal-400',
  },
};

function formatDate(d: Date): string {
  return new Date(d).toLocaleDateString('he-IL', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function OnahIcon({ onah }: { onah: 'day' | 'night' }) {
  return <span>{onah === 'day' ? '☀️' : '🌙'}</span>;
}

// ── פס ביטול ──
function CancellationBar({ missed }: { missed: number }) {
  const steps = [0, 1, 2];
  return (
    <div>
      <p className="text-xs text-gray-500 mb-1.5 font-medium">
        התקדמות לביטול הוסת הקבועה:
      </p>
      <div className="flex gap-2 items-center">
        {steps.map(s => (
          <div
            key={s}
            className={cn(
              'flex-1 h-2 rounded-full border transition-colors',
              s < missed
                ? 'bg-red-400 border-red-500'
                : 'bg-gray-100 border-gray-200'
            )}
          />
        ))}
        <span className="text-xs text-gray-500 whitespace-nowrap">
          {missed}/3 פספוסים
        </span>
      </div>
      {missed > 0 && (
        <p className="text-[11px] text-red-600 mt-1">
          {missed === 1 && 'פעם אחת לא הגיע הוסת — עוד 2 פספוסים לביטול'}
          {missed === 2 && 'פעמיים לא הגיע הוסת — עוד פספוס אחד לביטול'}
          {missed >= 3 && 'הוסת הקבועה בוטלה!'}
        </p>
      )}
    </div>
  );
}

// ── כרטיס קבועה ──
function KavuaCard({ kavua }: { kavua: VesetKavua }) {
  const colors = TYPE_COLOR[kavua.type];
  const label  = TYPE_LABEL[kavua.type];
  const icon   = TYPE_ICON[kavua.type];

  return (
    <Card className={cn('border', colors.card)}>
      <CardContent className="p-4 space-y-4">

        {/* כותרת */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{icon}</span>
            <div>
              <div className="font-bold text-gray-800 font-hebrew">{label}</div>
              <div className="text-xs text-gray-500">{kavua.detail}</div>
            </div>
          </div>
          <span className={cn('text-xs px-2 py-0.5 rounded-full border font-semibold whitespace-nowrap', colors.badge)}>
            ✅ קבועה
          </span>
        </div>

        {/* תאריכי פרישה קדימה */}
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-2">
            📌 ימי פרישה — 3 חודשים קדימה:
          </p>
          <div className="space-y-1.5">
            {kavua.nextDates.map((nd, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-200"
              >
                <div className="flex items-center gap-1.5 text-sm text-gray-700 font-hebrew">
                  <span className="text-gray-400 text-xs">חודש {i + 1}</span>
                  <span className="font-semibold">{formatDate(nd.date)}</span>
                </div>
                <OnahIcon onah={nd.onah} />
              </div>
            ))}
          </div>
        </div>

        {/* פס ביטול */}
        {kavua.missedCount > 0 && (
          <CancellationBar missed={kavua.missedCount} />
        )}

        {/* הסבר הלכתי */}
        <div className="text-[11px] text-gray-500 bg-white/70 rounded-lg p-2 border border-gray-100 leading-relaxed font-hebrew">
          {kavua.type === 'yom_hachodesh' && (
            <>
              <strong>וסת קבועה ביום החודש:</strong> כיוון שהוסת הגיע 3 פעמים ברצף באותו יום
              עברי ובאותה עונה, אינך צריכה לפרוש ביום ל' וביום ההפלגה — רק ביום החודש.
            </>
          )}
          {kavua.type === 'yom_30' && (
            <>
              <strong>וסת קבועה יום ל':</strong> כיוון שהוסת הגיע 3 פעמים ברצף בדיוק כל 30 יום
              ובאותה עונה, אינך צריכה לפרוש ביום החודש וביום ההפלגה — רק ביום ה-30.
            </>
          )}
          {kavua.type === 'haflagah' && (
            <>
              <strong>וסת קבועה הפלגה:</strong> כיוון שהמרווח בין הוסתות היה זהה 3 פעמים ברצף
              ובאותה עונה, אינך צריכה לפרוש ביום החודש וביום ל' — רק ביום ההפלגה.
            </>
          )}
        </div>

      </CardContent>
    </Card>
  );
}

// ── כשאין קבועה ──
function NoKavuaCard({ eventsCount }: { eventsCount: number }) {
  const remaining = Math.max(0, 3 - eventsCount);
  return (
    <Card className="border-gray-200 bg-gray-50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">📊</span>
          <div className="space-y-1">
            <p className="font-semibold text-gray-700 text-sm font-hebrew">
              אין וסת קבועה כרגע
            </p>
            {remaining > 0 ? (
              <p className="text-xs text-gray-500">
                נדרשות עוד <strong>{remaining}</strong> וסתות ברצף על מנת לקבוע וסת קבועה.
                כרגע פרישה ביום החודש, יום ל' וביום ההפלגה.
              </p>
            ) : (
              <p className="text-xs text-gray-500">
                הוסתות האחרונות אינן מראות דפוס קבוע. פרישה ביום החודש, יום ל' וביום ההפלגה.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────
// קומפוננטה ראשית
// ─────────────────────────────────────────────

interface KavuaStatusProps {
  vesetHistory: VesetEvent[];
  hefsekhHistory: HefsekhTahara[];
  settings: HalachicSettings;
  location: UserLocation;
}

export function KavuaStatus({
  vesetHistory,
  hefsekhHistory,
  settings,
  location,
}: KavuaStatusProps) {
  const analysis = useMemo(
    () => analyzeKavuot(vesetHistory, hefsekhHistory, settings, location),
    [vesetHistory, hefsekhHistory, settings, location]
  );

  return (
    <div className="space-y-3">
      <CardHeader className="px-0 pt-0 pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <span>🔍</span>
          <span className="font-hebrew">ניתוח וסת קבועה</span>
        </CardTitle>
      </CardHeader>

      {/* הודעה בולטת */}
      {analysis.message && (
        <div className="px-3 py-2 rounded-lg bg-green-50 border border-green-200 text-sm text-green-800 font-hebrew">
          {analysis.message}
        </div>
      )}

      {/* כרטיס קבועה / אין קבועה */}
      {analysis.activeKavua ? (
        <KavuaCard kavua={analysis.activeKavua} />
      ) : (
        <NoKavuaCard eventsCount={vesetHistory.length} />
      )}

      {/* רשימת סוגי פרישה פעילים */}
      <div className="text-[11px] text-gray-400 text-center font-hebrew">
        {analysis.activeKavua
          ? `פרישה בלבד: ${TYPE_LABEL[analysis.activeKavua.type]}`
          : 'פרישה: יום החודש + יום ל׳ + הפלגה'}
      </div>
    </div>
  );
}
