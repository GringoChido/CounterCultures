"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Mail,
  Target,
  Calendar,
  DollarSign,
  Users,
  BarChart3,
  Loader2,
} from "lucide-react";
import {
  format,
  differenceInDays,
  parseISO,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { CLOSED_STAGES, WON_STAGES, LOST_STAGES } from "@/app/lib/sample-dashboard-data";

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

interface DealPayment {
  Payment_ID: string;
  Deal_ID: string;
  Type: string;
  Amount: string;
  Currency: string;
  Status: string;
  Due_Date: string;
  Paid_Date: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const parseNum = (val: string): number => {
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
};

const formatCurrency = (value: number) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
};

const closedStages: string[] = CLOSED_STAGES;
const wonStages: string[] = WON_STAGES;
const lostStages: string[] = LOST_STAGES;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const WeeklyReviewPage = () => {
  const [deals, setDeals] = useState<PipelineRecord[]>([]);
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [payments, setPayments] = useState<DealPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [focusText, setFocusText] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("cc-weekly-focus");
    if (saved) setFocusText(saved);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const [pRes, lRes, cRes, dpRes] = await Promise.all([
          fetch("/api/dashboard/pipeline"),
          fetch("/api/dashboard/leads"),
          fetch("/api/dashboard/email-campaigns"),
          fetch("/api/dashboard/deal-payments"),
        ]);
        const [pData, lData, cData, dpData] = await Promise.all([
          pRes.json(),
          lRes.json(),
          cRes.json(),
          dpRes.json(),
        ]);
        setDeals(pData.deals ?? []);
        setLeads(lData.leads ?? []);
        setCampaigns(cData.campaigns ?? []);
        setPayments(dpData.payments ?? []);
      } catch {
        // Silently degrade — sections show zeros
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const saveFocus = (text: string) => {
    setFocusText(text);
    localStorage.setItem("cc-weekly-focus", text);
  };

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  // ── KPI calculations ────────────────────────────────────────────
  const activeDeals = deals.filter(
    (d) => !closedStages.includes(d.stage)
  );
  const pipelineValue = activeDeals.reduce(
    (sum, d) => sum + parseNum(d.value),
    0
  );
  const weightedPipeline = activeDeals.reduce(
    (sum, d) => sum + parseNum(d.value) * (parseNum(d.probability) / 100),
    0
  );
  const wonDeals = deals.filter((d) => wonStages.includes(d.stage));
  const wonValue = wonDeals.reduce((sum, d) => sum + parseNum(d.value), 0);
  const totalDeals = deals.length;
  const closeRate =
    totalDeals > 0
      ? ((wonDeals.length / totalDeals) * 100).toFixed(1)
      : "0";

  // ── Overdue follow-ups (deals with expected_close in the past) ──
  const overdueFollowUps = deals.filter((d) => {
    if (!d.expected_close) return false;
    if (closedStages.includes(d.stage)) return false;
    try {
      return differenceInDays(now, parseISO(d.expected_close)) > 0;
    } catch {
      return false;
    }
  });

  // ── Stale leads (no followup scheduled, or next_followup past) ──
  const staleLeads = leads.filter((l) => {
    if (l.status === "won" || l.status === "lost" || l.status === "closed") return false;
    if (!l.next_followup) return true; // No followup = stale
    try {
      return differenceInDays(now, parseISO(l.next_followup)) > 7;
    } catch {
      return false;
    }
  });

  // ── Pipeline movement this week ──────────────────────────────
  const dealsCreatedThisWeek = deals.filter((d) => {
    if (!d.created_at) return false;
    try {
      const created = parseISO(d.created_at);
      return created >= weekStart && created <= weekEnd;
    } catch {
      return false;
    }
  });

  // ── Campaign performance ──────────────────────────────────────
  const activeCampaigns = campaigns.filter(
    (c) => c.status === "active" || c.status === "sent"
  );
  const avgOpenRate =
    activeCampaigns.length > 0
      ? activeCampaigns.reduce((sum, c) => sum + parseNum(c.open_rate), 0) /
        activeCampaigns.length
      : 0;
  const avgClickRate =
    activeCampaigns.length > 0
      ? activeCampaigns.reduce((sum, c) => sum + parseNum(c.click_rate), 0) /
        activeCampaigns.length
      : 0;
  const totalLeadsGenerated = campaigns.reduce(
    (sum, c) => sum + parseNum(c.leads_generated),
    0
  );

  // ── Revenue collected (from Deal Payments) ────────────────────
  const paidPayments = payments.filter(
    (p) => p.Status?.toLowerCase() === "paid"
  );
  const totalCollected = paidPayments.reduce(
    (s, p) => s + parseNum(p.Amount),
    0
  );

  // ── 90-day targets ────────────────────────────────────────────
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

  const avgDealSize =
    wonDeals.length > 0
      ? wonValue / wonDeals.length
      : 0;

  const targets = [
    {
      label: "Pipeline Value",
      current: pipelineValue,
      target: 10000000,
      format: formatCurrency,
    },
    {
      label: "Deals Won",
      current: wonDeals.length,
      target: 5,
      format: (v: number) => String(v),
    },
    {
      label: "New Leads",
      current: newLeadsThisMonth,
      target: 20,
      format: (v: number) => String(v),
    },
    {
      label: "Close Rate",
      current: parseFloat(closeRate),
      target: 20,
      format: (v: number) => `${v.toFixed(1)}%`,
    },
    {
      label: "Avg Deal Size",
      current: avgDealSize,
      target: 1500000,
      format: formatCurrency,
    },
  ];

  // ── Loading ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-brand-copper animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-dash-text">Weekly Review</h2>
        <p className="text-sm text-dash-text-secondary mt-1">
          Week of {format(weekStart, "MMM d")} –{" "}
          {format(weekEnd, "MMM d, yyyy")}
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          {
            label: "Pipeline Value",
            value: formatCurrency(pipelineValue),
            icon: DollarSign,
            color: "text-brand-copper",
          },
          {
            label: "Weighted Pipeline",
            value: formatCurrency(weightedPipeline),
            icon: Target,
            color: "text-emerald-400",
          },
          {
            label: "Revenue Collected",
            value: formatCurrency(totalCollected),
            icon: TrendingUp,
            color: "text-brand-sage",
          },
          {
            label: "Close Rate",
            value: `${closeRate}%`,
            icon: BarChart3,
            color: "text-blue-400",
          },
          {
            label: "Active Deals",
            value: String(activeDeals.length),
            icon: Users,
            color: "text-brand-terracotta",
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="bg-dash-surface rounded-xl border border-dash-border p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              <span className="text-xs text-dash-text-secondary">
                {kpi.label}
              </span>
            </div>
            <p className="text-xl font-bold text-dash-text">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue Follow-Ups */}
        <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle
              className={`w-4 h-4 ${overdueFollowUps.length > 0 ? "text-red-400" : "text-emerald-400"}`}
            />
            <h3 className="text-sm font-semibold text-dash-text">
              Overdue Follow-Ups ({overdueFollowUps.length})
            </h3>
          </div>
          {overdueFollowUps.length === 0 ? (
            <div className="flex items-center gap-2 text-emerald-400 text-sm py-4">
              <CheckCircle2 className="w-4 h-4" />
              {deals.length === 0
                ? "No deals in pipeline yet"
                : "All follow-ups are on schedule"}
            </div>
          ) : (
            <div className="space-y-3">
              {overdueFollowUps.slice(0, 5).map((deal) => {
                let daysOverdue = 0;
                try {
                  daysOverdue = differenceInDays(
                    now,
                    parseISO(deal.expected_close)
                  );
                } catch {
                  /* ignore */
                }
                return (
                  <div
                    key={deal.id}
                    className="flex items-center justify-between py-2 border-b border-dash-border last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-dash-text">
                        {deal.name}
                      </p>
                      <p className="text-xs text-dash-text-secondary">
                        {deal.company || "—"} · {deal.owner || "Unassigned"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-red-400">
                        {daysOverdue}d overdue
                      </p>
                      <p className="text-xs text-dash-text-secondary">
                        {formatCurrency(parseNum(deal.value))}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Stale Leads */}
        <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle
              className={`w-4 h-4 ${staleLeads.length > 0 ? "text-amber-400" : "text-emerald-400"}`}
            />
            <h3 className="text-sm font-semibold text-dash-text">
              Stale Leads — No Follow-Up Scheduled ({staleLeads.length})
            </h3>
          </div>
          {staleLeads.length === 0 ? (
            <div className="flex items-center gap-2 text-emerald-400 text-sm py-4">
              <CheckCircle2 className="w-4 h-4" />
              {leads.length === 0
                ? "No leads in CRM yet"
                : "All leads have follow-ups scheduled"}
            </div>
          ) : (
            <div className="space-y-3">
              {staleLeads.slice(0, 5).map((lead) => {
                let info = "No follow-up";
                if (lead.next_followup) {
                  try {
                    const days = differenceInDays(
                      now,
                      parseISO(lead.next_followup)
                    );
                    info = `${days}d past due`;
                  } catch {
                    /* ignore */
                  }
                }
                return (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between py-2 border-b border-dash-border last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-dash-text">
                        {lead.name}
                      </p>
                      <p className="text-xs text-dash-text-secondary">
                        {lead.source || "—"} · {lead.contact_type || "—"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-amber-400">
                        {info}
                      </p>
                      <p className="text-xs text-dash-text-secondary">
                        {lead.status || "—"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pipeline Movement */}
        <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <ArrowRight className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-dash-text">
              Pipeline Movement
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-dash-text">
                {dealsCreatedThisWeek.length}
              </p>
              <p className="text-xs text-dash-text-secondary">New This Week</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-400">
                {wonDeals.length}
              </p>
              <p className="text-xs text-dash-text-secondary">Won</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-400">
                {deals.filter((d) => lostStages.includes(d.stage)).length}
              </p>
              <p className="text-xs text-dash-text-secondary">Lost</p>
            </div>
          </div>
          {activeDeals.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-dash-text-secondary uppercase tracking-wider">
                Top Active Deals
              </p>
              {activeDeals
                .sort((a, b) => parseNum(b.value) - parseNum(a.value))
                .slice(0, 3)
                .map((deal) => (
                  <div
                    key={deal.id}
                    className="flex items-center justify-between py-1.5"
                  >
                    <span className="text-sm text-dash-text truncate mr-2">
                      {deal.name}
                    </span>
                    <span className="text-sm font-medium text-brand-copper shrink-0">
                      {formatCurrency(parseNum(deal.value))}
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-xs text-dash-text-secondary text-center py-2">
              No active deals in pipeline
            </p>
          )}
        </div>

        {/* Email Campaign Performance */}
        <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-4 h-4 text-brand-terracotta" />
            <h3 className="text-sm font-semibold text-dash-text">
              Email Campaign Performance
            </h3>
          </div>
          {campaigns.length === 0 ? (
            <div className="flex items-center gap-2 text-dash-text-secondary text-sm py-4">
              <Mail className="w-4 h-4" />
              No email campaigns yet — add them in the Email Campaigns tab
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-dash-text">
                    {avgOpenRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-dash-text-secondary">
                    Avg Open Rate
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-dash-text">
                    {avgClickRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-dash-text-secondary">
                    Avg Click Rate
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-400">
                    {totalLeadsGenerated}
                  </p>
                  <p className="text-xs text-dash-text-secondary">
                    Leads Generated
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {activeCampaigns.slice(0, 3).map((campaign) => (
                  <div
                    key={campaign.id}
                    className="flex items-center justify-between py-1.5 border-b border-dash-border last:border-0"
                  >
                    <span className="text-sm text-dash-text truncate mr-2">
                      {campaign.name}
                    </span>
                    <span className="text-xs text-dash-text-secondary">
                      {campaign.open_rate}% open
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Revenue Summary (from Deal Payments) */}
        <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-4 h-4 text-brand-copper" />
            <h3 className="text-sm font-semibold text-dash-text">
              Revenue Summary
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-400">
                {formatCurrency(totalCollected)}
              </p>
              <p className="text-xs text-dash-text-secondary">Collected</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-400">
                {formatCurrency(
                  payments
                    .filter(
                      (p) =>
                        p.Status?.toLowerCase() === "sent" ||
                        p.Status?.toLowerCase() === "overdue"
                    )
                    .reduce((s, p) => s + parseNum(p.Amount), 0)
                )}
              </p>
              <p className="text-xs text-dash-text-secondary">Outstanding</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-dash-text">
                {payments.length}
              </p>
              <p className="text-xs text-dash-text-secondary">
                Total Invoices
              </p>
            </div>
          </div>
          {payments.length === 0 && (
            <p className="text-xs text-dash-text-secondary text-center mt-3">
              No payment records yet
            </p>
          )}
        </div>

        {/* 90-Day Targets */}
        <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-brand-sage" />
            <h3 className="text-sm font-semibold text-dash-text">
              90-Day Targets
            </h3>
          </div>
          <div className="space-y-4">
            {targets.map((t) => {
              const pct = Math.min(
                t.target > 0 ? (t.current / t.target) * 100 : 0,
                100
              );
              const color =
                pct >= 75
                  ? "bg-emerald-500"
                  : pct >= 50
                    ? "bg-amber-500"
                    : "bg-red-500";
              return (
                <div key={t.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-dash-text-secondary">
                      {t.label}
                    </span>
                    <span className="text-xs font-medium text-dash-text">
                      {t.format(t.current)} / {t.format(t.target)}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-dash-bg rounded-full overflow-hidden">
                    <div
                      className={`h-full ${color} rounded-full transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Focus for Next Week */}
      <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-4 h-4 text-brand-copper" />
          <h3 className="text-sm font-semibold text-dash-text">
            Focus for Next Week
          </h3>
          <span className="text-xs text-dash-text-secondary ml-auto">
            Auto-saved to browser
          </span>
        </div>
        <textarea
          value={focusText}
          onChange={(e) => saveFocus(e.target.value)}
          placeholder={
            "What are the top 3 priorities for next week? e.g.\n1. Close Residencial Los Arcos deal\n2. Follow up with Hotel Anima on spa specs\n3. Send Q2 architect outreach sequence"
          }
          className="w-full h-32 bg-dash-bg border border-dash-border rounded-lg p-3 text-sm text-dash-text placeholder-dash-text-secondary/50 resize-none focus:outline-none focus:border-brand-copper/50 transition-colors"
        />
      </div>
    </div>
  );
};

export default WeeklyReviewPage;
