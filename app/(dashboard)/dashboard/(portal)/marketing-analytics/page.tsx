"use client";

import { useState, useEffect } from "react";
import {
  Eye,
  BarChart3,
  Clock,
  Share2,
  Loader2,
  Download,
  TrendingUp,
  Layers,
  FileText,
  Megaphone,
  GitBranch,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { KPICard } from "@/app/(dashboard)/components/kpi-card";
import { ChartCard } from "@/app/(dashboard)/components/chart-card";
import { downloadCsv } from "@/app/lib/csv-export";

// ---------------------------------------------------------------------------
// Fallback sample data
// ---------------------------------------------------------------------------

const fallbackVisitorsOverTime = [
  { month: "Oct", visitors: 4200 },
  { month: "Nov", visitors: 5800 },
  { month: "Dec", visitors: 3500 },
  { month: "Jan", visitors: 6700 },
  { month: "Feb", visitors: 7200 },
  { month: "Mar", visitors: 6400 },
];

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
  { source: "Social Media", sessions: 760, percentage: 17, color: "bg-dash-cat-pink" },
  { source: "Referral", sessions: 520, percentage: 12, color: "bg-dash-info" },
  { source: "Email", sessions: 310, percentage: 7, color: "bg-brand-terracotta" },
];

const leadSourceData = [
  { name: "Showroom", value: 35, color: "#B87333" },
  { name: "Website", value: 25, color: "#C4725A" },
  { name: "Referral", value: 20, color: "#7A8B6F" },
  { name: "Instagram", value: 12, color: "#A89F91" },
  { name: "WhatsApp", value: 8, color: "#D4C5A9" },
];

const channelPerformance = [
  { channel: "Organic Search", leads: 28, cost: 0, conversion: 4.2 },
  { channel: "Instagram Ads", leads: 15, cost: 12500, conversion: 2.8 },
  { channel: "Facebook Ads", leads: 11, cost: 9800, conversion: 2.1 },
  { channel: "Email Marketing", leads: 8, cost: 1200, conversion: 6.5 },
  { channel: "WhatsApp", leads: 6, cost: 0, conversion: 8.3 },
  { channel: "Referral", leads: 4, cost: 0, conversion: 12.0 },
];

const campaignMetrics = [
  { name: "Spring Collection Launch", impressions: 45200, clicks: 2890, leads: 18, cpl: 42 },
  { name: "Trade Program Awareness", impressions: 12800, clicks: 1150, leads: 12, cpl: 38 },
  { name: "Artisan Story Series", impressions: 32600, clicks: 4120, leads: 8, cpl: 0 },
  { name: "Copper Care Workshop", impressions: 8400, clicks: 720, leads: 6, cpl: 0 },
];

const funnelData = [
  { name: "Email Campaigns", value: 145, color: "#635bff" },
  { name: "New Leads", value: 12, color: "#B87333" },
  { name: "Pipeline", value: 10400000, color: "#C4725A", isCurrency: true },
  { name: "Quotes", value: 6, color: "#7A8B6F" },
  { name: "Won", value: 320000, color: "#22c55e", isCurrency: true },
];

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

type TabId = "overview" | "sources" | "pages" | "campaigns" | "funnel";

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: TrendingUp },
  { id: "sources", label: "Sources", icon: Layers },
  { id: "pages", label: "Pages", icon: FileText },
  { id: "campaigns", label: "Campaigns", icon: Megaphone },
  { id: "funnel", label: "Funnel", icon: GitBranch },
];

const formatCurrency = (value: number) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const MarketingTrafficPage = () => {
  const [visitorsOverTime, setVisitorsOverTime] = useState(fallbackVisitorsOverTime);
  const [kpis, setKpis] = useState({
    uniqueVisitors: "6,400",
    bounceRate: "42.3%",
    avgSession: "2:45",
    conversionRate: "4.8%",
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  useEffect(() => {
    const fetchMarketing = async () => {
      try {
        const res = await fetch("/api/dashboard/marketing-analytics");
        if (res.ok) {
          const data = await res.json();
          const metrics = data.metrics as Array<Record<string, string>>;
          if (metrics.length > 0) {
            const chartData = metrics.map((m) => ({
              month: m.date || "",
              visitors: parseInt(m.unique_visitors) || 0,
            }));
            if (chartData.some((d) => d.visitors > 0)) {
              setVisitorsOverTime(chartData);
            }
            const latest = metrics[metrics.length - 1];
            if (latest.website_visits) {
              setKpis({
                uniqueVisitors: parseInt(latest.unique_visitors || "0").toLocaleString(),
                bounceRate: latest.bounce_rate ? `${latest.bounce_rate}%` : "0%",
                avgSession: latest.avg_session || "0:00",
                conversionRate: latest.conversion_rate ? `${latest.conversion_rate}%` : "0%",
              });
            }
          }
        }
      } catch {
        // keep fallback
      } finally {
        setLoading(false);
      }
    };
    fetchMarketing();
  }, []);

  const handleExport = () => {
    let filename: string;
    let headers: string[];
    let rows: (string | number)[][];
    switch (activeTab) {
      case "sources":
        filename = "traffic-sources";
        headers = ["Source", "Sessions", "%"];
        rows = trafficSources.map((s) => [s.source, s.sessions, s.percentage]);
        break;
      case "pages":
        filename = "top-pages";
        headers = ["Page", "Views", "%"];
        rows = topPages.map((p) => [p.page, p.views, p.percentage]);
        break;
      case "campaigns":
        filename = "channel-performance";
        headers = ["Channel", "Leads", "Cost (MXN)", "Conversion %"];
        rows = channelPerformance.map((c) => [c.channel, c.leads, c.cost, c.conversion]);
        break;
      case "funnel":
        filename = "funnel";
        headers = ["Stage", "Value"];
        rows = funnelData.map((f) => [f.name, f.value]);
        break;
      default:
        filename = "marketing-traffic-overview";
        headers = ["Month", "Unique Visitors"];
        rows = visitorsOverTime.map((m) => [m.month, m.visitors]);
    }
    downloadCsv(filename, headers, rows);
    toast.success("CSV exported");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-copper" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-dash-text">Marketing &amp; Traffic</h2>
          <p className="text-sm text-dash-text-secondary mt-1">
            Traffic, sources, pages, campaigns, and funnel — one destination
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-dash-border text-dash-text rounded-lg text-xs font-medium hover:bg-dash-bg transition-colors cursor-pointer shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-dash-bg rounded-xl p-1 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? "bg-dash-surface text-brand-copper shadow-sm"
                  : "text-dash-text-secondary hover:text-dash-text hover:bg-dash-surface/50"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Overview */}
      {activeTab === "overview" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard label="Unique Visitors" value={kpis.uniqueVisitors} icon={Eye} accentColor="bg-brand-copper" />
            <KPICard label="Bounce Rate" value={kpis.bounceRate} icon={BarChart3} accentColor="bg-status-won" />
            <KPICard label="Avg Session" value={kpis.avgSession} icon={Clock} accentColor="bg-brand-sage" />
            <KPICard label="Conversion Rate" value={kpis.conversionRate} icon={Share2} accentColor="bg-brand-terracotta" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard title="Visitors Over Time" subtitle="Monthly unique visitors">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={visitorsOverTime}>
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6B7280" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6B7280" }} />
                    <Tooltip
                      formatter={(value) => [Number(value).toLocaleString(), "Visitors"]}
                      contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "12px" }}
                    />
                    <Line type="monotone" dataKey="visitors" stroke="#B87333" strokeWidth={2} dot={{ fill: "#B87333", r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

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
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6B7280" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6B7280" }} />
                    <Tooltip
                      formatter={(value) => [Number(value).toLocaleString(), "Visitors"]}
                      contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "12px" }}
                    />
                    <Area type="monotone" dataKey="visitors" stroke="#B87333" strokeWidth={2} fill="url(#visitorsGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>
        </>
      )}

      {/* Sources */}
      {activeTab === "sources" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

          <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
            <h3 className="text-sm font-semibold text-dash-text mb-4">Lead Sources</h3>
            <div className="h-52 flex items-center">
              <ResponsiveContainer width="50%" height="100%">
                <PieChart>
                  <Pie data={leadSourceData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" strokeWidth={0}>
                    {leadSourceData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {leadSourceData.map((source) => (
                  <div key={source.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: source.color }} />
                    <span className="text-xs text-dash-text-secondary">{source.name}</span>
                    <span className="text-xs font-medium text-dash-text ml-auto">{source.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pages */}
      {activeTab === "pages" && (
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
      )}

      {/* Campaigns */}
      {activeTab === "campaigns" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
            <h3 className="text-sm font-semibold text-dash-text mb-4">Channel Performance</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dash-border">
                    <th className="text-left py-2 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Channel</th>
                    <th className="text-right py-2 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Leads</th>
                    <th className="text-right py-2 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Cost</th>
                    <th className="text-right py-2 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Conv %</th>
                  </tr>
                </thead>
                <tbody>
                  {channelPerformance.map((ch) => (
                    <tr key={ch.channel} className="border-b border-dash-border last:border-0">
                      <td className="py-2.5 font-medium text-dash-text">{ch.channel}</td>
                      <td className="py-2.5 text-right text-dash-text">{ch.leads}</td>
                      <td className="py-2.5 text-right text-dash-text">{ch.cost > 0 ? `$${ch.cost.toLocaleString()}` : "Organic"}</td>
                      <td className="py-2.5 text-right font-medium text-brand-copper">{ch.conversion}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
            <h3 className="text-sm font-semibold text-dash-text mb-4">Campaign Metrics</h3>
            <div className="space-y-4">
              {campaignMetrics.map((campaign) => (
                <div key={campaign.name} className="py-2 border-b border-dash-border last:border-0">
                  <p className="text-sm font-medium text-dash-text mb-2">{campaign.name}</p>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <p className="text-[10px] text-dash-text-secondary uppercase">Impressions</p>
                      <p className="text-xs font-medium text-dash-text">{campaign.impressions.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-dash-text-secondary uppercase">Clicks</p>
                      <p className="text-xs font-medium text-dash-text">{campaign.clicks.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-dash-text-secondary uppercase">Leads</p>
                      <p className="text-xs font-medium text-dash-text">{campaign.leads}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-dash-text-secondary uppercase">CPL</p>
                      <p className="text-xs font-medium text-dash-text">{campaign.cpl > 0 ? `$${campaign.cpl}` : "Organic"}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Funnel */}
      {activeTab === "funnel" && (
        <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
          <h3 className="text-sm font-semibold text-dash-text mb-6">Marketing to Revenue Funnel</h3>
          <div className="flex items-center justify-between overflow-x-auto gap-2">
            {funnelData.map((step, i) => (
              <div key={step.name} className="flex items-center gap-2 min-w-0">
                <div className="text-center min-w-[110px]">
                  <p className="text-2xl font-bold" style={{ color: step.color }}>
                    {step.isCurrency ? formatCurrency(step.value) : step.value.toLocaleString()}
                  </p>
                  <p className="text-xs text-dash-text-secondary mt-1">{step.name}</p>
                </div>
                {i < funnelData.length - 1 && (
                  <ArrowRight className="w-5 h-5 text-dash-text-secondary shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketingTrafficPage;
