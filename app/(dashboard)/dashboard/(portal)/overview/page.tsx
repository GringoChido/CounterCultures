"use client";

import { format } from "date-fns";
import {
  Users,
  DollarSign,
  TrendingUp,
  Target,
  Eye,
  Share2,
  Phone,
  Mail,
  Calendar,
  MessageCircle,
  FileText,
  ArrowRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import Link from "next/link";
import { KPICard } from "@/app/(dashboard)/components/kpi-card";
import { ChartCard } from "@/app/(dashboard)/components/chart-card";
import { StatusBadge, type BadgeVariant } from "@/app/(dashboard)/components/status-badge";
import {
  SAMPLE_KPI,
  SAMPLE_LEADS,
  SAMPLE_PIPELINE,
  SAMPLE_ACTIVITIES,
} from "@/app/lib/sample-dashboard-data";

const revenueData = [
  { month: "Oct", revenue: 280000 },
  { month: "Nov", revenue: 420000 },
  { month: "Dec", revenue: 350000 },
  { month: "Jan", revenue: 480000 },
  { month: "Feb", revenue: 520000 },
  { month: "Mar", revenue: 320000 },
];

const leadSourceData = [
  { name: "Showroom", value: 35, color: "#B87333" },
  { name: "Website", value: 25, color: "#C4725A" },
  { name: "Referral", value: 20, color: "#7A8B6F" },
  { name: "Instagram", value: 12, color: "#A89F91" },
  { name: "WhatsApp", value: 8, color: "#D4C5A9" },
];

const pipelineByStage = [
  { stage: "Discovery", value: 1300000, count: 2 },
  { stage: "Proposal", value: 2400000, count: 1 },
  { stage: "Negotiation", value: 1200000, count: 1 },
  { stage: "Won", value: 320000, count: 1 },
];

const activityIcons: Record<string, React.ElementType> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  note: FileText,
  deal: DollarSign,
  lead: Users,
};

const statusVariants: Record<string, BadgeVariant> = {
  new: "new",
  contacted: "contacted",
  qualified: "qualified",
  proposal: "proposal",
  won: "won",
  lost: "lost",
};

const formatCurrency = (value: number) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
};

const OverviewPage = () => {
  const today = format(new Date(), "EEEE, MMMM d");
  const greeting =
    new Date().getHours() < 12
      ? "Good morning"
      : new Date().getHours() < 18
        ? "Good afternoon"
        : "Good evening";

  const recentLeads = SAMPLE_LEADS.slice(0, 5);
  const topDeals = SAMPLE_PIPELINE.filter(
    (d) => d.stage !== "closed-won" && d.stage !== "closed-lost"
  ).slice(0, 4);
  const recentActivity = SAMPLE_ACTIVITIES.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-bold text-dash-text">
          {greeting}, Roger
        </h2>
        <p className="text-sm text-dash-text-secondary mt-1">{today}</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          label="New Leads"
          value={String(SAMPLE_KPI.newLeadsThisMonth)}
          change={SAMPLE_KPI.leadsChange}
          icon={Users}
          accentColor="bg-status-new"
        />
        <KPICard
          label="Pipeline Value"
          value={formatCurrency(SAMPLE_KPI.pipelineValue)}
          change={SAMPLE_KPI.pipelineChange}
          icon={DollarSign}
          accentColor="bg-brand-copper"
        />
        <KPICard
          label="Conversion Rate"
          value={`${SAMPLE_KPI.conversionRate}%`}
          change={SAMPLE_KPI.conversionChange}
          icon={Target}
          accentColor="bg-status-won"
        />
        <KPICard
          label="Website Visitors"
          value={SAMPLE_KPI.websiteVisitors.toLocaleString()}
          change={SAMPLE_KPI.websiteChange}
          icon={Eye}
          accentColor="bg-brand-sage"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Trend */}
        <ChartCard title="Revenue Trend" subtitle="Last 6 months (MXN)">
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#B87333" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#B87333" stopOpacity={0} />
                  </linearGradient>
                </defs>
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
                  formatter={(value) => [
                    `$${Number(value).toLocaleString()} MXN`,
                    "Revenue",
                  ]}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #E5E7EB",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#B87333"
                  strokeWidth={2}
                  fill="url(#revenueGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Pipeline by Stage */}
        <ChartCard title="Pipeline by Stage" subtitle="Active deals">
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineByStage} layout="vertical">
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#6B7280" }}
                  tickFormatter={(v) => formatCurrency(v)}
                />
                <YAxis
                  type="category"
                  dataKey="stage"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#6B7280" }}
                  width={80}
                />
                <Tooltip
                  formatter={(value) => [
                    `$${Number(value).toLocaleString()} MXN`,
                    "Value",
                  ]}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #E5E7EB",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  dataKey="value"
                  fill="#B87333"
                  radius={[0, 4, 4, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Lead Sources */}
        <ChartCard title="Lead Sources" subtitle="This month">
          <div className="h-52 flex items-center">
            <ResponsiveContainer width="50%" height="100%">
              <PieChart>
                <Pie
                  data={leadSourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {leadSourceData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {leadSourceData.map((source) => (
                <div key={source.name} className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: source.color }}
                  />
                  <span className="text-xs text-dash-text-secondary">
                    {source.name}
                  </span>
                  <span className="text-xs font-medium text-dash-text ml-auto">
                    {source.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Leads */}
        <div className="bg-dash-surface rounded-xl border border-dash-border p-5 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-dash-text">
              Recent Leads
            </h3>
            <Link
              href="/dashboard/leads"
              className="text-xs text-brand-copper hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentLeads.map((lead) => (
              <div
                key={lead.id}
                className="flex items-center justify-between py-2 border-b border-dash-border last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-dash-text">
                    {lead.name}
                  </p>
                  <p className="text-xs text-dash-text-secondary">
                    {lead.source}
                  </p>
                </div>
                <StatusBadge
                  label={lead.status}
                  variant={statusVariants[lead.status]}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Top Deals */}
        <div className="bg-dash-surface rounded-xl border border-dash-border p-5 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-dash-text">Top Deals</h3>
            <Link
              href="/dashboard/pipeline"
              className="text-xs text-brand-copper hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {topDeals.map((deal) => (
              <div
                key={deal.id}
                className="py-2 border-b border-dash-border last:border-0"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-dash-text">
                    {deal.name}
                  </p>
                  <p className="text-sm font-semibold text-brand-copper">
                    {formatCurrency(deal.value)}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-dash-text-secondary">
                    {deal.contactName}
                  </p>
                  <p className="text-xs text-dash-text-secondary">
                    {deal.probability}% probability
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-dash-surface rounded-xl border border-dash-border p-5 lg:col-span-1">
          <h3 className="text-sm font-semibold text-dash-text mb-4">
            Recent Activity
          </h3>
          <div className="space-y-3">
            {recentActivity.map((activity) => {
              const Icon = activityIcons[activity.type] ?? MessageCircle;
              return (
                <div
                  key={activity.id}
                  className="flex gap-3 py-2 border-b border-dash-border last:border-0"
                >
                  <div className="w-7 h-7 rounded-full bg-dash-bg flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5 text-dash-text-secondary" />
                  </div>
                  <div>
                    <p className="text-xs text-dash-text leading-relaxed">
                      {activity.description}
                    </p>
                    <p className="text-[10px] text-dash-text-secondary mt-0.5">
                      {activity.rep && `${activity.rep} · `}
                      {format(new Date(activity.timestamp), "MMM d, h:mm a")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Add Lead",
            icon: Users,
            href: "/dashboard/leads",
            color: "bg-status-new/10 text-status-new",
          },
          {
            label: "New Deal",
            icon: DollarSign,
            href: "/dashboard/pipeline",
            color: "bg-brand-copper/10 text-brand-copper",
          },
          {
            label: "Schedule Post",
            icon: Share2,
            href: "/dashboard/content-calendar",
            color: "bg-brand-sage/10 text-brand-sage",
          },
          {
            label: "Send Email",
            icon: Mail,
            href: "/dashboard/email-campaigns",
            color: "bg-brand-terracotta/10 text-brand-terracotta",
          },
        ].map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="bg-dash-surface rounded-xl border border-dash-border p-4 flex items-center gap-3 hover:border-brand-copper/30 transition-colors"
          >
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${action.color}`}
            >
              <action.icon className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-dash-text">
              {action.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default OverviewPage;
