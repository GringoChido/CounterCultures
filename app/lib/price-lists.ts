/**
 * Price List Library — parses supplier Excel files from the PRICE LIST Shared Drive
 * and provides a unified interface for reading/syncing price data.
 *
 * Each supplier has a different column layout. Brand-specific parsers normalize
 * every row into a common PriceListRow format.
 *
 * Required env vars:
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL
 *   GOOGLE_PRIVATE_KEY
 *   GOOGLE_PRICE_LIST_DRIVE_ID  – Shared Drive ID for the price list folder
 */

import { google } from "googleapis";
import * as XLSX from "xlsx";

// ── Types ────────────────────────────────────────────────────────────

export interface PriceListRow {
  brand: string;
  sku: string;
  productName: string;
  category: string;
  subCategory: string;
  collection: string;
  finish: string;
  msrp: number | null;
  mapPrice: number | null;
  dealerCost: number | null;
  marginPct: number | null;
  upc: string;
  status: string;
  unit: string;
  priceEffective: string;
  shippingCost: number | null;
  sourceFile: string;
  lastSynced: string;
}

export interface PriceListSummary {
  totalProducts: number;
  brands: { name: string; count: number; avgMsrp: number }[];
  lastSynced: string;
}

// ── Auth ─────────────────────────────────────────────────────────────

const getAuth = () =>
  new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: [
      "https://www.googleapis.com/auth/drive.readonly",
      "https://www.googleapis.com/auth/spreadsheets",
    ],
  });

const getDrive = () => google.drive({ version: "v3", auth: getAuth() });
const getSheets = () => google.sheets({ version: "v4", auth: getAuth() });

const PRICE_LIST_DRIVE_ID = process.env.GOOGLE_PRICE_LIST_DRIVE_ID ?? "";
const MASTER_SHEET_ID = process.env.GOOGLE_MASTER_PRICE_LIST_ID ?? "";

export const isConfigured = () =>
  Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY &&
      PRICE_LIST_DRIVE_ID
  );

// ── Download Excel from Drive ────────────────────────────────────────

async function downloadExcel(fileId: string): Promise<XLSX.WorkBook> {
  const drive = getDrive();
  const res = await drive.files.get(
    { fileId, alt: "media", supportsAllDrives: true },
    { responseType: "arraybuffer" }
  );
  const buffer = Buffer.from(res.data as ArrayBuffer);
  return XLSX.read(buffer, { type: "buffer" });
}

// ── List parseable files in the Price List Drive ─────────────────────

export interface PriceListFile {
  id: string;
  name: string;
  mimeType: string;
  size: string;
  modifiedTime: string;
  isParseable: boolean;
}

export async function listPriceListFiles(): Promise<PriceListFile[]> {
  const drive = getDrive();
  const res = await drive.files.list({
    corpora: "drive",
    driveId: PRICE_LIST_DRIVE_ID,
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
    q: "trashed = false and mimeType != 'application/vnd.google-apps.folder'",
    fields: "files(id, name, mimeType, size, modifiedTime)",
    pageSize: 100,
  });

  return (res.data.files ?? []).map((f) => {
    const mime = f.mimeType ?? "";
    const isParseable =
      mime.includes("spreadsheet") ||
      mime.includes("excel") ||
      mime ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      mime === "application/vnd.ms-excel" ||
      (f.name ?? "").endsWith(".xlsx") ||
      (f.name ?? "").endsWith(".xls");

    return {
      id: f.id ?? "",
      name: f.name ?? "",
      mimeType: mime,
      size: f.size ?? "0",
      modifiedTime: f.modifiedTime ?? "",
      isParseable,
    };
  });
}

// ── Brand-Specific Parsers ───────────────────────────────────────────

function parseNum(val: unknown): number | null {
  if (val == null || val === "") return null;
  const n = typeof val === "number" ? val : parseFloat(String(val).replace(/[$,]/g, ""));
  return isNaN(n) ? null : n;
}

function calcMargin(msrp: number | null, cost: number | null): number | null {
  if (!msrp || !cost || msrp === 0) return null;
  return Math.round(((msrp - cost) / msrp) * 10000) / 100;
}

function now() {
  return new Date().toISOString();
}

/** Ruvati — columns: SKU, Collection, Category, MSRP, MAP Price, Dealer Cost, Shipping Cost */
function parseRuvati(
  wb: XLSX.WorkBook,
  fileName: string
): PriceListRow[] {
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  const timestamp = now();

  return rows
    .filter((r) => r["SKU"] || r["sku"] || r["Item"] || r["Item#"])
    .map((r) => {
      const sku = String(r["SKU"] ?? r["sku"] ?? r["Item"] ?? r["Item#"] ?? "").trim();
      const msrp = parseNum(r["MSRP"] ?? r["Retail"] ?? r["List Price"]);
      const map = parseNum(r["MAP Price"] ?? r["MAP"] ?? r["UMAP"]);
      const cost = parseNum(r["Dealer Cost"] ?? r["Cost"] ?? r["Net Price"]);
      return {
        brand: "Ruvati",
        sku,
        productName: String(r["Product Name"] ?? r["Description"] ?? r["Collection"] ?? "").trim(),
        category: String(r["Category"] ?? "").trim(),
        subCategory: "",
        collection: String(r["Collection"] ?? "").trim(),
        finish: String(r["Finish"] ?? "").trim(),
        msrp,
        mapPrice: map,
        dealerCost: cost,
        marginPct: calcMargin(msrp, cost),
        upc: String(r["UPC"] ?? "").trim(),
        status: "Active",
        unit: "EA",
        priceEffective: "",
        shippingCost: parseNum(r["Shipping Cost"] ?? r["Freight"]),
        sourceFile: fileName,
        lastSynced: timestamp,
      };
    })
    .filter((r) => r.sku);
}

/** Deltana — columns: Item Code, ItemCodeDesc, SuggestedRetailPrice, SalesUnitOfMeasure, UDF_UPC_CODE */
function parseDeltana(
  wb: XLSX.WorkBook,
  fileName: string
): PriceListRow[] {
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  const timestamp = now();

  return rows
    .filter((r) => r["Item Code"] ?? r["ItemCode"])
    .map((r) => {
      const msrp = parseNum(r["SuggestedRetailPrice"] ?? r["Suggested Retail Price"] ?? r["MSRP"]);
      return {
        brand: "Deltana",
        sku: String(r["Item Code"] ?? r["ItemCode"] ?? "").trim(),
        productName: String(r["ItemCodeDesc"] ?? r["Description"] ?? "").trim(),
        category: String(r["Category"] ?? "").trim(),
        subCategory: "",
        collection: "",
        finish: String(r["Finish"] ?? "").trim(),
        msrp,
        mapPrice: null,
        dealerCost: null,
        marginPct: null,
        upc: String(r["UDF_UPC_CODE"] ?? r["UPC"] ?? "").trim(),
        status: "Active",
        unit: String(r["SalesUnitOfMeasure"] ?? r["UOM"] ?? "EA").trim(),
        priceEffective: "",
        shippingCost: null,
        sourceFile: fileName,
        lastSynced: timestamp,
      };
    })
    .filter((r) => r.sku);
}

/** BLANCO — columns: Model #, Index Description/English, 2023/2024 List Price, UPC, Status, Price Effective, UMAP, Category */
function parseBlanco(
  wb: XLSX.WorkBook,
  fileName: string
): PriceListRow[] {
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  const timestamp = now();

  return rows
    .filter((r) => r["Model #"] ?? r["Model"] ?? r["SKU"])
    .map((r) => {
      const msrp = parseNum(
        r["2023/2024 List Price"] ??
          r["List Price"] ??
          r["MSRP"] ??
          r["2024 List Price"] ??
          r["2025 List Price"]
      );
      const map = parseNum(r["UMAP"] ?? r["MAP"]);
      return {
        brand: "BLANCO",
        sku: String(r["Model #"] ?? r["Model"] ?? r["SKU"] ?? "").trim(),
        productName: String(
          r["Index Description/English"] ??
            r["Description"] ??
            r["English Description"] ??
            ""
        ).trim(),
        category: String(r["Category"] ?? "").trim(),
        subCategory: "",
        collection: "",
        finish: String(r["Finish"] ?? r["Color"] ?? "").trim(),
        msrp,
        mapPrice: map,
        dealerCost: null,
        marginPct: null,
        upc: String(r["UPC"] ?? "").trim(),
        status: String(r["Status"] ?? "Active").trim(),
        unit: "EA",
        priceEffective: String(r["Price Effective"] ?? "").trim(),
        shippingCost: null,
        sourceFile: fileName,
        lastSynced: timestamp,
      };
    })
    .filter((r) => r.sku);
}

/** California Faucets — generic parser since we haven't fully mapped columns yet */
function parseCaliforniaFaucets(
  wb: XLSX.WorkBook,
  fileName: string
): PriceListRow[] {
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  const timestamp = now();

  return rows
    .filter(
      (r) =>
        r["SKU"] ??
        r["Model"] ??
        r["Item"] ??
        r["Item Number"] ??
        r["Part Number"] ??
        r["Product Number"]
    )
    .map((r) => {
      const sku = String(
        r["SKU"] ??
          r["Model"] ??
          r["Item"] ??
          r["Item Number"] ??
          r["Part Number"] ??
          r["Product Number"] ??
          ""
      ).trim();
      const msrp = parseNum(
        r["MSRP"] ?? r["List Price"] ?? r["Retail"] ?? r["Price"]
      );
      const map = parseNum(r["MAP"] ?? r["UMAP"] ?? r["MAP Price"]);
      const cost = parseNum(
        r["Dealer Cost"] ?? r["Cost"] ?? r["Net"] ?? r["Net Price"]
      );
      return {
        brand: "California Faucets",
        sku,
        productName: String(
          r["Description"] ?? r["Product Name"] ?? r["Name"] ?? ""
        ).trim(),
        category: String(r["Category"] ?? r["Type"] ?? "").trim(),
        subCategory: String(r["Sub-Category"] ?? r["SubCategory"] ?? "").trim(),
        collection: String(r["Collection"] ?? r["Series"] ?? "").trim(),
        finish: String(r["Finish"] ?? r["Color"] ?? "").trim(),
        msrp,
        mapPrice: map,
        dealerCost: cost,
        marginPct: calcMargin(msrp, cost),
        upc: String(r["UPC"] ?? "").trim(),
        status: String(r["Status"] ?? "Active").trim(),
        unit: "EA",
        priceEffective: "",
        shippingCost: parseNum(r["Shipping"] ?? r["Freight"]),
        sourceFile: fileName,
        lastSynced: timestamp,
      };
    })
    .filter((r) => r.sku);
}

/** Generic fallback parser — tries common column names */
function parseGeneric(
  wb: XLSX.WorkBook,
  fileName: string,
  brand: string
): PriceListRow[] {
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  const timestamp = now();

  return rows
    .filter(
      (r) =>
        r["SKU"] ??
        r["Item"] ??
        r["Model"] ??
        r["Item Code"] ??
        r["Part Number"] ??
        r["Product Number"] ??
        r["Item#"]
    )
    .map((r) => {
      const sku = String(
        r["SKU"] ?? r["Item"] ?? r["Model"] ?? r["Item Code"] ?? r["Part Number"] ?? r["Product Number"] ?? r["Item#"] ?? ""
      ).trim();
      const msrp = parseNum(r["MSRP"] ?? r["List Price"] ?? r["Retail"] ?? r["Price"] ?? r["SuggestedRetailPrice"]);
      const cost = parseNum(r["Dealer Cost"] ?? r["Cost"] ?? r["Net Price"] ?? r["Net"]);
      return {
        brand,
        sku,
        productName: String(r["Description"] ?? r["Product Name"] ?? r["Name"] ?? r["ItemCodeDesc"] ?? "").trim(),
        category: String(r["Category"] ?? "").trim(),
        subCategory: "",
        collection: String(r["Collection"] ?? r["Series"] ?? "").trim(),
        finish: String(r["Finish"] ?? r["Color"] ?? "").trim(),
        msrp,
        mapPrice: parseNum(r["MAP"] ?? r["UMAP"] ?? r["MAP Price"]),
        dealerCost: cost,
        marginPct: calcMargin(msrp, cost),
        upc: String(r["UPC"] ?? r["UDF_UPC_CODE"] ?? "").trim(),
        status: String(r["Status"] ?? "Active").trim(),
        unit: String(r["Unit"] ?? r["UOM"] ?? "EA").trim(),
        priceEffective: "",
        shippingCost: parseNum(r["Shipping Cost"] ?? r["Freight"]),
        sourceFile: fileName,
        lastSynced: timestamp,
      };
    })
    .filter((r) => r.sku);
}

// ── Brand Routing ────────────────────────────────────────────────────

function detectBrand(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.includes("ruvati")) return "Ruvati";
  if (lower.includes("deltana")) return "Deltana";
  if (lower.includes("blanco")) return "BLANCO";
  if (lower.includes("california faucet") || lower.includes("cal faucet"))
    return "California Faucets";
  if (lower.includes("emtek")) return "Emtek";
  if (lower.includes("yale")) return "Yale";
  if (lower.includes("schaub")) return "Emtek/Schaub";
  if (lower.includes("rayito")) return "Rayito";
  if (lower.includes("bjo")) return "BJO";
  if (lower.includes("mistoa")) return "Mistoa";
  // Fallback — use filename without extension
  return fileName.replace(/\.(xlsx|xls|csv)$/i, "").trim();
}

function parseWorkbook(
  wb: XLSX.WorkBook,
  fileName: string
): PriceListRow[] {
  const brand = detectBrand(fileName);
  switch (brand) {
    case "Ruvati":
      return parseRuvati(wb, fileName);
    case "Deltana":
      return parseDeltana(wb, fileName);
    case "BLANCO":
      return parseBlanco(wb, fileName);
    case "California Faucets":
      return parseCaliforniaFaucets(wb, fileName);
    default:
      return parseGeneric(wb, fileName, brand);
  }
}

// ── Main Sync Function ───────────────────────────────────────────────

export interface SyncResult {
  brand: string;
  fileName: string;
  rowsParsed: number;
  status: "success" | "error" | "skipped";
  error?: string;
}

/**
 * Sync all parseable Excel files from the Price List Drive
 * into the Master Price List Google Sheet.
 */
export async function syncPriceLists(): Promise<{
  results: SyncResult[];
  totalRows: number;
}> {
  const files = await listPriceListFiles();
  const parseableFiles = files.filter((f) => f.isParseable);

  const allRows: PriceListRow[] = [];
  const results: SyncResult[] = [];

  for (const file of parseableFiles) {
    try {
      const wb = await downloadExcel(file.id);
      const rows = parseWorkbook(wb, file.name);
      allRows.push(...rows);
      results.push({
        brand: detectBrand(file.name),
        fileName: file.name,
        rowsParsed: rows.length,
        status: "success",
      });
    } catch (err) {
      results.push({
        brand: detectBrand(file.name),
        fileName: file.name,
        rowsParsed: 0,
        status: "error",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Write to Master Price List sheet if configured
  if (MASTER_SHEET_ID && allRows.length > 0) {
    await writeMasterSheet(allRows);
  }

  return { results, totalRows: allRows.length };
}

/**
 * Read current price list data from the Master Price List Google Sheet
 */
export async function readMasterPriceList(): Promise<PriceListRow[]> {
  if (!MASTER_SHEET_ID) return [];
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: MASTER_SHEET_ID,
    range: "Master_Price_List!A:R",
  });

  const rows = res.data.values;
  if (!rows || rows.length < 2) return [];

  const headers = rows[0];
  return rows.slice(1).map((row) => ({
    brand: row[headers.indexOf("Brand")] ?? "",
    sku: row[headers.indexOf("SKU")] ?? "",
    productName: row[headers.indexOf("Product Name")] ?? "",
    category: row[headers.indexOf("Category")] ?? "",
    subCategory: row[headers.indexOf("Sub-Category")] ?? "",
    collection: row[headers.indexOf("Collection")] ?? "",
    finish: row[headers.indexOf("Finish")] ?? "",
    msrp: parseNum(row[headers.indexOf("MSRP (USD)")]),
    mapPrice: parseNum(row[headers.indexOf("MAP Price (USD)")]),
    dealerCost: parseNum(row[headers.indexOf("Dealer Cost (USD)")]),
    marginPct: parseNum(row[headers.indexOf("Margin %")]),
    upc: row[headers.indexOf("UPC")] ?? "",
    status: row[headers.indexOf("Status")] ?? "",
    unit: row[headers.indexOf("Unit")] ?? "",
    priceEffective: row[headers.indexOf("Price Effective")] ?? "",
    shippingCost: parseNum(row[headers.indexOf("Shipping Cost")]),
    sourceFile: row[headers.indexOf("Source File")] ?? "",
    lastSynced: row[headers.indexOf("Last Synced")] ?? "",
  }));
}

/**
 * Get summary stats from in-memory rows
 */
export function summarizePriceList(rows: PriceListRow[]): PriceListSummary {
  const brandMap = new Map<string, { count: number; totalMsrp: number }>();

  for (const row of rows) {
    const entry = brandMap.get(row.brand) ?? { count: 0, totalMsrp: 0 };
    entry.count++;
    if (row.msrp) entry.totalMsrp += row.msrp;
    brandMap.set(row.brand, entry);
  }

  const brands = Array.from(brandMap.entries()).map(([name, data]) => ({
    name,
    count: data.count,
    avgMsrp: data.count > 0 ? Math.round((data.totalMsrp / data.count) * 100) / 100 : 0,
  }));

  return {
    totalProducts: rows.length,
    brands: brands.sort((a, b) => b.count - a.count),
    lastSynced: rows[0]?.lastSynced ?? "",
  };
}

// ── Write to Google Sheet ────────────────────────────────────────────

async function writeMasterSheet(rows: PriceListRow[]): Promise<void> {
  const sheets = getSheets();
  const HEADERS = [
    "Brand",
    "SKU",
    "Product Name",
    "Category",
    "Sub-Category",
    "Collection",
    "Finish",
    "MSRP (USD)",
    "MAP Price (USD)",
    "Dealer Cost (USD)",
    "Margin %",
    "UPC",
    "Status",
    "Unit",
    "Price Effective",
    "Shipping Cost",
    "Source File",
    "Last Synced",
  ];

  const values = [
    HEADERS,
    ...rows.map((r) => [
      r.brand,
      r.sku,
      r.productName,
      r.category,
      r.subCategory,
      r.collection,
      r.finish,
      r.msrp ?? "",
      r.mapPrice ?? "",
      r.dealerCost ?? "",
      r.marginPct ? `${r.marginPct}%` : "",
      r.upc,
      r.status,
      r.unit,
      r.priceEffective,
      r.shippingCost ?? "",
      r.sourceFile,
      r.lastSynced,
    ]),
  ];

  // Clear existing data and write fresh
  await sheets.spreadsheets.values.clear({
    spreadsheetId: MASTER_SHEET_ID,
    range: "Master_Price_List!A:R",
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: MASTER_SHEET_ID,
    range: "Master_Price_List!A1",
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });

  // Update sync log
  const syncLogEntry = [
    [new Date().toISOString(), `${rows.length} rows synced`, "Success"],
  ];
  await sheets.spreadsheets.values.append({
    spreadsheetId: MASTER_SHEET_ID,
    range: "Sync_Log!A:C",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: syncLogEntry },
  });
}
