/**
 * Typed read helpers for the 4 W5 reference sheets. Schemas live in
 * docs/superpowers/specs/2026-04-18-week5-shipments-design.md §3.
 *
 * All values come back as strings (Sheets has no type coercion). Cast
 * to numbers / booleans at the call site as needed (the W6 landed-cost
 * calculator will do this).
 */

import { readSheet } from "./dashboard-sheets";

export type BrandNomStatus = Record<string, string> & {
  brand_slug: string;
  nom_code: string;
  status: string;
  applies_to_skus: string;
  cert_drive_folder_id: string;
  last_verified_date: string;
  expires_date: string;
  notes: string;
  updated_by: string;
  updated_at: string;
};

export type BrandLeadTimes = Record<string, string> & {
  brand_slug: string;
  production_days: string;
  transit_sea_days: string;
  transit_air_days: string;
  transit_truck_days: string;
  customs_avg_days: string;
  domestic_avg_days: string;
  last_verified_date: string;
  notes: string;
  updated_by: string;
  updated_at: string;
};

export type HsCode = Record<string, string> & {
  category_slug: string;
  display_name_en: string;
  display_name_es: string;
  hs_code: string;
  hs_code_prefix_6: string;
  nom_codes: string;
  ieps_applies: string;
  default_duty_rate_mfn: string;
  notes: string;
  updated_by: string;
  updated_at: string;
};

export type FtaRate = Record<string, string> & {
  fta_code: string;
  origin_country: string;
  hs_code_prefix: string;
  preferential_rate: string;
  effective_from: string;
  effective_until: string;
  source: string;
  notes: string;
  updated_by: string;
  updated_at: string;
};

export const getBrandNomStatus = () => readSheet<BrandNomStatus>("Brand_NOM_Status");
export const getBrandLeadTimes = () => readSheet<BrandLeadTimes>("Brand_Lead_Times");
export const getHsCodes = () => readSheet<HsCode>("HS_Code_Lookup");
export const getFtaRates = () => readSheet<FtaRate>("FTA_Rates");
