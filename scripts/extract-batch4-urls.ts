import { chromium } from "playwright";

async function go(slug: string, url: string) {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  });
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 35000 });
    await page.waitForTimeout(5000);
    await page.evaluate(() => window.scrollTo(0, 1000));
    await page.waitForTimeout(2000);

    const og = await page.$eval('meta[property="og:image"]', el => (el as HTMLMetaElement).content).catch(() => null);
    const imgs = await page.evaluate(() =>
      Array.from(document.querySelectorAll("img"))
        .filter(img => img.naturalWidth >= 800 && !img.src.includes("cookie") && !img.src.includes("logo"))
        .sort((a, b) => b.naturalWidth - a.naturalWidth)
        .slice(0, 4)
        .map(img => ({ src: img.src, w: img.naturalWidth, h: img.naturalHeight }))
    );
    const bgs = await page.evaluate(() => {
      const u: string[] = [];
      document.querySelectorAll("*").forEach(el => {
        const bg = getComputedStyle(el).backgroundImage;
        if (bg && bg !== "none" && bg.startsWith("url(")) {
          const m = bg.match(/url\(["']?([^"')]+)["']?\)/);
          if (m?.[1] && !m[1].startsWith("data:") && !m[1].endsWith(".svg") && !m[1].includes("icon")) u.push(m[1]);
        }
      });
      return [...new Set(u)].slice(0, 4);
    });

    console.log(`\n==${slug}==`);
    if (og && !og.includes("logo") && !og.endsWith(".svg")) console.log(`  OG  ${og}`);
    imgs.forEach(i => console.log(`  IMG ${i.w}x${i.h}  ${i.src}`));
    bgs.forEach(b => console.log(`  BG  ${b}`));
    if (!og && !imgs.length && !bgs.length) console.log("  (nothing)");
  } catch (e) {
    console.log(`\n==${slug}==  ERROR: ${(e as Error).message.split("\n")[0]}`);
  }
  await browser.close();
}

async function main() {
  await go("dreamline", "https://www.dreamline.com/");
  await go("maax", "https://www.maax.com/en-us/");
  await go("infinity-drain", "https://www.infinitydrain.com/");
  await go("linkasink", "https://www.linkasink.com/");
  await go("speakman", "https://www.speakman.com/");
  await go("ruvati", "https://ruvati.com/");
  await go("dxv", "https://www.dxv.com/");
  await go("ove-decors", "https://ovedecors.com/");
  await go("franke", "https://www.frankeksd.com/");
}

main();
