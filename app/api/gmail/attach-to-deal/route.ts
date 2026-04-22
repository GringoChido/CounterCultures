/**
 * POST /api/gmail/attach-to-deal
 *
 * Body: { messageId, threadId, dealId, uploadAttachments?: boolean }
 *
 * Links a Gmail thread to an existing Pipeline deal by writing an
 * Email_Activity row with action=attached_to_deal and the related_deal_id.
 * The Thread-on-Deal panel reads these rows to surface the thread on the
 * deal's detail view.
 *
 * V3 addition: if the message has attachments and uploadAttachments is not
 * explicitly false, each attachment is uploaded to
 *   Deals/[dealId]/Email Attachments/
 * in the Shared Drive (via app/lib/deal-drive.ts). Previously attachments
 * went to a generic "Email attachments / YYYY-MM-DD" bucket at the Shared
 * Drive root, making them invisible from the deal detail view.
 */

import { NextResponse, type NextRequest } from "next/server";
import { getGmailClient, getAttachment } from "@/app/lib/gmail";
import { logEmailActivity } from "@/app/lib/email-activity";
import { getDealSubfolder } from "@/app/lib/deal-drive";
import {
  uploadFile,
  isConfigured as isDriveConfigured,
} from "@/app/lib/google-drive";

type AttachmentSummary = {
  attachmentId: string;
  filename: string;
  mimeType: string;
  size: number;
};

type UploadResult = {
  attachmentId: string;
  driveFileId: string;
  name: string;
  webViewLink: string;
};

type UploadError = {
  attachmentId: string;
  filename: string;
  error: string;
};

const parseFrom = (raw: string): string => {
  if (!raw) return "";
  const m = raw.match(/<([^>]+)>/);
  return m ? m[1].trim() : raw.trim();
};

const findAttachments = (
  part: unknown,
  out: AttachmentSummary[] = []
): AttachmentSummary[] => {
  if (!part || typeof part !== "object") return out;
  const p = part as {
    filename?: string;
    mimeType?: string;
    body?: { attachmentId?: string; size?: number };
    parts?: unknown[];
  };
  if (p.filename && p.body?.attachmentId) {
    out.push({
      attachmentId: p.body.attachmentId,
      filename: p.filename,
      mimeType: p.mimeType ?? "application/octet-stream",
      size: p.body.size ?? 0,
    });
  }
  for (const child of p.parts ?? []) findAttachments(child, out);
  return out;
};

export const POST = async (request: NextRequest) => {
  try {
    const { messageId, threadId, dealId, uploadAttachments } =
      await request.json();
    if (!messageId || !threadId || !dealId) {
      return NextResponse.json(
        { error: "messageId, threadId, and dealId are required" },
        { status: 400 }
      );
    }

    const client = await getGmailClient();
    if (!client) {
      return NextResponse.json({ error: "Gmail not connected" }, { status: 409 });
    }

    // Fetch full message so we can pick up attachments in addition to
    // From/Subject metadata.
    const msg = await client.gmail.users.messages.get({
      userId: "me",
      id: messageId,
      format: "full",
    });

    const headers: Record<string, string> = {};
    for (const h of msg.data.payload?.headers ?? []) {
      if (h.name) headers[h.name.toLowerCase()] = h.value ?? "";
    }
    const senderEmail = parseFrom(headers.from || "");
    const subject = headers.subject || "(no subject)";
    const snippet = (msg.data.snippet ?? "").slice(0, 200);

    const attachments = findAttachments(msg.data.payload);
    const shouldUpload =
      uploadAttachments !== false && attachments.length > 0 && isDriveConfigured();

    const uploaded: UploadResult[] = [];
    const uploadErrors: UploadError[] = [];

    if (shouldUpload) {
      let dealFolder: { id: string };
      try {
        dealFolder = await getDealSubfolder(dealId, "Email Attachments");
      } catch (err) {
        // Fall through — still log the Email_Activity row so the user
        // sees the email on the deal even if folder creation failed.
        console.error(
          "[attach-to-deal] failed to resolve deal folder:",
          err instanceof Error ? err.message : err
        );
        dealFolder = { id: "" };
      }

      if (dealFolder.id) {
        for (const att of attachments) {
          try {
            const blob = await getAttachment(messageId, att.attachmentId);
            const file = await uploadFile(
              blob.filename,
              blob.mimeType,
              blob.data,
              dealFolder.id
            );
            uploaded.push({
              attachmentId: att.attachmentId,
              driveFileId: file.id,
              name: file.name,
              webViewLink: file.webViewLink,
            });
          } catch (err) {
            const msgText = err instanceof Error ? err.message : "upload_failed";
            console.error(
              `[attach-to-deal] failed to upload ${att.filename}:`,
              msgText
            );
            uploadErrors.push({
              attachmentId: att.attachmentId,
              filename: att.filename,
              error: msgText,
            });
          }
        }
      }
    }

    await logEmailActivity({
      userEmail: client.gmailAddress,
      gmailMessageId: messageId,
      gmailThreadId: threadId,
      direction: "inbound",
      action: "attached_to_deal",
      relatedDealId: dealId,
      senderEmail,
      subject,
      snippet,
    });

    return NextResponse.json({
      ok: true,
      attachmentCount: attachments.length,
      uploaded,
      uploadErrors,
      driveUploadSkipped: !shouldUpload,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "attach_failed";
    console.error("[attach-to-deal]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
};
