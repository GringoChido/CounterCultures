import { NextResponse, type NextRequest } from "next/server";
import {
  readSheet,
  appendRow,
  updateRow,
  deleteRow,
  findRowIndex,
} from "@/app/lib/dashboard-sheets";
import { getProductById } from "@/app/lib/products-full";

/**
 * Deal_Line_Items — one row per product attached to a deal.
 * Snapshot-at-add: sku/name/brand are stored directly, so later Odoo
 * changes don't retroactively mutate historical quotes.
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
  status: string; // current | special-order | custom | discontinued
  country_of_origin: string;
  hs_code: string;
  created_at: string;
  updated_at: string;
};

const COLS: (keyof LineItemRecord)[] = [
  "id",
  "deal_id",
  "product_odoo_id",
  "sku",
  "product_name",
  "brand",
  "finish",
  "quantity",
  "dealer_cost",
  "quoted_price",
  "msrp",
  "shipping_cost",
  "lead_time",
  "status",
  "country_of_origin",
  "hs_code",
  "created_at",
  "updated_at",
];

const nowIso = () => new Date().toISOString();

const num = (s: string): number => {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};

// Hydrated shape returned to clients (numbers are real numbers).
export interface LineItemRow {
  id: string;
  dealId: string;
  productOdooId: string;
  sku: string;
  productName: string;
  brand: string;
  finish: string;
  quantity: number;
  dealerCost: number;
  quotedPrice: number;
  msrp: number;
  shippingCost: number;
  leadTime: string;
  status: string;
  countryOfOrigin: string;
  hsCode: string;
  createdAt: string;
  updatedAt: string;
  marginAmount: number;
  marginPercent: number;
}

const toRow = (r: LineItemRecord): LineItemRow => {
  const dealerCost = num(r.dealer_cost);
  const quoted = num(r.quoted_price);
  const qty = num(r.quantity) || 1;
  const marginAmount = (quoted - dealerCost) * qty;
  const marginPercent = quoted > 0 ? ((quoted - dealerCost) / quoted) * 100 : 0;
  return {
    id: r.id,
    dealId: r.deal_id,
    productOdooId: r.product_odoo_id,
    sku: r.sku,
    productName: r.product_name,
    brand: r.brand,
    finish: r.finish,
    quantity: qty,
    dealerCost,
    quotedPrice: quoted,
    msrp: num(r.msrp),
    shippingCost: num(r.shipping_cost),
    leadTime: r.lead_time,
    status: r.status || "current",
    countryOfOrigin: r.country_of_origin,
    hsCode: r.hs_code,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    marginAmount,
    marginPercent: Math.round(marginPercent * 10) / 10,
  };
};

const newId = () =>
  `ITEM-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

// GET — list items for a deal
export const GET = async (
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: dealId } = await context.params;
  try {
    const all = await readSheet<LineItemRecord>("Deal_Line_Items");
    const items = all
      .filter((r) => r.deal_id === dealId)
      .map(toRow)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return NextResponse.json({ items });
  } catch (err) {
    console.error("[deals/line-items] GET error:", err);
    return NextResponse.json({ error: "Failed to load line items" }, { status: 500 });
  }
};

// POST — add a product to a deal
//   body: { productId, quantity?, quotedPrice?, dealerCost? }
export const POST = async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: dealId } = await context.params;
  try {
    const body = (await request.json()) as {
      productId: string;
      quantity?: number;
      quotedPrice?: number;
      dealerCost?: number;
      finish?: string;
      leadTime?: string;
    };

    if (!body.productId) {
      return NextResponse.json(
        { error: "productId is required" },
        { status: 400 }
      );
    }

    const product = await getProductById(body.productId);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const now = nowIso();
    const record: LineItemRecord = {
      id: newId(),
      deal_id: dealId,
      product_odoo_id: product.id,
      sku: product.sku || `ODOO-${product.id}`,
      product_name: product.name,
      brand: product.brand,
      finish: body.finish ?? "",
      quantity: String(body.quantity ?? 1),
      dealer_cost: String(body.dealerCost ?? 0),
      quoted_price: String(body.quotedPrice ?? product.listPrice ?? 0),
      msrp: String(product.listPrice ?? 0),
      shipping_cost: "0",
      lead_time: body.leadTime ?? "",
      status: "current",
      country_of_origin: "",
      hs_code: "",
      created_at: now,
      updated_at: now,
    };

    const values = COLS.map((c) => record[c] ?? "");
    await appendRow("Deal_Line_Items", values);

    return NextResponse.json({ success: true, item: toRow(record) });
  } catch (err) {
    console.error("[deals/line-items] POST error:", err);
    return NextResponse.json(
      { error: "Failed to add line item" },
      { status: 500 }
    );
  }
};

// PATCH — update qty/price/finish/leadTime on an existing item
//   body: { itemId, quantity?, quotedPrice?, dealerCost?, finish?, leadTime?, status? }
export const PATCH = async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: dealId } = await context.params;
  try {
    const body = (await request.json()) as {
      itemId: string;
      quantity?: number;
      quotedPrice?: number;
      dealerCost?: number;
      shippingCost?: number;
      finish?: string;
      leadTime?: string;
      status?: string;
    };

    if (!body.itemId) {
      return NextResponse.json({ error: "itemId is required" }, { status: 400 });
    }

    const rowIdx = await findRowIndex("Deal_Line_Items", "id", body.itemId);
    if (rowIdx === null) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const all = await readSheet<LineItemRecord>("Deal_Line_Items");
    const current = all[rowIdx];
    if (current.deal_id !== dealId) {
      return NextResponse.json(
        { error: "Item does not belong to this deal" },
        { status: 403 }
      );
    }

    const merged: LineItemRecord = {
      ...current,
      quantity: body.quantity != null ? String(body.quantity) : current.quantity,
      quoted_price:
        body.quotedPrice != null ? String(body.quotedPrice) : current.quoted_price,
      dealer_cost:
        body.dealerCost != null ? String(body.dealerCost) : current.dealer_cost,
      shipping_cost:
        body.shippingCost != null
          ? String(body.shippingCost)
          : current.shipping_cost,
      finish: body.finish ?? current.finish,
      lead_time: body.leadTime ?? current.lead_time,
      status: body.status ?? current.status,
      updated_at: nowIso(),
    };

    const values = COLS.map((c) => merged[c] ?? "");
    await updateRow("Deal_Line_Items", rowIdx, values);

    return NextResponse.json({ success: true, item: toRow(merged) });
  } catch (err) {
    console.error("[deals/line-items] PATCH error:", err);
    return NextResponse.json(
      { error: "Failed to update line item" },
      { status: 500 }
    );
  }
};

// DELETE — remove an item from a deal
//   body: { itemId }
export const DELETE = async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: dealId } = await context.params;
  try {
    const { itemId } = (await request.json()) as { itemId: string };
    if (!itemId) {
      return NextResponse.json({ error: "itemId is required" }, { status: 400 });
    }

    const rowIdx = await findRowIndex("Deal_Line_Items", "id", itemId);
    if (rowIdx === null) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const all = await readSheet<LineItemRecord>("Deal_Line_Items");
    if (all[rowIdx].deal_id !== dealId) {
      return NextResponse.json(
        { error: "Item does not belong to this deal" },
        { status: 403 }
      );
    }

    await deleteRow("Deal_Line_Items", rowIdx);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[deals/line-items] DELETE error:", err);
    return NextResponse.json(
      { error: "Failed to delete line item" },
      { status: 500 }
    );
  }
};
