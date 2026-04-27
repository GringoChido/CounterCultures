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
  /**
   * Source document — typically the sale.order name (e.g. "S00078") that
   * triggered this purchase. Empty for POs created manually without an
   * upstream document. Used to join PO ↔ SO across the dashboard.
   */
  origin: string;
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

/**
 * Invalidates the in-memory mirrors. Called after a write to Odoo so the
 * next read for that scope hits the sheet (and ideally a fresh extraction).
 * Until a re-extract job runs, the freshly-written data won't appear in the
 * mirror — callers should append the new row to the relevant tab too.
 */
export const invalidateOdooCache = (
  scope: "partners" | "invoices" | "payments" | "sales" | "journals" | "all" = "all"
): void => {
  if (scope === "all" || scope === "partners") partnersCache.data = null;
  if (scope === "all" || scope === "invoices") invoicesCache.data = null;
  if (scope === "all" || scope === "payments") paymentsCache.data = null;
  if (scope === "all" || scope === "sales") salesCache.data = null;
  if (scope === "all" || scope === "journals") journalsCache.data = null;
};

// ── Helpers ──────────────────────────────────────────────────────

const num = (s: string): number => {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};

// Generic by-currency aggregator. Used by both customer and vendor
// profile metrics.
const sumByCurrency = (
  rows: { currency_id?: string; [k: string]: unknown }[],
  amountField: string,
  signFn?: (r: Record<string, unknown>) => number
): Record<string, number> => {
  const out: Record<string, number> = {};
  for (const r of rows) {
    const cur = (r.currency_id as string) || "MXN";
    const sign = signFn ? signFn(r as Record<string, unknown>) : 1;
    out[cur] = (out[cur] ?? 0) + num(r[amountField] as string) * sign;
  }
  return out;
};

// ── Vendor 360 ──────────────────────────────────────────────────
//
// Mirrors Customer 360 but for the supplier side: bills (in_invoice),
// outbound payments, purchase orders. A "vendor" is defined as any partner
// that appears on at least one purchase.order — supplier_rank in Odoo can
// be unreliable for legacy data, so we derive vendor-ness from actual PO
// activity. CC's vendors are mostly its 73 brands (Kohler, TOTO, Brizo, etc.)
// plus freight/customs counterparties.

export interface VendorMetrics {
  totalBilled: number;
  totalBilledByCurrency: Record<string, number>;
  totalPaid: number;
  totalPaidByCurrency: Record<string, number>;
  openAP: number;
  openAPByCurrency: Record<string, number>;
  billCount: number;
  paidBillCount: number;
  openBillCount: number;
  poCount: number;
  openPoCount: number;
  firstPoDate: string | null;
  lastPoDate: string | null;
  lastPaymentDate: string | null;
  paymentMethodsUsed: string[];
  currencies: string[];
}

export interface VendorProfile {
  partner: OdooPartner;
  metrics: VendorMetrics;
  bills: OdooInvoice[];
  payments: OdooPayment[];
  purchaseOrders: OdooPurchaseOrder[];
  openAP: OdooInvoice[];
  /** Parent company if this vendor record is a contact. */
  parent: OdooPartner | null;
  /** Child contacts (employees) under this vendor's company record. */
  children: OdooPartner[];
  /** AP aging buckets across this vendor's open bills, by currency. */
  aging: {
    current: Record<string, number>;
    "0-30": Record<string, number>;
    "30-60": Record<string, number>;
    "60-90": Record<string, number>;
    "90+": Record<string, number>;
    totalOpen: Record<string, number>;
  };
}

export const getVendorProfile = async (
  partnerIdInt: string
): Promise<VendorProfile | null> => {
  const partners = await getOdooPartners();
  const partner = partners.find((p) => p.id === partnerIdInt);
  if (!partner) return null;

  const [invoices, payments, purchaseOrders] = await Promise.all([
    getOdooInvoices(),
    getOdooPayments(),
    getOdooPurchaseOrders(),
  ]);

  // Vendor bills: in_invoice / in_refund where partner is this vendor.
  const vendorBills = invoices.filter(
    (i) =>
      (i.partner_id_id === partnerIdInt ||
        i.commercial_partner_id_id === partnerIdInt) &&
      (i.move_type === "in_invoice" || i.move_type === "in_refund")
  );

  // Outbound payments: payment_type=outbound to this vendor.
  const vendorPayments = payments.filter(
    (p) => p.partner_id_id === partnerIdInt && p.payment_type === "outbound"
  );

  const vendorPOs = purchaseOrders.filter(
    (p) => p.partner_id_id === partnerIdInt
  );

  const openAP = vendorBills.filter(
    (i) =>
      i.state === "posted" &&
      (i.payment_state === "not_paid" || i.payment_state === "partial")
  );

  const postedBills = vendorBills.filter((i) => i.state === "posted");
  const openPOs = vendorPOs.filter(
    (p) => p.state === "purchase" || p.state === "draft" || p.state === "sent"
  );

  const poDates = vendorPOs
    .map((p) => p.date_order)
    .filter(Boolean)
    .sort();
  const paymentDates = vendorPayments
    .map((p) => p.date)
    .filter(Boolean)
    .sort();

  const methodsUsed = [
    ...new Set(vendorPayments.map((p) => p.journal_id).filter(Boolean)),
  ].sort();
  const currencies = [
    ...new Set(
      [...vendorBills, ...vendorPayments].map((r) => r.currency_id).filter(Boolean)
    ),
  ];

  const metrics: VendorMetrics = {
    totalBilled: postedBills.reduce(
      (s, i) =>
        s + num(i.amount_total) * (i.move_type === "in_refund" ? -1 : 1),
      0
    ),
    totalBilledByCurrency: sumByCurrency(postedBills, "amount_total", (r) =>
      r.move_type === "in_refund" ? -1 : 1
    ),
    totalPaid: vendorPayments.reduce((s, p) => s + num(p.amount), 0),
    totalPaidByCurrency: sumByCurrency(vendorPayments, "amount"),
    openAP: openAP.reduce((s, i) => s + num(i.amount_residual), 0),
    openAPByCurrency: sumByCurrency(openAP, "amount_residual"),
    billCount: vendorBills.length,
    paidBillCount: vendorBills.filter((i) => i.payment_state === "paid").length,
    openBillCount: openAP.length,
    poCount: vendorPOs.length,
    openPoCount: openPOs.length,
    firstPoDate: poDates[0] ?? null,
    lastPoDate: poDates[poDates.length - 1] ?? null,
    lastPaymentDate: paymentDates[paymentDates.length - 1] ?? null,
    paymentMethodsUsed: methodsUsed,
    currencies,
  };

  // Hierarchy — same shape as customer side.
  const splitIds = (raw: string): string[] =>
    raw.split(/[,|]/).map((s) => s.trim()).filter(Boolean);
  const parent = partner.parent_id_id
    ? partners.find((p) => p.id === partner.parent_id_id) ?? null
    : null;
  const childIdSet = new Set(splitIds(partner.child_ids));
  const children = partners.filter((p) => childIdSet.has(p.id));

  return {
    partner,
    metrics,
    bills: vendorBills,
    payments: vendorPayments,
    purchaseOrders: vendorPOs,
    openAP,
    parent,
    children,
    aging: computePartnerAging(openAP),
  };
};

export interface VendorListRow {
  partnerId: string;
  partnerName: string;
  email: string;
  phone: string;
  poCount: number;
  openPoCount: number;
  totalBilledByCurrency: Record<string, number>;
  openAPByCurrency: Record<string, number>;
  lastPoDate: string | null;
}

/**
 * Returns all partners that appear as vendor on any PO. Uses PO activity
 * (not supplier_rank) as the source of truth for vendor-ness, since the
 * mirror's rank field is unreliable for legacy partners.
 */
export const getVendorList = async (): Promise<VendorListRow[]> => {
  const [partners, purchaseOrders, invoices] = await Promise.all([
    getOdooPartners(),
    getOdooPurchaseOrders(),
    getOdooInvoices(),
  ]);

  // Group POs by partner_id_id once for efficiency.
  const posByPartner = new Map<string, OdooPurchaseOrder[]>();
  for (const po of purchaseOrders) {
    if (!po.partner_id_id) continue;
    const list = posByPartner.get(po.partner_id_id) ?? [];
    list.push(po);
    posByPartner.set(po.partner_id_id, list);
  }

  // Group vendor bills the same way.
  const billsByPartner = new Map<string, OdooInvoice[]>();
  for (const inv of invoices) {
    if (
      (inv.move_type === "in_invoice" || inv.move_type === "in_refund") &&
      inv.partner_id_id
    ) {
      const list = billsByPartner.get(inv.partner_id_id) ?? [];
      list.push(inv);
      billsByPartner.set(inv.partner_id_id, list);
    }
  }

  const rows: VendorListRow[] = [];
  for (const [partnerId, pos] of posByPartner) {
    const partner = partners.find((p) => p.id === partnerId);
    if (!partner) continue;
    const bills = billsByPartner.get(partnerId) ?? [];
    const postedBills = bills.filter((b) => b.state === "posted");
    const openAP = postedBills.filter(
      (b) => b.payment_state === "not_paid" || b.payment_state === "partial"
    );
    const openPOs = pos.filter(
      (p) => p.state === "purchase" || p.state === "draft" || p.state === "sent"
    );
    const dates = pos.map((p) => p.date_order).filter(Boolean).sort();

    rows.push({
      partnerId,
      partnerName: partner.name,
      email: partner.email,
      phone: partner.phone,
      poCount: pos.length,
      openPoCount: openPOs.length,
      totalBilledByCurrency: sumByCurrency(postedBills, "amount_total", (r) =>
        r.move_type === "in_refund" ? -1 : 1
      ),
      openAPByCurrency: sumByCurrency(openAP, "amount_residual"),
      lastPoDate: dates[dates.length - 1] ?? null,
    });
  }

  return rows.sort((a, b) => b.poCount - a.poCount);
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
  /** Parent company if this partner is a contact under one. */
  parent: OdooPartner | null;
  /** Child contacts if this partner is a company. */
  children: OdooPartner[];
  /** AR aging buckets across this customer's open invoices, by currency. */
  aging: {
    current: Record<string, number>;
    "0-30": Record<string, number>;
    "30-60": Record<string, number>;
    "60-90": Record<string, number>;
    "90+": Record<string, number>;
    totalOpen: Record<string, number>;
  };
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

  // Hierarchy lookup — parent company + child contacts.
  // child_ids is stored pipe- or comma-delimited at extraction; handle both.
  const splitIds = (raw: string): string[] =>
    raw
      .split(/[,|]/)
      .map((s) => s.trim())
      .filter(Boolean);

  const parent = partner.parent_id_id
    ? partners.find((p) => p.id === partner.parent_id_id) ?? null
    : null;
  const childIdSet = new Set(splitIds(partner.child_ids));
  const children = partners.filter((p) => childIdSet.has(p.id));

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
    parent,
    children,
    aging: computePartnerAging(openAR),
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

// ── Inventory: stock quants + locations ──────────────────────────

export interface OdooStockQuant {
  [key: string]: string;
  id: string;
  product_id: string;
  product_id_id: string;
  location_id: string;
  location_id_id: string;
  quantity: string;
  reserved_quantity: string;
  available_quantity: string;
  inventory_date: string;
  in_date: string;
  lot_id: string;
  product_uom_id: string;
}

const stockQuantsCache: Cache<OdooStockQuant> = { data: null, ts: 0 };

export const getOdooStockQuants = async (): Promise<OdooStockQuant[]> => {
  if (fresh(stockQuantsCache)) return stockQuantsCache.data!;
  stockQuantsCache.data = await readSheet<OdooStockQuant>("Odoo_Stock_Quants");
  stockQuantsCache.ts = Date.now();
  return stockQuantsCache.data;
};

export interface InventoryRow {
  id: string;
  productId: string;
  productName: string;
  locationId: string;
  locationName: string;
  onHand: number;
  reserved: number;
  available: number;
  inDate: string; // when it arrived
  lotId: string;
}

const toInventoryRow = (q: OdooStockQuant): InventoryRow => ({
  id: q.id,
  productId: q.product_id_id,
  productName: q.product_id || "",
  locationId: q.location_id_id,
  locationName: q.location_id || "",
  onHand: num(q.quantity),
  reserved: num(q.reserved_quantity),
  available: num(q.available_quantity) || num(q.quantity) - num(q.reserved_quantity),
  inDate: (q.in_date || "").slice(0, 10),
  lotId: q.lot_id || "",
});

export interface InventorySummary {
  totalUnits: number;
  totalProducts: number;
  totalLocations: number;
  lowStock: number;
  outOfStock: number;
  byLocation: Array<{
    name: string;
    locationId: string;
    productCount: number;
    totalUnits: number;
  }>;
}

export interface InventoryListFilters {
  q?: string;
  locationId?: string;
  lowStockOnly?: boolean;
  outOfStockOnly?: boolean;
  sort?: "product" | "location" | "onhand_desc" | "onhand_asc" | "in_date_desc";
  limit?: number;
  offset?: number;
}

export interface InventoryListResult {
  items: InventoryRow[];
  total: number;
  offset: number;
  limit: number;
  summary: InventorySummary;
}

export const getInventoryList = async (
  filters: InventoryListFilters = {}
): Promise<InventoryListResult> => {
  const {
    q = "",
    locationId,
    lowStockOnly,
    outOfStockOnly,
    sort = "product",
    limit = 500,
    offset = 0,
  } = filters;

  const quants = await getOdooStockQuants();
  const rows = quants.map(toInventoryRow);

  // Summary
  const locAgg = new Map<string, { name: string; locationId: string; productSet: Set<string>; totalUnits: number }>();
  const uniqueProducts = new Set<string>();
  let lowStock = 0;
  let outOfStock = 0;
  for (const r of rows) {
    uniqueProducts.add(r.productId);
    if (r.onHand <= 0) outOfStock++;
    else if (r.onHand < 5) lowStock++;
    const key = r.locationId || r.locationName;
    let l = locAgg.get(key);
    if (!l) {
      l = { name: r.locationName, locationId: r.locationId, productSet: new Set(), totalUnits: 0 };
      locAgg.set(key, l);
    }
    l.productSet.add(r.productId);
    l.totalUnits += r.onHand;
  }
  const summary: InventorySummary = {
    totalUnits: rows.reduce((s, r) => s + r.onHand, 0),
    totalProducts: uniqueProducts.size,
    totalLocations: locAgg.size,
    lowStock,
    outOfStock,
    byLocation: [...locAgg.values()]
      .map((l) => ({
        name: l.name,
        locationId: l.locationId,
        productCount: l.productSet.size,
        totalUnits: l.totalUnits,
      }))
      .sort((a, b) => b.totalUnits - a.totalUnits),
  };

  // Filter
  let filtered = rows;
  if (locationId) filtered = filtered.filter((r) => r.locationId === locationId);
  if (lowStockOnly) filtered = filtered.filter((r) => r.onHand > 0 && r.onHand < 5);
  if (outOfStockOnly) filtered = filtered.filter((r) => r.onHand <= 0);
  if (q) {
    const needle = q.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.productName.toLowerCase().includes(needle) ||
        r.lotId.toLowerCase().includes(needle)
    );
  }

  const cmp = (a: InventoryRow, b: InventoryRow) => {
    if (sort === "location") return a.locationName.localeCompare(b.locationName) || a.productName.localeCompare(b.productName);
    if (sort === "onhand_desc") return b.onHand - a.onHand;
    if (sort === "onhand_asc") return a.onHand - b.onHand;
    if (sort === "in_date_desc") return (b.inDate || "").localeCompare(a.inDate || "");
    return a.productName.localeCompare(b.productName);
  };
  filtered.sort(cmp);

  return {
    items: filtered.slice(offset, offset + limit),
    total: filtered.length,
    offset,
    limit,
    summary,
  };
};

// ── Purchase Orders: list, pipeline, detail ──────────────────────

export interface OdooPurchaseOrderLine {
  [key: string]: string;
  id: string;
  order_id: string;
  order_id_id: string;
  partner_id: string;
  product_id: string;
  product_id_id: string;
  name: string;
  product_qty: string;
  qty_received: string;
  qty_invoiced: string;
  price_unit: string;
  discount: string;
  price_subtotal: string;
  price_tax: string;
  price_total: string;
  date_planned: string;
  sequence: string;
}

const purchaseOrdersCache: Cache<OdooPurchaseOrder> = { data: null, ts: 0 };
const purchaseLinesCache: Cache<OdooPurchaseOrderLine> = { data: null, ts: 0 };

export const getOdooPurchaseOrders = async (): Promise<OdooPurchaseOrder[]> => {
  if (fresh(purchaseOrdersCache)) return purchaseOrdersCache.data!;
  purchaseOrdersCache.data = await readSheet<OdooPurchaseOrder>("Odoo_Purchase_Orders");
  purchaseOrdersCache.ts = Date.now();
  return purchaseOrdersCache.data;
};

export const getOdooPurchaseOrderLines = async (): Promise<OdooPurchaseOrderLine[]> => {
  if (fresh(purchaseLinesCache)) return purchaseLinesCache.data!;
  purchaseLinesCache.data = await readSheet<OdooPurchaseOrderLine>("Odoo_Purchase_Order_Lines");
  purchaseLinesCache.ts = Date.now();
  return purchaseLinesCache.data;
};

export type POStateFilter = "all" | "draft" | "sent" | "purchase" | "done" | "cancel";
export type POInvoiceFilter = "all" | "no" | "to invoice" | "invoiced";

export interface POListRow {
  id: string;
  name: string;
  state: string;
  vendorId: string;
  vendorName: string;
  currency: string;
  dateOrder: string;
  amountTotal: number;
  invoiceStatus: string;
  daysOpen: number;
  isOverdue: boolean; // past date_planned and not done
}

const toPORow = (p: OdooPurchaseOrder, now: Date = today()): POListRow => {
  const days = p.date_order ? daysBetween(p.date_order, now) : 0;
  const isOpen = p.state === "purchase" || p.state === "sent" || p.state === "draft";
  return {
    id: p.id,
    name: p.name,
    state: p.state,
    vendorId: p.partner_id_id,
    vendorName: p.partner_id,
    currency: p.currency_id || "USD",
    dateOrder: (p.date_order || "").slice(0, 10),
    amountTotal: num(p.amount_total),
    invoiceStatus: p.invoice_status || "",
    daysOpen: days,
    isOverdue: isOpen && days > 60, // open >60d is "stuck"
  };
};

export interface POPipelineSummary {
  draft: { count: number; totalByCurrency: Record<string, number> };
  sent: { count: number; totalByCurrency: Record<string, number> };
  purchase: { count: number; totalByCurrency: Record<string, number> };
  done: { count: number; totalByCurrency: Record<string, number> };
  cancel: { count: number; totalByCurrency: Record<string, number> };
  awaitingInvoice: { count: number; totalByCurrency: Record<string, number> };
  stuck: { count: number; totalByCurrency: Record<string, number> };
}

export interface POListFilters {
  q?: string;
  state?: POStateFilter;
  invoiceStatus?: POInvoiceFilter;
  vendorId?: string;
  stuckOnly?: boolean;
  limit?: number;
  offset?: number;
  sort?: "date_desc" | "date_asc" | "total_desc" | "days_open_desc" | "vendor";
}

export interface POListResult {
  orders: POListRow[];
  total: number;
  offset: number;
  limit: number;
  pipeline: POPipelineSummary;
}

export const getPurchaseOrderList = async (
  filters: POListFilters = {}
): Promise<POListResult> => {
  const {
    q = "",
    state = "all",
    invoiceStatus = "all",
    vendorId,
    stuckOnly,
    limit = 200,
    offset = 0,
    sort = "date_desc",
  } = filters;

  const now = today();
  const allPOs = await getOdooPurchaseOrders();
  const rows = allPOs.map((p) => toPORow(p, now));

  // Pipeline
  const addBy = (b: Record<string, number>, cur: string, amt: number) => {
    b[cur] = (b[cur] ?? 0) + amt;
  };
  const pipeline: POPipelineSummary = {
    draft:            { count: 0, totalByCurrency: {} },
    sent:             { count: 0, totalByCurrency: {} },
    purchase:         { count: 0, totalByCurrency: {} },
    done:             { count: 0, totalByCurrency: {} },
    cancel:           { count: 0, totalByCurrency: {} },
    awaitingInvoice:  { count: 0, totalByCurrency: {} },
    stuck:            { count: 0, totalByCurrency: {} },
  };
  for (const r of rows) {
    const bucket = (pipeline as unknown as Record<string, { count: number; totalByCurrency: Record<string, number> }>)[r.state];
    if (bucket) {
      bucket.count++;
      addBy(bucket.totalByCurrency, r.currency, r.amountTotal);
    }
    if (r.invoiceStatus === "to invoice") {
      pipeline.awaitingInvoice.count++;
      addBy(pipeline.awaitingInvoice.totalByCurrency, r.currency, r.amountTotal);
    }
    if (r.isOverdue) {
      pipeline.stuck.count++;
      addBy(pipeline.stuck.totalByCurrency, r.currency, r.amountTotal);
    }
  }

  let filtered = rows;
  if (state !== "all") filtered = filtered.filter((r) => r.state === state);
  if (invoiceStatus !== "all") filtered = filtered.filter((r) => r.invoiceStatus === invoiceStatus);
  if (vendorId) filtered = filtered.filter((r) => r.vendorId === vendorId);
  if (stuckOnly) filtered = filtered.filter((r) => r.isOverdue);
  if (q) {
    const needle = q.toLowerCase();
    filtered = filtered.filter((r) =>
      `${r.name} ${r.vendorName}`.toLowerCase().includes(needle)
    );
  }

  const cmp = (a: POListRow, b: POListRow) => {
    if (sort === "date_asc") return a.dateOrder.localeCompare(b.dateOrder);
    if (sort === "total_desc") return b.amountTotal - a.amountTotal;
    if (sort === "days_open_desc") return b.daysOpen - a.daysOpen;
    if (sort === "vendor") return a.vendorName.localeCompare(b.vendorName);
    return b.dateOrder.localeCompare(a.dateOrder);
  };
  filtered.sort(cmp);

  return {
    orders: filtered.slice(offset, offset + limit),
    total: filtered.length,
    offset,
    limit,
    pipeline,
  };
};

export interface PurchaseOrderDetail {
  order: POListRow & { rawState: string };
  rawOrder: OdooPurchaseOrder;
  /**
   * The sale.order this PO was created to fulfill, joined via
   * purchase.order.origin → sale.order.name. Null when the PO has no origin
   * (manual entry) or origin references a non-sale-order document.
   */
  linkedSaleOrder: OdooSaleOrder | null;
  lines: OdooPurchaseOrderLine[];
  bills: OdooInvoice[];
}

export const getPurchaseOrderDetail = async (
  orderId: string
): Promise<PurchaseOrderDetail | null> => {
  const [pos, lines, invoices, saleOrders] = await Promise.all([
    getOdooPurchaseOrders(),
    getOdooPurchaseOrderLines(),
    getOdooInvoices(),
    getOdooSaleOrders(),
  ]);
  const p = pos.find((x) => x.id === orderId);
  if (!p) return null;

  const poLines = lines
    .filter((l) => l.order_id_id === orderId)
    .sort((a, b) => Number(a.sequence || 0) - Number(b.sequence || 0));

  // Bills: account.move where move_type is in_invoice and invoice_origin == PO name
  const bills = invoices.filter(
    (i) =>
      (i.move_type === "in_invoice" || i.move_type === "in_refund") &&
      i.invoice_origin === p.name
  );

  // PO → SO linkage: purchase.order.origin holds the source document name.
  // Typically that's a sale.order name (e.g. "S00078"); look it up by name.
  // Returns null when the PO has no origin OR when the origin references a
  // non-sale-order document (manufacturing order, stock picking, etc.).
  const linkedSaleOrder = p.origin
    ? saleOrders.find((s) => s.name === p.origin) ?? null
    : null;

  const row = toPORow(p);
  return {
    order: { ...row, rawState: p.state },
    rawOrder: p,
    lines: poLines,
    bills,
    linkedSaleOrder,
  };
};

// ── Payments: list, summary, detail ──────────────────────────────

export type PaymentTypeFilter = "all" | "inbound" | "outbound";
export type PaymentStateFilterPay = "all" | "draft" | "posted" | "cancel" | "sent";

export interface PaymentListRow {
  id: string;
  name: string;
  state: string;
  paymentType: string; // inbound | outbound
  partnerId: string;
  partnerName: string;
  amount: number;
  currency: string;
  journalName: string;
  journalId: string;
  methodName: string;
  date: string;
  memo: string;
  cfdiUuid: string;
  reconciledInvoiceCount: number;
  reconciledBillCount: number;
}

const toPaymentRow = (p: OdooPayment): PaymentListRow => {
  const invoiceIds = (p.reconciled_invoice_ids || "")
    .split(",").map((s) => s.trim()).filter(Boolean);
  const billIds = (p.reconciled_bill_ids || "")
    .split(",").map((s) => s.trim()).filter(Boolean);
  return {
    id: p.id,
    name: p.name,
    state: p.state,
    paymentType: p.payment_type,
    partnerId: p.partner_id_id,
    partnerName: p.partner_id || "",
    amount: num(p.amount),
    currency: p.currency_id || "MXN",
    journalName: p.journal_id || "",
    journalId: p.journal_id_id || "",
    methodName: p.payment_method_line_id || p.payment_method_id || "",
    date: (p.date || "").slice(0, 10),
    memo: p.memo || "",
    cfdiUuid: p.l10n_mx_edi_cfdi_uuid || "",
    reconciledInvoiceCount: invoiceIds.length,
    reconciledBillCount: billIds.length,
  };
};

export interface PaymentListFilters {
  q?: string;
  paymentType?: PaymentTypeFilter;
  state?: PaymentStateFilterPay;
  journalId?: string;
  partnerId?: string;
  currency?: string;
  since?: string; // ISO date
  until?: string;
  limit?: number;
  offset?: number;
  sort?: "date_desc" | "date_asc" | "amount_desc" | "partner";
}

export interface JournalSummary {
  name: string;
  journalId: string;
  count: number;
  totalByCurrency: Record<string, number>;
  inboundByCurrency: Record<string, number>;
  outboundByCurrency: Record<string, number>;
  lastDate: string;
}

export interface PaymentsSummary {
  inbound: { count: number; totalByCurrency: Record<string, number> };
  outbound: { count: number; totalByCurrency: Record<string, number> };
  last30Inbound: Record<string, number>;
  last30Outbound: Record<string, number>;
  journals: JournalSummary[]; // sorted by count desc
  totalPayments: number;
  unreconciledCount: number;
}

export interface PaymentListResult {
  payments: PaymentListRow[];
  total: number;
  offset: number;
  limit: number;
  summary: PaymentsSummary;
}

const dayOffsetISO = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
};

export const getPaymentList = async (
  filters: PaymentListFilters = {}
): Promise<PaymentListResult> => {
  const {
    q = "",
    paymentType = "all",
    state = "all",
    journalId,
    partnerId,
    currency,
    since,
    until,
    limit = 200,
    offset = 0,
    sort = "date_desc",
  } = filters;

  const all = await getOdooPayments();
  const rows = all.map(toPaymentRow);

  // Summary — always over full set
  const addBy = (b: Record<string, number>, cur: string, amt: number) => {
    b[cur] = (b[cur] ?? 0) + amt;
  };
  const since30 = dayOffsetISO(30);
  const journalAgg = new Map<string, JournalSummary>();
  const summary: PaymentsSummary = {
    inbound:  { count: 0, totalByCurrency: {} },
    outbound: { count: 0, totalByCurrency: {} },
    last30Inbound:  {},
    last30Outbound: {},
    journals: [],
    totalPayments: rows.length,
    unreconciledCount: 0,
  };
  for (const r of rows) {
    if (r.paymentType === "inbound") {
      summary.inbound.count++;
      addBy(summary.inbound.totalByCurrency, r.currency, r.amount);
      if (r.date >= since30) addBy(summary.last30Inbound, r.currency, r.amount);
    } else if (r.paymentType === "outbound") {
      summary.outbound.count++;
      addBy(summary.outbound.totalByCurrency, r.currency, r.amount);
      if (r.date >= since30) addBy(summary.last30Outbound, r.currency, r.amount);
    }
    if (r.state === "posted" && r.reconciledInvoiceCount === 0 && r.reconciledBillCount === 0) {
      summary.unreconciledCount++;
    }
    // Journal aggregation
    const key = r.journalId || r.journalName || "unknown";
    let j = journalAgg.get(key);
    if (!j) {
      j = {
        name: r.journalName || "Unknown",
        journalId: r.journalId,
        count: 0,
        totalByCurrency: {},
        inboundByCurrency: {},
        outboundByCurrency: {},
        lastDate: "",
      };
      journalAgg.set(key, j);
    }
    j.count++;
    addBy(j.totalByCurrency, r.currency, r.amount);
    if (r.paymentType === "inbound")  addBy(j.inboundByCurrency,  r.currency, r.amount);
    if (r.paymentType === "outbound") addBy(j.outboundByCurrency, r.currency, r.amount);
    if (r.date > j.lastDate) j.lastDate = r.date;
  }
  summary.journals = [...journalAgg.values()].sort((a, b) => b.count - a.count);

  // Filter
  let filtered = rows;
  if (paymentType !== "all") filtered = filtered.filter((r) => r.paymentType === paymentType);
  if (state !== "all")        filtered = filtered.filter((r) => r.state === state);
  if (journalId)              filtered = filtered.filter((r) => r.journalId === journalId);
  if (partnerId)              filtered = filtered.filter((r) => r.partnerId === partnerId);
  if (currency)               filtered = filtered.filter((r) => r.currency === currency);
  if (since)                  filtered = filtered.filter((r) => r.date >= since);
  if (until)                  filtered = filtered.filter((r) => r.date <= until);
  if (q) {
    const needle = q.toLowerCase();
    filtered = filtered.filter((r) =>
      `${r.name} ${r.partnerName} ${r.memo} ${r.cfdiUuid} ${r.journalName}`.toLowerCase().includes(needle)
    );
  }

  const cmp = (a: PaymentListRow, b: PaymentListRow) => {
    if (sort === "date_asc")   return a.date.localeCompare(b.date);
    if (sort === "amount_desc") return b.amount - a.amount;
    if (sort === "partner")    return a.partnerName.localeCompare(b.partnerName);
    return b.date.localeCompare(a.date);
  };
  filtered.sort(cmp);

  return {
    payments: filtered.slice(offset, offset + limit),
    total: filtered.length,
    offset,
    limit,
    summary,
  };
};

export interface PaymentDetail {
  payment: PaymentListRow & { rawState: string };
  rawPayment: OdooPayment;
  invoices: OdooInvoice[];
  bills: OdooInvoice[];
}

export const getPaymentDetail = async (paymentId: string): Promise<PaymentDetail | null> => {
  const [payments, allInvoices] = await Promise.all([
    getOdooPayments(),
    getOdooInvoices(),
  ]);
  const p = payments.find((x) => x.id === paymentId);
  if (!p) return null;

  const invoiceIds = new Set(
    (p.reconciled_invoice_ids || "").split(",").map((s) => s.trim()).filter(Boolean)
  );
  const billIds = new Set(
    (p.reconciled_bill_ids || "").split(",").map((s) => s.trim()).filter(Boolean)
  );
  const invoices = allInvoices.filter((i) => invoiceIds.has(i.id));
  const bills    = allInvoices.filter((i) => billIds.has(i.id));

  const row = toPaymentRow(p);
  return {
    payment: { ...row, rawState: p.state },
    rawPayment: p,
    invoices,
    bills,
  };
};

// ── Sale Order Lines ─────────────────────────────────────────────

export interface OdooSaleOrderLine {
  [key: string]: string;
  id: string;
  order_id: string;
  order_id_id: string;
  order_partner_id: string;
  product_id: string;
  product_id_id: string;
  product_uom_qty: string;
  qty_delivered: string;
  qty_invoiced: string;
  price_unit: string;
  discount: string;
  price_subtotal: string;
  price_tax: string;
  price_total: string;
  currency_id: string;
  name: string;
  sequence: string;
}

const saleOrderLinesCache: Cache<OdooSaleOrderLine> = { data: null, ts: 0 };

export const getOdooSaleOrderLines = async (): Promise<OdooSaleOrderLine[]> => {
  if (fresh(saleOrderLinesCache)) return saleOrderLinesCache.data!;
  saleOrderLinesCache.data = await readSheet<OdooSaleOrderLine>(
    "Odoo_Sale_Order_Lines"
  );
  saleOrderLinesCache.ts = Date.now();
  return saleOrderLinesCache.data;
};

// ── Sale Order list + detail ─────────────────────────────────────

export type OrderStateFilter =
  | "all"
  | "quote"           // draft + sent
  | "draft"
  | "sent"
  | "sale"            // confirmed
  | "done"
  | "cancel";

export type InvoiceStatusFilter =
  | "all"
  | "no"
  | "to invoice"
  | "invoiced"
  | "upselling";

export interface OrderListRow {
  id: string;
  name: string;
  state: string;
  partnerId: string;
  partnerName: string;
  salesperson: string;
  pricelist: string;
  paymentTerm: string;
  currency: string;
  dateOrder: string;
  validityDate: string;
  commitmentDate: string;
  amountUntaxed: number;
  amountTax: number;
  amountTotal: number;
  invoiceStatus: string;
  linkedInvoiceCount: number;
  daysOpen: number;
  isStale: boolean; // quote sitting too long
  origin: string;
}

const toOrderListRow = (
  o: OdooSaleOrder,
  now: Date = today(),
  invoiceIndex: Map<string, number> = new Map()
): OrderListRow => {
  const invoiceIds = (o.invoice_ids || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const linkedInvoiceCount = invoiceIds.length;
  const days = o.date_order ? daysBetween(o.date_order, now) : 0;
  const isQuote = o.state === "draft" || o.state === "sent";
  return {
    id: o.id,
    name: o.name,
    state: o.state,
    partnerId: o.partner_id_id,
    partnerName: o.partner_id,
    salesperson: o.user_id || "",
    pricelist: o.pricelist_id || "",
    paymentTerm: o.payment_term_id || "",
    currency: o.currency_id || "MXN",
    dateOrder: (o.date_order || "").slice(0, 10),
    validityDate: (o.validity_date || "").slice(0, 10),
    commitmentDate: (o.commitment_date || "").slice(0, 10),
    amountUntaxed: num(o.amount_untaxed),
    amountTax: num(o.amount_tax),
    amountTotal: num(o.amount_total),
    invoiceStatus: o.invoice_status || "",
    linkedInvoiceCount: invoiceIndex.get(o.id) ?? linkedInvoiceCount,
    daysOpen: days,
    isStale: isQuote && days > 30,
    origin: "",
  };
};

export interface OrderListFilters {
  q?: string;
  state?: OrderStateFilter;
  invoiceStatus?: InvoiceStatusFilter;
  partnerId?: string;
  staleOnly?: boolean;
  limit?: number;
  offset?: number;
  sort?: "date_desc" | "date_asc" | "total_desc" | "days_open_desc" | "partner";
}

export interface OrderPipelineSummary {
  draft: { count: number; totalByCurrency: Record<string, number> };
  sent: { count: number; totalByCurrency: Record<string, number> };
  sale: { count: number; totalByCurrency: Record<string, number> };
  done: { count: number; totalByCurrency: Record<string, number> };
  cancel: { count: number; totalByCurrency: Record<string, number> };
  toInvoice: { count: number; totalByCurrency: Record<string, number> };
  staleQuotes: { count: number; totalByCurrency: Record<string, number> };
}

export interface OrderListResult {
  orders: OrderListRow[];
  total: number;
  offset: number;
  limit: number;
  pipeline: OrderPipelineSummary;
}

export const getOrderList = async (
  filters: OrderListFilters = {}
): Promise<OrderListResult> => {
  const {
    q = "",
    state = "all",
    invoiceStatus = "all",
    partnerId,
    staleOnly,
    limit = 200,
    offset = 0,
    sort = "date_desc",
  } = filters;

  const now = today();
  const orders = await getOdooSaleOrders();

  // Build an invoice_ids -> count index by splitting comma-joined references
  const invoiceIndex = new Map<string, number>();
  for (const o of orders) {
    const ids = (o.invoice_ids || "").split(",").map((s) => s.trim()).filter(Boolean);
    invoiceIndex.set(o.id, ids.length);
  }

  const allRows = orders.map((o) => toOrderListRow(o, now, invoiceIndex));

  // Pipeline summary (always computed over the full set)
  const addBy = (bucket: Record<string, number>, cur: string, amt: number) => {
    bucket[cur] = (bucket[cur] ?? 0) + amt;
  };
  const pipeline: OrderPipelineSummary = {
    draft:        { count: 0, totalByCurrency: {} },
    sent:         { count: 0, totalByCurrency: {} },
    sale:         { count: 0, totalByCurrency: {} },
    done:         { count: 0, totalByCurrency: {} },
    cancel:       { count: 0, totalByCurrency: {} },
    toInvoice:    { count: 0, totalByCurrency: {} },
    staleQuotes:  { count: 0, totalByCurrency: {} },
  };
  for (const r of allRows) {
    const bucket = (pipeline as unknown as Record<string, { count: number; totalByCurrency: Record<string, number> }>)[r.state];
    if (bucket) {
      bucket.count++;
      addBy(bucket.totalByCurrency, r.currency, r.amountTotal);
    }
    if (r.invoiceStatus === "to invoice") {
      pipeline.toInvoice.count++;
      addBy(pipeline.toInvoice.totalByCurrency, r.currency, r.amountTotal);
    }
    if (r.isStale) {
      pipeline.staleQuotes.count++;
      addBy(pipeline.staleQuotes.totalByCurrency, r.currency, r.amountTotal);
    }
  }

  let filtered = allRows;

  if (state !== "all") {
    if (state === "quote") {
      filtered = filtered.filter((r) => r.state === "draft" || r.state === "sent");
    } else {
      filtered = filtered.filter((r) => r.state === state);
    }
  }

  if (invoiceStatus !== "all") {
    filtered = filtered.filter((r) => r.invoiceStatus === invoiceStatus);
  }

  if (partnerId) {
    filtered = filtered.filter((r) => r.partnerId === partnerId);
  }

  if (staleOnly) {
    filtered = filtered.filter((r) => r.isStale);
  }

  if (q) {
    const needle = q.toLowerCase();
    filtered = filtered.filter((r) =>
      `${r.name} ${r.partnerName} ${r.salesperson}`.toLowerCase().includes(needle)
    );
  }

  const cmp = (a: OrderListRow, b: OrderListRow) => {
    if (sort === "date_asc") return a.dateOrder.localeCompare(b.dateOrder);
    if (sort === "total_desc") return b.amountTotal - a.amountTotal;
    if (sort === "days_open_desc") return b.daysOpen - a.daysOpen;
    if (sort === "partner") return a.partnerName.localeCompare(b.partnerName);
    return b.dateOrder.localeCompare(a.dateOrder);
  };
  filtered.sort(cmp);

  return {
    orders: filtered.slice(offset, offset + limit),
    total: filtered.length,
    offset,
    limit,
    pipeline,
  };
};

export interface OrderDetail {
  order: OrderListRow & { rawState: string };
  rawOrder: OdooSaleOrder;
  lines: OdooSaleOrderLine[];
  invoices: OdooInvoice[];
  /**
   * POs that were created to fulfill this sale order — joined via
   * purchase.order.origin === sale.order.name. One SO can drive multiple
   * POs (one per vendor); empty array when nothing's been ordered yet.
   */
  purchaseOrders: OdooPurchaseOrder[];
  /**
   * Customer's email + phone + language code, looked up via partner_id_id
   * on the SO. Surfaced for follow-up actions (compose email, WhatsApp,
   * auto-pick template language). Empty strings when the customer record
   * has no contact info. `partnerLang` is an Odoo locale string like
   * "en_US" or "es_MX"; consumers typically just check for "es" prefix.
   */
  partnerEmail: string;
  partnerPhone: string;
  partnerLang: string;
}

export const getOrderDetail = async (orderId: string): Promise<OrderDetail | null> => {
  const [orders, lines, invoices, purchaseOrders, partners] = await Promise.all([
    getOdooSaleOrders(),
    getOdooSaleOrderLines(),
    getOdooInvoices(),
    getOdooPurchaseOrders(),
    getOdooPartners(),
  ]);
  const o = orders.find((x) => x.id === orderId);
  if (!o) return null;

  const orderLines = lines
    .filter((l) => l.order_id_id === orderId)
    .sort((a, b) => Number(a.sequence || 0) - Number(b.sequence || 0));

  // Linked invoices: invoice.invoice_origin === order.name
  // OR order.invoice_ids contains the invoice id.
  const idSet = new Set(
    (o.invoice_ids || "").split(",").map((s) => s.trim()).filter(Boolean)
  );
  const linkedInvoices = invoices.filter(
    (i) => idSet.has(i.id) || (i.invoice_origin && i.invoice_origin === o.name)
  );

  // Linked POs: purchase.order.origin === this SO's name. Sorted newest
  // first so the most recent procurement shows at the top.
  const linkedPOs = purchaseOrders
    .filter((p) => p.origin && p.origin === o.name)
    .sort((a, b) => (b.date_order || "").localeCompare(a.date_order || ""));

  // Customer contact lookup — used by follow-up actions on stale quotes.
  // Looks up the partner record by id; falls back to empty strings when the
  // partner's email/phone isn't populated in Odoo.
  const partner = partners.find((p) => p.id === o.partner_id_id);

  const row = toOrderListRow(o);
  return {
    order: { ...row, rawState: o.state },
    rawOrder: o,
    lines: orderLines,
    invoices: linkedInvoices,
    purchaseOrders: linkedPOs,
    partnerEmail: partner?.email ?? "",
    partnerPhone: partner?.phone ?? "",
    partnerLang: partner?.lang ?? "",
  };
};

// ── Invoice Lines ────────────────────────────────────────────────

export interface OdooInvoiceLine {
  [key: string]: string;
  id: string;
  move_id: string;
  move_id_id: string;
  move_name: string;
  move_type: string;
  partner_id: string;
  partner_id_id: string;
  product_id: string;
  product_id_id: string;
  name: string;
  quantity: string;
  price_unit: string;
  discount: string;
  price_subtotal: string;
  price_total: string;
  tax_ids: string;
  account_id: string;
  currency_id: string;
  date: string;
  date_maturity: string;
  reconciled: string;
}

const invoiceLinesCache: Cache<OdooInvoiceLine> = { data: null, ts: 0 };

export const getOdooInvoiceLines = async (): Promise<OdooInvoiceLine[]> => {
  if (fresh(invoiceLinesCache)) return invoiceLinesCache.data!;
  invoiceLinesCache.data = await readSheet<OdooInvoiceLine>("Odoo_Invoice_Lines");
  invoiceLinesCache.ts = Date.now();
  return invoiceLinesCache.data;
};

// ── Invoice list + AR Aging ──────────────────────────────────────

export type MoveTypeFilter = "all" | "customer" | "vendor" | "refund";
export type PaymentStateFilter = "all" | "open" | "paid" | "overdue";
export type AgingBucket = "current" | "0-30" | "30-60" | "60-90" | "90+";

export interface InvoiceListRow {
  id: string;
  name: string;
  moveType: string;
  state: string;
  partnerId: string;
  partnerName: string;
  /** invoice_user_id display name — used for "my deals" filtering. */
  salesperson: string;
  date: string;
  dueDate: string;
  total: number;
  residual: number;
  currency: string;
  paymentState: string;
  cfdiUuid: string;
  cfdiPolicy: string;
  cfdiState: string;
  origin: string;
  daysOverdue: number;
  agingBucket: AgingBucket | null;
  isOverdue: boolean;
}

const today = () => new Date();

const daysBetween = (isoDate: string, now: Date): number => {
  if (!isoDate) return 0;
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return 0;
  return Math.floor((now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
};

const bucketFor = (daysOver: number, isOpen: boolean): AgingBucket | null => {
  if (!isOpen) return null;
  if (daysOver <= 0) return "current";
  if (daysOver <= 30) return "0-30";
  if (daysOver <= 60) return "30-60";
  if (daysOver <= 90) return "60-90";
  return "90+";
};

/**
 * Aging breakdown across a set of open invoices/bills, by currency. Used
 * for per-partner AR aging (customers) and AP aging (vendors). Mirrors the
 * shape of the global ARAging interface so the same renderer works for both.
 */
export const computePartnerAging = (
  openInvoices: OdooInvoice[],
  now: Date = today()
): {
  current: Record<string, number>;
  "0-30": Record<string, number>;
  "30-60": Record<string, number>;
  "60-90": Record<string, number>;
  "90+": Record<string, number>;
  totalOpen: Record<string, number>;
} => {
  const buckets = {
    current: {} as Record<string, number>,
    "0-30": {} as Record<string, number>,
    "30-60": {} as Record<string, number>,
    "60-90": {} as Record<string, number>,
    "90+": {} as Record<string, number>,
    totalOpen: {} as Record<string, number>,
  };
  for (const i of openInvoices) {
    const isOpen =
      i.state === "posted" &&
      (i.payment_state === "not_paid" || i.payment_state === "partial");
    if (!isOpen) continue;
    const days = i.invoice_date_due ? daysBetween(i.invoice_date_due, now) : 0;
    const bucket = bucketFor(days, true);
    if (!bucket) continue;
    const currency = i.currency_id || "MXN";
    const amount = num(i.amount_residual);
    buckets[bucket][currency] = (buckets[bucket][currency] ?? 0) + amount;
    buckets.totalOpen[currency] = (buckets.totalOpen[currency] ?? 0) + amount;
  }
  return buckets;
};

const toInvoiceListRow = (i: OdooInvoice, now: Date = today()): InvoiceListRow => {
  const residual = num(i.amount_residual);
  const isOpen =
    i.state === "posted" &&
    (i.payment_state === "not_paid" || i.payment_state === "partial");
  const days = i.invoice_date_due ? daysBetween(i.invoice_date_due, now) : 0;
  return {
    id: i.id,
    name: i.name,
    moveType: i.move_type,
    state: i.state,
    partnerId: i.partner_id_id || i.commercial_partner_id_id,
    partnerName: i.partner_id || i.commercial_partner_id,
    salesperson: i.invoice_user_id || "",
    date: (i.invoice_date || i.date || "").slice(0, 10),
    dueDate: (i.invoice_date_due || "").slice(0, 10),
    total: num(i.amount_total) * (i.move_type === "out_refund" || i.move_type === "in_refund" ? -1 : 1),
    residual,
    currency: i.currency_id || "MXN",
    paymentState: i.payment_state || "",
    cfdiUuid: i.l10n_mx_edi_cfdi_uuid || "",
    cfdiPolicy: i.l10n_mx_edi_payment_policy || "",
    cfdiState: i.l10n_mx_edi_cfdi_state || "",
    origin: i.invoice_origin || "",
    daysOverdue: isOpen ? Math.max(0, days) : 0,
    agingBucket: bucketFor(days, isOpen),
    isOverdue: isOpen && days > 0,
  };
};

export interface InvoiceListFilters {
  q?: string;
  moveType?: MoveTypeFilter;
  paymentState?: PaymentStateFilter;
  agingBucket?: AgingBucket;
  partnerId?: string;
  limit?: number;
  offset?: number;
  sort?: "date_desc" | "date_asc" | "residual_desc" | "days_overdue_desc" | "partner";
}

export interface ARAging {
  current: Record<string, number>;
  "0-30": Record<string, number>;
  "30-60": Record<string, number>;
  "60-90": Record<string, number>;
  "90+": Record<string, number>;
  totalOpen: Record<string, number>;
  invoiceCount: number;
  overdueCount: number;
}

export interface InvoiceListResult {
  invoices: InvoiceListRow[];
  total: number;
  offset: number;
  limit: number;
  aging: ARAging;
}

export const getInvoiceList = async (
  filters: InvoiceListFilters = {}
): Promise<InvoiceListResult> => {
  const {
    q = "",
    moveType = "customer",
    paymentState = "all",
    agingBucket,
    partnerId,
    limit = 100,
    offset = 0,
    sort = "date_desc",
  } = filters;

  const now = today();
  const all = await getOdooInvoices();
  const rows = all.map((i) => toInvoiceListRow(i, now));

  let filtered = rows;

  // move_type filter
  if (moveType === "customer") {
    filtered = filtered.filter((r) => r.moveType === "out_invoice" || r.moveType === "out_refund");
  } else if (moveType === "vendor") {
    filtered = filtered.filter((r) => r.moveType === "in_invoice" || r.moveType === "in_refund");
  } else if (moveType === "refund") {
    filtered = filtered.filter((r) => r.moveType === "out_refund" || r.moveType === "in_refund");
  }

  // payment state filter (scoped to posted moves)
  if (paymentState === "open") {
    filtered = filtered.filter((r) => r.state === "posted" && (r.paymentState === "not_paid" || r.paymentState === "partial"));
  } else if (paymentState === "paid") {
    filtered = filtered.filter((r) => r.paymentState === "paid");
  } else if (paymentState === "overdue") {
    filtered = filtered.filter((r) => r.isOverdue);
  }

  if (agingBucket) {
    filtered = filtered.filter((r) => r.agingBucket === agingBucket);
  }

  if (partnerId) {
    filtered = filtered.filter((r) => r.partnerId === partnerId);
  }

  if (q) {
    const needle = q.toLowerCase();
    filtered = filtered.filter((r) =>
      `${r.name} ${r.partnerName} ${r.cfdiUuid} ${r.origin}`.toLowerCase().includes(needle)
    );
  }

  // Aging panel — always computed on the customer-AR universe regardless of other filters,
  // so the big number is stable
  const arUniverse = rows.filter(
    (r) =>
      (r.moveType === "out_invoice" || r.moveType === "out_refund") &&
      r.state === "posted" &&
      (r.paymentState === "not_paid" || r.paymentState === "partial")
  );
  const addBy = (bucket: Record<string, number>, cur: string, amt: number) => {
    bucket[cur] = (bucket[cur] ?? 0) + amt;
  };
  const aging: ARAging = {
    current: {},
    "0-30": {},
    "30-60": {},
    "60-90": {},
    "90+": {},
    totalOpen: {},
    invoiceCount: arUniverse.length,
    overdueCount: arUniverse.filter((r) => r.isOverdue).length,
  };
  for (const r of arUniverse) {
    if (!r.agingBucket) continue;
    addBy(aging[r.agingBucket], r.currency, r.residual);
    addBy(aging.totalOpen, r.currency, r.residual);
  }

  // Sort
  const cmp = (a: InvoiceListRow, b: InvoiceListRow) => {
    if (sort === "date_asc") return a.date.localeCompare(b.date);
    if (sort === "residual_desc") return b.residual - a.residual;
    if (sort === "days_overdue_desc") return b.daysOverdue - a.daysOverdue;
    if (sort === "partner") return a.partnerName.localeCompare(b.partnerName);
    return b.date.localeCompare(a.date); // date_desc default
  };
  filtered.sort(cmp);

  return {
    invoices: filtered.slice(offset, offset + limit),
    total: filtered.length,
    offset,
    limit,
    aging,
  };
};

// ── Invoice detail ───────────────────────────────────────────────

export interface InvoiceDetail {
  invoice: InvoiceListRow & { rawState: string };
  rawInvoice: OdooInvoice;
  lines: OdooInvoiceLine[];
  payments: OdooPayment[];
  /** Customer/vendor partner record — surfaces VAT/RFC + Mexican fiscal
   *  regime + Uso CFDI directly on the invoice so Roger can verify CFDI
   *  fields without bouncing to the customer record. */
  partner: OdooPartner | null;
}

export const getInvoiceDetail = async (
  invoiceId: string
): Promise<InvoiceDetail | null> => {
  const [invoices, lines, payments, partners] = await Promise.all([
    getOdooInvoices(),
    getOdooInvoiceLines(),
    getOdooPayments(),
    getOdooPartners(),
  ]);

  const inv = invoices.find((i) => i.id === invoiceId);
  if (!inv) return null;

  const invoiceLines = lines.filter((l) => l.move_id_id === invoiceId);

  // Payments where this invoice appears in reconciled_invoice_ids or reconciled_bill_ids
  // (stored as comma-joined Odoo IDs at extraction time)
  const linkedPayments = payments.filter((p) => {
    const ri = (p.reconciled_invoice_ids || "").split(",").map((s) => s.trim());
    const rb = (p.reconciled_bill_ids || "").split(",").map((s) => s.trim());
    return ri.includes(invoiceId) || rb.includes(invoiceId);
  });

  // Prefer commercial_partner_id_id (parent company) since CFDI fiscal
  // identity sits there for B2B contacts; fall back to partner_id_id.
  const partnerKey = inv.commercial_partner_id_id || inv.partner_id_id;
  const partner = partnerKey
    ? partners.find((p) => p.id === partnerKey) ?? null
    : null;

  const row = toInvoiceListRow(inv);
  return {
    invoice: { ...row, rawState: inv.state },
    rawInvoice: inv,
    lines: invoiceLines,
    payments: linkedPayments,
    partner,
  };
};

// ── Attachments (mirrored to Drive) ──────────────────────────────

export interface OdooAttachment {
  [key: string]: string;
  id: string;
  res_model: string;
  res_id: string;
  res_name: string;
  name: string;
  mimetype: string;
  file_size: string;
  create_date: string;
  drive_file_id: string;
  drive_view_url: string;
  drive_download_url: string;
}

export interface AttachmentRow {
  id: string;
  name: string;
  mimetype: string;
  fileSize: number;
  createdAt: string;
  driveFileId: string;
  viewUrl: string;
  downloadUrl: string;
}

const attachmentsCache: Cache<OdooAttachment> = { data: null, ts: 0 };

export const getOdooAttachments = async (): Promise<OdooAttachment[]> => {
  if (fresh(attachmentsCache)) return attachmentsCache.data!;
  try {
    attachmentsCache.data = await readSheet<OdooAttachment>("Odoo_Attachments");
  } catch {
    attachmentsCache.data = [];
  }
  attachmentsCache.ts = Date.now();
  return attachmentsCache.data;
};

const toAttachmentRow = (a: OdooAttachment): AttachmentRow => ({
  id: a.id,
  name: a.name,
  mimetype: a.mimetype,
  fileSize: num(a.file_size),
  createdAt: (a.create_date || "").slice(0, 10),
  driveFileId: a.drive_file_id,
  viewUrl: a.drive_view_url,
  downloadUrl: a.drive_download_url,
});

export const getAttachmentsFor = async (
  resModel: string,
  resId: string
): Promise<AttachmentRow[]> => {
  if (!resId) return [];
  const all = await getOdooAttachments();
  return all
    .filter((a) => a.res_model === resModel && a.res_id === resId)
    .map(toAttachmentRow)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

// ── Messages (Odoo chatter) ──────────────────────────────────────

export interface OdooMessage {
  [key: string]: string;
  id: string;
  message_type: string; // email | comment
  date: string;
  model: string;
  res_id: string;
  record_name: string;
  subject: string;
  author_id: string;
  author_id_id: string;
  email_from: string;
  body_text: string;
  body: string;
  attachment_ids: string;
  partner_ids: string;
  parent_id: string;
  parent_id_id: string;
}

export interface MessageRow {
  id: string;
  messageType: string;
  date: string;
  subject: string;
  author: string;
  authorId: string;
  emailFrom: string;
  bodyText: string;
  bodyHtml: string;
  attachmentCount: number;
  recipientCount: number;
}

const messagesCache: Cache<OdooMessage> = { data: null, ts: 0 };

export const getOdooMessages = async (): Promise<OdooMessage[]> => {
  if (fresh(messagesCache)) return messagesCache.data!;
  try {
    messagesCache.data = await readSheet<OdooMessage>("Odoo_Messages");
  } catch {
    messagesCache.data = [];
  }
  messagesCache.ts = Date.now();
  return messagesCache.data;
};

const toMessageRow = (m: OdooMessage): MessageRow => {
  const splitIds = (s: string) =>
    (s || "").split(",").map((x) => x.trim()).filter(Boolean);
  return {
    id: m.id,
    messageType: m.message_type,
    date: m.date || "",
    subject: m.subject || "",
    author: m.author_id || m.email_from || "",
    authorId: m.author_id_id,
    emailFrom: m.email_from,
    bodyText: m.body_text || "",
    bodyHtml: m.body || "",
    attachmentCount: splitIds(m.attachment_ids).length,
    recipientCount: splitIds(m.partner_ids).length,
  };
};

export const getMessagesFor = async (
  resModel: string,
  resId: string
): Promise<MessageRow[]> => {
  if (!resId) return [];
  const all = await getOdooMessages();
  return all
    .filter((m) => m.model === resModel && m.res_id === resId)
    .map(toMessageRow)
    .sort((a, b) => b.date.localeCompare(a.date));
};

// Aggregate across a customer's invoices/orders — "everything with this partner"
export const getMessagesForPartner = async (
  partnerIdInt: string
): Promise<MessageRow[]> => {
  if (!partnerIdInt) return [];
  const [messages, invoices, orders] = await Promise.all([
    getOdooMessages(),
    getOdooInvoices(),
    getOdooSaleOrders(),
  ]);
  const invoiceIds = new Set(
    invoices
      .filter(
        (i) =>
          i.partner_id_id === partnerIdInt ||
          i.commercial_partner_id_id === partnerIdInt
      )
      .map((i) => i.id)
  );
  const orderIds = new Set(
    orders.filter((o) => o.partner_id_id === partnerIdInt).map((o) => o.id)
  );
  return messages
    .filter((m) => {
      if (m.model === "res.partner" && m.res_id === partnerIdInt) return true;
      if (m.model === "account.move" && invoiceIds.has(m.res_id)) return true;
      if (m.model === "sale.order" && orderIds.has(m.res_id)) return true;
      return false;
    })
    .map(toMessageRow)
    .sort((a, b) => b.date.localeCompare(a.date));
};
