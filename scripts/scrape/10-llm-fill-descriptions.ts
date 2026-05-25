/**
 * Step 10 — LLM-generate bilingual descriptions for parents without one.
 *
 * For every PARENT product (from product-families.json — singletons too) that
 * lacks a descriptionEs OR descriptionEn after the legacy scrape, ask Claude
 * Haiku to write both: an evocative 60-90 word Spanish marketing description
 * and a precise 60-90 word English technical description, plus 4-6 feature
 * bullets in each language.
 *
 * IMPORTANT: by default, drafts are written to staging/ai-descriptions-draft.json
 * (--stage mode, default ON). The live product-content.json is NEVER touched by
 * this script. Use scripts/scrape/14-merge-copy-review.ts to promote reviewed
 * copy into the live sidecar after human approval via the review xlsx.
 *
 * Usage:
 *   npx tsx scripts/scrape/10-llm-fill-descriptions.ts                    # staged (default)
 *   npx tsx scripts/scrape/10-llm-fill-descriptions.ts --limit 25         # smoke
 *   npx tsx scripts/scrape/10-llm-fill-descriptions.ts --brand Emtek      # single brand
 *   npx tsx scripts/scrape/10-llm-fill-descriptions.ts --no-stage         # DANGEROUS: write to live sidecar (legacy mode)
 */
import * as path from "node:path";
import { promises as fs } from "node:fs";
import { config } from "dotenv";
import Anthropic from "@anthropic-ai/sdk";
import { REPO_ROOT, STAGING, readJson, writeJson, exists, pool } from "./_lib";

config({ path: path.join(REPO_ROOT, ".env.local"), override: false });

const BRAND_ALIAS: Record<string, string> = {
  "Counter / Santiago": "Manriquez",
  "Counter / Gaby- Cobre": "Castro",
  "Counter/Meza": "Familia Meza",
  "gaby": "Castro",
  "Mistoa": "Mistoa",
};

const resolveMakerName = (rawBrand: string): string =>
  BRAND_ALIAS[rawBrand] ?? rawBrand;

const MODEL_MAP: Record<string, string> = {
  haiku: "claude-haiku-4-5-20251001",
  sonnet: "claude-sonnet-4-6",
  opus: "claude-opus-4-6",
};

const arg = (name: string, fallback?: string): string | undefined => {
  const i = process.argv.indexOf(`--${name}`); return i < 0 ? fallback : process.argv[i + 1];
};

interface CsvRow {
  odoo_id: string; sku: string; name: string; brand: string;
  list_price: string; description: string; uom: string;
}

const parseCsv = async (csvPath: string): Promise<CsvRow[]> => {
  const text = await fs.readFile(csvPath, "utf-8");
  const clean = text.replace(/^﻿/, "");
  const out: CsvRow[] = [];
  let header: string[] = []; let field = ""; let row: string[] = []; let inQuotes = false; let i = 0;
  const pushField = () => { row.push(field); field = ""; };
  const pushRow = () => {
    if (!header.length) header = row;
    else if (row.some((c) => c !== "")) {
      const o: Record<string, string> = {};
      for (let k = 0; k < header.length; k++) o[header[k]] = row[k] ?? "";
      out.push(o as unknown as CsvRow);
    }
    row = [];
  };
  while (i < clean.length) {
    const c = clean[i];
    if (inQuotes) {
      if (c === '"') { if (clean[i+1] === '"') { field += '"'; i+=2; continue; } inQuotes = false; i++; continue; }
      field += c; i++; continue;
    }
    if (c === '"') { inQuotes = true; i++; continue; }
    if (c === ",") { pushField(); i++; continue; }
    if (c === "\n") { pushField(); pushRow(); i++; continue; }
    if (c === "\r") { i++; continue; }
    field += c; i++;
  }
  if (field || row.length) { pushField(); pushRow(); }
  return out;
};

const SYSTEM_PROMPT = `You are a senior bilingual product copywriter for Counter Cultures, a luxury bath/kitchen/hardware retailer in San Miguel de Allende, Mexico. You write evocative but precise product descriptions in both Spanish (es-MX, primary) and English (en-US).

Voice rules:
- Confident, specific, sensory. Not flowery, not salesy.
- Reference materials and mechanisms by name when known (cerámica, magnedock, vías de agua, válvula termostática, latón macizo).
- Use the brand's own collection name verbatim (LITZE, Edalyn, Cimarron, etc.).
- Mexican Spanish conventions: use "Tarja" for kitchen sink, "Lavabo" for bathroom sink, "Grifo/Mezcladora" for faucet, "Bañera/Tina" for tub, "Chapas" for door locks, "Jaladeras" for pulls.
- Length is product-type-aware, NOT a fixed number. Small hardware (hooks, pulls/jaladeras, knobs, escutcheons, towel bars, toilet paper holders): 35-50 words — tight and specific, do NOT pad. Fixtures and statement pieces (faucets/mezcladoras, tubs/tinas, sinks/lavabos/tarjas, basins): 60-90 words. Let the product type and available detail guide length; padding small items with filler fights the brand voice.
- Feature bullets: 4-6 each, 6-10 words each.

Hard rules — violations are rejected:
- NEVER invent a product or model name. The words "Counter", "Santiago", and "Gaby" must NEVER appear anywhere in the output.
- Describe the product itself: type + material + finish + mechanism + dimensions when known.
- The maker line may be credited naturally using the provided maker name (e.g. Mistoa, Familia Meza, Castro, Manriquez) but do NOT invent a person, biography, or brand philosophy.
- Do NOT state a specific town or geographic origin unless it is explicitly provided in the input.

Output STRICT JSON, no other text:
{
  "descriptionEs": "string",
  "descriptionEn": "string",
  "featuresEs": ["string", ...],
  "featuresEn": ["string", ...]
}`;

const buildPrompt = (r: CsvRow, makerName: string, brandTagline?: string, brandDescriptionEs?: string): string => {
  const cleaned = r.description.replace(/https?:\/\/\S+/g, "").trim().slice(0, 400);
  return `Maker line: ${makerName}${brandTagline ? `\nBrand tagline (es): ${brandTagline}` : ""}${brandDescriptionEs ? `\nBrand voice (es): ${brandDescriptionEs}` : ""}

Product
  Odoo name (en): ${r.name}
  SKU: ${r.sku}
  Unit: ${r.uom}
  Existing description fragment: ${cleaned || "(none)"}

Write the bilingual content. Return JSON only.`;
};

interface Generated {
  odoo_id: string;
  sku: string;
  brand: string;
  descriptionEs: string;
  descriptionEn: string;
  featuresEs: string[];
  featuresEn: string[];
  source: "ai";
  modelUsed: string;
  generatedAt: string;
}

const callLLM = async (client: Anthropic, model: string, r: CsvRow, makerName: string, brandTag?: string, brandDescEs?: string): Promise<Generated | null> => {
  const userPrompt = buildPrompt(r, makerName, brandTag, brandDescEs);
  const res = await client.messages.create({
    model, max_tokens: 700,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });
  const text = res.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("").trim();
  const m = /\{[\s\S]*\}/.exec(text);
  if (!m) return null;
  try {
    const parsed = JSON.parse(m[0]);
    return {
      odoo_id: r.odoo_id,
      sku: r.sku,
      brand: r.brand,
      descriptionEs: String(parsed.descriptionEs ?? "").trim(),
      descriptionEn: String(parsed.descriptionEn ?? "").trim(),
      featuresEs: Array.isArray(parsed.featuresEs) ? parsed.featuresEs.map(String) : [],
      featuresEn: Array.isArray(parsed.featuresEn) ? parsed.featuresEn.map(String) : [],
      source: "ai",
      modelUsed: model,
      generatedAt: new Date().toISOString(),
    };
  } catch { return null; }
};

const run = async () => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) { console.error("[10] ANTHROPIC_API_KEY missing"); process.exit(1); }
  const client = new Anthropic({ apiKey });

  const modelKey = arg("model", "haiku") ?? "haiku";
  const model = MODEL_MAP[modelKey] ?? MODEL_MAP.haiku;
  const concurrency = Number(arg("concurrency", "6"));
  const limit = Number(arg("limit", "0") || 0);
  const brandFilter = arg("brand", "");
  const staged = !process.argv.includes("--no-stage");

  // Load brand glossary (taglines + voice) for in-context priming
  const brandGlossaryPath = path.join(REPO_ROOT, "scripts", ".gitignored", "spanish-drafts.json");
  const brandGlossary: Record<string, { taglineEs?: string; descriptionEs?: string }> = (await exists(brandGlossaryPath))
    ? await readJson(brandGlossaryPath) : {};

  // Build the work queue: parents (or singletons) lacking ES OR EN description.
  const families = (await exists(path.join(REPO_ROOT, "app", "lib", "product-families.json")))
    ? await readJson<{ parents: Record<string, any>; childToParent: Record<string, string> }>(
        path.join(REPO_ROOT, "app", "lib", "product-families.json"))
    : { parents: {}, childToParent: {} };
  const childIds = new Set(Object.keys(families.childToParent));

  const csv = await parseCsv(path.join(REPO_ROOT, "scripts", "products-odoo.csv"));

  // Existing product-content from prior stages → check what already has descriptionEs.
  const productContent: Record<string, any> = (await exists(path.join(REPO_ROOT, "app", "lib", "product-content.json")))
    ? await readJson(path.join(REPO_ROOT, "app", "lib", "product-content.json")) : {};

  // In staged mode, load existing staging drafts to resume interrupted runs.
  const stagingPath = path.join(STAGING, "ai-descriptions-draft.json");
  const stagingDrafts: Record<string, any> = staged && (await exists(stagingPath))
    ? await readJson(stagingPath) : {};

  const todo = csv.filter((r) => {
    if (childIds.has(r.odoo_id)) return false;
    if (brandFilter && r.brand !== brandFilter) return false;
    // Skip if already staged in this run
    if (staged && stagingDrafts[r.odoo_id]) return false;
    const existing = productContent[r.odoo_id];
    if (existing?.descriptionEs && existing.descriptionEs.length > 50) return false;
    if (!r.sku || r.sku.length < 3) return false;
    if (!r.name || r.name.length < 5) return false;
    return true;
  });

  const subset = limit > 0 ? todo.slice(0, limit) : todo;
  const modeLabel = staged ? "STAGED → staging/ai-descriptions-draft.json" : "LIVE → app/lib/product-content.json";
  console.log(`[10] Generating descriptions for ${subset.length} parents (model=${model}, concurrency=${concurrency})`);
  console.log(`[10]   mode: ${modeLabel}`);
  if (brandFilter) console.log(`[10]   filter: brand="${brandFilter}"`);

  const outPath = staged ? stagingPath : path.join(REPO_ROOT, "app", "lib", "product-content.json");
  const target = staged ? stagingDrafts : productContent;
  let ok = 0, fail = 0;
  const slugFromBrand = (b: string): string => b.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  await pool(subset, concurrency, async (r) => {
    const makerName = resolveMakerName(r.brand);
    const brandSlug = slugFromBrand(r.brand);
    const g = brandGlossary[brandSlug];
    try {
      const gen = await callLLM(client, model, r, makerName, g?.taglineEs, g?.descriptionEs);
      if (!gen) { fail++; return; }

      if (staged) {
        target[r.odoo_id] = {
          odoo_id: gen.odoo_id,
          sku: gen.sku,
          brand: gen.brand,
          descriptionEs: gen.descriptionEs,
          descriptionEn: gen.descriptionEn,
          featuresEs: gen.featuresEs,
          featuresEn: gen.featuresEn,
          descriptionSource: "ai",
          modelUsed: gen.modelUsed,
          generatedAt: gen.generatedAt,
        };
      } else {
        const existing = target[r.odoo_id] ?? {
          legacySlug: "", legacyUrl: "", title: "", features: [], gallery: [],
          variants: [], breadcrumb: [], updatedAt: new Date().toISOString(), matchConfidence: 0,
        };
        existing.descriptionEs = gen.descriptionEs;
        existing.descriptionEn = gen.descriptionEn;
        existing.featuresEs = gen.featuresEs;
        existing.featuresEn = gen.featuresEn;
        existing.descriptionSource = "ai";
        existing.modelUsed = gen.modelUsed;
        existing.updatedAt = new Date().toISOString();
        target[r.odoo_id] = existing;
      }

      ok++;
      if (ok % 10 === 0) {
        console.log(`[10]   …${ok}/${subset.length} (failed=${fail})`);
        await writeJson(outPath, target);
      }
    } catch (e: any) {
      fail++;
      console.error(`[10] FAIL ${r.sku}: ${e?.message?.slice(0, 120) ?? e}`);
    }
  });

  await writeJson(outPath, target);
  console.log(`[10] ✓ generated=${ok} failed=${fail} (total=${subset.length})`);
  console.log(`[10]   → ${outPath}`);
  if (staged) {
    console.log(`[10]   Next: run 13-emit-copy-review-xlsx.ts to create the review spreadsheet`);
  }
};

run().catch((e) => { console.error(e); process.exit(1); });
