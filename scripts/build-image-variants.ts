import sharp from "sharp";
import { glob } from "glob";

const PATTERNS = [
  "public/images/**/*-hero.webp",
  "public/Assets/BRANDS/*.webp",
  "public/Assets/*Studio.webp",
  "public/Assets/Santa Clara del Cobre.webp",
  "public/Assets/Stone Artisans.webp",
  "public/Assets/home-hero/*.webp",
];

const AVIF_QUALITY = 65;

(async () => {
  let converted = 0;
  let skipped = 0;

  for (const pattern of PATTERNS) {
    const files = await glob(pattern);
    for (const file of files) {
      const out = file.replace(/\.webp$/, ".avif");
      try {
        await sharp(file).avif({ quality: AVIF_QUALITY }).toFile(out);
        converted++;
        console.log(`✔ ${file} → ${out}`);
      } catch (e) {
        console.error(`✗ ${file} failed:`, (e as Error).message);
        skipped++;
      }
    }
  }

  console.log(`\nDone: ${converted} converted, ${skipped} failed.`);
})();
