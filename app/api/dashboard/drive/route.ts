import { NextResponse, type NextRequest } from "next/server";
import {
  isConfigured,
  listFiles,
  listFolders,
  searchFiles,
  getBreadcrumbs,
  createFolder,
  trashFile,
} from "@/app/lib/google-drive";

// GET /api/dashboard/drive
// Query params:
//   action   = "list" | "folders" | "search" | "breadcrumbs"  (default: "list")
//   folderId = parent folder ID (optional, defaults to root)
//   q        = search query (for action=search)
//   pageSize = number of results (optional)
//   pageToken = pagination token (optional)

export const GET = async (request: NextRequest) => {
  if (!isConfigured()) {
    return NextResponse.json(
      {
        error: "Google Drive not configured",
        hint: "Set GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, and GOOGLE_DRIVE_FOLDER_ID env vars",
      },
      { status: 503 }
    );
  }

  const { searchParams } = request.nextUrl;
  const action = searchParams.get("action") ?? "list";
  const folderId = searchParams.get("folderId") ?? undefined;
  const query = searchParams.get("q") ?? "";
  const pageSize = Number(searchParams.get("pageSize")) || 50;
  const pageToken = searchParams.get("pageToken") ?? undefined;

  try {
    switch (action) {
      case "folders": {
        const folders = await listFolders(folderId);
        return NextResponse.json({ folders });
      }

      case "search": {
        if (!query) {
          return NextResponse.json(
            { error: "Query parameter 'q' is required for search" },
            { status: 400 }
          );
        }
        const files = await searchFiles(query, pageSize);
        return NextResponse.json({ files });
      }

      case "breadcrumbs": {
        if (!folderId) {
          return NextResponse.json({ breadcrumbs: [] });
        }
        const breadcrumbs = await getBreadcrumbs(folderId);
        return NextResponse.json({ breadcrumbs });
      }

      case "list":
      default: {
        const result = await listFiles(folderId, pageSize, pageToken);
        return NextResponse.json(result);
      }
    }
  } catch (err) {
    console.error("[Drive API]", err);
    return NextResponse.json(
      { error: "Failed to fetch from Google Drive" },
      { status: 500 }
    );
  }
};

// POST /api/dashboard/drive
// Body: { action: "createFolder" | "upload" | "trash", ... }

export const POST = async (request: NextRequest) => {
  if (!isConfigured()) {
    return NextResponse.json(
      { error: "Google Drive not configured" },
      { status: 503 }
    );
  }

  try {
    const contentType = request.headers.get("content-type") ?? "";

    // Handle multipart file upload
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const parentId = (formData.get("parentId") as string) || undefined;

      if (!file) {
        return NextResponse.json(
          { error: "No file provided" },
          { status: 400 }
        );
      }

      const { uploadFile } = await import("@/app/lib/google-drive");
      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await uploadFile(file.name, file.type, buffer, parentId);
      return NextResponse.json({ file: result });
    }

    // Handle JSON actions
    const body = await request.json();
    const { action } = body as { action: string };

    switch (action) {
      case "createFolder": {
        const { name, parentId } = body as {
          name: string;
          parentId?: string;
        };
        if (!name) {
          return NextResponse.json(
            { error: "Folder name is required" },
            { status: 400 }
          );
        }
        const folder = await createFolder(name, parentId);
        return NextResponse.json({ folder });
      }

      case "trash": {
        const { fileId } = body as { fileId: string };
        if (!fileId) {
          return NextResponse.json(
            { error: "fileId is required" },
            { status: 400 }
          );
        }
        await trashFile(fileId);
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (err) {
    console.error("[Drive API POST]", err);
    return NextResponse.json(
      { error: "Drive operation failed" },
      { status: 500 }
    );
  }
};
