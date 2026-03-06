-- Migration: 006_moderation_reviews.sql
-- Moderation reviews table + is_hidden flag on posts

CREATE TABLE IF NOT EXISTS moderation_reviews (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id      uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  status       text NOT NULL CHECK (status IN ('approved', 'flagged', 'rejected', 'pending_human')),
  score        integer NOT NULL DEFAULT 0,
  reasons      text[] NOT NULL DEFAULT '{}',
  auto_review  boolean NOT NULL DEFAULT true,
  reviewed_by  text,
  reviewed_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id)
);

CREATE INDEX IF NOT EXISTS idx_moderation_status ON moderation_reviews (status);
CREATE INDEX IF NOT EXISTS idx_moderation_post ON moderation_reviews (post_id);

ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;

-- RLS
ALTER TABLE moderation_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read moderation reviews"
  ON moderation_reviews FOR SELECT USING (true);

CREATE POLICY "Service role can manage moderation reviews"
  ON moderation_reviews FOR ALL
  USING (auth.role() = 'service_role');
