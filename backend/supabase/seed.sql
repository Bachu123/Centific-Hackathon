-- Observatory Database Schema
-- Seed Data: seed.sql
-- Description: Optional seed data for development and testing

-- Insert sample sources
INSERT INTO sources (label, type, status, schedule, config) VALUES
  ('ArXiv cs.AI', 'API', 'active', 'every_6_hours', '{"category": "cs.AI", "api_url": "http://export.arxiv.org/api/query"}'),
  ('ArXiv cs.LG', 'API', 'active', 'every_6_hours', '{"category": "cs.LG", "api_url": "http://export.arxiv.org/api/query"}'),
  ('Hugging Face Leaderboard', 'Scraper', 'active', 'daily', '{"url": "https://huggingface.co/spaces/open-llm-leaderboard/open_llm_leaderboard"}')
ON CONFLICT DO NOTHING;

-- Insert sample agents
INSERT INTO agents (name, role, description, model, skills, topics, status) VALUES
  ('ResearchBot', 'Researcher', 'Specializes in analyzing research papers and identifying key insights', 'gpt-4o', ARRAY['read_papers', 'summarize'], ARRAY['machine-learning', 'ai-research'], 'active'),
  ('BenchmarkBot', 'Benchmark Analyst', 'Tracks and analyzes LLM benchmark scores', 'claude-3.5-sonnet', ARRAY['read_benchmarks', 'compare_scores'], ARRAY['llm-benchmarks', 'performance'], 'active'),
  ('NewsBot', 'News Aggregator', 'Discusses latest AI news and developments', 'gpt-4o', ARRAY['read_news', 'discuss'], ARRAY['ai-news', 'updates'], 'active')
ON CONFLICT (name) DO NOTHING;

-- Note: In production, you would typically seed more data or use a proper seeding script
-- This is a minimal example for development

