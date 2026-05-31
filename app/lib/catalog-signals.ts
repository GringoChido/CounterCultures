/**
 * Catalog signals — real-sales data joined to catalog IDs.
 *
 *   getMostSpecifiedScores()  → Map<productId, specScore + projectCount>
 *   getInShowroomIds()        → Set<productId> with on-hand stock > 0
 *   getAlsoSpecifiedWith(id)  → products that ride the same sale orders
 *
 * Module-level caches keyed off Odoo snapshot recency. The underlying sheet
 * data is cached upstream in odoo-sheets; these maps are derived once per
 * TTL and reused across requests.
 */
import {
  getOdooSaleOrderLines,
  getOdooSaleOrders,
  getOdooStockQuants,
} from "./odoo-sheets";
import { getProductById, type ProductFull } from "./products-full";

const TTL_MS = 30 * 60 * 1000;

export interface SpecifiedSignal {
  projectCount: number;
  quantitySold: number;
  lastSpecifiedDate: string;
  weightedScore: number;
}

// ── Most specified ──────────────────────────────────────────────────────

let scoresCache: { at: number; map: Map<string, SpecifiedSignal> } | null = null;

export const getMostSpecifiedScores = async (): Promise<
  Map<string, SpecifiedSignal>
> => {
  if (scoresCache && Date.now() - scoresCache.at < TTL_MS) {
    return scoresCache.map;
  }
  const [lines, orders] = await Promise.all([
    getOdooSaleOrderLines(),
    getOdooSaleOrders(),
  ]);
  const liveOrders = new Map(
    orders
      .filter((o) => o.state === "sale" || o.state === "done")
      .map((o) => [o.id, o])
  );
  const now = Date.now();
  const map = new Map<string, SpecifiedSignal & { orderIds: Set<string> }>();
  for (const l of lines) {
    const o = liveOrders.get(l.order_id_id);
    if (!o) continue;
    const pid = l.product_id_id;
    if (!pid) continue;
    const date = (o.date_order || "").slice(0, 10);
    const qty = parseFloat(l.product_uom_qty) || 0;
    const monthsAgo =
      date && !isNaN(new Date(date).getTime())
        ? Math.max(
            0,
            (now - new Date(date).getTime()) / (30 * 24 * 60 * 60 * 1000)
          )
        : 24;
    const weight = Math.max(0.1, 1 - monthsAgo / 24);
    let e = map.get(pid);
    if (!e) {
      e = {
        projectCount: 0,
        quantitySold: 0,
        lastSpecifiedDate: "",
        weightedScore: 0,
        orderIds: new Set(),
      };
      map.set(pid, e);
    }
    e.orderIds.add(l.order_id_id);
    e.quantitySold += qty;
    e.weightedScore += qty * weight;
    if (date > e.lastSpecifiedDate) e.lastSpecifiedDate = date;
  }
  const finalMap = new Map<string, SpecifiedSignal>();
  for (const [pid, v] of map) {
    finalMap.set(pid, {
      projectCount: v.orderIds.size,
      quantitySold: Math.round(v.quantitySold),
      lastSpecifiedDate: v.lastSpecifiedDate,
      weightedScore: v.weightedScore * Math.log(v.orderIds.size + 1),
    });
  }
  scoresCache = { at: Date.now(), map: finalMap };
  return finalMap;
};

// ── In showroom ─────────────────────────────────────────────────────────

let showroomCache: { at: number; set: Set<string> } | null = null;

export const getInShowroomIds = async (): Promise<Set<string>> => {
  if (showroomCache && Date.now() - showroomCache.at < TTL_MS) {
    return showroomCache.set;
  }
  const quants = await getOdooStockQuants();
  const agg = new Map<string, number>();
  for (const q of quants) {
    const pid = q.product_id_id;
    if (!pid) continue;
    const onHand = parseFloat(q.quantity) || 0;
    agg.set(pid, (agg.get(pid) ?? 0) + onHand);
  }
  const set = new Set<string>();
  for (const [pid, onHand] of agg) {
    if (onHand > 0) set.add(pid);
  }
  showroomCache = { at: Date.now(), set };
  return set;
};

export const getInShowroomCount = async (): Promise<number> =>
  (await getInShowroomIds()).size;

// ── Also specified with ─────────────────────────────────────────────────
// Co-occurrence: for a seed product, rank other products that appear on the
// same sale orders. Recency-weighted like the spec score so recent projects
// dominate; older pairings are dampened but not zeroed.

let coOccCache: { at: number; map: Map<string, Array<[string, number]>> } | null =
  null;

const buildCoOccurrence = async () => {
  const [lines, orders] = await Promise.all([
    getOdooSaleOrderLines(),
    getOdooSaleOrders(),
  ]);
  const liveOrders = new Map(
    orders
      .filter((o) => o.state === "sale" || o.state === "done")
      .map((o) => [o.id, o])
  );
  const now = Date.now();
  // Group product IDs per order with the order's recency weight
  const byOrder = new Map<string, { pids: Set<string>; weight: number }>();
  for (const l of lines) {
    const o = liveOrders.get(l.order_id_id);
    if (!o) continue;
    const pid = l.product_id_id;
    if (!pid) continue;
    let bucket = byOrder.get(l.order_id_id);
    if (!bucket) {
      const date = (o.date_order || "").slice(0, 10);
      const monthsAgo =
        date && !isNaN(new Date(date).getTime())
          ? Math.max(
              0,
              (now - new Date(date).getTime()) / (30 * 24 * 60 * 60 * 1000)
            )
          : 24;
      const weight = Math.max(0.1, 1 - monthsAgo / 24);
      bucket = { pids: new Set(), weight };
      byOrder.set(l.order_id_id, bucket);
    }
    bucket.pids.add(pid);
  }
  // For each product, accumulate weighted co-occurrence with every co-line pid
  const coAgg = new Map<string, Map<string, number>>();
  for (const { pids, weight } of byOrder.values()) {
    if (pids.size < 2) continue;
    const arr = [...pids];
    for (let i = 0; i < arr.length; i++) {
      const a = arr[i];
      let row = coAgg.get(a);
      if (!row) {
        row = new Map();
        coAgg.set(a, row);
      }
      for (let j = 0; j < arr.length; j++) {
        if (i === j) continue;
        const b = arr[j];
        row.set(b, (row.get(b) ?? 0) + weight);
      }
    }
  }
  // Keep only the top 24 partners per seed — enough for drawer display; keeps
  // memory bounded (354k × 354k would be catastrophic).
  const out = new Map<string, Array<[string, number]>>();
  for (const [seed, partners] of coAgg) {
    const ranked = [...partners.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 24);
    out.set(seed, ranked);
  }
  return out;
};

export const getAlsoSpecifiedWith = async (
  productId: string,
  limit = 8
): Promise<Array<ProductFull & { coScore: number }>> => {
  if (!coOccCache || Date.now() - coOccCache.at >= TTL_MS) {
    coOccCache = { at: Date.now(), map: await buildCoOccurrence() };
  }
  const partners = coOccCache.map.get(productId) ?? [];
  const out: Array<ProductFull & { coScore: number }> = [];
  for (const [pid, score] of partners) {
    if (out.length >= limit) break;
    const p = await getProductById(pid);
    if (!p) continue;
    if (!p.saleOk || !p.active) continue;
    out.push({ ...p, coScore: score });
  }
  return out;
};
