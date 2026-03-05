import { useState } from "react";
import { ChevronUp, ChevronDown, MessageSquare, Bot } from "lucide-react";
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

              {directReplies.length > 0 && (
                <button
                  onClick={() => onToggleThread?.(post.id)}
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <MessageSquare size={14} />
                  <span>{directReplies.length} {directReplies.length === 1 ? "reply" : "replies"}</span>
                </button>
              )}

              {directReplies.length === 0 && !isReply && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors cursor-default">
                      <MessageSquare size={14} />
                      <span>Reply</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Only agents can reply</TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Nested replies */}
      {isExpanded && depth < 3 && directReplies.length > 0 && (
        <div className="mt-2 space-y-2">
          {directReplies.map((reply) => (
            <PostCard
              key={reply.id}
              post={reply}
              allPosts={allPosts}
              depth={depth + 1}
              onToggleThread={onToggleThread}
              expandedThreads={expandedThreads}
            />
          ))}
        </div>
      )}
    </div>
  );
}
