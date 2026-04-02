/**
 * Google Drive API wrapper for Counter Cultures CRM
 *
 * Provides read/write access to the shared Google Drive folder.
 * Uses the same service account as Google Sheets.
 *
 * Required env vars:
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL
 *   GOOGLE_PRIVATE_KEY
 *   GOOGLE_DRIVE_FOLDER_ID  – root CRM folder ID
 */

import { google, type drive_v3 } from "googleapis";

// ── Auth ──────────────────────────────────────────────────────────────

const getAuth = () =>
  new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: [
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/drive.file",
    ],
  });

const getDrive = () => google.drive({ version: "v3", auth: getAuth() });

// ── Helpers ───────────────────────────────────────────────────────────

const ROOT_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID ?? "";

export const isConfigured = () =>
  Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY &&
      ROOT_FOLDER_ID
  );

// ── Types ─────────────────────────────────────────────────────────────

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: string;
  modifiedTime: string;
  createdTime: string;
  webViewLink: string;
  iconLink: string;
  thumbnailLink: string | null;
  parents: string[];
  isFolder: boolean;
}

export interface DriveFolder {
  id: string;
  name: string;
  fileCount: number;
  modifiedTime: string;
  webViewLink: string;
}

// ── Read Operations ───────────────────────────────────────────────────

/** List files inside a given folder (defaults to root CRM folder) */
export const listFiles = async (
  folderId?: string,
  pageSize = 50,
  pageToken?: string,
  orderBy = "folder,modifiedTime desc"
): Promise<{ files: DriveFile[]; nextPageToken?: string }> => {
  const drive = getDrive();
  const parentId = folderId || ROOT_FOLDER_ID;

  const res = await drive.files.list({
    q: `'${parentId}' in parents and trashed = false`,
    fields:
      "nextPageToken, files(id, name, mimeType, size, modifiedTime, createdTime, webViewLink, iconLink, thumbnailLink, parents)",
    pageSize,
    pageToken,
    orderBy,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  const files: DriveFile[] = (res.data.files ?? []).map(mapFile);
  return { files, nextPageToken: res.data.nextPageToken ?? undefined };
};

/** List only sub-folders inside a folder, with file counts */
export const listFolders = async (
  folderId?: string
): Promise<DriveFolder[]> => {
  const drive = getDrive();
  const parentId = folderId || ROOT_FOLDER_ID;

  const res = await drive.files.list({
    q: `'${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: "files(id, name, modifiedTime, webViewLink)",
    pageSize: 100,
    orderBy: "name",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  const folders: DriveFolder[] = await Promise.all(
    (res.data.files ?? []).map(async (f) => {
      // Get file count inside each folder
      const countRes = await drive.files.list({
        q: `'${f.id}' in parents and trashed = false`,
        fields: "files(id)",
        pageSize: 1000,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });

      return {
        id: f.id ?? "",
        name: f.name ?? "",
        fileCount: countRes.data.files?.length ?? 0,
        modifiedTime: f.modifiedTime ?? "",
        webViewLink: f.webViewLink ?? "",
      };
    })
  );

  return folders;
};

/** Search across all files in Drive */
export const searchFiles = async (
  query: string,
  pageSize = 20
): Promise<DriveFile[]> => {
  const drive = getDrive();

  const res = await drive.files.list({
    q: `fullText contains '${query.replace(/'/g, "\\'")}' and trashed = false`,
    fields:
      "files(id, name, mimeType, size, modifiedTime, createdTime, webViewLink, iconLink, thumbnailLink, parents)",
    pageSize,
    orderBy: "relevance",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  return (res.data.files ?? []).map(mapFile);
};

/** Get metadata for a single file */
export const getFile = async (fileId: string): Promise<DriveFile> => {
  const drive = getDrive();

  const res = await drive.files.get({
    fileId,
    fields:
      "id, name, mimeType, size, modifiedTime, createdTime, webViewLink, iconLink, thumbnailLink, parents",
    supportsAllDrives: true,
  });

  return mapFile(res.data);
};

/** Get breadcrumb path from a file/folder up to root */
export const getBreadcrumbs = async (
  folderId: string
): Promise<{ id: string; name: string }[]> => {
  const drive = getDrive();
  const crumbs: { id: string; name: string }[] = [];
  let currentId = folderId;

  while (currentId && currentId !== ROOT_FOLDER_ID) {
    try {
      const res = await drive.files.get({
        fileId: currentId,
        fields: "id, name, parents",
        supportsAllDrives: true,
      });
      crumbs.unshift({ id: res.data.id ?? "", name: res.data.name ?? "" });
      currentId = res.data.parents?.[0] ?? "";
    } catch {
      break;
    }
  }

  return crumbs;
};

// ── Write Operations ──────────────────────────────────────────────────

/** Create a new folder */
export const createFolder = async (
  name: string,
  parentId?: string
): Promise<DriveFile> => {
  const drive = getDrive();

  const res = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId || ROOT_FOLDER_ID],
    },
    fields:
      "id, name, mimeType, size, modifiedTime, createdTime, webViewLink, iconLink, thumbnailLink, parents",
    supportsAllDrives: true,
  });

  return mapFile(res.data);
};

/** Upload a file from a buffer */
export const uploadFile = async (
  name: string,
  mimeType: string,
  body: Buffer | ReadableStream,
  parentId?: string
): Promise<DriveFile> => {
  const drive = getDrive();

  const res = await drive.files.create({
    requestBody: {
      name,
      parents: [parentId || ROOT_FOLDER_ID],
    },
    media: {
      mimeType,
      body: body instanceof Buffer ? bufferToStream(body) : body,
    },
    fields:
      "id, name, mimeType, size, modifiedTime, createdTime, webViewLink, iconLink, thumbnailLink, parents",
    supportsAllDrives: true,
  });

  return mapFile(res.data);
};

/** Delete (trash) a file or folder */
export const trashFile = async (fileId: string): Promise<void> => {
  const drive = getDrive();
  await drive.files.update({
    fileId,
    requestBody: { trashed: true },
    supportsAllDrives: true,
  });
};

// ── Utility ───────────────────────────────────────────────────────────

const mapFile = (f: drive_v3.Schema$File): DriveFile => ({
  id: f.id ?? "",
  name: f.name ?? "",
  mimeType: f.mimeType ?? "",
  size: f.size ?? "0",
  modifiedTime: f.modifiedTime ?? "",
  createdTime: f.createdTime ?? "",
  webViewLink: f.webViewLink ?? "",
  iconLink: f.iconLink ?? "",
  thumbnailLink: f.thumbnailLink ?? null,
  parents: f.parents ?? [],
  isFolder: f.mimeType === "application/vnd.google-apps.folder",
});

const bufferToStream = (buffer: Buffer) => {
  const { Readable } = require("stream");
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
};
