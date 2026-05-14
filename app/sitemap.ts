import type { MetadataRoute } from "next";
import { BRANDS, PRODUCT_CATEGORIES } from "@/app/lib/constants";
import { articles } from "@/app/lib/articles";
import { PROJECTS } from "@/app/lib/projects";
import { getProducts } from "@/app/lib/sheets";
import { getBrandCategoryCombos, getProductById, getProductSlug } from "@/app/lib/products-full";
import { pdpPath } from "@/app/lib/pdp-href";
import { getBrands } from "@/app/lib/brand-kit-sheets";
import { getStagedIds } from "@/app/lib/product-content";

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
    ...localizedEntry("/hospitality", "monthly", 0.75),
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

  // Product detail pages — curated products from the CRM sheet
  const products = await getProducts();
  const productRoutes: MetadataRoute.Sitemap = products.flatMap((product) =>
    localizedEntry(
      pdpPath(product),
      "monthly",
      0.6
    )
  );

  // Full-catalog PDPs — products with rich sidecar content (scraped descriptions,
  // galleries) get sitemap entries. Products without content are still reachable via
  // ISR but aren't worth indexing until they have copy.
  const stagedIds = getStagedIds();
  const fullCatalogSlugs = new Set(products.map((p) => p.slug));
  const fullCatalogRoutes: MetadataRoute.Sitemap = [];
  for (const id of stagedIds.slice(0, 5000)) {
    const p = await getProductById(id);
    if (!p || !p.saleOk || !p.active) continue;
    const slug = getProductSlug(p);
    if (fullCatalogSlugs.has(slug)) continue;
    fullCatalogSlugs.add(slug);
    fullCatalogRoutes.push(
      ...localizedEntry(pdpPath({ slug, sku: p.sku, category: p.category }), "monthly", 0.5)
    );
  }

  return [
    ...staticRoutes,
    ...brandRoutes,
    ...brandCategoryRoutes,
    ...subcategoryRoutes,
    ...productRoutes,
    ...fullCatalogRoutes,
    ...articleRoutes,
    ...projectRoutes,
  ];
}
