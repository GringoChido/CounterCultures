/**
 * Batch 11 follow-up — full URL extraction for promising candidates.
 */

import { chromium } from "playwright";

async function go(slug: string, url: string) {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  });
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 40000 });
    await page.waitForTimeout(8000);
    await page.evaluate(() => window.scrollTo(0, 1200));
    await page.waitForTimeout(3000);

    const og = await page.$eval('meta[property="og:image"]', el => (el as HTMLMetaElement).content).catch(() => null);
    const imgs = await page.evaluate(() =>
      Array.from(document.querySelectorAll("img"))
        .filter(img => img.naturalWidth >= 800)
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

    console.log(`\n==${slug}==  ${url}`);
    if (og) console.log(`  OG  ${og}`);
    imgs.forEach(i => console.log(`  IMG ${i.w}x${i.h}  ${i.src}`));
    bgs.forEach(b => console.log(`  BG  ${b}`));
    if (!og && !imgs.length && !bgs.length) console.log("  (nothing)");
  } catch (e) {
    console.log(`\n==${slug}==  ERROR: ${(e as Error).message.split("\n")[0]}`);
  }
  await browser.close();
}

async function main() {
  // Franke — try to get larger hero image
  await go("franke", "https://www.franke.com/us/en/hk.html");
  // Grandeur — longer wait for lazy load
  await go("grandeur", "https://www.grandeurhardware.com/collections/door-knobs");
  // Viega — try with longer wait
  await go("viega", "https://www.viega.us/en.html");
  // Sterling — get full Kohler scene7 URL
  await go("sterling", "https://www.sterlingplumbing.com/");
  // Samsung — check current home appliances hero
  await go("samsung", "https://www.samsung.com/us/home-appliances/");
  // Sugatsune — try lifestyle/catalog page
  await go("sugatsune", "https://www.sugatsune.com/catalog/");
  // Du Verre — try catalog page (Top Knobs brand)
  await go("du-verre", "https://www.topknobs.com/du-verre");
  // Ginger — try their actual site or parent
  await go("ginger", "https://www.gingerco.com/");
  // Jaclo — try actual product page
  await go("jaclo", "https://www.jaclo.com/product-categories/");
}

main();
