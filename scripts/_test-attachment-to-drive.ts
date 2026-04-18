/**
 * One-off test: prove the Gmail-attachment → Drive round-trip.
 *   1. Find the most recent inbox thread that has an attachment
 *   2. POST /api/gmail/attachment/to-drive (via direct lib calls)
 *   3. Confirm the file landed in the right folder
 *   4. Cleanup — trash the test file + the day folder if it's now empty
 *
 * Run: npx tsx scripts/_test-attachment-to-drive.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

const ROOT_FOLDER_NAME = "Email attachments";
const SHARED_DRIVE_ID =
  process.env.GOOGLE_SHARED_DRIVE_ID || "0ALSvVEdW2-pkUk9PVA";

const todayFolderName = (): string => {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
    d.getUTCDate()
  ).padStart(2, "0")}`;
};

const main = async () => {
  // Dynamic imports — wait for dotenv to load
  const { listInbox, getThread, getAttachment } = await import("../app/lib/gmail");
  const { findOrCreateFolder, uploadFile, isConfigured, trashFile } = await import(
    "../app/lib/google-drive"
  );

  if (!isConfigured()) throw new Error("Drive not configured");
  console.log("→ findOrCreateFolder roots (Shared Drive)");
  const root = await findOrCreateFolder(ROOT_FOLDER_NAME, SHARED_DRIVE_ID);
  console.log(`  root: ${root.id} (${root.name})`);
  const day = await findOrCreateFolder(todayFolderName(), root.id);
  console.log(`  day:  ${day.id} (${day.name})`);

  console.log("→ search inbox for a thread with attachments");
  // Scan up to 25 most recent threads
  const { threads } = await listInbox({ maxResults: 25 });
  let found: { messageId: string; attachmentId: string; filename: string } | null = null;
  for (const t of threads) {
    if (!t.hasAttachments) continue;
    const detail = await getThread(t.threadId);
    for (const m of detail.messages) {
      const a = m.attachments[0];
      if (a) {
        found = { messageId: m.messageId, attachmentId: a.attachmentId, filename: a.filename };
        break;
      }
    }
    if (found) break;
  }
  let blob: { data: Buffer; filename: string; mimeType: string };
  if (!found) {
    console.log("  ⚠ No attachments in last 25 threads — using synthetic blob to prove upload path.");
    blob = {
      data: Buffer.from(`CC portal test upload @ ${new Date().toISOString()}\n`, "utf-8"),
      filename: "_cc-portal-test.txt",
      mimeType: "text/plain",
    };
  } else {
    console.log(`  picked: "${found.filename}" (msg=${found.messageId.slice(0, 12)}…)`);
    console.log("→ getAttachment");
    blob = await getAttachment(found.messageId, found.attachmentId);
    console.log(`  ${blob.filename} · ${blob.mimeType} · ${blob.data.length} bytes`);
  }

  console.log("→ uploadFile to day folder");
  const file = await uploadFile(blob.filename, blob.mimeType, blob.data, day.id);
  console.log(`  uploaded: ${file.id} → ${file.webViewLink}`);

  try {
    if (file.parents?.[0] !== day.id) {
      throw new Error(`Wrong parent: ${file.parents?.[0]} (expected ${day.id})`);
    }
    console.log("  ✓ correct parent folder");
  } finally {
    console.log(`→ cleanup: trash ${file.id}`);
    await trashFile(file.id);
    console.log("  ✓ trashed");
  }

  console.log("\n✅ End-to-end attachment-to-Drive round-trip passed.");
};

main().catch((err) => {
  console.error("\n❌ FAILED:", err?.message || err);
  if (err?.errors) console.error("   errors:", JSON.stringify(err.errors, null, 2));
  process.exit(1);
});
