/**
 * Stage 2 — LLM-assisted slug ↔ Odoo SKU matching.
 *
 * The Jaccard matcher in step 05 reaches ~20% high confidence because the
 * legacy site is in Spanish while Odoo is in English technical SKU names.
 * This step takes every low-confidence row, packages a short prompt with the
 * top 5 candidate SKUs, and asks Claude Haiku to pick the right one (or
 * return "none" if no candidate fits).
 *
 * Cost: ~$0.50 across 500 rows at Haiku rates (May 2026).
 * Wall: ~5 min at concurrency 10.
 *
 * Output:
 *   staging/cc-mx/match-llm.json   — { slug, odoo_id, sku, confidence, reason }
 *   staging/cc-mx/match-map.json   — UPDATED in place with LLM picks
 *
 * Usage:
 *   npx tsx scripts/scrape/05b-llm-match.ts
 *   npx tsx scripts/scrape/05b-llm-match.ts --threshold 0.45  # only re-do below threshold
 *   npx tsx scripts/scrape/05b-llm-match.ts --limit 25         # smoke test
 *   npx tsx scripts/scrape/05b-llm-match.ts --concurrency 8    # default 6
 *   npx tsx scripts/scrape/05b-llm-match.ts --model haiku|sonnet
 */
import * as path from "node:path";
import { promises as fs } from "node:fs";
import { config } from "dotenv";
import Anthropic from "@anthropic-ai/sdk";
import { REPO_ROOT, STAGING, readJson, writeJson, exists, pool } from "./_lib";
import type { ScrapedProduct } from "./02-cc-mx-products";

config({ path: path.join(REPO_ROOT, ".env.local") });

// Load Odoo CSV → map of odoo_id → { name, description, sku, brand } so the
// LLM prompt can see WHAT each candidate actually is rather than just an ID.
const parseCsv = async (csvPath: string): Promise<Map<string, { name: string; description: string; sku: string; brand: string }>> => {
  const text = await fs.readFile(csvPath, "utf-8");
  const clean = text.replace(/^﻿/, "");
  const out = new Map<string, { name: string; description: string; sku: string; brand: string }>();
  let header: string[] = []; let field = ""; let row: string[] = []; let inQuotes = false; let i = 0;
  const pushField = () => { row.push(field); field = ""; };
  const pushRow = () => {
    if (!header.length) header = row;
    else if (row.some((c) => c !== "")) {
      const o: Record<string, string> = {};
      for (let k = 0; k < header.length; k++) o[header[k]] = row[k] ?? "";
      if (o.odoo_id) out.set(o.odoo_id, {
        name: o.name ?? "",
        description: o.description ?? "",
        sku: o.sku ?? "",
        brand: o.brand ?? "",
      });
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

interface Match {
  slug: string;
  title: string;
  odoo_id: string | null;
  sku: string | null;
  brand: string | null;
  confidence: number;
  alts: Array<{ odoo_id: string; sku: string; brand: string; confidence: number }>;
  flags: string[];
}

interface LLMPick {
  slug: string;
  odoo_id: string | null;
  sku: string | null;
  confidence: number;
  reason: string;
  modelUsed: string;
}

const MODEL_MAP: Record<string, string> = {
  haiku: "claude-haiku-4-5-20251001",
  sonnet: "claude-sonnet-4-6",
  opus: "claude-opus-4-6",
};

const arg = (name: string, fallback?: string): string | undefined => {
  const i = process.argv.indexOf(`--${name}`); return i < 0 ? fallback : process.argv[i + 1];
};

const SYSTEM_PROMPT = `You match Spanish-language product pages from a Squarespace storefront to English SKUs in an Odoo catalog. Both describe the same physical bathroom, kitchen, and architectural hardware products — sinks, faucets, toilets, levers, pulls, etc.

You receive:
  - A scraped Spanish title + feature bullets + breadcrumb
  - 5 Odoo candidates (SKU + English name + brand) ranked by a fuzzy-token matcher

Pick the ONE candidate that describes the same product, or "none" if no candidate fits.

Decision rules:
1. Brand must match exactly (Brizo title → Brizo candidate, not Delta).
2. Product TYPE must match (a Spanish title that says "Mezcladora para cocina" must map to a kitchen faucet/mixer SKU, not a bath faucet).
3. Collection / series name in the title must appear in the candidate name (LITZE → LITZE, Edalyn → Edalyn). This is the strongest signal.
4. Variants (finish, handing, size) often won't match across systems — that's fine; pick the candidate that matches the base product, even if the finish differs.
5. If multiple candidates match the same base product (variants of each other), pick the one with the shortest SKU (most likely the base / parent template).
6. If none truly match, return "none". Don't force a match.

Output strict JSON ONLY, no other text:
{"odoo_id":"<id_or_none>","confidence":0.0-1.0,"reason":"<one short sentence>"}`;

const buildPrompt = (
  match: Match,
  scraped: ScrapedProduct,
  odooMap: Map<string, { name: string; description: string; sku: string; brand: string }>
): string => {
  const candidates = match.alts.slice(0, 4);
  const all = [
    { odoo_id: match.odoo_id ?? "", sku: match.sku ?? "", brand: match.brand ?? "" },
    ...candidates,
  ].filter((c) => c.odoo_id);

  const candidatesText = all
    .map((c, i) => {
      const o = odooMap.get(c.odoo_id);
      const name = o?.name ?? "(name missing)";
      const desc = (o?.description ?? "").slice(0, 150);
      return `  [${i + 1}] id=${c.odoo_id} | brand="${c.brand}" | sku="${c.sku}"\n      name: ${name}${desc ? `\n      desc: ${desc}` : ""}`;
    })
    .join("\n");

  return `Scraped product (Spanish):
  title: ${scraped.title}
  breadcrumb: ${scraped.breadcrumb.join(" › ") || "(none)"}
  description: ${scraped.description.slice(0, 400)}
  features:
${scraped.features.slice(0, 6).map((f) => `    - ${f}`).join("\n") || "    (none)"}

Odoo candidates:
${candidatesText}

Return JSON only.`;
};

const callLLM = async (
  client: Anthropic,
  model: string,
  scraped: ScrapedProduct,
  match: Match,
  odooMap: Map<string, { name: string; description: string; sku: string; brand: string }>
): Promise<LLMPick> => {
  const userPrompt = buildPrompt(match, scraped, odooMap);
  const res = await client.messages.create({
    model,
    max_tokens: 200,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });
  const text = res.content
    .filter((b) => b.type === "text")
    .map((b: any) => b.text)
    .join("")
    .trim();

  // Extract JSON (Claude usually returns clean JSON with the strict prompt, but tolerate stray text).
  const jsonMatch = /\{[\s\S]*\}/.exec(text);
  if (!jsonMatch) {
    return { slug: match.slug, odoo_id: null, sku: null, confidence: 0, reason: `LLM returned non-JSON: ${text.slice(0, 100)}`, modelUsed: model };
  }
  let parsed: any;
  try { parsed = JSON.parse(jsonMatch[0]); }
  catch { return { slug: match.slug, odoo_id: null, sku: null, confidence: 0, reason: `Parse error`, modelUsed: model }; }

  const odooId: string | null = parsed.odoo_id && parsed.odoo_id !== "none" ? String(parsed.odoo_id) : null;
  // Find the corresponding SKU from the candidate list
  let sku: string | null = null;
  if (odooId) {
    const all = [{ odoo_id: match.odoo_id, sku: match.sku }, ...match.alts.map((a) => ({ odoo_id: a.odoo_id, sku: a.sku }))];
    sku = all.find((c) => c.odoo_id === odooId)?.sku ?? null;
  }
  return {
    slug: match.slug,
    odoo_id: odooId,
    sku,
    confidence: Number(parsed.confidence) || 0,
    reason: String(parsed.reason ?? "").slice(0, 200),
    modelUsed: model,
  };
};

const run = async () => {
  const threshold = Number(arg("threshold", "0.45"));
  const concurrency = Number(arg("concurrency", "6"));
  const limit = Number(arg("limit", "0") || 0);
  const modelKey = arg("model", "haiku") ?? "haiku";
  const model = MODEL_MAP[modelKey] ?? MODEL_MAP.haiku;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[05b] ANTHROPIC_API_KEY not set. Add it to .env.local.");
    process.exit(1);
  }
  const client = new Anthropic({ apiKey });

  // Load Odoo CSV once → enriches the prompt with each candidate's English NAME
  // and short description so the LLM can do real semantic comparison instead
  // of guessing from SKU codes alone.
  const odooMap = await parseCsv(path.join(REPO_ROOT, "scripts", "products-odoo.csv"));
  console.log(`[05b] Loaded ${odooMap.size} Odoo names for candidate enrichment.`);

  const matchPath = path.join(STAGING, "cc-mx", "match-map.json");
  const matches = await readJson<Match[]>(matchPath);
  const productsDir = path.join(STAGING, "cc-mx", "products");

  // Target: rows below threshold that have at least ONE candidate.
  const targets = matches.filter((m) => m.confidence < threshold && (m.odoo_id || m.alts.length));
  const subset = limit > 0 ? targets.slice(0, limit) : targets;
  console.log(`[05b] LLM matching ${subset.length} rows (model=${model}, concurrency=${concurrency}, threshold=${threshold})`);

  const results: LLMPick[] = [];
  let done = 0;
  let upgraded = 0;
  let confirmedNone = 0;
  let unchanged = 0;

  await pool(subset, concurrency, async (m) => {
    const scrapedFile = path.join(productsDir, `${m.slug}.json`);
    if (!(await exists(scrapedFile))) {
      results.push({ slug: m.slug, odoo_id: null, sku: null, confidence: 0, reason: "no scraped file", modelUsed: model });
      return;
    }
    const sc = await readJson<ScrapedProduct>(scrapedFile);
    try {
      const pick = await callLLM(client, model, sc, m, odooMap);
      results.push(pick);
      done++;

      // Merge into match-map.json
      if (pick.odoo_id && pick.confidence >= 0.6) {
        m.odoo_id = pick.odoo_id;
        m.sku = pick.sku;
        m.confidence = Math.max(m.confidence, pick.confidence);
        m.flags = [...new Set([...m.flags, "llm-confirmed"])];
        upgraded++;
      } else if (!pick.odoo_id && pick.confidence >= 0.6) {
        m.odoo_id = null;
        m.confidence = 0;
        m.flags = [...new Set([...m.flags, "llm-none"])];
        confirmedNone++;
      } else {
        m.flags = [...new Set([...m.flags, "llm-uncertain"])];
        unchanged++;
      }

      if (done % 25 === 0) {
        console.log(`[05b]   …${done}/${subset.length} upgraded=${upgraded} none=${confirmedNone} unchanged=${unchanged}`);
        // Checkpoint: flush match-map so a timeout / interrupt doesn't lose work.
        await writeJson(matchPath, matches);
      }
    } catch (e) {
      results.push({ slug: m.slug, odoo_id: null, sku: null, confidence: 0, reason: e instanceof Error ? e.message : String(e), modelUsed: model });
    }
  });

  await writeJson(path.join(STAGING, "cc-mx", "match-llm.json"), results);
  await writeJson(matchPath, matches);
  const finalHighConf = matches.filter((m) => m.confidence >= 0.45).length;
  console.log(`[05b] ✓ upgraded=${upgraded} confirmedNone=${confirmedNone} unchanged=${unchanged}`);
  console.log(`[05b]   match-map.json now has ${finalHighConf} / ${matches.length} high-confidence matches.`);
};

run().catch((e) => { console.error(e); process.exit(1); });
