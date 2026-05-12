/**
 * Step 6 — Compose the canonical content sidecar that the new site reads.
 *
 * Inputs:
 *   staging/cc-mx/products/<slug>.json           — scraped Spanish content
 *   staging/cc-mx/match-map.json                 — slug ↔ odoo_id (only confident matches)
 *   staging/spec-urls.json                       — odoo_id ↔ spec sheet URL
 *   public/specs/odoo/<odoo_id>.pdf              — locally downloaded specs
 *   staging/cc-mx/images/<slug>/NN.jpg           — locally downloaded gallery images
 *
 * Outputs:
 *   app/lib/product-content.json                 — keyed by Odoo id
 *   public/products/odoo-gallery/<id>/N.jpg      — gallery images keyed by Odoo id
 *   app/lib/product-image-manifest.json (regen)  — additive — only when --rebuild-manifest
 *
 * The shape of product-content.json (one entry per matched Odoo id):
 *   {
 *     [odoo_id]: {
 *       legacySlug: string;
 *       legacyUrl: string;
 *       title: string;
 *       descriptionEs: string;
 *       descriptionEn?: string;
 *       features: string[];
 *       gallery: string[];                       // public paths under /products/odoo-gallery/<id>/
 *       variants: string[];
 *       breadcrumb: string[];
 *       specSheetUrl?: string;                    // remote
 *       specSheetLocal?: string;                  // /specs/odoo/<id>.pdf
 *       price?: number; priceFrom?: boolean; saleOriginalPrice?: number;
 *       updatedAt: string;
 *       matchConfidence: number;
 *     }
 *   }
 *
 * Usage:
 *   npx tsx scripts/scrape/06-build-product-content.ts
 *   npx tsx scripts/scrape/06-build-product-content.ts --min-confidence 0.5
 *   npx tsx scripts/scrape/06-build-product-content.ts --copy-gallery   # copy staged imgs to public/
 *   npx tsx scripts/scrape/06-build-product-content.ts --rebuild-manifest
 */
import * as path from "node:path";
import { promises as fs } from "node:fs";
import { REPO_ROOT, STAGING, PUBLIC_PRODUCTS, exists, readJson, writeJson } from "./_lib";
import type { ScrapedProduct } from "./02-cc-mx-products";

const arg = (name: string, fallback?: string): string | undefined => {
  const i = process.argv.indexOf(`--${name}`); return i < 0 ? fallback : process.argv[i + 1];
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

interface SpecEntry { odoo_id: string; url: string; status: string; }

interface ProductContent {
  legacySlug: string;
  legacyUrl: string;
  title: string;
  descriptionEs: string;
  features: string[];
  gallery: string[];
  variants: string[];
  breadcrumb: string[];
  specSheetUrl?: string;
  specSheetLocal?: string;
  price?: number;
  priceFrom?: boolean;
  saleOriginalPrice?: number;
  updatedAt: string;
  matchConfidence: number;
}

const run = async () => {
  const minConf = Number(arg("min-confidence", "0.45"));
  const copyGallery = process.argv.includes("--copy-gallery");
  const rebuildManifest = process.argv.includes("--rebuild-manifest");

  const matchPath = path.join(STAGING, "cc-mx", "match-map.json");
  const specPath = path.join(STAGING, "spec-urls.json");

  const matches = (await exists(matchPath)) ? await readJson<Match[]>(matchPath) : [];
  const specs   = (await exists(specPath))   ? await readJson<SpecEntry[]>(specPath)   : [];
  const specByOdoo = new Map<string, SpecEntry>(specs.map((s) => [s.odoo_id, s]));

  const productsDir = path.join(STAGING, "cc-mx", "products");
  const imagesDir   = path.join(STAGING, "cc-mx", "images");
  const galleryOut  = path.join(PUBLIC_PRODUCTS, "odoo-gallery");

  const content: Record<string, ProductContent> = {};
  let kept = 0, skipped = 0;

  for (const m of matches) {
    if (!m.odoo_id || m.confidence < minConf) { skipped++; continue; }
    const scrapedFile = path.join(productsDir, `${m.slug}.json`);
    if (!(await exists(scrapedFile))) { skipped++; continue; }
    const sc = await readJson<ScrapedProduct>(scrapedFile);

    // Determine gallery: copy from staging to public/products/odoo-gallery/<id>/
    const stagedImagesDir = path.join(imagesDir, m.slug);
    let gallery: string[] = [];
    if (await exists(stagedImagesDir)) {
      const imgs = (await fs.readdir(stagedImagesDir)).filter((f) => /\.(jpe?g|png|webp|gif|avif)$/i.test(f)).sort();
      if (copyGallery) {
        const destDir = path.join(galleryOut, m.odoo_id);
        await fs.mkdir(destDir, { recursive: true });
        for (const f of imgs) {
          const src = path.join(stagedImagesDir, f);
          const dst = path.join(destDir, f);
          if (!(await exists(dst))) await fs.copyFile(src, dst);
        }
      }
      gallery = imgs.map((f) => `/products/odoo-gallery/${m.odoo_id}/${f}`);
    }

    const spec = specByOdoo.get(m.odoo_id);
    const entry: ProductContent = {
      legacySlug: m.slug,
      legacyUrl: sc.url,
      title: sc.title,
      descriptionEs: sc.description,
      features: sc.features,
      gallery,
      variants: sc.variants,
      breadcrumb: sc.breadcrumb,
      specSheetUrl: spec?.url,
      specSheetLocal: spec && spec.status === "downloaded" ? `/specs/odoo/${m.odoo_id}.pdf` : undefined,
      price: sc.price ?? undefined,
      priceFrom: sc.priceFrom || undefined,
      saleOriginalPrice: sc.saleOriginalPrice ?? undefined,
      updatedAt: new Date().toISOString(),
      matchConfidence: m.confidence,
    };
    content[m.odoo_id] = entry;
    kept++;
  }

  // Spec entries whose Odoo ID didn't match a scraped product still carry value.
  // Merge them so descriptionEs is empty but specSheetUrl is available.
  for (const s of specs) {
    if (content[s.odoo_id]) {
      // already merged above
      continue;
    }
    if (!s.odoo_id) continue;
    content[s.odoo_id] = {
      legacySlug: "",
      legacyUrl: "",
      title: "",
      descriptionEs: "",
      features: [],
      gallery: [],
      variants: [],
      breadcrumb: [],
      specSheetUrl: s.url,
      specSheetLocal: s.status === "downloaded" ? `/specs/odoo/${s.odoo_id}.pdf` : undefined,
      updatedAt: new Date().toISOString(),
      matchConfidence: 0,
    };
  }

  const out = path.join(REPO_ROOT, "app", "lib", "product-content.json");
  await writeJson(out, content);
  console.log(`[06] ✓ ${Object.keys(content).length} entries → ${out}`);
  console.log(`[06]   kept=${kept} skipped=${skipped} (min-confidence=${minConf})`);

  if (rebuildManifest) {
    // The manifest is ONLY canonical thumbnails actually on disk at
    // /products/odoo/<id>.jpg. Gallery-only products are handled at runtime
    // by products-full.ts (which falls back to gallery[0]) — do not bloat
    // the manifest with ids that don't have a real thumbnail file.
    const odooThumbDir = path.join(PUBLIC_PRODUCTS, "odoo");
    const haveThumb = (await fs.readdir(odooThumbDir))
      .filter((f) => f.endsWith(".jpg"))
      .map((f) => f.slice(0, -4))
      .sort();
    const manifestPath = path.join(REPO_ROOT, "app", "lib", "product-image-manifest.json");
    await writeJson(manifestPath, haveThumb);
    console.log(`[06] ✓ regenerated ${manifestPath} with ${haveThumb.length} ids (thumbnails on disk)`);
  }
};

run().catch((e) => {
  console.error("[06] FAILED:", e);
  process.exit(1);
});
