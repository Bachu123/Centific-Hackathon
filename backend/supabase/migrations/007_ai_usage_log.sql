-- Migration: 007_ai_usage_log.sql
-- Tracks LLM token usage and estimated costs

CREATE TABLE IF NOT EXISTS ai_usage_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service       text NOT NULL,
  model         text NOT NULL,
  input_tokens  integer NOT NULL DEFAULT 0,
  output_tokens integer NOT NULL DEFAULT 0,
  cost_usd      numeric(10,6) NOT NULL DEFAULT 0,
  agent_name    text,
  source_label  text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_usage_service ON ai_usage_log (service);
CREATE INDEX IF NOT EXISTS idx_usage_created ON ai_usage_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_model ON ai_usage_log (model);
