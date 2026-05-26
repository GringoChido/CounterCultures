/**
 * Shared data loader for quote rendering — used by both the authenticated
 * print page (/dashboard/quotes/[id]/print) and the public share page
 * (/quote/[id]?t=…). Reads Pipeline + Deal_Line_Items from the CRM sheet
 * and shapes into a stable QuoteData type.
 *
 * Falls back to Odoo live-read when the id matches an Odoo sale order
 * (numeric id) but has no CRM Pipeline row.
 */
import { readSheet } from "./dashboard-sheets";
import { getOrderDetail } from "./odoo-sheets";
import { fetchSaleOrderLines, isConfigured } from "./odoo";

interface PipelineRow {
  [key: string]: string;
  id: string;
  name: string;
  company: string;
  stage: string;
  value: string;
  expected_close: string;
  owner: string;
  source: string;
  notes: string;
  created_at: string;
}

interface LineItemRow {
  [key: string]: string;
  id: string;
  deal_id: string;
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
}

export interface QuoteLineItem {
  id: string;
  sku: string;
  name: string;
  brand: string;
  finish: string;
  quantity: number;
  quotedPrice: number;
  shipping: number;
  leadTime: string;
  lineTotal: number;
}

export interface QuoteData {
  deal: PipelineRow;
  items: QuoteLineItem[];
  subtotal: number;
  shipping: number;
  grandTotal: number;
  /**
   * Default deposit on the quote. CC's standard policy is 70% of the
   * grand total; some brands/orders require more (set per-deal in the
   * Pipeline sheet via a `deposit_pct` column when present, otherwise
   * falls back to the 70% default).
   */
  depositAmount: number;
  docNumber: string;
  issueDate: string; // ISO date (yyyy-mm-dd)
  validUntil: string;
  currency: "MXN";
}

const num = (s: string): number => {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};

// Deterministic quote number from deal id + current year.
const quoteNumber = (dealId: string): string => {
  const yr = new Date().getFullYear();
  const suffix = dealId
    .replace(/[^A-Z0-9]/gi, "")
    .slice(-4)
    .toUpperCase()
    .padStart(4, "0");
  return `CC-Q-${yr}-${suffix}`;
};

const addDays = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export const loadQuoteData = async (
  dealId: string
): Promise<QuoteData | null> => {
  const [deals, lineItems] = await Promise.all([
    readSheet<PipelineRow>("Pipeline"),
    readSheet<LineItemRow>("Deal_Line_Items"),
  ]);
  const deal = deals.find((d) => d.id === dealId);

  // Odoo fallback: if no CRM Pipeline row exists and the id looks numeric
  // (Odoo sale order id), load lines from Odoo live.
  if (!deal) {
    return loadQuoteDataFromOdoo(dealId);
  }

  const items: QuoteLineItem[] = lineItems
    .filter((l) => l.deal_id === dealId)
    .map((l) => {
      const qty = num(l.quantity) || 1;
      const quoted = num(l.quoted_price);
      return {
        id: l.id,
        sku: l.sku,
        name: l.product_name,
        brand: l.brand,
        finish: l.finish,
        quantity: qty,
        quotedPrice: quoted,
        shipping: num(l.shipping_cost),
        leadTime: l.lead_time,
        lineTotal: quoted * qty,
      };
    });

  // CRM deal exists but has no line items — try Odoo if the deal has an
  // Odoo-style numeric id (shouldn't happen in practice, but defensive).
  if (items.length === 0) {
    const odooFallback = await loadQuoteDataFromOdoo(dealId);
    if (odooFallback && odooFallback.items.length > 0) return odooFallback;
  }

  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  const shipping = items.reduce((s, i) => s + i.shipping, 0);
  const grandTotal = subtotal + shipping;

  // Per-deal override on Pipeline row, e.g. a higher deposit pct for a
  // brand/customer that demands more upfront. Stored as decimal (e.g.
  // "0.85" for 85%) or whole number percent ("85") — accept both.
  const dealRow = deal as unknown as Record<string, string>;
  const rawPct = (dealRow.deposit_pct ?? "").trim();
  const parsedPct = Number(rawPct);
  let depositPct = 0.7; // CC's standard 70% minimum
  if (Number.isFinite(parsedPct) && parsedPct > 0) {
    depositPct = parsedPct > 1 ? parsedPct / 100 : parsedPct;
    if (depositPct < 0.7) depositPct = 0.7;
    if (depositPct > 1) depositPct = 1;
  }

  return {
    deal,
    items,
    subtotal,
    shipping,
    grandTotal,
    depositAmount: Math.round(grandTotal * depositPct * 100) / 100,
    docNumber: quoteNumber(dealId),
    issueDate: new Date().toISOString().slice(0, 10),
    validUntil: addDays(15),
    currency: "MXN",
  };
};

const loadQuoteDataFromOdoo = async (
  orderId: string
): Promise<QuoteData | null> => {
  if (!isConfigured()) return null;
  const odooId = Number(orderId);
  if (!Number.isFinite(odooId) || odooId <= 0) return null;

  try {
    const detail = await getOrderDetail(orderId);
    if (!detail) return null;

    let lines = detail.lines;
    if (lines.length === 0) {
      const liveLines = await fetchSaleOrderLines(odooId);
      lines = liveLines.map((l) => ({
        id: String(l.id),
        order_id: detail.order.name,
        order_id_id: orderId,
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

    const productLines = lines.filter((l) => num(l.product_uom_qty) > 0);
    const items: QuoteLineItem[] = productLines.map((l) => {
      const qty = num(l.product_uom_qty) || 1;
      const price = num(l.price_unit);
      const disc = num(l.discount);
      const effectivePrice = disc > 0 ? price * (1 - disc / 100) : price;
      return {
        id: l.id,
        sku: "",
        name: l.product_id || l.name,
        brand: "",
        finish: "",
        quantity: qty,
        quotedPrice: effectivePrice,
        shipping: 0,
        leadTime: "",
        lineTotal: num(l.price_subtotal),
      };
    });

    const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
    const grandTotal = num(String(detail.order.amountTotal));
    const depositPct = 0.7;

    const syntheticDeal: PipelineRow = {
      id: orderId,
      name: detail.order.partnerName,
      company: detail.order.partnerName,
      stage: detail.order.state === "draft" || detail.order.state === "sent" ? "quote_sent" : "order_confirmed",
      value: String(detail.order.amountTotal),
      expected_close: "",
      owner: detail.order.salesperson || "",
      source: "odoo",
      notes: "",
      created_at: detail.order.dateOrder || "",
    };

    return {
      deal: syntheticDeal,
      items,
      subtotal,
      shipping: 0,
      grandTotal: grandTotal || subtotal,
      depositAmount: Math.round((grandTotal || subtotal) * depositPct * 100) / 100,
      docNumber: detail.order.name,
      issueDate: detail.order.dateOrder
        ? new Date(detail.order.dateOrder).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      validUntil: detail.order.validityDate || addDays(15),
      currency: "MXN",
    };
  } catch (err) {
    console.warn("[loadQuoteData] Odoo fallback failed:", err);
    return null;
  }
};

export const fmtMxn = (n: number): string =>
  n.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  });

export const fmtDate = (iso: string): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};
