import { differenceInDays, parseISO } from "date-fns";
import { CLOSED_STAGES, WON_STAGES } from "./sample-dashboard-data";

export interface PipelineRecord {
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

export interface LeadRecord {
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

export interface CampaignRecord {
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

export interface HealthCheckItem {
  label: string;
  pass: boolean;
  detail: string;
}

const parseNum = (val: string): number => {
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
};

const closedStages: string[] = CLOSED_STAGES;
const wonStages: string[] = WON_STAGES;

export const computeSalesHealth = (
  deals: PipelineRecord[],
  leads: LeadRecord[],
  campaigns: CampaignRecord[]
): HealthCheckItem[] => {
  const now = new Date();

  const activeDeals = deals.filter((d) => !closedStages.includes(d.stage));
  const wonDeals = deals.filter((d) => wonStages.includes(d.stage));
  const totalDeals = deals.length;
  const closeRate =
    totalDeals > 0 ? (wonDeals.length / totalDeals) * 100 : 0;
  const pipelineValue = activeDeals.reduce(
    (sum, d) => sum + parseNum(d.value),
    0
  );

  const overdueFollowUps = deals.filter((d) => {
    if (!d.expected_close) return false;
    if (closedStages.includes(d.stage)) return false;
    try {
      return differenceInDays(now, parseISO(d.expected_close)) > 0;
    } catch {
      return false;
    }
  });

  const unassignedLeads = leads.filter(
    (l) =>
      !l.next_followup &&
      l.status !== "won" &&
      l.status !== "lost" &&
      l.status !== "closed"
  );

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

  const activeCampaigns = campaigns.filter(
    (c) => c.status === "active" || c.status === "sent"
  );
  const avgOpenRate =
    activeCampaigns.length > 0
      ? activeCampaigns.reduce((sum, c) => sum + parseNum(c.open_rate), 0) /
        activeCampaigns.length
      : 0;

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
      detail: totalDeals > 0 ? `${closeRate.toFixed(1)}% close rate` : "No deals yet",
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
