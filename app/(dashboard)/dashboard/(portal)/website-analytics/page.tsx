"use client";

import { Globe, Eye, TrendingDown, Clock } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import { KPICard } from "@/app/(dashboard)/components/kpi-card";
import { ChartCard } from "@/app/(dashboard)/components/chart-card";

const dailyVisitors = [
  { day: "Mon", visitors: 245 },
  { day: "Tue", visitors: 312 },
  { day: "Wed", visitors: 278 },
  { day: "Thu", visitors: 390 },
  { day: "Fri", visitors: 420 },
  { day: "Sat", visitors: 350 },
  { day: "Sun", visitors: 285 },
];

const topPages = [
  { page: "/products/copper-basins", views: 1240, percentage: 28 },
  { page: "/collections/spring-2026", views: 890, percentage: 20 },
  { page: "/about/our-artisans", views: 645, percentage: 15 },
  { page: "/trade-program", views: 523, percentage: 12 },
  { page: "/blog/copper-care-guide", views: 412, percentage: 9 },
];

const trafficSources = [
  { source: "Organic Search", sessions: 1850, percentage: 42, color: "bg-brand-copper" },
  { source: "Direct", sessions: 980, percentage: 22, color: "bg-brand-sage" },
  { source: "Social Media", sessions: 760, percentage: 17, color: "bg-pink-500" },
  { source: "Referral", sessions: 520, percentage: 12, color: "bg-blue-500" },
  { source: "Email", sessions: 310, percentage: 7, color: "bg-brand-terracotta" },
];

const WebsiteAnalyticsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-dash-text">Website Analytics</h2>
        <p className="text-sm text-dash-text-secondary mt-1">Track website performance and visitor behavior</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Visitors (7d)" value="2,280" change={8.4} icon={Globe} accentColor="bg-brand-copper" />
        <KPICard label="Page Views (7d)" value="6,840" change={12.1} icon={Eye} accentColor="bg-status-new" />
        <KPICard label="Bounce Rate" value="38.2%" change={-3.1} icon={TrendingDown} accentColor="bg-brand-sage" />
        <KPICard label="Avg Session" value="3m 24s" change={5.7} icon={Clock} accentColor="bg-brand-terracotta" />
      </div>

      <ChartCard title="Daily Visitors" subtitle="Last 7 days">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyVisitors}>
              <defs>
                <linearGradient id="visitorsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#B87333" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#B87333" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#6B7280" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#6B7280" }}
              />
              <Tooltip
                formatter={(value) => [Number(value).toLocaleString(), "Visitors"]}
                contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "12px" }}
              />
              <Area
                type="monotone"
                dataKey="visitors"
                stroke="#B87333"
                strokeWidth={2}
                fill="url(#visitorsGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
          <h3 className="text-sm font-semibold text-dash-text mb-4">Top Pages</h3>
          <div className="space-y-3">
            {topPages.map((page) => (
              <div key={page.page} className="flex items-center justify-between py-2 border-b border-dash-border last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-dash-text truncate">{page.page}</p>
                  <div className="w-full bg-dash-bg rounded-full h-1.5 mt-1.5">
                    <div className="bg-brand-copper h-1.5 rounded-full" style={{ width: `${page.percentage}%` }} />
                  </div>
                </div>
                <div className="text-right ml-4 shrink-0">
                  <p className="text-sm font-medium text-dash-text">{page.views.toLocaleString()}</p>
                  <p className="text-xs text-dash-text-secondary">{page.percentage}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
          <h3 className="text-sm font-semibold text-dash-text mb-4">Traffic Sources</h3>
          <div className="space-y-3">
            {trafficSources.map((source) => (
              <div key={source.source} className="flex items-center justify-between py-2 border-b border-dash-border last:border-0">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${source.color}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-dash-text">{source.source}</p>
                    <div className="w-full bg-dash-bg rounded-full h-1.5 mt-1.5">
                      <div className={`${source.color} h-1.5 rounded-full`} style={{ width: `${source.percentage}%` }} />
                    </div>
                  </div>
                </div>
                <div className="text-right ml-4 shrink-0">
                  <p className="text-sm font-medium text-dash-text">{source.sessions.toLocaleString()}</p>
                  <p className="text-xs text-dash-text-secondary">{source.percentage}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebsiteAnalyticsPage;
