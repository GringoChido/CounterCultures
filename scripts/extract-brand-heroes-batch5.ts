/**
 * Playwright hero extraction for Batch 5 — 25 priority brands.
 * Usage: npx tsx scripts/extract-brand-heroes-batch5.ts
 * Optional: --slug=<slug> to test a single brand
 */

import { chromium } from "playwright";

const TARGETS = [
  { slug: "moen",              urls: ["https://www.moen.com/"] },
  { slug: "pfister",           urls: ["https://www.pfisterfaucets.com/"] },
  { slug: "signature-hardware", urls: ["https://www.signaturehardware.com/"] },
  { slug: "elkay",             urls: ["https://www.elkay.com/"] },
  { slug: "watermark",         urls: ["https://www.watermark-designs.com/"] },
  { slug: "waterstone",        urls: ["https://waterstoneco.com/"] },
  { slug: "lacava",            urls: ["https://lacava.com/"] },
  { slug: "franke",            urls: ["https://www.frankeksd.com/"] },
  { slug: "houzer",            urls: ["https://www.houzer.com/"] },
  { slug: "ariel",             urls: ["https://www.arielusa.com/"] },
  { slug: "ws-bath-collections", urls: ["https://www.wsbath.com/"] },
  { slug: "whitehaus",         urls: ["https://www.whitehausonline.com/"] },
  { slug: "maax",              urls: ["https://www.maax.com/en-us/"] },
  { slug: "ashley-norton",     urls: ["https://www.ashleynorton.com/inspiration/"] },
  { slug: "amerock",           urls: ["https://www.amerock.com/"] },
  { slug: "jeffrey-alexander", urls: ["https://www.jeffrey-alexander.com/"] },
  { slug: "liberty-hardware",  urls: ["https://www.libertyhardware.com/"] },
  { slug: "hafele",            urls: ["https://www.hafele.com/us/en/"] },
  { slug: "nameeks",           urls: ["https://www.nameeks.com/"] },
  { slug: "ageless-iron",      urls: ["https://www.agelessiron.com/"] },
  { slug: "du-verre",          urls: ["https://www.duverre.com/"] },
  { slug: "rusticware",        urls: ["https://www.rusticware.com/"] },
  { slug: "bedrosians",        urls: ["https://www.bedrosians.com/"] },
  { slug: "marazzi",           urls: ["https://www.marazzitile.com/"] },
  { slug: "emser-tile",        urls: ["https://www.emser.com/"] },
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
  console.log(`=== Batch 5 Playwright Extraction (${toRun.length} brands) ===\n`);

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
