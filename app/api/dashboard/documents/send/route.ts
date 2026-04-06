import { NextResponse, type NextRequest } from "next/server";
import { readSheet, findRowIndex, updateRow } from "@/app/lib/dashboard-sheets";
import { isConfigured, setSharePermission } from "@/app/lib/google-drive";
import { sendDocument } from "@/app/lib/email";
import type { DocumentRecord } from "@/app/lib/document-numbers";

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const {
      action,
      docId,
      to,
      subject,
      message,
    }: {
      action: "send-email" | "send-whatsapp";
      docId: string;
      to: string;
      subject: string;
      message: string;
    } = body;

    // Find the document record
    let doc: DocumentRecord | null = null;
    let rowIdx: number | null = null;

    if (isConfigured()) {
      const docs = await readSheet<DocumentRecord>("Documents");
      rowIdx = docs.findIndex((d) => d.Doc_ID === docId);
      if (rowIdx >= 0) {
        doc = docs[rowIdx];
      }
    }

    if (action === "send-email") {
      if (!to) {
        return NextResponse.json(
          { error: "Recipient email required" },
          { status: 400 }
        );
      }

      // Send email with document info (no PDF attachment in demo mode)
      const htmlBody = `
        <h2 style="font-weight: 400; letter-spacing: 0.05em;">${subject}</h2>
        <p style="line-height: 1.7; color: #6B6B6B; white-space: pre-line;">${message}</p>
      `;

      // In production, we'd attach the actual PDF from Drive.
      // For now, send the email with the message body.
      await sendDocument(
        to,
        subject,
        htmlBody,
        Buffer.from(""),
        `${docId}.pdf`
      );

      // Update document status
      if (doc && rowIdx !== null && rowIdx >= 0) {
        const now = new Date().toISOString().split("T")[0];
        const sheetRowIdx = await findRowIndex("Documents", "Doc_ID", docId);
        if (sheetRowIdx !== null) {
          await updateRow("Documents", sheetRowIdx, [
            doc.Doc_ID,
            doc.Deal_ID,
            doc.Type,
            doc.File_Name,
            doc.Drive_File_ID,
            doc.Customer_Name,
            "Sent",
            doc.Created_Date,
            now,
            doc.Amount,
          ]);
        }
      }

      return NextResponse.json({ success: true });
    }

    if (action === "send-whatsapp") {
      let shareLink = "";

      // Generate a shareable link if we have a Drive file
      if (doc?.Drive_File_ID && isConfigured()) {
        shareLink = await setSharePermission(doc.Drive_File_ID);
      }

      const whatsappMessage = shareLink
        ? `${message}\n\nView document: ${shareLink}`
        : message;

      const whatsappUrl = `https://wa.me/${to.replace(/\D/g, "")}?text=${encodeURIComponent(whatsappMessage)}`;

      // Update status
      if (doc && rowIdx !== null && rowIdx >= 0) {
        const now = new Date().toISOString().split("T")[0];
        const sheetRowIdx = await findRowIndex("Documents", "Doc_ID", docId);
        if (sheetRowIdx !== null) {
          await updateRow("Documents", sheetRowIdx, [
            doc.Doc_ID,
            doc.Deal_ID,
            doc.Type,
            doc.File_Name,
            doc.Drive_File_ID,
            doc.Customer_Name,
            "Sent",
            doc.Created_Date,
            now,
            doc.Amount,
          ]);
        }
      }

      return NextResponse.json({ success: true, whatsappUrl });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("[Documents Send API] Error:", err);
    return NextResponse.json(
      { error: "Failed to send document" },
      { status: 500 }
    );
  }
};
