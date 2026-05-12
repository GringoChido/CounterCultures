import { getProductContent, hasRichContent } from "../../app/lib/product-content";
import { promises as fs } from "node:fs";
import * as path from "node:path";

const main = async () => {
  // Load all content and pick the top 3 with both ES desc + gallery for verification.
  const pc = JSON.parse(await fs.readFile(path.join(__dirname, "..", "..", "app", "lib", "product-content.json"), "utf-8"));
  const rich = Object.entries(pc as Record<string, any>)
    .filter(([, v]) => v.descriptionEs && (v.gallery?.length ?? 0) > 0)
    .slice(0, 3);
  if (!rich.length) { console.log("No fully-rich product yet."); return; }
  for (const [id, _] of rich) {
    const c = getProductContent(id);
    console.log(`\n── ${id} ──`);
    console.log(`hasRichContent: ${hasRichContent(id)}`);
    console.log(`title: ${c?.title}`);
    console.log(`descriptionEs[0..120]: ${c?.descriptionEs?.slice(0, 120)}…`);
    console.log(`features: ${c?.features?.length} bullets`);
    console.log(`gallery: ${c?.gallery?.slice(0, 3).join(", ")}`);
    console.log(`variants: ${c?.variants?.join(", ") || "(none)"}`);
    console.log(`specSheet: ${c?.specSheetUrl ?? "(none)"}`);
    console.log(`price: ${c?.price ?? "(none)"} ${c?.priceFrom ? "(from)" : ""}`);
    console.log(`matchConfidence: ${c?.matchConfidence}`);
  }
};

main().catch(console.error);
