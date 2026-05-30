/**
 * קומפוננטת AddVesetModal - מודאל להוספת וסת
 * העונה מחושבת אוטומטית לפי שעה + מיקום — אין בחירה ידנית
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { X, Sun, Moon } from 'lucide-react';
import { OnahType, UserLocation } from '@/types';

// ──────────────────────────────────────────────
// חישוב עונה מקורב (זריחה/שקיעה לפי NOAA פשוט)
// ──────────────────────────────────────────────

function calcSunTimes(date: Date, lat: number, lng: number): { sunrise: Date; sunset: Date } {
  const rad = Math.PI / 180;
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const B       = (360 / 365) * (dayOfYear - 81) * rad;
  const eot     = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
  const noon    = 12 - lng / 15 - eot / 60;
  const decl    = 23.45 * Math.sin(B) * rad;
  const cosH    = -Math.tan(lat * rad) * Math.tan(decl);
  const H       = Math.abs(cosH) > 1 ? 6 : Math.acos(cosH) / rad;

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

function formatSunTime(date: Date, timeStr: string, lat: number, lng: number, which: 'sunrise' | 'sunset'): string {
  if (!date || !timeStr) return '';
  const ev = new Date(date);
  const [h, m] = timeStr.split(':').map(Number);
  ev.setHours(h, m, 0, 0);
  const { sunrise, sunset } = calcSunTimes(ev, lat, lng);
  const t = which === 'sunrise' ? sunrise : sunset;
  return t.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false });
}

// ──────────────────────────────────────────────
// Badge עונה
// ──────────────────────────────────────────────

function OnahBadge({ onah }: { onah: OnahType }) {
  return onah === 'day' ? (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-sm font-semibold border border-amber-200">
      <Sun className="w-3.5 h-3.5" />
      עונת יום
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-sm font-semibold border border-indigo-200">
      <Moon className="w-3.5 h-3.5" />
      עונת לילה
    </span>
  );
}

// ──────────────────────────────────────────────
// Props
// ──────────────────────────────────────────────

interface AddVesetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { date: Date; time: string; notes?: string }) => void;
  /** מיקום המשתמשת לחישוב מדויק (אופציונלי — ברירת מחדל ירושלים) */
  location?: UserLocation;
}

// ──────────────────────────────────────────────
// קומפוננטה
// ──────────────────────────────────────────────

export function AddVesetModal({ isOpen, onClose, onSubmit, location }: AddVesetModalProps) {
  const today = new Date().toISOString().split('T')[0];

  const [date,  setDate]  = useState(today);
  const [time,  setTime]  = useState('08:00');
  const [notes, setNotes] = useState('');

  const lat = location?.latitude  ?? 31.7683;
  const lng = location?.longitude ?? 35.2137;

  // עונה מחושבת בזמן אמת
  const computedOnah: OnahType = computeOnah(date, time, lat, lng);

  // זמני זריחה/שקיעה להצגה
  const sunriseStr = date && time ? formatSunTime(new Date(date), time, lat, lng, 'sunrise') : '';
  const sunsetStr  = date && time ? formatSunTime(new Date(date), time, lat, lng, 'sunset')  : '';

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ date: new Date(date), time, notes: notes || undefined });
    // איפוס
    setDate(today);
    setTime('08:00');
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md animate-slide-in">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>הוספת וסת חדשה</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
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

            {/* תצוגת עונה מחושבת */}
            {date && time && (
              <div className="rounded-xl border bg-gray-50 p-4 space-y-3">
                {/* עונה */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">עונה מחושבת:</span>
                  <OnahBadge onah={computedOnah} />
                </div>

                {/* זמני זריחה/שקיעה */}
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

                {/* הסבר */}
                <p className="text-xs text-muted-foreground border-t pt-2">
                  {computedOnah === 'day'
                    ? `השעה ${time} היא לאחר הזריחה (${sunriseStr}) ולפני השקיעה (${sunsetStr})`
                    : `השעה ${time} היא לאחר השקיעה (${sunsetStr}) או לפני הזריחה (${sunriseStr})`}
                </p>
              </div>
            )}

            {/* הערות */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                הערות (אופציונלי)
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full min-h-[72px] px-3 py-2 border border-input rounded-md bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                placeholder="הערות נוספות..."
              />
            </div>

          </CardContent>

          <CardFooter className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              ביטול
            </Button>
            <Button type="submit" className="flex-1">
              הוסף וסת
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
