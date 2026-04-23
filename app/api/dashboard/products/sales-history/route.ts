import { NextResponse, type NextRequest } from "next/server";
import {
  getOdooSaleOrderLines,
  getOdooSaleOrders,
} from "@/app/lib/odoo-sheets";

/**
 * Sales history for a single product. Joins sale order lines ↔ orders by
 * order_id_id, returns aggregate stats + up to the 10 most recent orders
 * that contained this product.
 *
 * productId is the Odoo product.template id (NOT product.product).
 * In this install they happen to be 1:1 so we can match on product_id_id
 * directly; if that changes we'd need a product.product lookup.
 */
export const GET = async (req: NextRequest) => {
  const productId = req.nextUrl.searchParams.get("productId") ?? "";
  if (!productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }

  try {
    const [lines, orders] = await Promise.all([
      getOdooSaleOrderLines(),
      getOdooSaleOrders(),
    ]);

    const matchingLines = lines.filter((l) => l.product_id_id === productId);
    if (matchingLines.length === 0) {
      return NextResponse.json({
        count: 0,
        quantitySold: 0,
        avgPriceUnit: 0,
        lastOrderDate: null,
        orders: [],
      });
    }

    const orderById = new Map(orders.map((o) => [o.id, o]));
    const rows = matchingLines
      .map((l) => {
        const o = orderById.get(l.order_id_id);
        return {
          orderId: l.order_id_id,
          orderName: l.order_id,
          partnerName: o?.partner_id ?? l.order_partner_id ?? "",
          partnerId: o?.partner_id_id ?? "",
          dateOrder: (o?.date_order ?? "").slice(0, 10),
          state: o?.state ?? "",
          quantity: Number(l.product_uom_qty) || 0,
          priceUnit: Number(l.price_unit) || 0,
          priceSubtotal: Number(l.price_subtotal) || 0,
          currency: l.currency_id ?? "MXN",
        };
      })
      .sort((a, b) => b.dateOrder.localeCompare(a.dateOrder));

    const quantitySold = rows.reduce((s, r) => s + r.quantity, 0);
    const revenue = rows.reduce((s, r) => s + r.priceSubtotal, 0);
    const avgPriceUnit =
      quantitySold > 0
        ? rows.reduce((s, r) => s + r.priceUnit * r.quantity, 0) / quantitySold
        : 0;

    return NextResponse.json({
      count: rows.length,
      quantitySold,
      revenue: Math.round(revenue * 100) / 100,
      avgPriceUnit: Math.round(avgPriceUnit * 100) / 100,
      lastOrderDate: rows[0]?.dateOrder ?? null,
      currency: rows[0]?.currency ?? "MXN",
      orders: rows.slice(0, 10),
      uniqueCustomers: new Set(
        rows.map((r) => r.partnerId).filter(Boolean)
      ).size,
    });
  } catch (err) {
    console.error("[products/sales-history] error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
};
