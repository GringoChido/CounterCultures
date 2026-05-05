import { NextResponse, type NextRequest } from "next/server";
import { findOrCreateFolder, uploadFile } from "@/app/lib/google-drive";
import { readSheet, findRowIndex, updateRow } from "@/app/lib/dashboard-sheets";
import { ensureColumns } from "@/app/lib/sheet-migrations";
import { appendTraficoEvent } from "@/app/lib/trafico-events";

// Doc keys that map to a flat Trafico column. Pedimento + proforma added
// alongside the auto-file-into-Pedimentos/-subfolder routing below; their
// columns are added via ensureColumns when missing.
const DOC_KEY_TO_COLUMN: Record<string, string> = {
  calculo: "Calculo_Drive_ID",
  brokerFactura: "Factura_Drive_ID",
  expediente: "Expediente_Drive_ID",
  pedimento: "Pedimento_Drive_ID",
  pedimentoProforma: "Pedimento_Proforma_Drive_ID",
};

// Doc keys that auto-file into a named subfolder under the trafico folder
// instead of the trafico folder root. Pedimento PDFs go to Pedimentos/ so
// the SAT auditor (or Roger two years from now) finds them in one place.
const DOC_KEY_TO_SUBFOLDER: Record<string, string> = {
  pedimento: "Pedimentos",
  pedimentoProforma: "Pedimentos",
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
          error: `docKey "${docKey}" not supported. Supported: ${Object.keys(DOC_KEY_TO_COLUMN).join(", ")}.`,
        },
        { status: 400 }
      );
    }

    // Self-heal: ensure the column for this doc key exists before we try to
    // write into it. Idempotent — a no-op when already present.
    await ensureColumns("Traficos", [DOC_KEY_TO_COLUMN[docKey]]);

    const trafico = (await readSheet<Record<string, string>>("Traficos")).find(
      (t) => t.TRF_ID === trfId
    );
    if (!trafico) {
      return NextResponse.json({ error: "Trafico not found" }, { status: 404 });
    }

    const trfFolder = await findOrCreateFolder(trfId);
    const subfolderName = DOC_KEY_TO_SUBFOLDER[docKey];
    const targetFolder = subfolderName
      ? await findOrCreateFolder(subfolderName, trfFolder.id)
      : trfFolder;
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadFile(file.name, file.type || "application/octet-stream", buffer, targetFolder.id);

    const colName = DOC_KEY_TO_COLUMN[docKey];
    const rowIdx = await findRowIndex("Traficos", "TRF_ID", trfId);
    if (rowIdx === null) {
      return NextResponse.json({ error: "Trafico row index not found" }, { status: 500 });
    }

    // ensureColumns may have added the column after our trafico row read, so
    // make sure the merge writes to it even when the read didn't carry it.
    const headers = Array.from(new Set([...Object.keys(trafico), colName]));
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
