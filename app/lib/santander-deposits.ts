/**
 * Santander deposit feed — the canonical trigger for factura requests.
 *
 * Per docs/finance/CLAUDE-FINANCE-RULES.md:
 * - ALL Santander deposits require a factura (rule 1-2)
 * - Owner (Roger) transfers do NOT auto-queue (rule 3)
 * - NetPay deposits do NOT generate facturas (rule 5)
 */

import {
  readSheet,
  appendRowByHeader,
  updateRowByHeader,
  findRowIndex,
} from "./dashboard-sheets";
import { ensureTab } from "./sheet-migrations";

export type DepositSource = "customer" | "roger_transfer" | "netpay" | "other";
export type DepositStatus = "pending" | "factura_queued" | "skipped";
export type PaymentMethodType = "wire" | "credit_card" | "debit_card" | "cash" | "cheque" | "other";

export interface SantanderDeposit {
  id: string;
  date: string;
  amount: number;
  currency: string;
  reference: string;
  source: DepositSource;
  paymentMethod: PaymentMethodType;
  customerId: string;
  customerName: string;
  notes: string;
  attachmentUrl: string;
  status: DepositStatus;
  facturaRequestId: string;
  importedAt: string;
  importedBy: string;
}

interface DepositRow extends Record<string, string> {
  id: string;
  date: string;
  amount: string;
  currency: string;
  reference: string;
  source: string;
  payment_method: string;
  customer_id: string;
  customer_name: string;
  notes: string;
  attachment_url: string;
  status: string;
  factura_request_id: string;
  imported_at: string;
  imported_by: string;
}

const TAB = "Santander_Deposits" as const;
const HEADERS = [
  "id", "date", "amount", "currency", "reference", "source", "payment_method",
  "customer_id", "customer_name", "notes", "attachment_url", "status",
  "factura_request_id", "imported_at", "imported_by",
];

let migrated = false;
const ensureDepositTab = async () => {
  if (migrated) return;
  await ensureTab(TAB, HEADERS);
  migrated = true;
};

const toDeposit = (row: DepositRow): SantanderDeposit => ({
  id: row.id,
  date: row.date,
  amount: parseFloat(row.amount) || 0,
  currency: row.currency || "MXN",
  reference: row.reference || "",
  source: (["customer", "roger_transfer", "netpay", "other"].includes(row.source) ? row.source : "other") as DepositSource,
  paymentMethod: (["wire", "credit_card", "debit_card", "cash", "cheque", "other"].includes(row.payment_method) ? row.payment_method : "other") as PaymentMethodType,
  customerId: row.customer_id || "",
  customerName: row.customer_name || "",
  notes: row.notes || "",
  attachmentUrl: row.attachment_url || "",
  status: (["pending", "factura_queued", "skipped"].includes(row.status) ? row.status : "pending") as DepositStatus,
  facturaRequestId: row.factura_request_id || "",
  importedAt: row.imported_at || "",
  importedBy: row.imported_by || "",
});

export const listDeposits = async (filter?: { status?: DepositStatus; source?: DepositSource }): Promise<SantanderDeposit[]> => {
  await ensureDepositTab();
  const rows = await readSheet<DepositRow>(TAB);
  let deposits = rows.map(toDeposit);
  if (filter?.status) deposits = deposits.filter((d) => d.status === filter.status);
  if (filter?.source) deposits = deposits.filter((d) => d.source === filter.source);
  return deposits.sort((a, b) => b.date.localeCompare(a.date));
};

export const createDeposit = async (
  input: Omit<SantanderDeposit, "id" | "status" | "facturaRequestId">
): Promise<SantanderDeposit> => {
  await ensureDepositTab();
  const id = `SD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  await appendRowByHeader(TAB, {
    id,
    date: input.date,
    amount: String(input.amount),
    currency: input.currency,
    reference: input.reference,
    source: input.source,
    payment_method: input.paymentMethod,
    customer_id: input.customerId,
    customer_name: input.customerName,
    notes: input.notes,
    attachment_url: input.attachmentUrl,
    status: "pending",
    factura_request_id: "",
    imported_at: input.importedAt,
    imported_by: input.importedBy,
  });

  return { ...input, id, status: "pending", facturaRequestId: "" };
};

export const linkDepositToFactura = async (depositId: string, facturaRequestId: string): Promise<void> => {
  const idx = await findRowIndex(TAB, "id", depositId);
  if (idx === null) return;
  await updateRowByHeader(TAB, idx, {
    status: "factura_queued",
    factura_request_id: facturaRequestId,
  });
};

export const skipDeposit = async (depositId: string): Promise<void> => {
  const idx = await findRowIndex(TAB, "id", depositId);
  if (idx === null) return;
  await updateRowByHeader(TAB, idx, { status: "skipped" });
};

/**
 * Deduplicate by reference number when importing from CSV.
 * Returns only new deposits (not already in the sheet).
 */
export const deduplicateByReference = async (incoming: Array<{ reference: string }>): Promise<Set<string>> => {
  await ensureDepositTab();
  const existing = await readSheet<DepositRow>(TAB);
  const existingRefs = new Set(existing.map((r) => r.reference).filter(Boolean));
  const newRefs = new Set<string>();
  for (const item of incoming) {
    if (item.reference && !existingRefs.has(item.reference)) {
      newRefs.add(item.reference);
    }
  }
  return newRefs;
};
