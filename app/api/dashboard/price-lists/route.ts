import {
  listPriceListFiles,
  syncPriceLists,
  readMasterPriceList,
  summarizePriceList,
  isConfigured,
} from "@/app/lib/price-lists";

// ── GET /api/dashboard/price-lists ───────────────────────────────────
// Returns the current master price list data + summary stats.
// Query params:
//   ?brand=Ruvati       — filter by brand
//   ?search=something   — search SKU / product name
//   ?summary=true       — return only summary stats (faster)
//   ?files=true         — return the raw file list from the Drive

export async function GET(request: Request) {
  if (!isConfigured()) {
    return Response.json(
      { error: "Price List Drive is not configured. Set GOOGLE_PRICE_LIST_DRIVE_ID." },
      { status: 503 }
    );
  }

  const url = new URL(request.url);
  const brand = url.searchParams.get("brand");
  const search = url.searchParams.get("search");
  const summaryOnly = url.searchParams.get("summary") === "true";
  const filesOnly = url.searchParams.get("files") === "true";

  try {
    // Return raw file listing from the Shared Drive
    if (filesOnly) {
      const files = await listPriceListFiles();
      return Response.json({ files });
    }

    // Read from master sheet
    let rows = await readMasterPriceList();

    // Apply filters
    if (brand) {
      const b = brand.toLowerCase();
      rows = rows.filter((r) => r.brand.toLowerCase() === b);
    }
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.sku.toLowerCase().includes(q) ||
          r.productName.toLowerCase().includes(q) ||
          r.brand.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q)
      );
    }

    const summary = summarizePriceList(rows);

    if (summaryOnly) {
      return Response.json({ summary });
    }

    return Response.json({
      summary,
      products: rows.slice(0, 500), // Paginate to avoid huge responses
      total: rows.length,
    });
  } catch (err) {
    console.error("[Price Lists API]", err);
    return Response.json(
      { error: "Failed to load price list data" },
      { status: 500 }
    );
  }
}

// ── POST /api/dashboard/price-lists ──────────────────────────────────
// Triggers a sync: downloads all parseable Excel files from the Price
// List Shared Drive, parses them, and writes to the Master Price List sheet.

export async function POST() {
  if (!isConfigured()) {
    return Response.json(
      { error: "Price List Drive is not configured. Set GOOGLE_PRICE_LIST_DRIVE_ID." },
      { status: 503 }
    );
  }

  try {
    const result = await syncPriceLists();
    return Response.json({
      message: `Sync complete: ${result.totalRows} products from ${result.results.length} files`,
      ...result,
    });
  } catch (err) {
    console.error("[Price Lists Sync]", err);
    return Response.json(
      { error: "Sync failed — check server logs" },
      { status: 500 }
    );
  }
}
