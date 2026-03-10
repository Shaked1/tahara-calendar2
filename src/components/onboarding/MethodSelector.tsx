/**
 * קומפוננטת MethodSelector - בחירת שיטה הלכתית
 */

'use client';

import { useState } from 'react';
import { HalachicMethod, HalachicSettings } from '@/types';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface MethodSelectorProps {
  onSelect: (settings: Partial<HalachicSettings>) => void;
  initialSettings?: Partial<HalachicSettings>;
}

const METHODS: { value: HalachicMethod; label: string; description: string }[] = [
  {
    value: 'ovadia_yosef',
    label: 'הרב עובדיה יוסף',
    description: 'פסיקת מרן רבנו עובדיה יוסף זצ"ל',
  },
  {
    value: 'ben_ish_chai',
    label: 'בן איש חי',
    description: 'הלכות לפי מרן הבן איש חי',
  },
  {
    value: 'chazon_ish',
    label: 'חזון איש',
    description: 'פסיקת החזון איש זצ"ל',
  },
  {
    value: 'chabad',
    label: 'חב"ד',
    description: 'מנהגי חב"ד לפי השולחן ערוך הרב',
  },
];

const ADDITIONS: { key: 'orZarua' | 'yom31' | 'maatLeat'; label: string; description: string }[] = [
  {
    key: 'orZarua',
    label: 'אור זרוע',
    description: 'חשש אור זרוע - יום 31',
  },
  {
    key: 'yom31',
    label: 'יום 31',
    description: 'חשש נוסף ליום 31',
  },
  {
    key: 'maatLeat',
    label: 'מעת לעת',
    description: 'חשש מעת לעת (24 שעות)',
  },
];

export function MethodSelector({ onSelect, initialSettings }: MethodSelectorProps) {
  const [selectedMethod, setSelectedMethod] = useState<HalachicMethod>(
    initialSettings?.method || 'ovadia_yosef'
  );
  const [additions, setAdditions] = useState({
    orZarua: initialSettings?.orZarua || false,
    yom31: initialSettings?.yom31 || false,
    maatLeat: initialSettings?.maatLeat || false,
  });

  const handleMethodSelect = (method: HalachicMethod) => {
    setSelectedMethod(method);
    onSelect({
      method,
      ...additions,
    });
  };

  const handleAdditionToggle = (key: 'orZarua' | 'yom31' | 'maatLeat') => {
    const newAdditions = {
      ...additions,
      [key]: !additions[key],
    };
    setAdditions(newAdditions);
    onSelect({
      method: selectedMethod,
      ...newAdditions,
    });
  };

  return (
    <div className="space-y-6">
      {/* בחירת שיטה */}
      <div>
        <h3 className="text-lg font-semibold mb-4">בחירת שיטה הלכתית</h3>
        <div className="grid gap-3">
          {METHODS.map((method) => (
            <Card
              key={method.value}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md',
                selectedMethod === method.value &&
                  'ring-2 ring-primary bg-primary/5'
              )}
              onClick={() => handleMethodSelect(method.value)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center',
                      selectedMethod === method.value
                        ? 'border-primary bg-primary'
                        : 'border-gray-300'
                    )}
                  >
                    {selectedMethod === method.value && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold font-hebrew text-lg">
                      {method.label}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {method.description}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* תוספות הלכתיות */}
      <div>
        <h3 className="text-lg font-semibold mb-4">תוספות הלכתיות (אופציונלי)</h3>
        <div className="space-y-3">
          {ADDITIONS.map((addition) => (
            <Card key={addition.key}>
              <CardContent className="p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={additions[addition.key]}
                    onChange={() => handleAdditionToggle(addition.key)}
                    className="w-5 h-5 mt-0.5 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <div className="flex-1">
                    <div className="font-medium font-hebrew">
                      {addition.label}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {addition.description}
                    </div>
                  </div>
                </label>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* הסבר */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <span className="text-2xl">ℹ️</span>
            <div className="text-sm">
              <p className="font-semibold mb-1">חשוב לדעת:</p>
              <p className="text-muted-foreground">
                בחירת השיטה ההלכתית משפיעה על חישוב הוסתות והפלגות.
                מומלץ להתייעץ עם רב פוסק לבחירת השיטה המתאימה לך.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
