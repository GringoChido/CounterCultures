/**
 * GET  — scan Santander deposits for pending → factura queue candidates
 * POST — auto-queue: process pending deposits into AR factura requests
 *
 * DEPRECATED: the Gmail subject scraper (`scanGmailForFacturas`) is replaced
 * by the Santander deposit feed. This route now operates on deposits instead.
 * The Gmail functions remain in factura-detector.ts for backwards compat but
 * are no longer invoked from here.
 */

import { NextResponse, type NextRequest } from "next/server";
import { listDeposits, linkDepositToFactura } from "@/app/lib/santander-deposits";
import { createFacturaRequest, buildDepositNotes } from "@/app/lib/ar-factura";
import { requireFeature, FeatureDeniedError } from "@/app/lib/auth";

export const GET = async (req: NextRequest) => {
  try {
    await requireFeature("register_payment");
    const deposits = await listDeposits({ status: "pending" });
    const customerDeposits = deposits.filter((d) => d.source === "customer");

    return NextResponse.json({
      detected: customerDeposits.map((d) => ({
        id: d.id,
        reference: d.reference,
        amount: d.amount,
        currency: d.currency,
        date: d.date,
        customerName: d.customerName,
        alreadyQueued: false,
      })),
      total: customerDeposits.length,
      newCount: customerDeposits.length,
      source: "santander_deposits",
      deprecationNotice: "Gmail scanner deprecated — deposits now sourced from Santander_Deposits sheet",
    });
  } catch (err) {
    if (err instanceof FeatureDeniedError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("[ar-requests/scan] GET error:", err);
    return NextResponse.json(
      { error: "Failed to scan deposits" },
      { status: 500 }
    );
  }
};

export const POST = async () => {
  try {
    const user = await requireFeature("register_payment");
    const deposits = await listDeposits({ status: "pending" });
    const customerDeposits = deposits.filter((d) => d.source === "customer");

    let queued = 0;
    for (const deposit of customerDeposits) {
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
        notes: `Auto-queued from scan (deposit ${deposit.reference})`,
      });
      await linkDepositToFactura(deposit.id, facturaRequest.id);
      queued++;
    }

    return NextResponse.json({
      queued,
      skipped: 0,
      source: "santander_deposits",
    });
  } catch (err) {
    if (err instanceof FeatureDeniedError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("[ar-requests/scan] POST error:", err);
    return NextResponse.json(
      { error: "Failed to auto-queue facturas" },
      { status: 500 }
    );
  }
};
