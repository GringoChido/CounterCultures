import type { Brand, CategorySlug } from "@/app/lib/brand-kit-types";

const FALLBACK_BRAND_META: Record<
  string,
  {
    name: string;
    originCountry?: string;
    originCountryName?: string;
    primaryCategorySlug?: string;
    isFeatured?: boolean;
    isArtisan?: boolean;
  }
> = {
  kohler: { name: "Kohler", originCountry: "US", originCountryName: "United States", primaryCategorySlug: "faucetry-showers", isFeatured: true },
  toto: { name: "TOTO", originCountry: "JP", originCountryName: "Japan", primaryCategorySlug: "toilets", isFeatured: true },
  brizo: { name: "Brizo", originCountry: "US", originCountryName: "United States", primaryCategorySlug: "faucetry-showers", isFeatured: true },
  blanco: { name: "BLANCO", originCountry: "DE", originCountryName: "Germany", primaryCategorySlug: "kitchen-sinks", isFeatured: true },
  "california-faucets": { name: "California Faucets", originCountry: "US", originCountryName: "United States", primaryCategorySlug: "faucetry-showers", isFeatured: true },
  "sun-valley-bronze": { name: "Sun Valley Bronze", originCountry: "US", originCountryName: "United States", primaryCategorySlug: "door-cabinet-hardware", isFeatured: true },
  emtek: { name: "Emtek", originCountry: "US", originCountryName: "United States", primaryCategorySlug: "door-cabinet-hardware" },
  badeloft: { name: "Badeloft", originCountry: "DE", originCountryName: "Germany", primaryCategorySlug: "bathtubs" },
  "villeroy-boch": { name: "Villeroy & Boch", originCountry: "DE", originCountryName: "Germany", primaryCategorySlug: "bathroom-sinks" },
  aquaspa: { name: "Aquaspa", originCountry: "US", originCountryName: "United States", primaryCategorySlug: "bathtubs" },
  ebbe: { name: "Ebbe", originCountry: "US", originCountryName: "United States", primaryCategorySlug: "drains" },
  delta: { name: "Delta", originCountry: "US", originCountryName: "United States", primaryCategorySlug: "faucetry-showers" },
  rohl: { name: "Rohl", originCountry: "US", originCountryName: "United States", primaryCategorySlug: "faucetry-showers" },
  teka: { name: "Teka", originCountry: "ES", originCountryName: "Spain", primaryCategorySlug: "kitchen-sinks" },
  smeg: { name: "Smeg", originCountry: "IT", originCountryName: "Italy", primaryCategorySlug: "appliances" },
  bluestar: { name: "BlueStar", originCountry: "US", originCountryName: "United States", primaryCategorySlug: "appliances" },
  baldwin: { name: "Baldwin", originCountry: "US", originCountryName: "United States", primaryCategorySlug: "door-cabinet-hardware" },
  "chicago-faucets": { name: "Chicago Faucets", originCountry: "US", originCountryName: "United States", primaryCategorySlug: "faucetry-showers" },
  dxv: { name: "DXV", originCountry: "US", originCountryName: "United States", primaryCategorySlug: "faucetry-showers" },
  // Artisan makers — ISR-cached brand pages instead of dynamic catalog
  mistoa: { name: "Mistoa", originCountry: "MX", originCountryName: "Mexico", primaryCategorySlug: "bathroom-sinks", isArtisan: true },
  castro: { name: "Castro", originCountry: "MX", originCountryName: "Mexico", primaryCategorySlug: "bathroom-sinks", isArtisan: true },
  "familia-meza": { name: "Familia Meza", originCountry: "MX", originCountryName: "Mexico", primaryCategorySlug: "bathroom-sinks", isArtisan: true },
  manriquez: { name: "Manriquez", originCountry: "MX", originCountryName: "Mexico", primaryCategorySlug: "door-cabinet-hardware", isArtisan: true },
};

export { FALLBACK_BRAND_META };

export const getFallbackBrand = (slug: string): Brand | null => {
  const meta = FALLBACK_BRAND_META[slug];
  if (!meta) return null;
  return {
    slug,
    name: meta.name,
    taglineEn: "",
    taglineEs: "",
    descriptionEn: "",
    descriptionEs: "",
    originCountry: meta.originCountry ?? "",
    originCountryName: meta.originCountryName ?? "",
    websiteUrl: "",
    externalUrl: "",
    stockedState: "request",
    primaryCategorySlug: (meta.primaryCategorySlug ?? "other") as CategorySlug,
    categorySlugs: [(meta.primaryCategorySlug ?? "other") as CategorySlug],
    logoDriveId: "",
    heroDriveId: "",
    brandFolderDriveId: "",
    featuredProductIds: [],
    featuredProjectSlugs: [],
    nomStatusSummary: "unknown",
    isArtisan: meta.isArtisan ?? false,
    isFeatured: meta.isFeatured ?? false,
    displayOrder: 999,
    createdAt: "",
    updatedAt: "",
    updatedBy: "fallback",
  };
};
