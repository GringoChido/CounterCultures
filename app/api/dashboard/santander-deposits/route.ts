/**
 * GET  /api/dashboard/santander-deposits — list deposits with optional filters
 * POST /api/dashboard/santander-deposits — create a manual deposit entry
 * PATCH /api/dashboard/santander-deposits — link deposit to factura or skip
 */

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireFeature, FeatureDeniedError } from "@/app/lib/auth";
import {
  listDeposits,
  createDeposit,
  linkDepositToFactura,
  skipDeposit,
  type DepositSource,
  type DepositStatus,
  type PaymentMethodType,
} from "@/app/lib/santander-deposits";
import { createFacturaRequest, buildDepositNotes } from "@/app/lib/ar-factura";
import { appendRow } from "@/app/lib/dashboard-sheets";

export const GET = async (req: NextRequest): Promise<Response> => {
  try {
    await requireFeature("register_payment");
    const sp = req.nextUrl.searchParams;
    const status = sp.get("status") as DepositStatus | null;
    const source = sp.get("source") as DepositSource | null;

    const deposits = await listDeposits({
      ...(status ? { status } : {}),
      ...(source ? { source } : {}),
    });

    return NextResponse.json({ deposits, total: deposits.length });
  } catch (err) {
    if (err instanceof FeatureDeniedError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("[santander-deposits] GET error:", err);
    return NextResponse.json({ error: "Failed to list deposits" }, { status: 500 });
  }
};

const CreateBody = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount: z.number().positive(),
  currency: z.string().length(3).default("MXN"),
  reference: z.string().min(1),
  source: z.enum(["customer", "roger_transfer", "netpay", "other"]),
  paymentMethod: z.enum(["wire", "credit_card", "debit_card", "cash", "cheque", "other"]),
  customerId: z.string().default(""),
  customerName: z.string().default(""),
  notes: z.string().default(""),
  attachmentUrl: z.string().default(""),
});

export const POST = async (req: NextRequest): Promise<Response> => {
  try {
    const user = await requireFeature("register_payment");
    const body = CreateBody.parse(await req.json());

    const deposit = await createDeposit({
      date: body.date,
      amount: body.amount,
      currency: body.currency,
      reference: body.reference,
      source: body.source,
      paymentMethod: body.paymentMethod,
      customerId: body.customerId,
      customerName: body.customerName,
      notes: body.notes,
      attachmentUrl: body.attachmentUrl,
      importedAt: new Date().toISOString(),
      importedBy: user.email,
    });

    // Auto-queue factura for customer deposits (not roger_transfer, not netpay)
    if (body.source === "customer") {
      const facturaRequest = await createFacturaRequest({
        state: "pending",
        source: "santander_deposit",
        company: "cc",
        requestName: `DEP_${body.reference}_$${body.amount.toLocaleString("en-US", { minimumFractionDigits: 0 })}_${body.currency}`,
        customerName: body.customerName,
        customerRfc: "",
        recipientType: "general_public",
        amount: body.amount,
        currency: body.currency,
        bank: "SANTANDER",
        paymentMethod: body.paymentMethod,
        paymentDate: body.date,
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
        notes: `Auto-queued from Santander deposit ${body.reference}`,
      });

      await linkDepositToFactura(deposit.id, facturaRequest.id);
      deposit.status = "factura_queued";
      deposit.facturaRequestId = facturaRequest.id;
    }

    const logId = `EA-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    appendRow("Activity_Log", [
      logId,
      new Date().toISOString(),
      user.email,
      "santander.deposit_created",
      "deposit",
      deposit.id,
      JSON.stringify({ reference: body.reference, amount: body.amount, source: body.source }),
    ]).catch((err) => console.error("[santander-deposits] log failed:", err));

    return NextResponse.json({ deposit });
  } catch (err) {
    if (err instanceof FeatureDeniedError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid body", issues: err.issues }, { status: 400 });
    }
    console.error("[santander-deposits] POST error:", err);
    return NextResponse.json({ error: "Failed to create deposit" }, { status: 500 });
  }
};

const PatchBody = z.object({
  depositId: z.string().min(1),
  action: z.enum(["link_factura", "skip", "queue_factura"]),
  facturaRequestId: z.string().optional(),
});

export const PATCH = async (req: NextRequest): Promise<Response> => {
  try {
    const user = await requireFeature("register_payment");
    const body = PatchBody.parse(await req.json());

    if (body.action === "skip") {
      await skipDeposit(body.depositId);
      return NextResponse.json({ ok: true, status: "skipped" });
    }

    if (body.action === "link_factura" && body.facturaRequestId) {
      await linkDepositToFactura(body.depositId, body.facturaRequestId);
      return NextResponse.json({ ok: true, status: "factura_queued" });
    }

    if (body.action === "queue_factura") {
      // Find the deposit, create a factura request, link them
      const deposits = await listDeposits();
      const deposit = deposits.find((d) => d.id === body.depositId);
      if (!deposit) {
        return NextResponse.json({ error: "Deposit not found" }, { status: 404 });
      }

      const facturaRequest = await createFacturaRequest({
        state: "pending",
        source: "santander_deposit",
        company: "cc",
        requestName: `DEP_${deposit.reference}_$${deposit.amount.toLocaleString("en-US", { minimumFractionDigits: 0 })}_${deposit.currency}`,
        customerName: deposit.customerName,
        customerRfc: "",
        recipientType: "general_public",
        amount: deposit.amount,
        currency: deposit.currency,
        bank: "SANTANDER",
        paymentMethod: deposit.paymentMethod,
        paymentDate: deposit.date,
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
        notes: `Queued from deposit ${deposit.reference}`,
      });

      await linkDepositToFactura(body.depositId, facturaRequest.id);

      const logId = `EA-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      appendRow("Activity_Log", [
        logId,
        new Date().toISOString(),
        user.email,
        "santander.queue_factura",
        "deposit",
        body.depositId,
        JSON.stringify({ factura_request_id: facturaRequest.id }),
      ]).catch(() => {});

      return NextResponse.json({ ok: true, facturaRequestId: facturaRequest.id });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    if (err instanceof FeatureDeniedError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid body", issues: err.issues }, { status: 400 });
    }
    console.error("[santander-deposits] PATCH error:", err);
    return NextResponse.json({ error: "Failed to update deposit" }, { status: 500 });
  }
};
