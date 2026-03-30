"use client";

import { format } from "date-fns";
import { Users, TrendingUp, Eye, Share2, Heart, MessageCircle } from "lucide-react";
import { KPICard } from "@/app/(dashboard)/components/kpi-card";
import { StatusBadge } from "@/app/(dashboard)/components/status-badge";

type Platform = "instagram" | "facebook" | "pinterest";

interface SocialPost {
  id: string;
  platform: Platform;
  content: string;
  likes: number;
  comments: number;
  shares: number;
  date: string;
  image: boolean;
}

const platformBadges: Record<Platform, { label: string; variant: "info" | "danger" | "warning" }> = {
  instagram: { label: "Instagram", variant: "danger" },
  facebook: { label: "Facebook", variant: "info" },
  pinterest: { label: "Pinterest", variant: "danger" },
};

const recentPosts: SocialPost[] = [
  {
    id: "1",
    platform: "instagram",
    content: "Our hand-hammered copper basins bring warmth and character to any bathroom. Each piece tells a story of artisan craftsmanship from Santa Clara del Cobre.",
    likes: 234,
    comments: 18,
    shares: 45,
    date: "2026-03-28",
    image: true,
  },
  {
    id: "2",
    platform: "facebook",
    content: "Exciting news! Our spring collection is now available. Visit our showroom in San Miguel de Allende to see these stunning pieces in person.",
    likes: 89,
    comments: 12,
    shares: 23,
    date: "2026-03-26",
    image: true,
  },
  {
    id: "3",
    platform: "pinterest",
    content: "Kitchen renovation inspiration: copper farmhouse sinks paired with rustic wooden countertops. Save this for your next project!",
    likes: 412,
    comments: 5,
    shares: 187,
    date: "2026-03-24",
    image: true,
  },
  {
    id: "4",
    platform: "instagram",
    content: "Behind the scenes at our artisan workshop. Watch master coppersmith Don Miguel shape a basin using techniques passed down through generations.",
    likes: 567,
    comments: 42,
    shares: 89,
    date: "2026-03-22",
    image: true,
  },
  {
    id: "5",
    platform: "facebook",
    content: "Thank you to our trade partners who joined us for the Spring Preview event this weekend. Your feedback on the new collection was invaluable!",
    likes: 56,
    comments: 8,
    shares: 11,
    date: "2026-03-20",
    image: false,
  },
];

const SocialPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-dash-text">Social Media</h2>
        <p className="text-sm text-dash-text-secondary mt-1">Monitor performance across all platforms</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Total Followers" value="12,847" change={5.3} icon={Users} accentColor="bg-brand-copper" />
        <KPICard label="Engagement Rate" value="4.8%" change={0.6} icon={TrendingUp} accentColor="bg-status-new" />
        <KPICard label="Reach (30d)" value="48.2K" change={12.1} icon={Eye} accentColor="bg-brand-sage" />
        <KPICard label="Posts This Month" value="18" change={-2} icon={Share2} accentColor="bg-brand-terracotta" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { platform: "Instagram", followers: "8,234", growth: "+312 this month", color: "bg-pink-500" },
          { platform: "Facebook", followers: "3,156", growth: "+87 this month", color: "bg-blue-600" },
          { platform: "Pinterest", followers: "1,457", growth: "+145 this month", color: "bg-red-600" },
        ].map((p) => (
          <div key={p.platform} className="bg-dash-surface rounded-xl border border-dash-border p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-9 h-9 rounded-lg ${p.color} flex items-center justify-center`}>
                <Users className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-dash-text">{p.platform}</p>
                <p className="text-xs text-dash-text-secondary">{p.growth}</p>
              </div>
            </div>
            <p className="text-2xl font-bold text-dash-text">{p.followers}</p>
          </div>
        ))}
      </div>

      <div className="bg-dash-surface rounded-xl border border-dash-border">
        <div className="p-5 border-b border-dash-border">
          <h3 className="text-sm font-semibold text-dash-text">Recent Posts</h3>
        </div>
        <div className="divide-y divide-dash-border">
          {recentPosts.map((post) => (
            <div key={post.id} className="p-5 hover:bg-dash-bg/30 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <StatusBadge label={platformBadges[post.platform].label} variant={platformBadges[post.platform].variant} />
                <span className="text-xs text-dash-text-secondary">{format(new Date(post.date), "MMM d, yyyy")}</span>
              </div>
              <p className="text-sm text-dash-text leading-relaxed mb-3">{post.content}</p>
              <div className="flex items-center gap-5">
                <div className="flex items-center gap-1.5 text-dash-text-secondary">
                  <Heart className="w-3.5 h-3.5" />
                  <span className="text-xs">{post.likes}</span>
                </div>
                <div className="flex items-center gap-1.5 text-dash-text-secondary">
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span className="text-xs">{post.comments}</span>
                </div>
                <div className="flex items-center gap-1.5 text-dash-text-secondary">
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="text-xs">{post.shares}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SocialPage;
