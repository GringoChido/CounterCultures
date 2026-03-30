import type { MetadataRoute } from "next";
import { BRANDS, PRODUCT_CATEGORIES } from "@/app/lib/constants";
import { articles } from "@/app/lib/articles";
import { PROJECTS } from "@/app/lib/projects";

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

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    ...localizedEntry("", "monthly", 1.0),
    ...localizedEntry("/shop", "weekly", 0.9),
    ...localizedEntry("/shop/bathroom", "weekly", 0.85),
    ...localizedEntry("/shop/kitchen", "weekly", 0.85),
    ...localizedEntry("/shop/hardware", "weekly", 0.85),
    ...localizedEntry("/artisanal", "weekly", 0.8),
    ...localizedEntry("/brands", "monthly", 0.75),
    ...localizedEntry("/our-story", "yearly", 0.6),
    ...localizedEntry("/projects", "monthly", 0.75),
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

  // Project detail pages
  const projectRoutes: MetadataRoute.Sitemap = PROJECTS.flatMap(({ slug }) =>
    localizedEntry(`/projects/${slug}`, "monthly", 0.7)
  );

  return [
    ...staticRoutes,
    ...brandRoutes,
    ...subcategoryRoutes,
    ...articleRoutes,
    ...projectRoutes,
  ];
}
