"use client";

import { FileText, Download, RefreshCw, Calendar, TrendingUp, DollarSign, Package, Users, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";
import {
  SAMPLE_PIPELINE,
  SAMPLE_LEADS,
  SAMPLE_ACTIVITIES,
  SAMPLE_CAMPAIGNS,
  SAMPLE_KPI,
} from "@/app/lib/sample-dashboard-data";

interface Report {
  id: string;
  name: string;
  description: string;
  lastGenerated: string;
  icon: React.ElementType;
  iconColor: string;
}

const reports: Report[] = [
  {
    id: "1",
    name: "Monthly Sales Report",
    description: "Comprehensive breakdown of revenue, deals closed, product performance, and year-over-year comparisons.",
    lastGenerated: "Mar 28, 2026",
    icon: DollarSign,
    iconColor: "bg-brand-copper",
  },
  {
    id: "2",
    name: "Pipeline Health",
    description: "Analysis of deal pipeline stages, conversion rates, average deal velocity, and bottleneck identification.",
    lastGenerated: "Mar 25, 2026",
    icon: TrendingUp,
    iconColor: "bg-status-new",
  },
  {
    id: "3",
    name: "Marketing ROI",
    description: "Return on investment across all marketing channels including paid ads, email campaigns, and social media.",
    lastGenerated: "Mar 20, 2026",
    icon: Calendar,
    iconColor: "bg-brand-sage",
  },
  {
    id: "4",
    name: "Trade Program Summary",
    description: "Trade member activity, tier distribution, discount utilization, and revenue generated through the program.",
    lastGenerated: "Mar 15, 2026",
    icon: Users,
    iconColor: "bg-brand-terracotta",
  },
  {
    id: "5",
    name: "Inventory Status",
    description: "Current stock levels, low-stock alerts, bestsellers, and reorder recommendations across all product categories.",
    lastGenerated: "Mar 10, 2026",
    icon: Package,
    iconColor: "bg-status-qualified",
  },
];

// Sales Health Checklist computation
const computeChecklist = () => {
  const now = new Date();
  const activeDeals = SAMPLE_PIPELINE.filter(
    (d) => !["closed-won", "closed-lost", "won", "lost"].includes(d.stage)
  );
  const wonDeals = SAMPLE_PIPELINE.filter((d) => d.stage === "closed-won" || d.stage === "won");
  const totalDeals = SAMPLE_PIPELINE.length;
  const closeRate = totalDeals > 0 ? (wonDeals.length / totalDeals) * 100 : 0;
  const pipelineValue = activeDeals.reduce((sum, d) => sum + d.value, 0);

  // Overdue follow-ups
  const overdueFollowUps = SAMPLE_PIPELINE.filter((d) => {
    if (!d.followUpDate) return false;
    if (["closed-won", "closed-lost", "won", "lost"].includes(d.stage)) return false;
    return differenceInDays(now, parseISO(d.followUpDate)) > 0;
  });

  // Unassigned leads
  const unassignedLeads = SAMPLE_LEADS.filter((l) => !l.assignedRep && l.status !== "won" && l.status !== "lost");

  // Stale leads (no contact > 14 days)
  const staleLeads = SAMPLE_LEADS.filter((l) => {
    if (!l.lastContactDate) return false;
    if (l.status === "won" || l.status === "lost") return false;
    return differenceInDays(now, parseISO(l.lastContactDate)) > 14;
  });

  // Recent activity (past 7 days)
  const recentActivities = SAMPLE_ACTIVITIES.filter((a) => {
    return differenceInDays(now, parseISO(a.timestamp)) <= 7;
  });

  // Active campaigns
  const activeCampaigns = SAMPLE_CAMPAIGNS.filter((c) => c.status === "active" || c.status === "sent");
  const avgOpenRate = activeCampaigns.length > 0
    ? activeCampaigns.reduce((sum, c) => sum + c.openRate, 0) / activeCampaigns.length
    : 0;

  return [
    {
      label: "Pipeline value above $5M MXN",
      pass: pipelineValue >= 5000000,
      detail: `$${(pipelineValue / 1000000).toFixed(1)}M current pipeline`,
    },
    {
      label: "Close rate above 10%",
      pass: closeRate >= 10,
      detail: `${closeRate.toFixed(1)}% close rate`,
    },
    {
      label: "No overdue follow-ups",
      pass: overdueFollowUps.length === 0,
      detail: overdueFollowUps.length === 0 ? "All on schedule" : `${overdueFollowUps.length} overdue`,
    },
    {
      label: "All leads assigned to a rep",
      pass: unassignedLeads.length === 0,
      detail: unassignedLeads.length === 0 ? "All assigned" : `${unassignedLeads.length} unassigned`,
    },
    {
      label: "No leads stale > 14 days",
      pass: staleLeads.length === 0,
      detail: staleLeads.length === 0 ? "All fresh" : `${staleLeads.length} stale leads`,
    },
    {
      label: "5+ activities logged this week",
      pass: recentActivities.length >= 5,
      detail: `${recentActivities.length} activities this week`,
    },
    {
      label: "Email open rate above 30%",
      pass: avgOpenRate >= 30,
      detail: activeCampaigns.length > 0 ? `${avgOpenRate.toFixed(1)}% avg open rate` : "No active campaigns",
    },
    {
      label: "New leads this month above 3",
      pass: SAMPLE_KPI.newLeadsThisMonth >= 3,
      detail: `${SAMPLE_KPI.newLeadsThisMonth} new leads this month`,
    },
  ];
};

const ReportsPage = () => {
  const checklist = computeChecklist();
  const passCount = checklist.filter((c) => c.pass).length;
  const healthScore = Math.round((passCount / checklist.length) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-dash-text">Reports</h2>
        <p className="text-sm text-dash-text-secondary mt-1">Generate and download business reports</p>
      </div>

      {/* Sales Health Checklist */}
      <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-4 h-4 ${healthScore >= 75 ? "text-emerald-400" : healthScore >= 50 ? "text-amber-400" : "text-red-400"}`} />
            <h3 className="text-sm font-semibold text-dash-text">Sales Health Checklist</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold ${healthScore >= 75 ? "text-emerald-400" : healthScore >= 50 ? "text-amber-400" : "text-red-400"}`}>
              {healthScore}%
            </span>
            <span className="text-xs text-dash-text-secondary">{passCount}/{checklist.length} passing</span>
          </div>
        </div>
        <div className="space-y-2">
          {checklist.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2.5 border-b border-dash-border last:border-0">
              <div className="flex items-center gap-3">
                {item.pass ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <span className={`text-sm ${item.pass ? "text-dash-text" : "text-red-400"}`}>{item.label}</span>
              </div>
              <span className="text-xs text-dash-text-secondary">{item.detail}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <div key={report.id} className="bg-dash-surface rounded-xl border border-dash-border p-5 hover:border-brand-copper/30 transition-colors">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg ${report.iconColor} flex items-center justify-center shrink-0`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-dash-text">{report.name}</h3>
                  <p className="text-xs text-dash-text-secondary mt-1 leading-relaxed">{report.description}</p>
                  <div className="flex items-center gap-1.5 mt-3">
                    <FileText className="w-3 h-3 text-dash-text-secondary" />
                    <span className="text-[10px] text-dash-text-secondary">Last generated: {report.lastGenerated}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-copper text-white rounded-lg text-xs font-medium hover:bg-brand-copper/90 transition-colors cursor-pointer">
                      <RefreshCw className="w-3 h-3" />
                      Generate
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 border border-dash-border text-dash-text rounded-lg text-xs font-medium hover:bg-dash-bg transition-colors cursor-pointer">
                      <Download className="w-3 h-3" />
                      Download
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
        <h3 className="text-sm font-semibold text-dash-text mb-4">Scheduled Reports</h3>
        <div className="space-y-3">
          {[
            { name: "Monthly Sales Report", frequency: "1st of every month", recipients: "roger@countercultures.com" },
            { name: "Pipeline Health", frequency: "Every Monday", recipients: "roger@countercultures.com, sales@countercultures.com" },
            { name: "Inventory Status", frequency: "Every Friday", recipients: "warehouse@countercultures.com" },
          ].map((scheduled) => (
            <div key={scheduled.name} className="flex items-center justify-between py-2 border-b border-dash-border last:border-0">
              <div>
                <p className="text-sm font-medium text-dash-text">{scheduled.name}</p>
                <p className="text-xs text-dash-text-secondary mt-0.5">{scheduled.frequency}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-dash-text-secondary">{scheduled.recipients}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
