import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/app/components/layout/header";
import { Footer } from "@/app/components/layout/footer";
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

const CATEGORY_TILES = [
  {
    key: "bathroom" as const,
    image: "/images/home/browse-bathroom.webp",
    label: { en: "Bathroom", es: "Baño" },
    sub: { en: "Sinks · Faucets · Tubs · Showers", es: "Lavabos · Grifos · Tinas · Regaderas" },
  },
  {
    key: "kitchen" as const,
    image: "/images/home/browse-kitchen.webp",
    label: { en: "Kitchen", es: "Cocina" },
    sub: { en: "Sinks · Faucets · Range Hoods · Appliances", es: "Tarjas · Grifos · Campanas · Electro" },
  },
  {
    key: "hardware" as const,
    image: "/images/home/browse-hardware.webp",
    label: { en: "Door Hardware", es: "Herrajes" },
    sub: { en: "Locks · Deadbolts · Pulls · Hooks", es: "Chapas · Cerrojos · Jaladeras" },
  },
];

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

  // Pick out marquee-worthy brand names — top 14 by SKU count.
  // brandCounts comes from getQuoteCatalogBrands() (saleable subset only),
  // so its length is the accurate "authorized brands you can specify"
  // figure — distinct from stats.brandCount which counts every brand
  // string in the cache regardless of saleability.
  const marqueeBrands = brandCounts.slice(0, 14);
  const saleableBrandCount = brandCounts.length;

  return (
    <>
      <Header locale={locale} />
      <main id="main" tabIndex={-1} className="pt-16 md:pt-20 bg-brand-linen">
        {/* Editorial Hero — refined, image-anchored */}
        <section className="relative bg-brand-charcoal text-white overflow-hidden">
          {/* Background atmosphere */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: "url('/images/home/browse-bathroom.webp')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-charcoal via-brand-charcoal/95 to-brand-charcoal/70" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-end">
              <div className="lg:col-span-7">
                <span className="font-body font-semibold text-[11px] tracking-[0.3em] text-brand-copper uppercase">
                  {isEs ? "Catálogo completo" : "The Full Catalog"}
                </span>
                <h1 className="mt-4 font-display text-4xl md:text-5xl lg:text-6xl font-light tracking-wide text-white leading-[1.05]">
                  {isEs ? (
                    <>
                      Cada marca autorizada,
                      <br />
                      <span className="italic text-brand-copper">en un solo lugar.</span>
                    </>
                  ) : (
                    <>
                      Every authorized brand,
                      <br />
                      <span className="italic text-brand-copper">in one place.</span>
                    </>
                  )}
                </h1>
                <p className="mt-6 font-body text-base md:text-lg text-white/70 max-w-xl leading-relaxed">
                  {isEs
                    ? `Especifica desde un catálogo de ${stats.total.toLocaleString("es-MX")} piezas. Precio de fábrica. Cotización en 24 horas.`
                    : `Specify from a catalog of ${stats.total.toLocaleString("en-US")} pieces. Factory-direct pricing. 24-hour quotes.`}
                </p>
              </div>

              {/* Stat trio */}
              <div className="lg:col-span-5">
                <div className="grid grid-cols-3 divide-x divide-white/15 border-y border-white/15">
                  <div className="px-4 py-5">
                    <div className="font-display text-3xl md:text-4xl font-light text-white">
                      {saleableBrandCount}
                    </div>
                    <div className="mt-1 font-body text-[10px] tracking-[0.2em] text-white/50 uppercase">
                      {isEs ? "Marcas" : "Brands"}
                    </div>
                  </div>
                  <div className="px-4 py-5">
                    <div className="font-display text-3xl md:text-4xl font-light text-white">
                      {Math.round(stats.total / 1000)}k+
                    </div>
                    <div className="mt-1 font-body text-[10px] tracking-[0.2em] text-white/50 uppercase">
                      {isEs ? "Piezas" : "Pieces"}
                    </div>
                  </div>
                  <div className="px-4 py-5">
                    <div className="font-display text-3xl md:text-4xl font-light text-brand-copper">
                      24h
                    </div>
                    <div className="mt-1 font-body text-[10px] tracking-[0.2em] text-white/50 uppercase">
                      {isEs ? "Cotización" : "Quote"}
                    </div>
                  </div>
                </div>

                <p className="mt-5 font-body text-xs text-white/55 leading-relaxed">
                  {isEs
                    ? "Las piezas en exhibición en el showroom tienen páginas completas. El resto se ordena directo de fábrica al cotizar."
                    : "Pieces on display in the showroom have full detail pages. The rest ships by special order, direct from the manufacturer when you quote."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Category Entry Tiles — three giant doors into the catalog */}
        <section className="bg-brand-linen border-b border-brand-stone/15">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 md:py-14">
            <div className="flex items-baseline justify-between mb-6 md:mb-8">
              <span className="font-body font-semibold text-[11px] tracking-[0.25em] text-brand-copper uppercase">
                {isEs ? "Empieza por categoría" : "Browse by Category"}
              </span>
              <Link
                href={`/${locale}/shop/catalog#catalog`}
                className="font-body text-xs text-brand-charcoal hover:text-brand-copper transition-colors"
              >
                {isEs ? "Ver todo el catálogo →" : "See full catalog →"}
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {CATEGORY_TILES.map((tile) => (
                <Link
                  key={tile.key}
                  href={`/${locale}/shop/catalog?category=${tile.key}#catalog`}
                  className="group relative aspect-[4/5] md:aspect-[3/4] overflow-hidden bg-brand-charcoal"
                >
                  <Image
                    src={tile.image}
                    alt={tile.label[isEs ? "es" : "en"]}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-charcoal via-brand-charcoal/40 to-transparent" />

                  {/* Subtle copper corner accent */}
                  <div className="absolute top-0 left-0 w-16 h-[2px] bg-brand-copper" />
                  <div className="absolute top-0 left-0 w-[2px] h-16 bg-brand-copper" />

                  <div className="absolute inset-x-0 bottom-0 p-5 md:p-7">
                    <h3 className="font-display text-2xl md:text-3xl lg:text-4xl font-light text-white tracking-wide">
                      {tile.label[isEs ? "es" : "en"]}
                    </h3>
                    <p className="mt-2 font-body text-[11px] md:text-xs tracking-wider text-white/70 uppercase">
                      {tile.sub[isEs ? "es" : "en"]}
                    </p>
                    <div className="mt-4 inline-flex items-center gap-2 font-body text-xs font-medium text-brand-copper uppercase tracking-[0.15em]">
                      {isEs ? "Explorar" : "Explore"}
                      <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Brand Marquee — typographic moment showing the breadth */}
        {marqueeBrands.length > 0 && (
          <section className="bg-dash-surface border-b border-brand-stone/15">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-10">
              <div className="flex items-baseline justify-between mb-4">
                <span className="font-body font-semibold text-[11px] tracking-[0.25em] text-brand-copper uppercase">
                  {isEs ? `${saleableBrandCount} marcas autorizadas` : `${saleableBrandCount} authorized brands`}
                </span>
                <Link
                  href={`/${locale}/brands`}
                  className="font-body text-xs text-dash-text-secondary hover:text-brand-copper transition-colors hidden sm:inline"
                >
                  {isEs ? "Sobre las marcas →" : "About the brands →"}
                </Link>
              </div>
              <div className="flex flex-wrap gap-x-6 md:gap-x-8 gap-y-2.5 items-baseline">
                {marqueeBrands.map((b, i) => (
                  <Link
                    key={b.brand}
                    href={`/${locale}/shop/catalog?brand=${encodeURIComponent(b.brand)}#catalog`}
                    className="group inline-flex items-baseline gap-1.5"
                  >
                    <span className="font-display text-lg md:text-xl text-brand-charcoal group-hover:text-brand-copper transition-colors">
                      {b.brand}
                    </span>
                    <span className="font-body text-[10px] text-dash-text-muted tabular-nums">
                      {b.count.toLocaleString()}
                    </span>
                    {i < marqueeBrands.length - 1 && (
                      <span className="text-brand-stone/40 ml-3 hidden md:inline">·</span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <div id="catalog" className="scroll-mt-24" />
        <CatalogView
          locale={locale as "en" | "es"}
          brandCounts={brandCounts}
          totalProducts={stats.total}
        />
      </main>
      <Footer locale={locale} />
      <ProjectListBar locale={locale as "en" | "es"} />
    </>
  );
};

export default CatalogPage;
