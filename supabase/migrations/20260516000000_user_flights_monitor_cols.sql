-- Compass flight monitor: track last-known gate and delay per flight row
ALTER TABLE user_flights
  ADD COLUMN IF NOT EXISTS dep_gate text,
  ADD COLUMN IF NOT EXISTS delay_minutes int DEFAULT 0;
