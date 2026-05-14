import { NextResponse, type NextRequest } from "next/server";
import {
  readSheet,
  updateRow,
  findRowIndex,
} from "@/app/lib/dashboard-sheets";
import { getDealSubfolder } from "@/app/lib/deal-drive";
import { uploadFile } from "@/app/lib/google-drive";

/**
 * POST /api/dashboard/deals/[id]/delivery
 *
 * Two paths, both gated on the deal being a real Pipeline row:
 *
 *  - { action: "schedule", windowStart, windowEnd, phoneConfirmed? }
 *      Writes the delivery window onto the deal. When phoneConfirmed is
 *      true, also stamps delivery_phone_confirmed_at = now (Miguel called).
 *
 *  - { action: "sign", signaturePngBase64, signedBy, deliveryAddress?,
 *      itemsSummary?, fulfillmentMode }
 *      Renders a delivery-receipt HTML doc with the signature embedded
 *      inline as base64, uploads to Deals/[dealId]/Delivery Receipts/,
 *      writes back delivery_signature_drive_file_id + delivery_signed_at +
 *      delivery_signed_by. The HTML format mirrors the existing
 *      delivery-receipt-template visually so it prints/PDFs cleanly.
 */

type PipelineRecord = Record<string, string>;

const PIPELINE_COLUMNS = [
  "id", "name", "company", "stage", "value", "probability",
  "expected_close", "owner", "source", "created_at", "notes",
  "brand_slugs", "source_message_id", "stage_entered_at",
  "pending_move_to", "pending_move_at", "date_at_border",
  "date_customs_cleared",
  "requires_cfdi", "constancia_drive_file_id", "constancia_uploaded_at",
  "delivery_window_start", "delivery_window_end",
  "delivery_phone_confirmed_at", "delivery_signature_drive_file_id",
  "delivery_signed_at", "delivery_signed_by",
] as const;

const writePipelineRow = async (dealId: string, patch: PipelineRecord) => {
  const rowIdx = await findRowIndex("Pipeline", "id", dealId);
  if (rowIdx === null) return false;
  const all = await readSheet<PipelineRecord>("Pipeline");
  const merged = { ...all[rowIdx], ...patch };
  const values = PIPELINE_COLUMNS.map((c) => merged[c] ?? "");
  await updateRow("Pipeline", rowIdx, values);
  return true;
};

const renderReceiptHtml = (opts: {
  dealId: string;
  signedBy: string;
  signedAt: string;
  signatureDataUrl: string;
  deliveryAddress: string;
  itemsSummary: string;
  fulfillmentMode: "local" | "pickup";
}): string => {
  const f =
    opts.fulfillmentMode === "pickup"
      ? "Pickup at Counter Cultures Warehouse"
      : "Local SMA delivery · Miguel";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Delivery Receipt · ${opts.dealId}</title>
<style>
  body { font-family: 'DM Sans', system-ui, sans-serif; color: #1A1A1A;
         padding: 48px; max-width: 720px; margin: 0 auto; }
  h1 { font-family: 'Cormorant Garamond', serif; font-weight: 300;
       letter-spacing: 0.04em; font-size: 28px; }
  .copper { color: #B87333; }
  .muted { color: #6B6B6B; font-size: 12px; letter-spacing: 0.06em;
           text-transform: uppercase; }
  .ornament { height: 1px; background: linear-gradient(to right,
              transparent, #B87333 20%, #B87333 80%, transparent);
              margin: 16px 0; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th, td { text-align: left; padding: 6px 8px; font-size: 13px; }
  th { color: #6B6B6B; text-transform: uppercase; font-size: 10px;
       letter-spacing: 0.08em; border-bottom: 1px solid #E8E2D7; }
  .sig-box { border: 1px solid #E8E2D7; padding: 12px; margin-top: 24px;
             background: #FCFAF6; }
  .sig-box img { max-width: 100%; height: auto; }
  .footer { color: #6B6B6B; font-size: 10px; letter-spacing: 0.06em;
            text-transform: uppercase; margin-top: 32px; }
</style>
</head>
<body>
  <h1>Counter Cultures · <span class="copper">Delivery Receipt</span></h1>
  <div class="ornament"></div>
  <p class="muted">Deal · ${opts.dealId}</p>
  <p class="muted">Fulfillment · ${f}</p>
  <p class="muted">Address · ${opts.deliveryAddress || "—"}</p>
  <p class="muted">Signed at · ${opts.signedAt}</p>
  <table>
    <thead><tr><th>Items received</th></tr></thead>
    <tbody><tr><td style="white-space: pre-line">${opts.itemsSummary || "—"}</td></tr></tbody>
  </table>
  <div class="sig-box">
    <p class="muted">Recipient signature</p>
    <img src="${opts.signatureDataUrl}" alt="Customer signature" />
    <p style="margin-top: 8px"><strong>${opts.signedBy}</strong></p>
  </div>
  <div class="footer">
    Counter Cultures · Providencia, San Miguel de Allende, Guanajuato, Mexico ·
    info@countercultures.com.mx
  </div>
</body>
</html>`;
};

export const POST = async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) => {
  const { id: dealId } = await context.params;
  if (!dealId) {
    return NextResponse.json({ error: "deal id required" }, { status: 400 });
  }

  try {
    const body = await request.json();

    if (body.action === "schedule") {
      const patch: PipelineRecord = {};
      if (body.windowStart) patch.delivery_window_start = body.windowStart;
      if (body.windowEnd) patch.delivery_window_end = body.windowEnd;
      if (body.phoneConfirmed) {
        patch.delivery_phone_confirmed_at = new Date().toISOString();
      }
      const ok = await writePipelineRow(dealId, patch);
      if (!ok) {
        return NextResponse.json({ error: "Deal not found" }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        ...patch,
      });
    }

    if (body.action === "sign") {
      const sigBase64: string = body.signaturePngBase64 ?? "";
      const signedBy: string = (body.signedBy ?? "").toString().trim();
      const fulfillmentMode: "local" | "pickup" =
        body.fulfillmentMode === "pickup" ? "pickup" : "local";
      if (!sigBase64) {
        return NextResponse.json(
          { error: "signaturePngBase64 is required" },
          { status: 400 },
        );
      }
      if (!signedBy) {
        return NextResponse.json(
          { error: "signedBy (recipient name) is required" },
          { status: 400 },
        );
      }
      const signedAt = new Date().toISOString();
      const dataUrl = sigBase64.startsWith("data:")
        ? sigBase64
        : `data:image/png;base64,${sigBase64}`;

      const html = renderReceiptHtml({
        dealId,
        signedBy,
        signedAt,
        signatureDataUrl: dataUrl,
        deliveryAddress: body.deliveryAddress ?? "",
        itemsSummary: body.itemsSummary ?? "",
        fulfillmentMode,
      });

      // "Delivery Receipts" is pending addition to DealSubfolder union in
      // deal-drive.ts — cast until that lands.
      const folder = await getDealSubfolder(
        dealId,
        "Delivery Receipts" as Parameters<typeof getDealSubfolder>[1],
      );
      const fileName = `delivery-receipt-${dealId}-${signedAt.split("T")[0]}.html`;
      const uploaded = await uploadFile(
        fileName,
        "text/html",
        Buffer.from(html, "utf-8"),
        folder.id,
      );

      const ok = await writePipelineRow(dealId, {
        delivery_signature_drive_file_id: uploaded.id ?? "",
        delivery_signed_at: signedAt,
        delivery_signed_by: signedBy,
      });
      if (!ok) {
        return NextResponse.json(
          {
            warning:
              "Receipt uploaded to Drive but Pipeline row not found.",
            driveFileId: uploaded.id,
          },
          { status: 200 },
        );
      }

      return NextResponse.json({
        success: true,
        driveFileId: uploaded.id,
        driveWebViewLink: uploaded.webViewLink ?? null,
        signedAt,
        signedBy,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("[deals/delivery] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Delivery action failed" },
      { status: 500 },
    );
  }
};
