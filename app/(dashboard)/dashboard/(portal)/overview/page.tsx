"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Users,
  DollarSign,
  Target,
  Eye,
  Share2,
  Phone,
  Mail,
  Calendar,
  MessageCircle,
  FileText,
  ArrowRight,
  CreditCard,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Link from "next/link";
import { KPICard } from "@/app/(dashboard)/components/kpi-card";
import { ChartCard } from "@/app/(dashboard)/components/chart-card";
import { StatusBadge, type BadgeVariant } from "@/app/(dashboard)/components/status-badge";
import { ActivityLogger } from "@/app/(dashboard)/components/activity-logger";
import { useActivityStore } from "@/app/lib/stores/activity-store";
import {
  SAMPLE_KPI,
  SAMPLE_LEADS,
  SAMPLE_PIPELINE,
  SAMPLE_ACTIVITIES,
  CLOSED_STAGES,
} from "@/app/lib/sample-dashboard-data";

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
  whatsapp: MessageCircle,
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

interface OverviewData {
  totalLeads: number;
  leadCounts: Record<string, number>;
  totalDeals: number;
  totalPipelineValue: number;
  pipelineByStage: Record<string, { count: number; value: number }>;
  latestSales: Record<string, string> | null;
}

const OverviewPage = () => {
  const today = format(new Date(), "EEEE, MMMM d");
  const greeting =
    new Date().getHours() < 12
      ? "Good morning"
      : new Date().getHours() < 18
        ? "Good afternoon"
        : "Good evening";

  const loggedActivities = useActivityStore((s) => s.activities);
  const addActivity = useActivityStore((s) => s.addActivity);

  // CRM overview data
  const [overview, setOverview] = useState<OverviewData | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [recentLeads, setRecentLeads] = useState<any[]>(SAMPLE_LEADS.slice(0, 5));
  const [topDeals, setTopDeals] = useState(
    SAMPLE_PIPELINE.filter((d) => !CLOSED_STAGES.includes(d.stage)).slice(0, 4)
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [recentActivitiesData, setRecentActivitiesData] = useState<any[]>(SAMPLE_ACTIVITIES);

  const recentActivity = [...loggedActivities, ...recentActivitiesData].slice(0, 6);

  useEffect(() => {
    const fetchAll = async () => {
      // Fetch overview, leads, pipeline, activities in parallel
      const [overviewRes, leadsRes, pipelineRes, activitiesRes] = await Promise.allSettled([
        fetch("/api/dashboard/overview").then((r) => r.ok ? r.json() : null),
        fetch("/api/dashboard/leads").then((r) => r.ok ? r.json() : null),
        fetch("/api/dashboard/pipeline").then((r) => r.ok ? r.json() : null),
        fetch("/api/dashboard/activities").then((r) => r.ok ? r.json() : null),
      ]);

      if (overviewRes.status === "fulfilled" && overviewRes.value) {
        setOverview(overviewRes.value);
      }
      if (leadsRes.status === "fulfilled" && leadsRes.value?.leads?.length) {
        setRecentLeads(leadsRes.value.leads.slice(0, 5));
      }
      if (pipelineRes.status === "fulfilled" && pipelineRes.value?.deals?.length) {
        const active = pipelineRes.value.deals.filter(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (d: any) => !["closed-won", "closed-lost", "won", "lost"].includes(d.stage)
        );
        if (active.length) setTopDeals(active.slice(0, 4));
      }
      if (activitiesRes.status === "fulfilled" && activitiesRes.value?.activities?.length) {
        setRecentActivitiesData(activitiesRes.value.activities);
      }
    };
    fetchAll();
  }, []);

  // Stripe data
  const [stripeVolume, setStripeVolume] = useState<string | null>(null);
  const [recentPayments, setRecentPayments] = useState<{ id: string; customerName: string | null; amount: number; currency: string; created: number; status: string }[]>([]);

  useEffect(() => {
    const fetchStripe = async () => {
      try {
        const [summaryRes, paymentsRes] = await Promise.all([
          fetch("/api/stripe/summary"),
          fetch("/api/stripe/payments?limit=5"),
        ]);
        const summaryData = await summaryRes.json();
        const paymentsData = await paymentsRes.json();
        if (summaryData.last30Days) {
          setStripeVolume(
            new Intl.NumberFormat("es-MX", { style: "currency", currency: summaryData.last30Days.currency?.toUpperCase() ?? "MXN", minimumFractionDigits: 0 }).format(summaryData.last30Days.volume / 100)
          );
        }
        setRecentPayments(paymentsData.payments?.slice(0, 5) ?? []);
      } catch {
        // Stripe not configured — hide gracefully
      }
    };
    fetchStripe();
  }, []);

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-bold text-dash-text">
          {greeting}
        </h2>
        <p className="text-sm text-dash-text-secondary mt-1">{today}</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <KPICard
          label="New Leads"
          value={String(overview?.leadCounts?.["new"] ?? SAMPLE_KPI.newLeadsThisMonth)}
          change={SAMPLE_KPI.leadsChange}
          icon={Users}
          accentColor="bg-status-new"
        />
        <KPICard
          label="Pipeline Value"
          value={formatCurrency(overview?.totalPipelineValue ?? SAMPLE_KPI.pipelineValue)}
          change={SAMPLE_KPI.pipelineChange}
          icon={DollarSign}
          accentColor="bg-brand-copper"
        />
        <KPICard
          label="Conversion Rate"
          value={overview?.latestSales?.conversion_rate ? `${overview.latestSales.conversion_rate}%` : `${SAMPLE_KPI.conversionRate}%`}
          change={SAMPLE_KPI.conversionChange}
          icon={Target}
          accentColor="bg-status-won"
        />
        <KPICard
          label="Total Leads"
          value={String(overview?.totalLeads ?? SAMPLE_KPI.websiteVisitors)}
          change={SAMPLE_KPI.websiteChange}
          icon={Eye}
          accentColor="bg-brand-sage"
        />
        {stripeVolume && (
          <KPICard
            label="Stripe Revenue (30d)"
            value={stripeVolume}
            icon={CreditCard}
            accentColor="bg-[#635bff]"
          />
        )}
      </div>

      {/* Pipeline by Stage */}
      <ChartCard title="Pipeline by Stage" subtitle="Active deals">
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={pipelineByStage} layout="vertical">
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6B7280" }} tickFormatter={(v) => formatCurrency(v)} />
              <YAxis type="category" dataKey="stage" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6B7280" }} width={80} />
              <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()} MXN`, "Value"]} contentStyle={{ borderRadius: "8px", border: "1px solid #1E2028", backgroundColor: "#12141A", fontSize: "12px", color: "#E8E9ED" }} />
              <Bar dataKey="value" fill="#B87333" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Leads */}
        <div className="bg-dash-surface rounded-xl border border-dash-border p-5 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-dash-text">Recent Leads</h3>
            <Link href="/dashboard/leads" className="text-xs text-brand-copper hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentLeads.map((lead) => (
              <div key={lead.id} className="flex items-center justify-between py-2 border-b border-dash-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-dash-text">{lead.name}</p>
                  <p className="text-xs text-dash-text-secondary">{lead.source}</p>
                </div>
                <StatusBadge label={lead.status} variant={statusVariants[lead.status]} />
              </div>
            ))}
          </div>
        </div>

        {/* Top Deals */}
        <div className="bg-dash-surface rounded-xl border border-dash-border p-5 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-dash-text">Top Deals</h3>
            <Link href="/dashboard/pipeline" className="text-xs text-brand-copper hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {topDeals.map((deal) => (
              <div key={deal.id} className="py-2 border-b border-dash-border last:border-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-dash-text">{deal.name}</p>
                  <p className="text-sm font-semibold text-brand-copper">{formatCurrency(deal.value)}</p>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-dash-text-secondary">{deal.contactName}</p>
                  <p className="text-xs text-dash-text-secondary">{deal.probability}% probability</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-dash-surface rounded-xl border border-dash-border p-5 lg:col-span-1">
          <div className="flex items-center justify-between mb-4 relative">
            <h3 className="text-sm font-semibold text-dash-text">Recent Activity</h3>
            <ActivityLogger
              compact
              onLog={(entry) =>
                addActivity({
                  type: entry.type,
                  description: entry.description,
                  contactName: entry.contactName,
                  dealId: entry.dealId,
                  followUpDate: entry.followUpDate,
                })
              }
            />
          </div>
          <div className="space-y-3">
            {recentActivity.map((activity) => {
              const Icon = activityIcons[activity.type] ?? MessageCircle;
              return (
                <div key={activity.id} className="flex gap-3 py-2 border-b border-dash-border last:border-0">
                  <div className="w-7 h-7 rounded-full bg-dash-bg flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5 text-dash-text-secondary" />
                  </div>
                  <div>
                    <p className="text-xs text-dash-text leading-relaxed">{activity.description}</p>
                    <p className="text-[10px] text-dash-text-secondary mt-0.5">
                      {activity.rep && `${activity.rep} \u00B7 `}
                      {format(new Date(activity.timestamp), "MMM d, h:mm a")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Stripe Payments */}
      {recentPayments.length > 0 && (
        <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-dash-text">Recent Stripe Payments</h3>
            <Link href="/dashboard/stripe" className="text-xs text-[#635bff] hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dash-border">
                  <th className="text-left pb-2 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Customer</th>
                  <th className="text-left pb-2 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Status</th>
                  <th className="text-right pb-2 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.map((p) => (
                  <tr key={p.id} className="border-b border-dash-border last:border-0">
                    <td className="py-2 text-dash-text">{p.customerName ?? "\u2014"}</td>
                    <td className="py-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === "succeeded" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-2 text-right font-medium text-dash-text">
                      {new Intl.NumberFormat("es-MX", { style: "currency", currency: p.currency?.toUpperCase() ?? "MXN", minimumFractionDigits: 2 }).format(p.amount / 100)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Add Lead", icon: Users, href: "/dashboard/leads", color: "bg-status-new/10 text-status-new" },
          { label: "New Deal", icon: DollarSign, href: "/dashboard/pipeline", color: "bg-brand-copper/10 text-brand-copper" },
          { label: "Schedule Post", icon: Share2, href: "/dashboard/content-calendar", color: "bg-brand-sage/10 text-brand-sage" },
          { label: "Send Email", icon: Mail, href: "/dashboard/email-campaigns", color: "bg-brand-terracotta/10 text-brand-terracotta" },
        ].map((action) => (
          <Link key={action.label} href={action.href} className="bg-dash-surface rounded-xl border border-dash-border p-4 flex items-center gap-3 hover:border-brand-copper/30 transition-colors">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${action.color}`}>
              <action.icon className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-dash-text">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default OverviewPage;
