/**
 * Landed-cost calculator (W6 spec §Part 3) — pure, deterministic, no IO.
 *
 * Architecture:
 *   - `loadReferenceSnapshot()` does the IO (parallel reads of brands +
 *     4 W5 reference sheets) and returns a snapshot.
 *   - `computeLandedCost(input, snapshot)` is pure — given the same
 *     inputs, always returns the same output. Soft-fallbacks for empty
 *     reference data (Q1 = (b)) populate `warnings[]` and tip risk to
 *     yellow.
 *   - `computeQuoteRisk(output)` derives the quote-time risk pill.
 *   - `computeShipmentRisk(metrics)` derives the live-shipment risk pill
 *     per spec §risk_flag thresholds (delay_days + days_in_customs +
 *     NOM status).
 *
 * Test coverage: scripts/_test-landed-cost.ts (7 cases per design §5).
 */

import { getBrands } from "./brand-kit-sheets";
import {
  getBrandNomStatus,
  getBrandLeadTimes,
  getHsCodes,
  getFtaRates,
  type BrandNomStatus,
  type BrandLeadTimes,
  type HsCode,
  type FtaRate,
} from "./shipments-reference";
import type { Brand } from "./brand-kit-types";

// ---------------------------------------------------------------------------
// Public types — exact match for spec §Part 3 (lines 320-369)
// ---------------------------------------------------------------------------

export interface LandedCostInput {
  brandId: string;
  shopifyProductId: string;
  fobPriceUsd: number;
  quantity: number;
  hsCode?: string;
  destinationType: "warehouse_sma" | "client_jobsite";
  destinationCity?: string;
  fxRateUsdToMxn?: number;
  quoteDate: Date;
}

export interface LandedCostOutput {
  fobUsd: number;
  fobMxn: number;
  freightEstimateMxn: number;
  cifMxn: number;
  dutyRate: number;
  dutyRateBasis: string;
  dutyMxn: number;
  iepsMxn: number;
  ivaMxn: number;
  brokerFeeMxn: number;
  pedimentoFeeMxn: number;
  domesticFreightMxn: number;
  landedCostMxn: number;
  markupSuggestedMxn: number;
  quotePriceMxn: number;

  leadTimeDays: {
    production: number;
    internationalTransit: number;
    customs: number;
    domestic: number;
    total: number;
    etaDate: Date;
  };

  nomCompliance: {
    status: "certified" | "in_progress" | "not_required" | "needs_cert";
    applicableNoms: string[];
    delayRiskDays: number;
    warning?: string;
  };

  riskFlag: "green" | "yellow" | "red";
  warnings: string[];
}

export interface ReferenceSnapshot {
  brands: Brand[];
  brandNomStatus: BrandNomStatus[];
  brandLeadTimes: BrandLeadTimes[];
  hsCodes: HsCode[];
  ftaRates: FtaRate[];
}

// ---------------------------------------------------------------------------
// Constants — fallback tables when reference sheets are empty (Q1 = (b))
// ---------------------------------------------------------------------------

// Spec §lead-time table (lines 552-565). Keyed by brand slug.
// production / intlTransit (sea or truck for NAFTA origins) / customs / domestic
const DEFAULT_LEAD_TIMES: Record<
  string,
  { production: number; intlTransitSea: number; intlTransitTruck: number; customs: number; domestic: number }
> = {
  kohler:           { production: 14, intlTransitSea: 0,  intlTransitTruck: 10, customs: 1, domestic: 2 },
  brizo:            { production: 14, intlTransitSea: 0,  intlTransitTruck: 10, customs: 1, domestic: 2 },
  delta:            { production: 14, intlTransitSea: 0,  intlTransitTruck: 10, customs: 1, domestic: 2 },
  toto:             { production: 45, intlTransitSea: 35, intlTransitTruck: 0,  customs: 2, domestic: 2 },
  dornbracht:       { production: 28, intlTransitSea: 22, intlTransitTruck: 0,  customs: 3, domestic: 2 },
  hansgrohe:        { production: 21, intlTransitSea: 22, intlTransitTruck: 0,  customs: 3, domestic: 2 },
  grohe:            { production: 21, intlTransitSea: 22, intlTransitTruck: 0,  customs: 3, domestic: 2 },
  "villeroy-boch":  { production: 30, intlTransitSea: 22, intlTransitTruck: 0,  customs: 4, domestic: 2 },
  duravit:          { production: 30, intlTransitSea: 22, intlTransitTruck: 0,  customs: 4, domestic: 2 },
  kwc:              { production: 35, intlTransitSea: 28, intlTransitTruck: 0,  customs: 7, domestic: 2 },
  rubinet:          { production: 21, intlTransitSea: 0,  intlTransitTruck: 5,  customs: 1, domestic: 2 },
  smeg:             { production: 45, intlTransitSea: 25, intlTransitTruck: 0,  customs: 4, domestic: 2 },
};

const GENERIC_DEFAULT_LEAD_TIMES = {
  production: 30,
  intlTransitSea: 22,
  intlTransitTruck: 10,
  customs: 4,
  domestic: 2,
};

// Spec §domestic freight table (lines 569-575). Destination state → MXN.
const DOMESTIC_FREIGHT_BY_STATE: Record<string, { mxn: number; days: number }> = {
  Guanajuato: { mxn: 1800, days: 2 },
  Querétaro:  { mxn: 3500, days: 3 },
  CDMX:       { mxn: 3500, days: 3 },
  México:     { mxn: 3500, days: 3 },
  Puebla:     { mxn: 3500, days: 3 },
  Jalisco:    { mxn: 6500, days: 5 },
  "Nuevo León": { mxn: 6500, days: 5 },
  "Quintana Roo": { mxn: 6500, days: 5 },
  "Baja California": { mxn: 12000, days: 8 },
  Yucatán:    { mxn: 12000, days: 8 },
};

const SMA_DOMESTIC = DOMESTIC_FREIGHT_BY_STATE.Guanajuato;

const FREIGHT_RATE_PCT = 0.15; // 15% of FOB — spec line 478 (worked example)
const IVA_RATE = 0.16;          // 16% standard MX VAT
const BROKER_FEE_PCT = 0.015;   // 1.5% of CIF — spec line 462
const BROKER_FEE_FLOOR = 2500;  // MXN — spec line 462
const PEDIMENTO_FEE = 3000;     // flat MXN — spec line 463
const DEFAULT_FX = 20;          // MXN/USD fallback when not provided
const CC_MARKUP_PCT = 0.35;     // CC's target margin

// ---------------------------------------------------------------------------
// IO loader
// ---------------------------------------------------------------------------

export const loadReferenceSnapshot = async (): Promise<ReferenceSnapshot> => {
  const [brands, brandNomStatus, brandLeadTimes, hsCodes, ftaRates] = await Promise.all([
    getBrands(),
    getBrandNomStatus(),
    getBrandLeadTimes(),
    getHsCodes(),
    getFtaRates(),
  ]);
  return { brands, brandNomStatus, brandLeadTimes, hsCodes, ftaRates };
};

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

const round2 = (n: number): number => Math.round(n * 100) / 100;

const formatPct = (rate: number): string => {
  const pct = rate * 100;
  return Number.isInteger(pct) ? `${pct}%` : `${pct.toFixed(1)}%`;
};

const isFtaInEffect = (row: FtaRate, quoteDate: Date): boolean => {
  if (!row.effective_from) return true; // Empty effective_from = always
  const from = new Date(row.effective_from);
  if (quoteDate < from) return false;
  if (row.effective_until) {
    const until = new Date(row.effective_until);
    if (quoteDate > until) return false;
  }
  return true;
};

const resolveDomesticFreight = (
  destinationType: LandedCostInput["destinationType"],
  destinationCity: string | undefined
): { mxn: number; days: number } => {
  if (destinationType === "warehouse_sma") return SMA_DOMESTIC;
  if (!destinationCity) return SMA_DOMESTIC;
  // City → state heuristic. For W6, accept state name OR known city-to-state defaults.
  // City keys are commonly fed as Mexican state names in this app (per spec table).
  return DOMESTIC_FREIGHT_BY_STATE[destinationCity] ?? SMA_DOMESTIC;
};

// ---------------------------------------------------------------------------
// Core calculator
// ---------------------------------------------------------------------------

export const computeLandedCost = (
  input: LandedCostInput,
  snapshot: ReferenceSnapshot
): LandedCostOutput => {
  const warnings: string[] = [];

  // 1. Resolve brand
  const brand = snapshot.brands.find((b) => b.slug === input.brandId);
  if (!brand) {
    warnings.push(`Brand "${input.brandId}" not found in Brand_Kit — using generic origin assumption.`);
  }
  const originCountry = brand?.originCountry || "US";
  const isNAFTA = originCountry === "US" || originCountry === "CA";

  // 2. Resolve HS row
  const hsRow = input.hsCode
    ? snapshot.hsCodes.find((h) => h.hs_code === input.hsCode || h.hs_code_prefix_6 === input.hsCode)
    : undefined;
  if (input.hsCode && !hsRow) {
    warnings.push(`HS code ${input.hsCode} not in HS_Code_Lookup — using generic 10% MFN fallback.`);
  } else if (!input.hsCode) {
    warnings.push(`No HS code provided — using generic 10% MFN fallback.`);
  }
  const hsPrefix6 =
    hsRow?.hs_code_prefix_6 ||
    (input.hsCode && input.hsCode.length >= 7 ? input.hsCode.substring(0, 7) : input.hsCode || "");
  const mfnRate = parseFloat(hsRow?.default_duty_rate_mfn || "0.10");
  const iepsRate = hsRow?.ieps_applies === "y" ? 0.08 : 0;

  // 3. Resolve FTA preferential rate
  const ftaRow = snapshot.ftaRates.find(
    (r) =>
      r.origin_country === originCountry &&
      r.hs_code_prefix === hsPrefix6 &&
      isFtaInEffect(r, input.quoteDate)
  );
  const dutyRate = ftaRow ? parseFloat(ftaRow.preferential_rate) : mfnRate;
  const dutyRateBasis = ftaRow
    ? `${ftaRow.fta_code} ${formatPct(parseFloat(ftaRow.preferential_rate))}`
    : `MFN ${formatPct(mfnRate)}`;
  if (!ftaRow) {
    warnings.push(
      `No FTA rate on file for ${originCountry}/${hsPrefix6} — using MFN ${formatPct(mfnRate)} fallback.`
    );
  }

  // 4. FX
  const fxRate = input.fxRateUsdToMxn ?? DEFAULT_FX;
  if (input.fxRateUsdToMxn === undefined) {
    warnings.push(`FX rate not provided — using default ${DEFAULT_FX} MXN/USD.`);
  }

  // 5. Core math (spec §Worked example, line 478)
  const fobUsd = input.fobPriceUsd * input.quantity;
  const fobMxn = round2(fobUsd * fxRate);
  const freightEstimateMxn = round2(fobMxn * FREIGHT_RATE_PCT);
  const cifMxn = round2(fobMxn + freightEstimateMxn);
  const dutyMxn = round2(cifMxn * dutyRate);
  const iepsMxn = round2(cifMxn * iepsRate);
  const ivaBase = cifMxn + dutyMxn + iepsMxn;
  const ivaMxn = round2(ivaBase * IVA_RATE);
  const brokerFeeMxn = round2(Math.max(cifMxn * BROKER_FEE_PCT, BROKER_FEE_FLOOR));
  const pedimentoFeeMxn = PEDIMENTO_FEE;
  const domesticFreight = resolveDomesticFreight(input.destinationType, input.destinationCity);
  const domesticFreightMxn = domesticFreight.mxn;
  const landedCostMxn = round2(
    cifMxn + dutyMxn + iepsMxn + ivaMxn + brokerFeeMxn + pedimentoFeeMxn + domesticFreightMxn
  );

  const markupSuggestedMxn = round2(landedCostMxn * CC_MARKUP_PCT);
  const quotePriceMxn = round2(landedCostMxn + markupSuggestedMxn);

  // 6. Lead times
  const ltRow = snapshot.brandLeadTimes.find((b) => b.brand_slug === input.brandId);
  let production: number;
  let intl: number;
  let customsDays: number;
  let domesticDays: number;
  if (ltRow) {
    production = parseInt(ltRow.production_days || "0", 10) || 0;
    intl = isNAFTA
      ? parseInt(ltRow.transit_truck_days || "0", 10) || 0
      : parseInt(ltRow.transit_sea_days || "0", 10) || 0;
    customsDays = parseInt(ltRow.customs_avg_days || "0", 10) || 0;
    domesticDays = parseInt(ltRow.domestic_avg_days || "0", 10) || 0;
  } else {
    const fb = DEFAULT_LEAD_TIMES[input.brandId] || GENERIC_DEFAULT_LEAD_TIMES;
    production = fb.production;
    intl = isNAFTA ? fb.intlTransitTruck : fb.intlTransitSea;
    customsDays = fb.customs;
    domesticDays = fb.domestic;
    warnings.push(
      `Used default lead times — ${input.brandId} not in Brand_Lead_Times.`
    );
  }
  const totalDays = production + intl + customsDays + domesticDays;
  const etaDate = new Date(input.quoteDate);
  etaDate.setDate(etaDate.getDate() + totalDays);

  // 7. NOM compliance
  const applicableNoms = hsRow?.nom_codes
    ? hsRow.nom_codes.split("|").map((c) => c.trim()).filter(Boolean)
    : [];
  let nomStatus: LandedCostOutput["nomCompliance"]["status"] = "not_required";
  let delayRiskDays = 0;
  let nomWarning: string | undefined;

  if (applicableNoms.length > 0) {
    const certs = snapshot.brandNomStatus.filter(
      (c) => c.brand_slug === input.brandId && applicableNoms.includes(c.nom_code)
    );
    if (certs.length === 0) {
      nomStatus = "needs_cert";
      delayRiskDays = 14;
      nomWarning = `No NOM cert on file for ${input.brandId}: ${applicableNoms.join(", ")}.`;
      warnings.push(nomWarning);
    } else {
      const statuses = certs.map((c) => c.status);
      if (statuses.includes("blocked")) {
        nomStatus = "needs_cert";
        delayRiskDays = 30;
        nomWarning = `NOM blocked for ${input.brandId}.`;
        warnings.push(nomWarning);
      } else if (statuses.includes("needs-cert")) {
        nomStatus = "needs_cert";
        delayRiskDays = 14;
        nomWarning = `NOM needs cert for ${input.brandId}.`;
        warnings.push(nomWarning);
      } else if (statuses.includes("partial")) {
        nomStatus = "in_progress";
        delayRiskDays = 7;
        const partial = certs.find((c) => c.status === "partial");
        nomWarning = `NOM partial scope ("${partial?.applies_to_skus || "unspecified"}") — verify SKU coverage.`;
        warnings.push(nomWarning);
      } else if (statuses.includes("in-progress")) {
        nomStatus = "in_progress";
        delayRiskDays = 7;
      } else {
        // certified or not-applicable
        nomStatus = "certified";
      }
    }
  }

  const output: LandedCostOutput = {
    fobUsd,
    fobMxn,
    freightEstimateMxn,
    cifMxn,
    dutyRate,
    dutyRateBasis,
    dutyMxn,
    iepsMxn,
    ivaMxn,
    brokerFeeMxn,
    pedimentoFeeMxn,
    domesticFreightMxn,
    landedCostMxn,
    markupSuggestedMxn,
    quotePriceMxn,
    leadTimeDays: {
      production,
      internationalTransit: intl,
      customs: customsDays,
      domestic: domesticDays,
      total: totalDays,
      etaDate,
    },
    nomCompliance: { status: nomStatus, applicableNoms, delayRiskDays, warning: nomWarning },
    riskFlag: "green", // overwritten below
    warnings,
  };
  output.riskFlag = computeQuoteRisk(output);
  return output;
};

// ---------------------------------------------------------------------------
// Risk functions
// ---------------------------------------------------------------------------

export const computeQuoteRisk = (
  output: LandedCostOutput
): "green" | "yellow" | "red" => {
  if (output.nomCompliance.status === "needs_cert") return "red";

  const hasFtaFallback = output.warnings.some((w) => w.includes("FTA rate"));
  const hasLeadTimeFallback = output.warnings.some((w) => w.toLowerCase().includes("lead time"));
  const hasHsFallback = output.warnings.some((w) => w.toLowerCase().includes("hs code"));

  if (output.nomCompliance.status === "in_progress") return "yellow";
  if (hasFtaFallback || hasLeadTimeFallback || hasHsFallback) return "yellow";
  return "green";
};

export interface ShipmentRiskMetrics {
  delayDays: number;
  daysInCustomsHours: number;
  nomStatus: "certified" | "in-progress" | "needs-cert" | "blocked" | "not-applicable" | "partial" | string;
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
