/**
 * Typed readers for Odoo_* sheet tabs + Customer 360 join queries.
 *
 * All Odoo many2one fields were flattened at extraction time: `partner_id`
 * holds the display name, `partner_id_id` holds the integer Odoo ID used
 * for joins. Join key between tabs = `_id` suffix.
 */
import { readSheet } from "./dashboard-sheets";

// ── Raw row types (as they come out of the sheet) ────────────────

export interface OdooPartner {
  [key: string]: string;
  id: string;
  name: string;
  display_name: string;
  is_company: string;
  parent_id: string;
  parent_id_id: string;
  commercial_partner_id: string;
  commercial_partner_id_id: string;
  email: string;
  phone: string;
  mobile: string;
  website: string;
  lang: string;
  street: string;
  street2: string;
  city: string;
  state_id: string;
  state_id_id: string;
  zip: string;
  country_id: string;
  country_id_id: string;
  vat: string;
  l10n_mx_edi_fiscal_regime: string;
  l10n_mx_edi_usage: string;
  customer_rank: string;
  supplier_rank: string;
  category_id: string;
  user_id: string;
  user_id_id: string;
  property_payment_term_id: string;
  property_payment_term_id_id: string;
  property_supplier_payment_term_id: string;
  property_product_pricelist: string;
  property_product_pricelist_id: string;
  property_account_receivable_id: string;
  property_account_payable_id: string;
  property_account_position_id: string;
  credit: string;
  debit: string;
  credit_limit: string;
  bank_ids: string;
  total_invoiced: string;
  active: string;
  comment: string;
  company_type: string;
  create_date: string;
  write_date: string;
  child_ids: string;
}

export interface OdooInvoice {
  [key: string]: string;
  id: string;
  name: string;
  display_name: string;
  move_type: string; // out_invoice | out_refund | in_invoice | in_refund
  state: string; // draft | posted | cancel
  ref: string;
  partner_id: string;
  partner_id_id: string;
  commercial_partner_id: string;
  commercial_partner_id_id: string;
  invoice_date: string;
  invoice_date_due: string;
  date: string;
  amount_untaxed: string;
  amount_tax: string;
  amount_total: string;
  amount_residual: string;
  currency_id: string;
  currency_id_id: string;
  payment_state: string; // not_paid | partial | paid | reversed | in_payment
  payment_reference: string;
  invoice_origin: string;
  invoice_line_ids: string;
  invoice_user_id: string;
  invoice_user_id_id: string;
  journal_id: string;
  journal_id_id: string;
  l10n_mx_edi_cfdi_uuid: string;
  l10n_mx_edi_payment_policy: string;
  l10n_mx_edi_usage: string;
  l10n_mx_edi_cfdi_state: string;
  create_date: string;
  write_date: string;
}

export interface OdooPayment {
  [key: string]: string;
  id: string;
  name: string;
  state: string;
  payment_type: string; // inbound | outbound
  partner_type: string;
  partner_id: string;
  partner_id_id: string;
  amount: string;
  currency_id: string;
  currency_id_id: string;
  journal_id: string;
  journal_id_id: string;
  payment_method_line_id: string;
  payment_method_id: string;
  date: string;
  reconciled_invoice_ids: string;
  reconciled_bill_ids: string;
  memo: string;
  l10n_mx_edi_cfdi_uuid: string;
}

export interface OdooSaleOrder {
  [key: string]: string;
  id: string;
  name: string;
  state: string; // draft | sent | sale | done | cancel
  partner_id: string;
  partner_id_id: string;
  date_order: string;
  validity_date: string;
  commitment_date: string;
  user_id: string;
  pricelist_id: string;
  payment_term_id: string;
  currency_id: string;
  amount_untaxed: string;
  amount_tax: string;
  amount_total: string;
  invoice_status: string; // no | to invoice | invoiced | upselling
  invoice_ids: string;
  order_line: string;
  note: string;
}

export interface OdooPurchaseOrder {
  [key: string]: string;
  id: string;
  name: string;
  state: string;
  partner_id: string;
  partner_id_id: string;
  date_order: string;
  amount_total: string;
  currency_id: string;
  invoice_status: string;
}

export interface OdooJournal {
  [key: string]: string;
  id: string;
  name: string;
  code: string;
  type: string;
  currency_id: string;
  bank_account_id: string;
}

// ── Cached readers ────────────────────────────────────────────────

const CACHE_TTL = 5 * 60 * 1000;
type Cache<T> = { data: T[] | null; ts: number };
const partnersCache: Cache<OdooPartner> = { data: null, ts: 0 };
const invoicesCache: Cache<OdooInvoice> = { data: null, ts: 0 };
const paymentsCache: Cache<OdooPayment> = { data: null, ts: 0 };
const salesCache: Cache<OdooSaleOrder> = { data: null, ts: 0 };
const journalsCache: Cache<OdooJournal> = { data: null, ts: 0 };

const fresh = <T>(c: Cache<T>) =>
  c.data !== null && Date.now() - c.ts < CACHE_TTL;

export const getOdooPartners = async (): Promise<OdooPartner[]> => {
  if (fresh(partnersCache)) return partnersCache.data!;
  partnersCache.data = await readSheet<OdooPartner>("Odoo_Partners");
  partnersCache.ts = Date.now();
  return partnersCache.data;
};

export const getOdooInvoices = async (): Promise<OdooInvoice[]> => {
  if (fresh(invoicesCache)) return invoicesCache.data!;
  invoicesCache.data = await readSheet<OdooInvoice>("Odoo_Invoices");
  invoicesCache.ts = Date.now();
  return invoicesCache.data;
};

export const getOdooPayments = async (): Promise<OdooPayment[]> => {
  if (fresh(paymentsCache)) return paymentsCache.data!;
  paymentsCache.data = await readSheet<OdooPayment>("Odoo_Payments");
  paymentsCache.ts = Date.now();
  return paymentsCache.data;
};

export const getOdooSaleOrders = async (): Promise<OdooSaleOrder[]> => {
  if (fresh(salesCache)) return salesCache.data!;
  salesCache.data = await readSheet<OdooSaleOrder>("Odoo_Sale_Orders");
  salesCache.ts = Date.now();
  return salesCache.data;
};

export const getOdooJournals = async (): Promise<OdooJournal[]> => {
  if (fresh(journalsCache)) return journalsCache.data!;
  journalsCache.data = await readSheet<OdooJournal>("Odoo_Journals");
  journalsCache.ts = Date.now();
  return journalsCache.data;
};

// ── Helpers ──────────────────────────────────────────────────────

const num = (s: string): number => {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};

// ── Customer 360 ─────────────────────────────────────────────────

export interface CustomerMetrics {
  totalInvoiced: number;
  totalInvoicedByCurrency: Record<string, number>;
  totalPaid: number;
  outstanding: number;
  outstandingByCurrency: Record<string, number>;
  invoiceCount: number;
  paidInvoiceCount: number;
  openInvoiceCount: number;
  quoteCount: number;
  orderCount: number;
  firstOrderDate: string | null;
  lastOrderDate: string | null;
  lastPaymentDate: string | null;
  paymentMethodsUsed: string[];
  currencies: string[];
}

export interface CustomerProfile {
  partner: OdooPartner;
  metrics: CustomerMetrics;
  invoices: OdooInvoice[];
  payments: OdooPayment[];
  orders: OdooSaleOrder[];
  openAR: OdooInvoice[];
}

export const getCustomerProfile = async (
  partnerIdInt: string
): Promise<CustomerProfile | null> => {
  const partners = await getOdooPartners();
  const partner = partners.find((p) => p.id === partnerIdInt);
  if (!partner) return null;

  const [invoices, payments, orders] = await Promise.all([
    getOdooInvoices(),
    getOdooPayments(),
    getOdooSaleOrders(),
  ]);

  const custInvoices = invoices.filter(
    (i) =>
      (i.partner_id_id === partnerIdInt ||
        i.commercial_partner_id_id === partnerIdInt) &&
      (i.move_type === "out_invoice" || i.move_type === "out_refund")
  );
  const custPayments = payments.filter(
    (p) => p.partner_id_id === partnerIdInt && p.payment_type === "inbound"
  );
  const custOrders = orders.filter((o) => o.partner_id_id === partnerIdInt);
  const openAR = custInvoices.filter(
    (i) =>
      i.state === "posted" &&
      (i.payment_state === "not_paid" || i.payment_state === "partial")
  );

  // Metrics. Refunds subtract from invoiced totals but add to "residual".
  const byCurrency = (
    rows: OdooInvoice[],
    field: keyof OdooInvoice,
    signedByType = false
  ) => {
    const out: Record<string, number> = {};
    for (const r of rows) {
      const cur = r.currency_id || "MXN";
      const sign = signedByType && r.move_type === "out_refund" ? -1 : 1;
      out[cur] = (out[cur] ?? 0) + num(r[field] as string) * sign;
    }
    return out;
  };

  const postedInvoices = custInvoices.filter((i) => i.state === "posted");
  const confirmedOrders = custOrders.filter(
    (o) => o.state === "sale" || o.state === "done"
  );
  const quotes = custOrders.filter(
    (o) => o.state === "draft" || o.state === "sent"
  );

  const orderDates = confirmedOrders
    .map((o) => o.date_order)
    .filter(Boolean)
    .sort();
  const paymentDates = custPayments
    .map((p) => p.date)
    .filter(Boolean)
    .sort();

  const methodsUsed = [
    ...new Set(custPayments.map((p) => p.journal_id).filter(Boolean)),
  ].sort();
  const currencies = [
    ...new Set(
      [...custInvoices, ...custPayments].map((r) => r.currency_id).filter(Boolean)
    ),
  ];

  const metrics: CustomerMetrics = {
    totalInvoiced: postedInvoices.reduce(
      (s, i) => s + num(i.amount_total) * (i.move_type === "out_refund" ? -1 : 1),
      0
    ),
    totalInvoicedByCurrency: byCurrency(postedInvoices, "amount_total", true),
    totalPaid: custPayments.reduce((s, p) => s + num(p.amount), 0),
    outstanding: openAR.reduce((s, i) => s + num(i.amount_residual), 0),
    outstandingByCurrency: byCurrency(openAR, "amount_residual"),
    invoiceCount: custInvoices.length,
    paidInvoiceCount: postedInvoices.filter((i) => i.payment_state === "paid").length,
    openInvoiceCount: openAR.length,
    quoteCount: quotes.length,
    orderCount: confirmedOrders.length,
    firstOrderDate: orderDates[0] ?? null,
    lastOrderDate: orderDates.at(-1) ?? null,
    lastPaymentDate: paymentDates.at(-1) ?? null,
    paymentMethodsUsed: methodsUsed,
    currencies,
  };

  return {
    partner,
    metrics,
    invoices: custInvoices.sort((a, b) =>
      (b.invoice_date || b.date).localeCompare(a.invoice_date || a.date)
    ),
    payments: custPayments.sort((a, b) => b.date.localeCompare(a.date)),
    orders: custOrders.sort((a, b) =>
      b.date_order.localeCompare(a.date_order)
    ),
    openAR,
  };
};

// ── List view: partners with rolled-up metrics ───────────────────

export interface CustomerListRow {
  id: string;
  name: string;
  display_name: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  isCompany: boolean;
  customerRank: number;
  supplierRank: number;
  vat: string;
  fiscalRegime: string;
  invoiceCount: number;
  orderCount: number;
  quoteCount: number;
  outstanding: number;
  outstandingCurrency: string;
  totalInvoiced: number;
  lastActivity: string | null;
}

export const getCustomerList = async (): Promise<CustomerListRow[]> => {
  const [partners, invoices, orders] = await Promise.all([
    getOdooPartners(),
    getOdooInvoices(),
    getOdooSaleOrders(),
  ]);

  // Index by partner_id_id for O(n) joins
  const invByPartner = new Map<string, OdooInvoice[]>();
  for (const i of invoices) {
    if (i.move_type !== "out_invoice" && i.move_type !== "out_refund") continue;
    const k = i.commercial_partner_id_id || i.partner_id_id;
    if (!k) continue;
    if (!invByPartner.has(k)) invByPartner.set(k, []);
    invByPartner.get(k)!.push(i);
  }
  const orderByPartner = new Map<string, OdooSaleOrder[]>();
  for (const o of orders) {
    const k = o.partner_id_id;
    if (!k) continue;
    if (!orderByPartner.has(k)) orderByPartner.set(k, []);
    orderByPartner.get(k)!.push(o);
  }

  return partners.map((p): CustomerListRow => {
    const ivs = invByPartner.get(p.id) ?? [];
    const ords = orderByPartner.get(p.id) ?? [];
    const openIvs = ivs.filter(
      (i) =>
        i.state === "posted" &&
        (i.payment_state === "not_paid" || i.payment_state === "partial")
    );
    const postedIvs = ivs.filter((i) => i.state === "posted");
    const outstanding = openIvs.reduce((s, i) => s + num(i.amount_residual), 0);
    const outstandingCurrency = openIvs[0]?.currency_id ?? "MXN";
    const quotes = ords.filter((o) => o.state === "draft" || o.state === "sent");
    const confirmed = ords.filter((o) => o.state === "sale" || o.state === "done");
    const activityDates = [
      ...ords.map((o) => o.date_order),
      ...ivs.map((i) => i.invoice_date || i.date),
    ].filter(Boolean).sort();
    return {
      id: p.id,
      name: p.name || p.display_name,
      display_name: p.display_name,
      email: p.email,
      phone: p.phone || p.mobile,
      city: p.city,
      country: p.country_id,
      isCompany: p.is_company === "True" || p.is_company === "true",
      customerRank: num(p.customer_rank),
      supplierRank: num(p.supplier_rank),
      vat: p.vat,
      fiscalRegime: p.l10n_mx_edi_fiscal_regime,
      invoiceCount: ivs.length,
      orderCount: confirmed.length,
      quoteCount: quotes.length,
      outstanding,
      outstandingCurrency,
      totalInvoiced: postedIvs.reduce(
        (s, i) => s + num(i.amount_total) * (i.move_type === "out_refund" ? -1 : 1),
        0
      ),
      lastActivity: activityDates.at(-1) ?? null,
    };
  });
};
