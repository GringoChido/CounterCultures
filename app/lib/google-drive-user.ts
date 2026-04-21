/**
 * User-OAuth Drive API wrapper — mirrors the authenticated user's personal
 * Drive (Recent, Suggested, Shared with me, Starred). Uses the same refresh
 * token store as Gmail; Drive scope was added to GMAIL_SCOPES so one
 * reconnect grants both.
 *
 * Service-account access is handled separately in ./google-drive.ts and is
 * used for CRM writes (email attachments, document generation). This file
 * is read-only.
 */

import { google, drive_v3 } from "googleapis";
import { getActiveToken, markError } from "./gmail-tokens";
import { getOAuth2Client } from "./gmail";

export interface DriveHomeFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  modifiedTime: string;
  viewedByMeTime: string | null;
  size: string | null;
  owners: { displayName: string; photoLink: string | null }[];
  thumbnailLink: string | null;
  shared: boolean;
  starred: boolean;
  isFolder: boolean;
}

const FIELDS =
  "id,name,mimeType,webViewLink,modifiedTime,viewedByMeTime,size,owners(displayName,photoLink),thumbnailLink,shared,starred";

const LIST_FIELDS = `nextPageToken,files(${FIELDS})`;

const mapFile = (f: drive_v3.Schema$File): DriveHomeFile => ({
  id: f.id ?? "",
  name: f.name ?? "",
  mimeType: f.mimeType ?? "",
  webViewLink: f.webViewLink ?? "",
  modifiedTime: f.modifiedTime ?? "",
  viewedByMeTime: f.viewedByMeTime ?? null,
  size: f.size ?? null,
  owners: (f.owners ?? []).map((o) => ({
    displayName: o.displayName ?? "",
    photoLink: o.photoLink ?? null,
  })),
  thumbnailLink: f.thumbnailLink ?? null,
  shared: f.shared ?? false,
  starred: f.starred ?? false,
  isFolder: f.mimeType === "application/vnd.google-apps.folder",
});

/**
 * Returns an authenticated Drive v3 client for the currently-connected user.
 * Returns null if no active token or if the token's scopes don't include
 * drive.readonly (user needs to reconnect).
 */
export const getDriveClient = async (): Promise<{
  drive: drive_v3.Drive;
  gmailAddress: string;
} | null> => {
  const token = await getActiveToken();
  if (!token) return null;

  const hasDriveScope = token.scopes.some((s) =>
    s.includes("auth/drive")
  );
  if (!hasDriveScope) return null;

  const oauth = getOAuth2Client();
  oauth.setCredentials({ refresh_token: token.refreshToken });

  try {
    await oauth.getAccessToken();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await markError(token.gmailAddress, msg);
    return null;
  }

  const drive = google.drive({ version: "v3", auth: oauth });
  return { drive, gmailAddress: token.gmailAddress };
};

export const hasDriveScope = async (): Promise<boolean> => {
  const token = await getActiveToken();
  if (!token) return false;
  return token.scopes.some((s) => s.includes("auth/drive"));
};

const escapeQuery = (q: string) =>
  q.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

// ── Queries ───────────────────────────────────────────────────────────

export const fetchDriveRecent = async (
  drive: drive_v3.Drive,
  limit = 50
): Promise<DriveHomeFile[]> => {
  const res = await drive.files.list({
    orderBy: "modifiedTime desc",
    pageSize: limit,
    fields: LIST_FIELDS,
    q: "trashed = false",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    corpora: "allDrives",
  });
  return (res.data.files ?? []).map(mapFile);
};

export const fetchDriveSuggested = async (
  drive: drive_v3.Drive
): Promise<DriveHomeFile[]> => {
  const res = await drive.files.list({
    orderBy: "viewedByMeTime desc",
    pageSize: 8,
    fields: LIST_FIELDS,
    q: "viewedByMeTime != null and trashed = false",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    corpora: "allDrives",
  });
  return (res.data.files ?? []).map(mapFile);
};

export const fetchDriveFolder = async (
  drive: drive_v3.Drive,
  folderId: string
): Promise<DriveHomeFile[]> => {
  const res = await drive.files.list({
    q: `'${escapeQuery(folderId)}' in parents and trashed = false`,
    orderBy: "folder,name",
    pageSize: 200,
    fields: LIST_FIELDS,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  return (res.data.files ?? []).map(mapFile);
};

export const fetchDriveShared = async (
  drive: drive_v3.Drive
): Promise<DriveHomeFile[]> => {
  const res = await drive.files.list({
    q: "sharedWithMe = true and trashed = false",
    orderBy: "modifiedTime desc",
    pageSize: 50,
    fields: LIST_FIELDS,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  return (res.data.files ?? []).map(mapFile);
};

export const fetchDriveStarred = async (
  drive: drive_v3.Drive
): Promise<DriveHomeFile[]> => {
  const res = await drive.files.list({
    q: "starred = true and trashed = false",
    orderBy: "modifiedTime desc",
    pageSize: 50,
    fields: LIST_FIELDS,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    corpora: "allDrives",
  });
  return (res.data.files ?? []).map(mapFile);
};

export const searchDrive = async (
  drive: drive_v3.Drive,
  query: string
): Promise<DriveHomeFile[]> => {
  const q = escapeQuery(query.trim());
  if (!q) return [];
  const res = await drive.files.list({
    q: `fullText contains '${q}' and trashed = false`,
    orderBy: "modifiedTime desc",
    pageSize: 30,
    fields: LIST_FIELDS,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    corpora: "allDrives",
  });
  return (res.data.files ?? []).map(mapFile);
};

export const fetchMyDriveRoot = async (
  drive: drive_v3.Drive
): Promise<DriveHomeFile[]> => {
  const res = await drive.files.list({
    q: "'root' in parents and trashed = false",
    orderBy: "folder,name",
    pageSize: 200,
    fields: LIST_FIELDS,
  });
  return (res.data.files ?? []).map(mapFile);
};

export const fetchSharedDrives = async (
  drive: drive_v3.Drive
): Promise<DriveHomeFile[]> => {
  const res = await drive.drives.list({ pageSize: 100 });
  return (res.data.drives ?? []).map((d) => ({
    id: d.id ?? "",
    name: d.name ?? "",
    mimeType: "application/vnd.google-apps.folder",
    webViewLink: `https://drive.google.com/drive/folders/${d.id}`,
    modifiedTime: "",
    viewedByMeTime: null,
    size: null,
    owners: [],
    thumbnailLink: null,
    shared: true,
    starred: false,
    isFolder: true,
  }));
};

export const getFolderMeta = async (
  drive: drive_v3.Drive,
  folderId: string
): Promise<{ id: string; name: string; parents: string[] }> => {
  const res = await drive.files.get({
    fileId: folderId,
    fields: "id,name,parents",
    supportsAllDrives: true,
  });
  return {
    id: res.data.id ?? folderId,
    name: res.data.name ?? "",
    parents: res.data.parents ?? [],
  };
};
