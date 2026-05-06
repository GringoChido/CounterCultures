/**
 * Playwright hero extraction for Batch 14 — cookie-banner dismissal + slow-scroll.
 * Handles OneTrust consent walls and Shopify lazy-load patterns.
 * Usage: npx tsx scripts/extract-brand-heroes-batch14.ts
 */

import { chromium, type Page } from "playwright";

async function dismissCookieBanner(page: Page) {
  const selectors = [
    "#onetrust-accept-btn-handler",
    "button[id*='accept']",
    "button[class*='accept']",
    "button:has-text('Accept All')",
    "button:has-text('Accept Cookies')",
    "button:has-text('Accept')",
    "button:has-text('Allow All')",
    "button:has-text('I Accept')",
    "a:has-text('Accept All')",
    "[data-testid='cookie-accept']",
    ".cookie-accept",
    "#cookie-accept",
  ];
  for (const sel of selectors) {
    try {
      const btn = await page.$(sel);
      if (btn) {
        await btn.click();
        await page.waitForTimeout(1000);
        return true;
      }
    } catch { /* ignore */ }
  }
  return false;
}

const TARGETS = [
  // Elkay — OneTrust banner; dismiss first
  { slug: "elkay",            urls: ["https://www.elkay.com/us/en.html", "https://www.elkay.com/us/en/residential-sinks.html"] },
  // Du Verre / Top Knobs — OneTrust banner; dismiss first
  { slug: "du-verre",         urls: ["https://www.topknobs.com/top-knobs/du-verre", "https://www.topknobs.com/"] },
  // Sterling Plumbing — OneTrust banner
  { slug: "sterling-dupcheck", urls: ["https://www.sterlingplumbing.com/collections/bathtubs"] },
  // Grandeur — Shopify lazy-load; slow incremental scroll
  { slug: "grandeur",         urls: ["https://www.grandeurhardware.com/"] },
  // Franke — try their CDN with known product image paths
  { slug: "franke",           urls: [
    "https://www.franke.com/us/en/hk/products/kitchen-sinks.html",
    "https://www.franke.com/us/en/hk/products.html",
  ]},
  // Merola Tile — navigate to image URL directly via Playwright
  { slug: "merola-tile",      urls: ["https://merolatile.com/"] },
  // Ageless Iron — artisan gate hardware; try product pages
  { slug: "ageless-iron",     urls: [
    "https://www.agelessiron.com/shop/",
    "https://www.agelessiron.com/collections/",
    "https://www.agelessiron.com/",
  ]},
  // Riobel — Canadian faucet brand
  { slug: "riobel",           urls: [
    "https://www.riobel.ca/en/",
    "https://riobel.com/en/",
    "https://www.riobel.ca/",
  ]},
  // Kingston Brass — try product pages
  { slug: "kingston-brass",   urls: [
    "https://www.kingstonbrass.com/faucets/kitchen-faucets/",
    "https://www.kingstonbrass.com/",
  ]},
  // Speakman — premium showerheads; try different page
  { slug: "speakman",         urls: [
    "https://www.speakman.com/shower-heads/",
    "https://www.speakman.com/",
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
      await page.waitForTimeout(4000);

      // Try to dismiss cookie/consent banners
      await dismissCookieBanner(page);
      await page.waitForTimeout(2000);

      // Slow incremental scroll to trigger lazy-load
      for (let pos = 0; pos <= 3000; pos += 500) {
        await page.evaluate((y) => window.scrollTo(0, y), pos);
        await page.waitForTimeout(800);
      }
      await page.waitForTimeout(2000);

      const og = await page.$eval('meta[property="og:image"]', el => (el as HTMLMetaElement).content).catch(() => null);

      const imgs = await page.evaluate(() =>
        Array.from(document.querySelectorAll("img"))
          .filter(img => img.naturalWidth >= 700 && img.src && img.src.length > 15)
          .sort((a, b) => b.naturalWidth - a.naturalWidth)
          .slice(0, 8)
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
  console.log(`=== Batch 14 Playwright Extraction (${toRun.length} brands) ===\n`);

  for (const t of toRun) {
    process.stdout.write(`${t.slug.padEnd(26)}... `);
    const r = await extract(t.slug, t.urls);

    if (!r) { console.log("BLOCKED"); continue; }

    const topImg = r.imgs[0];
    const topBg = r.bgs[0];

    if (r.og && !r.og.includes("logo") && !r.og.includes("Logo") && !r.og.endsWith(".svg") && !r.og.includes("favicon") && !r.og.includes("icon")) {
      console.log(`OG   ${r.og}`);
    } else if (topImg && topImg.w >= 1100 && !topImg.src.includes("cookie") && !topImg.src.includes("logo") && !topImg.src.includes("Logo") && !topImg.src.includes("icon")) {
      console.log(`IMG  ${topImg.w}x${topImg.h}  ${topImg.src}`);
      if (r.imgs[1] && r.imgs[1].w >= 900) console.log(`     also: ${r.imgs[1].w}x${r.imgs[1].h}  ${r.imgs[1].src}`);
    } else if (topBg && !topBg.includes("logo") && !topBg.includes(".gif") && !topBg.includes("icon")) {
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
