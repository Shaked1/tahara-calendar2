/**
 * קומפוננטת AddVesetModal - מודאל להוספת וסת
 * כולל: אישור יום כשוסת אחרי השקיעה
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { X, Sun, Moon, AlertTriangle } from 'lucide-react';
import { OnahType, UserLocation } from '@/types';

// ──────────────────────────────────────────────
// חישוב עונה
// ──────────────────────────────────────────────

function calcSunTimes(date: Date, lat: number, lng: number): { sunrise: Date; sunset: Date } {
  const rad = Math.PI / 180;
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const B    = (360 / 365) * (dayOfYear - 81) * rad;
  const eot  = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
  const noon = 12 - lng / 15 - eot / 60;
  const decl = 23.45 * Math.sin(B) * rad;
  const cosH = -Math.tan(lat * rad) * Math.tan(decl);
  const H    = Math.abs(cosH) > 1 ? 6 : Math.acos(cosH) / rad;
  const toLocal = (utcH: number) => {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    d.setTime(d.getTime() + utcH * 3600 * 1000);
    return d;
  };
  return { sunrise: toLocal(noon - H / 15), sunset: toLocal(noon + H / 15) };
}

function computeOnah(dateStr: string, timeStr: string, lat = 31.7683, lng = 35.2137): OnahType {
  if (!dateStr || !timeStr) return 'day';
  const [h, m] = timeStr.split(':').map(Number);
  const ev = new Date(dateStr);
  ev.setHours(h, m, 0, 0);
  const { sunrise, sunset } = calcSunTimes(ev, lat, lng);
  return ev >= sunrise && ev < sunset ? 'day' : 'night';
}

function isAfterSunset(dateStr: string, timeStr: string, lat: number, lng: number): boolean {
  if (!dateStr || !timeStr) return false;
  const [h, m] = timeStr.split(':').map(Number);
  const ev = new Date(dateStr);
  ev.setHours(h, m, 0, 0);
  const { sunset } = calcSunTimes(ev, lat, lng);
  return ev >= sunset;
}

function getSunsetStr(dateStr: string, timeStr: string, lat: number, lng: number): string {
  if (!dateStr || !timeStr) return '';
  const ev = new Date(dateStr);
  const { sunset } = calcSunTimes(ev, lat, lng);
  return sunset.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatSunTime(dateStr: string, lat: number, lng: number, which: 'sunrise' | 'sunset'): string {
  if (!dateStr) return '';
  const ev = new Date(dateStr);
  const { sunrise, sunset } = calcSunTimes(ev, lat, lng);
  const t = which === 'sunrise' ? sunrise : sunset;
  return t.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function getDayName(dateStr: string): string {
  if (!dateStr) return '';
  const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  return days[new Date(dateStr).getDay()];
}

function getPrevDayStr(dateStr: string): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

// ──────────────────────────────────────────────
// Badge עונה
// ──────────────────────────────────────────────

function OnahBadge({ onah }: { onah: OnahType }) {
  return onah === 'day' ? (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-sm font-semibold border border-amber-200">
      <Sun className="w-3.5 h-3.5" /> עונת יום
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-sm font-semibold border border-indigo-200">
      <Moon className="w-3.5 h-3.5" /> עונת לילה
    </span>
  );
}

// ──────────────────────────────────────────────
// דיאלוג אישור יום אחרי שקיעה
// ──────────────────────────────────────────────

interface SunsetConfirmDialogProps {
  date: string;
  time: string;
  lat: number;
  lng: number;
  onConfirm: (chosenDate: string) => void;
  onCancel: () => void;
}

function SunsetConfirmDialog({ date, time, lat, lng, onConfirm, onCancel }: SunsetConfirmDialogProps) {
  const currentDayName  = getDayName(date);
  const prevDate        = getPrevDayStr(date);
  const prevDayName     = getDayName(prevDate);
  const sunsetStr       = getSunsetStr(date, time, lat, lng);

  // תצוגת תאריך עברי/לועזי
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('he-IL', { day: 'numeric', month: 'long' });

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-slide-in">

        {/* כותרת */}
        <div className="p-5 border-b">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-amber-100 p-2.5">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">הוסת אחרי השקיעה</h3>
              <p className="text-xs text-gray-500 mt-0.5">השעה {time} היא אחרי השקיעה ({sunsetStr})</p>
            </div>
          </div>
        </div>

        {/* שאלה */}
        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-700 leading-relaxed">
            לאיזה יום להלכה שייכת ראיית הוסת?
          </p>

          {/* אפשרות א: היום הנוכחי */}
          <button
            onClick={() => onConfirm(date)}
            className="w-full text-right p-4 rounded-xl border-2 border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all group"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 group-hover:bg-indigo-200 transition-colors">
                <Moon className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">
                  יום {currentDayName} — {fmtDate(date)} אחרי השקיעה
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  הוסת הגיע בלילה שבין יום {currentDayName} לבין יום {getDayName(new Date(date).getDay() === 6
                    ? date
                    : (() => { const d = new Date(date); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; })()
                  )}
                </p>
                <p className="text-xs text-indigo-700 font-medium mt-1">
                  → הלוח יצבע: עונת לילה של יום {getDayName(new Date(date).getDay() === 6
                    ? date
                    : (() => { const d = new Date(date); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; })()
                  )} באדום
                </p>
              </div>
            </div>
          </button>

          {/* אפשרות ב: היום הקודם */}
          <button
            onClick={() => onConfirm(prevDate)}
            className="w-full text-right p-4 rounded-xl border-2 border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-all group"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0 group-hover:bg-purple-200 transition-colors">
                <Moon className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">
                  יום {prevDayName} — {fmtDate(prevDate)} אחרי השקיעה
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  הוסת הגיע בלילה שלאחר יום {prevDayName} — כלומר ב{fmtDate(prevDate)} בלילה
                </p>
                <p className="text-xs text-purple-700 font-medium mt-1">
                  → הלוח יצבע: עונת לילה של יום {currentDayName} באדום
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* ביטול */}
        <div className="px-5 pb-5">
          <button
            onClick={onCancel}
            className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors py-1"
          >
            ביטול — חזרה לעריכה
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Props
// ──────────────────────────────────────────────

interface AddVesetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { date: Date; time: string; notes?: string }) => void;
  location?: UserLocation;
}

// ──────────────────────────────────────────────
// קומפוננטה ראשית
// ──────────────────────────────────────────────

export function AddVesetModal({ isOpen, onClose, onSubmit, location }: AddVesetModalProps) {
  const today = new Date().toISOString().split('T')[0];

  const [date,  setDate]  = useState(today);
  const [time,  setTime]  = useState('08:00');
  const [notes, setNotes] = useState('');
  const [showSunsetConfirm, setShowSunsetConfirm] = useState(false);

  const lat = location?.latitude  ?? 31.7683;
  const lng = location?.longitude ?? 35.2137;

  const computedOnah: OnahType = computeOnah(date, time, lat, lng);
  const sunriseStr = formatSunTime(date, lat, lng, 'sunrise');
  const sunsetStr  = formatSunTime(date, lat, lng, 'sunset');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // בדיקה אם אחרי שקיעה → פתח דיאלוג אישור
    if (isAfterSunset(date, time, lat, lng)) {
      setShowSunsetConfirm(true);
      return;
    }

    onSubmit({ date: new Date(date), time, notes: notes || undefined });
    resetAndClose();
  };

  const handleSunsetConfirm = (chosenDate: string) => {
    setShowSunsetConfirm(false);
    onSubmit({ date: new Date(chosenDate), time, notes: notes || undefined });
    resetAndClose();
  };

  const resetAndClose = () => {
    setDate(today);
    setTime('08:00');
    setNotes('');
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md animate-slide-in">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>הוספת וסת חדשה</CardTitle>
              <Button variant="ghost" size="icon" onClick={resetAndClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5">

              {/* תאריך */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  תאריך <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={date}
                  max={today}
                  onChange={e => setDate(e.target.value)}
                  required
                />
              </div>

              {/* שעה */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  שעה <span className="text-red-500">*</span>
                </label>
                <Input
                  type="time"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  required
                />
              </div>

              {/* תצוגת עונה */}
              {date && time && (
                <div className="rounded-xl border bg-gray-50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">עונה מחושבת:</span>
                    <OnahBadge onah={computedOnah} />
                  </div>

                  {sunriseStr && sunsetStr && (
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 border-t pt-2">
                      <div className="flex items-center gap-1">
                        <Sun className="w-3 h-3 text-amber-500" />
                        <span>זריחה: <strong>{sunriseStr}</strong></span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Moon className="w-3 h-3 text-indigo-400" />
                        <span>שקיעה: <strong>{sunsetStr}</strong></span>
                      </div>
                    </div>
                  )}

                  {/* אזהרה אחרי שקיעה */}
                  {computedOnah === 'night' && isAfterSunset(date, time, lat, lng) && (
                    <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                      <p className="text-xs text-amber-800">
                        <strong>הוסת אחרי השקיעה.</strong> בעת השמירה תישאלי לאיזה יום להלכה שייכת הראייה.
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground border-t pt-2">
                    {computedOnah === 'day'
                      ? `השעה ${time} היא לאחר הזריחה (${sunriseStr}) ולפני השקיעה (${sunsetStr})`
                      : `השעה ${time} היא לאחר השקיעה (${sunsetStr}) או לפני הזריחה (${sunriseStr})`}
                  </p>
                </div>
              )}

              {/* הערות */}
              <div>
                <label className="block text-sm font-medium mb-1.5">הערות (אופציונלי)</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full min-h-[72px] px-3 py-2 border border-input rounded-md bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                  placeholder="הערות נוספות..."
                />
              </div>

            </CardContent>

            <CardFooter className="flex gap-2">
              <Button type="button" variant="outline" onClick={resetAndClose} className="flex-1">ביטול</Button>
              <Button type="submit" className="flex-1">הוסף וסת</Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      {/* דיאלוג אישור יום אחרי שקיעה */}
      {showSunsetConfirm && (
        <SunsetConfirmDialog
          date={date}
          time={time}
          lat={lat}
          lng={lng}
          onConfirm={handleSunsetConfirm}
          onCancel={() => setShowSunsetConfirm(false)}
        />
      )}
    </>
  );
}
