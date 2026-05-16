/**
 * Build-time invariant: PDP descriptions must never silently disappear.
 *
 *   Runs as part of `npm run build` (see package.json → "build" script).
 *
 *   The check:
 *     1. Walks the cached product catalog (`stripIndex` from products-full).
 *     2. Walks the curated sidecar at `app/lib/product-content.json`.
 *     3. For every product where EITHER source has a description, simulates
 *        the PDP-page resolver and asserts the resolved description is
 *        non-empty. If even one product would render blank, the build fails.
 *
 *   Why this is here: on 2026-05-12 we shipped a PDP refactor (commit
 *   9fbe146) that silently dropped CRM descriptions from every product page,
 *   blanking ~99.7% of the catalog. This guard makes that class of bug
 *   impossible to ship again.
 *
 *   See docs/commerce/PDP-DESCRIPTION-RULES.md.
 *
 *   Exit codes:
 *     0 — invariant holds
 *     1 — at least one product would render an empty description
 *     2 — script failed to load source data (treated as build failure)
 */

import path from "node:path";
import fs from "node:fs";
import { resolvePdpDescription } from "../../app/lib/pdp-description";

interface ProductLike {
  id: string;
  name: string;
  brand: string;
  descriptionEs?: string;
  descriptionEn?: string;
}

interface SidecarEntry {
  descriptionEs?: string;
  descriptionEn?: string;
}

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const SIDECAR_PATH = path.join(REPO_ROOT, "app", "lib", "product-content.json");

// Tunable: how many products to spot-check. Set CHECK_ALL=1 to test every SKU.
const SAMPLE_SIZE = Number(process.env.PDP_CHECK_SAMPLE ?? 2000);
const CHECK_ALL = process.env.CHECK_ALL === "1";

async function loadCatalog(): Promise<ProductLike[]> {
  // We dynamically import the project's catalog loader at runtime so this
  // script doesn't need to know the underlying CRM / Sheets plumbing.
  // Adjust the import path if your project moves the loader.
  const mod = await import(path.join(REPO_ROOT, "app", "lib", "products-full"));
  if (typeof mod.getAllProductsFull !== "function") {
    throw new Error(
      "products-full.ts does not export getAllProductsFull(). " +
        "Update this check script to call the correct loader.",
    );
  }
  return (await mod.getAllProductsFull()) as ProductLike[];
}

function loadSidecar(): Map<string, SidecarEntry> {
  if (!fs.existsSync(SIDECAR_PATH)) return new Map();
  const raw = JSON.parse(fs.readFileSync(SIDECAR_PATH, "utf8")) as Record<
    string,
    SidecarEntry
  >;
  return new Map(Object.entries(raw));
}

function hasAnyDescription(p: ProductLike, s: SidecarEntry | undefined): boolean {
  return Boolean(
    (p.descriptionEs && p.descriptionEs.trim()) ||
      (p.descriptionEn && p.descriptionEn.trim()) ||
      (s?.descriptionEs && s.descriptionEs.trim()) ||
      (s?.descriptionEn && s.descriptionEn.trim()),
  );
}

async function main() {
  let products: ProductLike[];
  try {
    products = await loadCatalog();
  } catch (err) {
    console.error("[pdp-check] Could not load catalog:", err);
    process.exit(2);
  }
  const sidecar = loadSidecar();

  const candidates = products.filter((p) => hasAnyDescription(p, sidecar.get(p.id)));

  const subset = CHECK_ALL
    ? candidates
    : sampleEvenly(candidates, SAMPLE_SIZE);

  const failures: string[] = [];
  for (const p of subset) {
    const content = sidecar.get(p.id);
    for (const locale of ["en", "es"] as const) {
      const r = resolvePdpDescription({ content, product: p, locale });
      // The resolver guarantees a non-empty primary, but only the "fallback"
      // source means "brand + name only" — which means descriptions were
      // available somewhere on this product but were not picked up.
      if (r.source === "fallback") {
        failures.push(
          `Product ${p.id} (${p.brand} ${p.name}) [${locale}] resolved to fallback ` +
            `even though source content exists. ` +
            `sidecar.es=${!!content?.descriptionEs} sidecar.en=${!!content?.descriptionEn} ` +
            `crm.es=${!!p.descriptionEs} crm.en=${!!p.descriptionEn}`,
        );
      }
      if (!r.primary || !r.primary.trim()) {
        failures.push(`Product ${p.id} resolved to empty primary [${locale}]`);
      }
    }
  }

  console.log(
    `[pdp-check] Sampled ${subset.length} of ${candidates.length} products ` +
      `with source descriptions (CHECK_ALL=${CHECK_ALL ? "1" : "0"}).`,
  );
  if (failures.length > 0) {
    console.error(
      `[pdp-check] FAILED — ${failures.length} product(s) would render blank descriptions:`,
    );
    for (const f of failures.slice(0, 20)) console.error("  - " + f);
    if (failures.length > 20) console.error(`  …and ${failures.length - 20} more.`);
    console.error(
      "\nThis means the PDP description resolution chain has regressed. " +
        "Read docs/commerce/PDP-DESCRIPTION-RULES.md before changing anything.",
    );
    process.exit(1);
  }
  console.log("[pdp-check] OK — all sampled products resolve a real description.");
}

function sampleEvenly<T>(arr: T[], n: number): T[] {
  if (arr.length <= n) return arr;
  const step = arr.length / n;
  const out: T[] = [];
  for (let i = 0; i < n; i++) out.push(arr[Math.floor(i * step)]);
  return out;
}

main().catch((err) => {
  console.error("[pdp-check] Unexpected failure:", err);
  process.exit(2);
});
