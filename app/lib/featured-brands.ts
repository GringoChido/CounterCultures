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
export const getFeaturedBrands = async (): Promise<FeaturedBrand[]> => {
  const [brandCounts, allBrands] = await Promise.all([
    getBrandCounts().catch(() => []),
    getBrands().catch(() => []),
  ]);

  if (allBrands.length === 0) return [];

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
