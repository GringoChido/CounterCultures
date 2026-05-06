import type { MetadataRoute } from "next";
import { BRANDS, PRODUCT_CATEGORIES } from "@/app/lib/constants";
import { articles } from "@/app/lib/articles";
import { PROJECTS } from "@/app/lib/projects";
import { getProducts } from "@/app/lib/sheets";
import { getBrandCategoryCombos } from "@/app/lib/products-full";
import { getBrands } from "@/app/lib/brand-kit-sheets";

// Regenerate hourly so the brand × category combos pick up Roger's catalog
// edits. Build-time generation was returning 0 combos (catalog cache loads
// at runtime, not at build), which silently dropped the new SEO routes.
export const revalidate = 3600;

const BASE_URL = "https://countercultures.mx";
const LAST_MODIFIED = new Date("2026-03-30");

type Locale = "en" | "es";
const locales: Locale[] = ["en", "es"];

function localizedEntry(
  path: string,
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
  priority: number,
  lastModified: Date = LAST_MODIFIED
): MetadataRoute.Sitemap[number][] {
  return locales.map((locale) => ({
    url: `${BASE_URL}/${locale}${path}`,
    lastModified,
    changeFrequency,
    priority,
    alternates: {
      languages: Object.fromEntries(
        locales.map((l) => [l, `${BASE_URL}/${l}${path}`])
      ),
    },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    ...localizedEntry("", "monthly", 1.0),
    ...localizedEntry("/shop", "weekly", 0.9),
    ...localizedEntry("/shop/bathroom", "weekly", 0.85),
    ...localizedEntry("/shop/kitchen", "weekly", 0.85),
    ...localizedEntry("/shop/hardware", "weekly", 0.85),
    ...localizedEntry("/brands", "monthly", 0.75),
    ...localizedEntry("/our-story", "yearly", 0.6),
    ...localizedEntry("/inspiration", "monthly", 0.75),
    ...localizedEntry("/showroom", "monthly", 0.7),
    ...localizedEntry("/contact", "yearly", 0.65),
    ...localizedEntry("/trade", "monthly", 0.75),
    ...localizedEntry("/resources", "monthly", 0.7),
    ...localizedEntry("/insights", "weekly", 0.8),
  ];

  // Brand pages
  const brandRoutes: MetadataRoute.Sitemap = BRANDS.flatMap(({ slug }) =>
    localizedEntry(`/brands/${slug}`, "monthly", 0.65)
  );

  // Programmatic brand × category landing pages — only combos that meet the
  // ≥10-product threshold AND whose brand exists in the Brand Kit (slug source
  // of truth). Mirrors generateStaticParams in the dynamic route.
  const [brandKitBrands, brandCategoryCombos] = await Promise.all([
    getBrands(),
    getBrandCategoryCombos(10),
  ]);
  const slugByName = new Map(brandKitBrands.map((b) => [b.name, b.slug]));
  const brandCategoryRoutes: MetadataRoute.Sitemap = brandCategoryCombos.flatMap(
    ({ brand, category }) => {
      const slug = slugByName.get(brand);
      if (!slug) return [];
      return localizedEntry(`/brands/${slug}/${category}`, "weekly", 0.7);
    }
  );

  // Shop subcategory pages
  const subcategoryRoutes: MetadataRoute.Sitemap = Object.entries(
    PRODUCT_CATEGORIES
  ).flatMap(([catSlug, catConfig]) =>
    catConfig.subcategories.flatMap((sub) =>
      localizedEntry(`/shop/${catSlug}/${sub.slug}`, "weekly", 0.75)
    )
  );

  // Article / insight pages
  const articleRoutes: MetadataRoute.Sitemap = articles.flatMap(({ slug }) =>
    localizedEntry(`/insights/${slug}`, "monthly", 0.65)
  );

  // Project detail pages — empty until real case studies land. PROJECTS
  // is intentionally [] right now; this still flatMaps cleanly to nothing.
  const projectRoutes: MetadataRoute.Sitemap = PROJECTS.flatMap(({ slug }) =>
    localizedEntry(`/inspiration/${slug}`, "monthly", 0.7)
  );

  // Product detail pages
  const products = await getProducts();
  const productRoutes: MetadataRoute.Sitemap = products.flatMap((product) =>
    localizedEntry(
      `/shop/${product.category}/p/${product.slug}`,
      "monthly",
      0.6
    )
  );

  return [
    ...staticRoutes,
    ...brandRoutes,
    ...brandCategoryRoutes,
    ...subcategoryRoutes,
    ...productRoutes,
    ...articleRoutes,
    ...projectRoutes,
  ];
}
