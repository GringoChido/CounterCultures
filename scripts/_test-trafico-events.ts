/**
 * Round-trip test: appendTraficoEvent writes a row, getTraficoEvents
 * reads it back. Leaves one __TEST__ row in the sheet (cleanup is non-
 * trivial without a row-by-ID delete helper; acceptable for v1).
 *
 * Run: npx tsx scripts/_test-trafico-events.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

const main = async () => {
  const { appendTraficoEvent, getTraficoEvents } = await import(
    "../app/lib/trafico-events"
  );

  console.log("→ appendTraficoEvent");
  const written = await appendTraficoEvent({
    trafico_id: "__TEST__",
    actor: "test-script",
    event_type: "note_added",
    message: `superpowers W5 test @ ${new Date().toISOString()}`,
  });
  console.log(`  wrote event ${written.event_id}`);

  console.log("→ getTraficoEvents('__TEST__')");
  const back = await getTraficoEvents("__TEST__");
  const found = back.find((e) => e.event_id === written.event_id);
  if (!found) throw new Error("Round-trip read missed the new event");

  // Validate every column round-tripped
  const fieldsToCheck: (keyof typeof written)[] = [
    "event_id",
    "trafico_id",
    "timestamp",
    "actor",
    "event_type",
    "message",
  ];
  for (const k of fieldsToCheck) {
    if (found[k] !== written[k]) {
      throw new Error(`Column ${k} mismatch: wrote=${JSON.stringify(written[k])} read=${JSON.stringify(found[k])}`);
    }
  }
  console.log(`  ✓ event present with all ${fieldsToCheck.length} fields matching`);

  console.log("→ getTraficoEvents() — full table read");
  const all = await getTraficoEvents();
  if (!Array.isArray(all)) throw new Error("getTraficoEvents() not an array");
  console.log(`  ✓ ${all.length} total events in Trafico_Events`);

  console.log(
    "\n✅ Trafico_Events round-trip OK. (one __TEST__ row left in the sheet — cleanup is a separate concern.)"
  );
};

main().catch((e) => {
  console.error("\n❌ FAILED:", e?.message || e);
  process.exit(1);
});
