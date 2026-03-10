/**
 * דף אודות המערכת
 */

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ArrowRight, CheckCircle2, Heart, Shield, Code, Book } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold font-hebrew">אודות המערכת</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* מבוא */}
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold font-hebrew">
              מערכת לוח טהרה
            </h2>
            <p className="text-xl text-muted-foreground">
              כלי עזר טכנולוגי לניהול טהרת המשפחה בעם ישראל
            </p>
          </div>

          {/* מטרת המערכת */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-6 w-6 text-red-500" />
                מטרת המערכת
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                מערכת לוח הטהרה נבנתה מתוך רצון לסייע לנשות ישראל בשמירה על דיני טהרת המשפחה
                באמצעות כלי טכנולוגי מתקדם, מדויק ופשוט לשימוש.
              </p>
              <p>
                המערכת מבצעת חישובים הלכתיים מורכבים באופן אוטומטי, תוך התחשבות בשיטות פסיקה שונות
                ובמנהגים המקובלים בעדות ישראל השונות.
              </p>
            </CardContent>
          </Card>

          {/* תכונות */}
          <div>
            <h3 className="text-2xl font-bold mb-6 font-hebrew">תכונות עיקריות</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <FeatureCard
                icon={<CheckCircle2 className="h-8 w-8 text-green-600" />}
                title="חישובים אוטומטיים"
                description="המערכת מחשבת אוטומטית את כל הוסתות הקבועות, ימי האיסור, 7 הימים הנקיים וליל הטבילה"
              />
              <FeatureCard
                icon={<Book className="h-8 w-8 text-blue-600" />}
                title="5 שיטות הלכתיות"
                description="תמיכה בשיטות: רב עובדיה יוסף, בן איש חי, חזון איש, חב&quot;ד, ועוד תוספות"
              />
              <FeatureCard
                icon={<Code className="h-8 w-8 text-purple-600" />}
                title="לוח עברי מדויק"
                description="תאריכים עבריים בגימטריה, חישוב זמני זריחה ושקיעה לפי מיקום, ועונות מדויקות"
              />
              <FeatureCard
                icon={<Shield className="h-8 w-8 text-indigo-600" />}
                title="פרטיות מלאה"
                description="כל המידע מוצפן ומאובטח. רק את יכולה לגשת לנתונים שלך"
              />
            </div>
          </div>

          {/* הצהרת אחריות */}
          <Card className="bg-yellow-50 border-yellow-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-900">
                <Shield className="h-6 w-6" />
                הצהרת אחריות הלכתית
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-yellow-900">
              <p className="font-semibold">
                חשוב להדגיש:
              </p>
              <ul className="list-disc list-inside space-y-2 mr-4">
                <li>
                  מערכת זו היא <strong>כלי עזר טכנולוגי בלבד</strong>
                </li>
                <li>
                  המערכת <strong>אינה מחליפה התייעצות עם רב פוסק מוסמך</strong>
                </li>
                <li>
                  כל שאלה הלכתית, ספק או מקרה חריג חייבים להיות מופנים לרב
                </li>
                <li>
                  המערכת משמשת למעקב ולתזכורת בלבד, ולא לפסיקה הלכתית
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* טכנולוגיה */}
          <Card>
            <CardHeader>
              <CardTitle>טכנולוגיה מתקדמת</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p>
                המערכת בנויה על טכנולוגיות מתקדמות ומודרניות:
              </p>
              <ul className="list-disc list-inside space-y-2 mr-4 text-muted-foreground">
                <li><strong>Next.js 14</strong> - framework מתקדם לבניית אפליקציות</li>
                <li><strong>TypeScript</strong> - שפת תכנות מוקלדת למניעת שגיאות</li>
                <li><strong>Supabase</strong> - בסיס נתונים מאובטח בענן</li>
                <li><strong>@hebcal/core</strong> - ספרייה מקצועית ללוח עברי</li>
                <li><strong>KosherZmanim</strong> - חישוב זמני היום לפי הלכה</li>
                <li><strong>PWA</strong> - אפליקציה למובייל הניתנת להתקנה</li>
              </ul>
            </CardContent>
          </Card>

          {/* קוד פתוח */}
          <Card>
            <CardHeader>
              <CardTitle>שקיפות מלאה</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p>
                הקוד של המערכת נבנה בשקיפות מלאה, כך שניתן לבדוק ולאמת את החישובים ההלכתיים.
              </p>
              <p className="text-sm text-muted-foreground">
                רבנים ופוסקים מוזמנים לבדוק את הלוגיקה ההלכתית ולוודא את דיוקה.
              </p>
            </CardContent>
          </Card>

          {/* יצירת קשר */}
          <Card className="text-center">
            <CardContent className="py-8">
              <h3 className="text-xl font-bold mb-4 font-hebrew">שאלות? הערות?</h3>
              <p className="text-muted-foreground mb-6">
                נשמח לשמוע ממך ולעזור בכל שאלה
              </p>
              <div className="flex gap-4 justify-center">
                <Link href="/login">
                  <Button size="lg">
                    התחל להשתמש
                  </Button>
                </Link>
                <Link href="/">
                  <Button size="lg" variant="outline">
                    חזרה לדף הבית
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* פסוק */}
          <div className="text-center py-8 border-t">
            <p className="text-xl font-hebrew text-muted-foreground italic">
              "כִּי אֶל־אִישָׁהּ תְּשׁוּקָתֵךְ וְהוּא יִמְשָׁל־בָּךְ"
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              בראשית ג׳, ט״ז
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4">{icon}</div>
        <h4 className="font-bold text-lg mb-2 font-hebrew">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
