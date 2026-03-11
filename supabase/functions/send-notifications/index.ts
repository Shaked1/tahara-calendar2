// supabase/functions/send-notifications/index.ts

import { serve } from "std/server"
import { createClient } from "supabase"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

Deno.serve(async (req) => {
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

  // 1. שליפת התראות שזמנן הגיע (scheduled_for <= עכשיו) וטרם נשלחו
  const { data: notifications, error } = await supabase
    .from('scheduled_notifications')
    .select(`
      id, 
      title, 
      body, 
      user_id,
      users_profile ( email )
    `)
    .eq('is_sent', false)
    .lte('scheduled_for', new Date().toISOString());

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  if (!notifications || notifications.length === 0) {
    return new Response(JSON.stringify({ message: 'No notifications to send' }), { status: 200 });
  }

  // 2. לולאת שליחה ל-Resend
  for (const n of notifications) {
    const email = (n.users_profile as any)?.email;
    if (!email) continue;

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Taharat HaMishpacha <onboarding@resend.dev>',
        to: [email],
        subject: n.title,
        html: `<div dir="rtl" style="font-family: sans-serif;">
                <h2>תזכורת לוח טהרה</h2>
                <p>${n.body}</p>
              </div>`
      })
    });

    // בתוך הפונקציה שרצה בשרת (Edge Function)
      const payload = await req.json();
      const record = payload.record; // כאן נמצא המידע מהשורה בטבלה

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Tahara Calendar <onboarding@resend.dev>',
          to: [record.user_email], // <-- כאן הוא מושך את המייל מהטבלה ושולח
          subject: record.title,
          html: `<strong>${record.body}</strong>`,
        }),
      });

    // 3. עדכון שההתראה נשלחה
    await supabase
      .from('scheduled_notifications')
      .update({ is_sent: true, sent_at: new Date().toISOString() })
      .eq('id', n.id);
  }

  return new Response(JSON.stringify({ sent: notifications.length }), { status: 200 });
});