/**
 * Build-time snapshot generator for CC_Products_Full.
 *
 * Fetches the 354K-row product sheet ONCE and writes a gzipped JSON
 * snapshot to app/lib/generated/products-snapshot.json.gz. The runtime
 * `load()` in products-full.ts hydrates from this file instead of
 * hitting the Sheets API on cold start (~10s → <1s).
 *
 * Usage:  npx tsx scripts/build-products-snapshot.ts
 * Called: as a prebuild step before `next build` (see package.json).
 *
 * Requires the same env vars as the runtime Sheets path:
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY[_B64],
 *   GOOGLE_SHEETS_ID_PRODUCTS_FULL
 */
import { GoogleAuth } from "google-auth-library";
import { sheets as sheetsApi } from "@googleapis/sheets";
import { gzipSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";

const REPO_ROOT = resolve(__dirname, "..");
const OUTPUT_PATH = resolve(REPO_ROOT, "app/lib/generated/products-snapshot.json.gz");

const getPrivateKey = (): string | undefined => {
  const b64 = process.env.GOOGLE_PRIVATE_KEY_B64;
  if (b64) {
    try {
      return Buffer.from(b64, "base64").toString("utf-8");
    } catch { /* fall through */ }
  }
  const raw = process.env.GOOGLE_PRIVATE_KEY;
  return raw?.replace(/\\n/g, "\n");
};

const main = async () => {
  const sheetId = process.env.GOOGLE_SHEETS_ID_PRODUCTS_FULL;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = getPrivateKey();

  if (!sheetId || !email || !key) {
    console.warn(
      "[build-products-snapshot] Missing Sheets env vars — skipping snapshot generation.",
      { hasSheetId: !!sheetId, hasEmail: !!email, hasKey: !!key },
    );
    process.exit(0);
  }

  console.log("[build-products-snapshot] Fetching CC_Products_Full...");
  const t0 = Date.now();

  const auth = new GoogleAuth({
    credentials: { client_email: email, private_key: key },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  const sheets = sheetsApi({ version: "v4", auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "Products!A:L",
  });

  const rows = res.data.values;
  if (!rows || rows.length < 2) {
    console.error("[build-products-snapshot] Sheet returned no data — aborting.");
    process.exit(1);
  }

  console.log(`[build-products-snapshot] Fetched ${rows.length - 1} rows in ${Date.now() - t0}ms`);

  // Use the shared mapping so the snapshot is byte-identical to what
  // the runtime Sheets path would produce.
  const { mapRowsToProducts } = await import("../app/lib/products-mapping");
  const products = mapRowsToProducts(rows as string[][]);

  console.log(`[build-products-snapshot] Mapped ${products.length} products`);

  // Compact JSON (no pretty-print) + gzip for minimal disk + parse time.
  const json = JSON.stringify(products);
  const gzipped = gzipSync(Buffer.from(json), { level: 9 });

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, gzipped);

  const sizeMb = (gzipped.length / 1024 / 1024).toFixed(1);
  console.log(
    `[build-products-snapshot] Wrote ${OUTPUT_PATH} (${sizeMb} MB gzipped, ${products.length} products)`,
  );
};

main().catch((err) => {
  console.error("[build-products-snapshot] Fatal:", err);
  process.exit(1);
});
