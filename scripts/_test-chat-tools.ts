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

  // ───── start_new_trafico (CRM-UPDATE) ─────
  console.log("→ start_new_trafico (creates a stub)");
  const trfResult = await executeTool("start_new_trafico", {
    dealId: "__TEST_DEAL__",
  });
  if (trfResult.startsWith("✓ Trafico CC-TRF-")) {
    console.log(`  ✓ ${trfResult}`);
  } else {
    console.log(`  ✗ unexpected output: ${trfResult.slice(0, 200)}`);
    fail++;
  }

  // ───── update_lead_status (CRM-UPDATE) ─────
  // We don't have a known-existing lead to update without side-effects,
  // so call against a deliberately-missing ID and assert the not-found
  // path returns the right shape (proves the tool resolves correctly).
  console.log("→ update_lead_status (not-found path)");
  const leadResult = await executeTool("update_lead_status", {
    leadId: "LEAD-DOES-NOT-EXIST-__TEST__",
    newStatus: "qualified",
  });
  if (leadResult.includes("not found")) {
    console.log(`  ✓ correctly handled missing lead: ${leadResult}`);
  } else {
    console.log(`  ✗ expected 'not found', got: ${leadResult.slice(0, 200)}`);
    fail++;
  }

  // ───── update_deal_stage (CRM-UPDATE) — also not-found path ─────
  console.log("→ update_deal_stage (not-found path)");
  const dealResult = await executeTool("update_deal_stage", {
    dealId: "DEAL-DOES-NOT-EXIST-__TEST__",
    newStage: "design-scope",
  });
  if (dealResult.includes("not found")) {
    console.log(`  ✓ correctly handled missing deal: ${dealResult}`);
  } else {
    console.log(`  ✗ expected 'not found', got: ${dealResult.slice(0, 200)}`);
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
