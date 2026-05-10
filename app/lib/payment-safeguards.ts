/**
 * Payment-bill association safeguards.
 *
 * Core rule: once a payment is applied to a bill or invoice, that link
 * is NEVER silently removed. If a correction requires changing the
 * amount, date, or memo, the payment-bill link stays intact.
 *
 * This was the #1 pain point from the finance person's Odoo experience:
 * any minor edit to a payment or bill would disassociate them, creating
 * phantom credits and requiring manual re-application.
 *
 * For this small business, payments apply immediately — no hold accounts,
 * no intermediate reconciliation. Status reflects reality in real time.
 */

import { readSheet, updateRowByHeader, findRowIndex } from "./dashboard-sheets";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PaymentRecord extends Record<string, string> {
  id: string;
  name: string;
  state: string;
  payment_type: string;
  partner_id: string;
  partner_name: string;
  amount: string;
  currency_id: string;
  journal_id: string;
  journal_name: string;
  payment_method_line_id: string;
  payment_method_name: string;
  date: string;
  ref: string;
  memo: string;
  reconciled_invoice_ids: string;
  reconciled_bill_ids: string;
  cfdi_uuid: string;
}

export interface PaymentUpdate {
  date?: string;
  ref?: string;
  memo?: string;
  amount?: string;
  journal_id?: string;
  currency_id?: string;
  exchange_rate?: string;
  force?: boolean;
}

export interface SafeguardResult {
  allowed: boolean;
  requiresConfirmation?: boolean;
  reason?: string;
  warnings: string[];
  preservedLinks: {
    invoiceIds: string[];
    billIds: string[];
  };
}

// ---------------------------------------------------------------------------
// Editable fields — everything NOT in this list is read-only
// ---------------------------------------------------------------------------

const EDITABLE_FIELDS = new Set(["date", "ref", "memo", "amount", "journal_id", "currency_id", "exchange_rate"]);

const CONFIRMATION_FIELDS = new Set(["amount", "currency_id", "exchange_rate"]);

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Validates a payment update request. Returns whether the update is
 * allowed, any warnings, and confirms which links are preserved.
 *
 * Rules:
 * 1. reconciled_invoice_ids and reconciled_bill_ids can NEVER be modified
 * 2. Only date, ref, memo, and amount are editable
 * 3. Cancelled payments cannot be edited
 * 4. Amount changes on reconciled payments generate a warning but are allowed
 */
export const validatePaymentUpdate = async (
  paymentId: string,
  updates: Record<string, string>
): Promise<SafeguardResult> => {
  const rows = await readSheet<PaymentRecord>("Odoo_Payments");
  const payment = rows.find((r) => r.id === paymentId);

  if (!payment) {
    return {
      allowed: false,
      reason: "Payment not found",
      warnings: [],
      preservedLinks: { invoiceIds: [], billIds: [] },
    };
  }

  if (payment.state === "cancel") {
    return {
      allowed: false,
      reason: "Cancelled payments cannot be edited",
      warnings: [],
      preservedLinks: { invoiceIds: [], billIds: [] },
    };
  }

  const invoiceIds = payment.reconciled_invoice_ids
    ? payment.reconciled_invoice_ids.split(",").filter(Boolean)
    : [];
  const billIds = payment.reconciled_bill_ids
    ? payment.reconciled_bill_ids.split(",").filter(Boolean)
    : [];

  const blockedFields = Object.keys(updates).filter(
    (k) => !EDITABLE_FIELDS.has(k)
  );
  if (blockedFields.length > 0) {
    const isReconciliationField = blockedFields.some(
      (f) => f === "reconciled_invoice_ids" || f === "reconciled_bill_ids"
    );
    return {
      allowed: false,
      reason: isReconciliationField
        ? "Payment-bill links cannot be removed. If you need to re-apply this payment, contact your administrator."
        : `Fields not editable: ${blockedFields.join(", ")}`,
      warnings: [],
      preservedLinks: { invoiceIds, billIds },
    };
  }

  const warnings: string[] = [];
  const isReconciled = invoiceIds.length > 0 || billIds.length > 0;
  const touchesConfirmationField = Object.keys(updates).some((k) => CONFIRMATION_FIELDS.has(k));

  if (updates.amount && isReconciled) {
    const oldAmount = parseFloat(payment.amount) || 0;
    const newAmount = parseFloat(updates.amount) || 0;
    if (Math.abs(oldAmount - newAmount) > 0.01) {
      warnings.push(
        `Amount changed from $${oldAmount.toLocaleString()} to $${newAmount.toLocaleString()} — ` +
        `payment remains applied to ${invoiceIds.length + billIds.length} document(s). ` +
        `Verify the balance is correct.`
      );
    }
  }

  if (updates.currency_id && isReconciled && updates.currency_id !== payment.currency_id) {
    warnings.push(
      `Currency changed from ${payment.currency_id} to ${updates.currency_id} — ` +
      `reconciliations with ${invoiceIds.length + billIds.length} document(s) will be preserved.`
    );
  }

  if (updates.exchange_rate && isReconciled) {
    warnings.push(
      `Exchange rate updated — reconciliations with ${invoiceIds.length + billIds.length} document(s) will be preserved.`
    );
  }

  if (isReconciled && touchesConfirmationField) {
    return {
      allowed: true,
      requiresConfirmation: true,
      warnings,
      preservedLinks: { invoiceIds, billIds },
    };
  }

  return {
    allowed: true,
    warnings,
    preservedLinks: { invoiceIds, billIds },
  };
};

/**
 * Applies a validated update to a payment record. The reconciliation
 * fields are explicitly preserved — they cannot be cleared even if
 * someone tries to pass them.
 */
export const applyPaymentUpdate = async (
  paymentId: string,
  updates: PaymentUpdate
): Promise<{ ok: boolean; error?: string; warnings: string[]; requiresConfirmation?: boolean; preservedLinks?: SafeguardResult["preservedLinks"] }> => {
  const { force, ...rest } = updates;
  const cleanUpdates: Record<string, string> = {};
  for (const [k, v] of Object.entries(rest)) {
    if (v !== undefined && EDITABLE_FIELDS.has(k)) {
      cleanUpdates[k] = String(v);
    }
  }

  const validation = await validatePaymentUpdate(paymentId, cleanUpdates);
  if (!validation.allowed) {
    return { ok: false, error: validation.reason, warnings: validation.warnings };
  }

  if (validation.requiresConfirmation && !force) {
    return {
      ok: false,
      requiresConfirmation: true,
      warnings: validation.warnings,
      preservedLinks: validation.preservedLinks,
    };
  }

  const idx = await findRowIndex("Odoo_Payments", "id", paymentId);
  if (idx === null) {
    return { ok: false, error: "Payment not found", warnings: [] };
  }

  await updateRowByHeader("Odoo_Payments", idx, cleanUpdates);

  return { ok: true, warnings: validation.warnings };
};

// ---------------------------------------------------------------------------
// Invoice/bill edit safeguard — check before allowing invoice edits
// ---------------------------------------------------------------------------

/**
 * Before editing an invoice or bill, check if it has applied payments.
 * If it does, the edit is allowed but the payment links STAY.
 * Returns the linked payment IDs so the UI can show a confirmation.
 */
export const checkInvoicePaymentLinks = async (
  invoiceId: string
): Promise<{
  hasPayments: boolean;
  paymentIds: string[];
  paymentNames: string[];
  message: string;
}> => {
  const payments = await readSheet<PaymentRecord>("Odoo_Payments");

  const linked = payments.filter((p) => {
    const invoiceIds = p.reconciled_invoice_ids?.split(",") ?? [];
    const billIds = p.reconciled_bill_ids?.split(",") ?? [];
    return invoiceIds.includes(invoiceId) || billIds.includes(invoiceId);
  });

  if (linked.length === 0) {
    return {
      hasPayments: false,
      paymentIds: [],
      paymentNames: [],
      message: "",
    };
  }

  return {
    hasPayments: true,
    paymentIds: linked.map((p) => p.id),
    paymentNames: linked.map((p) => p.name),
    message:
      `This document has ${linked.length} applied payment(s): ${linked.map((p) => p.name).join(", ")}. ` +
      `Editing will NOT remove these payments. The payment links are preserved.`,
  };
};
