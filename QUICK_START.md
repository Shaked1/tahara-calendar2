# 🚀 Quick Start Guide

רוצה להתחיל מהר? הנה המדריך הכי קצר!

## ⚡ התקנה מהירה (5 דקות)

### 1. דרישות
```bash
node --version  # צריך 18+
npm --version   # צריך 9+
```

### 2. הורד והתקן
```bash
cd tahara-calendar
npm install
```

### 3. הגדר Supabase
1. לך ל-https://supabase.com
2. צור פרויקט חדש (חינם)
3. המתן 2-3 דקות
4. לחץ Settings → API
5. העתק את:
   - Project URL
   - anon public key

### 4. הגדר Environment
```bash
cp .env.example .env.local
# ערוך .env.local והדבק את הפרטים שלך
```

### 5. צור טבלאות
1. ב-Supabase Dashboard: לחץ SQL Editor
2. לחץ New Query
3. העתק את `supabase/migrations/001_initial_schema.sql`
4. הדבק והרץ (Ctrl+Enter)

### 6. הרץ!
```bash
npm run dev
```

גש ל-http://localhost:3000

---

## 🎯 שלבים ראשונים

1. **הרשמה** - לחץ "התחילו עכשיו"
2. **בחר שיטה** - בחר את השיטה ההלכתית שלך
3. **הזן היסטוריה** - הזן 2-3 וסתות אחרונות
4. **התחל לעקוב!** - המערכת תחשב הכל אוטומטית

---

## 🆘 בעיות?

### npm install נכשל
```bash
npm cache clean --force
npm install --legacy-peer-deps
```

### Supabase לא מתחבר
- בדוק ש-URL ו-KEY נכונים ב-.env.local
- ודא שהפרויקט ב-Supabase פעיל

### שגיאה "Cannot find module"
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 📖 מסמכים נוספים

- **INSTALLATION.md** - מדריך מפורט
- **ARCHITECTURE.md** - הסבר טכני
- **PROJECT_SUMMARY.md** - סיכום המערכת
- **README.md** - מידע כללי

---

## 💡 טיפים

1. **הוסף לפחות 3 וסתות** בהיסטוריה לחישובים מדויקים
2. **שמור את מיקומך** בהגדרות לזמני זריחה/שקיעה מדויקים
3. **התייעץ עם רב** בכל שאלה הלכתית

---

**בהצלחה! 🎉**
