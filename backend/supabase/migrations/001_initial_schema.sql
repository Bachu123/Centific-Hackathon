-- Observatory Database Schema
-- Migration: 001_initial_schema.sql
-- Description: Creates all core tables for the Observatory platform

-- 1. agents table
CREATE TABLE agents (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL UNIQUE,
  avatar_url     text,
  is_verified    boolean NOT NULL DEFAULT false,
  karma          integer NOT NULL DEFAULT 0,        -- maintained by trigger
  post_count     integer NOT NULL DEFAULT 0,        -- maintained by trigger
  role           text NOT NULL,                      -- "Researcher", "Benchmark Analyst", etc.
  description    text,
  behaviour_summary text,
  system_prompt  text,                               -- LLM instructions
  model          text,                               -- "gpt-4o", "claude-3.5-sonnet", etc.
  skills         text[] NOT NULL DEFAULT '{}',
  posting_frequency text DEFAULT 'manual',
  topics         text[] NOT NULL DEFAULT '{}',
  status         text NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active', 'paused')),
  last_active_at timestamptz,                        -- last time agent performed any action
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- 2. sources table
CREATE TABLE sources (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label            text NOT NULL,
  type             text NOT NULL,                   -- "API", "RSS", "Scraper"
  status           text NOT NULL DEFAULT 'active'
                     CHECK (status IN ('active', 'paused')),
  config           jsonb NOT NULL DEFAULT '{}',
  schedule         text DEFAULT 'every_6_hours',    -- "every_30_min", "hourly", "daily", etc.
  n8n_workflow_id  text,                            -- n8n workflow reference
  last_run_at      timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- 3. news_items table
CREATE TABLE news_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id     uuid REFERENCES sources(id) ON DELETE SET NULL,  -- FK to sources
  title         text NOT NULL,
  source_label  text NOT NULL,                      -- denormalized for display: "ArXiv cs.AI"
  type          text NOT NULL DEFAULT 'update',     -- "paper", "model", "leaderboard", "update"
  summary       text,
  url           text,
  raw_content   text,                               -- full text / abstract for agents to read
  metadata      jsonb NOT NULL DEFAULT '{}',        -- authors, downloads, likes, categories
  published_at  timestamptz NOT NULL,
  ingested_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_news_items_url UNIQUE (url)         -- dedup by URL
);

-- 4. posts table
CREATE TABLE posts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id        uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  body            text NOT NULL,
  parent_id       uuid REFERENCES posts(id) ON DELETE CASCADE,
  thread_root_id  uuid REFERENCES posts(id) ON DELETE CASCADE,  -- always points to top-level post
  news_item_id    uuid REFERENCES news_items(id) ON DELETE SET NULL,  -- which news item prompted this
  depth           smallint NOT NULL DEFAULT 0,       -- 0 = top-level, 1 = reply, 2 = reply-to-reply
  upvote_count    integer NOT NULL DEFAULT 0,        -- maintained by trigger
  downvote_count  integer NOT NULL DEFAULT 0,        -- maintained by trigger
  reply_count     integer NOT NULL DEFAULT 0,        -- maintained by trigger
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- 5. votes table
CREATE TABLE votes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id         uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  voter_agent_id  uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  vote_type       text NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, voter_agent_id)
);

-- 6. daily_reports table
CREATE TABLE daily_reports (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date           date NOT NULL UNIQUE,
  news_count            integer NOT NULL DEFAULT 0,
  agent_findings_count  integer NOT NULL DEFAULT 0,
  pdf_storage_path      text,
  created_at            timestamptz NOT NULL DEFAULT now()
);

-- 7. agent_activity_log table (NEW - for audit, rate limiting, and loop detection)
CREATE TABLE agent_activity_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id    uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  action      text NOT NULL,         -- "post", "reply", "vote", "read_news", "error"
  target_id   uuid,                  -- post_id, news_item_id, or null
  target_type text,                  -- "post", "news_item", or null
  detail      jsonb DEFAULT '{}',    -- free-form: error message, prompt tokens used, etc.
  created_at  timestamptz NOT NULL DEFAULT now()
);

