/**
 * קומפוננטת HistoryInput - הזנת היסטוריית 6 חודשים
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Plus, Trash2 } from 'lucide-react';
import { OnahType } from '@/types';

interface VesetEntry {
  id: string;
  date: string;
  time?: string;
  onah: OnahType;
}

interface HistoryInputProps {
  onComplete: (entries: VesetEntry[]) => void;
}

export function HistoryInput({ onComplete }: HistoryInputProps) {
  const [entries, setEntries] = useState<VesetEntry[]>([]);

  const addEntry = () => {
    const newEntry: VesetEntry = {
      id: Date.now().toString(),
      date: '',
      time: '',
      onah: 'day',
    };
    setEntries([...entries, newEntry]);
  };

  const removeEntry = (id: string) => {
    setEntries(entries.filter(e => e.id !== id));
  };

  const updateEntry = (id: string, updates: Partial<VesetEntry>) => {
    setEntries(entries.map(e => 
      e.id === id ? { ...e, ...updates } : e
    ));
  };

  const handleSubmit = () => {
    // סינון רק entries שלמים (עם תאריך)
    const validEntries = entries.filter(e => e.date);
    
    if (validEntries.length === 0) {
      alert('נא להזין לפחות וסת אחת');
      return;
    }

    onComplete(validEntries);
  };

  // בדיקה אם יש לפחות entry אחד תקין
  const hasValidEntries = entries.some(e => e.date);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">הזנת היסטוריית וסתות</h3>
        <p className="text-sm text-muted-foreground">
          נא להזין את 6 הוסתות האחרונות שלך (או לפחות 2-3 לחישובים מדויקים)
        </p>
      </div>

      {/* רשימת entries */}
      <div className="space-y-4">
        {entries.map((entry, index) => (
          <Card key={entry.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex-1 space-y-3">
                  {/* מספר סידורי */}
                  <div className="text-sm font-semibold text-primary">
                    וסת #{index + 1}
                  </div>

                  {/* תאריך */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      תאריך <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="date"
                      value={entry.date}
                      onChange={(e) => updateEntry(entry.id, { date: e.target.value })}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  {/* שעה */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      שעה (אופציונלי)
                    </label>
                    <Input
                      type="time"
                      value={entry.time}
                      onChange={(e) => updateEntry(entry.id, { time: e.target.value })}
                    />
                  </div>

                  {/* עונה */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      עונה
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`onah-${entry.id}`}
                          checked={entry.onah === 'day'}
                          onChange={() => updateEntry(entry.id, { onah: 'day' })}
                          className="w-4 h-4"
                        />
                        <span>☀️ יום</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`onah-${entry.id}`}
                          checked={entry.onah === 'night'}
                          onChange={() => updateEntry(entry.id, { onah: 'night' })}
                          className="w-4 h-4"
                        />
                        <span>🌙 לילה</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* כפתור מחיקה */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeEntry(entry.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-5 w-5" />
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
        <Plus className="h-5 w-5 ml-2" />
        הוסף וסת נוספת
      </Button>

      {/* הסבר */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <span className="text-2xl">💡</span>
            <div className="text-sm">
              <p className="font-semibold mb-1">טיפ:</p>
              <p className="text-muted-foreground">
                ככל שתזיני יותר וסתות, החישובים יהיו מדויקים יותר.
                אם אינך זוכרת את השעה המדויקת, השאירי שדה זה ריק.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* כפתור המשך */}
      <Button
        onClick={handleSubmit}
        disabled={!hasValidEntries}
        className="w-full"
      >
        המשך
      </Button>
    </div>
  );
}
