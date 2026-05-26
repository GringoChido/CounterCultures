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
} from "recharts";
import { KPICard } from "@/app/(dashboard)/components/kpi-card";
import { ChartCard } from "@/app/(dashboard)/components/chart-card";
import { DataPendingPlaceholder } from "@/app/(dashboard)/components/data-pending-placeholder";
import { downloadCsv } from "@/app/lib/csv-export";

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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type VisitorPoint = { month: string; visitors: number };
type DailyPoint = { day: string; visitors: number };

const MarketingTrafficPage = () => {
  const [visitorsOverTime, setVisitorsOverTime] = useState<VisitorPoint[]>([]);
  const [dailyVisitors, setDailyVisitors] = useState<DailyPoint[]>([]);
  const [kpis, setKpis] = useState({
    uniqueVisitors: "—",
    bounceRate: "—",
    avgSession: "—",
    conversionRate: "—",
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
        // keep empty defaults
      } finally {
        setLoading(false);
      }
    };
    fetchMarketing();
  }, []);

  const hasOverviewData = visitorsOverTime.length > 0;

  const handleExport = () => {
    switch (activeTab) {
      case "overview":
      default: {
        if (hasOverviewData) {
          downloadCsv(
            "marketing-traffic-overview",
            ["Month", "Unique Visitors"],
            visitorsOverTime.map((m) => [m.month, m.visitors]),
          );
        } else {
          downloadCsv(
            "marketing-traffic-overview",
            ["Note"],
            [["Data source not yet connected — no data to export"]],
          );
        }
        break;
      }
      case "sources":
      case "pages":
      case "campaigns":
      case "funnel": {
        downloadCsv(
          `marketing-${activeTab}`,
          ["Note"],
          [["Data source not yet connected — no data to export"]],
        );
        break;
      }
    }
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

      {/* Overview — wired to /api/dashboard/marketing-analytics */}
      {activeTab === "overview" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard label="Unique Visitors" value={kpis.uniqueVisitors} icon={Eye} accentColor="bg-brand-copper" />
            <KPICard label="Bounce Rate" value={kpis.bounceRate} icon={BarChart3} accentColor="bg-status-won" />
            <KPICard label="Avg Session" value={kpis.avgSession} icon={Clock} accentColor="bg-brand-sage" />
            <KPICard label="Conversion Rate" value={kpis.conversionRate} icon={Share2} accentColor="bg-brand-terracotta" />
          </div>

          {hasOverviewData ? (
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

              {dailyVisitors.length > 0 ? (
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
              ) : (
                <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
                  {/* TODO(week5-marketing): wire daily visitor data from GA4 */}
                  <DataPendingPlaceholder title="Daily Visitors" source="Google Analytics / GA4" />
                </div>
              )}
            </div>
          ) : (
            <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
              {/* TODO(week5-marketing): wire Google Analytics / GA4 */}
              <DataPendingPlaceholder title="Visitor Analytics" source="Google Analytics / GA4" />
            </div>
          )}
        </>
      )}

      {/* Sources — not yet connected */}
      {activeTab === "sources" && (
        <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
          {/* TODO(week5-marketing): wire Google Analytics / Search Console */}
          <DataPendingPlaceholder title="Traffic Sources" source="Google Analytics" />
        </div>
      )}

      {/* Pages — not yet connected */}
      {activeTab === "pages" && (
        <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
          {/* TODO(week5-marketing): wire Google Analytics top pages */}
          <DataPendingPlaceholder title="Top Pages" source="Google Analytics" />
        </div>
      )}

      {/* Campaigns — not yet connected */}
      {activeTab === "campaigns" && (
        <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
          {/* TODO(week5-marketing): wire campaign platform (Meta Ads, email) */}
          <DataPendingPlaceholder title="Campaign Performance" source="Meta Ads / Email platform" />
        </div>
      )}

      {/* Funnel — not yet connected */}
      {activeTab === "funnel" && (
        <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
          {/* TODO(week5-marketing): wire end-to-end funnel from analytics + CRM */}
          <DataPendingPlaceholder title="Marketing to Revenue Funnel" source="Analytics + CRM pipeline" />
        </div>
      )}
    </div>
  );
};

export default MarketingTrafficPage;
