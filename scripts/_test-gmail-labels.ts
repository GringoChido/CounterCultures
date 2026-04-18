/**
 * One-off test: prove the label two-way sync round-trip.
 *   1. Create test label "[CC-portal-test]" in Gmail
 *   2. List labels → confirm it shows up via our lib
 *   3. Apply it to the most recent inbox thread via our lib
 *   4. Re-fetch thread → confirm labelIds includes our new label
 *   5. Remove it via our lib
 *   6. Delete the label from Gmail
 *
 * Run: npx tsx scripts/_test-gmail-labels.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

const TEST_LABEL_NAME = "[CC-portal-test]";

const main = async () => {
  // Dynamic imports — ensure dotenv config runs before the lib reads
  // process.env.GOOGLE_SHEETS_ID (captured at module-load time).
  const { getActiveToken } = await import("../app/lib/gmail-tokens");
  const { listLabels, modifyThreadLabels, getGmailClient, listInbox, getThread } = await import(
    "../app/lib/gmail"
  );
  console.log("→ getActiveToken");
  const token = await getActiveToken();
  if (!token) throw new Error("No active Gmail token. Connect Gmail first.");
  console.log(`  user: ${token.gmailAddress}`);

  console.log("→ getGmailClient");
  const client = await getGmailClient();
  if (!client) throw new Error("getGmailClient returned null");
  const gmail = client.gmail;

  // 1. Create test label
  console.log(`→ create label "${TEST_LABEL_NAME}"`);
  const create = await gmail.users.labels.create({
    userId: "me",
    requestBody: {
      name: TEST_LABEL_NAME,
      labelListVisibility: "labelShow",
      messageListVisibility: "show",
    },
  });
  const labelId = create.data.id!;
  console.log(`  created: ${labelId}`);

  try {
    // 2. listLabels via lib → confirm visible
    const labels = await listLabels();
    const found = labels.find((l) => l.id === labelId);
    if (!found) throw new Error("label not in listLabels()");
    console.log(`  ✓ listLabels() returns "${found.name}"`);

    // 3. Pick a recent inbox thread
    const { threads } = await listInbox({ maxResults: 1 });
    if (threads.length === 0) throw new Error("no inbox threads to test against");
    const threadId = threads[0].threadId;
    console.log(`→ apply to thread ${threadId} ("${threads[0].subject.slice(0, 40)}")`);
    const applied = await modifyThreadLabels(threadId, { add: [labelId] });
    if (!applied.includes(labelId)) throw new Error(`apply failed: returned ${JSON.stringify(applied)}`);
    console.log(`  ✓ applied — thread now has ${applied.length} labels`);

    // 4. Re-fetch thread
    const detail = await getThread(threadId);
    const allMsgLabels = new Set(detail.messages.flatMap((m) => m.labelIds));
    if (!allMsgLabels.has(labelId)) throw new Error("re-fetch missing the new label");
    console.log(`  ✓ re-fetch sees new label on thread`);

    // 5. Remove
    const removed = await modifyThreadLabels(threadId, { remove: [labelId] });
    if (removed.includes(labelId)) throw new Error(`remove failed: still in ${JSON.stringify(removed)}`);
    console.log(`  ✓ removed — thread back to ${removed.length} labels`);
  } finally {
    // 6. Cleanup — delete the test label so we leave Gmail clean
    console.log(`→ delete label ${labelId}`);
    await gmail.users.labels.delete({ userId: "me", id: labelId });
    console.log("  ✓ deleted");
  }

  console.log("\n✅ All round-trip checks passed.");
};

main().catch((err) => {
  console.error("\n❌ FAILED:", err);
  process.exit(1);
});
