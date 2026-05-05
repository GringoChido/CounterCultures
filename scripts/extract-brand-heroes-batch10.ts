/**
 * Playwright hero extraction for Batch 10 — final push on untried brands.
 * Usage: npx tsx scripts/extract-brand-heroes-batch10.ts
 */

import { chromium } from "playwright";

const TARGETS = [
  // Untried brands
  { slug: "design-house",      urls: ["https://www.designhouseusa.com/", "https://designhouse.com/"] },
  { slug: "sterling",          urls: ["https://www.sterlingplumbing.com/", "https://www.sterlingbath.com/"] },
  { slug: "blaze-products",    urls: ["https://www.blazegrills.com/", "https://blazegrills.com/outdoor-kitchens/"] },
  { slug: "jason",             urls: ["https://www.jasoninternational.com/"] },
  { slug: "r-and-t",           urls: ["https://www.r-and-t.us/", "https://r-t.us/"] },
  { slug: "ackland",           urls: ["https://www.acklandhardware.com/", "https://ackland.com/"] },
  // Retry with different pages
  { slug: "sigma",             urls: ["https://www.sigmatactical.com/", "https://sigmafaucet.com/"] },
  { slug: "peerless",          urls: ["https://www.peerlessfaucet.com/kitchen/", "https://www.peerlessfaucet.com/bathroom/"] },
  { slug: "merola-tile",       urls: ["https://merolatile.com/collections/"] },
  { slug: "richelieu",         urls: ["https://www.richelieu.com/us/en/catalog/inspiration/"] },
  { slug: "samsung",           urls: ["https://www.samsung.com/us/home-appliances/refrigerators/"] },
  // Hardware niche retry
  { slug: "du-verre",          urls: ["https://www.topknobs.com/duverre"] },
  { slug: "fortis",            urls: ["https://www.fortislocksandlevers.com/", "https://fortishardware.com/collections/"] },
  { slug: "alno",              urls: ["https://alno.com/en-gb/"] },
  { slug: "altair",            urls: ["https://www.altairplumbingfittings.com/", "https://altairfixtures.com/"] },
  // Value brands new attempt
  { slug: "proflo",            urls: ["https://www.build.com/proflo/c131168"] },
  { slug: "gerber",            urls: ["https://www.gerber-online.com/", "https://www.globeuniongroup.com/brands/gerber/"] },
  { slug: "windom-bay",        urls: ["https://www.windom-bay.com/", "https://windombay.com/"] },
  { slug: "bereson",           urls: ["https://www.berensonhardware.com/catalog/"] },
  // Tile brands new attempt
  { slug: "bedrosians",        urls: ["https://www.bedrosians.com/en/tile/floor/"] },
  // More new attempts
  { slug: "kwc",               urls: ["https://www.kwc.com/"] },
  { slug: "rubinet",           urls: ["https://www.rubinet.com/collection/"] },
  { slug: "miseno",            urls: ["https://www.miseno.com/faucets/"] },
  { slug: "nameeks",           urls: ["https://www.nameeks.com/en-us/"] },
  { slug: "sloan",             urls: ["https://www.sloan.com/case-studies/"] },
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
  console.log(`=== Batch 10 Playwright Extraction (${toRun.length} brands) ===\n`);

  for (const t of toRun) {
    process.stdout.write(`${t.slug.padEnd(26)}... `);
    const r = await extract(t.slug, t.urls);

    if (!r) { console.log("BLOCKED"); continue; }

    const topImg = r.imgs[0];
    const topBg = r.bgs[0];

    if (r.og && !r.og.includes("logo") && !r.og.endsWith(".svg") && !r.og.includes("favicon") && !r.og.includes("Logo")) {
      console.log(`OG   ${r.og.substring(0, 100)}`);
    } else if (topImg && topImg.w >= 1200 && !topImg.src.includes("cookie") && !topImg.src.includes("logo") && !topImg.src.includes("Logo")) {
      console.log(`IMG  ${topImg.w}x${topImg.h}  ${topImg.src.substring(0, 90)}`);
      if (r.imgs[1] && r.imgs[1].w >= 1000) console.log(`     also: ${r.imgs[1].w}x${r.imgs[1].h}  ${r.imgs[1].src.substring(0, 80)}`);
    } else if (topBg && !topBg.includes("logo") && !topBg.includes(".gif")) {
      console.log(`BG   ${topBg.substring(0, 100)}`);
    } else {
      console.log(`NOTHING good (best img: ${topImg ? topImg.w + "w" : "none"})`);
      if (topImg) console.log(`     ${topImg.w}x${topImg.h}  ${topImg.src.substring(0, 80)}`);
    }
  }

  console.log("\n=== Done ===");
}

main();
