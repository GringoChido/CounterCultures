"use client";

import { useState, useEffect } from "react";
import { Users, DollarSign, Mail, Share2, Loader2 } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import { KPICard } from "@/app/(dashboard)/components/kpi-card";
import { ChartCard } from "@/app/(dashboard)/components/chart-card";

const fallbackLeadsOverTime = [
  { month: "Oct", leads: 42 },
  { month: "Nov", leads: 58 },
  { month: "Dec", leads: 35 },
  { month: "Jan", leads: 67 },
  { month: "Feb", leads: 72 },
  { month: "Mar", leads: 64 },
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

const MarketingAnalyticsPage = () => {
  const [leadsOverTime, setLeadsOverTime] = useState(fallbackLeadsOverTime);
  const [kpis, setKpis] = useState({ leadsGenerated: "72", costPerLead: "$32.80", emailOpenRate: "49.3%", socialEngagement: "4.8%" });
  const [loading, setLoading] = useState(true);

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
              leads: parseInt(m.unique_visitors) || 0,
            }));
            if (chartData.some((d) => d.leads > 0)) {
              setLeadsOverTime(chartData);
            }
            const latest = metrics[metrics.length - 1];
            if (latest.website_visits) {
              setKpis({
                leadsGenerated: latest.unique_visitors || "0",
                costPerLead: "$" + (parseFloat(latest.bounce_rate) || 0).toFixed(1),
                emailOpenRate: latest.avg_session || "0",
                socialEngagement: latest.conversion_rate ? `${latest.conversion_rate}%` : "0%",
              });
            }
          }
        }
      } catch {
        // Keep fallback data
      } finally {
        setLoading(false);
      }
    };
    fetchMarketing();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-copper" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-dash-text">Marketing Analytics</h2>
        <p className="text-sm text-dash-text-secondary mt-1">Track marketing performance and lead generation</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Leads Generated" value={kpis.leadsGenerated} icon={Users} accentColor="bg-brand-copper" />
        <KPICard label="Cost per Lead" value={kpis.costPerLead} icon={DollarSign} accentColor="bg-status-won" />
        <KPICard label="Email Open Rate" value={kpis.emailOpenRate} icon={Mail} accentColor="bg-brand-sage" />
        <KPICard label="Social Engagement" value={kpis.socialEngagement} icon={Share2} accentColor="bg-brand-terracotta" />
      </div>

      <ChartCard title="Leads Over Time" subtitle="Monthly lead generation">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={leadsOverTime}>
              <XAxis
                dataKey="month"
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
                formatter={(value) => [value, "Leads"]}
                contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "12px" }}
              />
              <Line
                type="monotone"
                dataKey="leads"
                stroke="#B87333"
                strokeWidth={2}
                dot={{ fill: "#B87333", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

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
    </div>
  );
};

export default MarketingAnalyticsPage;
