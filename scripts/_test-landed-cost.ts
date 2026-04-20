/**
 * Deterministic unit tests for the landed-cost calculator (W6 spec §Part 3)
 * and both risk functions (computeQuoteRisk, computeShipmentRisk).
 *
 * Pure-function tests — no Sheets IO. Snapshots are constructed inline so
 * each case is hermetic and reproducible.
 *
 * Run: npx tsx scripts/_test-landed-cost.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import {
  computeLandedCost,
  computeQuoteRisk,
  computeShipmentRisk,
  type LandedCostInput,
  type ReferenceSnapshot,
} from "../app/lib/landed-cost";
import type { Brand } from "../app/lib/brand-kit-types";

const dornbracht: Brand = {
  slug: "dornbracht",
  name: "Dornbracht",
  taglineEn: "", taglineEs: "", descriptionEn: "", descriptionEs: "",
  originCountry: "DE", originCountryName: "Germany",
  websiteUrl: "", externalUrl: "",
  stockedState: "stocked",
  primaryCategorySlug: "faucetry-showers",
  categorySlugs: ["faucetry-showers"],
  logoDriveId: "", heroDriveId: "", brandFolderDriveId: "",
  featuredProductIds: [], featuredProjectSlugs: [],
  nomStatusSummary: "certified",
  isArtisan: false, isFeatured: false,
  displayOrder: null,
  createdAt: "", updatedAt: "", updatedBy: "",
};

const kohler: Brand = { ...dornbracht, slug: "kohler", name: "Kohler", originCountry: "US", originCountryName: "United States" };
const sunValley: Brand = { ...dornbracht, slug: "sun-valley-bronze", name: "Sun Valley Bronze", originCountry: "US" };

const HS_DORN: ReferenceSnapshot["hsCodes"][number] = {
  category_slug: "brass-faucets",
  display_name_en: "Brass / metal faucets",
  display_name_es: "Llaves de latón",
  hs_code: "7324.90.01",
  hs_code_prefix_6: "7324.90",
  nom_codes: "NOM-008-CONAGUA",
  ieps_applies: "n",
  default_duty_rate_mfn: "0.10",
  notes: "",
  updated_by: "", updated_at: "",
};

const HS_KOHLER: ReferenceSnapshot["hsCodes"][number] = {
  ...HS_DORN,
  hs_code: "7324.10.01",
  hs_code_prefix_6: "7324.10",
};

const FTA_TLCUEM: ReferenceSnapshot["ftaRates"][number] = {
  fta_code: "TLCUEM",
  origin_country: "DE",
  hs_code_prefix: "7324.90",
  preferential_rate: "0.07",
  effective_from: "2024-01-01",
  effective_until: "",
  source: "Tarifa Ley 2026",
  notes: "",
  updated_by: "", updated_at: "",
};

const FTA_USMCA: ReferenceSnapshot["ftaRates"][number] = {
  ...FTA_TLCUEM,
  fta_code: "USMCA",
  origin_country: "US",
  hs_code_prefix: "7324.10",
  preferential_rate: "0.00",
};

const NOM_DORN_CERT: ReferenceSnapshot["brandNomStatus"][number] = {
  brand_slug: "dornbracht",
  nom_code: "NOM-008-CONAGUA",
  status: "certified",
  applies_to_skus: "all",
  cert_drive_folder_id: "",
  last_verified_date: "2026-03-15",
  expires_date: "2027-03-15",
  notes: "",
  updated_by: "", updated_at: "",
};

const LT_DORN: ReferenceSnapshot["brandLeadTimes"][number] = {
  brand_slug: "dornbracht",
  production_days: "28",
  transit_sea_days: "22",
  transit_air_days: "4",
  transit_truck_days: "",
  customs_avg_days: "3",
  domestic_avg_days: "2",
  last_verified_date: "2026-04-18",
  notes: "",
  updated_by: "", updated_at: "",
};

const baseInput: LandedCostInput = {
  brandId: "dornbracht",
  shopifyProductId: "DB-VAIA-25MM",
  fobPriceUsd: 812,
  quantity: 4,
  hsCode: "7324.90.01",
  destinationType: "warehouse_sma",
  fxRateUsdToMxn: 20,
  quoteDate: new Date("2026-04-19"),
};

const assert = (cond: boolean, msg: string): void => {
  if (!cond) throw new Error(`assertion failed: ${msg}`);
};

const main = async () => {
  let n = 0;
  const pass = (msg: string) => { n++; console.log(`  ✓ ${msg}`); };

  // ---------------------------------------------------------------------
  // Case 1 — spec worked example (line 467 of SHIPMENTS_CUSTOMS_SPEC.md)
  // ---------------------------------------------------------------------
  console.log("→ Case 1: spec worked example (Dornbracht / DE / TLCUEM 7%)");
  {
    const snap: ReferenceSnapshot = {
      brands: [dornbracht],
      brandNomStatus: [NOM_DORN_CERT],
      brandLeadTimes: [LT_DORN],
      hsCodes: [HS_DORN],
      ftaRates: [FTA_TLCUEM],
    };
    const out = computeLandedCost(baseInput, snap);

    assert(Math.abs(out.landedCostMxn - 100022) < 1, `landedCostMxn=${out.landedCostMxn}, expected ~100022`);
    pass(`landedCostMxn within 1 of spec (got ${out.landedCostMxn.toFixed(2)})`);

    assert(out.dutyRate === 0.07, `dutyRate=${out.dutyRate}, expected 0.07`);
    pass(`dutyRate = 0.07`);

    assert(out.dutyRateBasis === "TLCUEM 7%" || out.dutyRateBasis === "TLCUEM 7.0%", `dutyRateBasis=${out.dutyRateBasis}`);
    pass(`dutyRateBasis = "${out.dutyRateBasis}"`);

    assert(out.leadTimeDays.total === 55, `total=${out.leadTimeDays.total}, expected 55`);
    pass(`leadTimeDays.total = 55 (28+22+3+2)`);

    assert(out.nomCompliance.status === "certified", `status=${out.nomCompliance.status}`);
    pass(`nomCompliance.status = certified`);

    assert(out.riskFlag === "green", `riskFlag=${out.riskFlag}, expected green`);
    pass(`riskFlag = green`);

    assert(out.warnings.length === 0, `warnings should be empty when all reference data present, got ${out.warnings.length}: ${out.warnings.join(' | ')}`);
    pass(`warnings = [] (full reference data)`);
  }

  // ---------------------------------------------------------------------
  // Case 2 — USMCA / Kohler / US (0% duty)
  // ---------------------------------------------------------------------
  console.log("→ Case 2: USMCA / Kohler / US (0% duty)");
  {
    const snap: ReferenceSnapshot = {
      brands: [kohler],
      brandNomStatus: [],
      brandLeadTimes: [],
      hsCodes: [HS_KOHLER],
      ftaRates: [FTA_USMCA],
    };
    const out = computeLandedCost(
      { ...baseInput, brandId: "kohler", hsCode: "7324.10.01", fobPriceUsd: 500, quantity: 1 },
      snap
    );
    assert(out.dutyRate === 0.0, `dutyRate=${out.dutyRate}, expected 0`);
    pass(`dutyRate = 0`);
    assert(out.dutyRateBasis.startsWith("USMCA"), `dutyRateBasis=${out.dutyRateBasis}`);
    pass(`dutyRateBasis starts with "USMCA"`);
    assert(out.dutyMxn === 0, `dutyMxn=${out.dutyMxn}, expected 0`);
    pass(`dutyMxn = 0`);
  }

  // ---------------------------------------------------------------------
  // Case 3 — Empty FTA_Rates → MFN fallback
  // ---------------------------------------------------------------------
  console.log("→ Case 3: empty FTA_Rates → MFN fallback");
  {
    // NOM cert seeded so only FTA + Lead-Time fallbacks fire — isolates the FTA path
    const snap: ReferenceSnapshot = {
      brands: [kohler],
      brandNomStatus: [{ ...NOM_DORN_CERT, brand_slug: "kohler" }],
      brandLeadTimes: [{ ...LT_DORN, brand_slug: "kohler", transit_truck_days: "10", transit_sea_days: "" }],
      hsCodes: [HS_KOHLER],
      ftaRates: [],
    };
    const out = computeLandedCost(
      { ...baseInput, brandId: "kohler", hsCode: "7324.10.01" },
      snap
    );
    assert(out.dutyRate === 0.10, `dutyRate=${out.dutyRate}, expected 0.10 (MFN)`);
    pass(`dutyRate = 0.10 (MFN fallback)`);
    assert(out.dutyRateBasis.startsWith("MFN"), `dutyRateBasis=${out.dutyRateBasis}`);
    pass(`dutyRateBasis starts with "MFN"`);
    assert(out.warnings.some((w) => w.includes("FTA")), `warnings should mention FTA fallback, got: ${out.warnings.join(' | ')}`);
    pass(`warnings includes FTA-fallback note`);
    assert(out.riskFlag === "yellow", `riskFlag=${out.riskFlag}, expected yellow`);
    pass(`riskFlag = yellow (MFN fallback used)`);
  }

  // ---------------------------------------------------------------------
  // Case 4 — Empty Brand_Lead_Times → spec-default lead times + warning
  // ---------------------------------------------------------------------
  console.log("→ Case 4: empty Brand_Lead_Times → spec-default + warning");
  {
    const snap: ReferenceSnapshot = {
      brands: [dornbracht],
      brandNomStatus: [NOM_DORN_CERT],
      brandLeadTimes: [], // empty
      hsCodes: [HS_DORN],
      ftaRates: [FTA_TLCUEM],
    };
    const out = computeLandedCost(baseInput, snap);
    assert(out.leadTimeDays.total === 55, `total=${out.leadTimeDays.total}, expected 55 (Dornbracht spec default)`);
    pass(`leadTimeDays.total = 55 from spec-default fallback`);
    assert(out.warnings.some((w) => w.toLowerCase().includes("lead time")), `warnings should mention lead-time fallback, got: ${out.warnings.join(' | ')}`);
    pass(`warnings includes lead-time-fallback note`);
    assert(out.riskFlag === "yellow", `riskFlag=${out.riskFlag}, expected yellow`);
    pass(`riskFlag = yellow (lead-time fallback used)`);
  }

  // ---------------------------------------------------------------------
  // Case 5 — NOM needs-cert → red risk
  // ---------------------------------------------------------------------
  console.log("→ Case 5: NOM needs-cert → red risk");
  {
    const snap: ReferenceSnapshot = {
      brands: [sunValley],
      brandNomStatus: [{
        brand_slug: "sun-valley-bronze",
        nom_code: "NOM-008-CONAGUA",
        status: "needs-cert",
        applies_to_skus: "all",
        cert_drive_folder_id: "", last_verified_date: "", expires_date: "",
        notes: "", updated_by: "", updated_at: "",
      }],
      brandLeadTimes: [],
      hsCodes: [HS_DORN],
      ftaRates: [{ ...FTA_USMCA, origin_country: "US", hs_code_prefix: "7324.90" }],
    };
    const out = computeLandedCost(
      { ...baseInput, brandId: "sun-valley-bronze", hsCode: "7324.90.01" },
      snap
    );
    assert(out.nomCompliance.status === "needs_cert", `nom.status=${out.nomCompliance.status}`);
    pass(`nomCompliance.status = needs_cert`);
    assert(out.riskFlag === "red", `riskFlag=${out.riskFlag}, expected red`);
    pass(`riskFlag = red`);
  }

  // ---------------------------------------------------------------------
  // Case 6 — NOM partial → yellow + scope warning
  // ---------------------------------------------------------------------
  console.log("→ Case 6: NOM partial → yellow + scope-needs-verification warning");
  {
    const snap: ReferenceSnapshot = {
      brands: [dornbracht],
      brandNomStatus: [{
        ...NOM_DORN_CERT,
        status: "partial",
        applies_to_skus: "thermostats only",
      }],
      brandLeadTimes: [LT_DORN],
      hsCodes: [HS_DORN],
      ftaRates: [FTA_TLCUEM],
    };
    const out = computeLandedCost(baseInput, snap);
    assert(out.nomCompliance.status === "in_progress", `nom.status=${out.nomCompliance.status}, expected in_progress`);
    pass(`nomCompliance.status = in_progress (partial cert)`);
    assert(out.warnings.some((w) => w.toLowerCase().includes("scope") || w.toLowerCase().includes("partial")), `warnings should flag partial scope, got: ${out.warnings.join(' | ')}`);
    pass(`warnings includes partial-scope note`);
    assert(out.riskFlag === "yellow", `riskFlag=${out.riskFlag}, expected yellow`);
    pass(`riskFlag = yellow`);
  }

  // ---------------------------------------------------------------------
  // Case 7 — NOM in-progress → yellow
  // ---------------------------------------------------------------------
  console.log("→ Case 7: NOM in-progress → yellow");
  {
    const snap: ReferenceSnapshot = {
      brands: [dornbracht],
      brandNomStatus: [{ ...NOM_DORN_CERT, status: "in-progress" }],
      brandLeadTimes: [LT_DORN],
      hsCodes: [HS_DORN],
      ftaRates: [FTA_TLCUEM],
    };
    const out = computeLandedCost(baseInput, snap);
    assert(out.nomCompliance.status === "in_progress", `nom.status=${out.nomCompliance.status}`);
    pass(`nomCompliance.status = in_progress`);
    assert(out.riskFlag === "yellow", `riskFlag=${out.riskFlag}, expected yellow`);
    pass(`riskFlag = yellow`);
  }

  // ---------------------------------------------------------------------
  // computeShipmentRisk — live-shipment thresholds (spec §risk_flag)
  // ---------------------------------------------------------------------
  console.log("→ computeShipmentRisk — live-shipment thresholds (spec §risk_flag)");
  {
    assert(computeShipmentRisk({ delayDays: 8, daysInCustomsHours: 0, nomStatus: "certified", daysToEta: 30 }) === "red", "delay >= 7 → red");
    pass("delayDays=8 → red");
    assert(computeShipmentRisk({ delayDays: 4, daysInCustomsHours: 0, nomStatus: "certified", daysToEta: 30 }) === "yellow", "delay 3-6 → yellow");
    pass("delayDays=4 → yellow");
    assert(computeShipmentRisk({ delayDays: 0, daysInCustomsHours: 0, nomStatus: "needs-cert", daysToEta: 30 }) === "red", "needs-cert → red");
    pass("nomStatus needs-cert → red");
    assert(computeShipmentRisk({ delayDays: 0, daysInCustomsHours: 0, nomStatus: "in-progress", daysToEta: 10 }) === "red", "in-progress + days_to_eta < 14 → red");
    pass("in-progress + daysToEta=10 → red");
    assert(computeShipmentRisk({ delayDays: 0, daysInCustomsHours: 0, nomStatus: "in-progress", daysToEta: 30 }) === "green", "in-progress + days_to_eta >= 14 → green");
    pass("in-progress + daysToEta=30 → green");
    assert(computeShipmentRisk({ delayDays: 0, daysInCustomsHours: 30, nomStatus: "certified", daysToEta: 30 }) === "yellow", "days_in_customs > 24h → yellow");
    pass("daysInCustomsHours=30 → yellow");
    assert(computeShipmentRisk({ delayDays: 0, daysInCustomsHours: 0, nomStatus: "certified", daysToEta: 30 }) === "green", "all clear → green");
    pass("clean state → green");
  }

  console.log(`\n✅ Landed-cost calculator: all ${n} assertions pass.`);
};

main().catch((e) => {
  console.error("\n❌ FAILED:", e?.message || e);
  process.exit(1);
});
