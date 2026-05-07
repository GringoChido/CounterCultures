/**
 * Accounts Receivable — factura request lifecycle.
 *
 * Flow: Javier or Roger triggers a factura request (email/WhatsApp) →
 * Finance creates a draft → issues via Solución Factible → attaches
 * PDF + XML to the record + Drive backup.
 *
 * Deposit handling: 70% deposit factura issued first, balance (finiquito)
 * factura references the deposit folio number. Both are linked here.
 *
 * Multi-company: CC = sales in Mexico, LLC = sales in USA. The company
 * determines which RFC stamps the factura.
 */

import {
  readSheet,
  appendRowByHeader,
  updateRowByHeader,
  findRowIndex,
} from "./dashboard-sheets";
import { ensureTab } from "./sheet-migrations";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FacturaRequestState =
  | "pending"
  | "draft"
  | "issued"
  | "files_attached"
  | "cancelled";

export type FacturaRequestSource = "javier_email" | "roger_transfer" | "manual";

export type FacturaCompany = "cc" | "llc";

export type PaymentMethod =
  | "wire"
  | "credit_card"
  | "debit_card"
  | "cash"
  | "cheque"
  | "stripe";

export type FacturaRecipientType = "personalized" | "general_public";

export type DepositType = "deposit" | "finiquito" | "full";

export type CreditNoteReason =
  | "return"
  | "defective"
  | "pricing_adjustment"
  | "cancelled_order"
  | "other";

export type CreditNoteApplication =
  | "refund"
  | "substitute_merchandise"
  | "apply_to_future"
  | "pending";

// ---------------------------------------------------------------------------
// Naming convention
// ---------------------------------------------------------------------------

/**
 * Parses the standard factura request naming convention:
 * COMPROBANTE_S01630_$ 22,500_MXN_SANTANDER_30 DIC 2025_T.CREDITO
 */
export const parseFacturaRequestName = (
  name: string
): {
  reference: string;
  amount: number;
  currency: string;
  bank: string;
  date: string;
  paymentMethod: string;
} | null => {
  const parts = name.split("_");
  if (parts.length < 6 || parts[0] !== "COMPROBANTE") return null;

  const reference = parts[1] ?? "";
  const rawAmount = (parts[2] ?? "").replace(/[$,\s]/g, "");
  const amount = parseFloat(rawAmount) || 0;
  const currency = parts[3] ?? "MXN";
  const bank = parts[4] ?? "";
  const date = parts[5] ?? "";
  const paymentMethod = parts.slice(6).join("_") || "";

  return { reference, amount, currency, bank, date, paymentMethod };
};

/**
 * Generates the standard naming convention for a factura request.
 */
export const buildFacturaRequestName = (input: {
  reference: string;
  amount: number;
  currency: string;
  bank: string;
  date: string;
  paymentMethod: string;
}): string => {
  const fmtAmount = `$ ${input.amount.toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
  return [
    "COMPROBANTE",
    input.reference,
    fmtAmount,
    input.currency,
    input.bank,
    input.date,
    input.paymentMethod,
  ].join("_");
};

// ---------------------------------------------------------------------------
// Deposit notes generation
// ---------------------------------------------------------------------------

export const buildDepositNotes = (input: {
  depositType: DepositType;
  depositPercent?: number;
  linkedFolio?: string;
}): string => {
  if (input.depositType === "deposit") {
    return `Anticipo ${input.depositPercent ?? 70}%`;
  }
  if (input.depositType === "finiquito") {
    return `Finiquito — anticipo facturado en folio ${input.linkedFolio ?? ""}`.trim();
  }
  return "";
};

// ---------------------------------------------------------------------------
// Company determination
// ---------------------------------------------------------------------------

export const determineCompany = (
  country: "mexico" | "usa" | string
): FacturaCompany => {
  if (country === "usa" || country === "us") return "llc";
  return "cc";
};

// ---------------------------------------------------------------------------
// Sheet row types
// ---------------------------------------------------------------------------

interface ARFacturaRequestRow extends Record<string, string> {
  id: string;
  state: string;
  source: string;
  company: string;
  request_name: string;
  customer_name: string;
  customer_rfc: string;
  recipient_type: string;
  amount: string;
  currency: string;
  bank: string;
  payment_method: string;
  payment_date: string;
  deposit_type: string;
  deposit_percent: string;
  linked_folio: string;
  factura_folio: string;
  factura_notes: string;
  pdf_drive_url: string;
  xml_drive_url: string;
  solucion_factible_id: string;
  requested_by: string;
  requested_at: string;
  issued_at: string;
  issued_by: string;
  order_reference: string;
  invoice_id: string;
  notes: string;
  updated_at: string;
}

export interface ARFacturaRequest {
  id: string;
  state: FacturaRequestState;
  source: FacturaRequestSource;
  company: FacturaCompany;
  requestName: string;
  customerName: string;
  customerRfc: string;
  recipientType: FacturaRecipientType;
  amount: number;
  currency: string;
  bank: string;
  paymentMethod: string;
  paymentDate: string;
  depositType: DepositType;
  depositPercent: number;
  linkedFolio: string;
  facturaFolio: string;
  facturaNotes: string;
  pdfDriveUrl: string;
  xmlDriveUrl: string;
  solucionFactibleId: string;
  requestedBy: string;
  requestedAt: string;
  issuedAt: string;
  issuedBy: string;
  orderReference: string;
  invoiceId: string;
  notes: string;
  updatedAt: string;
}

interface ARCreditNoteRow extends Record<string, string> {
  id: string;
  original_invoice_id: string;
  original_folio: string;
  customer_name: string;
  customer_rfc: string;
  company: string;
  amount: string;
  currency: string;
  reason: string;
  application: string;
  applied_to_invoice_id: string;
  refund_reference: string;
  substitute_details: string;
  notes: string;
  created_at: string;
  created_by: string;
  resolved_at: string;
  updated_at: string;
}

export interface ARCreditNote {
  id: string;
  originalInvoiceId: string;
  originalFolio: string;
  customerName: string;
  customerRfc: string;
  company: FacturaCompany;
  amount: number;
  currency: string;
  reason: CreditNoteReason;
  application: CreditNoteApplication;
  appliedToInvoiceId: string;
  refundReference: string;
  substituteDetails: string;
  notes: string;
  createdAt: string;
  createdBy: string;
  resolvedAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Row ↔ Domain mappers
// ---------------------------------------------------------------------------

const isState = (s: string): s is FacturaRequestState =>
  ["pending", "draft", "issued", "files_attached", "cancelled"].includes(s);

const isSource = (s: string): s is FacturaRequestSource =>
  ["javier_email", "roger_transfer", "manual"].includes(s);

const isCompany = (s: string): s is FacturaCompany =>
  s === "cc" || s === "llc";

const isRecipientType = (s: string): s is FacturaRecipientType =>
  s === "personalized" || s === "general_public";

const isDepositType = (s: string): s is DepositType =>
  ["deposit", "finiquito", "full"].includes(s);

const isCreditNoteReason = (s: string): s is CreditNoteReason =>
  ["return", "defective", "pricing_adjustment", "cancelled_order", "other"].includes(s);

const isCreditNoteApplication = (s: string): s is CreditNoteApplication =>
  ["refund", "substitute_merchandise", "apply_to_future", "pending"].includes(s);

const toRequest = (row: ARFacturaRequestRow): ARFacturaRequest => ({
  id: row.id,
  state: isState(row.state) ? row.state : "pending",
  source: isSource(row.source) ? row.source : "manual",
  company: isCompany(row.company) ? row.company : "cc",
  requestName: row.request_name || "",
  customerName: row.customer_name || "",
  customerRfc: row.customer_rfc || "",
  recipientType: isRecipientType(row.recipient_type) ? row.recipient_type : "general_public",
  amount: parseFloat(row.amount) || 0,
  currency: row.currency || "MXN",
  bank: row.bank || "",
  paymentMethod: row.payment_method || "",
  paymentDate: row.payment_date || "",
  depositType: isDepositType(row.deposit_type) ? row.deposit_type : "full",
  depositPercent: parseFloat(row.deposit_percent) || 100,
  linkedFolio: row.linked_folio || "",
  facturaFolio: row.factura_folio || "",
  facturaNotes: row.factura_notes || "",
  pdfDriveUrl: row.pdf_drive_url || "",
  xmlDriveUrl: row.xml_drive_url || "",
  solucionFactibleId: row.solucion_factible_id || "",
  requestedBy: row.requested_by || "",
  requestedAt: row.requested_at || "",
  issuedAt: row.issued_at || "",
  issuedBy: row.issued_by || "",
  orderReference: row.order_reference || "",
  invoiceId: row.invoice_id || "",
  notes: row.notes || "",
  updatedAt: row.updated_at || "",
});

const toCreditNote = (row: ARCreditNoteRow): ARCreditNote => ({
  id: row.id,
  originalInvoiceId: row.original_invoice_id || "",
  originalFolio: row.original_folio || "",
  customerName: row.customer_name || "",
  customerRfc: row.customer_rfc || "",
  company: isCompany(row.company) ? row.company : "cc",
  amount: parseFloat(row.amount) || 0,
  currency: row.currency || "MXN",
  reason: isCreditNoteReason(row.reason) ? row.reason : "other",
  application: isCreditNoteApplication(row.application) ? row.application : "pending",
  appliedToInvoiceId: row.applied_to_invoice_id || "",
  refundReference: row.refund_reference || "",
  substituteDetails: row.substitute_details || "",
  notes: row.notes || "",
  createdAt: row.created_at || "",
  createdBy: row.created_by || "",
  resolvedAt: row.resolved_at || "",
  updatedAt: row.updated_at || "",
});

// ---------------------------------------------------------------------------
// CRUD helpers
// ---------------------------------------------------------------------------

const SHEET_TAB = "AR_Factura_Requests" as const;
const CREDIT_NOTES_TAB = "AR_Credit_Notes" as const;

const AR_REQUEST_HEADERS = [
  "id", "state", "source", "company", "request_name", "customer_name",
  "customer_rfc", "recipient_type", "amount", "currency", "bank",
  "payment_method", "payment_date", "deposit_type", "deposit_percent",
  "linked_folio", "factura_folio", "factura_notes", "pdf_drive_url",
  "xml_drive_url", "solucion_factible_id", "requested_by", "requested_at",
  "issued_at", "issued_by", "order_reference", "invoice_id", "notes",
  "updated_at",
];

const AR_CREDIT_NOTE_HEADERS = [
  "id", "original_invoice_id", "original_folio", "customer_name",
  "customer_rfc", "company", "amount", "currency", "reason", "application",
  "applied_to_invoice_id", "refund_reference", "substitute_details",
  "notes", "created_at", "created_by", "resolved_at", "updated_at",
];

let migrationDone = false;

const ensureARTabs = async (): Promise<void> => {
  if (migrationDone) return;
  await Promise.all([
    ensureTab(SHEET_TAB, AR_REQUEST_HEADERS),
    ensureTab(CREDIT_NOTES_TAB, AR_CREDIT_NOTE_HEADERS),
  ]);
  migrationDone = true;
};

export const listFacturaRequests = async (): Promise<ARFacturaRequest[]> => {
  await ensureARTabs();
  try {
    const rows = await readSheet<ARFacturaRequestRow>(SHEET_TAB);
    return rows.map(toRequest);
  } catch {
    return [];
  }
};

export const getFacturaRequest = async (
  id: string
): Promise<ARFacturaRequest | null> => {
  const all = await listFacturaRequests();
  return all.find((r) => r.id === id) ?? null;
};

export const createFacturaRequest = async (
  input: Omit<ARFacturaRequest, "id" | "updatedAt">
): Promise<ARFacturaRequest> => {
  const now = new Date().toISOString();
  const id = `AR-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const fields: Record<string, string> = {
    id,
    state: input.state,
    source: input.source,
    company: input.company,
    request_name: input.requestName,
    customer_name: input.customerName,
    customer_rfc: input.customerRfc,
    recipient_type: input.recipientType,
    amount: String(input.amount),
    currency: input.currency,
    bank: input.bank,
    payment_method: input.paymentMethod,
    payment_date: input.paymentDate,
    deposit_type: input.depositType,
    deposit_percent: String(input.depositPercent),
    linked_folio: input.linkedFolio,
    factura_folio: input.facturaFolio,
    factura_notes: input.facturaNotes,
    pdf_drive_url: input.pdfDriveUrl,
    xml_drive_url: input.xmlDriveUrl,
    solucion_factible_id: input.solucionFactibleId,
    requested_by: input.requestedBy,
    requested_at: input.requestedAt,
    issued_at: input.issuedAt,
    issued_by: input.issuedBy,
    order_reference: input.orderReference,
    invoice_id: input.invoiceId,
    notes: input.notes,
    updated_at: now,
  };

  await appendRowByHeader(SHEET_TAB, fields);
  return { ...input, id, updatedAt: now };
};

export const updateFacturaRequestState = async (
  id: string,
  state: FacturaRequestState,
  updates?: Partial<Record<string, string>>
): Promise<ARFacturaRequest | null> => {
  const idx = await findRowIndex(SHEET_TAB, "id", id);
  if (idx === null) return null;

  const now = new Date().toISOString();
  const fields: Record<string, string> = {
    state,
    updated_at: now,
    ...updates,
  };

  if (state === "issued" && !updates?.issued_at) {
    fields.issued_at = now;
  }

  await updateRowByHeader(SHEET_TAB, idx, fields);
  return getFacturaRequest(id);
};

export const attachFacturaFiles = async (
  id: string,
  pdfUrl: string,
  xmlUrl: string,
  folio: string
): Promise<ARFacturaRequest | null> => {
  return updateFacturaRequestState(id, "files_attached", {
    pdf_drive_url: pdfUrl,
    xml_drive_url: xmlUrl,
    factura_folio: folio,
  });
};

// ---------------------------------------------------------------------------
// Credit notes
// ---------------------------------------------------------------------------

export const listCreditNotes = async (): Promise<ARCreditNote[]> => {
  await ensureARTabs();
  try {
    const rows = await readSheet<ARCreditNoteRow>(CREDIT_NOTES_TAB);
    return rows.map(toCreditNote);
  } catch {
    return [];
  }
};

export const createCreditNote = async (
  input: Omit<ARCreditNote, "id" | "updatedAt">
): Promise<ARCreditNote> => {
  const now = new Date().toISOString();
  const id = `CN-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const fields: Record<string, string> = {
    id,
    original_invoice_id: input.originalInvoiceId,
    original_folio: input.originalFolio,
    customer_name: input.customerName,
    customer_rfc: input.customerRfc,
    company: input.company,
    amount: String(input.amount),
    currency: input.currency,
    reason: input.reason,
    application: input.application,
    applied_to_invoice_id: input.appliedToInvoiceId,
    refund_reference: input.refundReference,
    substitute_details: input.substituteDetails,
    notes: input.notes,
    created_at: input.createdAt,
    created_by: input.createdBy,
    resolved_at: input.resolvedAt,
    updated_at: now,
  };

  await appendRowByHeader(CREDIT_NOTES_TAB, fields);
  return { ...input, id, updatedAt: now };
};

// ---------------------------------------------------------------------------
// Deposit linking helpers
// ---------------------------------------------------------------------------

export const findLinkedDeposits = async (
  folio: string
): Promise<ARFacturaRequest[]> => {
  const all = await listFacturaRequests();
  return all.filter(
    (r) => r.linkedFolio === folio || r.facturaFolio === folio
  );
};

export const getDepositPair = async (
  id: string
): Promise<{ deposit: ARFacturaRequest | null; finiquito: ARFacturaRequest | null }> => {
  const request = await getFacturaRequest(id);
  if (!request) return { deposit: null, finiquito: null };

  if (request.depositType === "deposit" && request.facturaFolio) {
    const all = await listFacturaRequests();
    const finiquito = all.find(
      (r) => r.linkedFolio === request.facturaFolio && r.depositType === "finiquito"
    );
    return { deposit: request, finiquito: finiquito ?? null };
  }

  if (request.depositType === "finiquito" && request.linkedFolio) {
    const all = await listFacturaRequests();
    const deposit = all.find(
      (r) => r.facturaFolio === request.linkedFolio && r.depositType === "deposit"
    );
    return { deposit: deposit ?? null, finiquito: request };
  }

  return { deposit: null, finiquito: null };
};

// ---------------------------------------------------------------------------
// Summary / aggregation helpers for the dashboard
// ---------------------------------------------------------------------------

export interface ARSummary {
  pendingRequests: number;
  draftRequests: number;
  issuedThisMonth: number;
  totalIssuedAmount: Record<string, number>;
  pendingAmount: Record<string, number>;
  openCreditNotes: number;
  creditNoteTotal: Record<string, number>;
  byCompany: {
    cc: { pending: number; issued: number };
    llc: { pending: number; issued: number };
  };
}

export const getARSummary = async (): Promise<ARSummary> => {
  const requests = await listFacturaRequests();
  const creditNotes = await listCreditNotes();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const pending = requests.filter((r) => r.state === "pending");
  const drafts = requests.filter((r) => r.state === "draft");
  const issuedThisMonth = requests.filter(
    (r) =>
      (r.state === "issued" || r.state === "files_attached") &&
      r.issuedAt >= monthStart
  );
  const allIssued = requests.filter(
    (r) => r.state === "issued" || r.state === "files_attached"
  );

  const pendingAmount: Record<string, number> = {};
  for (const r of [...pending, ...drafts]) {
    pendingAmount[r.currency] = (pendingAmount[r.currency] ?? 0) + r.amount;
  }

  const totalIssuedAmount: Record<string, number> = {};
  for (const r of allIssued) {
    totalIssuedAmount[r.currency] = (totalIssuedAmount[r.currency] ?? 0) + r.amount;
  }

  const openCN = creditNotes.filter((cn) => cn.application === "pending");
  const creditNoteTotal: Record<string, number> = {};
  for (const cn of openCN) {
    creditNoteTotal[cn.currency] = (creditNoteTotal[cn.currency] ?? 0) + cn.amount;
  }

  return {
    pendingRequests: pending.length,
    draftRequests: drafts.length,
    issuedThisMonth: issuedThisMonth.length,
    totalIssuedAmount,
    pendingAmount,
    openCreditNotes: openCN.length,
    creditNoteTotal,
    byCompany: {
      cc: {
        pending: requests.filter((r) => r.company === "cc" && (r.state === "pending" || r.state === "draft")).length,
        issued: requests.filter((r) => r.company === "cc" && (r.state === "issued" || r.state === "files_attached")).length,
      },
      llc: {
        pending: requests.filter((r) => r.company === "llc" && (r.state === "pending" || r.state === "draft")).length,
        issued: requests.filter((r) => r.company === "llc" && (r.state === "issued" || r.state === "files_attached")).length,
      },
    },
  };
};
