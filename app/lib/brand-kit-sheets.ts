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

import { GoogleAuth } from "google-auth-library";
import { sheets as sheetsApi } from "@googleapis/sheets";
import { getGooglePrivateKey } from "./google-private-key";
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
      getGooglePrivateKey()
  );

const getSheets = () => {
  const auth = new GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: getGooglePrivateKey(),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return sheetsApi({ version: "v4", auth });
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

// ── Writer ──────────────────────────────────────────────────────────────

// Columns (1-indexed) matching the seed schema. Keep in sync with scripts/seed-brand-kit-sheet.ts.
const COLUMN_MAP = {
  name: "B",
  taglineEn: "C",
  taglineEs: "D",
  descriptionEn: "E",
  descriptionEs: "F",
  originCountry: "G",
  originCountryName: "H",
  websiteUrl: "I",
  externalUrl: "J",
  stockedState: "K",
  primaryCategorySlug: "L",
  categorySlugs: "M",
  logoDriveId: "N",
  heroDriveId: "O",
  brandFolderDriveId: "P",
  featuredProductIds: "Q",
  featuredProjectSlugs: "R",
  nomStatusSummary: "S",
  isArtisan: "T",
  isFeatured: "U",
  displayOrder: "V",
  updatedAt: "X",
  updatedBy: "Y",
} as const;

export type BrandPatch = Partial<
  Pick<
    Brand,
    | "name"
    | "taglineEn"
    | "taglineEs"
    | "descriptionEn"
    | "descriptionEs"
    | "originCountry"
    | "originCountryName"
    | "websiteUrl"
    | "externalUrl"
    | "stockedState"
    | "primaryCategorySlug"
    | "categorySlugs"
    | "logoDriveId"
    | "heroDriveId"
    | "brandFolderDriveId"
    | "featuredProductIds"
    | "featuredProjectSlugs"
    | "nomStatusSummary"
    | "isArtisan"
    | "isFeatured"
    | "displayOrder"
  >
>;

const serializeCell = (field: keyof BrandPatch, value: unknown): string => {
  if (value == null) return "";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean).join("|");
  return String(value);
};

export const updateBrand = async (
  slug: string,
  patch: BrandPatch,
  actor = "portal"
): Promise<Brand | null> => {
  if (!isConfigured()) throw new Error("Brand Kit Sheet not configured");

  const sheets = getSheets();

  // Find the row for this slug
  const slugRead = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${TAB}!A:A`,
  });
  const rows = slugRead.data.values ?? [];
  let targetRow = -1;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i]?.[0] === slug) {
      targetRow = i + 1; // 1-indexed
      break;
    }
  }
  if (targetRow === -1) return null;

  const now = new Date().toISOString();
  const data: { range: string; values: string[][] }[] = [];

  for (const [field, value] of Object.entries(patch) as [keyof BrandPatch, unknown][]) {
    const col = COLUMN_MAP[field as keyof typeof COLUMN_MAP];
    if (!col) continue;
    data.push({
      range: `${TAB}!${col}${targetRow}`,
      values: [[serializeCell(field, value)]],
    });
  }

  // Always bump updated_at / updated_by
  data.push({
    range: `${TAB}!${COLUMN_MAP.updatedAt}${targetRow}:${COLUMN_MAP.updatedBy}${targetRow}`,
    values: [[now, actor]],
  });

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: { valueInputOption: "RAW", data },
  });

  invalidateBrandsCache();
  return getBrandBySlug(slug);
};
