/**
 * Invoice approval workflow — tracks the prefactura → approved → stamped
 * lifecycle that Roger's CFDI process actually follows.
 *
 * Why this exists: stamping a CFDI before client approval is dangerous in
 * Mexico. Cancelling a stamped CFDI requires a SAT cancellation flow with
 * a 72-hour customer-approval window. So Roger's real-world workflow is:
 *   1. Generate prefactura draft
 *   2. Send to customer for review
 *   3. Customer says "yes" (typically email reply today; signature later)
 *   4. ONLY THEN stamp the real CFDI
 *
 * This module is the system-of-record for steps 1-3. The dashboard's CFDI
 * attach action gates on `state === "approved"` so step 4 can't happen
 * prematurely (with an owner-role override for edge cases).
 *
 * Schema (Invoice_Approvals sheet tab — admin must seed the header row):
 *   invoice_id | invoice_name | state | prefactura_sent_at |
 *   prefactura_sent_by | prefactura_recipient | approved_at | approved_by |
 *   approval_method | approval_note | stamped_at | updated_at
 *
 * One row per invoice, upserted on every state transition.
 */

import {
  readSheet,
  appendRow,
  updateRow,
  findRowIndex,
} from "./dashboard-sheets";

export type ApprovalState =
  | "draft"
  | "prefactura_sent"
  | "approved"
  | "stamped";

export type ApprovalMethod =
  | "email_reply"
  | "signature"
  | "verbal"
  | "in_person"
  | "override"
  | "other";

/**
 * Two factura paths CC actually uses:
 *   - "personalized": customer requested a factura with their RFC. Requires
 *     internal approval from Javier (the gallery sales rep) before Finance
 *     stamps. This is the path the prefactura → approval → stamp gate
 *     was originally built for.
 *   - "general_public": customer didn't request a personalized factura.
 *     Issued to "Público en general" — no approval step. Finance stamps
 *     directly and the dashboard just attaches the resulting XML+PDF.
 */
export type FacturaType = "personalized" | "general_public";

interface InvoiceApprovalRow extends Record<string, string> {
  invoice_id: string;
  invoice_name: string;
  state: string;
  factura_type: string;
  prefactura_sent_at: string;
  prefactura_sent_by: string;
  prefactura_recipient: string;
  prefactura_thread_id: string;
  approved_at: string;
  approved_by: string;
  approval_method: string;
  approval_note: string;
  stamped_at: string;
  updated_at: string;
}

const COLUMNS: (keyof InvoiceApprovalRow)[] = [
  "invoice_id",
  "invoice_name",
  "state",
  "factura_type",
  "prefactura_sent_at",
  "prefactura_sent_by",
  "prefactura_recipient",
  "prefactura_thread_id",
  "approved_at",
  "approved_by",
  "approval_method",
  "approval_note",
  "stamped_at",
  "updated_at",
];

export interface InvoiceApproval {
  invoiceId: number;
  invoiceName: string;
  state: ApprovalState;
  /** "personalized" requires approval; "general_public" skips it entirely. */
  facturaType: FacturaType;
  prefacturaSentAt: string;
  prefacturaSentBy: string;
  prefacturaRecipient: string;
  /** Gmail thread ID of the prefactura email — surfaced as a deep-link
   *  on the invoice page since Finance noted these threads already
   *  contain the RFC + payment receipt + final factura. */
  prefacturaThreadId: string;
  approvedAt: string;
  approvedBy: string;
  approvalMethod: string;
  approvalNote: string;
  stampedAt: string;
  updatedAt: string;
}

const isApprovalState = (s: string): s is ApprovalState =>
  s === "draft" ||
  s === "prefactura_sent" ||
  s === "approved" ||
  s === "stamped";

const isFacturaType = (s: string): s is FacturaType =>
  s === "personalized" || s === "general_public";

const toApproval = (row: InvoiceApprovalRow): InvoiceApproval => ({
  invoiceId: Number(row.invoice_id) || 0,
  invoiceName: row.invoice_name || "",
  state: isApprovalState(row.state) ? row.state : "draft",
  facturaType: isFacturaType(row.factura_type ?? "")
    ? (row.factura_type as FacturaType)
    : "personalized",
  prefacturaSentAt: row.prefactura_sent_at || "",
  prefacturaSentBy: row.prefactura_sent_by || "",
  prefacturaRecipient: row.prefactura_recipient || "",
  prefacturaThreadId: row.prefactura_thread_id || "",
  approvedAt: row.approved_at || "",
  approvedBy: row.approved_by || "",
  approvalMethod: row.approval_method || "",
  approvalNote: row.approval_note || "",
  stampedAt: row.stamped_at || "",
  updatedAt: row.updated_at || "",
});

const toRow = (a: InvoiceApproval): InvoiceApprovalRow => ({
  invoice_id: String(a.invoiceId),
  invoice_name: a.invoiceName,
  state: a.state,
  factura_type: a.facturaType,
  prefactura_sent_at: a.prefacturaSentAt,
  prefactura_sent_by: a.prefacturaSentBy,
  prefactura_recipient: a.prefacturaRecipient,
  prefactura_thread_id: a.prefacturaThreadId,
  approved_at: a.approvedAt,
  approved_by: a.approvedBy,
  approval_method: a.approvalMethod,
  approval_note: a.approvalNote,
  stamped_at: a.stampedAt,
  updated_at: a.updatedAt,
});

/**
 * Returns the approval record for the invoice, or a freshly-defaulted
 * "draft" record if no row exists yet. Callers can always assume a record
 * exists — the difference is whether anything has happened yet.
 */
export const getInvoiceApproval = async (
  invoiceId: number,
  invoiceName?: string
): Promise<InvoiceApproval> => {
  let rows: InvoiceApprovalRow[] = [];
  try {
    rows = await readSheet<InvoiceApprovalRow>("Invoice_Approvals");
  } catch {
    rows = [];
  }
  const existing = rows.find((r) => r.invoice_id === String(invoiceId));
  if (existing) return toApproval(existing);
  return {
    invoiceId,
    invoiceName: invoiceName ?? "",
    state: "draft",
    facturaType: "personalized",
    prefacturaSentAt: "",
    prefacturaSentBy: "",
    prefacturaRecipient: "",
    prefacturaThreadId: "",
    approvedAt: "",
    approvedBy: "",
    approvalMethod: "",
    approvalNote: "",
    stampedAt: "",
    updatedAt: "",
  };
};

const upsert = async (next: InvoiceApproval): Promise<void> => {
  const idx = await findRowIndex(
    "Invoice_Approvals",
    "invoice_id",
    String(next.invoiceId)
  );
  const values = COLUMNS.map((c) => toRow(next)[c]);
  if (idx === null) {
    await appendRow("Invoice_Approvals", values);
  } else {
    await updateRow("Invoice_Approvals", idx, values);
  }
};

export const recordPrefacturaSent = async (input: {
  invoiceId: number;
  invoiceName: string;
  byEmail: string;
  recipient: string;
  /** Gmail thread ID — captured for direct linking on the invoice page
   *  since Finance noted these threads contain RFC + payment receipt + final factura. */
  threadId?: string;
}): Promise<InvoiceApproval> => {
  const now = new Date().toISOString();
  const current = await getInvoiceApproval(input.invoiceId, input.invoiceName);
  // If already past prefactura stage, don't regress — but DO update the
  // sent timestamp/recipient so re-sends are traceable. State stays at
  // its current more-advanced value.
  const state: ApprovalState =
    current.state === "approved" || current.state === "stamped"
      ? current.state
      : "prefactura_sent";
  const next: InvoiceApproval = {
    ...current,
    invoiceName: input.invoiceName || current.invoiceName,
    state,
    prefacturaSentAt: now,
    prefacturaSentBy: input.byEmail,
    prefacturaRecipient: input.recipient,
    prefacturaThreadId: input.threadId ?? current.prefacturaThreadId,
    updatedAt: now,
  };
  await upsert(next);
  return next;
};

/**
 * Sets the factura type on an invoice — either kicks off the personalized
 * approval workflow or marks it as general public (no approval needed,
 * Attach CFDI button unlocks immediately).
 *
 * Refuses to change type after stamping — the stamp commits to one path.
 */
export const setFacturaType = async (input: {
  invoiceId: number;
  invoiceName: string;
  type: FacturaType;
  byEmail: string;
}): Promise<InvoiceApproval> => {
  const now = new Date().toISOString();
  const current = await getInvoiceApproval(input.invoiceId, input.invoiceName);
  if (current.state === "stamped") {
    throw new Error(
      `Invoice ${input.invoiceName} is already stamped — factura type is locked`
    );
  }
  const next: InvoiceApproval = {
    ...current,
    invoiceName: input.invoiceName || current.invoiceName,
    facturaType: input.type,
    updatedAt: now,
  };
  await upsert(next);
  return next;
};

export const recordApproved = async (input: {
  invoiceId: number;
  invoiceName: string;
  byEmail: string;
  method: ApprovalMethod;
  note?: string;
}): Promise<InvoiceApproval> => {
  const now = new Date().toISOString();
  const current = await getInvoiceApproval(input.invoiceId, input.invoiceName);
  if (current.state === "stamped") {
    throw new Error(
      `Invoice ${input.invoiceName} is already stamped — cannot revert to approval stage`
    );
  }
  const next: InvoiceApproval = {
    ...current,
    invoiceName: input.invoiceName || current.invoiceName,
    state: "approved",
    approvedAt: now,
    approvedBy: input.byEmail,
    approvalMethod: input.method,
    approvalNote: input.note ?? "",
    updatedAt: now,
  };
  await upsert(next);
  return next;
};

export const recordStamped = async (input: {
  invoiceId: number;
  invoiceName: string;
  byEmail: string;
  override?: boolean;
}): Promise<InvoiceApproval> => {
  const now = new Date().toISOString();
  const current = await getInvoiceApproval(input.invoiceId, input.invoiceName);
  // If marked stamped via override, keep existing approval data so the
  // audit trail shows "stamped without explicit approval log."
  const next: InvoiceApproval = {
    ...current,
    invoiceName: input.invoiceName || current.invoiceName,
    state: "stamped",
    stampedAt: now,
    approvalNote: input.override
      ? `${current.approvalNote}${current.approvalNote ? "\n" : ""}[stamped via override by ${input.byEmail} at ${now}]`
      : current.approvalNote,
    updatedAt: now,
  };
  await upsert(next);
  return next;
};
