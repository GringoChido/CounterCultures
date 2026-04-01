"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Mail,
  Phone,
  MessageCircle,
  Target,
  Calendar,
  DollarSign,
  Users,
  BarChart3,
} from "lucide-react";
import { format, differenceInDays, parseISO, startOfWeek, endOfWeek } from "date-fns";
import {
  SAMPLE_PIPELINE,
  SAMPLE_LEADS,
  SAMPLE_ACTIVITIES,
  SAMPLE_CAMPAIGNS,
  SAMPLE_KPI,
} from "@/app/lib/sample-dashboard-data";

const formatCurrency = (value: number) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
};

const WeeklyReviewPage = () => {
  const [focusText, setFocusText] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("cc-weekly-focus");
    if (saved) setFocusText(saved);
  }, []);

  const saveFocus = (text: string) => {
    setFocusText(text);
    localStorage.setItem("cc-weekly-focus", text);
  };

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  // KPI calculations
  const activeDeals = SAMPLE_PIPELINE.filter(
    (d) => !["closed-won", "closed-lost", "won", "lost"].includes(d.stage)
  );
  const pipelineValue = activeDeals.reduce((sum, d) => sum + d.value, 0);
  const weightedPipeline = activeDeals.reduce((sum, d) => sum + d.value * (d.probability / 100), 0);
  const wonDeals = SAMPLE_PIPELINE.filter((d) => d.stage === "closed-won" || d.stage === "won");
  const wonValue = wonDeals.reduce((sum, d) => sum + d.value, 0);
  const totalDeals = SAMPLE_PIPELINE.length;
  const closeRate = totalDeals > 0 ? ((wonDeals.length / totalDeals) * 100).toFixed(1) : "0";

  // Overdue follow-ups
  const overdueFollowUps = SAMPLE_PIPELINE.filter((d) => {
    if (!d.followUpDate) return false;
    if (["closed-won", "closed-lost", "won", "lost"].includes(d.stage)) return false;
    return differenceInDays(now, parseISO(d.followUpDate)) > 0;
  });

  // Stale leads (no contact > 7 days)
  const staleLeads = SAMPLE_LEADS.filter((l) => {
    if (!l.lastContactDate) return false;
    if (l.status === "won" || l.status === "lost") return false;
    return differenceInDays(now, parseISO(l.lastContactDate)) > 7;
  });

  // This week's activities
  const weekActivities = SAMPLE_ACTIVITIES.filter((a) => {
    const ts = parseISO(a.timestamp);
    return ts >= weekStart && ts <= weekEnd;
  });
  const callCount = weekActivities.filter((a) => a.type === "call").length;
  const emailCount = weekActivities.filter((a) => a.type === "email").length;
  const meetingCount = weekActivities.filter((a) => a.type === "meeting").length;
  const whatsappCount = weekActivities.filter((a) => a.type === "whatsapp").length;

  // Campaign performance
  const activeCampaigns = SAMPLE_CAMPAIGNS.filter((c) => c.status === "active" || c.status === "sent");
  const avgOpenRate = activeCampaigns.length > 0
    ? activeCampaigns.reduce((sum, c) => sum + c.openRate, 0) / activeCampaigns.length
    : 0;
  const avgClickRate = activeCampaigns.length > 0
    ? activeCampaigns.reduce((sum, c) => sum + c.clickRate, 0) / activeCampaigns.length
    : 0;
  const totalLeadsGenerated = SAMPLE_CAMPAIGNS.reduce((sum, c) => sum + (c.leadsGenerated || 0), 0);

  // Pipeline movement this week
  const dealsCreatedThisWeek = SAMPLE_PIPELINE.filter((d) => {
    const created = parseISO(d.createdAt);
    return created >= weekStart && created <= weekEnd;
  });

  // 90-day targets
  const targets = [
    { label: "Pipeline Value", current: pipelineValue, target: 10000000, format: formatCurrency },
    { label: "Deals Won", current: wonDeals.length, target: 5, format: (v: number) => String(v) },
    { label: "New Leads", current: SAMPLE_KPI.newLeadsThisMonth, target: 20, format: (v: number) => String(v) },
    { label: "Close Rate", current: parseFloat(closeRate), target: 20, format: (v: number) => `${v.toFixed(1)}%` },
    { label: "Avg Deal Size", current: SAMPLE_KPI.avgDealSize, target: 1500000, format: formatCurrency },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-dash-text">Weekly Review</h2>
        <p className="text-sm text-dash-text-secondary mt-1">
          Week of {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Pipeline Value", value: formatCurrency(pipelineValue), icon: DollarSign, color: "text-brand-copper" },
          { label: "Weighted Pipeline", value: formatCurrency(weightedPipeline), icon: Target, color: "text-emerald-400" },
          { label: "Won This Month", value: formatCurrency(wonValue), icon: TrendingUp, color: "text-brand-sage" },
          { label: "Close Rate", value: `${closeRate}%`, icon: BarChart3, color: "text-blue-400" },
          { label: "Active Deals", value: String(activeDeals.length), icon: Users, color: "text-brand-terracotta" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-dash-surface rounded-xl border border-dash-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              <span className="text-xs text-dash-text-secondary">{kpi.label}</span>
            </div>
            <p className="text-xl font-bold text-dash-text">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue Follow-Ups */}
        <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className={`w-4 h-4 ${overdueFollowUps.length > 0 ? "text-red-400" : "text-emerald-400"}`} />
            <h3 className="text-sm font-semibold text-dash-text">
              Overdue Follow-Ups ({overdueFollowUps.length})
            </h3>
          </div>
          {overdueFollowUps.length === 0 ? (
            <div className="flex items-center gap-2 text-emerald-400 text-sm py-4">
              <CheckCircle2 className="w-4 h-4" />
              All follow-ups are on schedule
            </div>
          ) : (
            <div className="space-y-3">
              {overdueFollowUps.map((deal) => {
                const daysOverdue = differenceInDays(now, parseISO(deal.followUpDate!));
                return (
                  <div key={deal.id} className="flex items-center justify-between py-2 border-b border-dash-border last:border-0">
                    <div>
                      <p className="text-sm font-medium text-dash-text">{deal.name}</p>
                      <p className="text-xs text-dash-text-secondary">
                        {deal.contactName} · {deal.assignedRep || "Unassigned"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-red-400">{daysOverdue}d overdue</p>
                      <p className="text-xs text-dash-text-secondary">{formatCurrency(deal.value)}</p>
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
            <AlertCircle className={`w-4 h-4 ${staleLeads.length > 0 ? "text-amber-400" : "text-emerald-400"}`} />
            <h3 className="text-sm font-semibold text-dash-text">
              Stale Leads — No Contact {">"} 7 Days ({staleLeads.length})
            </h3>
          </div>
          {staleLeads.length === 0 ? (
            <div className="flex items-center gap-2 text-emerald-400 text-sm py-4">
              <CheckCircle2 className="w-4 h-4" />
              All leads contacted within 7 days
            </div>
          ) : (
            <div className="space-y-3">
              {staleLeads.map((lead) => {
                const daysSince = differenceInDays(now, parseISO(lead.lastContactDate!));
                return (
                  <div key={lead.id} className="flex items-center justify-between py-2 border-b border-dash-border last:border-0">
                    <div>
                      <p className="text-sm font-medium text-dash-text">{lead.name}</p>
                      <p className="text-xs text-dash-text-secondary">
                        {lead.companyName || lead.source} · {lead.assignedRep || "Unassigned"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-amber-400">{daysSince}d ago</p>
                      <p className="text-xs text-dash-text-secondary">{lead.status}</p>
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
            <h3 className="text-sm font-semibold text-dash-text">Pipeline Movement</h3>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-dash-text">{dealsCreatedThisWeek.length}</p>
              <p className="text-xs text-dash-text-secondary">New Deals</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-400">{wonDeals.length}</p>
              <p className="text-xs text-dash-text-secondary">Won</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-400">
                {SAMPLE_PIPELINE.filter((d) => d.stage === "closed-lost" || d.stage === "lost").length}
              </p>
              <p className="text-xs text-dash-text-secondary">Lost</p>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-dash-text-secondary uppercase tracking-wider">Top Active Deals</p>
            {activeDeals
              .sort((a, b) => b.value - a.value)
              .slice(0, 3)
              .map((deal) => (
                <div key={deal.id} className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-dash-text truncate mr-2">{deal.name}</span>
                  <span className="text-sm font-medium text-brand-copper shrink-0">{formatCurrency(deal.value)}</span>
                </div>
              ))}
          </div>
        </div>

        {/* Activity Summary */}
        <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-brand-copper" />
            <h3 className="text-sm font-semibold text-dash-text">This Week&apos;s Activity</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Calls", count: callCount, icon: Phone, color: "text-blue-400" },
              { label: "Emails", count: emailCount, icon: Mail, color: "text-emerald-400" },
              { label: "Meetings", count: meetingCount, icon: Users, color: "text-brand-copper" },
              { label: "WhatsApp", count: whatsappCount, icon: MessageCircle, color: "text-green-400" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 p-3 rounded-lg bg-dash-bg">
                <item.icon className={`w-4 h-4 ${item.color}`} />
                <div>
                  <p className="text-lg font-bold text-dash-text">{item.count}</p>
                  <p className="text-xs text-dash-text-secondary">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-dash-text-secondary mt-3">
            Total: {weekActivities.length} activities logged this week
          </p>
        </div>

        {/* Email Campaign Performance */}
        <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-4 h-4 text-brand-terracotta" />
            <h3 className="text-sm font-semibold text-dash-text">Email Campaign Performance</h3>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-dash-text">{avgOpenRate.toFixed(1)}%</p>
              <p className="text-xs text-dash-text-secondary">Avg Open Rate</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-dash-text">{avgClickRate.toFixed(1)}%</p>
              <p className="text-xs text-dash-text-secondary">Avg Click Rate</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-400">{totalLeadsGenerated}</p>
              <p className="text-xs text-dash-text-secondary">Leads Generated</p>
            </div>
          </div>
          <div className="space-y-2">
            {activeCampaigns.slice(0, 3).map((campaign) => (
              <div key={campaign.id} className="flex items-center justify-between py-1.5 border-b border-dash-border last:border-0">
                <span className="text-sm text-dash-text truncate mr-2">{campaign.name}</span>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-dash-text-secondary">{campaign.openRate}% open</span>
                  {campaign.type === "cold-outreach" && campaign.currentEmail && campaign.totalEmails && (
                    <span className="text-xs text-blue-400">
                      Email {campaign.currentEmail}/{campaign.totalEmails}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 90-Day Targets */}
        <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-brand-sage" />
            <h3 className="text-sm font-semibold text-dash-text">90-Day Targets</h3>
          </div>
          <div className="space-y-4">
            {targets.map((t) => {
              const pct = Math.min((t.current / t.target) * 100, 100);
              const color = pct >= 75 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500";
              return (
                <div key={t.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-dash-text-secondary">{t.label}</span>
                    <span className="text-xs font-medium text-dash-text">
                      {t.format(t.current)} / {t.format(t.target)}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-dash-bg rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
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
          <h3 className="text-sm font-semibold text-dash-text">Focus for Next Week</h3>
          <span className="text-xs text-dash-text-secondary ml-auto">Auto-saved to browser</span>
        </div>
        <textarea
          value={focusText}
          onChange={(e) => saveFocus(e.target.value)}
          placeholder="What are the top 3 priorities for next week? e.g.&#10;1. Close Residencial Los Arcos deal&#10;2. Follow up with Hotel Anima on spa specs&#10;3. Send Q2 architect outreach sequence"
          className="w-full h-32 bg-dash-bg border border-dash-border rounded-lg p-3 text-sm text-dash-text placeholder-dash-text-secondary/50 resize-none focus:outline-none focus:border-brand-copper/50 transition-colors"
        />
      </div>
    </div>
  );
};

export default WeeklyReviewPage;
