/**
 * Shared data loader for quote rendering — used by both the authenticated
 * print page (/dashboard/quotes/[id]/print) and the public share page
 * (/quote/[id]?t=…). Reads Pipeline + Deal_Line_Items from the CRM sheet
 * and shapes into a stable QuoteData type.
 */
import { readSheet } from "./dashboard-sheets";

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
  if (!deal) return null;

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
    // Floor at 70% — Roger's stated minimum. Per-deal override can only
    // go ABOVE the floor, never below.
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
