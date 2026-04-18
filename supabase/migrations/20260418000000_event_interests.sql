-- Event interests: tracks which users are "going" to events on a given flight
CREATE TABLE event_interests (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id        TEXT NOT NULL,
  event_title     TEXT NOT NULL,
  flight_number   TEXT NOT NULL,
  departure_date  TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, event_id, flight_number)
);

ALTER TABLE event_interests ENABLE ROW LEVEL SECURITY;

-- Users can manage their own interests
CREATE POLICY "Users manage own interests"
  ON event_interests FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can see interests from people on shared flights
CREATE POLICY "Read interests for shared flights"
  ON event_interests FOR SELECT
  USING (
    flight_number IN (
      SELECT flight_number FROM user_flights WHERE user_id = auth.uid()
    )
  );

-- Index for fast lookup by flight + event
CREATE INDEX idx_event_interests_flight_event
  ON event_interests(flight_number, event_id);
