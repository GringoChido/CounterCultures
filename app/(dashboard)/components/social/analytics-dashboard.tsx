"use client";

import { useState, useMemo } from "react";
import {
  Users,
  TrendingUp,
  Eye,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { KPICard } from "@/app/(dashboard)/components/kpi-card";
import type { PlatformAnalytics, SocialPlatform } from "@/app/lib/social/types";

interface AnalyticsDashboardProps {
  instagram: PlatformAnalytics;
  facebook: PlatformAnalytics;
}

type Period = "7d" | "30d";

export function AnalyticsDashboard({ instagram, facebook }: AnalyticsDashboardProps) {
  const [period, setPeriod] = useState<Period>("30d");
  const [activePlatform, setActivePlatform] = useState<"all" | SocialPlatform>("all");

  // Combined metrics
  const combined = useMemo(() => {
    const ig = instagram;
    const fb = facebook;
    return {
      totalFollowers: ig.followers + fb.followers,
      totalGrowth: ig.followerGrowth + fb.followerGrowth,
      totalReach: ig.totalReach + fb.totalReach,
      totalImpressions: ig.totalImpressions + fb.totalImpressions,
      avgEngagement:
        Math.round(((ig.engagementRate + fb.engagementRate) / 2) * 10) / 10,
      totalPosts: ig.postsPublished + fb.postsPublished,
    };
  }, [instagram, facebook]);

  // Merge daily metrics for combined chart
  const mergedDaily = useMemo(() => {
    const igMetrics = instagram.dailyMetrics;
    const fbMetrics = facebook.dailyMetrics;
    const len = Math.min(igMetrics.length, fbMetrics.length);

    return Array.from({ length: len }, (_, i) => ({
      date: igMetrics[i].date.slice(5), // "MM-DD"
      igReach: igMetrics[i].reach,
      fbReach: fbMetrics[i].reach,
      igImpressions: igMetrics[i].impressions,
      fbImpressions: fbMetrics[i].impressions,
      igEngagement: igMetrics[i].engagement,
      fbEngagement: fbMetrics[i].engagement,
      igFollowers: igMetrics[i].followers,
      fbFollowers: fbMetrics[i].followers,
      totalReach: igMetrics[i].reach + fbMetrics[i].reach,
      totalImpressions: igMetrics[i].impressions + fbMetrics[i].impressions,
    }));
  }, [instagram, facebook]);

  const formatNum = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toString();

  return (
    <div className="space-y-6">
      {/* Period + Platform Toggle */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 bg-dash-bg rounded-lg p-1">
          {(["7d", "30d"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                period === p
                  ? "bg-dash-surface text-brand-copper shadow-sm"
                  : "text-dash-text-secondary hover:text-dash-text"
              }`}
            >
              {p === "7d" ? "7 Days" : "30 Days"}
            </button>
          ))}
        </div>

        <div className="flex gap-1 bg-dash-bg rounded-lg p-1">
          {(["all", "instagram", "facebook"] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setActivePlatform(opt)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                activePlatform === opt
                  ? "bg-dash-surface text-brand-copper shadow-sm"
                  : "text-dash-text-secondary hover:text-dash-text"
              }`}
            >
              {opt === "all"
                ? "Combined"
                : opt.charAt(0).toUpperCase() + opt.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          label="Total Followers"
          value={formatNum(combined.totalFollowers)}
          change={Math.round((combined.totalGrowth / combined.totalFollowers) * 100 * 10) / 10}
          icon={Users}
          accentColor="bg-brand-copper"
        />
        <KPICard
          label="Engagement Rate"
          value={`${combined.avgEngagement}%`}
          change={0.6}
          icon={TrendingUp}
          accentColor="bg-status-new"
        />
        <KPICard
          label={`Reach (${period})`}
          value={formatNum(combined.totalReach)}
          change={12.1}
          icon={Eye}
          accentColor="bg-brand-sage"
        />
        <KPICard
          label="Posts Published"
          value={combined.totalPosts.toString()}
          change={0}
          icon={BarChart3}
          accentColor="bg-brand-terracotta"
        />
      </div>

      {/* Platform Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { data: instagram, label: "Instagram", color: "bg-pink-500", textColor: "text-pink-600" },
          { data: facebook, label: "Facebook", color: "bg-blue-600", textColor: "text-blue-600" },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-dash-surface rounded-xl border border-dash-border p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-lg ${item.color} flex items-center justify-center`}
                >
                  <Users className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-dash-text">{item.label}</p>
                  <p className="text-2xl font-bold text-dash-text">
                    {formatNum(item.data.followers)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-green-600">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span className="text-sm font-semibold">
                    +{item.data.followerGrowth}
                  </span>
                </div>
                <p className="text-[10px] text-dash-text-secondary">this period</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <MiniStat label="Reach" value={formatNum(item.data.totalReach)} />
              <MiniStat label="Impressions" value={formatNum(item.data.totalImpressions)} />
              <MiniStat
                label="Engagement"
                value={`${item.data.engagementRate}%`}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Reach Chart */}
      <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
        <h3 className="text-sm font-semibold text-dash-text mb-4">
          Reach Over Time
        </h3>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mergedDaily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#6B7280" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#6B7280" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => formatNum(v)}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #E5E7EB",
                  fontSize: 12,
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
                iconType="circle"
                iconSize={8}
              />
              {(activePlatform === "all" || activePlatform === "instagram") && (
                <Area
                  type="monotone"
                  dataKey="igReach"
                  name="Instagram"
                  stroke="#EC4899"
                  fill="#EC4899"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              )}
              {(activePlatform === "all" || activePlatform === "facebook") && (
                <Area
                  type="monotone"
                  dataKey="fbReach"
                  name="Facebook"
                  stroke="#2563EB"
                  fill="#2563EB"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Engagement Chart */}
      <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
        <h3 className="text-sm font-semibold text-dash-text mb-4">
          Engagement Rate (%)
        </h3>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mergedDaily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#6B7280" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#6B7280" }}
                tickLine={false}
                axisLine={false}
                domain={[0, "auto"]}
                unit="%"
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #E5E7EB",
                  fontSize: 12,
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
                iconType="circle"
                iconSize={8}
              />
              {(activePlatform === "all" || activePlatform === "instagram") && (
                <Line
                  type="monotone"
                  dataKey="igEngagement"
                  name="Instagram"
                  stroke="#EC4899"
                  strokeWidth={2}
                  dot={false}
                />
              )}
              {(activePlatform === "all" || activePlatform === "facebook") && (
                <Line
                  type="monotone"
                  dataKey="fbEngagement"
                  name="Facebook"
                  stroke="#2563EB"
                  strokeWidth={2}
                  dot={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Follower Growth Chart */}
      <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
        <h3 className="text-sm font-semibold text-dash-text mb-4">
          Follower Growth
        </h3>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mergedDaily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#6B7280" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#6B7280" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => formatNum(v)}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #E5E7EB",
                  fontSize: 12,
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
                iconType="circle"
                iconSize={8}
              />
              {(activePlatform === "all" || activePlatform === "instagram") && (
                <Bar
                  dataKey="igFollowers"
                  name="Instagram"
                  fill="#EC4899"
                  radius={[4, 4, 0, 0]}
                  fillOpacity={0.8}
                />
              )}
              {(activePlatform === "all" || activePlatform === "facebook") && (
                <Bar
                  dataKey="fbFollowers"
                  name="Facebook"
                  fill="#2563EB"
                  radius={[4, 4, 0, 0]}
                  fillOpacity={0.8}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-dash-bg/50 rounded-lg p-2.5 text-center">
      <p className="text-[10px] text-dash-text-secondary uppercase tracking-wider mb-0.5">
        {label}
      </p>
      <p className="text-sm font-bold text-dash-text">{value}</p>
    </div>
  );
}
