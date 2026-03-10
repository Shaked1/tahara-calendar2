/**
 * מודול חישוב זמני היום (Zmanim)
 * משתמש ב-KosherZmanim לחישובים מדויקים
 */

import { DayZmanim, UserLocation } from '@/types';
import { 
  GeoLocation, 
  ZmanimCalendar,
  ComplexZmanimCalendar,
} from 'kosher-zmanim';

/**
 * יוצר אובייקט GeoLocation מנתוני המשתמש
 */
function createGeoLocation(location: UserLocation): GeoLocation {
  return new GeoLocation(
    location.locationName || 'Location',
    location.latitude,
    location.longitude,
    0, // elevation (ניתן להוסיף בעתיד)
    location.timezone
  );
}

/**
 * מחזיר את זמני היום לתאריך ומיקום נתונים
 * @param date התאריך המבוקש
 * @param location מיקום המשתמש
 * @returns אובייקט עם כל הזמנים
 */
export function getZmanimForDate(
  date: Date,
  location: UserLocation
): DayZmanim {
  const geoLocation = createGeoLocation(location);
  const zmanimCalendar = new ComplexZmanimCalendar(geoLocation);
  zmanimCalendar.setDate(date);
  
  // זריחה (הנץ החמה)
  const sunrise = zmanimCalendar.getSunrise() || date;
  
  // שקיעה
  const sunset = zmanimCalendar.getSunset() || date;
  
  // חצות היום
  const chatzot = zmanimCalendar.getChatzos() || date;
  
  // צאת הכוכבים (לפי ר"ת - 72 דקות)
  const tzeitHakochavim = zmanimCalendar.getTzais72() || date;
  
  return {
    date,
    sunrise,
    sunset,
    chatzot,
    tzeitHakochavim,
  };
}

/**
 * מחזיר האם כרגע זה יום או לילה
 */
export function isCurrentlyDay(location: UserLocation): boolean {
  const now = new Date();
  const zmanim = getZmanimForDate(now, location);
  
  return now >= zmanim.sunrise && now < zmanim.sunset;
}

/**
 * מחשב את זמני היום למספר ימים קדימה
 * שימושי לקאשינג וחישובים מראש
 */
export function getZmanimForRange(
  startDate: Date,
  days: number,
  location: UserLocation
): DayZmanim[] {
  const results: DayZmanim[] = [];
  
  for (let i = 0; i < days; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + i);
    
    results.push(getZmanimForDate(currentDate, location));
  }
  
  return results;
}

/**
 * מחזיר את זמן החצות (אמצע היום ההלכתי)
 */
export function getChatzot(date: Date, location: UserLocation): Date {
  const geoLocation = createGeoLocation(location);
  const zmanimCalendar = new ComplexZmanimCalendar(geoLocation);
  zmanimCalendar.setDate(date);
  
  return zmanimCalendar.getChatzos() || date;
}

/**
 * בודק אם שעה מסוימת היא אחרי צאת הכוכבים
 */
export function isAfterTzeitHakochavim(
  checkTime: Date,
  location: UserLocation
): boolean {
  const zmanim = getZmanimForDate(checkTime, location);
  return checkTime >= zmanim.tzeitHakochavim;
}

/**
 * מחזיר את זמן השקיעה למחרת (שימושי לחישוב תחילת עונת לילה)
 */
export function getTomorrowSunset(date: Date, location: UserLocation): Date {
  const tomorrow = new Date(date);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const zmanim = getZmanimForDate(tomorrow, location);
  return zmanim.sunset;
}

/**
 * מחזיר את זמן הזריחה של אתמול
 */
export function getYesterdaySunrise(date: Date, location: UserLocation): Date {
  const yesterday = new Date(date);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const zmanim = getZmanimForDate(yesterday, location);
  return zmanim.sunrise;
}

/**
 * פורמט זמן לתצוגה (HH:MM)
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('he-IL', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * מחזיר טקסט תיאורי לזמנים (לתצוגה למשתמש)
 */
export function getZmanimDescription(
  date: Date,
  location: UserLocation
): string {
  const zmanim = getZmanimForDate(date, location);
  
  return `
    זריחה: ${formatTime(zmanim.sunrise)}
    חצות: ${formatTime(zmanim.chatzot)}
    שקיעה: ${formatTime(zmanim.sunset)}
    צאת הכוכבים: ${formatTime(zmanim.tzeitHakochavim)}
  `.trim();
}
