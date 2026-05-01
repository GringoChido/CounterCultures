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
import { CLOSED_STAGES, WON_STAGES, type PipelineStage } from "./sample-dashboard-data";

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
  "quote-approved": 5,
  "deposit-pending": 5,
  "deposit-received": 7,
  ordering: 10,
  "in-production": 21,
  shipping: 14,
  "in-customs": 21,
  "customs-cleared": 7,
  received: 5,
  "delivery-scheduled": 5,
  // delivered + balance-pending intentionally omitted: they're in
  // CLOSED_STAGES so the stuck filter would never see them. Revisit
  // once those stages move out of CLOSED_STAGES.
};

// Customs SLA: a Trafico that's been "open" longer than this is stuck.
const TRAFICO_SLA_DAYS = 21;

// Used to sort needsYou before slicing to 6. Higher wins.
const SEVERITY_WEIGHT: Record<NonNullable<BriefAction["severity"]>, number> = {
  urgent: 100,
  warn: 50,
  info: 10,
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

  const activeDeals = input.deals.filter(
    (d) => !CLOSED_STAGES.includes(d.stage as PipelineStage),
  );

  // ── Pulse ─────────────────────────────────────────────────────────────
  const pipelineValue = activeDeals.reduce((s, d) => s + d.value, 0);
  const wonThisWeek = input.deals.filter((d) => {
    const stage = d.stage as PipelineStage;
    if (!WON_STAGES.includes(stage)) return false;
    const days = inDays(d.stageEnteredAt ?? d.createdAt, now);
    return days !== null && days <= 7;
  });
  const wonRevenueWtd = wonThisWeek.reduce((s, d) => s + d.value, 0);
  const newSinceYesterday = input.deals.filter((d) => {
    const days = inDays(d.createdAt, now);
    return days !== null && days <= 1;
  }).length;

  // ── Customs ──────────────────────────────────────────────────────────
  // A Trafico is "open" until status indicates it's cleared/closed. Stuck
  // = open longer than TRAFICO_SLA_DAYS. Status vocabulary varies, so
  // pattern-match instead of enumerating.
  const isClosedTrafico = (t: BriefTraficoRow): boolean =>
    /clear|closed|complete|received/i.test(t.status);
  const openTraficos = input.traficos.filter((t) => !isClosedTrafico(t));
  const stuckTraficos = openTraficos.filter((t) => {
    const days = inDays(t.initiatedDate, now);
    return days !== null && days > TRAFICO_SLA_DAYS;
  });

  const pulse: BriefPulseStat[] = [
    { label: "Pipeline", value: fmtMoneyMxn(pipelineValue), delta: `${activeDeals.length} active` },
    { label: "Won this week", value: fmtMoneyMxn(wonRevenueWtd), delta: `${wonThisWeek.length} won` },
    { label: "New leads", value: String(newSinceYesterday), delta: "since yesterday" },
    {
      label: "In customs",
      value: String(openTraficos.length),
      delta: stuckTraficos.length > 0 ? `${stuckTraficos.length} over ${TRAFICO_SLA_DAYS}d` : "all on track",
    },
  ];

  // ── Needs you ─────────────────────────────────────────────────────────
  const needsYou: BriefAction[] = [];

  // 1. Unanswered ¿Requiere CFDI? (PR 5) — past 24h.
  // Only fires on explicit empty string. `undefined` means the column
  // is missing from the sheet (not "unanswered") — see route guard.
  const cfdiOpen = activeDeals.filter((d) => {
    if (d.requiresCfdi !== "") return false;
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

  // 4. Local delivery scheduled but no phone-confirm with Miguel.
  // Severity bumps to warn when the window is within 24 hours — a missed
  // confirm on tomorrow's delivery is materially worse than next week's.
  const miguelUnconfirmed = activeDeals.filter(
    (d) =>
      d.deliveryWindowStart &&
      !d.deliveryPhoneConfirmedAt &&
      ["received", "delivery-scheduled"].includes(d.stage as string),
  );
  for (const d of miguelUnconfirmed.slice(0, 2)) {
    const daysUntil = d.deliveryWindowStart
      ? differenceInDays(parseISO(d.deliveryWindowStart), now)
      : null;
    const isImminent = daysUntil !== null && daysUntil <= 1;
    needsYou.push({
      label: `Phone-confirm window with Miguel for ${d.name}`,
      href: `/dashboard/pipeline?deal=${encodeURIComponent(d.id)}&tab=shipments`,
      detail: `Scheduled ${d.deliveryWindowStart?.split("T")[0] ?? ""}`,
      badge: isImminent ? "tomorrow" : undefined,
      severity: isImminent ? "warn" : "info",
    });
  }

  // ── Advanced overnight ─────────────────────────────────────────────────
  // Runs against input.deals (not activeDeals) so deals that closed-won
  // overnight surface here — exactly the news Roger most wants to see.
  const advanced: BriefAction[] = input.deals
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

  // Sort needsYou by severity weight before slicing so urgent items
  // (Constancia blocking, imminent delivery) never get pushed out by
  // lower-priority items (CFDI questions on early-stage deals).
  needsYou.sort(
    (a, b) =>
      SEVERITY_WEIGHT[b.severity ?? "info"] -
      SEVERITY_WEIGHT[a.severity ?? "info"],
  );

  return {
    generatedAt: input.generatedAt,
    pulse,
    needsYou: needsYou.slice(0, 6),
    advanced,
    stuck,
  };
};
