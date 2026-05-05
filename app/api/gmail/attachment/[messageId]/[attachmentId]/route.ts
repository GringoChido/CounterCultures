import { NextResponse, type NextRequest } from "next/server";
import { getAttachment } from "@/app/lib/gmail";

// Strip ASCII chars that browsers will mangle inside filename="..." (the RFC
// 6266 quoted-string form). The filename* parameter below carries the real
// UTF-8 name for browsers that respect RFC 5987 — i.e. all modern ones.
const asciiFallback = (name: string): string =>
  name.replace(/[\\"\r\n]/g, "").replace(/[^\x20-\x7e]/g, "_") || "attachment";

export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string; attachmentId: string }> }
) => {
  const { messageId, attachmentId } = await params;
  const inline = request.nextUrl.searchParams.get("inline") === "1";
  try {
    const blob = await getAttachment(messageId, attachmentId);
    const disposition = inline ? "inline" : "attachment";
    const fallback = asciiFallback(blob.filename || "attachment");
    const encoded = encodeURIComponent(blob.filename || "attachment");
    return new Response(new Uint8Array(blob.data), {
      status: 200,
      headers: {
        "Content-Type": blob.mimeType || "application/octet-stream",
        "Content-Disposition": `${disposition}; filename="${fallback}"; filename*=UTF-8''${encoded}`,
        "Content-Length": String(blob.data.byteLength),
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "attachment_failed";
    console.error("[Gmail attachment]", msg);
    const status = msg === "Gmail not connected" ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
};
