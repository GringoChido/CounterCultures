/**
 * Derives ShipmentRiskMetrics for a live Trafico/Deal pair, then passes to
 * the pure computeShipmentRisk function (landed-cost.ts §risk_flag).
 *
 * This closes the W6 follow-up: the W6 Pipeline card badge used a coarse
 * status-based heuristic because computing delay_days + days_in_customs
 * needed Status_History_JSON date math that wasn't wired. W7 wires it:
 *
 *   delayDays             from initiatedDate vs today, for Traficos still
 *                         in pre-cleared phases
 *   daysInCustomsHours    aggregate time spent in any customs-phase status
 *                         (awaiting-documents → payment-sent) by diffing
 *                         status_history timestamps
 *   nomStatus             join Brand_NOM_Status on deal.brand_slugs[0];
 *                         falls back to "unknown" when the reference sheet
 *                         is empty (same soft-fallback as calculator)
 *   daysToEta             now vs deal.expected_close
 *
 * All lookups resilient to missing data — returns "unknown" / 0 / safe
 * defaults. No throws.
 */

import type { Trafico, TraficoStatus } from "./customs-data";
import type { PipelineDeal } from "./sample-dashboard-data";

// Pure module — no Sheets/googleapis imports so it's safe to use from
// client components. Callers that need a preloaded Brand_NOM_Status
// snapshot fetch it via /api/dashboard/reference/brand-nom-status and
// pass the array into the helpers below.

// ShipmentRiskMetrics type + computeShipmentRisk pure fn were originally
// in landed-cost.ts but that module transitively imports googleapis
// through brand-kit-sheets.ts, which breaks the Next.js client bundle.
// Defining them here keeps both the Pipeline card and the test scripts
// working; landed-cost.ts re-exports these for backward-compat.

export interface ShipmentRiskMetrics {
  delayDays: number;
  daysInCustomsHours: number;
  nomStatus:
    | "certified"
    | "in-progress"
    | "needs-cert"
    | "blocked"
    | "not-applicable"
    | "partial"
    | string;
  daysToEta: number;
}

export const computeShipmentRisk = (
  m: ShipmentRiskMetrics
): "green" | "yellow" | "red" => {
  if (m.nomStatus === "needs-cert" || m.nomStatus === "blocked") return "red";
  if (m.delayDays >= 7) return "red";
  if (m.nomStatus === "in-progress" && m.daysToEta < 14) return "red";
  if (m.delayDays >= 3 && m.delayDays <= 6) return "yellow";
  if (m.daysInCustomsHours > 24) return "yellow";
  return "green";
};

// Customs-phase statuses — time accumulated in any of these contributes to
// daysInCustomsHours. Any transition INTO one of these starts the clock;
// any transition OUT stops it (crossing-approved ends customs).
const CUSTOMS_PHASES: ReadonlySet<TraficoStatus> = new Set<TraficoStatus>([
  "awaiting-documents",
  "calculo-received",
  "payment-pending",
  "payment-sent",
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const parseISO = (s: string): Date | null => {
  if (!s) return null;
  const d = new Date(s);
  return Number.isFinite(d.getTime()) ? d : null;
};

const hoursBetween = (a: Date, b: Date): number =>
  Math.max(0, (b.getTime() - a.getTime()) / (1000 * 60 * 60));

const daysBetween = (a: Date, b: Date): number =>
  Math.max(0, Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));

/**
 * Walk status_history chronologically. For each [prev, next] pair where prev
 * is a customs-phase status, accumulate (next.timestamp - prev.timestamp).
 * If the latest entry is STILL a customs phase, also add (now - latest).
 *
 * Returns total hours spent in customs phases across the entire lifetime
 * of the Trafico.
 */
const computeDaysInCustomsHours = (
  history: Trafico["statusHistory"],
  now: Date
): number => {
  if (!history || history.length === 0) return 0;

  // Sort chronologically (history should already be ordered but don't trust it)
  const sorted = [...history].sort((a, b) => {
    const ta = parseISO(a.timestamp)?.getTime() ?? 0;
    const tb = parseISO(b.timestamp)?.getTime() ?? 0;
    return ta - tb;
  });

  let total = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    const entry = sorted[i];
    const next = sorted[i + 1];
    const entryTs = parseISO(entry.timestamp);
    const nextTs = parseISO(next.timestamp);
    if (!entryTs || !nextTs) continue;
    if (CUSTOMS_PHASES.has(entry.status)) {
      total += hoursBetween(entryTs, nextTs);
    }
  }

  // Tail: if the latest status is still a customs phase, accumulate until now.
  const latest = sorted[sorted.length - 1];
  const latestTs = parseISO(latest.timestamp);
  if (latestTs && CUSTOMS_PHASES.has(latest.status)) {
    total += hoursBetween(latestTs, now);
  }

  return Math.round(total);
};

/**
 * delayDays — rough proxy: how many days past the initiated date are we
 * still pre-cleared? If the Trafico has already been approved/complete,
 * delayDays = 0 (not delayed — done). Otherwise, (now - initiatedDate)
 * minus the brand's typical customs_avg_days tolerance.
 *
 * For W7 we use a simple approximation: the delta between now and the last
 * status_history timestamp, if we've been sitting in the same pre-cleared
 * status too long. This surfaces "stuck" shipments without needing the
 * brand lead-time reference (which may still be empty).
 */
const computeDelayDays = (
  trafico: Trafico,
  history: Trafico["statusHistory"],
  now: Date
): number => {
  if (trafico.status === "crossing-approved" ||
      trafico.status === "in-transit-domestic" ||
      trafico.status === "delivered-to-cc" ||
      trafico.status === "complete") {
    return 0;
  }

  const initiatedTs =
    parseISO(trafico.initiatedDate ?? "") ??
    parseISO(history?.[0]?.timestamp ?? "");
  if (!initiatedTs) return 0;
  return daysBetween(initiatedTs, now);
};

const computeDaysToEta = (
  deal: PipelineDeal,
  now: Date
): number => {
  const etaTs = parseISO(deal.expectedClose);
  if (!etaTs) return 999;
  // can be negative when ETA has passed; keep signed so downstream can
  // treat negatives as "past ETA" if needed, but computeShipmentRisk
  // checks < 14 so both neg and 0..13 trip the "in-progress + near-ETA" case
  return Math.floor((etaTs.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

type NomRow = { brand_slug: string; status: string };

/**
 * Look up `Brand_NOM_Status` for the deal's primary brand. Returns
 * "unknown" when the reference sheet is empty or the brand has no row.
 * Accepts a pre-loaded snapshot to avoid re-reading per card.
 */
export const lookupNomStatus = (
  brandSlug: string | undefined,
  preloadedRows?: NomRow[]
): ShipmentRiskMetrics["nomStatus"] => {
  if (!brandSlug) return "unknown";
  if (!preloadedRows || preloadedRows.length === 0) return "unknown";
  const match = preloadedRows.find((r) => r.brand_slug === brandSlug);
  return (match?.status as ShipmentRiskMetrics["nomStatus"]) ?? "unknown";
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Compute risk metrics for a Trafico/Deal pair, optionally using a preloaded
 * Brand_NOM_Status snapshot (caller batches that read for N cards).
 */
export const deriveShipmentRiskMetrics = (
  trafico: Trafico,
  deal: PipelineDeal,
  preloadedNomRows?: NomRow[]
): ShipmentRiskMetrics => {
  const now = new Date();
  const history = trafico.statusHistory ?? [];

  const daysInCustomsHours = computeDaysInCustomsHours(history, now);
  const delayDays = computeDelayDays(trafico, history, now);
  const nomStatus = lookupNomStatus(deal.brandSlugs?.[0], preloadedNomRows);
  const daysToEta = computeDaysToEta(deal, now);

  return { delayDays, daysInCustomsHours, nomStatus, daysToEta };
};

