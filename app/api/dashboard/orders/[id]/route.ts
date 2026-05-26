import { NextResponse, type NextRequest } from "next/server";
import { getOrderDetail } from "@/app/lib/odoo-sheets";
import { fetchSaleOrderLines, isConfigured } from "@/app/lib/odoo";

export const GET = async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  try {
    const detail = await getOrderDetail(id);
    if (!detail) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (detail.lines.length === 0 && isConfigured()) {
      try {
        const liveLines = await fetchSaleOrderLines(Number(id));
        if (liveLines.length > 0) {
          detail.lines = liveLines.map((l) => ({
            id: String(l.id),
            order_id: detail.order.name,
            order_id_id: id,
            order_partner_id: detail.order.partnerName,
            product_id: l.product_id,
            product_id_id: l.product_id_id,
            product_uom_qty: l.product_uom_qty,
            qty_delivered: l.qty_delivered,
            qty_invoiced: l.qty_invoiced,
            price_unit: l.price_unit,
            discount: l.discount,
            price_subtotal: l.price_subtotal,
            price_tax: l.price_tax,
            price_total: l.price_total,
            currency_id: l.currency_id,
            name: l.name,
            sequence: l.sequence,
          }));
        }
      } catch (err) {
        console.warn("[order detail API] live line fetch failed (non-fatal):", err);
      }
    }

    return NextResponse.json(detail);
  } catch (err) {
    console.error("[order detail API] error:", err);
    return NextResponse.json({ error: "Failed to load order" }, { status: 500 });
  }
};
