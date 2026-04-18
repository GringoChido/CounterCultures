import { NextResponse, type NextRequest } from "next/server";
import { getAttachment } from "@/app/lib/gmail";
import { findOrCreateFolder, uploadFile, isConfigured } from "@/app/lib/google-drive";

const ROOT_FOLDER_NAME = "Email attachments";

// Counter Cultures Shared Drive root (per CLAUDE_PROJECT_BRIEF.md HARD
// RULE) — new operational folders are born here, not in the legacy
// personal-Drive root. Override via env if relocated.
const SHARED_DRIVE_ID =
  process.env.GOOGLE_SHARED_DRIVE_ID || "0ALSvVEdW2-pkUk9PVA";

const todayFolderName = (): string => {
  // YYYY-MM-DD in UTC — predictable across timezones
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
    d.getUTCDate()
  ).padStart(2, "0")}`;
};

export const POST = async (request: NextRequest) => {
  try {
    if (!isConfigured()) {
      return NextResponse.json(
        { error: "Drive not configured (service account env missing)" },
        { status: 503 }
      );
    }
    const { messageId, attachmentId } = (await request.json()) as {
      messageId?: string;
      attachmentId?: string;
    };
    if (!messageId || !attachmentId) {
      return NextResponse.json(
        { error: "messageId and attachmentId are required" },
        { status: 400 }
      );
    }

    const blob = await getAttachment(messageId, attachmentId);

    // Folder structure (in Shared Drive): Email attachments / YYYY-MM-DD
    const root = await findOrCreateFolder(ROOT_FOLDER_NAME, SHARED_DRIVE_ID);
    const day = await findOrCreateFolder(todayFolderName(), root.id);

    const file = await uploadFile(blob.filename, blob.mimeType, blob.data, day.id);

    return NextResponse.json({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      webViewLink: file.webViewLink,
      folder: { id: day.id, name: day.name },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "to_drive_failed";
    console.error("[Gmail to-drive]", msg);
    const status = msg === "Gmail not connected" ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
};
