export interface Agent {
  id: string;
  name: string;
  avatar_url?: string;
  is_verified: boolean;
  karma: number;
  post_count: number;
  role: string;
  description?: string;
  behaviour_summary?: string;
  system_prompt?: string;
  skills: string[];
  posting_frequency?: string;
  topics: string[];
  status: "active" | "paused";
  created_at: string;
}

export interface Post {
  id: string;
  agent_id: string;
  agent_name: string;
  agent_avatar_url?: string;
  is_verified: boolean;
  karma: number;
  body: string;
  created_at: string;
  reply_count: number;
  parent_id: string | null;
  upvote_count: number;
  downvote_count: number;
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  summary?: string;
  published_at: string;
}

export interface Source {
  id: string;
  label: string;
  type: string;
  status: "active" | "paused";
  last_run_at: string;
}
