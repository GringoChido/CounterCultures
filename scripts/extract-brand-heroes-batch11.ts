/**
 * Playwright hero extraction for Batch 11 — second-attempt pass on brands
 * that either returned logos/nothing or were never tried with the right URL.
 * Usage: npx tsx scripts/extract-brand-heroes-batch11.ts
 */

import { chromium } from "playwright";

const TARGETS = [
  // Gerber plumbing (not gerber-online.com which SSL-fails)
  { slug: "gerber",           urls: ["https://www.gerberplumbing.com/", "https://www.gerber-online.com/products/"] },
  // Elkay sinks — JS-heavy but product pages load images
  { slug: "elkay",            urls: ["https://www.elkay.com/us/en/products/kitchen-sinks.html", "https://www.elkay.com/us/en/products.html", "https://www.elkay.com/us/en.html"] },
  // Franke — premium kitchen sinks
  { slug: "franke",           urls: ["https://www.franke.com/us/en/hk.html", "https://www.franke.com/us/en.html", "https://www.frankekitchensystems.us/"] },
  // Houzer stainless sinks
  { slug: "houzer",           urls: ["https://www.houzer.com/", "https://www.houzer.com/collections/all"] },
  // Nameeks — bath accessories
  { slug: "nameeks",          urls: ["https://www.nameeks.com/en-us/bathroom-accessories/", "https://www.nameeks.com/en-us/"] },
  // Bereson hardware — use homepage not catalog
  { slug: "bereson",          urls: ["https://www.berensonhardware.com/", "https://www.bereson.com/"] },
  // Sugatsune architectural hardware
  { slug: "sugatsune",        urls: ["https://www.sugatsune.com/", "https://www.sugatsune.com/products/"] },
  // Richelieu hardware — US product catalog
  { slug: "richelieu",        urls: ["https://www.richelieu.com/us/en/", "https://www.richelieu.com/us/en/catalog/"] },
  // Grandeur hardware — door hardware brand
  { slug: "grandeur",         urls: ["https://www.grandeurhardware.com/", "https://www.grandeurhardware.com/collections/door-knobs"] },
  // Du Verre hardware — artisan hardware
  { slug: "du-verre",         urls: ["https://www.duverre.com/", "https://www.duverre.com/collections/all"] },
  // Chicago Faucets — commercial/residential faucets
  { slug: "chicago-faucets",  urls: ["https://www.chicagofaucets.com/", "https://www.chicagofaucets.com/residential/"] },
  // Olympia Faucets — value faucets
  { slug: "olympia-faucets",  urls: ["https://www.olympiafaucets.com/", "https://www.olympiafaucets.com/collections/all"] },
  // Viega plumbing systems
  { slug: "viega",            urls: ["https://www.viega.us/", "https://www.viega.us/en/products.html"] },
  // Omnia hardware
  { slug: "omnia",            urls: ["https://www.omniahardware.com/", "https://www.omniahardware.com/collections/all"] },
  // Colonial Bronze — decorative hardware
  { slug: "colonial-bronze",  urls: ["https://www.colonial-bronze.com/", "https://colonial-bronze.com/collections/"] },
  // Central Brass plumbing
  { slug: "central-brass",    urls: ["https://www.centralbrass.com/", "https://centralbrass.com/"] },
  // Sterling (Kohler value line) — plumbing
  { slug: "sterling",         urls: ["https://www.sterlingplumbing.com/", "https://sterlingbath.com/"] },
  // Samsung appliances — try different hero URL pattern
  { slug: "samsung",          urls: ["https://www.samsung.com/us/home-appliances/", "https://www.samsung.com/us/home-appliances/refrigerators/french-door-refrigerators/"] },
  // Pioneer faucets — try official site (not aliexpress-linked)
  { slug: "pioneer-faucets",  urls: ["https://www.pioneerfaucets.com/faucets/", "https://www.pioneerfaucets.com/"] },
  // Miseno — try kitchen sinks page directly
  { slug: "miseno",           urls: ["https://www.miseno.com/kitchen/sinks/", "https://www.miseno.com/bath/faucets/"] },
  // Proflo — Ferguson value line
  { slug: "proflo",           urls: ["https://www.build.com/proflo/c131168", "https://www.ferguson.com/category/plumbing/_/N-zbq3Ztzu9s"] },
  // Jaclo plumbing — custom finishes
  { slug: "jaclo",            urls: ["https://www.jaclo.com/", "https://jaclo.com/collections/"] },
  // Ginger bath accessories
  { slug: "ginger",           urls: ["https://www.gingerco.com/", "https://www.gingerco.com/collections/"] },
  // Design House hardware
  { slug: "design-house",     urls: ["https://www.designhouseusa.com/", "https://www.designhouseproducts.com/"] },
  // Icera — bathroom fixtures
  { slug: "icera",            urls: ["https://www.icera.com/", "https://icera.com/products/"] },
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
      await page.waitForTimeout(6000);
      await page.evaluate(() => window.scrollTo(0, 1200));
      await page.waitForTimeout(2500);

      const og = await page.$eval('meta[property="og:image"]', el => (el as HTMLMetaElement).content).catch(() => null);

      const imgs = await page.evaluate(() =>
        Array.from(document.querySelectorAll("img"))
          .filter(img => img.naturalWidth >= 700)
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
      process.stdout.write(` ERR(${(e as Error).message.split("\n")[0].substring(0, 40)})`);
    }
  }
  await browser.close();
  return best;
}

async function main() {
  console.log(`=== Batch 11 Playwright Extraction (${toRun.length} brands) ===\n`);

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
    } else if (topBg && !topBg.includes("logo") && !topBg.includes(".gif") && !topBg.includes("gradient")) {
      console.log(`BG   ${topBg}`);
    } else {
      console.log(`NOTHING good (best img: ${topImg ? topImg.w + "w " + topImg.src.substring(0, 60) : "none"})`);
      r.imgs.slice(0, 3).forEach(i => console.log(`     ${i.w}x${i.h}  ${i.src}`));
      if (r.og) console.log(`     OG: ${r.og}`);
    }
  }

  console.log("\n=== Done ===");
}

main();
