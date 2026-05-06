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
    await page.waitForTimeout(6000);
    await page.evaluate(() => window.scrollTo(0, 1200));
    await page.waitForTimeout(3000);

    const imgs = await page.evaluate(() =>
      Array.from(document.querySelectorAll("img"))
        .filter((img) => img.naturalWidth >= 800)
        .sort((a, b) => b.naturalWidth - a.naturalWidth)
        .slice(0, 5)
        .map((img) => ({
          src: img.src,
          w: img.naturalWidth,
          h: img.naturalHeight,
          alt: (img.alt || "").substring(0, 60),
        }))
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
      return [...new Set(u)].slice(0, 5);
    });

    console.log(`\n== ${label} ==`);
    imgs.forEach((i) => console.log(`  IMG ${i.w}x${i.h}  ${i.src}`));
    bgs.forEach((b) => console.log(`  BG   ${b}`));
    if (!imgs.length && !bgs.length) console.log("  (nothing ≥800w)");
  } catch (e) {
    console.log(`\n== ${label} == ERROR: ${(e as Error).message.split("\n")[0]}`);
  }
  await browser.close();
}

async function main() {
  await go("american-standard", "https://www.americanstandard-us.com/", "AMERICAN STANDARD");
  await go("moen", "https://www.moen.com/inspiration", "MOEN inspiration");
  await go("buster-punch", "https://buster-punch.com/en-us/", "BUSTER+PUNCH");
  await go("riobel", "https://riobel.net/en/", "RIOBEL");
  await go("waterstone", "https://www.waterstonefaucet.com/", "WATERSTONE");
  await go("bainultra", "https://www.bainultra.com/en-us/bathtubs/", "BAINULTRA");
  await go("atlas-homewares", "https://www.atlashomewares.com/", "ATLAS HOMEWARES");
  await go("hydrosystems", "https://hydrosystems.com/", "HYDROSYSTEMS");
  await go("elkay", "https://www.elkay.com/inspiration-gallery", "ELKAY");
}

main();
