import { NextResponse, type NextRequest } from "next/server";
import {
  getDriveClient,
  fetchDriveRecent,
  fetchDriveSuggested,
  fetchDriveFolder,
  fetchDriveShared,
  fetchDriveStarred,
  fetchMyDriveRoot,
  fetchSharedDrives,
  searchDrive,
  getFolderMeta,
  hasDriveScope,
} from "@/app/lib/google-drive-user";

// GET /api/dashboard/drive-home
//   action = "recent" | "suggested" | "folder" | "shared" | "starred" | "search" | "folder-meta"
//   folderId / q as applicable

export const GET = async (request: NextRequest) => {
  const { searchParams } = request.nextUrl;
  const action = searchParams.get("action") ?? "recent";

  const client = await getDriveClient();
  if (!client) {
    const scoped = await hasDriveScope();
    return NextResponse.json(
      {
        error: scoped
          ? "Drive client unavailable"
          : "Drive access not granted — reconnect Gmail to grant Drive read access",
        needsReconnect: !scoped,
      },
      { status: 503 }
    );
  }
  const { drive } = client;

  try {
    switch (action) {
      case "recent": {
        const files = await fetchDriveRecent(drive);
        return NextResponse.json({ files });
      }
      case "suggested": {
        const files = await fetchDriveSuggested(drive);
        return NextResponse.json({ files });
      }
      case "folder": {
        const folderId = searchParams.get("folderId");
        if (!folderId) {
          return NextResponse.json(
            { error: "folderId required" },
            { status: 400 }
          );
        }
        const files = await fetchDriveFolder(drive, folderId);
        return NextResponse.json({ files });
      }
      case "shared": {
        const files = await fetchDriveShared(drive);
        return NextResponse.json({ files });
      }
      case "starred": {
        const files = await fetchDriveStarred(drive);
        return NextResponse.json({ files });
      }
      case "my-drive": {
        const files = await fetchMyDriveRoot(drive);
        return NextResponse.json({ files });
      }
      case "shared-drives": {
        const files = await fetchSharedDrives(drive);
        return NextResponse.json({ files });
      }
      case "search": {
        const q = searchParams.get("q") ?? "";
        const files = await searchDrive(drive, q);
        return NextResponse.json({ files });
      }
      case "folder-meta": {
        const folderId = searchParams.get("folderId");
        if (!folderId) {
          return NextResponse.json(
            { error: "folderId required" },
            { status: 400 }
          );
        }
        const meta = await getFolderMeta(drive, folderId);
        return NextResponse.json({ meta });
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Drive request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
};
