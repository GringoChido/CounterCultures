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
      // PR 8 — multi-channel send. When `action === "send-multi"`, the
      // client passes both an email destination AND a WhatsApp phone, and
      // we route based on what's filled in. WhatsApp dispatch stays in
      // dry-run mode (return the wa.me URL only) unless the deploy has
      // WHATSAPP_ENABLED=true; we don't have a Cloud API integration yet.
      email,
      phone,
      emailSubject,
      emailMessage,
      whatsappMessage,
      leadSource,
    }: {
      action: "send-email" | "send-whatsapp" | "send-multi";
      docId: string;
      to?: string;
      subject?: string;
      message?: string;
      email?: string;
      phone?: string;
      emailSubject?: string;
      emailMessage?: string;
      whatsappMessage?: string;
      leadSource?: string;
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
      const subj = subject ?? "";
      const msg = message ?? "";

      // Send email with document info (no PDF attachment in demo mode)
      const htmlBody = `
        <h2 style="font-weight: 400; letter-spacing: 0.05em;">${subj}</h2>
        <p style="line-height: 1.7; color: #6B6B6B; white-space: pre-line;">${msg}</p>
      `;

      // In production, we'd attach the actual PDF from Drive.
      // For now, send the email with the message body.
      await sendDocument(
        to,
        subj,
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
      if (!to) {
        return NextResponse.json(
          { error: "Recipient phone required" },
          { status: 400 }
        );
      }
      let shareLink = "";

      // Generate a shareable link if we have a Drive file
      if (doc?.Drive_File_ID && isConfigured()) {
        shareLink = await setSharePermission(doc.Drive_File_ID);
      }

      const baseMsg = message ?? "";
      const whatsappBody = shareLink
        ? `${baseMsg}\n\nView document: ${shareLink}`
        : baseMsg;

      const whatsappUrl = `https://wa.me/${to.replace(/\D/g, "")}?text=${encodeURIComponent(whatsappBody)}`;

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

    if (action === "send-multi") {
      const whatsappEnabled = process.env.WHATSAPP_ENABLED === "true";
      const result: {
        emailSent: boolean;
        whatsappUrl: string | null;
        whatsappDryRun: boolean;
        warnings: string[];
      } = {
        emailSent: false,
        whatsappUrl: null,
        whatsappDryRun: !whatsappEnabled,
        warnings: [],
      };

      // Branch 1 — email path. Always tried when an email is provided.
      if (email) {
        const subj =
          emailSubject ?? `Your quote from Counter Cultures${docId ? ` (${docId})` : ""}`;
        const html = `
          <h2 style="font-weight: 400; letter-spacing: 0.05em;">${subj}</h2>
          <p style="line-height: 1.7; color: #6B6B6B; white-space: pre-line;">${
            emailMessage ?? ""
          }</p>
        `;
        try {
          await sendDocument(email, subj, html, Buffer.from(""), `${docId}.pdf`);
          result.emailSent = true;
        } catch (e) {
          result.warnings.push(
            `Email send failed: ${e instanceof Error ? e.message : "unknown"}`,
          );
        }
      }

      // Branch 2 — WhatsApp path. Only triggers when source IS WhatsApp
      // (or caller explicitly passes a phone). The Drive share link is
      // attached to the body so the customer can tap straight through.
      const sourceIsWA = leadSource === "WhatsApp" || leadSource === "whatsapp";
      if (phone && (sourceIsWA || !email)) {
        let shareLink = "";
        if (doc?.Drive_File_ID && isConfigured()) {
          try {
            shareLink = await setSharePermission(doc.Drive_File_ID);
          } catch (e) {
            result.warnings.push(
              `Drive share-link creation failed: ${e instanceof Error ? e.message : "unknown"}`,
            );
          }
        }
        const body = whatsappMessage ?? "";
        const fullBody = shareLink ? `${body}\n\nView document: ${shareLink}` : body;
        result.whatsappUrl = `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(fullBody)}`;
      }

      // Update document status if anything was dispatched
      if ((result.emailSent || result.whatsappUrl) && doc && rowIdx !== null && rowIdx >= 0) {
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

      return NextResponse.json({ success: true, ...result });
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
