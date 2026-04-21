/**
 * SLA timer calculator — pure, client-safe.
 *
 * Per `PIPELINE_AUTOMATION_SPEC.md` §SLA timers per stage. Each stage has a
 * green/yellow/red day threshold against stage_entered_at. Brand-dependent
 * stages (in-production, shipping, in-customs) resolve their SLA from
 * Brand_Lead_Times with a soft-fallback to spec defaults.
 */

import type { PipelineDeal, PipelineStage } from "./sample-dashboard-data";

export type SlaColor = "green" | "yellow" | "red" | "unknown";

interface SlaThresholds {
  green: number; // days
  yellow: number;
  red: number;
}

interface BrandLeadTime {
  brand_slug: string;
  production_days?: string | number;
  transit_sea_days?: string | number;
  transit_air_days?: string | number;
  transit_truck_days?: string | number;
  customs_avg_days?: string | number;
  domestic_avg_days?: string | number;
}

// Fixed SLAs (spec §SLA timers per stage). Days.
const STATIC_SLAS: Partial<Record<PipelineStage, SlaThresholds>> = {
  "quote-approved": { green: 2, yellow: 3, red: 5 },
  "deposit-pending": { green: 7, yellow: 10, red: 14 },
  "deposit-received": { green: 3, yellow: 5, red: 7 },
  ordering: { green: 3, yellow: 5, red: 7 },
  "customs-cleared": { green: 1, yellow: 2, red: 3 },
  received: { green: 5, yellow: 7, red: 10 },
  "delivery-scheduled": { green: 2, yellow: 5, red: 10 }, // until scheduled date + grace
  delivered: { green: 2, yellow: 3, red: 5 },
  "balance-pending": { green: 14, yellow: 21, red: 30 },
};

// Brand-dependent stages fall back to these defaults when Brand_Lead_Times
// is empty or has no row for the deal's primary brand.
const BRAND_DEFAULT_PRODUCTION = 28; // days
const BRAND_DEFAULT_INTL_TRANSIT = 22;
const BRAND_DEFAULT_CUSTOMS = 7;

const parseDays = (raw: unknown, fallback: number): number => {
  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) return raw;
  if (typeof raw === "string") {
    const n = parseFloat(raw);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return fallback;
};

/**
 * Resolve per-stage SLA thresholds. Brand-dependent stages look up the
 * deal's primary brand in preloaded Brand_Lead_Times rows.
 */
export const getStageSla = (
  stage: PipelineStage,
  brandSlug: string | undefined,
  brandLeadTimes: BrandLeadTime[] = []
): SlaThresholds | null => {
  const staticSla = STATIC_SLAS[stage];
  if (staticSla) return staticSla;

  const brand = brandSlug
    ? brandLeadTimes.find((b) => b.brand_slug === brandSlug)
    : undefined;

  switch (stage) {
    case "in-production": {
      const green = parseDays(brand?.production_days, BRAND_DEFAULT_PRODUCTION);
      return { green, yellow: green + 3, red: green + 7 };
    }
    case "shipping": {
      // Prefer transit_sea_days, fall back to transit_truck_days then air.
      const raw =
        brand?.transit_sea_days ??
        brand?.transit_truck_days ??
        brand?.transit_air_days;
      const green = parseDays(raw, BRAND_DEFAULT_INTL_TRANSIT);
      return { green, yellow: green + 3, red: green + 7 };
    }
    case "in-customs": {
      const green = parseDays(brand?.customs_avg_days, BRAND_DEFAULT_CUSTOMS);
      // Spec: yellow at 24h over, red at 72h over → in whole days
      return { green, yellow: green + 1, red: green + 3 };
    }
    default:
      return null;
  }
};

/**
 * Classify days-in-stage against the SLA thresholds.
 */
export const classifySla = (
  daysInStage: number,
  sla: SlaThresholds
): SlaColor => {
  if (daysInStage <= sla.green) return "green";
  if (daysInStage <= sla.yellow) return "yellow";
  return "red";
};

export interface SlaResult {
  color: SlaColor;
  daysInStage: number;
  sla: SlaThresholds | null;
  nextThreshold: number | null; // days-in-stage at which the color will worsen
}

/**
 * Compute SLA state for a deal: color, days-in-stage, thresholds.
 * Terminal stages (complete, lost, etc.) return `unknown`.
 */
export const getSlaColor = (
  deal: Pick<PipelineDeal, "stage" | "stageEnteredAt" | "brandSlugs">,
  brandLeadTimes: BrandLeadTime[] = [],
  now: Date = new Date()
): SlaResult => {
  if (!deal.stageEnteredAt) {
    return { color: "unknown", daysInStage: 0, sla: null, nextThreshold: null };
  }

  const entered = new Date(deal.stageEnteredAt);
  if (!Number.isFinite(entered.getTime())) {
    return { color: "unknown", daysInStage: 0, sla: null, nextThreshold: null };
  }
  const daysInStage = Math.floor(
    (now.getTime() - entered.getTime()) / (1000 * 60 * 60 * 24)
  );

  const sla = getStageSla(deal.stage, deal.brandSlugs?.[0], brandLeadTimes);
  if (!sla) {
    return { color: "unknown", daysInStage, sla: null, nextThreshold: null };
  }

  const color = classifySla(daysInStage, sla);
  const nextThreshold =
    color === "green" ? sla.green + 1 :
    color === "yellow" ? sla.yellow + 1 :
    null; // red has no next threshold
  return { color, daysInStage, sla, nextThreshold };
};
