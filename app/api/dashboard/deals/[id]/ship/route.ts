import { NextResponse, type NextRequest } from "next/server";
import { appendRow } from "@/app/lib/dashboard-sheets";
import { getDealSubfolder } from "@/app/lib/deal-drive";
import { uploadFile } from "@/app/lib/google-drive";
import {
  createShipment,
  type SkydropxAddress,
  type SkydropxParcel,
} from "@/app/lib/skydropx";

/**
 * POST /api/dashboard/deals/[id]/ship
 *
 * Generates a Skydropx label for one PO/shipment, uploads the label PDF
 * to the deal's `Shipping/` Drive subfolder, and records a Shipments row
 * with the tracking number and label-file id. The frontend uses the
 * returned trackingUrl to push a notification to the customer (via
 * /api/dashboard/documents/send — PR 8 multi-channel).
 *
 * Body:
 *   {
 *     poId: string;
 *     brand: string;
 *     items: Array<{ sku: string; productName: string; quantity: number }>;
 *     to: SkydropxAddress;
 *     parcel: SkydropxParcel;
 *   }
 *
 * SKYDROPX_API_KEY missing → dry-run mode. The flow still completes (mock
 * tracking + empty label PDF placeholder) so the rest of the wiring is
 * exercisable in dev / preview deploys without a live carrier account.
 */

interface ShipRequestBody {
  poId: string;
  brand: string;
  items?: Array<{ sku: string; productName: string; quantity: number }>;
  to: SkydropxAddress;
  parcel: SkydropxParcel;
  /** Optional override for the from address. Defaults to CC's SMA warehouse. */
  from?: Partial<SkydropxAddress>;
}

const DEFAULT_FROM: SkydropxAddress = {
  name: "Counter Cultures",
  street1: "Providencia",
  city: "San Miguel de Allende",
  state: "Guanajuato",
  postalCode: "37700",
  country: "MX",
  phone: "+52 415 154 1234",
  email: "info@countercultures.com.mx",
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
    const body = (await request.json()) as ShipRequestBody;
    if (!body.poId || !body.brand || !body.to || !body.parcel) {
      return NextResponse.json(
        { error: "poId, brand, to, parcel are required" },
        { status: 400 },
      );
    }

    const from: SkydropxAddress = { ...DEFAULT_FROM, ...body.from };
    const reference = `${dealId} · ${body.poId}`;

    const result = await createShipment({
      from,
      to: body.to,
      parcel: body.parcel,
      reference,
    });

    // Upload label PDF to Drive (skipped when dry-run returns an empty buffer)
    let labelDriveId = "";
    if (result.labelPdf.length > 0) {
      try {
        const folder = await getDealSubfolder(dealId, "Shipping");
        const fileName = `label-${result.trackingNumber}.pdf`;
        const uploaded = await uploadFile(
          fileName,
          "application/pdf",
          result.labelPdf,
          folder.id,
        );
        labelDriveId = uploaded.id ?? "";
      } catch (e) {
        result.warnings.push(
          `Label upload to Drive failed: ${e instanceof Error ? e.message : "unknown"}`,
        );
      }
    }

    // Persist a Shipments row so it shows up on the deal detail
    const shipmentId = `SHP-${dealId.slice(-6)}-${Date.now().toString(36).toUpperCase().slice(-5)}`;
    const shipmentRow = [
      shipmentId,
      dealId,
      body.poId,
      body.brand,
      result.carrier,
      result.trackingNumber,
      "label-created",
      new Date().toISOString().split("T")[0],
      "",
      "",
      `${body.to.city}, ${body.to.state}`,
      JSON.stringify(body.items ?? []),
      "",
      "",
      "",
      labelDriveId,
      result.trackingUrl,
      result.mode,
      String(result.rateMxn),
      result.carrier,
    ];
    try {
      await appendRow("Shipments", shipmentRow);
    } catch (e) {
      result.warnings.push(
        `Shipments row write failed: ${e instanceof Error ? e.message : "unknown"}`,
      );
    }

    return NextResponse.json({
      success: true,
      shipmentId,
      trackingNumber: result.trackingNumber,
      trackingUrl: result.trackingUrl,
      carrier: result.carrier,
      labelDriveId: labelDriveId || null,
      labelDriveLink: labelDriveId
        ? `https://drive.google.com/file/d/${labelDriveId}/view`
        : null,
      mode: result.mode,
      rateMxn: result.rateMxn,
      warnings: result.warnings,
    });
  } catch (err) {
    console.error("[deals/ship] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Skydropx call failed" },
      { status: 500 },
    );
  }
};
