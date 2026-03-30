"use client";

import { DollarSign, Target, TrendingUp, Award } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { KPICard } from "@/app/(dashboard)/components/kpi-card";
import { ChartCard } from "@/app/(dashboard)/components/chart-card";

const monthlyRevenue = [
  { month: "Oct", revenue: 285000 },
  { month: "Nov", revenue: 420000 },
  { month: "Dec", revenue: 355000 },
  { month: "Jan", revenue: 490000 },
  { month: "Feb", revenue: 530000 },
  { month: "Mar", revenue: 340000 },
];

const topProducts = [
  { name: "Hand-Hammered Oval Basin", units: 24, revenue: 216000 },
  { name: "Copper Farmhouse Sink 33\"", units: 12, revenue: 180000 },
  { name: "Round Vessel Basin", units: 18, revenue: 126000 },
  { name: "Copper Bar Sink", units: 15, revenue: 82500 },
  { name: "Custom Patina Basin", units: 8, revenue: 96000 },
];

const recentDeals = [
  { client: "Martinez Design Group", value: 85000, status: "Won", date: "Mar 28" },
  { client: "Coastal Living Interiors", value: 120000, status: "Won", date: "Mar 22" },
  { client: "Pacific Homes Builder", value: 65000, status: "Won", date: "Mar 18" },
  { client: "Hacienda Renovations", value: 45000, status: "Won", date: "Mar 12" },
];

const formatCurrency = (value: number) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
};

const SalesAnalyticsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-dash-text">Sales Analytics</h2>
        <p className="text-sm text-dash-text-secondary mt-1">Revenue performance and deal metrics</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Total Revenue" value="$2.42M" change={14.2} icon={DollarSign} accentColor="bg-brand-copper" />
        <KPICard label="Deals Closed" value="38" change={8.5} icon={Target} accentColor="bg-status-won" />
        <KPICard label="Avg Deal Size" value="$63.7K" change={3.1} icon={TrendingUp} accentColor="bg-brand-sage" />
        <KPICard label="Win Rate" value="72%" change={5.0} icon={Award} accentColor="bg-brand-terracotta" />
      </div>

      <ChartCard title="Monthly Revenue" subtitle="Last 6 months (MXN)">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyRevenue}>
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
                tickFormatter={(v) => formatCurrency(v)}
              />
              <Tooltip
                formatter={(value) => [`$${Number(value).toLocaleString()} MXN`, "Revenue"]}
                contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "12px" }}
              />
              <Bar dataKey="revenue" fill="#B87333" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
          <h3 className="text-sm font-semibold text-dash-text mb-4">Top Products by Revenue</h3>
          <div className="space-y-3">
            {topProducts.map((product, i) => (
              <div key={product.name} className="flex items-center justify-between py-2 border-b border-dash-border last:border-0">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-copper/10 flex items-center justify-center text-xs font-semibold text-brand-copper">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-dash-text">{product.name}</p>
                    <p className="text-xs text-dash-text-secondary">{product.units} units sold</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-brand-copper">{formatCurrency(product.revenue)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
          <h3 className="text-sm font-semibold text-dash-text mb-4">Recent Closed Deals</h3>
          <div className="space-y-3">
            {recentDeals.map((deal) => (
              <div key={deal.client} className="flex items-center justify-between py-2 border-b border-dash-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-dash-text">{deal.client}</p>
                  <p className="text-xs text-dash-text-secondary">{deal.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-brand-copper">{formatCurrency(deal.value)}</p>
                  <span className="text-xs text-status-won font-medium">{deal.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesAnalyticsPage;
