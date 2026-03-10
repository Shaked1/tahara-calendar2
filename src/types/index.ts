/**
 * Types ומבנים מרכזיים למערכת טהרה
 */

// ====================================
// שיטות הלכתיות
// ====================================

export type HalachicMethod = 
  | 'ovadia_yosef'      // רב עובדיה יוסף
  | 'ben_ish_chai'      // בן איש חי
  | 'chazon_ish'        // חזון איש
  | 'chabad'            // חב"ד
  | 'custom';           // מותאם אישית

export interface HalachicSettings {
  method: HalachicMethod;
  orZarua: boolean;      // אור זרוע
  yom31: boolean;        // יום 31
  maatLeat: boolean;     // מעת לעת
}

// ====================================
// עונות
// ====================================

export type OnahType = 'day' | 'night';

export interface Onah {
  type: OnahType;
  date: Date;
  hebrewDate: string;    // תאריך עברי בגימטריה
}

// ====================================
// אירועי וסת
// ====================================

export interface VesetEvent {
  id?: string;
  userId: string;
  date: Date;
  time?: string;          // HH:MM format (אופציונלי)
  onah: OnahType;         // עונה שנקבעה (יום/לילה)
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// ====================================
// הפסק טהרה
// ====================================

export interface HefsekhTahara {
  id?: string;
  userId: string;
  vesetEventId: string;   // קשור לאירוע וסת ספציפי
  date: Date;
  time?: string;
  onah: OnahType;
  createdAt?: Date;
  updatedAt?: Date;
}

// ====================================
// סוגי וסתות
// ====================================

export type VesetType = 
  | 'yom_hachodesh'       // יום החודש
  | 'yom_30'              // יום השלושים
  | 'haflagah'            // הפלגה
  | 'minimum_days';       // 5 ימים מינימום

export interface CalculatedVeset {
  type: VesetType;
  date: Date;
  onah: OnahType;
  reason: string;         // הסבר בעברית
  isActive: boolean;      // האם הווסת פעיל
}

// ====================================
// תאריכים מחושבים
// ====================================

export type DateStatus = 
  | 'prohibited'          // אסור
  | 'hefsek_day'          // יום ההפסק טהרה (סטטוס נפרד כדי לאפשר צבע כחול)
  | 'clean_day'           // יום נקי (מתוך 7)
  | 'mikvah_night'        // ליל מקווה
  | 'permitted'           // מותר
  | 'uncertain';          // ספק

export interface CalculatedDate {
  date: Date;
  hebrewDate: string;
  status: DateStatus;
  onah: OnahType;
  vesetTypes: VesetType[];  // איזה סוגי וסתות חלים
  cleanDayNumber?: number;  // אם זה יום נקי - מספר היום (1-7)
  reason: string;           // הסבר מפורט
}

// ====================================
// מיקום משתמש (לחישוב זמנים)
// ====================================

export interface UserLocation {
  latitude: number;
  longitude: number;
  timezone: string;       // e.g., 'Asia/Jerusalem'
  locationName?: string;  // e.g., 'ירושלים'
}

// ====================================
// פרופיל משתמש
// ====================================

export interface UserProfile {
  id: string;
  email: string;
  halachicSettings: HalachicSettings;
  location: UserLocation;
  onboardingCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ====================================
// תוצאות חישוב
// ====================================

export interface TaharaCalculationResult {
  prohibitedDates: CalculatedDate[];
  cleanDays: CalculatedDate[];
  mikvahNight?: CalculatedDate;
  nextVesatot: CalculatedVeset[];
}

// ====================================
// היסטוריה להצגה
// ====================================

export interface VesetHistory {
  events: VesetEvent[];
  hefsekhTaharot: HefsekhTahara[];
}

// ====================================
// זמני היום (לחישוב עונות)
// ====================================

export interface DayZmanim {
  date: Date;
  sunrise: Date;
  sunset: Date;
  chatzot: Date;         // חצות היום
  tzeitHakochavim: Date; // צאת הכוכבים
}

// ====================================
// תוצאת הפלגה
// ====================================

export interface HaflagahResult {
  interval: number;       // מספר ימים
  nextDate: Date;
  onah: OnahType;
  basedOnEvents: {
    from: VesetEvent | HefsekhTahara;
    to: VesetEvent;
  };
}

// ====================================
// תצוגת לוח שנה
// ====================================

export interface CalendarDay {
  gregorianDate: Date;
  hebrewDate: string;
  hebrewMonth: string;
  hebrewYear: number;
  dayOfWeek: string;
  calculatedDate?: CalculatedDate;
  isToday: boolean;
  isCurrentMonth: boolean;
}

export interface CalendarMonth {
  month: number;          // 1-12
  year: number;
  hebrewMonth: string;
  hebrewYear: number;
  days: CalendarDay[];
}

// ====================================
// בקשות API
// ====================================

export interface AddVesetRequest {
  date: string;           // ISO date string
  time?: string;          // HH:MM
  notes?: string;
}

export interface AddHefsekhRequest {
  vesetEventId: string;
  date: string;
  time?: string;
}

export interface UpdateSettingsRequest {
  halachicSettings?: Partial<HalachicSettings>;
  location?: Partial<UserLocation>;
}

// ====================================
// תשובות API
// ====================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CalculationResponse extends ApiResponse<TaharaCalculationResult> {
  calculatedAt: Date;
  validUntil?: Date;      // עד מתי התוצאה בתוקף
}
