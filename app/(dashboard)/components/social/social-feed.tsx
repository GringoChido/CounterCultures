"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Heart,
  MessageCircle,
  Share2,
  Eye,
  Bookmark,
  ExternalLink,
  Image as ImageIcon,
  Video,
  Filter,
} from "lucide-react";
import { StatusBadge } from "@/app/(dashboard)/components/status-badge";
import type { SocialPost, SocialPlatform } from "@/app/lib/social/types";

const platformConfig: Record<
  SocialPlatform,
  { label: string; variant: "info" | "danger"; color: string }
> = {
  instagram: { label: "Instagram", variant: "danger", color: "bg-pink-500" },
  facebook: { label: "Facebook", variant: "info", color: "bg-blue-600" },
};

interface SocialFeedProps {
  posts: SocialPost[];
}

export function SocialFeed({ posts }: SocialFeedProps) {
  const [platformFilter, setPlatformFilter] = useState<"all" | SocialPlatform>("all");
  const [sortBy, setSortBy] = useState<"date" | "engagement">("date");

  const filtered = posts
    .filter((p) => platformFilter === "all" || p.platform === platformFilter)
    .sort((a, b) => {
      if (sortBy === "engagement") {
        const engA = a.metrics.likes + a.metrics.comments + a.metrics.shares;
        const engB = b.metrics.likes + b.metrics.comments + b.metrics.shares;
        return engB - engA;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-sm text-dash-text-secondary">
          <Filter className="w-3.5 h-3.5" />
          <span>Filter:</span>
        </div>
        {(["all", "instagram", "facebook"] as const).map((opt) => (
          <button
            key={opt}
            onClick={() => setPlatformFilter(opt)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              platformFilter === opt
                ? "bg-brand-copper/10 text-brand-copper border border-brand-copper/20"
                : "bg-dash-bg text-dash-text-secondary hover:text-dash-text border border-transparent"
            }`}
          >
            {opt === "all" ? "All Platforms" : opt.charAt(0).toUpperCase() + opt.slice(1)}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-dash-text-secondary">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "date" | "engagement")}
            className="text-xs bg-dash-bg border border-dash-border rounded-lg px-2 py-1.5 text-dash-text"
          >
            <option value="date">Latest</option>
            <option value="engagement">Top Engagement</option>
          </select>
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-3">
        {filtered.map((post) => (
          <div
            key={post.id}
            className="bg-dash-surface rounded-xl border border-dash-border p-5 hover:border-brand-copper/20 transition-colors"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg ${platformConfig[post.platform].color} flex items-center justify-center`}
                >
                  {post.mediaType === "VIDEO" ? (
                    <Video className="w-4 h-4 text-white" />
                  ) : (
                    <ImageIcon className="w-4 h-4 text-white" />
                  )}
                </div>
                <div>
                  <StatusBadge
                    label={platformConfig[post.platform].label}
                    variant={platformConfig[post.platform].variant}
                  />
                  <p className="text-[10px] text-dash-text-secondary mt-0.5">
                    {format(new Date(post.createdAt), "MMM d, yyyy · h:mm a")}
                  </p>
                </div>
              </div>
              {post.permalink && post.permalink !== "#" && (
                <a
                  href={post.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-dash-text-secondary hover:text-brand-copper transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>

            {/* Content */}
            <p className="text-sm text-dash-text leading-relaxed mb-4">
              {post.message}
            </p>

            {/* Metrics */}
            <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-dash-border">
              <MetricPill icon={Heart} value={post.metrics.likes} label="Likes" />
              <MetricPill
                icon={MessageCircle}
                value={post.metrics.comments}
                label="Comments"
              />
              <MetricPill icon={Share2} value={post.metrics.shares} label="Shares" />
              {post.metrics.reach && (
                <MetricPill icon={Eye} value={post.metrics.reach} label="Reach" />
              )}
              {post.metrics.saves && (
                <MetricPill icon={Bookmark} value={post.metrics.saves} label="Saves" />
              )}
              {post.metrics.engagement && (
                <div className="ml-auto">
                  <span className="text-xs font-semibold text-brand-copper">
                    {post.metrics.engagement}% engagement
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-dash-text-secondary">
          <p className="text-sm">No posts found for this filter.</p>
        </div>
      )}
    </div>
  );
}

function MetricPill({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ElementType;
  value: number;
  label: string;
}) {
  const formatted = value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value.toString();
  return (
    <div className="flex items-center gap-1.5 text-dash-text-secondary" title={label}>
      <Icon className="w-3.5 h-3.5" />
      <span className="text-xs font-medium">{formatted}</span>
    </div>
  );
}
