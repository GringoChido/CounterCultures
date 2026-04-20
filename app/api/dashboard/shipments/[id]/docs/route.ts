import { NextResponse, type NextRequest } from "next/server";
import { findOrCreateFolder, uploadFile } from "@/app/lib/google-drive";
import { readSheet, findRowIndex, updateRow } from "@/app/lib/dashboard-sheets";
import { appendTraficoEvent } from "@/app/lib/trafico-events";

// Doc keys that map to a flat Trafico column today (W6). Other keys
// (ficha, carta318, COVE, pedimento, facturaCruce, tgrInvoice, etc.)
// have no flat storage column — return 400 until schema add lands.
const DOC_KEY_TO_COLUMN: Record<string, string> = {
  calculo: "Calculo_Drive_ID",
  brokerFactura: "Factura_Drive_ID",
  expediente: "Expediente_Drive_ID",
};

export const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id: trfId } = await params;
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const docKey = String(formData.get("docKey") ?? "");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }
    if (!docKey || !DOC_KEY_TO_COLUMN[docKey]) {
      return NextResponse.json(
        {
          error: `docKey "${docKey}" has no flat storage column yet. Supported in W6: ${Object.keys(DOC_KEY_TO_COLUMN).join(", ")}.`,
        },
        { status: 400 }
      );
    }

    const trafico = (await readSheet<Record<string, string>>("Traficos")).find(
      (t) => t.TRF_ID === trfId
    );
    if (!trafico) {
      return NextResponse.json({ error: "Trafico not found" }, { status: 404 });
    }

    const folder = await findOrCreateFolder(trfId);
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadFile(file.name, file.type || "application/octet-stream", buffer, folder.id);

    const colName = DOC_KEY_TO_COLUMN[docKey];
    const rowIdx = await findRowIndex("Traficos", "TRF_ID", trfId);
    if (rowIdx === null) {
      return NextResponse.json({ error: "Trafico row index not found" }, { status: 500 });
    }

    const headers = Object.keys(trafico);
    const merged = { ...trafico, [colName]: uploaded.id };
    await updateRow("Traficos", rowIdx, headers.map((h) => merged[h] ?? ""));

    await appendTraficoEvent({
      trafico_id: trfId,
      actor: "portal",
      event_type: "doc_attached",
      doc_key: docKey,
      doc_drive_id: uploaded.id,
      message: `Uploaded ${file.name} (${docKey})`,
    }).catch((e) => console.error("[Docs API] event log failed:", e));

    return NextResponse.json({ success: true, driveId: uploaded.id, webViewLink: uploaded.webViewLink });
  } catch (err) {
    console.error("[Docs API] POST error:", err);
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
  }
};
