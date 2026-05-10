/**
 * POST /api/dashboard/invoices/[id]/notify-ups
 *
 * Sends a shipment notification to the four UPS agents (rule 14) with
 * Roger CC'd. Used when a vendor bill is tagged `direct_ship` scenario.
 */

import { NextResponse, type NextRequest } from "next/server";
import { Resend } from "resend";
import { requireFeature, FeatureDeniedError } from "@/app/lib/auth";
import { readSheet, appendRow } from "@/app/lib/dashboard-sheets";

const UPS_AGENTS = [
  "yulissagarcia@ups.com",
  "fabianmartinez@ups.com",
  "fatimasanchez@ups.com",
  "cristinaavila@ups.com",
];

const FROM = "Counter Cultures <noreply@countercultures.com.mx>";

interface OdooInvoiceRow extends Record<string, string> {
  id: string;
  name: string;
  partner_name: string;
  invoice_origin: string;
  amount_total: string;
  currency_name: string;
}

export const POST = async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> => {
  try {
    const user = await requireFeature("register_payment");
    const { id } = await params;

    const invoices = await readSheet<OdooInvoiceRow>("Odoo_Invoices");
    const invoice = invoices.find((i) => i.id === id);
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const ROGER_CC = process.env.OWNER_EMAIL ?? "roger@countercultures.com.mx";
    const apiKey = process.env.RESEND_API_KEY;
    let emailStatus: "sent" | "dry_run" | "failed" = "dry_run";
    let messageId: string | undefined;

    const subject = `UPS Shipment — ${invoice.partner_name} — ${invoice.name}`;
    const body = [
      `Hola,`,
      ``,
      `Les notifico un envío directo a México vía UPS:`,
      ``,
      `  Proveedor: ${invoice.partner_name}`,
      `  Factura: ${invoice.name}`,
      invoice.invoice_origin ? `  Origen: ${invoice.invoice_origin}` : null,
      `  Monto: $${invoice.amount_total} ${invoice.currency_name || "USD"}`,
      ``,
      `Favor de dar seguimiento al tracking y confirmar recepción.`,
      ``,
      `Saludos,`,
      `Counter Cultures`,
    ]
      .filter((l): l is string => l !== null)
      .join("\n");

    if (apiKey) {
      const resend = new Resend(apiKey);
      try {
        const result = await resend.emails.send({
          from: FROM,
          to: UPS_AGENTS,
          cc: [ROGER_CC],
          replyTo: user.email,
          subject,
          text: body,
        });
        if (result.error) {
          emailStatus = "failed";
          console.error("[notify-ups] Resend error:", result.error);
        } else {
          emailStatus = "sent";
          messageId = result.data?.id;
        }
      } catch (err) {
        emailStatus = "failed";
        console.error("[notify-ups] Resend threw:", err);
      }
    } else {
      console.warn(`[notify-ups] RESEND_API_KEY not set — would send to ${UPS_AGENTS.join(", ")}`);
    }

    const logId = `EA-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    appendRow("Activity_Log", [
      logId,
      new Date().toISOString(),
      user.email,
      "notify_ups_agents",
      "invoice",
      id,
      JSON.stringify({
        recipients: UPS_AGENTS,
        cc: [ROGER_CC],
        invoice_name: invoice.name,
        email_status: emailStatus,
        message_id: messageId ?? null,
      }),
    ]).catch((err) =>
      console.error("[notify-ups] Activity_Log append failed:", err)
    );

    return NextResponse.json({
      success: true,
      emailStatus,
      messageId,
      recipients: UPS_AGENTS,
    });
  } catch (err) {
    if (err instanceof FeatureDeniedError) {
      return NextResponse.json(
        { error: "Forbidden", feature: err.feature },
        { status: 403 }
      );
    }
    console.error("[notify-ups] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "notify_failed" },
      { status: 500 }
    );
  }
};
