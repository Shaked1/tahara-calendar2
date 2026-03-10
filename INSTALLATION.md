# 🚀 מדריך התקנה והרצה מפורט

## תוכן עניינים
1. [דרישות מקדימות](#דרישות-מקדימות)
2. [התקנה בסיסית](#התקנה-בסיסית)
3. [הגדרת Supabase](#הגדרת-supabase)
4. [הרצה מקומית](#הרצה-מקומית)
5. [בדיקות](#בדיקות)
6. [פריסה לפרודקשן](#פריסה-לפרודקשן)
7. [פתרון בעיות](#פתרון-בעיות)

---

## דרישות מקדימות

### תוכנות נדרשות:
- ✅ Node.js גרסה 18 ומעלה
- ✅ npm (מגיע עם Node.js) או yarn
- ✅ Git
- ✅ עורך קוד (מומלץ VS Code)

### בדיקת התקנה:
```bash
node --version    # צריך להציג v18.0.0 ומעלה
npm --version     # צריך להציג 9.0.0 ומעלה
```

### התקנת Node.js (אם חסר):
**Windows:**
הורד מ-https://nodejs.org

**Mac:**
```bash
brew install node
```

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

---

## התקנה בסיסית

### שלב 1: הורדת הפרויקט

```bash
# אם הפרויקט ב-Git:
git clone [repository-url]
cd tahara-calendar

# או אם קיבלת קובץ ZIP:
unzip tahara-calendar.zip
cd tahara-calendar
```

### שלב 2: התקנת תלויות

```bash
npm install
```

**זמן משוער:** 2-5 דקות (תלוי במהירות האינטרנט)

אם נתקלת בשגיאות, נסה:
```bash
npm install --legacy-peer-deps
```

---

## הגדרת Supabase

### שלב 1: יצירת חשבון Supabase

1. היכנס ל-https://supabase.com
2. לחץ על "Start your project"
3. צור חשבון (חינם לגמרי)
4. לחץ על "New Project"

### שלב 2: פרטי הפרויקט

בעמוד יצירת הפרויקט:
- **Name**: `tahara-calendar` (או כל שם אחר)
- **Database Password**: בחר סיסמה חזקה ושמור אותה!
- **Region**: בחר `Southeast Asia (Singapore)` (הכי קרוב לישראל)
- לחץ "Create new project"

⏱️ **המתן 2-3 דקות** עד שהפרויקט יהיה מוכן.

### שלב 3: העתקת פרטי החיבור

1. בפאנל השמאלי, לחץ על ⚙️ **Settings**
2. לחץ על **API**
3. העתק את:
   - **Project URL** (משהו כמו: `https://xxxxx.supabase.co`)
   - **anon public** key (מפתח ארוך)

### שלב 4: יצירת קובץ סביבה

בתיקיית הפרויקט:

```bash
cp .env.example .env.local
```

ערוך את `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

**⚠️ חשוב:** אל תעלה את הקובץ `.env.local` ל-Git!

### שלב 5: יצירת טבלאות בבסיס הנתונים

**אופציה א' - דרך Supabase Dashboard:**

1. בפאנל השמאלי, לחץ על **SQL Editor**
2. לחץ על **New query**
3. העתק את כל התוכן של הקובץ:
   ```
   supabase/migrations/001_initial_schema.sql
   ```
4. הדבק ב-SQL Editor
5. לחץ **Run** (או Ctrl+Enter)

צריך להופיע: ✅ "Success. No rows returned"

**אופציה ב' - דרך סקריפט (דורש הגדרת Supabase CLI):**

```bash
npm run setup-db
```

### שלב 6: אימות Email (אופציונלי אך מומלץ)

1. ב-Supabase Dashboard, לך ל-**Authentication** → **Providers**
2. ודא ש-**Email** מסומן (ברירת מחדל)
3. בהגדרות **Email Templates**, תוכל להתאים את המיילים העבריים

---

## הרצה מקומית

### הפעלת שרת הפיתוח

```bash
npm run dev
```

**פלט מצופה:**
```
▲ Next.js 14.1.0
- Local:        http://localhost:3000
- Network:      http://192.168.1.x:3000

✓ Ready in 2.3s
```

### פתיחת האתר

פתח דפדפן בכתובת: **http://localhost:3000**

אם הכל עובד, תראה את מסך הכניסה / הרשמה.

---

## בדיקות

### הרצת בדיקות יחידה

```bash
npm test
```

### הרצה במצב watch (מומלץ בפיתוח)

```bash
npm run test:watch
```

### בדיקת כיסוי קוד

```bash
npm run test:coverage
```

יווצר תיקיה `/coverage` עם דוח HTML.

---

## פריסה לפרודקשן

### אופציה 1: Vercel (הכי פשוט ומומלץ)

1. היכנס ל-https://vercel.com
2. התחבר עם GitHub
3. לחץ "Import Project"
4. בחר את הפרויקט
5. הוסף את משתני הסביבה:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. לחץ "Deploy"

⏱️ **הפריסה תיקח 2-3 דקות**

הפרויקט יהיה זמין בכתובת: `https://your-project.vercel.app`

### אופציה 2: Docker

```bash
# בניית Image
docker build -t tahara-calendar .

# הרצה
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your_url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key \
  tahara-calendar
```

### אופציה 3: שרת ידני (VPS)

```bash
# בניה
npm run build

# הרצה
npm start
```

מומלץ להשתמש ב-PM2:
```bash
npm install -g pm2
pm2 start npm --name "tahara-calendar" -- start
```

---

## פתרון בעיות

### בעיה: `npm install` נכשל

**פתרון 1:**
```bash
npm cache clean --force
npm install
```

**פתרון 2:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### בעיה: "Cannot find module"

```bash
npm install
```

### בעיה: שגיאת Supabase Connection

**בדיקות:**
1. ודא שהעתקת נכון את ה-URL וה-Key
2. בדוק אם הפרויקט ב-Supabase פעיל
3. נסה לרענן את הדף ב-Supabase Dashboard

**בדיקה טכנית:**
```bash
# פתח Node REPL:
node

# הרץ:
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('YOUR_URL', 'YOUR_KEY');
supabase.from('users_profile').select('*').then(console.log);
```

### בעיה: הדף לא נטען (שגיאה 500)

**בדוק את הקונסול:**
```bash
npm run dev
```

חפש שגיאות באדום.

### בעיה: העברית לא מוצגת נכון

**ודא:**
1. התג `<html>` כולל `dir="rtl"`
2. הפונטים העבריים נטענים
3. CSS כולל תמיכה ב-RTL

### בעיה: PWA לא עובדת

**בדוק:**
1. `manifest.json` קיים ב-`/public`
2. האייקונים קיימים ב-`/public/icons`
3. האתר רץ ב-HTTPS (PWA דורש HTTPS)

---

## 🔧 פקודות שימושיות

```bash
# פיתוח
npm run dev           # הרצת שרת פיתוח
npm run build         # בניה לפרודקשן
npm start             # הרצת גרסת פרודקשן
npm run lint          # בדיקת קוד
npm run type-check    # בדיקת TypeScript

# בדיקות
npm test              # הרצת בדיקות
npm run test:watch    # בדיקות במצב watch
npm run test:coverage # דוח כיסוי

# Supabase
npm run setup-db      # יצירת טבלאות

# ניקוי
rm -rf .next          # ניקוי build cache
rm -rf node_modules   # ניקוי תלויות
```

---

## 📚 משאבים נוספים

- [תיעוד Next.js](https://nextjs.org/docs)
- [תיעוד Supabase](https://supabase.com/docs)
- [תיעוד React](https://react.dev)
- [תיעוד TypeScript](https://www.typescriptlang.org/docs)

---

## 🆘 עזרה נוספת

אם נתקלת בבעיה שלא מופיעה כאן:

1. בדוק את הקונסול לשגיאות
2. חפש בתיעוד הרשמי
3. צור issue בגיטהאב (אם קיים)
4. פנה לתמיכה הטכנית

---

**בהצלחה! 🎉**
