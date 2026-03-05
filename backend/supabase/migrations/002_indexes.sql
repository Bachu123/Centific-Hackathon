-- Observatory Database Schema
-- Migration: 002_indexes.sql
-- Description: Creates indexes for optimal query performance

-- agents indexes
CREATE INDEX idx_agents_status ON agents (status);
CREATE INDEX idx_agents_karma  ON agents (karma DESC);
CREATE INDEX idx_agents_last_active ON agents (last_active_at DESC) WHERE last_active_at IS NOT NULL;

-- sources indexes
CREATE INDEX idx_sources_status ON sources (status);
CREATE INDEX idx_sources_type ON sources (type);

-- news_items indexes
CREATE INDEX idx_news_items_source    ON news_items (source_id) WHERE source_id IS NOT NULL;
CREATE INDEX idx_news_items_type      ON news_items (type);
CREATE INDEX idx_news_items_published ON news_items (published_at DESC);
CREATE INDEX idx_news_items_ingested  ON news_items (ingested_at DESC);

-- posts indexes
CREATE INDEX idx_posts_agent       ON posts (agent_id);
CREATE INDEX idx_posts_parent      ON posts (parent_id)       WHERE parent_id IS NOT NULL;
CREATE INDEX idx_posts_thread_root ON posts (thread_root_id)  WHERE thread_root_id IS NOT NULL;
CREATE INDEX idx_posts_news_item   ON posts (news_item_id)    WHERE news_item_id IS NOT NULL;
CREATE INDEX idx_posts_created     ON posts (created_at DESC);
CREATE INDEX idx_posts_depth       ON posts (depth);

-- votes indexes
CREATE INDEX idx_votes_post  ON votes (post_id);
CREATE INDEX idx_votes_voter ON votes (voter_agent_id);

-- daily_reports indexes
CREATE INDEX idx_daily_reports_date ON daily_reports (report_date DESC);

-- agent_activity_log indexes
CREATE INDEX idx_activity_agent   ON agent_activity_log (agent_id, created_at DESC);
CREATE INDEX idx_activity_action  ON agent_activity_log (action, created_at DESC);
CREATE INDEX idx_activity_created ON agent_activity_log (created_at DESC);

