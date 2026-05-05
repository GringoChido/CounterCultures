/**
 * Processes brand hero images from public/Assets/BRANDS/staging/ → public/Assets/BRANDS/<slug>-hero.webp
 *
 * Pipeline per file:
 *   1. Read raw image (jpg/jpeg/png/webp)
 *   2. Resize to max 1600px wide (keeps aspect, never upscales)
 *   3. Convert to WebP at quality 82
 *   4. Write to public/Assets/BRANDS/<slug>-hero.webp
 *   5. Log dimensions + file size
 *
 * Card-spec match (from app/[locale]/brands/brands-grid.tsx):
 *   - Card container: h-44/h-48 (176-192px tall) with `fill` + `object-cover`, sizes="25vw on lg"
 *   - 1600w source covers Retina 2x at every breakpoint without pixelation.
 *   - Flagship cards (h-52/h-64, 50vw) also covered.
 *
 * Usage:
 *   npx tsx scripts/process-brand-heroes-batch2.ts
 *
 * Optional: --slug=<slug> to process only one brand
 * Optional: --quality=<n> to override q82 (range 60-90)
 */

import * as fs from "fs";
import * as path from "path";
import sharp from "sharp";

const STAGING = path.resolve(process.cwd(), "public/Assets/BRANDS/staging");
const OUT_DIR = path.resolve(process.cwd(), "public/Assets/BRANDS");
const TARGET_WIDTH = 1600;

const argSlug = process.argv.find((a) => a.startsWith("--slug="))?.split("=")[1];
const argQuality = Number(
  process.argv.find((a) => a.startsWith("--quality="))?.split("=")[1] || 82
);

if (!fs.existsSync(STAGING)) {
  console.error(`ERR  Staging dir missing: ${STAGING}`);
  console.error(`     Run scripts/download-brand-heroes-batch2.sh first, or drop manual images into that dir.`);
  process.exit(1);
}

const VALID_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

const files = fs
  .readdirSync(STAGING)
  .filter((f) => VALID_EXTS.has(path.extname(f).toLowerCase()))
  .filter((f) => /-hero\./i.test(f))
  .filter((f) => !argSlug || f.startsWith(`${argSlug}-hero.`));

if (files.length === 0) {
  console.error(`ERR  No matching files in ${STAGING}`);
  console.error(`     Files must be named "<slug>-hero.<jpg|png|webp>"`);
  process.exit(1);
}

async function main() {
  console.log(`=== Processing ${files.length} brand hero(es) → ${OUT_DIR} ===\n`);

  let ok = 0;
  let fail = 0;

  for (const file of files) {
    const slug = file.replace(/-hero\..+$/i, "");
    const inPath = path.join(STAGING, file);
    const outPath = path.join(OUT_DIR, `${slug}-hero.webp`);

    try {
      const meta = await sharp(inPath).metadata();
      const inputWidth = meta.width || 0;
      const inputHeight = meta.height || 0;

      if (inputWidth < 800) {
        console.warn(`WARN ${slug.padEnd(28)} input only ${inputWidth}w — output will be soft on Retina.`);
      }

      const resizeWidth = Math.min(inputWidth, TARGET_WIDTH);

      await sharp(inPath)
        .resize({
          width: resizeWidth,
          withoutEnlargement: true,
          fit: "inside",
        })
        .webp({ quality: argQuality, effort: 5 })
        .toFile(outPath);

      const outStat = fs.statSync(outPath);
      const outMeta = await sharp(outPath).metadata();

      console.log(
        `OK   ${slug.padEnd(28)} ${(inputWidth + "x" + inputHeight).padEnd(11)} → ${(outMeta.width + "x" + outMeta.height).padEnd(11)} ${(Math.round(outStat.size / 1024) + "KB").padStart(7)}`
      );
      ok++;
    } catch (err) {
      console.error(`FAIL ${slug.padEnd(28)} ${(err as Error).message}`);
      fail++;
    }
  }

  console.log(`\n=== Done. ${ok} ok, ${fail} fail. ===`);

  if (ok > 0) {
    console.log(`\nNext: open app/[locale]/brands/page.tsx and add each new slug to PRE_STAGED_HEROES:`);
    for (const file of files) {
      const slug = file.replace(/-hero\..+$/i, "");
      const key = /^[a-z][a-z0-9-]*$/.test(slug) ? slug : `"${slug}"`;
      console.log(`  ${key}: "/Assets/BRANDS/${slug}-hero.webp",`);
    }
  }
}

main();
