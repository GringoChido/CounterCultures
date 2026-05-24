/**
 * Odoo XMLRPC write helpers. The dashboard reads from a Sheets mirror; this
 * module is where the dashboard punches changes BACK into Odoo so Roger's
 * accounting source of truth stays consistent.
 *
 * Permission model: every call here is authenticated as the single Odoo
 * API user (currently `roger@countercultures.com.mx`). Per-user attribution
 * inside Odoo is impossible until each portal user has their own Odoo
 * account + API key (DEPENDENCIES item — see project notes). For now, the
 * portal records the actual actor in Activity_Log and stamps Odoo as Roger.
 *
 * Cache: read mirror tabs (`Odoo_*` in Google Sheets) are a snapshot. After
 * a successful write, callers should invalidate the relevant in-memory
 * caches in `odoo-sheets.ts` so the next read hits the wire (Odoo) for that
 * row, OR the dashboard tells the user "queued — will appear on next sync."
 * For payments specifically, we append the new row to `Odoo_Payments` so
 * Roger sees it immediately; the next full extraction will reconcile.
 */

import { execute, isConfigured } from "./client";
import {
  syncInvoiceInMirror,
  syncPaymentInMirror,
  syncSaleOrderInMirror,
} from "./sync";

const ODOO_USERNAME = process.env.ODOO_USERNAME ?? "";
const ODOO_DB = process.env.ODOO_DB ?? "";
const ODOO_API_KEY = process.env.ODOO_API_KEY ?? "";

const requireOdooConfigured = (): void => {
  if (!isConfigured()) {
    throw new Error(
      "Odoo not configured. Set ODOO_URL, ODOO_DB, ODOO_USERNAME, ODOO_API_KEY in .env.local."
    );
  }
};

// We need a uid for execute(); reuse the cached auth from the client.
import { authenticate } from "./client";

let cachedUid: number | null = null;
const getUid = async (): Promise<number> => {
  if (cachedUid) return cachedUid;
  cachedUid = await authenticate();
  return cachedUid;
};

// Suppress unused-var warnings on env imports we keep for documentation.
void ODOO_USERNAME;
void ODOO_DB;
void ODOO_API_KEY;

// ── Payments ───────────────────────────────────────────────────────

export interface RegisterPaymentInput {
  /** Odoo invoice ID (the integer `id` on `account.move`). */
  invoiceId: number;
  /** Amount being registered, in the invoice's currency. */
  amount: number;
  /** Odoo journal ID — bank or cash account the payment lands in. */
  journalId: number;
  /** YYYY-MM-DD. */
  paymentDate: string;
  /** Free-text reference (cheque #, transfer ref, etc.). */
  ref?: string;
  /** Free-text memo shown on the payment record. */
  memo?: string;
  /** Exchange rate override. Stored in ref as FX:<rate>@<source> if Odoo schema doesn't expose it. */
  exchangeRate?: number;
}

export interface RegisterPaymentResult {
  paymentId: number;
  paymentName: string;
  amount: number;
  journalId: number;
  paymentDate: string;
  state: string;
}

/**
 * Registers a payment against an invoice using Odoo's `account.payment.register`
 * transient wizard — this is the same code path the Odoo UI uses, so it
 * applies the platform's reconciliation, currency, and CFDI logic. Throws on
 * any Odoo error so the caller can surface it.
 */
export const registerPayment = async (
  input: RegisterPaymentInput
): Promise<RegisterPaymentResult> => {
  requireOdooConfigured();
  const uid = await getUid();

  // 1) Create the wizard with the invoice in context
  const wizardId = (await execute(
    uid,
    "account.payment.register",
    "create",
    [
      {
        amount: input.amount,
        journal_id: input.journalId,
        payment_date: input.paymentDate,
        communication: input.memo ?? "",
        ...(input.ref ? { ref: input.ref } : {}),
        ...(input.exchangeRate ? { ref: `${input.ref ?? ""}${input.ref ? " | " : ""}FX:${input.exchangeRate}@manual`.trim() } : {}),
      },
    ],
    {
      context: {
        active_model: "account.move",
        active_ids: [input.invoiceId],
        active_id: input.invoiceId,
      },
    }
  )) as number;

  // 2) Confirm the wizard → creates an account.payment AND reconciles it
  //    against the invoice. Returns an action dict; we extract the payment
  //    ID from `res_id` or the result's `domain` filter.
  const action = (await execute(
    uid,
    "account.payment.register",
    "action_create_payments",
    [[wizardId]]
  )) as { res_id?: number; domain?: unknown[] } | boolean;

  let paymentId: number | null = null;
  if (typeof action === "object" && action.res_id) {
    paymentId = action.res_id;
  }
  if (!paymentId) {
    // Fallback: query the journal for the most recent payment on this invoice
    const recent = (await execute(
      uid,
      "account.payment",
      "search_read",
      [[["reconciled_invoice_ids", "in", [input.invoiceId]]]],
      { fields: ["id", "name"], limit: 1, order: "id desc" }
    )) as { id: number; name: string }[];
    if (recent[0]) paymentId = recent[0].id;
  }
  if (!paymentId) {
    throw new Error(
      "Payment created but Odoo did not return a payment ID. Check Odoo manually."
    );
  }

  // 3) Read back the canonical payment record
  const [record] = (await execute(uid, "account.payment", "read", [[paymentId]], {
    fields: ["id", "name", "amount", "journal_id", "date", "state"],
  })) as {
    id: number;
    name: string;
    amount: number;
    journal_id: [number, string];
    date: string;
    state: string;
  }[];

  // Spot-refresh the mirror — the new payment is inserted into Odoo_Payments
  // and the invoice's residual/payment_state is updated in Odoo_Invoices so
  // the dashboard reflects reality on next read. Failures here don't abort
  // the call (the payment is real in Odoo regardless); they're logged.
  try {
    await Promise.all([
      syncPaymentInMirror(record.id),
      syncInvoiceInMirror(input.invoiceId),
    ]);
  } catch (err) {
    console.warn(
      "[odoo/write] post-payment mirror sync failed (non-fatal):",
      err instanceof Error ? err.message : err
    );
  }

  return {
    paymentId: record.id,
    paymentName: record.name,
    amount: record.amount,
    journalId: record.journal_id?.[0] ?? input.journalId,
    paymentDate: record.date,
    state: record.state,
  };
};

// ── Customers ─────────────────────────────────────────────────────

export interface CreateCustomerInput {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
}

export interface CreateCustomerResult {
  partnerId: number;
  partnerName: string;
}

export const createCustomer = async (
  input: CreateCustomerInput
): Promise<CreateCustomerResult> => {
  requireOdooConfigured();
  const uid = await getUid();

  const vals: Record<string, unknown> = {
    name: input.name,
    customer_rank: 1,
  };
  if (input.email) vals.email = input.email;
  if (input.phone) vals.phone = input.phone;
  if (input.company) {
    vals.company_name = input.company;
  }

  const partnerId = (await execute(uid, "res.partner", "create", [vals])) as number;

  const [record] = (await execute(uid, "res.partner", "read", [[partnerId]], {
    fields: ["id", "name"],
  })) as { id: number; name: string }[];

  return { partnerId: record.id, partnerName: record.name };
};

// ── Quotes & Invoices ─────────────────────────────────────────────

export interface CreateQuoteInput {
  partnerId: number;
  lines: { productId: number; quantity: number; priceUnit?: number; discount?: number }[];
  validity_date?: string;
  payment_term_id?: number;
  pricelist_id?: number;
  companyId?: number;
  salespersonId?: number;
  note?: string;
}

export interface CreateQuoteResult {
  orderId: number;
  orderName: string;
}

export const createQuote = async (
  input: CreateQuoteInput
): Promise<CreateQuoteResult> => {
  requireOdooConfigured();
  const uid = await getUid();

  const orderLines = input.lines.map((l) => [
    0,
    0,
    {
      product_id: l.productId,
      product_uom_qty: l.quantity,
      ...(l.priceUnit != null ? { price_unit: l.priceUnit } : {}),
      ...(l.discount != null && l.discount > 0 ? { discount: l.discount } : {}),
    },
  ]);

  const vals: Record<string, unknown> = {
    partner_id: input.partnerId,
    order_line: orderLines,
  };
  if (input.validity_date) vals.validity_date = input.validity_date;
  if (input.payment_term_id) vals.payment_term_id = input.payment_term_id;
  if (input.pricelist_id) vals.pricelist_id = input.pricelist_id;
  if (input.companyId) vals.company_id = input.companyId;
  if (input.salespersonId) vals.user_id = input.salespersonId;
  if (input.note != null) vals.note = input.note;

  const orderId = (await execute(uid, "sale.order", "create", [vals])) as number;

  const [record] = (await execute(uid, "sale.order", "read", [[orderId]], {
    fields: ["id", "name"],
  })) as { id: number; name: string }[];

  try {
    await syncSaleOrderInMirror(record.id);
  } catch (err) {
    console.warn(
      "[odoo/write] post-createQuote mirror sync failed (non-fatal):",
      err instanceof Error ? err.message : err
    );
  }

  return { orderId: record.id, orderName: record.name };
};

export interface ConfirmAndInvoiceResult {
  orderId: number;
  orderState: string;
  invoiceIds: number[];
  invoiceNames: string[];
}

/**
 * Calls Odoo's `sale.order.action_confirm` (quote → sale) and then
 * `_create_invoices` to generate the customer invoice(s). Returns the new
 * invoice IDs so the dashboard can deep-link straight into them.
 *
 * Does NOT post the invoice (still in `draft` state after this). Posting +
 * CFDI stamping is a separate action — Roger reviews the draft first, then
 * triggers post via the dashboard's CFDI button (Cut #3 follow-on).
 */
export const confirmAndInvoiceOrder = async (
  orderId: number
): Promise<ConfirmAndInvoiceResult> => {
  requireOdooConfigured();
  const uid = await getUid();

  // 1) Confirm — moves sale.order from draft/sent → sale
  await execute(uid, "sale.order", "action_confirm", [[orderId]]);

  // Read state back to verify the confirm worked
  const [confirmed] = (await execute(
    uid,
    "sale.order",
    "read",
    [[orderId]],
    { fields: ["id", "state", "name"] }
  )) as { id: number; state: string; name: string }[];

  if (!confirmed) {
    throw new Error(`Order ${orderId} not found after confirm`);
  }
  if (confirmed.state !== "sale" && confirmed.state !== "done") {
    throw new Error(
      `Order ${orderId} did not advance to 'sale' state (got '${confirmed.state}')`
    );
  }

  // 2) Generate invoice(s). Odoo's `_create_invoices` returns an action dict
  // referencing the new account.move record(s). For multi-invoice orders
  // (rare in CC's flow) we collect all of them.
  const action = (await execute(
    uid,
    "sale.order",
    "_create_invoices",
    [[orderId]]
  )) as { res_id?: number; res_ids?: number[]; domain?: unknown[] } | boolean;

  let invoiceIds: number[] = [];
  if (typeof action === "object" && action !== null) {
    if (Array.isArray(action.res_ids) && action.res_ids.length > 0) {
      invoiceIds = action.res_ids;
    } else if (typeof action.res_id === "number" && action.res_id > 0) {
      invoiceIds = [action.res_id];
    }
  }
  if (invoiceIds.length === 0) {
    // Fallback: query account.move filtered by invoice_origin == order name
    const moves = (await execute(
      uid,
      "account.move",
      "search_read",
      [[["invoice_origin", "=", confirmed.name]]],
      { fields: ["id", "name"], order: "id desc", limit: 5 }
    )) as { id: number; name: string }[];
    invoiceIds = moves.map((m) => m.id);
  }

  let invoiceNames: string[] = [];
  if (invoiceIds.length > 0) {
    const moves = (await execute(
      uid,
      "account.move",
      "read",
      [invoiceIds],
      { fields: ["id", "name"] }
    )) as { id: number; name: string }[];
    invoiceNames = moves.map((m) => m.name);
  }

  // Spot-refresh the mirror — order moved to "sale" state, new invoice rows
  // were created. Best-effort; non-fatal on failure.
  try {
    await syncSaleOrderInMirror(confirmed.id);
    await Promise.all(invoiceIds.map((id) => syncInvoiceInMirror(id)));
  } catch (err) {
    console.warn(
      "[odoo/write] post-confirm mirror sync failed (non-fatal):",
      err instanceof Error ? err.message : err
    );
  }

  return {
    orderId: confirmed.id,
    orderState: confirmed.state,
    invoiceIds,
    invoiceNames,
  };
};

export const confirmQuote = async (orderId: number): Promise<void> => {
  // Lighter alias — confirms but doesn't generate invoice. Useful for the
  // case where Roger wants to confirm a sale but invoice later.
  requireOdooConfigured();
  const uid = await getUid();
  await execute(uid, "sale.order", "action_confirm", [[orderId]]);
};

export interface CancelOrderResult {
  orderId: number;
  state: string;
}

/**
 * Cancels a sale order in Odoo (state → "cancel"). Used for the "Mark dead"
 * action on stale quotes. The order is preserved in Odoo (so audit history
 * stays intact); only the state changes. Reversible by un-cancelling in
 * Odoo's UI if Roger changes his mind.
 *
 * Refuses to cancel if the order is already in `done` or `cancel` state to
 * keep the action idempotent and avoid masking real errors.
 */
export const cancelOrder = async (
  orderId: number
): Promise<CancelOrderResult> => {
  requireOdooConfigured();
  const uid = await getUid();

  // Pre-check: read current state so we can fail fast on already-cancelled
  // or already-completed orders rather than letting Odoo throw a confusing
  // RPC error mid-flight.
  const [current] = (await execute(uid, "sale.order", "read", [[orderId]], {
    fields: ["id", "state", "name"],
  })) as { id: number; state: string; name: string }[];

  if (!current) throw new Error(`Order ${orderId} not found`);
  if (current.state === "cancel") {
    return { orderId: current.id, state: current.state };
  }
  if (current.state === "done") {
    throw new Error(
      `Order ${current.name} is locked (state=done) and cannot be cancelled. Reverse the related invoices first.`
    );
  }

  await execute(uid, "sale.order", "action_cancel", [[orderId]]);

  const [updated] = (await execute(uid, "sale.order", "read", [[orderId]], {
    fields: ["id", "state"],
  })) as { id: number; state: string }[];

  // Spot-refresh the mirror so the cancelled state shows immediately on
  // next read. Best-effort — failures are logged, never abort.
  try {
    await syncSaleOrderInMirror(orderId);
  } catch (err) {
    console.warn(
      "[odoo/write] post-cancel mirror sync failed (non-fatal):",
      err instanceof Error ? err.message : err
    );
  }

  return { orderId: updated.id, state: updated.state };
};

// ── Purchase Orders ──────────────────────────────────────────────

export interface CreatePurchaseOrderInput {
  partnerId: number;
  lines: { productId: number; quantity: number; priceUnit?: number; name?: string }[];
  companyId?: number;
  currencyId?: number;
  datePlanned?: string;
  notes?: string;
}

export interface CreatePurchaseOrderResult {
  orderId: number;
  orderName: string;
}

export const createPurchaseOrder = async (
  input: CreatePurchaseOrderInput
): Promise<CreatePurchaseOrderResult> => {
  requireOdooConfigured();
  const uid = await getUid();

  const orderLines = input.lines.map((l) => [
    0,
    0,
    {
      product_id: l.productId,
      product_qty: l.quantity,
      ...(l.priceUnit != null ? { price_unit: l.priceUnit } : {}),
      ...(l.name ? { name: l.name } : {}),
    },
  ]);

  const vals: Record<string, unknown> = {
    partner_id: input.partnerId,
    order_line: orderLines,
  };
  if (input.companyId) vals.company_id = input.companyId;
  if (input.currencyId) vals.currency_id = input.currencyId;
  if (input.datePlanned) vals.date_planned = input.datePlanned;
  if (input.notes != null) vals.notes = input.notes;

  const orderId = (await execute(uid, "purchase.order", "create", [vals])) as number;

  const [record] = (await execute(uid, "purchase.order", "read", [[orderId]], {
    fields: ["id", "name"],
  })) as { id: number; name: string }[];

  return { orderId: record.id, orderName: record.name };
};

// ── Vendor Bills ──────────────────────────────────────────────────

export interface CreateBillFromPOResult {
  billId: number;
  billName: string;
  amount: number;
  state: string;
}

/**
 * Creates a draft vendor bill from a purchase order WITHOUT requiring a
 * goods receipt first. Odoo's default flow forces "Receive Products" →
 * "Create Bill", but Counter Cultures often receives the invoice before
 * physical receipt (international shipping). This calls Odoo's
 * `action_create_invoice` on the PO, which generates an account.move
 * (in_invoice) in draft state linked back to the PO via invoice_origin.
 */
export const createBillFromPO = async (
  purchaseOrderId: number
): Promise<CreateBillFromPOResult> => {
  requireOdooConfigured();
  const uid = await getUid();

  // Verify the PO exists and is in a billable state
  const [po] = (await execute(uid, "purchase.order", "read", [[purchaseOrderId]], {
    fields: ["id", "name", "state", "invoice_status"],
  })) as { id: number; name: string; state: string; invoice_status: string }[];

  if (!po) throw new Error(`Purchase order ${purchaseOrderId} not found`);
  if (po.state === "draft" || po.state === "cancel") {
    throw new Error(
      `PO ${po.name} is in '${po.state}' state — confirm it before creating a bill`
    );
  }

  // action_create_invoice creates a draft vendor bill from the PO lines
  const action = (await execute(
    uid,
    "purchase.order",
    "action_create_invoice",
    [[purchaseOrderId]]
  )) as { res_id?: number; res_ids?: number[]; domain?: unknown[] } | boolean;

  let billId: number | null = null;
  if (typeof action === "object" && action !== null) {
    if (typeof action.res_id === "number" && action.res_id > 0) {
      billId = action.res_id;
    } else if (Array.isArray(action.res_ids) && action.res_ids.length > 0) {
      billId = action.res_ids[0];
    }
  }

  if (!billId) {
    // Fallback: find the most recent bill with this PO as origin
    const moves = (await execute(
      uid,
      "account.move",
      "search_read",
      [[
        ["invoice_origin", "=", po.name],
        ["move_type", "=", "in_invoice"],
      ]],
      { fields: ["id", "name"], order: "id desc", limit: 1 }
    )) as { id: number; name: string }[];
    if (moves[0]) billId = moves[0].id;
  }

  if (!billId) {
    throw new Error(
      `Bill creation triggered but Odoo did not return a bill ID for PO ${po.name}. Check Odoo manually.`
    );
  }

  const [bill] = (await execute(uid, "account.move", "read", [[billId]], {
    fields: ["id", "name", "amount_total", "state"],
  })) as { id: number; name: string; amount_total: number; state: string }[];

  // Spot-refresh the mirror
  try {
    await syncInvoiceInMirror(bill.id);
  } catch (err) {
    console.warn(
      "[odoo/write] post-bill mirror sync failed (non-fatal):",
      err instanceof Error ? err.message : err
    );
  }

  return {
    billId: bill.id,
    billName: bill.name,
    amount: bill.amount_total,
    state: bill.state,
  };
};

export interface BackfillPedimentoResult {
  updatedCount: number;
  invoiceIds: number[];
}

export const backfillPedimentoNumber = async (
  invoiceIds: number[],
  pedimentoNumber: string
): Promise<BackfillPedimentoResult> => {
  requireOdooConfigured();
  const uid = await getUid();
  const updated: number[] = [];

  for (const invoiceId of invoiceIds) {
    const [move] = (await execute(uid, "account.move", "read", [[invoiceId]], {
      fields: ["narration", "ref", "state"],
    })) as { narration: string | false; ref: string | false; state: string }[];

    if (!move) continue;

    const currentRef = (move.ref || "") as string;
    if (currentRef.includes(pedimentoNumber)) continue;

    const newRef = currentRef ? `${currentRef} | Ped. ${pedimentoNumber}` : `Ped. ${pedimentoNumber}`;
    await execute(uid, "account.move", "write", [[invoiceId], { ref: newRef }]);
    updated.push(invoiceId);
  }

  return { updatedCount: updated.length, invoiceIds: updated };
};

export const stampCFDI = async (
  _invoiceId: number
): Promise<{ uuid: string; state: string }> => {
  // The exact action name varies by Odoo version + l10n_mx_edi_pac config.
  // Open question: which PAC is wired on Roger's instance? See DEPENDENCIES.
  throw new Error("stampCFDI not yet wired — needs Roger's Odoo l10n config");
};
