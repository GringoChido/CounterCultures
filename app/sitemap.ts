import type { MetadataRoute } from "next";
import { BRANDS } from "@/app/lib/constants";

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
    ...localizedEntry("/shop/bathroom", "weekly", 0.8),
    ...localizedEntry("/shop/kitchen", "weekly", 0.8),
    ...localizedEntry("/shop/hardware", "weekly", 0.8),
    ...localizedEntry("/artisanal", "weekly", 0.8),
    ...localizedEntry("/brands", "monthly", 0.7),
    ...localizedEntry("/our-story", "yearly", 0.6),
    ...localizedEntry("/projects", "monthly", 0.7),
    ...localizedEntry("/blog", "weekly", 0.7),
    ...localizedEntry("/showroom", "yearly", 0.6),
    ...localizedEntry("/contact", "yearly", 0.6),
    ...localizedEntry("/trade", "monthly", 0.7),
  ];

  const brandRoutes: MetadataRoute.Sitemap = BRANDS.flatMap(({ slug }) =>
    localizedEntry(`/brands/${slug}`, "monthly", 0.6)
  );

  return [...staticRoutes, ...brandRoutes];
}
