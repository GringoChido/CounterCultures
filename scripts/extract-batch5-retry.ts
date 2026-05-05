/**
 * Batch 5 follow-up — full URL extraction for truncated hits + blocked retries.
 * Usage: npx tsx scripts/extract-batch5-retry.ts
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
      return [...new Set(u)].slice(0, 5);
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
  // Full URL for pfister (Scene7 CDN — get OG + large img)
  await go("pfister", "https://www.pfisterfaucets.com/");
  // Full URL for watermark imgix
  await go("watermark", "https://www.watermark-designs.com/");
  // Maax full Cloudinary URL
  await go("maax", "https://www.maax.com/en-us/");
  // Amerock full homepage hero URL
  await go("amerock", "https://www.amerock.com/");
  // Hafele full static CDN URL
  await go("hafele", "https://www.hafele.com/us/en/");
  // Jeffrey Alexander — get full BG URL
  await go("jeffrey-alexander", "https://jeffrey-alexander.com/");
  // Elkay — try inspiration page instead of home
  await go("elkay", "https://www.elkay.com/us/en/inspiration.html");
  // Whitehaus — try correct domain
  await go("whitehaus", "https://www.whitehausonline.com/");
  // Franke KSD — try media page
  await go("franke", "https://www.frankeksd.com/inspiration/");
  // Ashley Norton — try collection page
  await go("ashley-norton", "https://www.ashleynorton.com/collections/");
  // Marazzi — try US site
  await go("marazzi", "https://www.marazzi.us/");
  // bedrosians — try collections
  await go("bedrosians", "https://www.bedrosians.com/en/tile/");
}

main();
