# מערכת לוח טהרה (נידה) - Tahara Calendar System

מערכת הלכתית מדויקת לניהול לוח טהרה, המתאימה לשימוש אמיתי לפי פוסקי ההלכה.

## ⚠️ הצהרת אחריות הלכתית

**חשוב ביותר:**
- מערכת זו היא כלי עזר טכנולוגי בלבד
- **אין להסתמך על המערכת ללא התייעצות עם רב פוסק**
- כל שאלה הלכתית חייבת להיות מופנית לרב מוסמך
- המערכת לא מחליפה פסיקה הלכתית אישית

## 🎯 תכונות עיקריות

- ✅ תמיכה ב-5 שיטות הלכתיות (עובדיה יוסף, בן איש חי, חזון איש, חב"ד, + תוספות)
- ✅ חישוב אוטומטי של עונות (יום/לילה לפי זמני זריחה ושקיעה)
- ✅ חישוב וסתות: יום החודש, יום 30, הפלגה
- ✅ מעקב אחר 7 ימים נקיים וימי טבילה
- ✅ לוח שנה עברי-גרגוריאני משולב
- ✅ תמיכה מלאה ב-PWA (אפליקציה סלולרית)
- ✅ תמיכה מלאה בעברית (RTL)

## 📋 דרישות מערכת

- Node.js 18+ 
- npm או yarn
- חשבון Supabase (בחינם)

## 🚀 התקנה והרצה מקומית

### שלב 1: הורדת הפרויקט
```bash
cd tahara-calendar
```

### שלב 2: התקנת תלויות
```bash
npm install
```

### שלב 3: הגדרת Supabase

1. היכנס ל-https://supabase.com וצור פרויקט חדש
2. העתק את ה-URL וה-API Key מהפרויקט
3. צור קובץ `.env.local`:

```bash
cp .env.example .env.local
```

4. ערוך את `.env.local` והוסף את הפרטים שלך:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### שלב 4: הרצת הסקריפט ליצירת טבלאות

```bash
npm run setup-db
```

או הרץ את הקבצים ב-`/supabase/migrations` ישירות ב-Supabase SQL Editor.

### שלב 5: הרצת השרת המקומי

```bash
npm run dev
```

האתר יהיה זמין בכתובת: http://localhost:3000

## 📱 בניית אפליקציה למובייל (PWA)

המערכת בנויה כ-PWA ומאפשרת התקנה במכשיר:

```bash
npm run build
npm run start
```

משתמשים יוכלו להוסיף את האפליקציה למסך הבית במכשיר הסלולרי.

## 🏗️ מבנה הפרויקט

```
tahara-calendar/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # דפי התחברות
│   │   ├── (main)/            # דפים ראשיים (לוח שנה)
│   │   └── onboarding/        # תהליך קליטה ראשוני
│   ├── components/            # קומפוננטות React
│   │   ├── calendar/          # לוח שנה
│   │   ├── onboarding/        # קליטה
│   │   └── ui/                # קומפוננטות בסיס
│   ├── lib/                   # לוגיקה עסקית
│   │   ├── halacha/           # חישובים הלכתיים (CORE)
│   │   ├── hebrew-calendar/   # לוח עברי
│   │   ├── zmanim/           # זמני היום
│   │   └── supabase/         # אינטגרציה עם DB
│   ├── types/                 # TypeScript definitions
│   └── utils/                 # פונקציות עזר
├── supabase/
│   ├── migrations/            # סקריפטים ליצירת טבלאות
│   └── seed/                  # נתוני דוגמה
├── public/                    # קבצים סטטיים + PWA
└── tests/                     # בדיקות יחידה

```

## 🧪 הרצת בדיקות

```bash
npm run test              # הרצת כל הבדיקות
npm run test:watch        # מצב watch
npm run test:coverage     # דוח כיסוי
```

**חשוב:** הלוגיקה ההלכתית עברה בדיקות יחידה מקיפות.

## 🔧 טכנולוגיות

- **Frontend:** Next.js 14 + React 18 + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Hebrew Calendar:** @hebcal/core
- **Zmanim:** KosherZmanim
- **PWA:** next-pwa
- **Testing:** Jest + React Testing Library

## 📚 מבנה הלוגיקה ההלכתית

הלוגיקה ההלכתית נמצאת ב-`src/lib/halacha/` ומפוצלת למודולים:

- `onot.ts` - חישוב עונות יום ולילה
- `vesatot.ts` - חישוב וסתות (יום החודש, יום 30, הפלגה)
- `sevenCleanDays.ts` - חישוב 7 ימים נקיים
- `calculator.ts` - מחלקה מרכזית המשלבת את כל החישובים
- `methods/` - מימוש ספציפי לכל שיטה הלכתית

### דוגמת שימוש:

```typescript
import { TaharaCalculator } from '@/lib/halacha/calculator';

const calculator = new TaharaCalculator({
  method: 'ovadia_yosef',
  orZarua: true,
  yom31: false,
  maatLeat: true
});

// חישוב עונות
const prohibitedDates = calculator.calculateProhibitedDates(
  vesotHistory,
  userLocation
);
```

## 🗄️ מבנה בסיס הנתונים

### טבלאות עיקריות:

1. **users_profile** - פרופיל משתמש והגדרות הלכתיות
2. **veset_events** - היסטוריית וסתות
3. **hefsek_tahara** - רישום הפסקי טהרה
4. **calculated_dates** - תאריכים מחושבים (cache)

## 🌐 פריסה (Deployment)

### Vercel (מומלץ):

```bash
npm install -g vercel
vercel
```

### Docker:

```bash
docker build -t tahara-calendar .
docker run -p 3000:3000 tahara-calendar
```

## 🔐 אבטחה

- כל הנתונים מוצפנים
- אימות משתמשים דרך Supabase Auth
- Row Level Security (RLS) על כל הטבלאות
- HTTPS בפרודקשן
- אין שמירת מידע רגיש בלוגים

## 📞 תמיכה ופידבק

למצאת באג או שאלה הלכתית? אנא פנה לרב המייעץ של הפרויקט.

## 📄 רישיון

פרויקט זה מיועד לשימוש פרטי בלבד. אין להפיץ ללא אישור.

---

**בנוי באהבה למען שמירת טהרת המשפחה בעם ישראל** 🕊️
