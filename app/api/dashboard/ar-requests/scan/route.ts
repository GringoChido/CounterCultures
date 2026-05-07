import { NextResponse, type NextRequest } from "next/server";
import {
  scanGmailForFacturas,
  autoQueueFacturaEmails,
} from "@/app/lib/factura-detector";

/**
 * GET  — preview: scan Gmail for COMPROBANTE emails, return matches without queuing
 * POST — auto-queue: scan and create AR requests for unprocessed emails
 */

export const GET = async (req: NextRequest) => {
  try {
    const maxResults = Math.min(
      Number(req.nextUrl.searchParams.get("maxResults") ?? 20),
      50
    );
    const detected = await scanGmailForFacturas(maxResults);
    return NextResponse.json({
      detected,
      total: detected.length,
      newCount: detected.filter((d) => !d.alreadyQueued).length,
    });
  } catch (err) {
    console.error("[ar-requests/scan] GET error:", err);
    return NextResponse.json(
      { error: "Failed to scan Gmail" },
      { status: 500 }
    );
  }
};

export const POST = async () => {
  try {
    const result = await autoQueueFacturaEmails();
    return NextResponse.json(result);
  } catch (err) {
    console.error("[ar-requests/scan] POST error:", err);
    return NextResponse.json(
      { error: "Failed to auto-queue facturas" },
      { status: 500 }
    );
  }
};
