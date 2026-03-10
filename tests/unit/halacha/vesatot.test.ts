/**
 * בדיקות יחידה לחישובי וסתות
 */

import {
  calculateYomHachodesh,
  calculateYom30,
  calculateHaflagah,
} from '@/lib/halacha/vesatot';
import { getHebrewDayOfMonth } from '@/lib/hebrew-calendar';
import { VesetEvent, HefsekhTahara, HalachicSettings } from '@/types';

// מיקום דוגמה (ירושלים)
const testLocation = {
  latitude: 31.7683,
  longitude: 35.2137,
  timezone: 'Asia/Jerusalem',
  locationName: 'ירושלים',
};

// הגדרות דוגמה
const testSettings: HalachicSettings = {
  method: 'ovadia_yosef',
  orZarua: false,
  yom31: false,
  maatLeat: false,
};

describe('calculateYomHachodesh', () => {
  it('should calculate next month same Hebrew date', () => {
    const veset: VesetEvent = {
      userId: 'test',
      date: new Date('2024-01-15'), // ג׳ שבט תשפ״ד
      onah: 'day',
    };

    const result = calculateYomHachodesh(veset, testLocation);

    // בדיקה שהיום העברי זהה
    const originalHebrewDay = getHebrewDayOfMonth(veset.date);
    const resultHebrewDay = getHebrewDayOfMonth(result.date);

    expect(resultHebrewDay).toBe(originalHebrewDay);
    expect(result.onah).toBe('day');
    expect(result.type).toBe('yom_hachodesh');
  });

  it('should preserve onah', () => {
    const vesetNight: VesetEvent = {
      userId: 'test',
      date: new Date('2024-01-15'),
      onah: 'night',
    };

    const result = calculateYomHachodesh(vesetNight, testLocation);
    expect(result.onah).toBe('night');
  });
});

describe('calculateYom30', () => {
  it('should calculate 30 days from veset', () => {
    const veset: VesetEvent = {
      userId: 'test',
      date: new Date('2024-01-01'),
      onah: 'day',
    };

    const result = calculateYom30(veset, testLocation);

    // בדיקה שההפרש הוא בדיוק 30 ימים
    const expectedDate = new Date('2024-01-31');
    expect(result.date.toDateString()).toBe(expectedDate.toDateString());
    expect(result.onah).toBe('day');
    expect(result.type).toBe('yom_30');
  });

  it('should handle month boundaries', () => {
    const veset: VesetEvent = {
      userId: 'test',
      date: new Date('2024-02-15'), // פברואר
      onah: 'night',
    };

    const result = calculateYom30(veset, testLocation);

    // 30 ימים מ-15 בפברואר = 16 במרץ
    const expectedDate = new Date('2024-03-16');
    expect(result.date.toDateString()).toBe(expectedDate.toDateString());
  });
});

describe('calculateHaflagah', () => {
  it('should calculate haflagah between two vesatot', () => {
    const vesatot: VesetEvent[] = [
      {
        id: '1',
        userId: 'test',
        date: new Date('2024-01-01'),
        onah: 'day',
      },
      {
        id: '2',
        userId: 'test',
        date: new Date('2024-01-29'), // 28 ימים אחרי
        onah: 'day',
      },
    ];

    const result = calculateHaflagah(
      vesatot,
      [],
      testSettings,
      testLocation
    );

    expect(result).not.toBeNull();
    expect(result?.interval).toBe(28);
    
    // הווסת הבאה צריכה להיות 28 ימים אחרי הווסת האחרונה
    const expectedDate = new Date('2024-02-26');
    expect(result?.nextDate.toDateString()).toBe(expectedDate.toDateString());
  });

  it('should return null with less than 2 vesatot', () => {
    const vesatot: VesetEvent[] = [
      {
        id: '1',
        userId: 'test',
        date: new Date('2024-01-01'),
        onah: 'day',
      },
    ];

    const result = calculateHaflagah(
      vesatot,
      [],
      testSettings,
      testLocation
    );

    expect(result).toBeNull();
  });

  it('should calculate Chabad method correctly (from hefsek)', () => {
    const vesatot: VesetEvent[] = [
      {
        id: '1',
        userId: 'test',
        date: new Date('2024-01-01'),
        onah: 'day',
      },
      {
        id: '2',
        userId: 'test',
        date: new Date('2024-02-01'),
        onah: 'day',
      },
    ];

    const hefsekhim: HefsekhTahara[] = [
      {
        id: 'h1',
        userId: 'test',
        vesetEventId: '1',
        date: new Date('2024-01-07'), // 6 ימים אחרי הווסת הראשונה
        onah: 'day',
      },
    ];

    const chabadSettings: HalachicSettings = {
      method: 'chabad',
      orZarua: false,
      yom31: false,
      maatLeat: false,
    };

    const result = calculateHaflagah(
      vesatot,
      hefsekhim,
      chabadSettings,
      testLocation
    );

    expect(result).not.toBeNull();
    // חב״ד: מהפסק טהרה (7/1) לווסת הבאה (1/2) = 25 ימים
    expect(result?.interval).toBe(25);
  });
});

describe('Edge Cases', () => {
  it('should handle leap year correctly', () => {
    const veset: VesetEvent = {
      userId: 'test',
      date: new Date('2024-02-29'), // שנה מעוברת
      onah: 'day',
    };

    const result = calculateYom30(veset, testLocation);
    const expectedDate = new Date('2024-03-30');
    expect(result.date.toDateString()).toBe(expectedDate.toDateString());
  });

  it('should handle year boundary', () => {
    const veset: VesetEvent = {
      userId: 'test',
      date: new Date('2024-12-15'),
      onah: 'day',
    };

    const result = calculateYom30(veset, testLocation);
    const expectedDate = new Date('2025-01-14');
    expect(result.date.toDateString()).toBe(expectedDate.toDateString());
  });
});
