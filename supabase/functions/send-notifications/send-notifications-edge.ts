// supabase/functions/send-notifications/index.ts
// מריצים דרך Supabase Cron — כל 15 דקות

import { serve }        from 'std/server';
import { createClient } from 'supabase';

const RESEND_API_KEY          = Deno.env.get('RESEND_API_KEY')!;
const SUPABASE_URL             = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY     = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const FROM_EMAIL               = 'לוח הטהרה שלי <tahara@yourdomain.com>';

// ─── תבנית HTML לכל סוג התראה ───────────────

const EMOJI_BY_TYPE: Record<string, string> = {
  hefsek_reminder:     '🌿',
  clean_day_morning:   '☀️',
  clean_day_afternoon: '🌅',
  pre_mikvah:          '💧',
  mikvah_day:          '✨',
  veset_start_onah:    '⚠️',
  veset_end_onah:      '✅',
};

function buildEmailHtml(title: string, body: string, type: string): string {
  const emoji = EMOJI_BY_TYPE[type] ?? '🔔';

  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    body { font-family: 'Arial', sans-serif; background: #f8f9fa; margin: 0; padding: 20px; direction: rtl; }
    .card { max-width: 480px; margin: 0 auto; background: #fff; border-radius: 16px;
            box-shadow: 0 2px 12px rgba(0,0,0,0.08); overflow: hidden; }
    .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
              padding: 24px; text-align: center; }
    .emoji  { font-size: 48px; display: block; margin-bottom: 8px; }
    .header h1 { color: #fff; margin: 0; font-size: 20px; }
    .body   { padding: 24px; }
    .body p { color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px; }
    .footer { padding: 16px 24px; background: #f3f4f6; text-align: center;
              font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
    .disclaimer { color: #ef4444; font-size: 11px; margin-top: 8px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <span class="emoji">${emoji}</span>
      <h1>${title}</h1>
    </div>
    <div class="body">
      <p>${body}</p>
    </div>
    <div class="footer">
      <p>מערכת לוח הטהרה</p>
      <p class="disclaimer">
        מערכת זו היא כלי עזר בלבד ואינה מחליפה התייעצות עם רב פוסק.
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ─── שליחת מייל דרך Resend ──────────────────

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
    });
    return res.ok;
  } catch (e) {
    console.error('Resend error:', e);
    return false;
  }
}

// ─── Edge Function handler ───────────────────

Deno.serve(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // שלוף התראות שזמנן הגיע (scheduled_for <= עכשיו) ועדיין לא נשלחו
  const { data: notifications, error } = await supabase
    .from('scheduled_notifications')
    .select('id, user_id, user_email, title, body, type')
    .eq('sent', false)
    .lte('scheduled_for', new Date().toISOString())
    .order('scheduled_for', { ascending: true })
    .limit(50);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  if (!notifications || notifications.length === 0) {
    return new Response(JSON.stringify({ sent: 0, message: 'אין התראות לשליחה' }), { status: 200 });
  }

  let sentCount = 0;

  for (const n of notifications) {
    const email = n.user_email;
    if (!email) continue;

    const html    = buildEmailHtml(n.title, n.body, n.type);
    const success = await sendEmail(email, n.title, html);

    if (success) {
      await supabase
        .from('scheduled_notifications')
        .update({ sent: true, sent_at: new Date().toISOString() })
        .eq('id', n.id);
      sentCount++;
    }
  }

  return new Response(JSON.stringify({ sent: sentCount, total: notifications.length }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
