import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

// 1. אתחול Resend ו-Supabase
const resend = new Resend(process.env.RESEND_API_KEY);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
  try {
    // קבלת הזמן הנוכחי בפורמט ISO תקין
    const now = new Date().toISOString();

    // 2. שליפת התראות שהגיע זמנן (scheduled_for <= עכשיו) ושעדיין לא נשלחו (sent = false)
    const { data: pendingNotifications, error: fetchError } = await supabaseAdmin
      .from('scheduled_notifications')
      .select('*')
      .eq('sent', false)
      .lte('scheduled_for', now); // השוואה חסינת אזורי זמן

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

    // 3. ריצה על ההתראות ושליחתן אחת אחת
    for (const notification of pendingNotifications) {
      try {
        // בזמן פיתוח: שולח למייל המורשה שלך ב-Resend. בפרודקשן תחליפי ל-notification.user_email
        const { error: emailError } = await resend.emails.send({
          from: 'onboarding@resend.dev', 
          to: 'shaked14782@gmail.com', // 👈 המייל המורשה שלך ב-Resend
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

    // 4. עדכון השורות שנשלחו בהצלחה ב-Database ל-sent = true
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