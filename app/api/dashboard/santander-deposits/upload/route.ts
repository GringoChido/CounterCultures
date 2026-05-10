/**
 * POST /api/dashboard/santander-deposits/upload
 *
 * Accepts a CSV file (Santander statement export) and imports new deposits.
 * Deduplicates by reference number — only rows not already in the sheet are
 * imported. Customer deposits auto-queue a factura request.
 *
 * Expected CSV columns (Santander México export):
 *   Fecha | Referencia | Descripción | Monto | Moneda
 *
 * For flexibility we also accept:
 *   date | reference | description | amount | currency
 */

import { NextResponse, type NextRequest } from "next/server";
import { requireFeature, FeatureDeniedError } from "@/app/lib/auth";
import {
  createDeposit,
  deduplicateByReference,
  linkDepositToFactura,
  type DepositSource,
  type PaymentMethodType,
} from "@/app/lib/santander-deposits";
import { createFacturaRequest, buildDepositNotes } from "@/app/lib/ar-factura";
import { appendRow } from "@/app/lib/dashboard-sheets";

interface ParsedRow {
  date: string;
  reference: string;
  description: string;
  amount: number;
  currency: string;
}

const normalizeHeader = (h: string): string =>
  h.trim().toLowerCase()
    .replace(/^fecha$/, "date")
    .replace(/^referencia$/, "reference")
    .replace(/^descripci[oó]n$/, "description")
    .replace(/^monto$/, "amount")
    .replace(/^moneda$/, "currency");

const parseCSV = (text: string): ParsedRow[] => {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const rawHeaders = lines[0].split(",").map((h) => h.replace(/^"|"$/g, ""));
  const headers = rawHeaders.map(normalizeHeader);

  const dateIdx = headers.indexOf("date");
  const refIdx = headers.indexOf("reference");
  const descIdx = headers.indexOf("description");
  const amtIdx = headers.indexOf("amount");
  const curIdx = headers.indexOf("currency");

  if (dateIdx === -1 || refIdx === -1 || amtIdx === -1) return [];

  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.replace(/^"|"$/g, "").trim());
    const amountRaw = cols[amtIdx]?.replace(/[$,\s]/g, "");
    const amount = parseFloat(amountRaw);
    if (!amount || amount <= 0) continue;

    // Normalize date: try DD/MM/YYYY → YYYY-MM-DD
    let date = cols[dateIdx] ?? "";
    const dmyMatch = date.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
    if (dmyMatch) {
      date = `${dmyMatch[3]}-${dmyMatch[2].padStart(2, "0")}-${dmyMatch[1].padStart(2, "0")}`;
    }

    rows.push({
      date,
      reference: cols[refIdx] ?? "",
      description: descIdx >= 0 ? cols[descIdx] ?? "" : "",
      amount,
      currency: curIdx >= 0 ? (cols[curIdx] || "MXN").toUpperCase() : "MXN",
    });
  }
  return rows;
};

const guessSource = (desc: string): DepositSource => {
  const lower = desc.toLowerCase();
  if (lower.includes("roger") || lower.includes("owner")) return "roger_transfer";
  if (lower.includes("netpay") || lower.includes("net pay")) return "netpay";
  return "customer";
};

const guessPaymentMethod = (desc: string): PaymentMethodType => {
  const lower = desc.toLowerCase();
  if (lower.includes("credito") || lower.includes("credit")) return "credit_card";
  if (lower.includes("debito") || lower.includes("debit")) return "debit_card";
  if (lower.includes("efectivo") || lower.includes("cash")) return "cash";
  if (lower.includes("cheque")) return "cheque";
  return "wire";
};

export const POST = async (req: NextRequest): Promise<Response> => {
  try {
    const user = await requireFeature("register_payment");

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const text = await file.text();
    const parsed = parseCSV(text);
    if (parsed.length === 0) {
      return NextResponse.json(
        { error: "No valid rows found. Expected columns: date, reference, amount (or Fecha, Referencia, Monto)" },
        { status: 400 }
      );
    }

    // Deduplicate against existing deposits
    const newRefs = await deduplicateByReference(parsed);
    const newRows = parsed.filter((r) => r.reference && newRefs.has(r.reference));

    const results = {
      total: parsed.length,
      duplicates: parsed.length - newRows.length,
      imported: 0,
      facturasQueued: 0,
      skipped: 0,
    };

    for (const row of newRows) {
      const source = guessSource(row.description);
      const paymentMethod = guessPaymentMethod(row.description);

      const deposit = await createDeposit({
        date: row.date,
        amount: row.amount,
        currency: row.currency,
        reference: row.reference,
        source,
        paymentMethod,
        customerId: "",
        customerName: row.description.slice(0, 100),
        notes: `CSV import: ${row.description}`,
        attachmentUrl: "",
        importedAt: new Date().toISOString(),
        importedBy: user.email,
      });
      results.imported++;

      // Auto-queue factura for customer deposits per CLAUDE-FINANCE-RULES rule 1-2
      if (source === "customer") {
        const facturaRequest = await createFacturaRequest({
          state: "pending",
          source: "santander_deposit",
          company: "cc",
          requestName: `DEP_${row.reference}_$${row.amount.toLocaleString("en-US", { minimumFractionDigits: 0 })}_${row.currency}`,
          customerName: row.description.slice(0, 100),
          customerRfc: "",
          recipientType: "general_public",
          amount: row.amount,
          currency: row.currency,
          bank: "SANTANDER",
          paymentMethod,
          paymentDate: row.date,
          depositType: "full",
          depositPercent: 100,
          linkedFolio: "",
          facturaFolio: "",
          facturaNotes: buildDepositNotes({ depositType: "full", depositPercent: 100 }),
          pdfDriveUrl: "",
          xmlDriveUrl: "",
          solucionFactibleId: "",
          requestedBy: user.email,
          requestedAt: new Date().toISOString(),
          issuedAt: "",
          issuedBy: "",
          orderReference: "",
          invoiceId: "",
          notes: `Auto-queued from CSV import (ref: ${row.reference})`,
        });
        await linkDepositToFactura(deposit.id, facturaRequest.id);
        results.facturasQueued++;
      } else {
        results.skipped++;
      }
    }

    const logId = `EA-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    appendRow("Activity_Log", [
      logId,
      new Date().toISOString(),
      user.email,
      "santander.csv_upload",
      "deposit",
      file.name,
      JSON.stringify(results),
    ]).catch(() => {});

    return NextResponse.json({ ok: true, ...results });
  } catch (err) {
    if (err instanceof FeatureDeniedError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("[santander-deposits/upload] error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
};
