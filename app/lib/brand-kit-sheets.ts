/**
 * Brand Kit Sheet reader.
 *
 * The Brand Kit lives in its own Google Sheet (`GOOGLE_BRAND_KIT_SHEET_ID`),
 * separate from the CRM Sheet. It's the source of truth for the 73 brands
 * rendered in `/dashboard/brands` and `/en/brands`.
 *
 * Schema owned by Joshua — see `scripts/seed-brand-kit-sheet.ts` for the
 * 25-column layout. If columns are added/reordered, update HEADER below.
 */

import { google } from "googleapis";
import type {
  Brand,
  CategorySlug,
  NomStatus,
  StockedState,
} from "./brand-kit-types";

const SHEET_ID = process.env.GOOGLE_BRAND_KIT_SHEET_ID ?? "";
const TAB = "brands";

export type { Brand, CategorySlug, NomStatus, StockedState };
export { CATEGORY_LABELS } from "./brand-kit-types";

// ── Auth ────────────────────────────────────────────────────────────────

const isConfigured = (): boolean =>
  Boolean(
    SHEET_ID &&
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY
  );

const getSheets = () => {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  return google.sheets({ version: "v4", auth });
};

// ── Parsers ─────────────────────────────────────────────────────────────

const parseBool = (v: string): boolean => v.trim().toUpperCase() === "TRUE";

const parsePipeList = (v: string): string[] =>
  v
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);

const parseNomStatus = (v: string): NomStatus => {
  const trimmed = v.trim() as NomStatus;
  const valid: NomStatus[] = [
    "certified",
    "partial",
    "in_progress",
    "needs_cert",
    "not_required",
    "unknown",
  ];
  return valid.includes(trimmed) ? trimmed : "unknown";
};

const parseStockedState = (v: string): StockedState => {
  const trimmed = v.trim() as StockedState;
  return trimmed === "stocked" || trimmed === "request" || trimmed === "external"
    ? trimmed
    : "";
};

const rowToBrand = (row: string[]): Brand => ({
  slug: (row[0] ?? "").trim(),
  name: (row[1] ?? "").trim(),
  taglineEn: row[2] ?? "",
  taglineEs: row[3] ?? "",
  descriptionEn: row[4] ?? "",
  descriptionEs: row[5] ?? "",
  originCountry: (row[6] ?? "").trim(),
  originCountryName: (row[7] ?? "").trim(),
  websiteUrl: (row[8] ?? "").trim(),
  externalUrl: (row[9] ?? "").trim(),
  stockedState: parseStockedState(row[10] ?? ""),
  primaryCategorySlug: ((row[11] ?? "").trim() || "") as CategorySlug | "",
  categorySlugs: parsePipeList(row[12] ?? "") as CategorySlug[],
  logoDriveId: (row[13] ?? "").trim(),
  heroDriveId: (row[14] ?? "").trim(),
  brandFolderDriveId: (row[15] ?? "").trim(),
  featuredProductIds: parsePipeList(row[16] ?? ""),
  featuredProjectSlugs: parsePipeList(row[17] ?? ""),
  nomStatusSummary: parseNomStatus(row[18] ?? "unknown"),
  isArtisan: parseBool(row[19] ?? ""),
  isFeatured: parseBool(row[20] ?? ""),
  displayOrder: row[21] ? Number(row[21]) || null : null,
  createdAt: row[22] ?? "",
  updatedAt: row[23] ?? "",
  updatedBy: row[24] ?? "",
});

// ── Cache ───────────────────────────────────────────────────────────────

const CACHE_TTL_MS = 5 * 60 * 1000;
let cache: { brands: Brand[]; at: number } | null = null;

const fetchBrandsFromSheet = async (): Promise<Brand[]> => {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${TAB}!A2:Y`,
  });
  const rows = (res.data.values as string[][] | undefined) ?? [];
  return rows.filter((r) => r[0]).map(rowToBrand);
};

// ── Public API ──────────────────────────────────────────────────────────

export const getBrands = async (): Promise<Brand[]> => {
  if (!isConfigured()) {
    console.warn("[Brand Kit] GOOGLE_BRAND_KIT_SHEET_ID not configured — returning empty list");
    return [];
  }
  const now = Date.now();
  if (cache && now - cache.at < CACHE_TTL_MS) return cache.brands;
  try {
    const brands = await fetchBrandsFromSheet();
    cache = { brands, at: now };
    return brands;
  } catch (err) {
    console.error("[Brand Kit] fetch failed:", err);
    if (cache) return cache.brands; // stale-while-error
    return [];
  }
};

export const getBrandBySlug = async (slug: string): Promise<Brand | null> => {
  const brands = await getBrands();
  return brands.find((b) => b.slug === slug) ?? null;
};

export const invalidateBrandsCache = (): void => {
  cache = null;
};
