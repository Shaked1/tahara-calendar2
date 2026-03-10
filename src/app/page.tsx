/**
 * דף בית - Landing Page
 */

import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold font-hebrew">מערכת לוח טהרה</h1>
          <div className="flex gap-2">
            <Link href="/about">
              <Button variant="ghost">אודות</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline">התחברות</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* כותרת ראשית */}
            <div className="space-y-4">
              <h2 className="text-5xl font-bold font-hebrew leading-tight">
                מערכת הלכתית מדויקת
                <br />
                לניהול לוח טהרה
              </h2>
              <p className="text-xl text-muted-foreground">
                חישובים אוטומטיים, לוח עברי-לועזי, ותמיכה במובייל
              </p>
            </div>

            {/* כפתורי Call to Action */}
            <div className="flex gap-4 justify-center">
              <Link href="/onboarding">
                <Button size="lg" className="text-lg px-8">
                  התחילו עכשיו בחינם
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  יש לי חשבון
                </Button>
              </Link>
            </div>

            {/* תכונות עיקריות */}
            <div className="grid md:grid-cols-3 gap-8 pt-16">
              <FeatureCard
                icon="📅"
                title="לוח עברי מדויק"
                description="תאריכים בגימטריה, חודשים עבריים, וחישוב עונות מדויק"
              />
              <FeatureCard
                icon="🕐"
                title="חישובים אוטומטיים"
                description="וסתות קבועות, 7 ימים נקיים, וליל טבילה"
              />
              <FeatureCard
                icon="📱"
                title="אפליקציה למובייל"
                description="עובדת על כל מכשיר - מחשב, טאבלט וסמארטפון"
              />
              <FeatureCard
                icon="🔒"
                title="פרטיות מלאה"
                description="כל המידע שלך מוצפן ומאובטח"
              />
              <FeatureCard
                icon="⚖️"
                title="4 שיטות הלכתיות"
                description="הרב עובדיה יוסף, בן איש חי, חזון איש, חב&quot;ד ועוד"
              />
              <FeatureCard
                icon="🌍"
                title="תמיכה בעברית"
                description="ממשק מלא בעברית"
              />
            </div>

            {/* הצהרת אחריות */}
            <div className="mt-16 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <span className="text-3xl">⚠️</span>
                <div className="text-right">
                  <h3 className="font-bold text-lg mb-2">הצהרת אחריות הלכתית</h3>
                  <p className="text-sm text-muted-foreground">
                    מערכת זו היא כלי עזר טכנולוגי בלבד ואינה מחליפה התייעצות עם רב פוסק.
                    כל שאלה הלכתית חייבת להיות מופנית לרב מוסמך.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>בנוי באהבה למען שמירת טהרת המשפחה בעם ישראל 🕊️</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { 
  icon: string; 
  title: string; 
  description: string;
}) {
  return (
    <div className="p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="font-bold text-lg mb-2 font-hebrew">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
