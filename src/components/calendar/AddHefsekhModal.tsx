/**
 * קומפוננטת AddHefsekhModal - מודאל להוספת הפסק טהרה
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { X } from 'lucide-react';
import { VesetEvent } from '@/types';

interface AddHefsekhModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    vesetEventId: string;
    date: Date;
    time: string;
  }) => void;
  recentVesatot: VesetEvent[]; // רשימת וסתות אחרונות
}

export function AddHefsekhModal({ 
  isOpen, 
  onClose, 
  onSubmit,
  recentVesatot 
}: AddHefsekhModalProps) {
  const [selectedVesetId, setSelectedVesetId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('17:00'); // ברירת מחדל לאחר הצהריים

  useEffect(() => {
    // בחירה אוטומטית של הווסת האחרונה
    if (recentVesatot.length > 0 && !selectedVesetId) {
      setSelectedVesetId(recentVesatot[0].id || '');
    }
  }, [recentVesatot, selectedVesetId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedVesetId) {
      alert('נא לבחור וסת');
      return;
    }

    // מציאת הווסת שנבחרה
    const selectedVeset = recentVesatot.find(v => v.id === selectedVesetId);
    if (!selectedVeset) {
      alert('וסת לא נמצאה');
      return;
    }

    const hefsekhDate = new Date(date);
    const vesetDate = new Date(selectedVeset.date);
    
    // חישוב הפרש ימים
    const daysDiff = Math.floor(
      (hefsekhDate.getTime() - vesetDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // בדיקה שעברו לפחות 4 ימים (היום החמישי)
    if (daysDiff < 4) {
      alert('לא ניתן להזין הפסק טהרה לפני היום החמישי למחזור (4 ימים מלאים)');
      return;
    }

    // בדיקה שההפסק לפני השקיעה
    const [hours, minutes] = time.split(':').map(Number);
    if (hours >= 18) { // קירוב פשוט - צריך לבדוק שקיעה אמיתית
      alert('הפסק טהרה חייב להיות לפני השקיעה');
      return;
    }
    
    onSubmit({
      vesetEventId: selectedVesetId,
      date: hefsekhDate,
      time: time,
    });

    // איפוס טופס
    setDate(new Date().toISOString().split('T')[0]);
    setTime('17:00');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md animate-slide-in">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>הוספת הפסק טהרה</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* בחירת וסת */}
            <div>
              <label className="block text-sm font-medium mb-2">
                בחר וסת <span className="text-red-500">*</span>
              </label>
              {recentVesatot.length === 0 ? (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
                  אין וסתות זמינות. נא להוסיף וסת קודם.
                </div>
              ) : (
                <select
                  value={selectedVesetId}
                  onChange={(e) => setSelectedVesetId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">בחר וסת...</option>
                  {recentVesatot.map((veset) => (
                    <option key={veset.id} value={veset.id}>
                      {new Date(veset.date).toLocaleDateString('he-IL')} 
                      {veset.time && ` - ${veset.time}`}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* תאריך */}
            <div>
              <label className="block text-sm font-medium mb-2">
                תאריך הפסק טהרה <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            {/* שעה */}
            <div>
              <label className="block text-sm font-medium mb-2">
                שעה <span className="text-red-500">*</span>
              </label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                המערכת תחשב אוטומטית את העונה (יום/לילה) לפי השעה
              </p>
            </div>

            {/* הסבר */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex gap-2">
                <span className="text-lg">ℹ️</span>
                <div className="text-sm">
                  <p className="font-semibold mb-1">הפסק טהרה:</p>
                  <p className="text-muted-foreground mb-2">
                    היום שבו נעשה הפסק טהרה (בדיקה ומצאת נקי).
                    ממנו מתחילה ספירת 7 הימים הנקיים.
                  </p>
                  <p className="text-xs text-red-600 font-medium">
                    ⚠️ ניתן להזין רק מהיום החמישי למחזור ולפני השקיעה
                  </p>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              ביטול
            </Button>
            <Button 
              type="submit"
              disabled={recentVesatot.length === 0}
            >
              הוסף הפסק טהרה
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
