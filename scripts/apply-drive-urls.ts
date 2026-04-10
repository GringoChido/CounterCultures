/**
 * Reads drive-image-mapping.json and updates SAMPLE_PRODUCTS image paths
 * in constants.ts to use Google Drive URLs, then repopulates the Google Sheet.
 *
 * Usage:
 *   npx tsx scripts/apply-drive-urls.ts
 *
 * Run AFTER upload-images-to-drive.ts completes.
 */

import * as fs from "fs";
import * as path from "path";

const MAPPING_FILE = path.resolve("scripts/drive-image-mapping.json");
const CONSTANTS_FILE = path.resolve("app/lib/constants.ts");

if (!fs.existsSync(MAPPING_FILE)) {
  console.error("❌ drive-image-mapping.json not found. Run upload-images-to-drive.ts first.");
  process.exit(1);
}

const mapping: Record<string, string> = JSON.parse(
  fs.readFileSync(MAPPING_FILE, "utf-8")
);

console.log(`📄 Loaded ${Object.keys(mapping).length} image mappings`);

// Read constants.ts
let constants = fs.readFileSync(CONSTANTS_FILE, "utf-8");

let replaced = 0;
for (const [localPath, driveUrl] of Object.entries(mapping)) {
  // localPath is like "/products/bano/lavabos/foo.jpg"
  // In constants.ts, image field might be a CDN URL or a local path
  // We need to find products whose local image path matches and replace with Drive URL
  if (constants.includes(`"${localPath}"`)) {
    constants = constants.replaceAll(`"${localPath}"`, `"${driveUrl}"`);
    replaced++;
  }
}

fs.writeFileSync(CONSTANTS_FILE, constants);
console.log(`✅ Replaced ${replaced} image paths in constants.ts with Drive URLs`);
console.log(`\n💡 Now run: npx tsx scripts/populate-sheet.ts to push to Google Sheet`);
