-- feed_items
CREATE TABLE IF NOT EXISTS feed_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent text NOT NULL CHECK (agent IN ('atlas','compass','bridge','vault','pulse')),
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  actions jsonb NOT NULL DEFAULT '[]',
  priority text NOT NULL CHECK (priority IN ('high','medium','low')) DEFAULT 'medium',
  read boolean NOT NULL DEFAULT false,
  dismissed boolean NOT NULL DEFAULT false,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS feed_items_user_active_idx
  ON feed_items (user_id, dismissed, created_at DESC);

ALTER TABLE feed_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "feed_items_all" ON feed_items;
CREATE POLICY "feed_items_all" ON feed_items
  FOR ALL USING (auth.uid() = user_id);

-- assistant_messages
CREATE TABLE IF NOT EXISTS assistant_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  role text NOT NULL CHECK (role IN ('user','assistant')),
  content text NOT NULL,
  agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS assistant_messages_session_idx
  ON assistant_messages (user_id, session_id, created_at);

ALTER TABLE assistant_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assistant_messages_all" ON assistant_messages;
CREATE POLICY "assistant_messages_all" ON assistant_messages
  FOR ALL USING (auth.uid() = user_id);

-- trip_expenses
CREATE TABLE IF NOT EXISTS trip_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id text,
  category text NOT NULL CHECK (category IN ('flight','meal','transport','hotel','other')) DEFAULT 'other',
  amount numeric(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  description text NOT NULL,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS trip_expenses_user_date_idx
  ON trip_expenses (user_id, expense_date DESC);

ALTER TABLE trip_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trip_expenses_all" ON trip_expenses;
CREATE POLICY "trip_expenses_all" ON trip_expenses
  FOR ALL USING (auth.uid() = user_id);

-- privacy_settings
CREATE TABLE IF NOT EXISTS privacy_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  show_seat boolean NOT NULL DEFAULT true,
  show_company boolean NOT NULL DEFAULT true,
  show_interests boolean NOT NULL DEFAULT true,
  discoverable boolean NOT NULL DEFAULT true,
  allow_connections text NOT NULL CHECK (allow_connections IN ('everyone','mutual','nobody')) DEFAULT 'everyone',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE privacy_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "privacy_settings_all" ON privacy_settings;
CREATE POLICY "privacy_settings_all" ON privacy_settings
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "privacy_settings_select_authenticated" ON privacy_settings;
CREATE POLICY "privacy_settings_select_authenticated" ON privacy_settings
  FOR SELECT USING (auth.role() = 'authenticated');

-- user_blocks
CREATE TABLE IF NOT EXISTS user_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS user_blocks_blocker_idx
  ON user_blocks (blocker_id);

ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_blocks_all" ON user_blocks;
CREATE POLICY "user_blocks_all" ON user_blocks
  FOR ALL USING (auth.uid() = blocker_id);
