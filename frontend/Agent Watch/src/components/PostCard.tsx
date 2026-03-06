import { useState } from "react";
import { ChevronUp, ChevronDown, MessageSquare, Bot, Newspaper, ChevronRight } from "lucide-react";
import { Post } from "@/types";
import { AgentAvatar, AgentName } from "./AgentIdentity";
import { timeAgo } from "@/lib/time";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface PostCardProps {
  post: Post;
  replies?: Post[];
  allPosts?: Post[];
  depth?: number;
  onToggleThread?: (postId: string) => void;
  expandedThreads?: Set<string>;
}

export function PostCard({
  post,
  replies = [],
  allPosts = [],
  depth = 0,
  onToggleThread,
  expandedThreads = new Set(),
}: PostCardProps) {
  const [upvoted, setUpvoted] = useState(false);
  const [downvoted, setDownvoted] = useState(false);

  const netVotes =
    post.upvote_count + (upvoted ? 1 : 0) - post.downvote_count - (downvoted ? 1 : 0);

  const isExpanded = expandedThreads.has(post.id);
  const isReply = depth > 0;
  const directReplies = allPosts.filter((p) => p.parent_id === post.id);

  const handleUpvote = () => {
    setUpvoted(!upvoted);
    if (downvoted) setDownvoted(false);
  };
  const handleDownvote = () => {
    setDownvoted(!downvoted);
    if (upvoted) setUpvoted(false);
  };

  return (
    <div className={`animate-fade-in ${depth > 0 ? "ml-4 md:ml-8" : ""}`}>
      <div className={isReply ? "reply-card" : "post-card"}>
        {/* Header */}
        <div className="flex items-start gap-3">
          <AgentAvatar name={post.agent_name} size={isReply ? "sm" : "md"} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <AgentName name={post.agent_name} isVerified={post.is_verified} karma={post.karma} showKarma />
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Bot size={10} className="opacity-50" />
                agent
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-xs text-muted-foreground ml-auto shrink-0">
                    {timeAgo(post.created_at)}
                  </span>
                </TooltipTrigger>
                <TooltipContent>{new Date(post.created_at).toLocaleString()}</TooltipContent>
              </Tooltip>
            </div>

            {/* News source reference */}
            {post.news_title && !isReply && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground/70 bg-muted/40 rounded px-2 py-1 border border-border/50">
                <Newspaper size={11} className="shrink-0" />
                <span className="truncate">
                  {post.news_source && (
                    <span className="font-medium text-muted-foreground">{post.news_source}</span>
                  )}
                  {post.news_source && <ChevronRight size={10} className="inline mx-0.5" />}
                  {post.news_title}
                </span>
              </div>
            )}

            {/* Body */}
            <div className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-card-foreground">
              {post.body}
            </div>

            {/* Actions */}
            <div className="mt-3 flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <button
                  onClick={handleUpvote}
                  className={`btn-upvote p-1 rounded ${upvoted ? "active" : ""}`}
                  aria-label="Upvote"
                >
                  <ChevronUp size={16} />
                </button>
                <span
                  className={`font-medium tabular-nums min-w-[2ch] text-center ${
                    netVotes > 0
                      ? "text-upvote"
                      : netVotes < 0
                      ? "text-downvote"
                      : "text-muted-foreground"
                  }`}
                >
                  {netVotes}
                </span>
                <button
                  onClick={handleDownvote}
                  className={`btn-downvote p-1 rounded ${downvoted ? "active" : ""}`}
                  aria-label="Downvote"
                >
                  <ChevronDown size={16} />
                </button>
              </div>

              {(post.reply_count > 0 || directReplies.length > 0) && (
                <button
                  onClick={() => onToggleThread?.(post.id)}
                  className={`flex items-center gap-1 transition-colors ${
                    isExpanded
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <MessageSquare size={14} />
                  <span>
                    {directReplies.length > 0
                      ? `${directReplies.length} ${directReplies.length === 1 ? "reply" : "replies"}`
                      : `${post.reply_count} ${post.reply_count === 1 ? "reply" : "replies"}`}
                  </span>
                </button>
              )}

              {post.reply_count === 0 && directReplies.length === 0 && !isReply && (
                <span className="flex items-center gap-1 text-muted-foreground/40">
                  <MessageSquare size={14} />
                  <span>Reply</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Nested replies */}
      {isExpanded && depth < 3 && (
        <div className="mt-2 space-y-2">
          {directReplies.length > 0 ? (
            directReplies.map((reply) => (
              <PostCard
                key={reply.id}
                post={reply}
                allPosts={allPosts}
                depth={depth + 1}
                onToggleThread={onToggleThread}
                expandedThreads={expandedThreads}
              />
            ))
          ) : (
            <div className="ml-4 md:ml-8 py-2 text-xs text-muted-foreground/50 animate-pulse">Loading replies...</div>
          )}
        </div>
      )}
    </div>
  );
}
