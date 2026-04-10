/**
 * Uploads all product images from public/products/ to a Google Shared Drive.
 *
 * Creates a folder structure that mirrors the local directory structure,
 * uploads each image, and outputs a mapping of local path → Drive file ID.
 *
 * Usage:
 *   npx tsx scripts/upload-images-to-drive.ts
 *
 * Requires env vars:
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL
 *   GOOGLE_PRIVATE_KEY
 */

import { google } from "googleapis";
import * as fs from "fs";
import * as path from "path";

const SHARED_DRIVE_ID = "0ABfW1lB9BFipUk9PVA";
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY) {
  console.error("Missing required env vars: GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY");
  process.exit(1);
}

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: SERVICE_ACCOUNT_EMAIL,
    private_key: PRIVATE_KEY,
  },
  scopes: ["https://www.googleapis.com/auth/drive"],
});

const drive = google.drive({ version: "v3", auth });

const folderCache = new Map<string, string>();

const findOrCreateFolder = async (name: string, parentId: string): Promise<string> => {
  const cacheKey = `${parentId}/${name}`;
  if (folderCache.has(cacheKey)) return folderCache.get(cacheKey)!;

  const existing = await drive.files.list({
    q: `name='${name}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: "files(id, name)",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    corpora: "drive",
    driveId: SHARED_DRIVE_ID,
  });

  if (existing.data.files && existing.data.files.length > 0) {
    const folderId = existing.data.files[0].id!;
    folderCache.set(cacheKey, folderId);
    return folderId;
  }

  const folder = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    },
    fields: "id",
    supportsAllDrives: true,
  });

  const folderId = folder.data.id!;
  folderCache.set(cacheKey, folderId);
  console.log(`📁 Created folder: ${name}`);
  return folderId;
};

const uploadFile = async (localPath: string, driveFolderId: string): Promise<string> => {
  const fileName = path.basename(localPath);
  const ext = path.extname(localPath).toLowerCase();
  const mimeMap: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
  };
  const mimeType = mimeMap[ext] || "image/jpeg";

  const file = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [driveFolderId],
    },
    media: {
      mimeType,
      body: fs.createReadStream(localPath),
    },
    fields: "id",
    supportsAllDrives: true,
  });

  return file.data.id!;
};

const walkDir = (dir: string): string[] => {
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkDir(fullPath));
    } else if (/\.(jpg|jpeg|png|webp)$/i.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
};

const run = async () => {
  const productsDir = path.resolve("public/products");
  const allImages = walkDir(productsDir);
  console.log(`🖼️  Found ${allImages.length} images to upload`);

  // Create "Product Images" root folder in Shared Drive
  const rootFolderId = await findOrCreateFolder("Product Images", SHARED_DRIVE_ID);

  const mapping: Record<string, string> = {};
  let uploaded = 0;
  let failed = 0;

  for (const imagePath of allImages) {
    const relativePath = path.relative(productsDir, imagePath);
    const parts = relativePath.split(path.sep);
    const fileName = parts.pop()!;

    // Create nested folder structure
    let currentFolderId = rootFolderId;
    for (const part of parts) {
      currentFolderId = await findOrCreateFolder(part, currentFolderId);
    }

    try {
      const fileId = await uploadFile(imagePath, currentFolderId);
      mapping[`/products/${relativePath}`] = `https://lh3.googleusercontent.com/d/${fileId}`;
      uploaded++;

      if (uploaded % 10 === 0) {
        console.log(`⬆️  Uploaded ${uploaded}/${allImages.length}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`❌ Failed: ${relativePath} — ${msg}`);
      failed++;
    }
  }

  // Write mapping file (local path → Google Drive public URL)
  fs.writeFileSync(
    "scripts/drive-image-mapping.json",
    JSON.stringify(mapping, null, 2)
  );

  console.log(`\n✅ Uploaded ${uploaded} images to Google Shared Drive`);
  if (failed > 0) console.log(`⚠️  ${failed} failed`);
  console.log(`📄 Mapping saved to scripts/drive-image-mapping.json`);
};

run().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
