/**
 * Round-trip test: each new chat tool's executeTool path returns the
 * expected shape. Tools that mutate state leave behind one __TEST__
 * row that's matchable by scripts/_cleanup-test-rows.ts (extended).
 *
 * Run: npx tsx scripts/_test-chat-tools.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

const main = async () => {
  const { executeTool } = await import("../app/lib/chat-tools");

  let fail = 0;

  // ───── add_note (LOG) ─────
  console.log("→ add_note");
  const noteResult = await executeTool("add_note", {
    entityType: "lead",
    entityId: "__TEST__",
    content: `superpowers v2 test @ ${new Date().toISOString()}`,
  });
  if (noteResult.startsWith("✓ Note ")) {
    console.log(`  ✓ ${noteResult}`);
  } else {
    console.log(`  ✗ unexpected output: ${noteResult.slice(0, 200)}`);
    fail++;
  }

  // ───── read_inbox (READ) ─────
  console.log("→ read_inbox (Gmail)");
  const inboxResult = await executeTool("read_inbox", { pageSize: 5 });
  if (
    inboxResult.includes("threads") ||
    inboxResult.includes("No threads") ||
    inboxResult.includes("Gmail isn't connected")
  ) {
    console.log(`  ✓ shape OK — ${inboxResult.slice(0, 80)}…`);
  } else {
    console.log(`  ✗ unexpected output: ${inboxResult.slice(0, 200)}`);
    fail++;
  }

  console.log(
    fail === 0
      ? "\n✅ All chat tools round-trip OK."
      : `\n❌ ${fail} failed`
  );
  process.exit(fail === 0 ? 0 : 1);
};

main().catch((e) => {
  console.error("\n❌ FAILED:", e?.message || e);
  process.exit(1);
});
