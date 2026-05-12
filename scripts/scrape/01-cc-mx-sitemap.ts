/**
 * Step 1 — Discover every product URL on countercultures.com.mx via sitemap.xml.
 *
 * Squarespace exposes a master sitemap that links to per-collection sitemaps.
 * We follow only the product collections (anything matching /productos/) and
 * extract /productos/p/<slug> URLs.
 *
 * Output: staging/cc-mx/sitemap.json
 *   [{ slug, url, lastmod }]
 *
 * Usage:
 *   npx tsx scripts/scrape/01-cc-mx-sitemap.ts
 *   npx tsx scripts/scrape/01-cc-mx-sitemap.ts --force   # ignore cache
 */
import * as path from "node:path";
import { getText, writeJson, exists, STAGING, all, maybe } from "./_lib";

const BASE = "https://www.countercultures.com.mx";
const OUT = path.join(STAGING, "cc-mx", "sitemap.json");

interface ProductEntry {
  slug: string;
  url: string;
  lastmod: string | null;
}

const extractLocs = (xml: string): string[] =>
  all(xml, /<loc>([^<]+)<\/loc>/g);

const extractUrlsWithLastmod = (xml: string): Array<{ loc: string; lastmod: string | null }> => {
  const out: Array<{ loc: string; lastmod: string | null }> = [];
  const urlBlocks = xml.match(/<url>[\s\S]*?<\/url>/g) ?? [];
  for (const block of urlBlocks) {
    const loc = maybe(block, /<loc>([^<]+)<\/loc>/);
    const lastmod = maybe(block, /<lastmod>([^<]+)<\/lastmod>/);
    if (loc) out.push({ loc, lastmod });
  }
  return out;
};

const run = async () => {
  const force = process.argv.includes("--force");
  if (!force && (await exists(OUT))) {
    console.log(`[01] sitemap already discovered (${OUT}); pass --force to redo.`);
    return;
  }

  console.log(`[01] Fetching root sitemap…`);
  const rootXml = await getText(`${BASE}/sitemap.xml`);

  // A sitemap index references sub-sitemaps via <sitemap><loc>...</loc></sitemap>.
  // A direct urlset references pages via <url><loc>...</loc></url>.
  // Squarespace sometimes uses both — handle either case.
  const isIndex = /<sitemapindex/i.test(rootXml);

  const productEntries: ProductEntry[] = [];

  const ingestUrlset = (xml: string) => {
    for (const { loc, lastmod } of extractUrlsWithLastmod(xml)) {
      // Only product detail pages.
      if (!/\/productos\/p\//.test(loc)) continue;
      const slug = loc.split("/productos/p/")[1]?.replace(/\/$/, "") ?? "";
      if (slug) productEntries.push({ slug, url: loc, lastmod });
    }
  };

  if (isIndex) {
    const subSitemaps = extractLocs(rootXml);
    console.log(`[01] Sitemap index with ${subSitemaps.length} sub-sitemap(s).`);
    for (const sub of subSitemaps) {
      console.log(`[01] Fetching ${sub}`);
      const subXml = await getText(sub);
      ingestUrlset(subXml);
    }
  } else {
    ingestUrlset(rootXml);
  }

  // De-dup by slug (keep first lastmod seen).
  const seen = new Set<string>();
  const unique = productEntries.filter((p) => {
    if (seen.has(p.slug)) return false;
    seen.add(p.slug);
    return true;
  });

  await writeJson(OUT, unique);
  console.log(`[01] ✓ ${unique.length} product URLs → ${OUT}`);
};

run().catch((e) => {
  console.error("[01] FAILED:", e);
  process.exit(1);
});
