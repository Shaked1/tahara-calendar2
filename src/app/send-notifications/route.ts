export const dynamic = 'force-dynamic';
export const revalidate = 0; // מונע לחלוטין שמירה ב-Cache של Vercel

import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
  try {
    // 🔥 הטריק שחוסם את ה-Build מלקרוס:
    // אנחנו שולפים את ה-URL מה-request. זה מסמן ל-Next.js בזמן ה-Build: "זה נתיב דינמי לחלוטין שחייב משתמש אמיתי!"
    const { searchParams } = new URL(request.url);
    
    // אופציונלי: קוד אבטחה בסיסי (Cron Secret) כדי שלא כל אחד יוכל להפעיל לך את שליחת המיילים סתם כך
    // אם תרצי, תוכלי להגדיר אותו ב-Vercel בעתיד. כרגע זה פשוט ידלג על הבדיקה.
    const secret = searchParams.get('secret');
    if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date().toISOString();

    // שליפת התראות שהגיע זמנן ועדיין לא נשלחו
    const { data: pendingNotifications, error: fetchError } = await supabaseAdmin
      .from('scheduled_notifications')
      .select('*')
      .eq('sent', false)
      .lte('scheduled_for', now);

    if (fetchError) throw fetchError;

    if (!pendingNotifications || pendingNotifications.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No pending notifications to send right now.',
        checkedAt: now 
      });
    }

    console.log(`מנסה לשלוח ${pendingNotifications.length} התראות...`);
    const sentIds: string[] = [];

    for (const notification of pendingNotifications) {
      try {
        const { error: emailError } = await resend.emails.send({
          from: 'onboarding@resend.dev', 
          to: 'shaked14782@gmail.com', // המייל המורשה שלך לפיתוח
          subject: notification.title,
          text: notification.body,
        });

        if (emailError) {
          console.error(`נכשל שליחת מייל ל-${notification.user_email}:`, emailError);
          continue; 
        }

        sentIds.push(notification.id);
      } catch (err) {
        console.error(`שגיאה בתהליך השליחה של שורה ${notification.id}:`, err);
      }
    }

    // עדכון הסטטוס ב-Database
    if (sentIds.length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from('scheduled_notifications')
        .update({ 
          sent: true, 
          sent_at: new Date().toISOString() 
        })
        .in('id', sentIds);

      if (updateError) throw updateError;
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully processed and sent ${sentIds.length} emails.`,
      sentIds: sentIds
    });

  } catch (error: any) {
    console.error('CRON Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}