/**
 * GET /api/dashboard/invoices/[id]/cfdi/[attachmentId]
 *
 * Download proxy — fetches the file content from Odoo and streams it back
 * to the browser with the original filename + mimetype. Required because
 * the dashboard never exposes the Odoo URL directly (auth context differs)
 * and Drive copies may not exist for every attachment.
 *
 * Gated by `view_invoices` (anyone who can see the invoice can download
 * its attachments).
 */

import { NextResponse, type NextRequest } from "next/server";
import { requireFeature, FeatureDeniedError } from "@/app/lib/auth";
import { fetchAttachment } from "@/app/lib/odoo/attachments";

export const GET = async (
  _req: NextRequest,
  {
    params,
  }: { params: Promise<{ id: string; attachmentId: string }> }
): Promise<Response> => {
  try {
    await requireFeature("view_invoices");
    const { attachmentId } = await params;
    const attId = Number(attachmentId);
    if (!Number.isFinite(attId) || attId <= 0) {
      return NextResponse.json({ error: "Invalid attachment ID" }, { status: 400 });
    }
    const file = await fetchAttachment(attId);
    if (!file) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }
    // Wrap in a Blob — universal BodyInit accepted by both Node Response
    // and the DOM Response that Next.js 16's strict types use. Copy into a
    // fresh ArrayBuffer so the Blob constructor's strict BlobPart typing
    // (which excludes SharedArrayBuffer-backed views) accepts it.
    const ab = new ArrayBuffer(file.data.byteLength);
    new Uint8Array(ab).set(file.data);
    const blob = new Blob([ab], { type: file.mimetype });
    return new Response(blob, {
      status: 200,
      headers: {
        "Content-Type": file.mimetype,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(file.name)}"`,
        "Content-Length": String(file.data.byteLength),
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (err) {
    if (err instanceof FeatureDeniedError) {
      return NextResponse.json(
        { error: "Forbidden", feature: err.feature },
        { status: 403 }
      );
    }
    const msg = err instanceof Error ? err.message : "download_failed";
    console.error("[/api/dashboard/invoices/[id]/cfdi/[attachmentId]]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
};
