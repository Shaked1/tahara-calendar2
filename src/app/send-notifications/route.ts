export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push'; // 1. ייבוא ספריית ה-Web Push

// הגדרת מפתחות ה-VAPID (מפתחות ההצפנה של ה-Push)
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:shaked14782@gmail.com', // המייל שלך כספק האפליקציה
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function GET(request: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!apiKey || !supabaseUrl || !supabaseServiceKey) {
      console.log('⚠️ מפתחות חסרים. מדלג על ריצה.');
      return NextResponse.json({ message: 'Build mode bypass' });
    }

    const resend = new Resend(apiKey);
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const now = new Date().toISOString();

    // 2. שליפת התראות שממתינות לשליחה (כולל ה-user_id כדי שנוכל למצוא את המכשיר שלהן)
    const { data: pendingNotifications, error: fetchError } = await supabaseAdmin
      .from('scheduled_notifications')
      .select('id, user_id, user_email, title, body, type')
      .eq('sent', false)
      .lte('scheduled_for', now);

    if (fetchError) throw fetchError;
    if (!pendingNotifications || pendingNotifications.length === 0) {
      return NextResponse.json({ message: 'No pending notifications' });
    }

    console.log(`מנסה לשלוח ${pendingNotifications.length} התראות...`);
    const sentIds: string[] = [];

    for (const notification of pendingNotifications) {
      let emailSent = false;
      let pushSent = false;

      try {
        // ─── א'. שליחת מייל דרך Resend ───
        const { error: emailError } = await resend.emails.send({
          from: 'onboarding@resend.dev', 
          to: 'shaked14782@gmail.com', // המייל המורשה שלך לפיתוח
          subject: notification.title,
          text: notification.body,
        });
        if (!emailError) emailSent = true;

        // ─── ב'. שליחת Push Notification (החלק החדש!) ───
        // שליפת ה-subscription של המשתמש הספציפי מהטבלה החדשה
        const { data: subData } = await supabaseAdmin
          .from('user_subscriptions')
          .select('subscription')
          .eq('user_id', notification.user_id)
          .single();

        if (subData?.subscription) {
          // שליחת ה-Push האמיתי דרך גוגל/אפל אל ה-Service Worker של המשתמשת
          await webpush.sendNotification(
            subData.subscription,
            JSON.stringify({
              title: notification.title,
              body: notification.body,
              type: notification.type // יעזור ל-sw.js לצבוע את ההתראה
            })
          );
          pushSent = true;
          console.log(`Push נשלח בהצלחה למשתמש ${notification.user_id}`);
        }

        // אם לפחות אחד מהערוצים הצליח (או שאין לה Push והמייל עבר), נסמן כנשלח
        if (emailSent || pushSent) {
          sentIds.push(notification.id);
        }

      } catch (err) {
        console.error(`שגיאה בתהליך השליחה של שורה ${notification.id}:`, err);
      }
    }

    // 3. עדכון הסטטוס ב-Database
    if (sentIds.length > 0) {
      await supabaseAdmin
        .from('scheduled_notifications')
        .update({ 
          sent: true, 
          sent_at: new Date().toISOString() 
        })
        .in('id', sentIds);
    }

    return NextResponse.json({ success: true, sentCount: sentIds.length });
  } catch (err: any) {
    console.error('Fatal cron error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}