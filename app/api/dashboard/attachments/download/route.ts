import { NextRequest, NextResponse } from "next/server";
import { downloadFile, isConfigured } from "@/app/lib/google-drive";

export const GET = async (req: NextRequest) => {
  const fileId = new URL(req.url).searchParams.get("fileId");
  if (!fileId) {
    return NextResponse.json(
      { error: "fileId is required" },
      { status: 400 }
    );
  }

  if (!isConfigured()) {
    return NextResponse.json(
      { error: "Google Drive not configured" },
      { status: 503 }
    );
  }

  try {
    const { buffer, mimeType, name } = await downloadFile(fileId);
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(name)}"`,
        "Content-Length": String(buffer.length),
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (err) {
    console.error("[attachment-download] Error:", err);
    return NextResponse.json(
      { error: "Download failed" },
      { status: 500 }
    );
  }
};
