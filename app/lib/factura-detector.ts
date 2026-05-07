/**
 * Factura email detector — scans Gmail subjects for the COMPROBANTE
 * naming convention used by Javier and Roger when requesting facturas.
 *
 * Pattern: COMPROBANTE_S01630_$ 22,500_MXN_SANTANDER_30 DIC 2025_T.CREDITO
 *
 * Detection runs against inbox threads and auto-populates the
 * AR_Factura_Requests queue so Finance doesn't have to manually re-enter
 * data she can already see in the email subject.
 */

import { getGmailClient } from "./gmail";
import {
  createFacturaRequest,
  listFacturaRequests,
  parseFacturaRequestName,
  type FacturaRequestSource,
  type FacturaCompany,
  type FacturaRecipientType,
} from "./ar-factura";

// ---------------------------------------------------------------------------
// Known sender mapping
// ---------------------------------------------------------------------------

const FACTURA_SENDERS: Record<string, FacturaRequestSource> = {
  "javier": "javier_email",
  "jmedina": "javier_email",
  "roger": "roger_transfer",
};

const identifySource = (fromEmail: string): FacturaRequestSource => {
  const lower = fromEmail.toLowerCase();
  for (const [key, source] of Object.entries(FACTURA_SENDERS)) {
    if (lower.includes(key)) return source;
  }
  return "manual";
};

// ---------------------------------------------------------------------------
// Subject pattern matching
// ---------------------------------------------------------------------------

const COMPROBANTE_PATTERN = /COMPROBANTE_/i;

const PAYMENT_METHOD_MAP: Record<string, string> = {
  "T.CREDITO": "credit_card",
  "T.DEBITO": "debit_card",
  "TRANSFERENCIA": "wire",
  "EFECTIVO": "cash",
  "CHEQUE": "cheque",
  "STRIPE": "stripe",
};

const guessPaymentMethod = (raw: string): string => {
  const upper = raw.toUpperCase();
  for (const [label, method] of Object.entries(PAYMENT_METHOD_MAP)) {
    if (upper.includes(label)) return method;
  }
  return "wire";
};

const guessBankToCompany = (bank: string): FacturaCompany => {
  const upper = bank.toUpperCase();
  if (upper.includes("WELLS") || upper.includes("FARGO")) return "llc";
  return "cc";
};

// ---------------------------------------------------------------------------
// Detection result
// ---------------------------------------------------------------------------

export interface DetectedFactura {
  threadId: string;
  messageId: string;
  subject: string;
  fromEmail: string;
  fromName: string;
  date: string;
  source: FacturaRequestSource;
  requestName: string;
  amount: number;
  currency: string;
  bank: string;
  paymentMethod: string;
  paymentDate: string;
  company: FacturaCompany;
  alreadyQueued: boolean;
}

// ---------------------------------------------------------------------------
// Core detection
// ---------------------------------------------------------------------------

export const detectFacturaInSubject = (
  subject: string,
  fromEmail: string
): Omit<DetectedFactura, "threadId" | "messageId" | "date" | "fromName" | "alreadyQueued"> | null => {
  if (!COMPROBANTE_PATTERN.test(subject)) return null;

  const parsed = parseFacturaRequestName(subject.trim());
  if (!parsed) return null;

  const source = identifySource(fromEmail);
  const company = guessBankToCompany(parsed.bank);
  const paymentMethod = guessPaymentMethod(parsed.paymentMethod);

  return {
    subject,
    fromEmail,
    source,
    requestName: subject.trim(),
    amount: parsed.amount,
    currency: parsed.currency || "MXN",
    bank: parsed.bank,
    paymentMethod,
    paymentDate: parsed.date,
    company,
  };
};

// ---------------------------------------------------------------------------
// Gmail scan — finds unprocessed factura emails
// ---------------------------------------------------------------------------

export const scanGmailForFacturas = async (
  maxResults = 20
): Promise<DetectedFactura[]> => {
  const client = await getGmailClient();
  if (!client) return [];

  const existingRequests = await listFacturaRequests();
  const existingNames = new Set(existingRequests.map((r) => r.requestName));

  const res = await client.gmail.users.messages.list({
    userId: "me",
    q: "subject:COMPROBANTE_ in:anywhere",
    maxResults,
  });

  const messageIds = res.data.messages ?? [];
  if (messageIds.length === 0) return [];

  const results: DetectedFactura[] = [];

  for (const msgRef of messageIds) {
    if (!msgRef.id) continue;

    const msg = await client.gmail.users.messages.get({
      userId: "me",
      id: msgRef.id,
      format: "metadata",
      metadataHeaders: ["Subject", "From", "Date"],
    });

    const headers: Record<string, string> = {};
    for (const h of msg.data.payload?.headers ?? []) {
      if (h.name) headers[h.name.toLowerCase()] = h.value ?? "";
    }

    const subject = headers.subject ?? "";
    const fromRaw = headers.from ?? "";
    const date = headers.date ?? "";

    const fromMatch = fromRaw.match(/<([^>]+)>/);
    const fromEmail = fromMatch ? fromMatch[1] : fromRaw;
    const fromName = fromRaw.replace(/<[^>]+>/, "").replace(/"/g, "").trim();

    const detection = detectFacturaInSubject(subject, fromEmail);
    if (!detection) continue;

    results.push({
      ...detection,
      threadId: msg.data.threadId ?? "",
      messageId: msgRef.id,
      date,
      fromName,
      alreadyQueued: existingNames.has(detection.requestName),
    });
  }

  return results;
};

// ---------------------------------------------------------------------------
// Auto-queue — creates AR requests for unprocessed factura emails
// ---------------------------------------------------------------------------

export const autoQueueFacturaEmails = async (): Promise<{
  scanned: number;
  queued: number;
  skipped: number;
  errors: string[];
}> => {
  const detected = await scanGmailForFacturas();
  let queued = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const d of detected) {
    if (d.alreadyQueued) {
      skipped++;
      continue;
    }

    try {
      await createFacturaRequest({
        state: "pending",
        source: d.source,
        company: d.company,
        requestName: d.requestName,
        customerName: d.fromName || "",
        customerRfc: "",
        recipientType: "general_public",
        amount: d.amount,
        currency: d.currency,
        bank: d.bank,
        paymentMethod: d.paymentMethod,
        paymentDate: d.paymentDate,
        depositType: "full",
        depositPercent: 100,
        linkedFolio: "",
        facturaFolio: "",
        facturaNotes: "",
        pdfDriveUrl: "",
        xmlDriveUrl: "",
        solucionFactibleId: "",
        requestedBy: d.fromEmail,
        requestedAt: new Date().toISOString(),
        issuedAt: "",
        issuedBy: "",
        orderReference: "",
        invoiceId: "",
        notes: `Auto-detected from email: ${d.subject}`,
      });
      queued++;
    } catch (err) {
      errors.push(
        `Failed to queue ${d.requestName}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  return { scanned: detected.length, queued, skipped, errors };
};
