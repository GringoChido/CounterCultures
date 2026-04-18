import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

const main = async () => {
  const { getTraficoEvents } = await import("../app/lib/trafico-events");
  const all = await getTraficoEvents();
  console.log(`total events: ${all.length}`);
  const recent = all.filter((e) => e.trafico_id.includes("CC-TRF-TEST-"));
  console.log(`test events: ${recent.length}`);
  for (const e of recent) {
    console.log(`  ${e.event_id} | ${e.trafico_id} | ${e.event_type} | ${e.from_status} → ${e.to_status} | ${e.message}`);
  }
};

main().catch((e) => { console.error(e); process.exit(1); });
