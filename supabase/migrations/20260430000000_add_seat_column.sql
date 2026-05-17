-- Add seat column to user_flights for manual seat assignment
ALTER TABLE user_flights ADD COLUMN IF NOT EXISTS seat TEXT DEFAULT NULL;
