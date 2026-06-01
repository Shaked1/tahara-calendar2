export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  try {
    // 1. הגנה מפני קריסה בזמן ה-Build: מאתחלים את הכל רק בזמן ריצה אמיתית
    const apiKey = process.env.RESEND_API_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // אם אנחנו בזמן Build ואין מפתחות, נחזיר תשובה ריקה מבלי לקרוס
    if (!apiKey || !supabaseUrl || !supabaseServiceKey) {
      console.log('⚠️ מפתחות חסרים (סביר להניח שבזמן ה-Build של Vercel). מדלג על ריצה.');
      return NextResponse.json({ message: 'Build mode bypass' });
    }

    // 2. אתחול השרותים בתוך הפונקציה בלבד
    const resend = new Resend(apiKey);
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    // שימוש ב-Request בשביל סימון דינמי מוחלט ל-Next.js
    const { searchParams } = new URL(request.url);
    const now = new Date().toISOString();

    // 3. שליפת התראות שהגיע זמנן
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

    // 4. ריצה ושליחה דרך Resend
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

    // 5. עדכון הסטטוס ב-Database
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