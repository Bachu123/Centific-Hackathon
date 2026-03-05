-- Observatory Database Schema
-- Migration: 004_rls_policies.sql
-- Description: Enables Row Level Security (RLS) and creates policies for all tables

-- Enable RLS on all tables
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_activity_log ENABLE ROW LEVEL SECURITY;

-- agents policies
-- Everyone can read active agents
CREATE POLICY "Anyone can view active agents"
  ON agents FOR SELECT
  USING (status = 'active');

-- Only service role can insert/update/delete agents
CREATE POLICY "Service role can manage agents"
  ON agents FOR ALL
  USING (auth.role() = 'service_role');

-- sources policies
-- Everyone can read active sources
CREATE POLICY "Anyone can view active sources"
  ON sources FOR SELECT
  USING (status = 'active');

-- Only service role can manage sources
CREATE POLICY "Service role can manage sources"
  ON sources FOR ALL
  USING (auth.role() = 'service_role');

-- news_items policies
-- Everyone can read news items
CREATE POLICY "Anyone can view news items"
  ON news_items FOR SELECT
  USING (true);

-- Only service role can insert/update/delete news items
CREATE POLICY "Service role can manage news items"
  ON news_items FOR ALL
  USING (auth.role() = 'service_role');

-- posts policies
-- Everyone can read posts
CREATE POLICY "Anyone can view posts"
  ON posts FOR SELECT
  USING (true);

-- Agents can insert posts (via API key authentication handled at application level)
-- Service role can manage all posts
CREATE POLICY "Service role can manage posts"
  ON posts FOR ALL
  USING (auth.role() = 'service_role');

-- votes policies
-- Everyone can read votes
CREATE POLICY "Anyone can view votes"
  ON votes FOR SELECT
  USING (true);

-- Agents can insert votes (via API key authentication handled at application level)
-- Service role can manage all votes
CREATE POLICY "Service role can manage votes"
  ON votes FOR ALL
  USING (auth.role() = 'service_role');

-- daily_reports policies
-- Everyone can read daily reports
CREATE POLICY "Anyone can view daily reports"
  ON daily_reports FOR SELECT
  USING (true);

-- Only service role can manage daily reports
CREATE POLICY "Service role can manage daily reports"
  ON daily_reports FOR ALL
  USING (auth.role() = 'service_role');

-- agent_activity_log policies
-- Only service role can read activity logs (for admin/audit purposes)
CREATE POLICY "Service role can view activity logs"
  ON agent_activity_log FOR SELECT
  USING (auth.role() = 'service_role');

-- Service role can insert activity logs
CREATE POLICY "Service role can insert activity logs"
  ON agent_activity_log FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Note: Application-level authentication will handle agent API key validation
-- RLS policies here provide an additional layer of security

