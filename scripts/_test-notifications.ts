/**
 * Round-trip test: appendNotification → listNotifications → ackNotification.
 * Leaves a __TEST__-prefixed row in the sheet (cleanup is non-trivial without
 * a row-by-ID delete helper; acceptable for a __TEST__ tag — easy to filter
 * out manually).
 *
 * Run: npx tsx scripts/_test-notifications.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

const main = async () => {
  const { appendNotification, listNotifications, ackNotification } = await import(
    "../app/lib/notifications"
  );

  const testId = `__TEST__-${Date.now()}`;
  console.log(`→ appendNotification (${testId})`);
  const written = await appendNotification({
    notification_id: testId,
    severity: "high",
    audience: "roger",
    title: "Test notification from round-trip script",
    body: `created at ${new Date().toISOString()}`,
    source_entity_type: "trafico",
    source_entity_id: "__TEST__",
  });
  if (written.notification_id !== testId)
    throw new Error(`notification_id mismatch: wrote=${testId} got=${written.notification_id}`);
  if (written.status !== "unread")
    throw new Error(`default status should be 'unread', got ${written.status}`);
  console.log(`  ✓ wrote with status=${written.status}`);

  console.log("→ appendNotification (same ID) — should be a no-op upsert");
  const upsert = await appendNotification({
    notification_id: testId,
    severity: "critical",
    audience: "roger",
    title: "DIFFERENT TITLE — should be ignored",
    body: "should not overwrite",
    source_entity_type: "trafico",
    source_entity_id: "__TEST__",
  });
  if (upsert.title === "DIFFERENT TITLE — should be ignored")
    throw new Error("upsert overwrote existing row — dedupe broken");
  console.log("  ✓ deterministic-ID dedupe works");

  console.log("→ listNotifications({ status: 'unread' })");
  const unread = await listNotifications({ status: "unread" });
  const found = unread.find((n) => n.notification_id === testId);
  if (!found) throw new Error(`round-trip read missed ${testId}`);
  console.log(`  ✓ found in ${unread.length} unread`);

  console.log("→ listNotifications({ source: 'trafico' })");
  const traficoOnly = await listNotifications({ source: "trafico" });
  if (!traficoOnly.find((n) => n.notification_id === testId))
    throw new Error("source filter missed test row");
  if (traficoOnly.find((n) => n.source_entity_type !== "trafico"))
    throw new Error("source filter let through wrong type");
  console.log(`  ✓ source filter returned ${traficoOnly.length} trafico rows`);

  console.log(`→ ackNotification(${testId})`);
  await ackNotification(testId);

  console.log("→ listNotifications({ status: 'unread' }) — should NOT include testId");
  const after = await listNotifications({ status: "unread" });
  if (after.find((n) => n.notification_id === testId))
    throw new Error("ack did not flip status");
  console.log(`  ✓ ack flipped status correctly`);

  console.log("→ listNotifications({ status: 'acked' }) — should include testId");
  const acked = await listNotifications({ status: "acked" });
  const ackedRow = acked.find((n) => n.notification_id === testId);
  if (!ackedRow) throw new Error("acked row missing from acked list");
  if (!ackedRow.acked_at) throw new Error("acked_at should be set after ack");
  console.log(`  ✓ acked_at = ${ackedRow.acked_at}`);

  console.log("\n✅ Notifications round-trip OK");
};

main().catch((e) => {
  console.error("\n❌ FAILED:", e?.message || e);
  process.exit(1);
});
