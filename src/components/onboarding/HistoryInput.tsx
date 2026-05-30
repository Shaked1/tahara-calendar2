/**
 * קומפוננטת HistoryInput - הזנת היסטוריית 6 חודשים
 * העונה (יום/לילה) מחושבת אוטומטית לפי השעה והמיקום
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Plus, Trash2, Sun, Moon, Clock } from 'lucide-react';
import { OnahType } from '@/types';

// ──────────────────────────────────────────────
// חישוב עונה לפי שעה ומיקום (ללא import חיצוני)
// ──────────────────────────────────────────────

/**
 * חישוב זריחה ושקיעה מקורב לפי קואורדינטות ותאריך.
 * משתמש באלגוריתם NOAA פשוט — מדויק בטווח ±10 דקות.
 */
function calcSunTimes(date: Date, lat: number, lng: number): { sunrise: Date; sunset: Date } {
  const rad = Math.PI / 180;
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000
  );

  const B     = (360 / 365) * (dayOfYear - 81) * rad;
  const eot   = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B); // דקות
  const solarNoonLocal = 12 - lng / 15 - eot / 60; // שעות UTC

  const decl   = 23.45 * Math.sin(B) * rad;
  const latRad = lat * rad;
  const cosH   = -Math.tan(latRad) * Math.tan(decl);

  // אם קוסינוס מחוץ לטווח → שמש לא שוקעת / לא זורחת (קוטב)
  const H = Math.abs(cosH) > 1 ? 6 : Math.acos(cosH) / rad;

  const sunriseUtc = solarNoonLocal - H / 15;
  const sunsetUtc  = solarNoonLocal + H / 15;

  const toLocal = (utcHours: number) => {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    d.setTime(d.getTime() + utcHours * 3600 * 1000);
    return d;
  };

  return { sunrise: toLocal(sunriseUtc), sunset: toLocal(sunsetUtc) };
}

/**
 * קובע עונה לפי תאריך, שעה ומיקום.
 * ברירת מחדל: ירושלים (31.77°N, 35.21°E)
 */
function computeOnah(
  dateStr: string,
  timeStr: string,
  lat = 31.7683,
  lng = 35.2137
): OnahType {
  if (!dateStr || !timeStr) return 'day';

  const [h, m]   = timeStr.split(':').map(Number);
  const eventDate = new Date(dateStr);
  eventDate.setHours(h, m, 0, 0);

  const { sunrise, sunset } = calcSunTimes(eventDate, lat, lng);

  return eventDate >= sunrise && eventDate < sunset ? 'day' : 'night';
}

// ──────────────────────────────────────────────
// טיפוסים
// ──────────────────────────────────────────────

interface VesetEntry {
  id: string;
  date: string;
  time: string;
  onah: OnahType; // מחושב אוטומטית
}

interface HistoryInputProps {
  onComplete: (entries: VesetEntry[]) => void;
  /** קואורדינטות המשתמשת אם כבר ידועות (אופציונלי) */
  lat?: number;
  lng?: number;
}

// ──────────────────────────────────────────────
// עזרים לתצוגה
// ──────────────────────────────────────────────

function OnahBadge({ onah }: { onah: OnahType }) {
  return onah === 'day' ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold border border-amber-200">
      <Sun className="w-3 h-3" />
      עונת יום
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-semibold border border-indigo-200">
      <Moon className="w-3 h-3" />
      עונת לילה
    </span>
  );
}

// ──────────────────────────────────────────────
// קומפוננטה ראשית
// ──────────────────────────────────────────────

export function HistoryInput({ onComplete, lat, lng }: HistoryInputProps) {
  const [entries, setEntries] = useState<VesetEntry[]>([]);

  // ── הוספת וסת חדשה ──
  const addEntry = () => {
    const today = new Date().toISOString().split('T')[0];
    const defaultTime = '08:00';
    setEntries(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        date: today,
        time: defaultTime,
        onah: computeOnah(today, defaultTime, lat, lng),
      },
    ]);
  };

  // ── עדכון שדה + חישוב אוטומטי של עונה ──
  const updateEntry = (id: string, updates: Partial<Pick<VesetEntry, 'date' | 'time'>>) => {
    setEntries(prev =>
      prev.map(e => {
        if (e.id !== id) return e;
        const next = { ...e, ...updates };
        // מחשבים מחדש את העונה בכל שינוי של תאריך או שעה
        next.onah = computeOnah(next.date, next.time, lat, lng);
        return next;
      })
    );
  };

  const removeEntry = (id: string) => setEntries(prev => prev.filter(e => e.id !== id));

  const handleSubmit = () => {
    const valid = entries.filter(e => e.date && e.time);
    if (valid.length === 0) {
      alert('נא להזין לפחות וסת אחת עם תאריך ושעה');
      return;
    }
    onComplete(valid);
  };

  const hasValidEntries = entries.some(e => e.date && e.time);

  return (
    <div className="space-y-6">
      {/* כותרת */}
      <div>
        <h3 className="text-lg font-semibold mb-1">הזנת היסטוריית וסתות</h3>
        <p className="text-sm text-muted-foreground">
          הזיני תאריך ושעה — העונה (יום/לילה) תחושב <strong>אוטומטית</strong> לפי זמני
          הזריחה והשקיעה במיקומך.
        </p>
      </div>

      {/* הסבר קצר */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-3">
          <div className="flex gap-2 items-start text-sm">
            <Clock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-amber-900">
              <span className="font-semibold">כיצד מחושבת העונה?</span>
              <br />
              מזריחה עד שקיעה = <OnahBadge onah="day" />, משקיעה עד זריחה = <OnahBadge onah="night" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* רשימת וסתות */}
      <div className="space-y-3">
        {entries.map((entry, index) => (
          <Card key={entry.id} className="border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 space-y-3">

                  {/* כותרת + תג עונה */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-primary">
                      וסת #{index + 1}
                    </span>
                    <OnahBadge onah={entry.onah} />
                  </div>

                  {/* תאריך + שעה בשורה אחת */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        תאריך <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="date"
                        value={entry.date}
                        max={new Date().toISOString().split('T')[0]}
                        onChange={e => updateEntry(entry.id, { date: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        שעה <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="time"
                        value={entry.time}
                        onChange={e => updateEntry(entry.id, { time: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* הסבר מחושב */}
                  {entry.date && entry.time && (
                    <p className="text-xs text-muted-foreground">
                      {entry.onah === 'day'
                        ? `☀️ השעה ${entry.time} היא לאחר הזריחה ולפני השקיעה — עונת יום`
                        : `🌙 השעה ${entry.time} היא לאחר השקיעה או לפני הזריחה — עונת לילה`}
                    </p>
                  )}
                </div>

                {/* מחיקה */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeEntry(entry.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0 mt-6"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* כפתור הוספה */}
      <Button
        variant="outline"
        onClick={addEntry}
        className="w-full"
        disabled={entries.length >= 6}
      >
        <Plus className="h-4 w-4 ml-2" />
        {entries.length === 0 ? 'הוסיפי וסת ראשונה' : 'הוסיפי וסת נוספת'}
      </Button>

      {entries.length >= 6 && (
        <p className="text-xs text-center text-muted-foreground">
          ניתן להזין עד 6 וסתות בשלב זה
        </p>
      )}

      {/* טיפ */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-3">
          <div className="flex gap-2 items-start text-sm">
            <span className="text-lg leading-none">💡</span>
            <p className="text-muted-foreground">
              ככל שתזיני יותר וסתות, החישובים יהיו מדויקים יותר.
              מומלץ להזין לפחות <strong>2–3 וסתות</strong> לחישוב הפלגה.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* המשך */}
      <Button
        onClick={handleSubmit}
        disabled={!hasValidEntries}
        className="w-full"
        size="lg"
      >
        המשך
      </Button>
    </div>
  );
}
