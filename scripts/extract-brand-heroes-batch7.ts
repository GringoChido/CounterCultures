/**
 * Playwright hero extraction for Batch 7.
 * Usage: npx tsx scripts/extract-brand-heroes-batch7.ts
 */

import { chromium } from "playwright";

const TARGETS = [
  // Cabinet / decorative hardware
  { slug: "amerock",           urls: ["https://www.amerock.com/"] }, // already done
  { slug: "crown-cabinet-hardware", urls: ["https://www.crowncabinethardware.com/"] },
  { slug: "omnia",             urls: ["https://omniaindustries.com/"] },
  { slug: "hardware-resources",urls: ["https://www.hardwareresources.com/"] },
  { slug: "designperfect",     urls: ["https://www.designperfect.com/"] },
  { slug: "sugatsune",         urls: ["https://www.sugatsune.com/"] },
  { slug: "linnea",            urls: ["https://www.linnea.com/"] },
  { slug: "rk-international",  urls: ["https://www.rkinternational.com/"] },
  { slug: "manzoni",           urls: ["https://manzoniusa.com/", "https://www.manzoni.com/"] },
  { slug: "keeler",            urls: ["https://www.keelerhardware.com/", "https://www.keeler.co.uk/"] },
  // Door / lock hardware
  { slug: "grandeur",          urls: ["https://grandeurhardware.com/", "https://www.grandeurhardware.com/"] },
  { slug: "deltana",           urls: ["https://www.deltana.net/"] },
  { slug: "delaney",           urls: ["https://www.delaneyharco.com/", "https://delaneyharco.com/"] },
  { slug: "pamex",             urls: ["https://www.pamex.com/"] },
  { slug: "r-christensen",     urls: ["https://www.rchristensen.com/"] },
  // Bathroom accessories / specialty
  { slug: "elements",          urls: ["https://www.elementsbyibathstore.com/", "https://elementslighting.com/"] },
  { slug: "ico-bath",          urls: ["https://icobath.com/"] },
  { slug: "quickdrain",        urls: ["https://quickdrainusa.com/"] },
  { slug: "nameeks",           urls: ["https://www.nameeks.com/"] },
  // Faucet / shower specialty
  { slug: "sigma",             urls: ["https://www.sigmaequipment.com/", "https://sigmafaucet.com/"] },
  { slug: "thermasol",         urls: ["https://www.thermasol.com/"] },
  { slug: "viega",             urls: ["https://www.viega.us/en/"] },
  { slug: "kwc",               urls: ["https://www.kwc.com/en/"] },
  // Sinks / plumbing
  { slug: "julien",            urls: ["https://www.julienmontreal.com/en/"] },
  { slug: "jsg-oceana",        urls: ["https://jsg-oceana.com/"] },
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
  console.log(`=== Batch 7 Playwright Extraction (${toRun.length} brands) ===\n`);

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
