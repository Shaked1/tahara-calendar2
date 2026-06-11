-- migration: 002_notifications_update.sql
-- מוסיף עמודות חסרות לטבלת scheduled_notifications בצורה בטוחה לחלוטין

-- ─────────────────────────────────────────────
-- 1. הוספת עמודות חסרות (IF NOT EXISTS = בטוח אם כבר קיים)
-- ─────────────────────────────────────────────

ALTER TABLE scheduled_notifications
  ADD COLUMN IF NOT EXISTS user_email TEXT;

ALTER TABLE scheduled_notifications
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'general';

ALTER TABLE scheduled_notifications
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;

-- ─────────────────────────────────────────────
-- 2. עדכון שורות קיימות שאין להן type
-- ─────────────────────────────────────────────
UPDATE scheduled_notifications
SET type = 'general'
WHERE type IS NULL;

-- ─────────────────────────────────────────────
-- 3. הוספת CHECK constraint על type
--    (רק אם עדיין לא קיים — DO block בטוח)
-- ─────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    WHERE rel.relname = 'scheduled_notifications'
      AND con.contype = 'c'
      AND con.conname = 'notifications_type_check'
  ) THEN
    ALTER TABLE scheduled_notifications
      ADD CONSTRAINT notifications_type_check
      CHECK (type IN (
        'hefsek_reminder',
        'clean_day_morning',
        'clean_day_afternoon',
        'pre_mikvah',
        'mikvah_day',
        'veset_start_onah',
        'veset_end_onah',
        'clean_day',
        'mikvah_night',
        'veset_reminder',
        'general'
      ));
  END IF;
END;
$$;

-- ─────────────────────────────────────────────
-- 4. אינדקסים לביצועים
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_notifications_email
  ON scheduled_notifications(user_email)
  WHERE sent = false;

CREATE INDEX IF NOT EXISTS idx_notifications_pending
  ON scheduled_notifications(scheduled_for, sent)
  WHERE sent = false;

CREATE INDEX IF NOT EXISTS idx_notifications_type
  ON scheduled_notifications(type)
  WHERE sent = false;

-- ─────────────────────────────────────────────
-- התראות קפיצה באפליקציה (Push Notifications) - טבלה חדשה לניהול מנויים
-- ─────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS user_subscriptions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_subscription UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id 
  ON user_subscriptions(user_id);
