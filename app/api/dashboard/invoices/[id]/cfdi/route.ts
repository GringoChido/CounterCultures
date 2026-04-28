/**
 * /api/dashboard/invoices/[id]/cfdi
 *
 * GET  → list attachments tied to this invoice (read from Odoo's
 *        ir.attachment via XMLRPC). Returns name, mimetype, size, date.
 *        Surfaces both historically-attached files and ones uploaded
 *        through this dashboard.
 *
 * POST → multipart upload. Accepts XML + PDF. For each file:
 *          1. Writes to Odoo as ir.attachment (preserves accountant flow)
 *          2. Writes to Drive in CFDIs/<year>/<invoice_name>/ (team copy)
 *        Logs the action in Activity_Log with the actor's email.
 *
 * Gated by `attach_cfdi` (default: owner + finance roles).
 */

import { NextResponse, type NextRequest } from "next/server";
import { requireFeature, FeatureDeniedError } from "@/app/lib/auth";
import {
  listAttachmentsFor,
  createAttachmentFor,
} from "@/app/lib/odoo/attachments";
import { getInvoiceDetail } from "@/app/lib/odoo-sheets";
import { findOrCreateFolder, uploadFile } from "@/app/lib/google-drive";
import { appendRow } from "@/app/lib/dashboard-sheets";
import { getInvoiceApproval, recordStamped } from "@/app/lib/invoice-approval";

const CFDI_ROOT_FOLDER_ID =
  process.env.GOOGLE_CFDI_FOLDER_ID || process.env.GOOGLE_DRIVE_FOLDER_ID || "";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB — CFDIs are tiny, this is generous

const ALLOWED_MIMES = new Set([
  "application/xml",
  "text/xml",
  "application/pdf",
  // Some browsers send xml as octet-stream; we accept and re-tag by extension.
  "application/octet-stream",
]);

const inferMime = (filename: string, providedMime: string): string => {
  if (providedMime && providedMime !== "application/octet-stream") return providedMime;
  const lower = filename.toLowerCase();
  if (lower.endsWith(".xml")) return "application/xml";
  if (lower.endsWith(".pdf")) return "application/pdf";
  return providedMime || "application/octet-stream";
};

interface AttachmentResponse {
  id: number;
  name: string;
  mimetype: string;
  fileSize: number;
  createDate: string;
  createdBy: string;
}

// ── GET ──────────────────────────────────────────────────────────

export const GET = async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> => {
  try {
    await requireFeature("view_invoices");
    const { id } = await params;
    const invoiceId = Number(id);
    if (!Number.isFinite(invoiceId) || invoiceId <= 0) {
      return NextResponse.json({ error: "Invalid invoice ID" }, { status: 400 });
    }
    const attachments: AttachmentResponse[] = await listAttachmentsFor(
      "account.move",
      invoiceId
    );
    return NextResponse.json({ attachments });
  } catch (err) {
    if (err instanceof FeatureDeniedError) {
      return NextResponse.json(
        { error: "Forbidden", feature: err.feature },
        { status: 403 }
      );
    }
    const msg = err instanceof Error ? err.message : "list_failed";
    console.error("[/api/dashboard/invoices/[id]/cfdi GET]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
};

// ── POST ─────────────────────────────────────────────────────────

export const POST = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> => {
  try {
    const user = await requireFeature("attach_cfdi");
    const { id } = await params;
    const invoiceId = Number(id);
    if (!Number.isFinite(invoiceId) || invoiceId <= 0) {
      return NextResponse.json({ error: "Invalid invoice ID" }, { status: 400 });
    }

    const formData = await req.formData();
    const files: File[] = [];
    for (const value of formData.getAll("file")) {
      if (value instanceof File) files.push(value);
    }
    if (files.length === 0) {
      return NextResponse.json(
        { error: "No files provided. Send under 'file' field (multipart)." },
        { status: 400 }
      );
    }

    // Approval gate — refuse to attach a CFDI unless the prefactura is in
    // `approved` state. Owner role can override (logged + audited) so an
    // owner can rescue edge cases where someone forgot to log approval
    // before the customer's CFDI request came back stamped.
    const overrideRequested =
      formData.get("override")?.toString() === "true";
    const approval = await getInvoiceApproval(invoiceId);
    const isApproved = approval.state === "approved";
    const isOwner = user.role === "owner";

    if (!isApproved && !overrideRequested) {
      return NextResponse.json(
        {
          error: "approval_required",
          message:
            approval.state === "draft"
              ? "Send the prefactura to the client first, then mark it approved."
              : approval.state === "prefactura_sent"
                ? "Mark the prefactura approved before attaching the stamped CFDI."
                : approval.state === "stamped"
                  ? "This invoice already has a stamped CFDI attached."
                  : "Approval required.",
          currentState: approval.state,
          canOverride: isOwner,
        },
        { status: 409 }
      );
    }
    if (!isApproved && overrideRequested && !isOwner) {
      return NextResponse.json(
        {
          error: "override_forbidden",
          message: "Only owners can attach a CFDI without prefactura approval.",
        },
        { status: 403 }
      );
    }

    // Validate before any writes — fail fast on bad input.
    for (const f of files) {
      if (f.size === 0) {
        return NextResponse.json(
          { error: `File '${f.name}' is empty` },
          { status: 400 }
        );
      }
      if (f.size > MAX_FILE_BYTES) {
        return NextResponse.json(
          { error: `File '${f.name}' exceeds 10 MB limit` },
          { status: 413 }
        );
      }
      if (!ALLOWED_MIMES.has(f.type) && f.type !== "") {
        return NextResponse.json(
          { error: `File '${f.name}' has unsupported MIME '${f.type}' — must be XML or PDF` },
          { status: 415 }
        );
      }
    }

    // Look up invoice metadata once for folder naming + audit.
    const invoiceDetail = await getInvoiceDetail(String(invoiceId));
    const invoiceName = invoiceDetail?.invoice?.name ?? `INV-${invoiceId}`;
    const invoiceDate = invoiceDetail?.invoice?.date ?? "";
    const year =
      invoiceDate && invoiceDate.length >= 4 ? invoiceDate.slice(0, 4) : String(new Date().getFullYear());

    // Walk files: Odoo first (the source of truth for accountant), then Drive.
    // If Odoo fails, abort — we don't want orphaned Drive files. If Drive
    // fails after Odoo succeeded, we log + continue (Odoo has it; Drive can
    // be re-synced later).
    const results: { name: string; odooId: number | null; driveFileId: string | null; driveError?: string }[] = [];
    for (const f of files) {
      const buf = Buffer.from(await f.arrayBuffer());
      const mime = inferMime(f.name, f.type);
      // Sanitize filename for Drive — keep it readable but not surprising.
      const safeName = f.name.replace(/[\/\\?%*:|"<>]/g, "_");

      // 1) Odoo write
      const odooId = await createAttachmentFor({
        resModel: "account.move",
        resId: invoiceId,
        name: safeName,
        mimetype: mime,
        data: buf,
      });

      // 2) Drive write — best-effort
      let driveFileId: string | null = null;
      let driveError: string | undefined;
      if (CFDI_ROOT_FOLDER_ID) {
        try {
          const yearFolder = await findOrCreateFolder(year, CFDI_ROOT_FOLDER_ID);
          const invoiceFolder = await findOrCreateFolder(invoiceName, yearFolder.id);
          const driveFile = await uploadFile(safeName, mime, buf, invoiceFolder.id);
          driveFileId = driveFile.id;
        } catch (err) {
          driveError = err instanceof Error ? err.message : "drive_upload_failed";
          console.error(
            `[CFDI attach] Drive upload failed for ${safeName} (Odoo OK, id=${odooId}):`,
            driveError
          );
        }
      } else {
        driveError = "no_drive_folder_configured";
      }

      results.push({ name: safeName, odooId, driveFileId, driveError });
    }

    // Advance approval state to "stamped" — this closes the prefactura
    // workflow loop. If we got here via owner override, recordStamped
    // notes that in the approval_note for traceability.
    await recordStamped({
      invoiceId,
      invoiceName,
      byEmail: user.email,
      override: !isApproved && overrideRequested,
    });

    // Audit row per upload batch (one entry, not per-file, so the log stays
    // readable). Records all file names + the Odoo IDs.
    appendRow("Activity_Log", [
      `EA-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      new Date().toISOString(),
      user.email,
      overrideRequested && !isApproved ? "attach_cfdi_override" : "attach_cfdi",
      "invoice",
      String(invoiceId),
      JSON.stringify({
        invoice_name: invoiceName,
        approval_state_at_attach: approval.state,
        override: overrideRequested && !isApproved,
        files: results.map((r) => ({
          name: r.name,
          odoo_id: r.odooId,
          drive_id: r.driveFileId,
          drive_error: r.driveError,
        })),
      }),
    ]).catch((err) =>
      console.error("[CFDI attach] Activity_Log append failed:", err)
    );

    return NextResponse.json({ ok: true, results });
  } catch (err) {
    if (err instanceof FeatureDeniedError) {
      return NextResponse.json(
        { error: "Forbidden", feature: err.feature },
        { status: 403 }
      );
    }
    const msg = err instanceof Error ? err.message : "upload_failed";
    console.error("[/api/dashboard/invoices/[id]/cfdi POST]", msg);
    const status = msg.includes("not configured") ? 503 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
};
