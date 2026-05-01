import { NextResponse, type NextRequest } from "next/server";
import { readSheet, appendRow } from "@/app/lib/dashboard-sheets";

/**
 * Generate one Purchase_Orders row per distinct brand on a deal's line items.
 * Idempotent-friendly: if a draft PO already exists for this (dealId, brand),
 * we skip it so a re-click doesn't duplicate. Other statuses (sent, paid, etc.)
 * are also respected — generate only creates new drafts when no PO exists.
 *
 * Returns the freshly-created POs in the in-memory `PurchaseOrder` shape so
 * the UI can merge them without a reload round-trip.
 */

type LineItemRecord = {
  id: string;
  deal_id: string;
  product_odoo_id: string;
  sku: string;
  product_name: string;
  brand: string;
  finish: string;
  quantity: string;
  dealer_cost: string;
  quoted_price: string;
  msrp: string;
  shipping_cost: string;
  lead_time: string;
  status: string;
  country_of_origin: string;
  hs_code: string;
  created_at: string;
  updated_at: string;
};

type PurchaseOrderRecord = {
  PO_ID: string;
  Deal_ID: string;
  Brand: string;
  Vendor: string;
  Items_JSON: string;
  Total_Amount: string;
  Currency: string;
  Status: string;
  Sent_Date: string;
  Confirmed_Date: string;
  Payment_Date: string;
  Payment_Method: string;
  Payment_Ref: string;
  Payment_Amount: string;
  Ship_To: string;
  Requested_Delivery: string;
  Estimated_Ship: string;
  Carrier: string;
  Tracking: string;
  Received_Date: string;
  Condition: string;
  Notes: string;
  Drive_File_ID: string;
};

const PO_COLUMNS: (keyof PurchaseOrderRecord)[] = [
  "PO_ID",
  "Deal_ID",
  "Brand",
  "Vendor",
  "Items_JSON",
  "Total_Amount",
  "Currency",
  "Status",
  "Sent_Date",
  "Confirmed_Date",
  "Payment_Date",
  "Payment_Method",
  "Payment_Ref",
  "Payment_Amount",
  "Ship_To",
  "Requested_Delivery",
  "Estimated_Ship",
  "Carrier",
  "Tracking",
  "Received_Date",
  "Condition",
  "Notes",
  "Drive_File_ID",
];

const num = (s: string): number => {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};

const newPoId = (dealId: string, brand: string) => {
  const slug = brand
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 12) || "MISC";
  const stamp = Date.now().toString(36).slice(-5).toUpperCase();
  return `PO-${dealId.slice(-6)}-${slug}-${stamp}`;
};

interface GeneratedPo {
  id: string;
  dealId: string;
  brand: string;
  vendorName: string;
  items: Array<{
    sku: string;
    productName: string;
    finish?: string;
    quantity: number;
    dealerCost: number;
  }>;
  totalAmount: number;
  currency: string;
  status: "draft";
  shipTo: "cc-showroom";
}

export const POST = async (
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: dealId } = await context.params;

  try {
    const [allLines, allPos] = await Promise.all([
      readSheet<LineItemRecord>("Deal_Line_Items"),
      readSheet<PurchaseOrderRecord>("Purchase_Orders"),
    ]);

    const dealLines = allLines.filter((l) => l.deal_id === dealId);
    if (dealLines.length === 0) {
      return NextResponse.json(
        { error: "No line items on this deal — add products before generating POs." },
        { status: 400 }
      );
    }

    // Brands already covered by an existing PO on this deal — skip them so a
    // re-click is safe and doesn't double-write.
    const existingBrands = new Set(
      allPos.filter((p) => p.Deal_ID === dealId).map((p) => p.Brand)
    );

    // Group lines by canonical brand. Empty/blank brand falls into "Misc" so
    // line items without a brand still get a PO and don't silently disappear.
    const byBrand = new Map<string, LineItemRecord[]>();
    for (const l of dealLines) {
      const b = (l.brand || "Misc").trim() || "Misc";
      const arr = byBrand.get(b);
      if (arr) arr.push(l);
      else byBrand.set(b, [l]);
    }

    const created: GeneratedPo[] = [];

    for (const [brand, lines] of byBrand) {
      if (existingBrands.has(brand)) continue;

      const items = lines.map((l) => ({
        sku: l.sku,
        productName: l.product_name,
        finish: l.finish || undefined,
        quantity: num(l.quantity) || 1,
        dealerCost: num(l.dealer_cost),
      }));
      const totalAmount = items.reduce(
        (s, it) => s + it.dealerCost * it.quantity,
        0
      );

      const poId = newPoId(dealId, brand);
      const record: PurchaseOrderRecord = {
        PO_ID: poId,
        Deal_ID: dealId,
        Brand: brand,
        Vendor: brand,
        Items_JSON: JSON.stringify(items),
        Total_Amount: totalAmount.toFixed(2),
        Currency: "MXN",
        Status: "draft",
        Sent_Date: "",
        Confirmed_Date: "",
        Payment_Date: "",
        Payment_Method: "",
        Payment_Ref: "",
        Payment_Amount: "",
        Ship_To: "cc-showroom",
        Requested_Delivery: "",
        Estimated_Ship: "",
        Carrier: "",
        Tracking: "",
        Received_Date: "",
        Condition: "",
        Notes: "",
        Drive_File_ID: "",
      };

      const values = PO_COLUMNS.map((c) => record[c] ?? "");
      await appendRow("Purchase_Orders", values);

      created.push({
        id: poId,
        dealId,
        brand,
        vendorName: brand,
        items,
        totalAmount,
        currency: "MXN",
        status: "draft",
        shipTo: "cc-showroom",
      });
    }

    return NextResponse.json({
      success: true,
      created,
      skipped: byBrand.size - created.length,
    });
  } catch (err) {
    console.error("[deals/generate-pos] error:", err);
    return NextResponse.json(
      { error: "Failed to generate purchase orders" },
      { status: 500 }
    );
  }
};
