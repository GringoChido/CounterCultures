/**
 * Playwright hero extraction for Batch 13 — newly discovered brands + retries.
 * Usage: npx tsx scripts/extract-brand-heroes-batch13.ts
 */

import { chromium } from "playwright";

const TARGETS = [
  // Alape — German luxury bath brand (sinks, basins)
  { slug: "alape",              urls: ["https://www.alape.com/en-gb/", "https://www.alape.com/", "https://alape.com/"] },
  // Alfi Brand — US contemporary bath fixtures
  { slug: "alfi-brand",         urls: ["https://www.alfibrand.com/", "https://alfibrand.com/", "https://www.alfibrand.com/collections/all"] },
  // Design Perfect — Canadian hardware brand
  { slug: "designperfect",      urls: ["https://www.designperfect.ca/", "https://designperfect.ca/", "https://www.designperfectcanada.com/"] },
  // Original Mission Tile — handcrafted tile
  { slug: "original-mission-tile", urls: ["https://www.originalmissiontile.com/", "https://originalmissiontile.com/", "https://www.missiontile.com/"] },
  // Pulse Shower Spas — try product pages (homepage OG was 210x210 icon)
  { slug: "pulse",              urls: ["https://www.pulseshowerspas.com/pages/showerspas/", "https://www.pulseshowerspas.com/collections/shower-spa-systems/"] },
  // Merola Tile — Spanish ceramics (got 404 HTML page before)
  { slug: "merola-tile",        urls: ["https://merolatile.com/", "https://www.merolatile.com/collections/"] },
  // Richelieu — try product category pages with portrait images
  { slug: "richelieu",          urls: [
    "https://www.richelieu.com/us/en/product-catalog/hardware-and-accessories/cabinet-and-door-hardware/knobs-and-pulls/",
    "https://www.richelieu.com/us/en/catalog/new/",
  ]},
  // Du Verre — artisan hardware; try Top Knobs parent site
  { slug: "du-verre",           urls: [
    "https://www.topknobs.com/top-knobs/du-verre",
    "https://www.topknobs.com/top-knobs/du-verre/du-verre-bar-hardware",
  ]},
  // KWC — Swiss kitchen faucets
  { slug: "kwc",                urls: ["https://www.kwc.com/int-en/", "https://www.kwc.com/us-en/", "https://www.kwc.com/"] },
  // Houzer — try category pages with actual product photography
  { slug: "houzer",             urls: ["https://www.houzer.com/collections/apron-front-sinks", "https://www.houzer.com/collections/prep-sinks"] },
];

const argSlug = process.argv.find(a => a.startsWith("--slug="))?.split("=")[1];
const toRun = argSlug ? TARGETS.filter(t => t.slug === argSlug) : TARGETS;

async function extract(slug: string, urls: string[]) {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  });

  let best: { url: string; og: string | null; imgs: { src: string; w: number; h: number }[]; bgs: string[] } | null = null;

  for (const url of urls) {
    const page = await ctx.newPage();
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 35000 });
      await page.waitForTimeout(7000);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 3));
      await page.waitForTimeout(3000);

      const og = await page.$eval('meta[property="og:image"]', el => (el as HTMLMetaElement).content).catch(() => null);

      const imgs = await page.evaluate(() =>
        Array.from(document.querySelectorAll("img"))
          .filter(img => img.naturalWidth >= 700 && img.src && img.src.length > 15)
          .sort((a, b) => b.naturalWidth - a.naturalWidth)
          .slice(0, 6)
          .map(img => ({ src: img.src, w: img.naturalWidth, h: img.naturalHeight }))
      );

      const bgs = await page.evaluate(() => {
        const u: string[] = [];
        document.querySelectorAll("*").forEach(el => {
          const bg = getComputedStyle(el).backgroundImage;
          if (bg && bg !== "none" && bg.startsWith("url(")) {
            const m = bg.match(/url\(["']?([^"')]+)["']?\)/);
            if (m?.[1] && !m[1].startsWith("data:") && !m[1].endsWith(".svg")) u.push(m[1]);
          }
        });
        return [...new Set(u)].slice(0, 6);
      });

      await page.close();
      if (og || imgs.length > 0 || bgs.length > 0) {
        best = { url, og, imgs, bgs };
        break;
      }
    } catch (e) {
      await page.close();
      process.stdout.write(` ERR(${(e as Error).message.split("\n")[0].substring(0, 50)})`);
    }
  }
  await browser.close();
  return best;
}

async function main() {
  console.log(`=== Batch 13 Playwright Extraction (${toRun.length} brands) ===\n`);

  for (const t of toRun) {
    process.stdout.write(`${t.slug.padEnd(26)}... `);
    const r = await extract(t.slug, t.urls);

    if (!r) { console.log("BLOCKED"); continue; }

    const topImg = r.imgs[0];
    const topBg = r.bgs[0];

    if (r.og && !r.og.includes("logo") && !r.og.includes("Logo") && !r.og.endsWith(".svg") && !r.og.includes("favicon") && !r.og.includes("icon")) {
      console.log(`OG   ${r.og}`);
    } else if (topImg && topImg.w >= 1200 && !topImg.src.includes("cookie") && !topImg.src.includes("logo") && !topImg.src.includes("Logo") && !topImg.src.includes("icon")) {
      console.log(`IMG  ${topImg.w}x${topImg.h}  ${topImg.src}`);
      if (r.imgs[1] && r.imgs[1].w >= 900) console.log(`     also: ${r.imgs[1].w}x${r.imgs[1].h}  ${r.imgs[1].src}`);
    } else if (topBg && !topBg.includes("logo") && !topBg.includes(".gif")) {
      console.log(`BG   ${topBg}`);
    } else {
      console.log(`NOTHING good (best: ${topImg ? topImg.w + "x" + topImg.h + " " + topImg.src.substring(0, 60) : "none"})`);
      r.imgs.slice(0, 3).forEach(i => console.log(`     ${i.w}x${i.h}  ${i.src}`));
      if (r.og) console.log(`     OG: ${r.og}`);
    }
  }

  console.log("\n=== Done ===");
}

main();
