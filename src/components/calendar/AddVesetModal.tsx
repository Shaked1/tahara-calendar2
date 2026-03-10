/**
 * קומפוננטת AddVesetModal - מודאל להוספת וסת
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { X } from 'lucide-react';
import { OnahType } from '@/types';

interface AddVesetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    date: Date;
    time: string;
    notes?: string;
  }) => void;
}

export function AddVesetModal({ isOpen, onClose, onSubmit }: AddVesetModalProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('08:00'); // ברירת מחדל
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const vesetDate = new Date(date);
    
    // העונה תחושב אוטומטית בצד השרת לפי השעה
    onSubmit({
      date: vesetDate,
      time: time,
      notes: notes || undefined,
    });

    // איפוס טופס
    setDate(new Date().toISOString().split('T')[0]);
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
            {/* תאריך */}
            <div>
              <label className="block text-sm font-medium mb-2">
                תאריך <span className="text-red-500">*</span>
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
                המערכת תחשב אוטומטית את העונה (יום/לילה) לפי השעה שהוזנה
              </p>
            </div>

            {/* הערות */}
            <div>
              <label className="block text-sm font-medium mb-2">
                הערות (אופציונלי)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full min-h-[80px] px-3 py-2 border border-input rounded-md bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="הערות נוספות..."
              />
            </div>
          </CardContent>

          <CardFooter className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              ביטול
            </Button>
            <Button type="submit">
              הוסף וסת
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
