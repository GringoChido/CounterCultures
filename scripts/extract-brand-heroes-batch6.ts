/**
 * Playwright hero extraction for Batch 6 — 25 more brands.
 * Usage: npx tsx scripts/extract-brand-heroes-batch6.ts
 */

import { chromium } from "playwright";

const TARGETS = [
  // Hardware / cabinet brands
  { slug: "schaub-and-company", urls: ["https://www.schaub-and-company.com/"] },
  { slug: "hickory-hardware",   urls: ["https://www.hickoryhardware.com/"] },
  { slug: "richelieu",          urls: ["https://www.richelieu.com/us/en/"] },
  { slug: "franklin-brass",     urls: ["https://www.franklinbrass.com/"] },
  { slug: "acorn-manufacturing", urls: ["https://www.acornmfg.com/"] },
  { slug: "colonial-bronze",    urls: ["https://www.colonial-bronze.com/"] },
  { slug: "berenson",           urls: ["https://www.bereson.com/", "https://www.berenson.com/"] },
  { slug: "vesta-fine-hardware",urls: ["https://vestafinehardware.com/"] },
  { slug: "du-verre",           urls: ["https://www.duverre.com/"] },
  { slug: "hapny-home",         urls: ["https://hapnyhome.com/"] },
  // Faucet brands
  { slug: "kwc",                urls: ["https://www.kwc.com/en/"] },
  { slug: "rubinet",            urls: ["https://www.rubinet.com/"] },
  { slug: "santec",             urls: ["https://santecfaucet.com/"] },
  { slug: "symmons",            urls: ["https://www.symmons.com/"] },
  { slug: "chicago-faucets",    urls: ["https://www.chicagofaucets.com/"] },
  { slug: "jaclo",              urls: ["https://jaclo.com/"] },
  { slug: "central-brass",      urls: ["https://centralbrass.com/"] },
  // Bathroom / other brands
  { slug: "icera",              urls: ["https://iceracanada.com/", "https://www.iceracanada.com/"] },
  { slug: "ginger",             urls: ["https://www.gingerlighting.com/"] },
  { slug: "karran-usa",         urls: ["https://www.karran.com/"] },
  { slug: "alfi-brand",         urls: ["https://alfi-brand.com/", "https://www.alfi-brand.com/"] },
  { slug: "whitehaus",          urls: ["https://whitehausdesign.com/", "https://www.whitehausonline.com/", "https://whitehauscollection.com/"] },
  // Tile brands
  { slug: "shaw",               urls: ["https://www.shawtiles.com/"] },
  { slug: "bedrosians",         urls: ["https://www.bedrosians.com/"] },
  { slug: "marazzi",            urls: ["https://www.marazzi.us/", "https://us.marazzi.com/"] },
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
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 40000 });
      await page.waitForTimeout(6000);
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
  console.log(`=== Batch 6 Playwright Extraction (${toRun.length} brands) ===\n`);

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
