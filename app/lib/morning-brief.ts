/**
 * Morning brief generator — per-user, per-day curated summary that lands
 * in the dashboard hero card every morning. v0 ships the "owner" lens
 * (Roger's view); finance + sales lenses follow once their dependencies
 * (vendor-payment queue, sales-rep assignment) are in.
 *
 * The brief is intentionally short. Discipline: every line is clickable,
 * every line names an action. A finance brief that lists 22 anomalies in
 * plain text is noise; one that lists "3 deposits awaiting CFDI stamp"
 * with a one-tap action is a tool.
 */

import { differenceInDays, parseISO } from "date-fns";
import { CLOSED_STAGES, type PipelineStage } from "./sample-dashboard-data";

// ---------------------------------------------------------------------------
// Inputs the generator can ask for. Caller (the API route) hydrates these
// from the existing sheet readers; tests can pass fixtures directly.
// ---------------------------------------------------------------------------

export interface BriefDealRow {
  id: string;
  name: string;
  contactName: string;
  stage: PipelineStage | string;
  value: number;
  currency: string;
  source: string;
  createdAt: string;
  stageEnteredAt?: string;
  /** PR 5 — "yes" | "no" | "" */
  requiresCfdi?: string;
  /** PR 5 — present once Constancia is uploaded */
  constanciaDriveFileId?: string;
  /** Present once any payment with status=paid has been logged */
  hasPaidDeposit?: boolean;
  /** Present once any PO row exists for this deal */
  hasPo?: boolean;
  /** PR 10 — present once delivery window is set */
  deliveryWindowStart?: string;
  /** PR 10 — present once Miguel has called to confirm */
  deliveryPhoneConfirmedAt?: string;
}

export interface BriefTraficoRow {
  id: string;
  traficoNumber: string;
  status: string;
  initiatedDate?: string;
}

export interface MorningBriefInput {
  /** ISO timestamp the brief was generated. */
  generatedAt: string;
  user: { email: string; name: string; role: "owner" | "finance" | "sales" };
  deals: BriefDealRow[];
  traficos: BriefTraficoRow[];
}

// ---------------------------------------------------------------------------
// Output shape — the dashboard card and the eventual email render from this.
// ---------------------------------------------------------------------------

export interface BriefAction {
  /** Short imperative phrase. Fits on one line. */
  label: string;
  /** Hyperlink target. Internal `/dashboard/...` paths or external URLs. */
  href: string;
  /** Optional one-line context — why this action, or a stat. */
  detail?: string;
  /** SLA / freshness tag. "today", "3d overdue", etc. */
  badge?: string;
  /** Severity drives the dot color in the UI. */
  severity?: "info" | "warn" | "urgent";
}

export interface BriefPulseStat {
  label: string;
  value: string;
  delta?: string;
}

export interface OwnerMorningBrief {
  generatedAt: string;
  greeting: string;
  /** Top metrics row. */
  pulse: BriefPulseStat[];
  /** Things only Roger can unblock. Capped at 6 — anything more is noise. */
  needsYou: BriefAction[];
  /** What moved forward overnight. Capped at 4. */
  advanced: BriefAction[];
  /** Deals over the SLA window for their current stage. Capped at 4. */
  stuck: BriefAction[];
}

// ---------------------------------------------------------------------------
// SLA windows per stage — the "stuck" threshold. Conservative defaults; can
// be moved to a Settings sheet later without touching this generator.
// ---------------------------------------------------------------------------

const STAGE_SLA_DAYS: Partial<Record<PipelineStage, number>> = {
  discovery: 5,
  "design-scope": 7,
  proposal: 7,
  "proposal-sent": 10,
  negotiation: 14,
  "follow-up-negotiation": 14,
  "verbal-yes": 5,
  "deposit-pending": 5,
  "deposit-received": 7,
  ordering: 10,
  "in-production": 21,
  shipping: 14,
  "in-customs": 21,
  "customs-cleared": 7,
  received: 5,
  "delivery-scheduled": 5,
  delivered: 14,
  "balance-pending": 7,
};

const inDays = (iso: string | undefined, now: Date): number | null => {
  if (!iso) return null;
  try {
    return differenceInDays(now, parseISO(iso));
  } catch {
    return null;
  }
};

const fmtMoneyMxn = (n: number): string =>
  `$${Math.round(n).toLocaleString()} MXN`;

// ---------------------------------------------------------------------------
// Owner-specific generator. The function is pure: same inputs → same brief.
// ---------------------------------------------------------------------------

export const generateOwnerBrief = (
  input: MorningBriefInput,
): OwnerMorningBrief => {
  const now = new Date(input.generatedAt);
  const dayHour = now.getHours();
  const greeting =
    dayHour < 12 ? "Buenos días" : dayHour < 19 ? "Buenas tardes" : "Buenas noches";

  const activeDeals = input.deals.filter(
    (d) => !CLOSED_STAGES.includes(d.stage as PipelineStage),
  );

  // ── Pulse ─────────────────────────────────────────────────────────────
  const pipelineValue = activeDeals.reduce((s, d) => s + d.value, 0);
  const closedThisWeek = input.deals.filter((d) => {
    const stage = d.stage as PipelineStage;
    if (!CLOSED_STAGES.includes(stage)) return false;
    const days = inDays(d.stageEnteredAt ?? d.createdAt, now);
    return days !== null && days <= 7;
  });
  const wonRevenueWtd = closedThisWeek.reduce((s, d) => s + d.value, 0);
  const newSinceYesterday = input.deals.filter((d) => {
    const days = inDays(d.createdAt, now);
    return days !== null && days <= 1;
  }).length;

  const pulse: BriefPulseStat[] = [
    { label: "Pipeline", value: fmtMoneyMxn(pipelineValue), delta: `${activeDeals.length} active` },
    { label: "Won this week", value: fmtMoneyMxn(wonRevenueWtd), delta: `${closedThisWeek.length} closed` },
    { label: "New leads", value: String(newSinceYesterday), delta: "since yesterday" },
  ];

  // ── Needs you ─────────────────────────────────────────────────────────
  const needsYou: BriefAction[] = [];

  // 1. Unanswered ¿Requiere CFDI? (PR 5) — past 24h
  const cfdiOpen = activeDeals.filter((d) => {
    if (d.requiresCfdi === "yes" || d.requiresCfdi === "no") return false;
    const days = inDays(d.createdAt, now);
    return days !== null && days >= 1;
  });
  for (const d of cfdiOpen.slice(0, 2)) {
    needsYou.push({
      label: `Answer CFDI question on ${d.name}`,
      href: `/dashboard/pipeline?deal=${encodeURIComponent(d.id)}`,
      detail: `${d.contactName} · ${fmtMoneyMxn(d.value)}`,
      badge: "fiscal",
      severity: "warn",
    });
  }

  // 2. CFDI=yes but Constancia not uploaded after deposit
  const constanciaMissing = activeDeals.filter(
    (d) =>
      d.requiresCfdi === "yes" &&
      !d.constanciaDriveFileId &&
      d.hasPaidDeposit,
  );
  for (const d of constanciaMissing.slice(0, 2)) {
    needsYou.push({
      label: `Get Constancia for ${d.name}`,
      href: `/dashboard/pipeline?deal=${encodeURIComponent(d.id)}`,
      detail: `Deposit cleared · CFDI stamping blocked`,
      badge: "blocking",
      severity: "urgent",
    });
  }

  // 3. Deposit-received deals with no PO yet
  const noPoAfterDeposit = activeDeals.filter(
    (d) =>
      d.hasPaidDeposit &&
      !d.hasPo &&
      ["deposit-received", "ordering"].includes(d.stage as string),
  );
  for (const d of noPoAfterDeposit.slice(0, 2)) {
    needsYou.push({
      label: `Generate POs for ${d.name}`,
      href: `/dashboard/pipeline?deal=${encodeURIComponent(d.id)}&tab=purchase-orders`,
      detail: `Deposit cleared · vendors waiting`,
      badge: "today",
      severity: "warn",
    });
  }

  // 4. Local delivery scheduled but no phone-confirm with Miguel
  const miguelUnconfirmed = activeDeals.filter(
    (d) =>
      d.deliveryWindowStart &&
      !d.deliveryPhoneConfirmedAt &&
      ["received", "delivery-scheduled"].includes(d.stage as string),
  );
  for (const d of miguelUnconfirmed.slice(0, 2)) {
    needsYou.push({
      label: `Phone-confirm window with Miguel for ${d.name}`,
      href: `/dashboard/pipeline?deal=${encodeURIComponent(d.id)}&tab=shipments`,
      detail: `Scheduled ${d.deliveryWindowStart?.split("T")[0] ?? ""}`,
      severity: "info",
    });
  }

  // ── Advanced overnight ─────────────────────────────────────────────────
  const advanced: BriefAction[] = activeDeals
    .filter((d) => {
      const days = inDays(d.stageEnteredAt, now);
      return days !== null && days <= 1 && days >= 0;
    })
    .slice(0, 4)
    .map((d) => ({
      label: `${d.name} → ${d.stage}`,
      href: `/dashboard/pipeline?deal=${encodeURIComponent(d.id)}`,
      detail: `${d.contactName} · ${fmtMoneyMxn(d.value)}`,
      severity: "info",
    }));

  // ── Stuck ──────────────────────────────────────────────────────────────
  const stuck: BriefAction[] = activeDeals
    .map((d) => {
      const sla = STAGE_SLA_DAYS[d.stage as PipelineStage];
      if (sla === undefined) return null;
      const days = inDays(d.stageEnteredAt ?? d.createdAt, now);
      if (days === null || days <= sla) return null;
      return { d, daysOver: days - sla, totalDays: days };
    })
    .filter(<T,>(x: T | null): x is T => x !== null)
    .sort((a, b) => b.daysOver - a.daysOver)
    .slice(0, 4)
    .map(({ d, daysOver, totalDays }) => ({
      label: `${d.name} stuck in ${d.stage}`,
      href: `/dashboard/pipeline?deal=${encodeURIComponent(d.id)}`,
      detail: `${totalDays}d in stage · ${daysOver}d over`,
      badge: daysOver >= 14 ? "critical" : daysOver >= 7 ? "urgent" : "warn",
      severity: daysOver >= 14 ? "urgent" : "warn",
    }));

  return {
    generatedAt: input.generatedAt,
    greeting,
    pulse,
    needsYou: needsYou.slice(0, 6),
    advanced,
    stuck,
  };
};
