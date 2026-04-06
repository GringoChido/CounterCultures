import { NextResponse, type NextRequest } from "next/server";
import { readSheet, appendRow, updateRow, findRowIndex } from "@/app/lib/dashboard-sheets";
import { isConfigured, uploadFile } from "@/app/lib/google-drive";
import {
  getNextDocumentNumber,
  getDocumentFileName,
  type DocumentRecord,
  type DocumentType,
} from "@/app/lib/document-numbers";

// ---------------------------------------------------------------------------
// Sample data used when Google services aren't configured
// ---------------------------------------------------------------------------

const SAMPLE_DOCUMENTS: DocumentRecord[] = [
  {
    Doc_ID: "CC-Q-2026-001",
    Deal_ID: "deal-1",
    Type: "quote",
    File_Name: "CC-Q-2026-001.pdf",
    Drive_File_ID: "",
    Customer_Name: "Arq. Carolina Mendoza",
    Status: "Sent",
    Created_Date: "2026-03-15",
    Sent_Date: "2026-03-16",
    Amount: "145000",
  },
  {
    Doc_ID: "CC-INV-2026-001",
    Deal_ID: "deal-1",
    Type: "invoice",
    File_Name: "CC-INV-2026-001.pdf",
    Drive_File_ID: "",
    Customer_Name: "Arq. Carolina Mendoza",
    Status: "Paid",
    Created_Date: "2026-03-20",
    Sent_Date: "2026-03-20",
    Amount: "145000",
  },
  {
    Doc_ID: "CC-PO-2026-001",
    Deal_ID: "deal-1",
    Type: "po",
    File_Name: "CC-PO-2026-001.pdf",
    Drive_File_ID: "",
    Customer_Name: "California Faucets",
    Status: "Sent",
    Created_Date: "2026-03-21",
    Sent_Date: "2026-03-21",
    Amount: "87000",
  },
  {
    Doc_ID: "CC-Q-2026-002",
    Deal_ID: "deal-2",
    Type: "quote",
    File_Name: "CC-Q-2026-002.pdf",
    Drive_File_ID: "",
    Customer_Name: "David Chen",
    Status: "Draft",
    Created_Date: "2026-04-01",
    Sent_Date: "",
    Amount: "280000",
  },
];

// ---------------------------------------------------------------------------
// GET — list / query documents
// ---------------------------------------------------------------------------

export const GET = async (request: NextRequest) => {
  const url = new URL(request.url);
  const dealId = url.searchParams.get("dealId");
  const type = url.searchParams.get("type");
  const q = url.searchParams.get("q");

  try {
    let docs: DocumentRecord[];

    if (isConfigured()) {
      docs = await readSheet<DocumentRecord>("Documents");
    } else {
      docs = SAMPLE_DOCUMENTS;
    }

    // Filter by deal
    if (dealId) {
      docs = docs.filter((d) => d.Deal_ID === dealId);
    }

    // Filter by type
    if (type) {
      docs = docs.filter((d) => d.Type === type);
    }

    // Search by customer name or doc ID
    if (q) {
      const query = q.toLowerCase();
      docs = docs.filter(
        (d) =>
          d.Customer_Name.toLowerCase().includes(query) ||
          d.Doc_ID.toLowerCase().includes(query) ||
          d.File_Name.toLowerCase().includes(query)
      );
    }

    return NextResponse.json({ documents: docs });
  } catch (err) {
    console.error("[Documents API] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
};

// ---------------------------------------------------------------------------
// POST — create / update / generate-pdf
// ---------------------------------------------------------------------------

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { action } = body;

    // --- Create new document record ---
    if (action === "create") {
      const {
        dealId,
        type,
        customerName,
        amount,
        htmlContent,
      }: {
        dealId: string;
        type: DocumentType;
        customerName: string;
        amount: string;
        htmlContent: string;
      } = body;

      let docId: string;
      let driveFileId = "";

      if (isConfigured()) {
        const existingDocs = await readSheet<DocumentRecord>("Documents");
        docId = getNextDocumentNumber(type, existingDocs);
        const fileName = getDocumentFileName(docId);

        // Create a simple HTML file and upload as PDF placeholder
        const htmlBuffer = Buffer.from(
          `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${docId}</title>
<style>body{margin:0;padding:0;font-family:'DM Sans',sans-serif}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style>
</head><body>${htmlContent}</body></html>`,
          "utf-8"
        );

        const driveFile = await uploadFile(
          fileName,
          "application/pdf",
          htmlBuffer
        );
        driveFileId = driveFile.id;

        const now = new Date().toISOString().split("T")[0];
        await appendRow("Documents", [
          docId,
          dealId,
          type,
          fileName,
          driveFileId,
          customerName,
          "Draft",
          now,
          "",
          amount,
        ]);
      } else {
        // Demo mode — generate a doc number from sample data
        docId = getNextDocumentNumber(type, SAMPLE_DOCUMENTS);
      }

      return NextResponse.json({ docId, driveFileId });
    }

    // --- Update document status ---
    if (action === "update") {
      const {
        docId,
        status,
        sentDate,
      }: { docId: string; status: string; sentDate?: string } = body;

      if (isConfigured()) {
        const rowIdx = await findRowIndex("Documents", "Doc_ID", docId);
        if (rowIdx === null) {
          return NextResponse.json(
            { error: "Document not found" },
            { status: 404 }
          );
        }

        const docs = await readSheet<DocumentRecord>("Documents");
        const doc = docs[rowIdx];
        await updateRow("Documents", rowIdx, [
          doc.Doc_ID,
          doc.Deal_ID,
          doc.Type,
          doc.File_Name,
          doc.Drive_File_ID,
          doc.Customer_Name,
          status,
          doc.Created_Date,
          sentDate ?? doc.Sent_Date,
          doc.Amount,
        ]);
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("[Documents API] Error:", err);
    return NextResponse.json(
      { error: "Failed to process document" },
      { status: 500 }
    );
  }
};
