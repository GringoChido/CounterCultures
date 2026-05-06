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
      return [...new Set(u)].slice(0, 5);
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
  // Buster + Punch — US site
  await go("buster-punch", "https://us.buster-punch.com/", "BUSTER+PUNCH (us.)");
  // Waterstone — correct domain
  await go("waterstone", "https://waterstonefaucet.com/inspiration/", "WATERSTONE inspiration");
  // Hydrosystems — correct domain
  await go("hydrosystems", "https://www.hydrosystemsonline.com/", "HYDROSYSTEMS online");
  // Moen — product collection page (lighter than homepage)
  await go("moen", "https://www.moen.com/sto/bath", "MOEN bath");
  // Riobel — Grohe sister brand, different URL
  await go("riobel", "https://www.riobel.net/en/inspiration/", "RIOBEL inspiration");
  // LaCava — replacement candidate
  await go("lacava", "https://www.lacavasinks.com/", "LACAVA");
  // Signature Hardware — replacement candidate
  await go("signature-hardware", "https://www.signaturehardware.com/", "SIGNATURE HARDWARE");
  // Wyndham Collection — replacement candidate
  await go("wyndham-collection", "https://www.wyndhamcollection.com/", "WYNDHAM COLLECTION");
  // DXV — American Standard luxury line
  await go("dxv", "https://www.dxv.com/", "DXV");
}

main();
