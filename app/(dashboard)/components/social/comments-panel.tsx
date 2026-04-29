"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  MessageCircle,
  Send,
  Heart,
  Filter,
  ChevronDown,
  ChevronUp,
  User,
  Loader2,
  EyeOff,
  ExternalLink,
} from "lucide-react";
import { StatusBadge } from "@/app/(dashboard)/components/status-badge";
import type { SocialComment, SocialPlatform } from "@/app/lib/social/types";

const platformBadge: Record<SocialPlatform, { label: string; variant: "info" | "danger" }> = {
  instagram: { label: "Instagram", variant: "danger" },
  facebook: { label: "Facebook", variant: "info" },
};

interface CommentsPanelProps {
  comments: SocialComment[];
}

export function CommentsPanel({ comments }: CommentsPanelProps) {
  const [platformFilter, setPlatformFilter] = useState<"all" | SocialPlatform>("all");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [localComments, setLocalComments] = useState(comments);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleLike = async (commentId: string) => {
    if (busyId) return;
    const wasLiked = likedIds.has(commentId);
    setBusyId(commentId);
    // Optimistic toggle
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (wasLiked) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
    setLocalComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, likeCount: Math.max(0, c.likeCount + (wasLiked ? -1 : 1)) }
          : c
      )
    );
    try {
      // Best-effort Meta Graph call. If the endpoint rejects (e.g. env
      // vars missing), we silently keep the optimistic state. The panel
      // is primarily a triage tool — a like persisted locally is still
      // useful as "I've processed this".
      await fetch("/api/social/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commentId,
          action: wasLiked ? "unlike" : "like",
        }),
      });
    } catch {
      // ignore
    } finally {
      setBusyId(null);
    }
  };

  const handleHide = async (commentId: string) => {
    if (busyId) return;
    setBusyId(commentId);
    setHiddenIds((prev) => new Set(prev).add(commentId));
    try {
      await fetch("/api/social/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId, action: "hide" }),
      });
    } catch {
      // ignore — comment stays hidden locally
    } finally {
      setBusyId(null);
    }
  };

  const filtered = localComments.filter(
    (c) =>
      !hiddenIds.has(c.id) &&
      (platformFilter === "all" || c.platform === platformFilter)
  );

  const unrepliedCount = filtered.filter((c) => c.replies.length === 0).length;

  const toggleExpand = (id: string) => {
    setExpandedComments((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  async function handleReply(commentId: string) {
    if (!replyText.trim()) return;
    setSendingReply(true);

    try {
      const res = await fetch("/api/social/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId, message: replyText }),
      });
      const data = await res.json();

      if (data.success || data.data) {
        // Add reply locally
        setLocalComments((prev) =>
          prev.map((c) =>
            c.id === commentId
              ? {
                  ...c,
                  replies: [
                    ...c.replies,
                    {
                      id: data.data?.id || `local-${Date.now()}`,
                      author: { name: "Counter Cultures" },
                      message: replyText,
                      createdAt: new Date().toISOString(),
                      likeCount: 0,
                    },
                  ],
                }
              : c
          )
        );
        setReplyText("");
        setReplyingTo(null);
        // Auto-expand to show new reply
        setExpandedComments((prev) => new Set([...prev, commentId]));
      }
    } catch {
      // silently fail in demo
    } finally {
      setSendingReply(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-2 bg-dash-surface rounded-lg border border-dash-border">
          <MessageCircle className="w-4 h-4 text-brand-copper" />
          <span className="text-sm font-medium text-dash-text">{filtered.length} comments</span>
        </div>
        {unrepliedCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-dash-warn-soft rounded-lg border border-dash-warn">
            <div className="w-2 h-2 rounded-full bg-dash-warn" />
            <span className="text-sm font-medium text-dash-warn">
              {unrepliedCount} awaiting reply
            </span>
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-dash-text-secondary" />
          {(["all", "instagram", "facebook"] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setPlatformFilter(opt)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                platformFilter === opt
                  ? "bg-brand-copper/10 text-brand-copper"
                  : "bg-dash-bg text-dash-text-secondary hover:text-dash-text"
              }`}
            >
              {opt === "all" ? "All" : opt.charAt(0).toUpperCase() + opt.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-3">
        {filtered.map((comment) => {
          const isExpanded = expandedComments.has(comment.id);
          const hasReplies = comment.replies.length > 0;
          const isReplying = replyingTo === comment.id;
          const needsReply = !hasReplies;

          return (
            <div
              key={comment.id}
              className={`bg-dash-surface rounded-xl border transition-colors ${
                needsReply ? "border-dash-warn" : "border-dash-border"
              }`}
            >
              {/* Comment */}
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-dash-bg flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-dash-text-secondary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-dash-text">
                        {comment.author.name}
                      </span>
                      <StatusBadge
                        label={platformBadge[comment.platform].label}
                        variant={platformBadge[comment.platform].variant}
                      />
                      {needsReply && (
                        <span className="text-[10px] bg-dash-warn-soft text-dash-warn px-1.5 py-0.5 rounded font-medium">
                          Needs reply
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-dash-text leading-relaxed mb-2">
                      {comment.message}
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-[10px] text-dash-text-secondary">
                        {format(new Date(comment.createdAt), "MMM d, yyyy · h:mm a")}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleLike(comment.id)}
                        disabled={busyId === comment.id}
                        className={`inline-flex items-center gap-1 text-[10px] transition cursor-pointer disabled:opacity-50 ${
                          likedIds.has(comment.id)
                            ? "text-dash-cat-rose"
                            : "text-dash-text-secondary hover:text-dash-cat-rose"
                        }`}
                        title={likedIds.has(comment.id) ? "Unlike" : "Like"}
                      >
                        <Heart
                          className="w-3 h-3"
                          fill={likedIds.has(comment.id) ? "currentColor" : "none"}
                        />
                        <span>{comment.likeCount}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleHide(comment.id)}
                        disabled={busyId === comment.id}
                        className="inline-flex items-center gap-1 text-[10px] text-dash-text-secondary hover:text-dash-text transition cursor-pointer disabled:opacity-50"
                        title="Hide comment"
                      >
                        <EyeOff className="w-3 h-3" />
                        <span>Hide</span>
                      </button>
                      {comment.author.profileUrl ? (
                        <a
                          href={comment.author.profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-dash-text-secondary hover:text-brand-copper transition"
                          title="View author on platform"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>View</span>
                        </a>
                      ) : null}
                      {comment.postPreview && (
                        <span className="text-[10px] text-dash-text-secondary truncate max-w-[200px]">
                          on: {comment.postPreview}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Replies */}
              {hasReplies && (
                <div className="px-4 pb-2">
                  <button
                    onClick={() => toggleExpand(comment.id)}
                    className="flex items-center gap-1.5 text-xs text-brand-copper hover:text-brand-copper/80 transition-colors cursor-pointer mb-2"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                    {comment.replies.length} {comment.replies.length === 1 ? "reply" : "replies"}
                  </button>

                  {isExpanded && (
                    <div className="space-y-2 ml-11 pb-2">
                      {comment.replies.map((reply) => (
                        <div
                          key={reply.id}
                          className="bg-dash-bg/50 rounded-lg p-3"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-dash-text">
                              {reply.author.name}
                            </span>
                            <span className="text-[10px] text-dash-text-secondary">
                              {format(new Date(reply.createdAt), "MMM d · h:mm a")}
                            </span>
                          </div>
                          <p className="text-xs text-dash-text leading-relaxed">
                            {reply.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Reply Input */}
              <div className="px-4 pb-3">
                {isReplying ? (
                  <div className="flex gap-2 ml-11">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleReply(comment.id);
                        }
                      }}
                      placeholder="Write a reply..."
                      className="flex-1 bg-dash-bg border border-dash-border rounded-lg px-3 py-2 text-xs text-dash-text placeholder:text-dash-text-secondary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-2 focus:ring-brand-copper/30"
                      autoFocus
                    />
                    <button
                      onClick={() => handleReply(comment.id)}
                      disabled={!replyText.trim() || sendingReply}
                      className="p-2 rounded-lg bg-brand-copper text-white hover:bg-brand-copper/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      {sendingReply ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyText("");
                      }}
                      className="p-2 rounded-lg bg-dash-bg border border-dash-border text-dash-text-secondary hover:text-dash-text transition-colors cursor-pointer"
                    >
                      <span className="text-xs">Cancel</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setReplyingTo(comment.id)}
                    className="ml-11 text-xs text-brand-copper hover:text-brand-copper/80 transition-colors cursor-pointer"
                  >
                    Reply
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-dash-text-secondary">
          <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No comments to show.</p>
        </div>
      )}
    </div>
  );
}
