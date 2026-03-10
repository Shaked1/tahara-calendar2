# 📁 מבנה תיקיות מפורט - כל קובץ במקומו

## 🌳 מבנה עץ מלא

```
tahara-calendar/
│
├── 📄 .env.example                           # דוגמה למשתני סביבה
├── 📄 .eslintrc.json                         # הגדרות ESLint
├── 📄 .gitignore                             # קבצים להתעלם מהם ב-Git
│
├── 📚 ARCHITECTURE.md                         # הסבר ארכיטקטורה מפורט
├── 📚 FILE_LIST.md                            # רשימת קבצים
├── 📚 INSTALLATION.md                         # מדריך התקנה צעד אחר צעד
├── 📚 PROJECT_SUMMARY.md                      # סיכום מה נבנה
├── 📚 QUICK_START.md                          # התחלה מהירה
├── 📚 README.md                               # מסמך ראשי
│
├── 🐳 Dockerfile                              # Docker image
├── 🐳 docker-compose.yml                      # Docker compose
│
├── ⚙️ jest.config.js                         # הגדרות בדיקות Jest
├── ⚙️ jest.setup.js                          # Setup לבדיקות
├── ⚙️ next.config.js                         # הגדרות Next.js + PWA
├── ⚙️ package.json                           # תלויות ו-scripts
├── ⚙️ postcss.config.js                      # הגדרות PostCSS
├── ⚙️ tailwind.config.js                     # הגדרות Tailwind CSS
├── ⚙️ tsconfig.json                          # הגדרות TypeScript
│
├── 📱 public/
│   └── manifest.json                         # הגדרות PWA
│
├── 🛠️ scripts/
│   └── setup-database.js                     # סקריפט הגדרת DB
│
├── 🗄️ supabase/
│   └── migrations/
│       └── 001_initial_schema.sql            # יצירת טבלאות
│
├── 💻 src/
│   │
│   ├── 📄 middleware.ts                      # אימות משתמשים
│   │
│   ├── 🎨 app/
│   │   ├── layout.tsx                        # Layout ראשי
│   │   ├── page.tsx                          # דף בית (Landing)
│   │   ├── globals.css                       # CSS גלובלי
│   │   │
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       └── page.tsx                  # דף התחברות
│   │   │
│   │   ├── (main)/
│   │   │   └── calendar/
│   │   │       └── page.tsx                  # לוח שנה ראשי
│   │   │
│   │   └── onboarding/
│   │       └── page.tsx                      # תהליך קליטה
│   │
│   ├── 🧩 components/
│   │   │
│   │   ├── calendar/
│   │   │   ├── AddVesetModal.tsx             # מודאל הוספת וסת
│   │   │   ├── CalendarDay.tsx               # תא יום בודד
│   │   │   └── CalendarGrid.tsx              # רשת לוח שנה
│   │   │
│   │   ├── onboarding/
│   │   │   ├── HistoryInput.tsx              # הזנת 6 חודשים
│   │   │   └── MethodSelector.tsx            # בחירת שיטה
│   │   │
│   │   └── ui/
│   │       ├── Button.tsx                    # כפתור
│   │       ├── Card.tsx                      # כרטיס
│   │       └── Input.tsx                     # שדה קלט
│   │
│   ├── 💎 lib/
│   │   │
│   │   ├── halacha/                          # לוגיקה הלכתית
│   │   │   ├── calculator.ts                 # מחלקה מרכזית
│   │   │   ├── onot.ts                       # חישוב עונות
│   │   │   ├── sevenCleanDays.ts             # 7 ימים נקיים
│   │   │   └── vesatot.ts                    # חישוב וסתות
│   │   │
│   │   ├── hebrew-calendar/
│   │   │   └── index.ts                      # לוח עברי
│   │   │
│   │   ├── supabase/
│   │   │   ├── client.ts                     # חיבור Supabase
│   │   │   └── vesatot.ts                    # API לוסתות
│   │   │
│   │   ├── utils/
│   │   │   └── index.ts                      # פונקציות עזר
│   │   │
│   │   └── zmanim/
│   │       └── index.ts                      # זמני יום
│   │
│   └── 📐 types/
│       ├── database.ts                       # Types למסד נתונים
│       └── index.ts                          # Types ראשיים
│
└── 🧪 tests/
    └── unit/
        └── halacha/
            └── vesatot.test.ts               # בדיקות וסתות
```

---

## 📊 סיכום לפי תיקיות

### 📂 שורש הפרויקט (17 קבצים)
```
tahara-calendar/
├── .env.example
├── .eslintrc.json
├── .gitignore
├── ARCHITECTURE.md
├── Dockerfile
├── docker-compose.yml
├── FILE_LIST.md
├── INSTALLATION.md
├── jest.config.js
├── jest.setup.js
├── next.config.js
├── package.json
├── postcss.config.js
├── PROJECT_SUMMARY.md
├── QUICK_START.md
├── README.md
├── tailwind.config.js
└── tsconfig.json
```

### 📂 public/ (1 קובץ)
```
public/
└── manifest.json
```

### 📂 scripts/ (1 קובץ)
```
scripts/
└── setup-database.js
```

### 📂 supabase/ (1 קובץ)
```
supabase/
└── migrations/
    └── 001_initial_schema.sql
```

### 📂 src/ (28 קבצים)
```
src/
├── middleware.ts

├── app/ (6 קבצים)
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   ├── (auth)/login/page.tsx
│   ├── (main)/calendar/page.tsx
│   └── onboarding/page.tsx

├── components/ (8 קבצים)
│   ├── calendar/
│   │   ├── AddVesetModal.tsx
│   │   ├── CalendarDay.tsx
│   │   └── CalendarGrid.tsx
│   ├── onboarding/
│   │   ├── HistoryInput.tsx
│   │   └── MethodSelector.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Card.tsx
│       └── Input.tsx

├── lib/ (9 קבצים)
│   ├── halacha/
│   │   ├── calculator.ts
│   │   ├── onot.ts
│   │   ├── sevenCleanDays.ts
│   │   └── vesatot.ts
│   ├── hebrew-calendar/
│   │   └── index.ts
│   ├── supabase/
│   │   ├── client.ts
│   │   └── vesatot.ts
│   ├── utils/
│   │   └── index.ts
│   └── zmanim/
│       └── index.ts

└── types/ (2 קבצים)
    ├── database.ts
    └── index.ts
```

### 📂 tests/ (1 קובץ)
```
tests/
└── unit/
    └── halacha/
        └── vesatot.test.ts
```

---

## 🔢 סיכום מספרי

| תיקייה | קבצים |
|--------|-------|
| 📂 שורש | 17 |
| 📂 public | 1 |
| 📂 scripts | 1 |
| 📂 supabase | 1 |
| 📂 src/app | 6 |
| 📂 src/components | 8 |
| 📂 src/lib | 9 |
| 📂 src/types | 2 |
| 📂 src (middleware) | 1 |
| 📂 tests | 1 |
| **סה"כ** | **47** |

---

## 📋 רשימה לפי סוג קובץ

### 📄 TypeScript/React (30 קבצים)
- **Pages (דפים):** 5 קבצים `.tsx`
- **Components:** 8 קבצים `.tsx`
- **Logic:** 9 קבצים `.ts`
- **Types:** 2 קבצים `.ts`
- **Config:** 6 קבצים `.js`/`.ts`

### 📄 תצורה (9 קבצים)
- `.eslintrc.json`
- `jest.config.js`
- `jest.setup.js`
- `next.config.js`
- `package.json`
- `postcss.config.js`
- `tailwind.config.js`
- `tsconfig.json`
- `.env.example`

### 📄 תיעוד (6 קבצים)
- `README.md`
- `ARCHITECTURE.md`
- `INSTALLATION.md`
- `PROJECT_SUMMARY.md`
- `QUICK_START.md`
- `FILE_LIST.md`

### 📄 אחר (2 קבצים)
- `Dockerfile`
- `docker-compose.yml`
- `.gitignore`
- `manifest.json`
- `setup-database.js`
- `001_initial_schema.sql`

---

## ✅ כל הקבצים קיימים ומוכנים!

**סה"כ 47 קבצים** מאורגנים היטב בתיקיות לוגיות.
