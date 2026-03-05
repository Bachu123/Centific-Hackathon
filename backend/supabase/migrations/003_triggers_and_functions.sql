-- Observatory Database Schema
-- Migration: 003_triggers_and_functions.sql
-- Description: Creates triggers and functions for maintaining denormalized counters and auto-setting fields

-- Function: Update vote counts on posts + karma on agents
CREATE OR REPLACE FUNCTION fn_vote_counters() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'up' THEN
      UPDATE posts SET upvote_count = upvote_count + 1 WHERE id = NEW.post_id;
      UPDATE agents SET karma = karma + 1
        WHERE id = (SELECT agent_id FROM posts WHERE id = NEW.post_id);
    ELSE
      UPDATE posts SET downvote_count = downvote_count + 1 WHERE id = NEW.post_id;
      UPDATE agents SET karma = karma - 1
        WHERE id = (SELECT agent_id FROM posts WHERE id = NEW.post_id);
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'up' THEN
      UPDATE posts SET upvote_count = GREATEST(upvote_count - 1, 0) WHERE id = OLD.post_id;
      UPDATE agents SET karma = GREATEST(karma - 1, 0)
        WHERE id = (SELECT agent_id FROM posts WHERE id = OLD.post_id);
    ELSE
      UPDATE posts SET downvote_count = GREATEST(downvote_count - 1, 0) WHERE id = OLD.post_id;
      UPDATE agents SET karma = karma + 1
        WHERE id = (SELECT agent_id FROM posts WHERE id = OLD.post_id);
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update vote counts and karma when votes are inserted/deleted
CREATE TRIGGER trg_vote_counters
  AFTER INSERT OR DELETE ON votes
  FOR EACH ROW EXECUTE FUNCTION fn_vote_counters();

-- Function: Update reply count on parent posts + post_count on agents
CREATE OR REPLACE FUNCTION fn_post_counters() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE agents SET post_count = post_count + 1, last_active_at = now()
      WHERE id = NEW.agent_id;
    IF NEW.parent_id IS NOT NULL THEN
      UPDATE posts SET reply_count = reply_count + 1 WHERE id = NEW.parent_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE agents SET post_count = GREATEST(post_count - 1, 0)
      WHERE id = OLD.agent_id;
    IF OLD.parent_id IS NOT NULL THEN
      UPDATE posts SET reply_count = GREATEST(reply_count - 1, 0) WHERE id = OLD.parent_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update post counts when posts are inserted/deleted
CREATE TRIGGER trg_post_counters
  AFTER INSERT OR DELETE ON posts
  FOR EACH ROW EXECUTE FUNCTION fn_post_counters();

-- Function: Auto-set thread_root_id and depth on insert
CREATE OR REPLACE FUNCTION fn_set_thread_fields() RETURNS trigger AS $$
BEGIN
  IF NEW.parent_id IS NULL THEN
    NEW.thread_root_id := NEW.id;
    NEW.depth := 0;
  ELSE
    SELECT thread_root_id, depth + 1
      INTO NEW.thread_root_id, NEW.depth
      FROM posts WHERE id = NEW.parent_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-set thread fields before insert
CREATE TRIGGER trg_set_thread_fields
  BEFORE INSERT ON posts
  FOR EACH ROW EXECUTE FUNCTION fn_set_thread_fields();

-- Function: Auto-update updated_at on agents
CREATE OR REPLACE FUNCTION fn_set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update updated_at on agents
CREATE TRIGGER trg_agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

