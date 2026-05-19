import type { Metadata } from "next";
import { readdirSync } from "node:fs";
import path from "node:path";
import Image from "next/image";
import { Header } from "@/app/components/layout/header";
import { Footer } from "@/app/components/layout/footer";
import { ArtisanProfiles } from "@/app/components/sections/artisan-profiles";
import {
  getCatalogBrands,
  getCatalogStats,
  searchProducts,
  type SearchResult,
} from "@/app/lib/products-full";
import {
  getMostSpecifiedScores,
  getInShowroomIds,
} from "@/app/lib/catalog-signals";
import { CatalogView } from "./catalog-view";

export const revalidate = 1800;

const BASE_URL = "https://countercultures.mx";

interface CatalogPageProps {
  params: Promise<{ locale: string }>;
}

export const generateMetadata = async ({
  params,
}: CatalogPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const isEs = locale === "es";
  return {
    title: isEs
      ? "Catálogo completo — Counter Cultures"
      : "Full Catalog — Counter Cultures",
    description: isEs
      ? "Explora más de 350,000 piezas de Brizo, Kohler, TOTO, Emtek, Blanco, California Faucets, Sun Valley Bronze y más. Cotización directa en 24 horas."
      : "Explore 350,000+ fixtures from Brizo, Kohler, TOTO, Emtek, Blanco, California Faucets, Sun Valley Bronze and more. Direct quotes within 24 hours.",
    alternates: {
      canonical: `${BASE_URL}/${locale}/shop/catalog`,
      languages: {
        en: `${BASE_URL}/en/shop/catalog`,
        es: `${BASE_URL}/es/shop/catalog`,
        "x-default": `${BASE_URL}/en/shop/catalog`,
      },
    },
    robots: { index: false, follow: true },
  };
};

const STATS_FALLBACK = { total: 350000, brandCount: 73 };

const raceWithFallback = <T,>(p: Promise<T>, ms: number, fallback: T): Promise<T> =>
  Promise.race([
    p.catch(() => fallback),
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);

// Map brand display names to their hero image in /public/Assets/BRANDS/.
// Files follow the pattern `{slug}-hero.{webp|avif|jpg|jpeg|png}`. Prefer
// modern formats. Brands without a matching hero image just won't get one
// (the brand tile falls back to its solid theme color).
const buildBrandImageMap = (brandNames: string[]): Record<string, string> => {
  let files: string[] = [];
  try {
    const dir = path.join(process.cwd(), "public", "Assets", "BRANDS");
    files = readdirSync(dir);
  } catch {
    return {};
  }

  const formatRank = [".webp", ".avif", ".jpg", ".jpeg", ".png"];
  const slugToFile: Record<string, string> = {};
  for (const file of files) {
    const m = file.match(/^(.+?)-hero\.([^.]+)$/);
    if (!m) continue;
    const [, slug, ext] = m;
    const newRank = formatRank.indexOf(`.${ext.toLowerCase()}`);
    if (newRank === -1) continue;
    const existing = slugToFile[slug];
    const existingRank = existing
      ? formatRank.indexOf(path.extname(existing).toLowerCase())
      : 999;
    if (newRank < existingRank) {
      slugToFile[slug] = `/Assets/BRANDS/${file}`;
    }
  }

  const result: Record<string, string> = {};
  for (const name of brandNames) {
    const slug = name
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/\+/g, " and ")
      .replace(/'/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    if (slugToFile[slug]) {
      result[name] = slugToFile[slug];
    }
  }
  return result;
};

const CatalogPage = async ({ params }: CatalogPageProps) => {
  const { locale } = await params;
  const isEs = locale === "es";
  const statsPromise = Promise.race([
    getCatalogStats().catch(() => STATS_FALLBACK),
    new Promise<typeof STATS_FALLBACK>((resolve) =>
      setTimeout(() => resolve(STATS_FALLBACK), 1000)
    ),
  ]);
  const [brandCounts, stats] = await Promise.all([
    raceWithFallback(getCatalogBrands(), 2000, []),
    statsPromise,
  ]);

  const saleableBrandCount = brandCounts.length || STATS_FALLBACK.brandCount;

  const brandImageMap = buildBrandImageMap(brandCounts.map((b) => b.brand));

  let initialResult: SearchResult | null = null;
  {
    try {
      const [specScores, showroomIds] = await Promise.all([
        Promise.race([
          getMostSpecifiedScores(),
          new Promise<null>((r) => setTimeout(() => r(null), 2000)),
        ]).catch(() => null),
        Promise.race([
          getInShowroomIds(),
          new Promise<null>((r) => setTimeout(() => r(null), 2000)),
        ]).catch(() => null),
      ]);
      initialResult = await searchProducts({
        sort: "most_specified",
        limit: 60,
        specScores: specScores && specScores.size > 0 ? specScores : undefined,
        inShowroomIds: showroomIds && showroomIds.size > 0 ? showroomIds : undefined,
      });
    } catch { /* client-side fetch handles it */ }
  }

  return (
    <>
      <Header />
      <main id="main" tabIndex={-1} className="bg-brand-linen">
        {/* HERO — full-bleed editorial header */}
        <section className="relative min-h-[60vh] md:min-h-[70vh] flex items-end overflow-hidden bg-brand-charcoal">
          <Image
            src="/Assets/home-hero/Lux BathRoom.webp"
            alt={
              isEs
                ? "Catálogo completo Counter Cultures — accesorios de lujo en San Miguel de Allende"
                : "Counter Cultures full catalog — luxury fixtures in San Miguel de Allende"
            }
            fill
            sizes="100vw"
            priority
            className="object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-charcoal via-brand-charcoal/40 to-brand-charcoal/10" />
          <div className="relative mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 pt-32 pb-14 md:pb-20">
            <span className="font-body font-semibold text-xs tracking-[0.3em] text-brand-copper uppercase">
              {isEs ? "Catálogo completo" : "The Full Catalog"}
            </span>
            <h1 className="mt-4 font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-white leading-[1.05] tracking-wide">
              {isEs ? (
                <>
                  <span className="tabular-nums">
                    {stats.total.toLocaleString("es-MX")}
                  </span>{" "}
                  <span className="italic text-brand-copper">piezas</span>
                  <span className="text-white/40"> · </span>
                  <span className="tabular-nums">{saleableBrandCount}</span>{" "}
                  marcas
                </>
              ) : (
                <>
                  <span className="tabular-nums">
                    {stats.total.toLocaleString("en-US")}
                  </span>{" "}
                  <span className="italic text-brand-copper">pieces</span>
                  <span className="text-white/40"> · </span>
                  <span className="tabular-nums">{saleableBrandCount}</span>{" "}
                  brands
                </>
              )}
            </h1>
            <p className="mt-6 font-body text-xs md:text-sm text-white/70 tracking-[0.22em] uppercase">
              {isEs
                ? "Precio de fábrica · Cotización en 24 h"
                : "Factory pricing · 24h quotes"}
            </p>
          </div>
        </section>

        <div id="catalog" className="scroll-mt-24" />
        <CatalogView
          locale={locale as "en" | "es"}
          brandCounts={brandCounts}
          totalProducts={stats.total}
          brandImageMap={brandImageMap}
          initialResult={initialResult}
        />
      </main>
      <ArtisanProfiles locale={locale as "en" | "es"} />
      <Footer />
    </>
  );
};

export default CatalogPage;
