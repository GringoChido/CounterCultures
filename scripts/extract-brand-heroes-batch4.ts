/**
 * Playwright hero extraction for Batch 4 — 20 priority brands.
 * Usage: npx tsx scripts/extract-brand-heroes-batch4.ts
 * Optional: --slug=<slug> to test a single brand
 */

import { chromium } from "playwright";

const TARGETS = [
  { slug: "kingston-brass",     urls: ["https://www.kingstonbrass.com/"] },
  { slug: "anzzi",              urls: ["https://anzzi.com/"] },
  { slug: "swiss-madison",      urls: ["https://swiss-madison.com/"] },
  { slug: "ruvati",             urls: ["https://ruvati.com/"] },
  { slug: "dreamline",          urls: ["https://www.dreamline.com/"] },
  { slug: "ariel",              urls: ["https://www.arielusa.com/", "https://arielusa.com/"] },
  { slug: "dxv",                urls: ["https://www.dxv.com/"] },
  { slug: "elkay",              urls: ["https://www.elkay.com/", "https://elkay.com/inspiration"] },
  { slug: "franke",             urls: ["https://www.franke.com/us/en/hk.html", "https://www.frankeksd.com/"] },
  { slug: "houzer",             urls: ["https://www.houzer.com/"] },
  { slug: "infinity-drain",     urls: ["https://www.infinitydrain.com/"] },
  { slug: "alape",              urls: ["https://www.alape.com/en-us/"] },
  { slug: "linkasink",          urls: ["https://www.linkasink.com/"] },
  { slug: "ashley-norton",      urls: ["https://www.ashleynorton.com/inspiration/"] },
  { slug: "maax",               urls: ["https://www.maax.com/en-us/"] },
  { slug: "speakman",           urls: ["https://www.speakman.com/"] },
  { slug: "samsung",            urls: ["https://www.samsung.com/us/home-appliances/"] },
  { slug: "lacava",             urls: ["https://lacava.com/"] },
  { slug: "franke",             urls: ["https://www.frankeksd.com/"] },
  { slug: "ove-decors",         urls: ["https://ovedecors.com/"] },
];

// Deduplicate slugs
const seen = new Set<string>();
const targets = TARGETS.filter(t => {
  if (seen.has(t.slug)) return false;
  seen.add(t.slug);
  return true;
});

const argSlug = process.argv.find(a => a.startsWith("--slug="))?.split("=")[1];
const toRun = argSlug ? targets.filter(t => t.slug === argSlug) : targets;

async function extract(slug: string, urls: string[]) {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  });

  let best: { url: string; og: string | null; imgs: any[]; bgs: string[] } | null = null;

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
  console.log(`=== Batch 4 Playwright Extraction (${toRun.length} brands) ===\n`);

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
