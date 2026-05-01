import { NextResponse, type NextRequest } from "next/server";
import {
  readSheet,
  updateRow,
  findRowIndex,
} from "@/app/lib/dashboard-sheets";
import { getDealSubfolder } from "@/app/lib/deal-drive";
import { uploadFile } from "@/app/lib/google-drive";

/**
 * POST /api/dashboard/deals/[id]/constancia
 * Multipart upload — field "file" — accepts a Constancia de Situación
 * Fiscal PDF/image, drops it into the deal's `CFDI & Facturas/` Drive
 * subfolder, and writes the resulting file id + timestamp back onto
 * the Pipeline row so the deal detail panel can render the link.
 *
 * Also flips `requires_cfdi` to "yes" since uploading a Constancia is
 * an unambiguous signal that the customer wants a stamped CFDI.
 */

// Match the Pipeline route's PipelineRecord positionally so updateRow
// writes match the actual sheet column order.
type PipelineRecord = Record<string, string>;
const PIPELINE_COLUMNS = [
  "id", "name", "company", "stage", "value", "probability",
  "expected_close", "owner", "source", "created_at", "notes",
  "brand_slugs", "source_message_id", "stage_entered_at",
  "pending_move_to", "pending_move_at", "date_at_border",
  "date_customs_cleared",
  "requires_cfdi", "constancia_drive_file_id", "constancia_uploaded_at",
] as const;

export const POST = async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) => {
  const { id: dealId } = await context.params;
  if (!dealId) {
    return NextResponse.json({ error: "deal id required" }, { status: 400 });
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "field 'file' (multipart) is required" },
        { status: 400 },
      );
    }

    const folder = await getDealSubfolder(dealId, "CFDI & Facturas");
    const buf = Buffer.from(await file.arrayBuffer());
    const safeName = file.name?.replace(/[\/\\]/g, "_") || "constancia.pdf";
    const finalName = safeName.toLowerCase().includes("constancia")
      ? safeName
      : `constancia-${safeName}`;
    const uploaded = await uploadFile(
      finalName,
      file.type || "application/pdf",
      buf,
      folder.id,
    );

    const rowIdx = await findRowIndex("Pipeline", "id", dealId);
    if (rowIdx === null) {
      return NextResponse.json(
        {
          warning: "Constancia uploaded but deal row not found on Pipeline.",
          driveFileId: uploaded.id,
        },
        { status: 200 },
      );
    }
    const all = await readSheet<PipelineRecord>("Pipeline");
    const current = all[rowIdx];
    const merged: PipelineRecord = {
      ...current,
      requires_cfdi: "yes",
      constancia_drive_file_id: uploaded.id ?? "",
      constancia_uploaded_at: new Date().toISOString(),
    };
    const values = PIPELINE_COLUMNS.map((c) => merged[c] ?? "");
    await updateRow("Pipeline", rowIdx, values);

    return NextResponse.json({
      success: true,
      driveFileId: uploaded.id,
      driveWebViewLink: uploaded.webViewLink ?? null,
      uploadedAt: merged.constancia_uploaded_at,
      requiresCfdi: "yes",
    });
  } catch (err) {
    console.error("[deals/constancia] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 },
    );
  }
};
