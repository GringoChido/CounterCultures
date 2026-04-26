/**
 * PDF spec-sheet extraction — drag a manufacturer or designer's spec PDF in,
 * Claude reads the document, returns structured product references, then we
 * match each against the 354k catalog with substring scoring. The user
 * reviews the matches before they commit to a Project List or deal.
 *
 * Cost: a typical 5-10 page spec runs $0.005–$0.02 per extraction on
 * Haiku 4.5 (5-15k input tokens, ~500 output). On-demand only.
 */
import Anthropic from "@anthropic-ai/sdk";
import { searchProducts, type ProductFull } from "./products-full";

const MODEL = "claude-haiku-4-5-20251001";

// Soft cap for the API layer: Anthropic accepts PDFs up to 32MB / 100 pages,
// but we rate-limit to keep one architect's drop from blowing the budget.
export const MAX_PDF_BYTES = 20 * 1024 * 1024; // 20 MB

export interface PdfExtraction {
  brand: string;
  sku: string;
  finish?: string;
  quantity: number;
  sourcePage?: number;
  /** Verbatim line that produced this entry — useful for auditing matches */
  raw?: string;
}

export interface PdfMatch {
  /** What we read from the PDF */
  extracted: PdfExtraction;
  /** Top-ranked catalog candidates */
  candidates: Array<{
    product: ProductFull;
    score: number;
    reason: "sku-exact" | "sku-prefix" | "sku-contains" | "name-fuzzy";
  }>;
  /** Highest-confidence match if one exists */
  best: ProductFull | null;
  confidence: "high" | "medium" | "low" | "none";
}

const SYSTEM_PROMPT = `You extract product specifications from architectural and manufacturer spec PDFs for Counter Cultures, a fixtures dealer in San Miguel de Allende.

Find every distinct product referenced in the document — faucets, sinks, fixtures, hardware. For each, return:
  - brand: the manufacturer name (e.g. "Brizo", "Kohler", "Sun Valley Bronze")
  - sku: the exact model number / SKU as printed (preserve case, hyphens, spaces)
  - finish: the finish code or name if shown (e.g. "PC", "Polished Chrome", "MB")
  - quantity: integer count if specified; default to 1 when no quantity is given
  - sourcePage: 1-indexed page number where you read this
  - raw: the verbatim line of text that contained this entry

Rules:
  - Don't invent SKUs or brands. If a value isn't present, omit it.
  - Don't include accessories/notes mentioned in passing — only items the architect is specifying.
  - Don't dedupe rows that legitimately repeat with different finishes/quantities.
  - Output strict JSON only: {"items": [...]}.`;

export const extractFromPdf = async (
  pdfBase64: string
): Promise<PdfExtraction[]> => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const client = new Anthropic({ apiKey });

  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: pdfBase64,
            },
          },
          {
            type: "text",
            text: "Extract every product reference. Output JSON.",
          },
        ],
      },
    ],
  });

  const text = resp.content[0].type === "text" ? resp.content[0].text.trim() : "";
  const json = text.replace(/^```(?:json)?\s*|\s*```$/g, "");

  let parsed: { items?: unknown };
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error(`Model returned non-JSON: ${text.slice(0, 200)}`);
  }
  if (!Array.isArray(parsed.items)) return [];

  const out: PdfExtraction[] = [];
  for (const item of parsed.items) {
    if (typeof item !== "object" || item === null) continue;
    const r = item as Record<string, unknown>;
    const brand = typeof r.brand === "string" ? r.brand.trim() : "";
    const sku = typeof r.sku === "string" ? r.sku.trim() : "";
    if (!sku) continue; // SKU is the matching key — skip rows without one
    out.push({
      brand,
      sku,
      finish: typeof r.finish === "string" ? r.finish.trim() : undefined,
      quantity: Math.max(1, Math.round(Number(r.quantity) || 1)),
      sourcePage: typeof r.sourcePage === "number" ? r.sourcePage : undefined,
      raw: typeof r.raw === "string" ? r.raw.trim().slice(0, 200) : undefined,
    });
  }
  return out;
};

// ── Catalog matcher ─────────────────────────────────────────────────────

const normSku = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * Match one extracted entry against the 354k catalog. Strategy:
 *   1. Exact match on normalized SKU                → high confidence
 *   2. Brand-scoped SKU prefix / contains           → high/medium
 *   3. Brand-scoped name fuzzy                      → low
 *   4. Global SKU contains (last resort)            → low
 *
 * Returns up to 3 candidates with scores; the best one is hoisted into `best`.
 */
const matchOne = async (e: PdfExtraction): Promise<PdfMatch> => {
  const target = normSku(e.sku);
  if (!target) {
    return { extracted: e, candidates: [], best: null, confidence: "none" };
  }

  // Brand-scoped search first — much smaller pool, more accurate
  const brandPool = e.brand
    ? await searchProducts({ brand: e.brand, q: e.sku, limit: 25 })
    : null;

  const seen = new Map<string, { product: ProductFull; score: number; reason: PdfMatch["candidates"][number]["reason"] }>();

  if (brandPool) {
    for (const p of brandPool.items) {
      const ns = normSku(p.sku);
      let score = 0;
      let reason: PdfMatch["candidates"][number]["reason"] = "name-fuzzy";
      if (ns === target) {
        score = 100;
        reason = "sku-exact";
      } else if (ns.startsWith(target) || target.startsWith(ns)) {
        score = 80;
        reason = "sku-prefix";
      } else if (ns.includes(target) || target.includes(ns)) {
        score = 60;
        reason = "sku-contains";
      } else {
        score = 30;
        reason = "name-fuzzy";
      }
      const existing = seen.get(p.id);
      if (!existing || score > existing.score) {
        seen.set(p.id, { product: p, score, reason });
      }
    }
  }

  // Fallback: global SKU search if brand pool is thin or missing
  if (seen.size < 3) {
    const global = await searchProducts({ q: e.sku, limit: 10 });
    for (const p of global.items) {
      if (seen.has(p.id)) continue;
      const ns = normSku(p.sku);
      let score = 0;
      let reason: PdfMatch["candidates"][number]["reason"] = "name-fuzzy";
      if (ns === target) {
        score = 90; // de-rated vs brand-scoped exact
        reason = "sku-exact";
      } else if (ns.includes(target)) {
        score = 50;
        reason = "sku-contains";
      } else {
        continue;
      }
      seen.set(p.id, { product: p, score, reason });
    }
  }

  const candidates = [...seen.values()].sort((a, b) => b.score - a.score).slice(0, 3);
  const best = candidates[0]?.product ?? null;
  let confidence: PdfMatch["confidence"] = "none";
  if (candidates[0]?.score >= 90) confidence = "high";
  else if (candidates[0]?.score >= 70) confidence = "medium";
  else if (candidates[0]?.score >= 40) confidence = "low";

  return { extracted: e, candidates, best, confidence };
};

export const matchExtractions = async (
  extractions: PdfExtraction[]
): Promise<PdfMatch[]> => {
  // Sequential to keep the catalog cache hot; the inner search is in-memory
  // anyway, so overlap doesn't help much.
  const out: PdfMatch[] = [];
  for (const e of extractions) {
    out.push(await matchOne(e));
  }
  return out;
};

