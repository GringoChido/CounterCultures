/**
 * Playwright hero extraction for Batch 12 — deeper page strategies.
 * Targeting brands blocked by JS/lazy-load on their homepages.
 * Usage: npx tsx scripts/extract-brand-heroes-batch12.ts
 */

import { chromium } from "playwright";

const TARGETS = [
  // Franke — premium kitchen sinks; try their gallery/inspiration pages
  { slug: "franke",           urls: [
    "https://www.frankekitchensystems.us/",
    "https://www.franke.com/us/en/hk/ideas.html",
    "https://www.franke.com/content/dam/franke/fks/",
  ]},
  // Gerber plumbing — part of Globe Union Group
  { slug: "gerber",           urls: [
    "https://www.globeuniongroup.com/brands/gerber/",
    "https://www.gerberplumbing.com/collections/",
    "https://www.gerber-online.com/",
  ]},
  // Elkay — major US sink brand, JS-heavy
  { slug: "elkay",            urls: [
    "https://www.elkay.com/us/en/inspiration.html",
    "https://www.elkay.com/us/en/residential-sinks.html",
    "https://www.elkay.com/us/en.html",
  ]},
  // Richelieu — hardware; try specific product sub-pages
  { slug: "richelieu",        urls: [
    "https://www.richelieu.com/us/en/product-catalog/hardware-and-accessories/decorative-hardware/pulls/",
    "https://www.richelieu.com/us/en/product-catalog/hardware-and-accessories/",
    "https://www.richelieu.com/us/en/catalog/inspiration/",
  ]},
  // Nameeks — Italian bath accessories
  { slug: "nameeks",          urls: [
    "https://www.nameeks.com/en-us/collections/",
    "https://www.nameeks.com/en-us/bathroom-accessories/",
    "https://www.nameeks.com/",
  ]},
  // Miseno — faucets and sinks brand
  { slug: "miseno",           urls: [
    "https://www.miseno.com/",
    "https://www.miseno.com/kitchen/",
    "https://www.miseno.com/bath/",
  ]},
  // Grandeur — door hardware Shopify store (lazy-load)
  { slug: "grandeur",         urls: [
    "https://www.grandeurhardware.com/pages/about-grandeur",
    "https://www.grandeurhardware.com/collections/door-knobs",
    "https://www.grandeurhardware.com/",
  ]},
  // Houzer — stainless steel sinks
  { slug: "houzer",           urls: [
    "https://www.houzer.com/collections/all",
    "https://www.houzer.com/collections/topmount-sinks",
    "https://www.houzer.com/",
  ]},
  // DXV — American Standard luxury line
  { slug: "dxv",              urls: [
    "https://www.dxv.com/bath",
    "https://www.dxv.com/",
    "https://www.dxv.com/collections/bath",
  ]},
  // Viega — German plumbing, try English product pages
  { slug: "viega",            urls: [
    "https://www.viega.us/en/products/viega-propress.html",
    "https://www.viega.us/en/services.html",
    "https://www.viega.us/",
  ]},
  // Sugatsune — architectural hardware; product catalog
  { slug: "sugatsune",        urls: [
    "https://www.sugatsune.com/products/soft-close-hinges/",
    "https://www.sugatsune.com/products/",
    "https://www.sugatsune.com/about/",
  ]},
  // Moen — try shorter timeout with their homepage or press kit
  { slug: "moen",             urls: [
    "https://www.moen.com/collections/kitchen-faucets",
    "https://www.moen.com/bath",
    "https://www.moen.com/",
  ]},
  // Jaclo — try after JS loads for longer
  { slug: "jaclo",            urls: [
    "https://www.jaclo.com/shower/",
    "https://www.jaclo.com/faucets/",
    "https://www.jaclo.com/",
  ]},
  // Signature Hardware — try with longer waits
  { slug: "signature-hardware", urls: [
    "https://www.signaturehardware.com/bathroom/bathroom-faucets.html",
    "https://signaturehardware.com/",
    "https://www.signaturehardware.com/",
  ]},
  // Ashley Norton — JS SPA, try product category
  { slug: "ashley-norton",    urls: [
    "https://www.ashleynorton.com/products/",
    "https://ashleynorton.com/",
    "https://www.ashleynorton.com/",
  ]},
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
      await page.waitForTimeout(8000);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 4));
      await page.waitForTimeout(3000);

      const og = await page.$eval('meta[property="og:image"]', el => (el as HTMLMetaElement).content).catch(() => null);

      const imgs = await page.evaluate(() =>
        Array.from(document.querySelectorAll("img"))
          .filter(img => img.naturalWidth >= 700 && img.src && img.src.length > 10)
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
            if (m?.[1] && !m[1].startsWith("data:") && !m[1].endsWith(".svg") && !m[1].includes("icon") && !m[1].includes("logo") && !m[1].includes(".gif")) u.push(m[1]);
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
  console.log(`=== Batch 12 Playwright Extraction (${toRun.length} brands) ===\n`);

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
    } else if (topBg) {
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
