import { NextResponse, type NextRequest } from "next/server";
import { getAttachment } from "@/app/lib/gmail";

export const GET = async (
  _request: NextRequest,
  { params }: { params: Promise<{ messageId: string; attachmentId: string }> }
) => {
  const { messageId, attachmentId } = await params;
  try {
    const blob = await getAttachment(messageId, attachmentId);
    return new Response(new Uint8Array(blob.data), {
      status: 200,
      headers: {
        "Content-Type": blob.mimeType,
        "Content-Disposition": `attachment; filename="${blob.filename.replace(/"/g, "")}"`,
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
