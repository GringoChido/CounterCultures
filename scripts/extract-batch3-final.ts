import { chromium } from "playwright";

async function go(slug: string, url: string, label: string) {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  });
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(7000);
    await page.evaluate(() => window.scrollTo(0, 1200));
    await page.waitForTimeout(3000);

    const og = await page
      .$eval('meta[property="og:image"]', (el) => (el as HTMLMetaElement).content)
      .catch(() => null);

    const imgs = await page.evaluate(() =>
      Array.from(document.querySelectorAll("img"))
        .filter((img) => img.naturalWidth >= 800)
        .sort((a, b) => b.naturalWidth - a.naturalWidth)
        .slice(0, 5)
        .map((img) => ({ src: img.src, w: img.naturalWidth, h: img.naturalHeight }))
    );

    const bgs = await page.evaluate(() => {
      const u: string[] = [];
      document.querySelectorAll("*").forEach((el) => {
        const bg = getComputedStyle(el).backgroundImage;
        if (bg && bg !== "none" && bg.startsWith("url(")) {
          const m = bg.match(/url\(["']?([^"')]+)["']?\)/);
          if (m?.[1] && !m[1].startsWith("data:")) u.push(m[1]);
        }
      });
      return [...new Set(u)].slice(0, 8);
    });

    console.log(`\n== ${label} ==`);
    if (og) console.log(`  OG   ${og}`);
    imgs.forEach((i) => console.log(`  IMG  ${i.w}x${i.h}  ${i.src}`));
    bgs.forEach((b) => console.log(`  BG   ${b}`));
    if (!og && !imgs.length && !bgs.length) console.log("  (nothing ≥800w)");
  } catch (e) {
    console.log(`\n== ${label} == ERROR: ${(e as Error).message.split("\n")[0]}`);
  }
  await browser.close();
}

async function main() {
  // Get full Cheviot tub URL
  await go("cheviot", "https://cheviotproducts.com/collections/freestanding-bathtubs", "CHEVIOT freestanding");
  // DXV lifestyle hero
  await go("dxv", "https://www.dxv.com/collections/bath", "DXV bath collection");
  // Jacuzzi — get full image URL
  await go("jacuzzi", "https://www.jacuzzi.com/en-us/bathtubs/", "JACUZZI bathtubs");
  // Buster + Punch — try correct domain
  await go("buster-punch", "https://busterandpunch.com/", "BUSTER+PUNCH correct domain");
  // Waterstone — try different spellings
  await go("waterstone", "https://waterstonefaucets.com/", "WATERSTONE (plural)");
  // BainUltra — try specific product page
  await go("bainultra", "https://www.bainultra.com/en-us/bathtubs/air-therapy/", "BAINULTRA air therapy");
  // Nostalgic Warehouse — get lifestyle shot not logo
  await go("nostalgic-warehouse", "https://nostalgicwarehouse.com/collections/all", "NOSTALGIC WAREHOUSE all");
}

main();
