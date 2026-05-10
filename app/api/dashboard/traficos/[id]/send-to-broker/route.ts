/**
 * R4 Note 6 — sub-gap 6b. "Send to Broker" — actually sends.
 *
 * The customs-automation lib already had `onSendToBroker(trafico)` that
 * generated a draft email body + advanced status. Until now it returned
 * the draft as a value and did nothing with it. This route closes the
 * loop:
 *
 *   1. Loads the trafico (and its items) from sheets
 *   2. Calls onSendToBroker() to build the draft + new status
 *   3. Sends the email via Resend (CC's the broker on the broker email,
 *      Antonina BCC'd for the audit trail)
 *   4. Persists the new status (sent-to-broker) and a status-history
 *      entry to the Traficos sheet
 *   5. Writes an Activity_Log row (per-user attribution)
 *
 * Inbound parsing of broker confirmations is the bigger half of Gap 6b
 * and is deferred — see the punch list. This PR just unblocks the
 * outbound path so Roger can stop copy-pasting drafts into Gmail.
 */

import { NextResponse, type NextRequest } from "next/server";
import { Resend } from "resend";
import {
  appendRow,
  findRowIndex,
  readSheet,
  updateRowByHeader,
} from "@/app/lib/dashboard-sheets";
import { requireFeature, FeatureDeniedError } from "@/app/lib/auth";
import { onSendToBroker } from "@/app/lib/customs-automation";
import type { Trafico, PedimentoItem } from "@/app/lib/customs-data";

interface FlatTraficoRow extends Record<string, string> {
  TRF_ID: string;
  Trafico_Number: string;
  Status: string;
  Status_History_JSON: string;
  Broker_Name: string;
  Broker_Email: string;
  Crossing_Agent: string;
  Crossing_Agent_Email: string;
  Warehouse_Name: string;
  Warehouse_Address: string;
  Warehouse_Phone: string;
  Warehouse_Email: string;
  Pedimento_Number: string;
  Initiated_Date: string;
  Completed_Date: string;
  Invoice_Value_USD: string;
  Calculo_Total_MXN: string;
}

interface FlatItemRow extends Record<string, string> {
  Item_ID: string;
  TRF_ID: string;
  Vendor_Name: string;
  Vendor_Invoice_Number: string;
  Vendor_Invoice_Date: string;
  Vendor_Invoice_Drive_ID: string;
  Products_JSON: string;
  Invoice_Subtotal: string;
  Freight_Charge: string;
  Invoice_Total: string;
  Spanish_Manuals_Required: string;
  Spanish_Manuals_Status: string;
}

const FROM = "Counter Cultures <noreply@countercultures.com.mx>";

const num = (s: string): number => {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};

const buildTrafico = (
  flat: FlatTraficoRow,
  items: FlatItemRow[]
): Trafico => {
  const statusHistory = (() => {
    try {
      return JSON.parse(flat.Status_History_JSON || "[]");
    } catch {
      return [];
    }
  })();
  const pedimentoItems: PedimentoItem[] = items.map((it) => {
    let products: PedimentoItem["products"] = [];
    try {
      products = JSON.parse(it.Products_JSON || "[]");
    } catch {
      // ignore — legacy rows may have malformed JSON; treat as no line detail
    }
    return {
      id: it.Item_ID,
      traficoId: it.TRF_ID,
      vendorName: it.Vendor_Name,
      vendorInvoiceNumber: it.Vendor_Invoice_Number,
      vendorInvoiceDate: it.Vendor_Invoice_Date,
      vendorInvoiceDocId: it.Vendor_Invoice_Drive_ID || undefined,
      products,
      invoiceSubtotal: num(it.Invoice_Subtotal),
      freightCharge: num(it.Freight_Charge),
      invoiceTotal: num(it.Invoice_Total),
      usCarrier: "",
      usTracking: "",
      usmcaStatus: "not-applicable",
      spanishManualsRequired: it.Spanish_Manuals_Required === "true",
      spanishManualsStatus:
        (it.Spanish_Manuals_Status as PedimentoItem["spanishManualsStatus"]) ??
        "not-needed",
    };
  });
  return {
    id: flat.TRF_ID,
    traficoNumber: flat.Trafico_Number,
    pedimentoNumber: flat.Pedimento_Number || undefined,
    brokerName: flat.Broker_Name,
    brokerEmail: flat.Broker_Email,
    crossingAgent: flat.Crossing_Agent || undefined,
    crossingAgentEmail: flat.Crossing_Agent_Email || undefined,
    warehouseName: flat.Warehouse_Name,
    warehouseAddress: flat.Warehouse_Address,
    warehousePhone: flat.Warehouse_Phone || undefined,
    warehouseEmail: flat.Warehouse_Email || undefined,
    status: (flat.Status || "collecting") as Trafico["status"],
    statusHistory,
    items: pedimentoItems,
    documents: { vendorInvoiceIds: [], coveIds: [], acuseIds: [] },
    invoiceValueUSD: num(flat.Invoice_Value_USD),
    calculoTotal: num(flat.Calculo_Total_MXN),
    expedienteStatus: "not-sent",
    initiatedDate: flat.Initiated_Date,
    completedDate: flat.Completed_Date || undefined,
  };
};

export const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> => {
  try {
    const user = await requireFeature("view_shipments");
    const { id } = await params;

    const flatTraficos = await readSheet<FlatTraficoRow>("Traficos");
    const flat = flatTraficos.find((t) => t.TRF_ID === id);
    if (!flat) {
      return NextResponse.json({ error: "Trafico not found" }, { status: 404 });
    }
    if (!flat.Broker_Email) {
      return NextResponse.json(
        { error: "Trafico has no broker_email — can't send" },
        { status: 400 }
      );
    }

    const flatItems = await readSheet<FlatItemRow>("Trafico_Items");
    const items = flatItems.filter((i) => i.TRF_ID === id);

    const trafico = buildTrafico(flat, items);
    const { updatedTrafico, emailDraft } = onSendToBroker(trafico);

    // Send the email. Resend isn't configured in dev; we still update
    // status so the workflow advances either way, but report status.
    const apiKey = process.env.RESEND_API_KEY;
    let emailStatus: "sent" | "dry_run" | "failed" = "dry_run";
    let messageId: string | undefined;

    const BROKER_CONTACTS = [
      trafico.brokerEmail,
      trafico.crossingAgentEmail,
      trafico.warehouseEmail,
    ].filter((e): e is string => !!e && e.includes("@"));
    const ROGER_CC = process.env.OWNER_EMAIL ?? "roger@countercultures.com.mx";

    if (apiKey) {
      const resend = new Resend(apiKey);
      const toAddrs = BROKER_CONTACTS.length > 0 ? BROKER_CONTACTS : [trafico.brokerEmail];
      try {
        const result = await resend.emails.send({
          from: FROM,
          to: toAddrs,
          cc: [ROGER_CC],
          replyTo: user.email,
          subject: emailDraft.subject ?? `Tráfico ${trafico.traficoNumber || trafico.id}`,
          text: emailDraft.body ?? "",
        });
        if (result.error) {
          emailStatus = "failed";
          console.error("[send-to-broker] Resend error:", result.error);
        } else {
          emailStatus = "sent";
          messageId = result.data?.id;
        }
      } catch (err) {
        emailStatus = "failed";
        console.error("[send-to-broker] Resend threw:", err);
      }
    } else {
      console.warn(
        `[send-to-broker] RESEND_API_KEY not set — would have sent to ${BROKER_CONTACTS.join(", ")}`
      );
    }

    // Persist the new status + history entry to the Traficos sheet.
    const rowIdx = await findRowIndex("Traficos", "TRF_ID", id);
    if (rowIdx !== null) {
      await updateRowByHeader("Traficos", rowIdx, {
        Status: updatedTrafico.status,
        Status_History_JSON: JSON.stringify(updatedTrafico.statusHistory),
      });
    }

    // Activity_Log row — per-user attribution.
    const logId = `EA-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    appendRow("Activity_Log", [
      logId,
      new Date().toISOString(),
      user.email,
      "send_to_broker",
      "trafico",
      id,
      JSON.stringify({
        recipients: BROKER_CONTACTS,
        cc: [ROGER_CC],
        item_count: trafico.items.length,
        invoice_value_usd: trafico.invoiceValueUSD ?? 0,
        email_status: emailStatus,
        message_id: messageId ?? null,
      }),
    ]).catch((err) =>
      console.error("[send-to-broker] Activity_Log append failed:", err)
    );

    return NextResponse.json({
      success: true,
      emailStatus,
      messageId,
      newStatus: updatedTrafico.status,
      preview: emailDraft,
    });
  } catch (err) {
    if (err instanceof FeatureDeniedError) {
      return NextResponse.json(
        { error: "Forbidden", feature: err.feature },
        { status: 403 }
      );
    }
    console.error("[send-to-broker] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "send_failed" },
      { status: 500 }
    );
  }
};
