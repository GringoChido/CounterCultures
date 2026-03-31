"use client";

import { useState } from "react";
import { Wifi, WifiOff } from "lucide-react";
import { SocialTabs } from "@/app/(dashboard)/components/social/social-tabs";
import { SocialFeed } from "@/app/(dashboard)/components/social/social-feed";
import { PostComposer } from "@/app/(dashboard)/components/social/post-composer";
import { CommentsPanel } from "@/app/(dashboard)/components/social/comments-panel";
import { AnalyticsDashboard } from "@/app/(dashboard)/components/social/analytics-dashboard";
import { samplePosts, sampleComments, sampleAnalytics } from "@/app/lib/social/sample-data";

const SocialPage = () => {
  const [activeTab, setActiveTab] = useState("feed");

  // Using sample data — in production these would come from SWR/API calls
  const posts = samplePosts;
  const comments = sampleComments;
  const igAnalytics = sampleAnalytics.instagram_30d;
  const fbAnalytics = sampleAnalytics.facebook_30d;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-dash-text">Social Media Hub</h2>
          <p className="text-sm text-dash-text-secondary mt-1">
            Create, publish, engage, and track — all in one place
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
          <WifiOff className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-xs text-amber-700 font-medium">Demo Mode</span>
          <span className="text-[10px] text-amber-500">Connect Meta API for live data</span>
        </div>
      </div>

      {/* Tabs */}
      <SocialTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      <div>
        {activeTab === "feed" && <SocialFeed posts={posts} />}
        {activeTab === "create" && <PostComposer />}
        {activeTab === "comments" && <CommentsPanel comments={comments} />}
        {activeTab === "analytics" && (
          <AnalyticsDashboard instagram={igAnalytics} facebook={fbAnalytics} />
        )}
      </div>
    </div>
  );
};

export default SocialPage;
