/**
 * Spanish manuales status PATCH (R4 Note 6 — sub-gap 6a).
 *
 * Lets Roger update just the per-PedimentoItem manuales fields without
 * having to re-submit the full Trafico_Items row. Uses header-keyed
 * writes so unmapped columns (USMCA cert, vendor invoice ID, etc.) are
 * preserved on disk.
 *
 * Status transitions: not-needed ↔ in-translation ↔ on-file ↔ sent-to-broker
 * Drive IDs: pipe-separated list of Google Drive file IDs.
 */

import { NextResponse, type NextRequest } from "next/server";
import {
  findRowIndex,
  updateRowByHeader,
} from "@/app/lib/dashboard-sheets";
import { requireFeature, FeatureDeniedError } from "@/app/lib/auth";

const ALLOWED_STATUSES = new Set([
  "not-needed",
  "on-file",
  "in-translation",
  "sent-to-broker",
]);

interface PatchBody {
  itemId: string;
  required?: boolean;
  status?: string;
  driveFileIds?: string[];
}

export const PATCH = async (request: NextRequest): Promise<Response> => {
  try {
    await requireFeature("view_shipments");

    const body = (await request.json()) as PatchBody;
    if (!body.itemId) {
      return NextResponse.json({ error: "itemId is required" }, { status: 400 });
    }
    if (body.status !== undefined && !ALLOWED_STATUSES.has(body.status)) {
      return NextResponse.json(
        { error: `status must be one of ${[...ALLOWED_STATUSES].join(", ")}` },
        { status: 400 }
      );
    }

    const rowIdx = await findRowIndex("Trafico_Items", "Item_ID", body.itemId);
    if (rowIdx === null) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const fields: Record<string, string> = {};
    if (body.required !== undefined) {
      fields.Spanish_Manuals_Required = body.required ? "true" : "false";
    }
    if (body.status !== undefined) {
      fields.Spanish_Manuals_Status = body.status;
    }
    if (body.driveFileIds !== undefined) {
      fields.Spanish_Manual_Drive_IDs = body.driveFileIds
        .map((s) => s.trim())
        .filter(Boolean)
        .join("|");
    }

    if (Object.keys(fields).length === 0) {
      return NextResponse.json({ error: "no fields to update" }, { status: 400 });
    }

    await updateRowByHeader("Trafico_Items", rowIdx, fields);
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof FeatureDeniedError) {
      return NextResponse.json(
        { error: "Forbidden", feature: err.feature },
        { status: 403 }
      );
    }
    console.error("[Manuales API] PATCH error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update" },
      { status: 500 }
    );
  }
};
