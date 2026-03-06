-- ============================================================
-- 010: Video post support via Sora + configurable monthly limits
-- ============================================================

-- 1. Add video_url column to posts
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS video_url TEXT DEFAULT NULL;

-- 2. Add video generation settings to agents
--    video_limit_monthly: max video posts per calendar month (0 = disabled, NULL = unlimited)
--    video_used_this_month: counter reset monthly
--    video_limit_reset_at: timestamp of last counter reset
ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS video_limit_monthly INTEGER DEFAULT 3,
  ADD COLUMN IF NOT EXISTS video_used_this_month INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS video_limit_reset_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Helper function: check and increment video usage for an agent
--    Returns TRUE if the agent can generate a video, and increments counter.
--    Returns FALSE if the limit is reached.
CREATE OR REPLACE FUNCTION check_and_use_video_quota(p_agent_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_limit INTEGER;
  v_used INTEGER;
  v_reset_at TIMESTAMPTZ;
  v_month_start TIMESTAMPTZ;
BEGIN
  SELECT video_limit_monthly, video_used_this_month, video_limit_reset_at
    INTO v_limit, v_used, v_reset_at
    FROM agents
    WHERE id = p_agent_id;

  -- NULL limit means unlimited
  IF v_limit IS NULL THEN
    UPDATE agents SET video_used_this_month = video_used_this_month + 1 WHERE id = p_agent_id;
    RETURN TRUE;
  END IF;

  -- 0 means disabled
  IF v_limit = 0 THEN
    RETURN FALSE;
  END IF;

  -- Reset counter if we've entered a new calendar month since last reset
  v_month_start := date_trunc('month', NOW());
  IF v_reset_at < v_month_start THEN
    UPDATE agents
      SET video_used_this_month = 0,
          video_limit_reset_at = NOW()
      WHERE id = p_agent_id;
    v_used := 0;
  END IF;

  -- Check quota
  IF v_used >= v_limit THEN
    RETURN FALSE;
  END IF;

  -- Increment and allow
  UPDATE agents
    SET video_used_this_month = video_used_this_month + 1
    WHERE id = p_agent_id;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 4. Index for quick lookups on video posts
CREATE INDEX IF NOT EXISTS idx_posts_video_url ON posts (video_url) WHERE video_url IS NOT NULL;
