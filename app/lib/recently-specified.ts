/**
 * Recently Specified — aggregates real Odoo sale-order-line history per
 * product, ranks by a composite "relevance" score favoring recent + repeat
 * specification, and returns enriched tiles for the shop homepage.
 *
 * Uses cached sheet data; safe to call at page-render time.
 */
import {
  getOdooSaleOrderLines,
  getOdooSaleOrders,
} from "./odoo-sheets";
import { getProductById, type ProductFull } from "./products-full";

export interface RecentlySpecifiedTile extends ProductFull {
  /** How many distinct sale orders specified this product */
  projectCount: number;
  /** Date of most recent specification (ISO yyyy-mm-dd) */
  lastSpecifiedDate: string;
  /** How many total units have been sold */
  quantitySold: number;
}

interface Aggregate {
  productId: string;
  orderIds: Set<string>;
  quantity: number;
  lastDate: string;
  // Recency-weighted count (newer specs weigh more)
  weightedScore: number;
}

/**
 * Returns top-N products by a recency × volume composite. Cached at the
 * module level for the session since the underlying sales data is a
 * one-shot snapshot (Odoo extraction is a point-in-time dump).
 */
let cache: { at: number; items: RecentlySpecifiedTile[] } | null = null;
const TTL_MS = 30 * 60 * 1000;

export const getRecentlySpecified = async (
  limit = 12
): Promise<RecentlySpecifiedTile[]> => {
  if (cache && Date.now() - cache.at < TTL_MS && cache.items.length >= limit) {
    return cache.items.slice(0, limit);
  }

  const [lines, orders] = await Promise.all([
    getOdooSaleOrderLines(),
    getOdooSaleOrders(),
  ]);

  // Only count confirmed / done orders (real sales, not discarded quotes)
  const liveOrders = new Map(
    orders
      .filter((o) => o.state === "sale" || o.state === "done")
      .map((o) => [o.id, o])
  );

  const now = Date.now();
  const agg = new Map<string, Aggregate>();
  for (const l of lines) {
    const o = liveOrders.get(l.order_id_id);
    if (!o) continue;
    const pid = l.product_id_id;
    if (!pid) continue;
    const date = (o.date_order || "").slice(0, 10);
    const qty = parseFloat(l.product_uom_qty) || 0;

    // Recency weight: linear decay over 24 months; floor at 0.1 so
    // older-but-volume products aren't zeroed out entirely.
    const monthsAgo =
      date && !isNaN(new Date(date).getTime())
        ? Math.max(
            0,
            (now - new Date(date).getTime()) / (30 * 24 * 60 * 60 * 1000)
          )
        : 24;
    const weight = Math.max(0.1, 1 - monthsAgo / 24);

    let entry = agg.get(pid);
    if (!entry) {
      entry = {
        productId: pid,
        orderIds: new Set(),
        quantity: 0,
        lastDate: "",
        weightedScore: 0,
      };
      agg.set(pid, entry);
    }
    entry.orderIds.add(l.order_id_id);
    entry.quantity += qty;
    if (date > entry.lastDate) entry.lastDate = date;
    entry.weightedScore += qty * weight;
  }

  // Rank by weighted score × log(projectCount+1) — products specified in
  // many distinct projects outrank ones sold in bulk to one buyer.
  const ranked = [...agg.values()]
    .filter((e) => e.orderIds.size >= 2) // require at least 2 distinct orders
    .sort((a, b) => {
      const sA = a.weightedScore * Math.log(a.orderIds.size + 1);
      const sB = b.weightedScore * Math.log(b.orderIds.size + 1);
      return sB - sA;
    });

  // Enrich with product details from the full catalog. Skip any that don't
  // match (Odoo IDs that fell out of the catalog extraction).
  const enriched: RecentlySpecifiedTile[] = [];
  for (const a of ranked) {
    if (enriched.length >= limit) break;
    const p = await getProductById(a.productId);
    if (!p) continue;
    if (!p.saleOk || !p.active) continue;
    enriched.push({
      ...p,
      projectCount: a.orderIds.size,
      lastSpecifiedDate: a.lastDate,
      quantitySold: Math.round(a.quantity),
    });
  }

  cache = { at: Date.now(), items: enriched };
  return enriched;
};
