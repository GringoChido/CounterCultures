/**
 * Odoo → Sheets mirror sync helpers.
 *
 * Two modes:
 *   - Spot refresh (per-row): called immediately after a write so the row
 *     the user just touched appears fresh on next read. Cheap, focused.
 *   - Bulk incremental (cron-driven): pulls everything in a model whose
 *     `write_date` is newer than what's already in the mirror. Cursorless —
 *     the cursor IS the mirror's `max(write_date)`.
 *
 * Both modes flatten Odoo's many2one fields the same way the original
 * Python extract did:
 *   `field` → display name (or empty)
 *   `field_id` → integer id (or empty)
 *
 * One2many / many2many fields become pipe-delimited id lists.
 */

import { execute, authenticate, isConfigured } from "./client";
import { upsertRowByField, batchUpsertRowsByField, readSheet, type SheetTab } from "../dashboard-sheets";

let cachedUid: number | null = null;
const getUid = async (): Promise<number> => {
  if (cachedUid) return cachedUid;
  cachedUid = await authenticate();
  return cachedUid;
};

const requireConfigured = (): void => {
  if (!isConfigured()) {
    throw new Error(
      "Odoo not configured — sync requires ODOO_URL/DB/USERNAME/API_KEY."
    );
  }
};

// ── Field-flattening helpers ───────────────────────────────────────

type OdooFieldType = "scalar" | "many2one" | "x2many";

interface FieldDef {
  /** Odoo field name in the read response. */
  odoo: string;
  /** Sheet column for the value (display name for many2one, raw for scalar). */
  sheet: string;
  type: OdooFieldType;
  /** For many2one only: the sheet column for the integer ID. */
  sheetId?: string;
}

const flattenRow = (
  raw: Record<string, unknown>,
  defs: FieldDef[]
): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const def of defs) {
    const v = raw[def.odoo];
    if (def.type === "scalar") {
      if (v === false || v === null || v === undefined) out[def.sheet] = "";
      else out[def.sheet] = String(v);
    } else if (def.type === "many2one") {
      if (Array.isArray(v) && v.length === 2) {
        out[def.sheet] = String(v[1] ?? "");
        if (def.sheetId) out[def.sheetId] = String(v[0] ?? "");
      } else {
        out[def.sheet] = "";
        if (def.sheetId) out[def.sheetId] = "";
      }
    } else if (def.type === "x2many") {
      if (Array.isArray(v)) out[def.sheet] = v.map(String).join("|");
      else out[def.sheet] = "";
    }
  }
  return out;
};

// ── Per-model field maps (matched to OdooInvoice/Payment/SaleOrder) ──

const INVOICE_FIELDS: FieldDef[] = [
  { odoo: "id", sheet: "id", type: "scalar" },
  { odoo: "name", sheet: "name", type: "scalar" },
  { odoo: "display_name", sheet: "display_name", type: "scalar" },
  { odoo: "move_type", sheet: "move_type", type: "scalar" },
  { odoo: "state", sheet: "state", type: "scalar" },
  { odoo: "ref", sheet: "ref", type: "scalar" },
  { odoo: "partner_id", sheet: "partner_id", type: "many2one", sheetId: "partner_id_id" },
  { odoo: "commercial_partner_id", sheet: "commercial_partner_id", type: "many2one", sheetId: "commercial_partner_id_id" },
  { odoo: "invoice_date", sheet: "invoice_date", type: "scalar" },
  { odoo: "invoice_date_due", sheet: "invoice_date_due", type: "scalar" },
  { odoo: "date", sheet: "date", type: "scalar" },
  { odoo: "amount_untaxed", sheet: "amount_untaxed", type: "scalar" },
  { odoo: "amount_tax", sheet: "amount_tax", type: "scalar" },
  { odoo: "amount_total", sheet: "amount_total", type: "scalar" },
  { odoo: "amount_residual", sheet: "amount_residual", type: "scalar" },
  { odoo: "currency_id", sheet: "currency_id", type: "many2one", sheetId: "currency_id_id" },
  { odoo: "payment_state", sheet: "payment_state", type: "scalar" },
  { odoo: "payment_reference", sheet: "payment_reference", type: "scalar" },
  { odoo: "invoice_origin", sheet: "invoice_origin", type: "scalar" },
  { odoo: "invoice_line_ids", sheet: "invoice_line_ids", type: "x2many" },
  { odoo: "invoice_user_id", sheet: "invoice_user_id", type: "many2one", sheetId: "invoice_user_id_id" },
  { odoo: "journal_id", sheet: "journal_id", type: "many2one", sheetId: "journal_id_id" },
  { odoo: "l10n_mx_edi_cfdi_uuid", sheet: "l10n_mx_edi_cfdi_uuid", type: "scalar" },
  { odoo: "l10n_mx_edi_payment_policy", sheet: "l10n_mx_edi_payment_policy", type: "scalar" },
  { odoo: "l10n_mx_edi_usage", sheet: "l10n_mx_edi_usage", type: "scalar" },
  { odoo: "l10n_mx_edi_cfdi_state", sheet: "l10n_mx_edi_cfdi_state", type: "scalar" },
  { odoo: "create_date", sheet: "create_date", type: "scalar" },
  { odoo: "write_date", sheet: "write_date", type: "scalar" },
];

const PAYMENT_FIELDS: FieldDef[] = [
  { odoo: "id", sheet: "id", type: "scalar" },
  { odoo: "name", sheet: "name", type: "scalar" },
  { odoo: "state", sheet: "state", type: "scalar" },
  { odoo: "payment_type", sheet: "payment_type", type: "scalar" },
  { odoo: "partner_type", sheet: "partner_type", type: "scalar" },
  { odoo: "partner_id", sheet: "partner_id", type: "many2one", sheetId: "partner_id_id" },
  { odoo: "amount", sheet: "amount", type: "scalar" },
  { odoo: "currency_id", sheet: "currency_id", type: "many2one", sheetId: "currency_id_id" },
  { odoo: "journal_id", sheet: "journal_id", type: "many2one", sheetId: "journal_id_id" },
  { odoo: "payment_method_line_id", sheet: "payment_method_line_id", type: "many2one" },
  { odoo: "payment_method_id", sheet: "payment_method_id", type: "many2one" },
  { odoo: "date", sheet: "date", type: "scalar" },
  { odoo: "reconciled_invoice_ids", sheet: "reconciled_invoice_ids", type: "x2many" },
  { odoo: "reconciled_bill_ids", sheet: "reconciled_bill_ids", type: "x2many" },
  { odoo: "memo", sheet: "memo", type: "scalar" },
  { odoo: "l10n_mx_edi_cfdi_uuid", sheet: "l10n_mx_edi_cfdi_uuid", type: "scalar" },
];

const SALE_ORDER_FIELDS: FieldDef[] = [
  { odoo: "id", sheet: "id", type: "scalar" },
  { odoo: "name", sheet: "name", type: "scalar" },
  { odoo: "state", sheet: "state", type: "scalar" },
  { odoo: "partner_id", sheet: "partner_id", type: "many2one", sheetId: "partner_id_id" },
  { odoo: "date_order", sheet: "date_order", type: "scalar" },
  { odoo: "validity_date", sheet: "validity_date", type: "scalar" },
  { odoo: "commitment_date", sheet: "commitment_date", type: "scalar" },
  { odoo: "user_id", sheet: "user_id", type: "many2one" },
  { odoo: "pricelist_id", sheet: "pricelist_id", type: "many2one" },
  { odoo: "payment_term_id", sheet: "payment_term_id", type: "many2one" },
  { odoo: "currency_id", sheet: "currency_id", type: "many2one" },
  { odoo: "amount_untaxed", sheet: "amount_untaxed", type: "scalar" },
  { odoo: "amount_tax", sheet: "amount_tax", type: "scalar" },
  { odoo: "amount_total", sheet: "amount_total", type: "scalar" },
  { odoo: "invoice_status", sheet: "invoice_status", type: "scalar" },
  { odoo: "invoice_ids", sheet: "invoice_ids", type: "x2many" },
  { odoo: "order_line", sheet: "order_line", type: "x2many" },
  { odoo: "note", sheet: "note", type: "scalar" },
];

const PURCHASE_ORDER_FIELDS: FieldDef[] = [
  { odoo: "id", sheet: "id", type: "scalar" },
  { odoo: "name", sheet: "name", type: "scalar" },
  { odoo: "state", sheet: "state", type: "scalar" },
  { odoo: "partner_id", sheet: "partner_id", type: "many2one", sheetId: "partner_id_id" },
  { odoo: "date_order", sheet: "date_order", type: "scalar" },
  { odoo: "amount_total", sheet: "amount_total", type: "scalar" },
  { odoo: "currency_id", sheet: "currency_id", type: "many2one" },
  { odoo: "company_id", sheet: "company_id", type: "many2one" },
  { odoo: "invoice_status", sheet: "invoice_status", type: "scalar" },
  { odoo: "origin", sheet: "origin", type: "scalar" },
  { odoo: "write_date", sheet: "write_date", type: "scalar" },
];

interface ModelConfig {
  model: string;
  tab: SheetTab;
  fields: FieldDef[];
  /** Default order for bulk syncs. */
  bulkOrder: string;
}

const MODELS: Record<"invoice" | "payment" | "saleOrder" | "purchaseOrder", ModelConfig> = {
  invoice: {
    model: "account.move",
    tab: "Odoo_Invoices",
    fields: INVOICE_FIELDS,
    bulkOrder: "write_date desc",
  },
  payment: {
    model: "account.payment",
    tab: "Odoo_Payments",
    fields: PAYMENT_FIELDS,
    bulkOrder: "write_date desc",
  },
  saleOrder: {
    model: "sale.order",
    tab: "Odoo_Sale_Orders",
    fields: SALE_ORDER_FIELDS,
    bulkOrder: "write_date desc",
  },
  purchaseOrder: {
    model: "purchase.order",
    tab: "Odoo_Purchase_Orders",
    fields: PURCHASE_ORDER_FIELDS,
    bulkOrder: "write_date desc",
  },
};

const odooFieldNames = (cfg: ModelConfig): string[] =>
  Array.from(new Set(cfg.fields.map((f) => f.odoo)));

// ── Spot refresh (per-row, post-write) ─────────────────────────────

const syncOneByOdooId = async (
  cfg: ModelConfig,
  odooId: number
): Promise<{ action: "updated" | "inserted" | "skipped" }> => {
  if (odooId <= 0) return { action: "skipped" };
  requireConfigured();
  const uid = await getUid();
  const records = (await execute(uid, cfg.model, "read", [[odooId]], {
    fields: odooFieldNames(cfg),
  })) as Record<string, unknown>[];
  if (records.length === 0) return { action: "skipped" };
  const flat = flattenRow(records[0], cfg.fields);
  const result = await upsertRowByField(
    cfg.tab,
    { field: "id", value: String(odooId) },
    flat
  );
  return { action: result.action };
};

export const syncInvoiceInMirror = (
  invoiceId: number
): Promise<{ action: "updated" | "inserted" | "skipped" }> =>
  syncOneByOdooId(MODELS.invoice, invoiceId);

export const syncPaymentInMirror = (
  paymentId: number
): Promise<{ action: "updated" | "inserted" | "skipped" }> =>
  syncOneByOdooId(MODELS.payment, paymentId);

export const syncSaleOrderInMirror = (
  orderId: number
): Promise<{ action: "updated" | "inserted" | "skipped" }> =>
  syncOneByOdooId(MODELS.saleOrder, orderId);

export const syncPurchaseOrderInMirror = (
  poId: number
): Promise<{ action: "updated" | "inserted" | "skipped" }> =>
  syncOneByOdooId(MODELS.purchaseOrder, poId);

// ── Bulk incremental (cron) ────────────────────────────────────────

/**
 * Returns the most recent `write_date` already present in the mirror, or
 * null if the tab is empty. Used as the cursor for incremental syncs.
 *
 * Falls back to "1900-01-01 00:00:00" so the first run pulls everything;
 * subsequent runs only fetch deltas.
 */
const getMirrorCursor = async (cfg: ModelConfig): Promise<string> => {
  const rows = await readSheet<Record<string, string>>(cfg.tab);
  let max = "";
  for (const r of rows) {
    const wd = r.write_date ?? "";
    if (wd && wd > max) max = wd;
  }
  return max || "1900-01-01 00:00:00";
};

export interface SyncSummary {
  model: string;
  cursor: string;
  fetched: number;
  inserted: number;
  updated: number;
  skipped: number;
  durationMs: number;
}

const SOFT_BUDGET_MS = 18_000;

const syncBulkIncremental = async (
  cfg: ModelConfig,
  limit: number
): Promise<SyncSummary> => {
  const t0 = Date.now();
  requireConfigured();
  const uid = await getUid();
  const startCursor = await getMirrorCursor(cfg);
  let cursor = startCursor;
  let totalFetched = 0;
  let totalInserted = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;

  while (true) {
    if (Date.now() - t0 > SOFT_BUDGET_MS) break;

    const records = (await execute(
      uid,
      cfg.model,
      "search_read",
      [[["write_date", ">", cursor]]],
      {
        fields: odooFieldNames(cfg),
        limit,
        order: "write_date asc",
      }
    )) as Record<string, unknown>[];

    if (records.length === 0) break;

    const valid: Record<string, string>[] = [];
    let skipped = 0;
    for (const rec of records) {
      const id = rec.id;
      if (typeof id !== "number" || id <= 0) {
        skipped += 1;
        continue;
      }
      valid.push(flattenRow(rec, cfg.fields));
    }

    if (valid.length > 0) {
      const result = await batchUpsertRowsByField(cfg.tab, "id", valid);
      totalInserted += result.inserted;
      totalUpdated += result.updated;
    }

    totalFetched += records.length;
    totalSkipped += skipped;

    let maxWd = cursor;
    for (const rec of records) {
      const wd = rec.write_date;
      if (typeof wd === "string" && wd > maxWd) maxWd = wd;
    }
    cursor = maxWd;

    if (records.length < limit) break;
  }

  return {
    model: cfg.model,
    cursor: startCursor,
    fetched: totalFetched,
    inserted: totalInserted,
    updated: totalUpdated,
    skipped: totalSkipped,
    durationMs: Date.now() - t0,
  };
};

export const syncInvoicesIncremental = (limit = 250): Promise<SyncSummary> =>
  syncBulkIncremental(MODELS.invoice, limit);

export const syncPaymentsIncremental = (limit = 250): Promise<SyncSummary> =>
  syncBulkIncremental(MODELS.payment, limit);

export const syncSaleOrdersIncremental = (limit = 250): Promise<SyncSummary> =>
  syncBulkIncremental(MODELS.saleOrder, limit);

export const syncPurchaseOrdersIncremental = (limit = 250): Promise<SyncSummary> =>
  syncBulkIncremental(MODELS.purchaseOrder, limit);
