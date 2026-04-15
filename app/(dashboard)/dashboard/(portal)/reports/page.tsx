"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Download,
  RefreshCw,
  Calendar,
  TrendingUp,
  DollarSign,
  Package,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { differenceInDays, parseISO, format } from "date-fns";
import { toast } from "sonner";
import { CLOSED_STAGES, WON_STAGES } from "@/app/lib/sample-dashboard-data";

// ---------------------------------------------------------------------------
// Types (matching API record shapes)
// ---------------------------------------------------------------------------

interface PipelineRecord {
  id: string;
  name: string;
  company: string;
  stage: string;
  value: string;
  probability: string;
  expected_close: string;
  owner: string;
  source: string;
  created_at: string;
  last_activity: string;
}

interface LeadRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  status: string;
  contact_type: string;
  interest: string;
  value: string;
  created_at: string;
  next_followup: string;
}

interface CampaignRecord {
  id: string;
  name: string;
  type: string;
  audience_type: string;
  recipients: string;
  status: string;
  sent_date: string;
  open_rate: string;
  click_rate: string;
  leads_generated: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const parseNum = (val: string): number => {
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
};

const closedStages: string[] = CLOSED_STAGES;
const wonStages: string[] = WON_STAGES;

// ---------------------------------------------------------------------------
// Report cards (static UI — these describe future capabilities)
// ---------------------------------------------------------------------------

interface Report {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
}

const reports: Report[] = [
  {
    id: "1",
    name: "Monthly Sales Report",
    description:
      "Comprehensive breakdown of revenue, deals closed, product performance, and year-over-year comparisons.",
    icon: DollarSign,
    iconColor: "bg-brand-copper",
  },
  {
    id: "2",
    name: "Pipeline Health",
    description:
      "Analysis of deal pipeline stages, conversion rates, average deal velocity, and bottleneck identification.",
    icon: TrendingUp,
    iconColor: "bg-status-new",
  },
  {
    id: "3",
    name: "Marketing ROI",
    description:
      "Return on investment across all marketing channels including paid ads, email campaigns, and social media.",
    icon: Calendar,
    iconColor: "bg-brand-sage",
  },
  {
    id: "4",
    name: "Trade Program Summary",
    description:
      "Trade member activity, tier distribution, discount utilization, and revenue generated through the program.",
    icon: Users,
    iconColor: "bg-brand-terracotta",
  },
  {
    id: "5",
    name: "Inventory Status",
    description:
      "Current stock levels, low-stock alerts, bestsellers, and reorder recommendations across all product categories.",
    icon: Package,
    iconColor: "bg-status-qualified",
  },
];

// ---------------------------------------------------------------------------
// Health Checklist (computed from real CRM data)
// ---------------------------------------------------------------------------

const computeChecklist = (
  deals: PipelineRecord[],
  leads: LeadRecord[],
  campaigns: CampaignRecord[]
) => {
  const now = new Date();

  const activeDeals = deals.filter(
    (d) => !closedStages.includes(d.stage)
  );
  const wonDeals = deals.filter((d) => wonStages.includes(d.stage));
  const totalDeals = deals.length;
  const closeRate =
    totalDeals > 0 ? (wonDeals.length / totalDeals) * 100 : 0;
  const pipelineValue = activeDeals.reduce(
    (sum, d) => sum + parseNum(d.value),
    0
  );

  // Overdue follow-ups (expected_close in past, still active)
  const overdueFollowUps = deals.filter((d) => {
    if (!d.expected_close) return false;
    if (closedStages.includes(d.stage)) return false;
    try {
      return differenceInDays(now, parseISO(d.expected_close)) > 0;
    } catch {
      return false;
    }
  });

  // Leads without a next_followup date
  const unassignedLeads = leads.filter(
    (l) =>
      !l.next_followup &&
      l.status !== "won" &&
      l.status !== "lost" &&
      l.status !== "closed"
  );

  // Stale leads (next_followup > 14 days ago)
  const staleLeads = leads.filter((l) => {
    if (l.status === "won" || l.status === "lost" || l.status === "closed")
      return false;
    if (!l.next_followup) return false;
    try {
      return differenceInDays(now, parseISO(l.next_followup)) > 14;
    } catch {
      return false;
    }
  });

  // Active campaigns
  const activeCampaigns = campaigns.filter(
    (c) => c.status === "active" || c.status === "sent"
  );
  const avgOpenRate =
    activeCampaigns.length > 0
      ? activeCampaigns.reduce(
          (sum, c) => sum + parseNum(c.open_rate),
          0
        ) / activeCampaigns.length
      : 0;

  // New leads this month
  const newLeadsThisMonth = leads.filter((l) => {
    if (!l.created_at) return false;
    try {
      const created = parseISO(l.created_at);
      return (
        created.getMonth() === now.getMonth() &&
        created.getFullYear() === now.getFullYear()
      );
    } catch {
      return false;
    }
  }).length;

  return [
    {
      label: "Pipeline value above $5M MXN",
      pass: pipelineValue >= 5000000,
      detail: pipelineValue > 0
        ? `$${(pipelineValue / 1000000).toFixed(1)}M current pipeline`
        : "No pipeline data",
    },
    {
      label: "Close rate above 10%",
      pass: closeRate >= 10,
      detail:
        totalDeals > 0
          ? `${closeRate.toFixed(1)}% close rate`
          : "No deals yet",
    },
    {
      label: "No overdue follow-ups",
      pass: overdueFollowUps.length === 0,
      detail:
        overdueFollowUps.length === 0
          ? deals.length > 0
            ? "All on schedule"
            : "No deals to track"
          : `${overdueFollowUps.length} overdue`,
    },
    {
      label: "All leads have follow-up scheduled",
      pass: unassignedLeads.length === 0,
      detail:
        unassignedLeads.length === 0
          ? leads.length > 0
            ? "All scheduled"
            : "No leads yet"
          : `${unassignedLeads.length} without follow-up`,
    },
    {
      label: "No leads stale > 14 days",
      pass: staleLeads.length === 0,
      detail:
        staleLeads.length === 0
          ? leads.length > 0
            ? "All fresh"
            : "No leads yet"
          : `${staleLeads.length} stale leads`,
    },
    {
      label: "Active email campaigns running",
      pass: activeCampaigns.length > 0,
      detail:
        activeCampaigns.length > 0
          ? `${activeCampaigns.length} active campaigns`
          : "No active campaigns",
    },
    {
      label: "Email open rate above 30%",
      pass: avgOpenRate >= 30,
      detail:
        activeCampaigns.length > 0
          ? `${avgOpenRate.toFixed(1)}% avg open rate`
          : "No campaign data",
    },
    {
      label: "New leads this month above 3",
      pass: newLeadsThisMonth >= 3,
      detail: `${newLeadsThisMonth} new leads this month`,
    },
  ];
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ReportsPage = () => {
  const [deals, setDeals] = useState<PipelineRecord[]>([]);
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [pRes, lRes, cRes] = await Promise.all([
          fetch("/api/dashboard/pipeline"),
          fetch("/api/dashboard/leads"),
          fetch("/api/dashboard/email-campaigns"),
        ]);
        const [pData, lData, cData] = await Promise.all([
          pRes.json(),
          lRes.json(),
          cRes.json(),
        ]);
        setDeals(pData.deals ?? []);
        setLeads(lData.leads ?? []);
        setCampaigns(cData.campaigns ?? []);
      } catch {
        // Silently degrade — checklist shows "no data" states
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const checklist = computeChecklist(deals, leads, campaigns);
  const passCount = checklist.filter((c) => c.pass).length;
  const healthScore = Math.round((passCount / checklist.length) * 100);

  const generateReport = (reportName: string) => {
    const activeDeals = deals.filter((d) => !closedStages.includes(d.stage));
    const wonDeals = deals.filter((d) => wonStages.includes(d.stage));
    const pipelineValue = activeDeals.reduce((s, d) => s + parseNum(d.value), 0);
    const wonValue = wonDeals.reduce((s, d) => s + parseNum(d.value), 0);
    toast.success(`${reportName} generated`, {
      description: `${activeDeals.length} active deals ($${(pipelineValue / 1000).toFixed(0)}K pipeline) · ${wonDeals.length} won ($${(wonValue / 1000).toFixed(0)}K) · ${leads.length} leads · ${campaigns.length} campaigns`,
      duration: 6000,
    });
  };

  const downloadReport = (reportName: string) => {
    const rows = [
      ["Deal", "Company", "Stage", "Value", "Probability", "Expected Close", "Source"],
      ...deals.map((d) => [d.name, d.company, d.stage, d.value, d.probability, d.expected_close, d.source]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportName.toLowerCase().replace(/\s+/g, "-")}-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${reportName} downloaded`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-brand-copper animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-dash-text">Reports</h2>
        <p className="text-sm text-dash-text-secondary mt-1">
          Sales health checklist and business reports
        </p>
      </div>

      {/* Sales Health Checklist */}
      <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle
              className={`w-4 h-4 ${healthScore >= 75 ? "text-emerald-400" : healthScore >= 50 ? "text-amber-400" : "text-red-400"}`}
            />
            <h3 className="text-sm font-semibold text-dash-text">
              Sales Health Checklist
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-bold ${healthScore >= 75 ? "text-emerald-400" : healthScore >= 50 ? "text-amber-400" : "text-red-400"}`}
            >
              {healthScore}%
            </span>
            <span className="text-xs text-dash-text-secondary">
              {passCount}/{checklist.length} passing
            </span>
          </div>
        </div>
        <div className="space-y-2">
          {checklist.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2.5 border-b border-dash-border last:border-0"
            >
              <div className="flex items-center gap-3">
                {item.pass ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <span
                  className={`text-sm ${item.pass ? "text-dash-text" : "text-red-400"}`}
                >
                  {item.label}
                </span>
              </div>
              <span className="text-xs text-dash-text-secondary">
                {item.detail}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <div
              key={report.id}
              className="bg-dash-surface rounded-xl border border-dash-border p-5 hover:border-brand-copper/30 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-10 h-10 rounded-lg ${report.iconColor} flex items-center justify-center shrink-0`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-dash-text">
                    {report.name}
                  </h3>
                  <p className="text-xs text-dash-text-secondary mt-1 leading-relaxed">
                    {report.description}
                  </p>
                  <div className="flex items-center gap-2 mt-4">
                    <button
                      onClick={() => generateReport(report.name)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-copper text-white rounded-lg text-xs font-medium hover:bg-brand-copper/90 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Generate
                    </button>
                    <button
                      onClick={() => downloadReport(report.name)}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-dash-border text-dash-text rounded-lg text-xs font-medium hover:bg-dash-bg transition-colors cursor-pointer"
                    >
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

      {/* Scheduled Reports */}
      <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
        <h3 className="text-sm font-semibold text-dash-text mb-4">
          Scheduled Reports
        </h3>
        <div className="space-y-3">
          {[
            {
              name: "Monthly Sales Report",
              frequency: "1st of every month",
              recipients: "admin@countercultures.com.mx",
            },
            {
              name: "Pipeline Health",
              frequency: "Every Monday",
              recipients: "admin@countercultures.com.mx",
            },
            {
              name: "Inventory Status",
              frequency: "Every Friday",
              recipients: "admin@countercultures.com.mx",
            },
          ].map((scheduled) => (
            <div
              key={scheduled.name}
              className="flex items-center justify-between py-2 border-b border-dash-border last:border-0"
            >
              <div>
                <p className="text-sm font-medium text-dash-text">
                  {scheduled.name}
                </p>
                <p className="text-xs text-dash-text-secondary mt-0.5">
                  {scheduled.frequency}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-dash-text-secondary">
                  {scheduled.recipients}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
