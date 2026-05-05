import { chromium } from "playwright";

interface BrandTarget {
  slug: string;
  url: string;
  fallbackUrls?: string[];
}

const TARGETS: BrandTarget[] = [
  {
    slug: "duravit",
    url: "https://www.duravit.com/",
    fallbackUrls: [
      "https://www.duravit.com/products",
      "https://www.duravit.us/",
    ],
  },
  {
    slug: "victoria-albert",
    url: "https://www.vandabaths.com/",
    fallbackUrls: [
      "https://www.vandabaths.com/about-us",
      "https://vandabaths.com/collections",
    ],
  },
  {
    slug: "kallista",
    url: "https://www.kallista.com/",
    fallbackUrls: [
      "https://www.kallista.com/inspiration",
      "https://www.kallista.com/products",
    ],
  },
  {
    slug: "robern",
    url: "https://www.robern.com/",
    fallbackUrls: [
      "https://www.robern.com/discover",
      "https://www.robern.com/products",
    ],
  },
  {
    slug: "perrin-and-rowe",
    url: "https://perrinandrowe.co.uk/",
    fallbackUrls: [
      "https://rohlhome.com/",
      "https://rohlhome.com/perrin-rowe",
    ],
  },
  {
    slug: "graff",
    url: "https://graff-designs.com/en",
    fallbackUrls: [
      "https://graff-designs.com/en/products",
    ],
  },
];

async function extractHeroCandidates(slug: string, url: string) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    await page.evaluate(() => window.scrollTo(0, 1200));
    await page.waitForTimeout(3000);

    const og = await page
      .$eval('meta[property="og:image"]', (el) =>
        (el as HTMLMetaElement).content
      )
      .catch(() => null);

    const candidates = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll("img"));
      return imgs
        .filter((img) => img.naturalWidth >= 800)
        .sort((a, b) => b.naturalWidth - a.naturalWidth)
        .slice(0, 5)
        .map((img) => ({
          src: img.src || img.getAttribute("data-src") || "",
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          alt: img.alt || "",
        }));
    });

    const bgCandidates = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll("*"));
      const bgs: string[] = [];
      elements.forEach((el) => {
        const style = getComputedStyle(el);
        const bg = style.backgroundImage;
        if (bg && bg !== "none" && bg.includes("url(")) {
          const match = bg.match(/url\(["']?([^"')]+)["']?\)/);
          if (match?.[1] && !match[1].startsWith("data:")) {
            bgs.push(match[1]);
          }
        }
      });
      return bgs.slice(0, 5);
    });

    return { slug, url, og, candidates, bgCandidates };
  } catch (err) {
    return {
      slug,
      url,
      error: (err as Error).message,
      og: null,
      candidates: [],
      bgCandidates: [],
    };
  } finally {
    await browser.close();
  }
}

async function main() {
  console.log("=== Phase B: Playwright Hero Extraction ===\n");

  for (const target of TARGETS) {
    const allUrls = [target.url, ...(target.fallbackUrls || [])];

    for (const url of allUrls) {
      console.log(`\n--- ${target.slug} (${url}) ---`);
      const result = await extractHeroCandidates(target.slug, url);

      if (result.error) {
        console.log(`  ERROR: ${result.error}`);
        continue;
      }

      console.log(`  og:image → ${result.og || "(none)"}`);
      if (result.candidates.length > 0) {
        console.log(`  <img> candidates (≥800w):`);
        result.candidates.forEach((c, i) => {
          console.log(
            `    ${i + 1}. ${c.naturalWidth}×${c.naturalHeight} — ${c.src.substring(0, 120)}`
          );
        });
      } else {
        console.log(`  <img> candidates: (none ≥800w)`);
      }

      if (result.bgCandidates.length > 0) {
        console.log(`  CSS background-image candidates:`);
        result.bgCandidates.forEach((bg, i) => {
          console.log(`    ${i + 1}. ${bg.substring(0, 120)}`);
        });
      }

      if (
        result.og ||
        result.candidates.length > 0 ||
        result.bgCandidates.length > 0
      ) {
        break;
      }
    }
  }

  console.log("\n=== Done ===");
}

main();
