/**
 * Playwright hero extraction for Batch 8.
 * Usage: npx tsx scripts/extract-brand-heroes-batch8.ts
 */

import { chromium } from "playwright";

const TARGETS = [
  // Known redirects / alternate domains
  { slug: "bereson",           urls: ["https://www.berensonhardware.com/"] },
  { slug: "sietto",            urls: ["https://www.sietto.com/"] },
  // Budget / value faucet brands
  { slug: "miseno",            urls: ["https://www.miseno.com/"] },
  { slug: "peerless",          urls: ["https://www.peerlessfaucet.com/"] },
  { slug: "gerber",            urls: ["https://www.gerberplumbing.com/"] },
  { slug: "mansfield",         urls: ["https://www.mansfieldplumbing.com/"] },
  { slug: "sloan",             urls: ["https://www.sloan.com/"] },
  { slug: "zurn",              urls: ["https://www.zurn.com/"] },
  // Tile / stone
  { slug: "merola-tile",       urls: ["https://www.merolatile.com/"] },
  { slug: "original-mission-tile", urls: ["https://www.originalmissiontile.com/"] },
  { slug: "cruz-bay-studio",   urls: ["https://cruzbaystudio.com/"] },
  { slug: "sukabumi-stone-mexico", urls: ["https://sukabumistonemexico.com/", "https://www.sukabumistonemexico.com/"] },
  // Shower / spa
  { slug: "pulse",             urls: ["https://pulseshowerspas.com/"] },
  { slug: "transolid",         urls: ["https://www.transolid.com/"] },
  { slug: "avano",             urls: ["https://www.avano.com/", "https://avano.com/"] },
  { slug: "eago",              urls: ["https://www.eago.com/"] },
  { slug: "a-and-e-bath-and-shower", urls: ["https://www.aandbaths.com/", "https://aandbath.com/"] },
  // Hardware niche
  { slug: "ageless-iron",      urls: ["https://www.agelessiron.com/"] },
  { slug: "colonial-bronze",   urls: ["https://www.colonial-bronze.com/", "https://colonialbrz.com/"] },
  { slug: "classic-brass",     urls: ["https://www.classicbrassinc.com/", "https://classicbrass.com/"] },
  { slug: "amba-products",     urls: ["https://ambaproducts.com/"] },
  { slug: "belwith-products",  urls: ["https://www.belwith.com/", "https://www.belwith-keeler.com/"] },
  { slug: "alno",              urls: ["https://alno.com/en/", "https://www.alno.com/"] },
  { slug: "idh-st-simons",     urls: ["https://idhinc.com/"] },
  { slug: "elkay",             urls: ["https://www.elkay.com/us/en/products/sinks.html"] },
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
      await page.waitForTimeout(5000);
      await page.evaluate(() => window.scrollTo(0, 1200));
      await page.waitForTimeout(2000);

      const og = await page.$eval('meta[property="og:image"]', el => (el as HTMLMetaElement).content).catch(() => null);

      const imgs = await page.evaluate(() =>
        Array.from(document.querySelectorAll("img"))
          .filter(img => img.naturalWidth >= 800)
          .sort((a, b) => b.naturalWidth - a.naturalWidth)
          .slice(0, 5)
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
      process.stdout.write(` ERR(${(e as Error).message.split("\n")[0].substring(0, 40)})`);
    }
  }
  await browser.close();
  return best;
}

async function main() {
  console.log(`=== Batch 8 Playwright Extraction (${toRun.length} brands) ===\n`);

  for (const t of toRun) {
    process.stdout.write(`${t.slug.padEnd(26)}... `);
    const r = await extract(t.slug, t.urls);

    if (!r) { console.log("BLOCKED"); continue; }

    const topImg = r.imgs[0];
    const topBg = r.bgs[0];

    if (r.og && !r.og.includes("logo") && !r.og.endsWith(".svg") && !r.og.includes("favicon")) {
      console.log(`OG   ${r.og.substring(0, 100)}`);
    } else if (topImg && topImg.w >= 1200 && !topImg.src.includes("cookie") && !topImg.src.includes("logo")) {
      console.log(`IMG  ${topImg.w}x${topImg.h}  ${topImg.src.substring(0, 90)}`);
      if (r.imgs[1] && r.imgs[1].w >= 1000) console.log(`     also: ${r.imgs[1].w}x${r.imgs[1].h}  ${r.imgs[1].src.substring(0, 80)}`);
    } else if (topBg) {
      console.log(`BG   ${topBg.substring(0, 100)}`);
    } else {
      console.log(`NOTHING good (best img: ${topImg ? topImg.w + "w" : "none"})`);
      r.imgs.slice(0, 2).forEach(i => console.log(`     ${i.w}x${i.h}  ${i.src.substring(0, 80)}`));
    }
  }

  console.log("\n=== Done ===");
}

main();
