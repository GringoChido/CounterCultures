/**
 * AI-generated product descriptions with a Roger-review gate.
 *
 *   getDescription(productId)    → DescriptionRow | null  (any status)
 *   getApprovedBulk(productIds)  → Map<id, ApprovedDesc>  (status="approved")
 *   generateDescription(product) → writes a pending row, returns descriptions
 *
 * Storage: `Product_Descriptions` tab on the main CRM sheet, auto-created on
 * first write so Roger doesn't have to bootstrap. Status defaults to "pending"
 * — Roger flips it to "approved" by editing the sheet directly. Public
 * surfaces (catalog drawer, brand-category pages) only render approved rows.
 *
 * Cost control: Haiku 4.5 generates ~150 tokens per description × 2 locales.
 * One product = ~$0.001. Generation is on-demand, not batch — only products
 * Roger actually opens get a description, which keeps the bill bounded.
 */
import Anthropic from "@anthropic-ai/sdk";
import { google } from "googleapis";
import {
  readSheet,
  appendRow,
  updateRow,
  findRowIndex,
} from "./dashboard-sheets";
import type { ProductFull } from "./products-full";
import { parseModelJson } from "./parse-model-json";

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID ?? "";
const TAB = "Product_Descriptions" as const;
const PROMPT_VERSION = "v1";
const MODEL = "claude-haiku-4-5-20251001";
const TTL_MS = 5 * 60 * 1000;

export type DescriptionStatus = "pending" | "approved" | "rejected";

interface DescriptionRecord {
  [key: string]: string;
  product_odoo_id: string;
  sku: string;
  brand: string;
  name: string;
  description_en: string;
  description_es: string;
  status: string;
  generated_at: string;
  approved_at: string;
  approved_by: string;
  model: string;
  prompt_version: string;
}

const COLS: (keyof DescriptionRecord)[] = [
  "product_odoo_id",
  "sku",
  "brand",
  "name",
  "description_en",
  "description_es",
  "status",
  "generated_at",
  "approved_at",
  "approved_by",
  "model",
  "prompt_version",
];

export interface DescriptionRow {
  productOdooId: string;
  sku: string;
  brand: string;
  name: string;
  descriptionEn: string;
  descriptionEs: string;
  status: DescriptionStatus;
  generatedAt: string;
  approvedAt: string;
  approvedBy: string;
  model: string;
  promptVersion: string;
}

export interface ApprovedDesc {
  descriptionEn: string;
  descriptionEs: string;
}

const toRow = (r: DescriptionRecord): DescriptionRow => ({
  productOdooId: r.product_odoo_id,
  sku: r.sku,
  brand: r.brand,
  name: r.name,
  descriptionEn: r.description_en,
  descriptionEs: r.description_es,
  status: (r.status as DescriptionStatus) || "pending",
  generatedAt: r.generated_at,
  approvedAt: r.approved_at,
  approvedBy: r.approved_by,
  model: r.model,
  promptVersion: r.prompt_version,
});

// ── Sheet bootstrap ─────────────────────────────────────────────────────

const getSheetsClient = () =>
  google.sheets({
    version: "v4",
    auth: new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    }),
  });

let bootstrapped = false;

const ensureTab = async (): Promise<void> => {
  if (bootstrapped) return;
  const sheets = getSheetsClient();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const exists = meta.data.sheets?.some(
    (s) => s.properties?.title === TAB
  );
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          { addSheet: { properties: { title: TAB } } },
        ],
      },
    });
    // Write header row
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${TAB}!A1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [COLS as string[]] },
    });
  }
  bootstrapped = true;
};

// ── Read paths (cached, 5-min TTL) ──────────────────────────────────────

let cache: { at: number; rows: DescriptionRow[] } | null = null;

const loadAll = async (): Promise<DescriptionRow[]> => {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.rows;
  try {
    const all = await readSheet<DescriptionRecord>(TAB);
    const rows = all.map(toRow);
    cache = { at: Date.now(), rows };
    return rows;
  } catch {
    // Tab missing or empty — return empty, will auto-create on first write
    cache = { at: Date.now(), rows: [] };
    return [];
  }
};

const invalidate = () => {
  cache = null;
};

export const getDescription = async (
  productId: string
): Promise<DescriptionRow | null> => {
  const rows = await loadAll();
  return rows.find((r) => r.productOdooId === productId) ?? null;
};

export const getApprovedBulk = async (
  productIds: string[]
): Promise<Map<string, ApprovedDesc>> => {
  const rows = await loadAll();
  const wanted = new Set(productIds);
  const out = new Map<string, ApprovedDesc>();
  for (const r of rows) {
    if (r.status !== "approved") continue;
    if (!wanted.has(r.productOdooId)) continue;
    out.set(r.productOdooId, {
      descriptionEn: r.descriptionEn,
      descriptionEs: r.descriptionEs,
    });
  }
  return out;
};

// ── Generation ──────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You write concise, premium product descriptions for Counter Cultures, an authorized dealer of high-end fixtures and hardware in San Miguel de Allende, Mexico.

Voice rules:
- Editorial, specific, materially grounded. Reference materials, finishes, mechanical details.
- 2 sentences, 35-55 words total per description.
- No marketing fluff: no "stunning", "beautiful", "perfect", "exquisite".
- No fabricated specifications: don't invent dimensions, certifications, or features not implied by the SKU/name.
- Lead with what the piece IS, then a single line on what makes it specifiable.
- Spanish translation must match tone, not be a literal translation. Use Mexican Spanish conventions.

Output strict JSON: {"description_en": "...", "description_es": "..."}`;

export interface GenerateInput {
  product: ProductFull;
  /** Optional override — used by tests or future locale extensions */
  systemPrompt?: string;
}

export interface GenerateResult {
  descriptionEn: string;
  descriptionEs: string;
  status: DescriptionStatus;
  model: string;
  promptVersion: string;
}

export const generateDescription = async ({
  product,
  systemPrompt = SYSTEM_PROMPT,
}: GenerateInput): Promise<GenerateResult> => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const client = new Anthropic({ apiKey });
  const userMsg = `Brand: ${product.brand}
SKU: ${product.sku}
Name: ${product.name || product.sku}
Category: ${product.category}

Write descriptions for this product following the rules. Output strict JSON only.`;

  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 400,
    system: systemPrompt,
    messages: [{ role: "user", content: userMsg }],
  });

  const text = resp.content[0].type === "text" ? resp.content[0].text : "";
  const parsed = parseModelJson<{
    description_en?: string;
    description_es?: string;
  }>(text);
  const descriptionEn = (parsed.description_en ?? "").trim();
  const descriptionEs = (parsed.description_es ?? "").trim();
  if (!descriptionEn || !descriptionEs) {
    throw new Error("Model returned empty descriptions");
  }

  // Persist as pending — Roger flips to "approved" in the sheet to gate.
  await ensureTab();
  const now = new Date().toISOString();
  const existingIdx = await findRowIndex(TAB, "product_odoo_id", product.id);
  const record: DescriptionRecord = {
    product_odoo_id: product.id,
    sku: product.sku,
    brand: product.brand,
    name: product.name,
    description_en: descriptionEn,
    description_es: descriptionEs,
    status: "pending",
    generated_at: now,
    approved_at: "",
    approved_by: "",
    model: MODEL,
    prompt_version: PROMPT_VERSION,
  };
  const values = COLS.map((c) => record[c] ?? "");
  if (existingIdx === null) {
    await appendRow(TAB, values);
  } else {
    await updateRow(TAB, existingIdx, values);
  }
  invalidate();

  return {
    descriptionEn,
    descriptionEs,
    status: "pending",
    model: MODEL,
    promptVersion: PROMPT_VERSION,
  };
};
