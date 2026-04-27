import { getBrandCounts } from "@/app/lib/products-full";
import { getBrands } from "@/app/lib/brand-kit-sheets";
import type { Brand } from "@/app/lib/brand-kit-types";

// Flagship brands surfaced in the homepage + brand-page bands.
// Order is editorial — change here only.
export const FLAGSHIP_SLUGS = [
  "brizo",
  "kohler",
  "toto",
  "california-faucets",
  "blanco",
  "emtek",
  "sun-valley-bronze",
  "badeloft",
] as const;

const PRE_STAGED_HEROES: Record<string, string> = {
  kohler: "/Assets/BRANDS/kohler-hero.webp",
  toto: "/Assets/BRANDS/toto-hero.webp",
  brizo: "/Assets/BRANDS/brizo-hero.webp",
  blanco: "/Assets/BRANDS/blanco-hero.webp",
  "california-faucets": "/Assets/BRANDS/california-faucets-hero.webp",
  "sun-valley-bronze": "/Assets/BRANDS/sun-valley-bronze-hero.webp",
  emtek: "/Assets/BRANDS/emtek-hero.avif",
  badeloft: "/Assets/BRANDS/badeloft-hero.webp",
};

export type FeaturedBrand = Brand & {
  catalogCount: number;
  heroImage?: string;
};

/**
 * Fetches the editorial flagship list with live full-catalog SKU counts
 * and the local hero image path. Tolerates either backing data source
 * being unavailable — returns an empty array, the band component renders
 * nothing in that case (safe for static export builds).
 */
// Fallback metadata for the flagship slugs — used when getBrands() returns
// empty (Brand Kit Sheet env var missing on build host, sheet not shared,
// service-account key parse failure). Without this, the homepage band
// silently renders empty whenever the sheet load hiccups. Names sourced
// from the editorial brand list; minimal fields only.
const FLAGSHIP_FALLBACK: Record<string, { name: string }> = {
  kohler: { name: "Kohler" },
  toto: { name: "TOTO" },
  brizo: { name: "Brizo" },
  blanco: { name: "BLANCO" },
  "california-faucets": { name: "California Faucets" },
  "sun-valley-bronze": { name: "Sun Valley Bronze" },
  emtek: { name: "Emtek" },
  badeloft: { name: "Badeloft" },
};

const buildFlagshipFallback = (): FeaturedBrand[] =>
  FLAGSHIP_SLUGS.flatMap((slug) => {
    const meta = FLAGSHIP_FALLBACK[slug];
    if (!meta) return [];
    return [
      {
        slug,
        name: meta.name,
        taglineEn: "",
        taglineEs: "",
        descriptionEn: "",
        descriptionEs: "",
        originCountry: "",
        originCountryName: "",
        websiteUrl: "",
        externalUrl: "",
        stockedState: "stocked" as const,
        primaryCategorySlug: "" as const,
        categorySlugs: [],
        logoDriveId: "",
        heroDriveId: "",
        brandFolderDriveId: "",
        featuredProductIds: [],
        featuredProjectSlugs: [],
        nomStatusSummary: "unknown" as const,
        isArtisan: false,
        isFeatured: true,
        displayOrder: null,
        createdAt: "",
        updatedAt: "",
        updatedBy: "fallback",
        catalogCount: 0,
        heroImage: PRE_STAGED_HEROES[slug],
      },
    ];
  });

export const getFeaturedBrands = async (): Promise<FeaturedBrand[]> => {
  const [brandCounts, allBrands] = await Promise.all([
    getBrandCounts().catch(() => []),
    getBrands().catch(() => []),
  ]);

  // When the sheet load returns empty, fall back to the hardcoded flagship
  // metadata so the homepage band renders with hero images. Skips the
  // catalog-count enrichment since brandCounts may also be empty in this state.
  if (allBrands.length === 0) return buildFlagshipFallback();

  const brandByslug = new Map(allBrands.map((b) => [b.slug, b]));
  const countByName = new Map(
    brandCounts.map((b) => [b.brand.toLowerCase(), b.count])
  );

  return FLAGSHIP_SLUGS.flatMap((slug) => {
    const b = brandByslug.get(slug);
    if (!b) return [];
    return [
      {
        ...b,
        catalogCount: countByName.get(b.name.toLowerCase()) ?? 0,
        heroImage: PRE_STAGED_HEROES[slug],
      },
    ];
  });
};
