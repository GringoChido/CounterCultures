/**
 * Stage 4b — Merge per-brand partner scrape outputs into product-content.json.
 *
 * Reads everything under staging/partner/{brand}/{odoo_id}.json and merges into
 * app/lib/product-content.json. Existing fields are NEVER overwritten unless
 * the partner-scraped field is non-empty and the existing field is empty.
 *
 * Specifically:
 *   - descriptionEn: filled only if currently empty
 *   - features: filled if currently empty AND scraped features have ≥3 items
 *   - images: appended to gallery if not already present (capped at 12)
 *   - specSheetUrl: filled if currently empty
 *
 * Usage:
 *   npx tsx scripts/scrape/11-merge-partner-content.ts
 */
import * as path from "node:path";
import { promises as fs } from "node:fs";
import { REPO_ROOT, STAGING, readJson, writeJson, exists } from "./_lib";

const run = async () => {
  const partnerDir = path.join(STAGING, "partner");
  if (!(await exists(partnerDir))) {
    console.log(`[11] No staging/partner/ folder — run a partner scraper first.`);
    return;
  }
  const brands = (await fs.readdir(partnerDir, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);
  if (!brands.length) { console.log(`[11] No brand subdirs.`); return; }

  const contentPath = path.join(REPO_ROOT, "app", "lib", "product-content.json");
  const content: Record<string, any> = (await exists(contentPath)) ? await readJson(contentPath) : {};

  let merged = 0;
  let createdEntries = 0;
  for (const brand of brands) {
    const dir = path.join(partnerDir, brand);
    const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".json"));
    for (const f of files) {
      const data = JSON.parse(await fs.readFile(path.join(dir, f), "utf-8"));
      const id = String(data.odoo_id ?? f.replace(".json", ""));
      const existing = content[id] ?? {
        legacySlug: "", legacyUrl: "", title: "", descriptionEs: "", features: [],
        gallery: [], variants: [], breadcrumb: [], updatedAt: new Date().toISOString(), matchConfidence: 0,
      };
      if (!content[id]) createdEntries++;

      let touched = false;
      if (!existing.descriptionEn && data.descriptionEn) { existing.descriptionEn = data.descriptionEn; touched = true; }
      if ((!existing.features || existing.features.length === 0) && data.features?.length >= 3) {
        existing.features = data.features; touched = true;
      }
      // Append new partner images that aren't already in gallery (by URL).
      if (Array.isArray(data.images) && data.images.length) {
        const have = new Set(existing.gallery ?? []);
        const additions: string[] = [];
        for (const img of data.images) {
          // Partner images are remote URLs; we don't have them on disk yet —
          // store the remote URL so the UI can lazy-fetch, OR run step 12 to
          // download & rewrite as local paths.
          if (!have.has(img)) { additions.push(img); have.add(img); }
        }
        if (additions.length) {
          existing.gallery = [...(existing.gallery ?? []), ...additions].slice(0, 12);
          touched = true;
        }
      }
      if (!existing.specSheetUrl && data.specSheetUrl) { existing.specSheetUrl = data.specSheetUrl; touched = true; }
      if (touched) {
        existing.updatedAt = new Date().toISOString();
        existing.partnerScrapedBrand = data.brand ?? brand;
        content[id] = existing;
        merged++;
      }
    }
  }
  await writeJson(contentPath, content);
  console.log(`[11] ✓ merged ${merged} partner records (created ${createdEntries} new entries) into ${contentPath}`);
};

run().catch((e) => { console.error(e); process.exit(1); });
