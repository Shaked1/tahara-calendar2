# הסבר ארכיטקטורה - מערכת לוח טהרה

## 📐 תכנון כללי

המערכת בנויה על פי עקרונות **Clean Architecture** עם הפרדה ברורה בין שכבות:

```
┌─────────────────────────────────────────┐
│           Presentation Layer            │
│   (React Components, Next.js Pages)     │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│         Application Layer               │
│    (Business Logic, Calculators)        │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│           Data Layer                    │
│     (Supabase, Database Access)         │
└─────────────────────────────────────────┘
```

## 🧩 מבנה התיקיות

### `/src/lib/halacha/` - ליבת החישובים ההלכתיים

זוהי השכבה הקריטית ביותר. **עצמאית לחלוטין** מה-UI ומבסיס הנתונים.

#### קבצים מרכזיים:

1. **`onot.ts`** - חישוב עונות (יום/לילה)
   - קובע אם אירוע התרחש ביום או בלילה
   - משתמש בזמני זריחה ושקיעה מדויקים
   - פונקציות עזר: `determineOnah()`, `oppositeOnah()`

2. **`vesatot.ts`** - חישוב וסתות קבועות
   - **יום החודש**: אותו תאריך עברי בחודש הבא
   - **יום 30**: 30 ימים מהווסת האחרונה
   - **הפלגה**: המרווח בין שתי וסתות (משתנה לפי שיטה)
   - פונקציה מרכזית: `calculateAllVesatot()`

3. **`sevenCleanDays.ts`** - חישוב 7 ימים נקיים
   - מינימום 5 ימים מתחילת וסת
   - 7 ימים נקיים מהפסק טהרה
   - ליל טבילה (יום ה-7)
   - פונקציות: `calculateSevenCleanDays()`, `calculateMikvahNight()`

4. **`calculator.ts`** - המחלקה המרכזית
   - משלבת את כל המודולים
   - ממשק API פשוט לשימוש
   - מחלקה: `TaharaCalculator`

#### דוגמת שימוש:

```typescript
const calculator = new TaharaCalculator(settings, location);
const result = calculator.calculateAll(history);

// result מכיל:
// - prohibitedDates: תאריכים אסורים
// - cleanDays: 7 ימים נקיים
// - mikvahNight: ליל טבילה
// - nextVesatot: וסתות קבועות הבאות
```

### `/src/lib/hebrew-calendar/` - לוח עברי

משתמש בספריה `@hebcal/core` לחישובים מדויקים:
- המרה בין לוח גרגוריאני לעברי
- פורמט תאריכים בגימטריה (א', ב', ג'...)
- חישוב "יום החודש" הבא
- קבלת שמות חודשים עבריים

### `/src/lib/zmanim/` - זמני היום

משתמש ב-`KosherZmanim` לחישוב:
- זריחה (הנץ החמה)
- שקיעה
- חצות היום
- צאת הכוכבים

חישובים מבוססי-מיקום מדויקים (GPS).

### `/src/lib/supabase/` - אינטגרציה עם DB

#### קבצים:
- **`client.ts`**: הגדרת Supabase client
- **`vesatot.ts`**: פונקציות לניהול אירועי וסת
- **`profile.ts`**: ניהול פרופיל משתמש (לא נוצר עדיין)

#### פונקציות מרכזיות:
```typescript
addVesetEvent()        // הוספת וסת חדשה
getUserVesetEvents()   // קבלת כל הוסתות
addHefsekhTahara()     // הוספת הפסק טהרה
getUserHistory()       // קבלת היסטוריה מלאה
```

## 🗄️ מבנה בסיס הנתונים

### טבלאות:

1. **`users_profile`**
   - פרופיל משתמש
   - הגדרות הלכתיות (שיטה, תוספות)
   - מיקום (לחישוב זמנים)

2. **`veset_events`**
   - אירועי וסת
   - תאריך + שעה (אופציונלי)
   - עונה (יום/לילה)

3. **`hefsek_tahara`**
   - הפסקי טהרה
   - מקושר לאירוע וסת ספציפי

4. **`calculated_dates`** (Cache)
   - תאריכים מחושבים
   - למניעת חישוב מחדש כל פעם

### Row Level Security (RLS)

כל הטבלאות מוגנות ב-RLS:
- משתמש רואה רק את הנתונים שלו
- אין גישה לנתונים של משתמשות אחרות

## 🎨 שכבת ה-UI

### Next.js 14 App Router

```
/src/app/
  ├── (auth)/           # דפי התחברות
  │   ├── login/
  │   └── signup/
  ├── (main)/           # דפים ראשיים (מחייב אימות)
  │   ├── calendar/     # לוח השנה הראשי
  │   └── settings/     # הגדרות
  └── onboarding/       # תהליך קליטה ראשוני
```

### קומפוננטות (לא נוצרו עדיין):

```
/src/components/
  ├── calendar/
  │   ├── CalendarGrid.tsx       # רשת לוח שנה
  │   ├── CalendarDay.tsx        # תא יום בודד
  │   └── CalendarLegend.tsx     # מקרא צבעים
  ├── onboarding/
  │   ├── MethodSelector.tsx     # בחירת שיטה הלכתית
  │   ├── HistoryInput.tsx       # הזנת 6 חודשים
  │   └── OnboardingWizard.tsx   # wizard מלא
  └── ui/                        # קומפוננטות בסיס (buttons, inputs)
```

## 🔄 תזרים נתונים

### הוספת וסת חדשה:

```
1. משתמש מזין תאריך ושעה (UI)
   ↓
2. קריאה ל-addVesetEvent() (API)
   ↓
3. שמירה ב-Supabase
   ↓
4. חישוב מחדש של כל הוסתות (TaharaCalculator)
   ↓
5. עדכון התצוגה בלוח השנה
```

### טעינת לוח שנה:

```
1. טעינת היסטוריה מ-DB (getUserHistory)
   ↓
2. יצירת TaharaCalculator עם הגדרות משתמש
   ↓
3. חישוב עבור טווח תאריכים (חודש שלם)
   ↓
4. מיפוי כל תאריך לצבע ומידע
   ↓
5. רינדור לוח השנה
```

## 🧪 בדיקות

### מבנה בדיקות (לא נוצר עדיין):

```
/tests/
  ├── unit/
  │   ├── halacha/              # בדיקות לכל מודול הלכתי
  │   │   ├── onot.test.ts
  │   │   ├── vesatot.test.ts
  │   │   └── calculator.test.ts
  │   └── hebrew-calendar/
  └── integration/
      └── full-flow.test.ts     # בדיקת תזרים מלא
```

### דוגמת בדיקה:

```typescript
describe('calculateYomHachodesh', () => {
  it('should return same Hebrew date next month', () => {
    const veset = {
      date: new Date('2024-01-15'), // ג' שבט
      onah: 'day',
    };
    
    const result = calculateYomHachodesh(veset, location);
    
    expect(getHebrewDay(result.date)).toBe('ג');
    expect(result.onah).toBe('day');
  });
});
```

## 🔐 אבטחה

1. **אימות**: Supabase Auth (email-based)
2. **הרשאות**: RLS על כל הטבלאות
3. **הצפנה**: כל התקשורת ב-HTTPS
4. **פרטיות**: כל נתון שייך למשתמש ספציפי

## 📱 PWA (Progressive Web App)

המערכת תומכת ב-PWA באמצעות `next-pwa`:
- התקנה על מסך הבית
- עבודה אופליין (cache)
- התראות (בעתיד)

קבצים:
- `/public/manifest.json` - הגדרות PWA
- `/public/icons/` - אייקונים במידות שונות
- Service Worker נוצר אוטומטית

## 🌐 תמיכה בעברית

1. **RTL**: `dir="rtl"` ב-HTML
2. **פונטים עבריים**: Assistant + Frank Ruhl Libre
3. **Tailwind RTL**: פלאגין `tailwindcss-rtl`
4. **תאריכים**: `@hebcal/core` לפורמט גימטריה

## 🚀 פלואו פיתוח

1. **הרצה מקומית**:
```bash
npm install
npm run dev
```

2. **הרצת בדיקות**:
```bash
npm test
```

3. **בניה לפרודקשן**:
```bash
npm run build
npm start
```

4. **פריסה**:
   - Vercel (מומלץ - אינטגרציה מושלמת)
   - או Docker

## 📊 מטריקות ביצועים

### מטרות:
- **First Load**: < 2s
- **TTI (Time to Interactive)**: < 3s
- **Lighthouse Score**: > 90

### אופטימיזציות:
- Code splitting אוטומטי (Next.js)
- Image optimization
- Cache של חישובים
- Lazy loading של קומפוננטות

## 🔮 הרחבות עתידיות

### כבר מתוכנן:
- [ ] תמיכה בשיטות נוספות
- [ ] ייצוא ל-PDF/iCal
- [ ] התראות (ווסת קרובה)
- [ ] שיתוף עם בעל (בהסכמה)
- [ ] גרסת web widget לאתרים

### לשקול:
- [ ] שילוב עם Google Calendar
- [ ] AI לזיהוי דפוסים
- [ ] צ'אט עם רב מייעץ
- [ ] קהילת תמיכה

---

## 📝 הערות חשובות למפתח

1. **אל תשנה את הלוגיקה ההלכתית** ללא התייעצות עם רב פוסק
2. **כל שינוי בחישובים** חייב לעבור בדיקות מקיפות
3. **תעד כל החלטה הלכתית** בקוד עם הפניה למקור
4. **בדוק edge cases**: שנים מעוברות, יום 30 בחודש קצר, וכו'
5. **שמור על פרטיות** - זו מערכת רגישה מאוד

## 🆘 תמיכה

לשאלות טכניות: [טרם הוגדר]
לשאלות הלכתיות: **חובה להפנות לרב מוסמך**
