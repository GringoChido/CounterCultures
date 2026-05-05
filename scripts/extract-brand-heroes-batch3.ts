/**
 * Playwright hero extraction for Batch 3 — 20 priority brands.
 * Runs sequentially to avoid overwhelming network/memory.
 *
 * Usage: npx tsx scripts/extract-brand-heroes-batch3.ts
 * Optional: --slug=<slug> to test a single brand
 */

import { chromium } from "playwright";

interface BrandTarget {
  slug: string;
  name: string;
  urls: string[];
}

const TARGETS: BrandTarget[] = [
  { slug: "moen", name: "Moen", urls: ["https://www.moen.com/"] },
  { slug: "american-standard", name: "American Standard", urls: ["https://www.americanstandard-us.com/"] },
  { slug: "kraus", name: "Kraus", urls: ["https://www.kraususa.com/"] },
  { slug: "elkay", name: "Elkay", urls: ["https://www.elkay.com/"] },
  { slug: "jacuzzi", name: "Jacuzzi", urls: ["https://www.jacuzzi.com/en-us/"] },
  { slug: "buster-punch", name: "Buster + Punch", urls: ["https://buster-punch.com/"] },
  { slug: "ashley-norton", name: "Ashley Norton", urls: ["https://www.ashleynorton.com/"] },
  { slug: "atlas-homewares", name: "Atlas Homewares", urls: ["https://www.atlashomewares.com/"] },
  { slug: "nostalgic-warehouse", name: "Nostalgic Warehouse", urls: ["https://www.nostalgicwarehouse.com/"] },
  { slug: "waterstone", name: "Waterstone", urls: ["https://waterstonefaucet.com/"] },
  { slug: "bainultra", name: "BainUltra", urls: ["https://www.bainultra.com/en-us/"] },
  { slug: "hydrosystems", name: "Hydrosystems", urls: ["https://www.hydrosystemsonline.com/"] },
  { slug: "cheviot", name: "Cheviot", urls: ["https://www.cheviotproducts.com/"] },
  { slug: "kitchenaid", name: "KitchenAid", urls: ["https://www.kitchenaid.com/"] },
  { slug: "fisher-and-paykel", name: "Fisher & Paykel", urls: ["https://www.fisherpaykel.com/us/"] },
  { slug: "bosch", name: "Bosch", urls: ["https://www.bosch-home.com/us/"] },
  { slug: "watermark", name: "Watermark", urls: ["https://www.watermark-designs.net/"] },
  { slug: "victoria-and-albert", name: "Victoria & Albert", urls: ["https://us.vandabaths.com/", "https://www.vandabaths.com/us/"] },
  { slug: "riobel", name: "Riobel", urls: ["https://www.riobel.net/en/"] },
  { slug: "sukabumi-stone-mexico", name: "Sukabumi Stone México", urls: ["https://sukabumistonemexico.com/", "https://www.sukabumistonemexico.com/"] },
];

const argSlug = process.argv.find((a) => a.startsWith("--slug="))?.split("=")[1];
const targets = argSlug ? TARGETS.filter((t) => t.slug === argSlug) : TARGETS;

async function extract(slug: string, urls: string[]) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  });

  for (const url of urls) {
    const page = await context.newPage();
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForTimeout(5000);
      await page.evaluate(() => window.scrollTo(0, 1200));
      await page.waitForTimeout(2000);

      const og = await page
        .$eval('meta[property="og:image"]', (el) => (el as HTMLMetaElement).content)
        .catch(() => null);

      const imgCandidates = await page.evaluate(() =>
        Array.from(document.querySelectorAll("img"))
          .filter((img) => img.naturalWidth >= 800)
          .sort((a, b) => b.naturalWidth - a.naturalWidth)
          .slice(0, 5)
          .map((img) => ({
            src: img.src || img.getAttribute("data-src") || "",
            w: img.naturalWidth,
            h: img.naturalHeight,
            alt: (img.alt || "").substring(0, 60),
          }))
      );

      const bgCandidates = await page.evaluate(() => {
        const urls: string[] = [];
        document.querySelectorAll("*").forEach((el) => {
          const bg = getComputedStyle(el).backgroundImage;
          if (bg && bg !== "none" && bg.startsWith("url(")) {
            const m = bg.match(/url\(["']?([^"')]+)["']?\)/);
            if (m?.[1] && !m[1].startsWith("data:")) urls.push(m[1]);
          }
        });
        return [...new Set(urls)].slice(0, 5);
      });

      await page.close();

      const hasResults = og || imgCandidates.length > 0 || bgCandidates.length > 0;
      return { slug, url, og, imgCandidates, bgCandidates, ok: hasResults };
    } catch (err) {
      await page.close();
      console.log(`  [${slug}] ${url} → ERROR: ${(err as Error).message.split("\n")[0]}`);
    }
  }

  await browser.close();
  return { slug, url: urls[0], og: null, imgCandidates: [], bgCandidates: [], ok: false };
}

async function main() {
  console.log(`=== Batch 3 Playwright Extraction (${targets.length} brands) ===\n`);

  const results: ReturnType<typeof extract> extends Promise<infer T> ? T[] : never[] = [];

  for (const t of targets) {
    process.stdout.write(`Extracting ${t.name.padEnd(24)}... `);
    const r = await extract(t.slug, t.urls);
    results.push(r as any);

    const best = r.imgCandidates?.[0];
    const bestBg = r.bgCandidates?.[0];

    if (r.og) {
      console.log(`og:image → ${r.og.substring(0, 90)}`);
    } else if (best && best.w >= 1600) {
      console.log(`img ${best.w}×${best.h} → ${best.src.substring(0, 80)}`);
    } else if (best && best.w >= 800) {
      console.log(`img ${best.w}×${best.h} (under 1600w) → ${best.src.substring(0, 70)}`);
    } else if (bestBg) {
      console.log(`bg-img → ${bestBg.substring(0, 90)}`);
    } else {
      console.log(`NOTHING ≥800w found`);
    }

    // Detailed output
    if (r.imgCandidates && r.imgCandidates.length > 1) {
      r.imgCandidates.slice(1, 3).forEach((c) =>
        console.log(`  also: ${c.w}×${c.h} ${c.src.substring(0, 80)}`)
      );
    }
    if (r.bgCandidates && r.bgCandidates.length > 0 && !r.og && (!best || best.w < 1200)) {
      r.bgCandidates.slice(0, 2).forEach((bg) =>
        console.log(`  bg: ${bg.substring(0, 90)}`)
      );
    }
  }

  console.log("\n=== Extraction complete ===");
  console.log("\nDownload commands for ≥1200w candidates:\n");

  const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
  (results as any[]).forEach((r: any) => {
    const url = r.og || r.imgCandidates?.[0]?.src || r.bgCandidates?.[0];
    if (url) {
      const ext = url.split("?")[0].split(".").pop()?.toLowerCase() || "jpg";
      const safeExt = ["jpg", "jpeg", "png", "webp", "avif"].includes(ext) ? ext : "jpg";
      console.log(`download "${r.slug}" "${url}" "${safeExt}"`);
    }
  });
}

main();
