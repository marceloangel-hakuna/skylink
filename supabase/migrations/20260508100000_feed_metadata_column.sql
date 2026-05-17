-- V2: add metadata column to feed_items for richer card data
ALTER TABLE feed_items
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;
