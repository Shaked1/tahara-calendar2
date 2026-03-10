-- ====================================
-- טבלאות למערכת טהרה
-- ====================================

-- הפעלת Row Level Security
ALTER DATABASE postgres SET timezone TO 'Asia/Jerusalem';

-- ====================================
-- טבלת פרופילי משתמשים
-- ====================================
CREATE TABLE IF NOT EXISTS users_profile (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  
  -- הגדרות הלכתיות
  halachic_method TEXT NOT NULL CHECK (
    halachic_method IN (
      'ovadia_yosef',
      'ben_ish_chai',
      'chazon_ish',
      'chabad',
      'custom'
    )
  ),
  or_zarua BOOLEAN NOT NULL DEFAULT false,
  yom_31 BOOLEAN NOT NULL DEFAULT false,
  maat_leat BOOLEAN NOT NULL DEFAULT false,
  
  -- מיקום
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Asia/Jerusalem',
  location_name TEXT,
  
  -- סטטוס
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  
  -- תאריכים
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- אינדקס למייל
CREATE INDEX IF NOT EXISTS idx_users_profile_email 
  ON users_profile(email);

-- ====================================
-- טבלת אירועי וסת
-- ====================================
CREATE TABLE IF NOT EXISTS veset_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  
  -- תאריך ושעה
  event_date DATE NOT NULL,
  event_time TIME,
  
  -- עונה
  onah TEXT NOT NULL CHECK (onah IN ('day', 'night')),
  
  -- הערות
  notes TEXT,
  
  -- תאריכים
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- אינדקסים
CREATE INDEX IF NOT EXISTS idx_veset_events_user_id 
  ON veset_events(user_id);
CREATE INDEX IF NOT EXISTS idx_veset_events_date 
  ON veset_events(event_date DESC);

-- ====================================
-- טבלת הפסקי טהרה
-- ====================================
CREATE TABLE IF NOT EXISTS hefsek_tahara (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  veset_event_id UUID NOT NULL REFERENCES veset_events(id) ON DELETE CASCADE,
  
  -- תאריך ושעה
  hefsek_date DATE NOT NULL,
  hefsek_time TIME,
  
  -- עונה
  onah TEXT NOT NULL CHECK (onah IN ('day', 'night')),
  
  -- תאריכים
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- אינדקסים
CREATE INDEX IF NOT EXISTS idx_hefsek_tahara_user_id 
  ON hefsek_tahara(user_id);
CREATE INDEX IF NOT EXISTS idx_hefsek_tahara_veset_id 
  ON hefsek_tahara(veset_event_id);

-- ====================================
-- טבלת תאריכים מחושבים (Cache)
-- ====================================
CREATE TABLE IF NOT EXISTS calculated_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  
  -- תאריך
  calc_date DATE NOT NULL,
  hebrew_date TEXT NOT NULL,
  
  -- סטטוס
  status TEXT NOT NULL CHECK (
    status IN (
      'prohibited',
      'clean_day',
      'mikvah_night',
      'permitted',
      'uncertain'
    )
  ),
  
  -- עונה
  onah TEXT NOT NULL CHECK (onah IN ('day', 'night')),
  
  -- סוגי וסתות
  veset_types TEXT[],
  
  -- מספר יום נקי (אם רלוונטי)
  clean_day_number INTEGER CHECK (
    clean_day_number IS NULL OR 
    (clean_day_number >= 1 AND clean_day_number <= 7)
  ),
  
  -- הסבר
  reason TEXT NOT NULL,
  
  -- תוקף
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  
  -- תאריכים
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- אינדקסים
CREATE INDEX IF NOT EXISTS idx_calculated_dates_user_date 
  ON calculated_dates(user_id, calc_date);
CREATE INDEX IF NOT EXISTS idx_calculated_dates_status 
  ON calculated_dates(status);
CREATE INDEX IF NOT EXISTS idx_calculated_dates_valid 
  ON calculated_dates(valid_until);

-- ====================================
-- Row Level Security (RLS)
-- ====================================

-- הפעלת RLS על כל הטבלאות
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE veset_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE hefsek_tahara ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculated_dates ENABLE ROW LEVEL SECURITY;

-- פוליסי users_profile
CREATE POLICY "Users can view own profile" 
  ON users_profile FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON users_profile FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON users_profile FOR UPDATE 
  USING (auth.uid() = id);

-- פוליסי veset_events
CREATE POLICY "Users can view own events" 
  ON veset_events FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own events" 
  ON veset_events FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own events" 
  ON veset_events FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own events" 
  ON veset_events FOR DELETE 
  USING (auth.uid() = user_id);

-- פוליסי hefsek_tahara
CREATE POLICY "Users can view own hefsek" 
  ON hefsek_tahara FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own hefsek" 
  ON hefsek_tahara FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own hefsek" 
  ON hefsek_tahara FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own hefsek" 
  ON hefsek_tahara FOR DELETE 
  USING (auth.uid() = user_id);

-- פוליסי calculated_dates
CREATE POLICY "Users can view own calculated dates" 
  ON calculated_dates FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calculated dates" 
  ON calculated_dates FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own calculated dates" 
  ON calculated_dates FOR DELETE 
  USING (auth.uid() = user_id);

-- ====================================
-- Triggers לעדכון updated_at
-- ====================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_profile_updated_at 
  BEFORE UPDATE ON users_profile
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_veset_events_updated_at 
  BEFORE UPDATE ON veset_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hefsek_tahara_updated_at 
  BEFORE UPDATE ON hefsek_tahara
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ====================================
-- פונקציה לניקוי cache ישן
-- ====================================

CREATE OR REPLACE FUNCTION cleanup_old_calculated_dates()
RETURNS void AS $$
BEGIN
  DELETE FROM calculated_dates 
  WHERE valid_until IS NOT NULL 
    AND valid_until < NOW();
END;
$$ LANGUAGE plpgsql;

-- ====================================
-- Views שימושיים
-- ====================================

-- View לאירועים אחרונים
CREATE OR REPLACE VIEW recent_events AS
SELECT 
  ve.id,
  ve.user_id,
  ve.event_date,
  ve.event_time,
  ve.onah,
  ve.notes,
  ht.id AS hefsek_id,
  ht.hefsek_date,
  ht.hefsek_time
FROM veset_events ve
LEFT JOIN hefsek_tahara ht ON ve.id = ht.veset_event_id
ORDER BY ve.event_date DESC;

-- View למצב נוכחי של משתמש
CREATE OR REPLACE VIEW user_current_status AS
SELECT 
  up.id AS user_id,
  up.email,
  (
    SELECT COUNT(*) 
    FROM veset_events 
    WHERE user_id = up.id
  ) AS total_events,
  (
    SELECT MAX(event_date) 
    FROM veset_events 
    WHERE user_id = up.id
  ) AS last_event_date,
  (
    SELECT COUNT(*) 
    FROM hefsek_tahara 
    WHERE user_id = up.id
  ) AS total_hefsek
FROM users_profile up;

-- ====================================
-- טבלת תזכורות והתראות
-- ====================================
CREATE TABLE IF NOT EXISTS scheduled_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  
  -- זמן השליחה המתוזמן
  scheduled_for TIMESTAMPTZ NOT NULL,
  
  -- תוכן ההתראה
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  
  -- סוג ההתראה (לצרכי סינון)
  type TEXT NOT NULL CHECK (
    type IN ('clean_day', 'mikvah_night', 'veset_reminder', 'general')
  ),
  
  -- סטטוס שליחה
  is_sent BOOLEAN NOT NULL DEFAULT false,
  sent_at TIMESTAMPTZ,
  
  -- תאריכים
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- אינדקסים לביצועים (חשוב לשליפה מהירה של מה שצריך לשלוח עכשיו)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON scheduled_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_for ON scheduled_notifications(scheduled_for) 
  WHERE is_sent = false;

-- הפעלת RLS
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;

-- פוליסי: משתמשת יכולה לראות ולמחוק רק את התזכורות שלה
CREATE POLICY "Users can view own notifications" 
  ON scheduled_notifications FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications" 
  ON scheduled_notifications FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications" 
  ON scheduled_notifications FOR DELETE 
  USING (auth.uid() = user_id);

-- ====================================
-- הערות
-- ====================================
COMMENT ON TABLE users_profile IS 'פרופילי משתמשים והגדרות הלכתיות';
COMMENT ON TABLE veset_events IS 'אירועי וסת של המשתמשות';
COMMENT ON TABLE hefsek_tahara IS 'הפסקי טהרה';
COMMENT ON TABLE calculated_dates IS 'תאריכים מחושבים (cache)';
