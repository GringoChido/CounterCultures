import type { Metadata } from "next";
import { Header } from "@/app/components/layout/header";
import { Footer } from "@/app/components/layout/footer";
import { ArtisanProfiles } from "@/app/components/sections/artisan-profiles";
import {
  getQuoteCatalogBrands,
  getCatalogStats,
} from "@/app/lib/products-full";
import { CatalogView } from "./catalog-view";
import { ProjectListBar } from "./project-list-bar";

export const dynamic = "force-dynamic";

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
    getQuoteCatalogBrands(),
    statsPromise,
  ]);

  // brandCounts comes from getQuoteCatalogBrands() (saleable subset only),
  // so its length is the accurate "authorized brands you can specify" figure.
  const saleableBrandCount = brandCounts.length;

  return (
    <>
      <Header locale={locale} />
      <main id="main" tabIndex={-1} className="pt-16 md:pt-20 bg-brand-linen">
        {/* Slim utility header — the page is a tool, not a marketing page.
            The homepage already sells the catalog; here we just orient and
            get out of the way of the search interface below. */}
        <section className="bg-brand-linen border-b border-brand-stone/20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-7 md:py-9">
            <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
              <div className="min-w-0">
                <span className="font-body font-semibold text-[11px] tracking-[0.3em] text-brand-copper uppercase">
                  {isEs ? "Catálogo completo" : "The Full Catalog"}
                </span>
                <h1 className="mt-2 font-display text-3xl md:text-4xl lg:text-[2.6rem] font-light text-brand-charcoal tracking-wide leading-[1.1]">
                  {isEs ? (
                    <>
                      <span className="tabular-nums">{stats.total.toLocaleString("es-MX")}</span>{" "}
                      <span className="italic text-brand-copper">piezas</span>
                      <span className="text-brand-charcoal/40"> · </span>
                      <span className="tabular-nums">{saleableBrandCount}</span> marcas
                    </>
                  ) : (
                    <>
                      <span className="tabular-nums">{stats.total.toLocaleString("en-US")}</span>{" "}
                      <span className="italic text-brand-copper">pieces</span>
                      <span className="text-brand-charcoal/40"> · </span>
                      <span className="tabular-nums">{saleableBrandCount}</span> brands
                    </>
                  )}
                </h1>
              </div>
              <p className="font-body text-[11px] md:text-xs text-dash-text-secondary uppercase tracking-[0.18em] shrink-0">
                {isEs
                  ? "Precio de fábrica · Cotización en 24h"
                  : "Factory pricing · 24h quotes"}
              </p>
            </div>
          </div>
        </section>

        <div id="catalog" className="scroll-mt-24" />
        <CatalogView
          locale={locale as "en" | "es"}
          brandCounts={brandCounts}
          totalProducts={stats.total}
        />
      </main>
      <ArtisanProfiles locale={locale as "en" | "es"} />
      <Footer locale={locale} />
      <ProjectListBar locale={locale as "en" | "es"} />
    </>
  );
};

export default CatalogPage;
