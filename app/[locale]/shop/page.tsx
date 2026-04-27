import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/app/components/layout/header";
import { Footer } from "@/app/components/layout/footer";
import { ShopByRoom } from "@/app/components/sections/shop-by-room";
import { HowItWorksBand } from "@/app/components/sections/how-it-works-band";
import { HeroSearch } from "./hero-search";
import { FeaturedBrandsBand } from "./featured-brands-band";
import { getCatalogStats, getBrandCounts } from "@/app/lib/products-full";
import { getBrands } from "@/app/lib/brand-kit-sheets";

export const revalidate = 300;

const BASE_URL = "https://countercultures.mx";

interface ShopPageProps {
  params: Promise<{ locale: string }>;
}

export const generateMetadata = async ({
  params,
}: ShopPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const isEs = locale === "es";

  const title = isEs
    ? "Tienda — Accesorios de Baño, Cocina y Herrajes"
    : "Shop — Bath, Kitchen & Hardware Fixtures";
  const description = isEs
    ? "Explora nuestra colección de accesorios de lujo para baño, cocina y herrajes de Kohler, TOTO, Brizo, BLANCO, Sun Valley Bronze y artesanos mexicanos."
    : "Browse our curated collection of luxury bath, kitchen, and door hardware fixtures from Kohler, TOTO, Brizo, BLANCO, Sun Valley Bronze, and Mexican artisans.";

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/${locale}/shop`,
      languages: {
        en: `${BASE_URL}/en/shop`,
        es: `${BASE_URL}/es/shop`,
        "x-default": `${BASE_URL}/en/shop`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}/shop`,
      locale: isEs ? "es_MX" : "en_US",
      alternateLocale: isEs ? "en_US" : "es_MX",
      type: "website",
      images: [
        {
          url: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1200&q=80",
          width: 1200,
          height: 630,
          alt: isEs
            ? "Tienda Counter Cultures — accesorios de lujo para baño, cocina y herrajes"
            : "Counter Cultures Shop — luxury bath, kitchen and hardware fixtures",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1200&q=80"],
    },
  };
};

// Flagship brands spotlighted in the Featured Brands band (ordered).
const FLAGSHIP_SLUGS = [
  "brizo",
  "kohler",
  "toto",
  "california-faucets",
  "blanco",
  "emtek",
  "sun-valley-bronze",
  "badeloft",
];

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

const ShopPage = async ({ params }: ShopPageProps) => {
  const { locale } = await params;
  const isEs = locale === "es";
  const lang = locale as "en" | "es";

  const [fullStats, brandCounts, allBrands] = await Promise.all([
    getCatalogStats().catch(() => ({ total: 0, brandCount: 0 })),
    getBrandCounts().catch(() => []),
    getBrands().catch(() => []),
  ]);

  // Build featured brand cards: flagship slug order + catalog counts + hero
  const brandByslug = new Map(allBrands.map((b) => [b.slug, b]));
  const countByName = new Map(
    brandCounts.map((b) => [b.brand.toLowerCase(), b.count])
  );
  const featuredBrands = FLAGSHIP_SLUGS.flatMap((slug) => {
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

  // Top brands by catalog depth — used in the brand-activity leaderboard.
  // Slim, data-driven, no product cards.
  const topBrands = brandCounts
    .filter((b) => b.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  const numFmt = isEs ? "es-MX" : "en-US";

  // BreadcrumbList JSON-LD
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: isEs ? "Inicio" : "Home",
        item: `${BASE_URL}/${locale}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: isEs ? "Tienda" : "Shop",
        item: `${BASE_URL}/${locale}/shop`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Header locale={locale} />
      <main className="pt-16 md:pt-20">
        {/* Hero with search */}
        <section className="py-14 md:py-24 bg-brand-linen border-b border-brand-stone/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <span className="font-body font-semibold text-[11px] tracking-[0.25em] text-brand-stone uppercase">
              {isEs ? "La Colección" : "The Collection"}
            </span>
            <h1 className="mt-3 font-display text-4xl md:text-6xl font-light tracking-wide text-brand-charcoal leading-[1.05] max-w-4xl">
              {isEs ? (
                <>
                  La cocina, el baño y el herraje{" "}
                  <span className="italic text-brand-copper">
                    que los arquitectos realmente especifican.
                  </span>
                </>
              ) : (
                <>
                  The kitchen, bath, and hardware{" "}
                  <span className="italic text-brand-copper">
                    architects actually specify.
                  </span>
                </>
              )}
            </h1>
            <p className="mt-5 font-body text-base md:text-lg text-brand-stone max-w-2xl leading-relaxed">
              {isEs
                ? "Piezas seleccionadas a mano para nuestro showroom en San Miguel, más el catálogo autorizado completo de cada marca que manejamos. Precio de fábrica. Cotización en 24 horas."
                : "Hand-picked fixtures for our San Miguel showroom, plus the full authorized catalog from every brand we carry. Factory-direct pricing. 24-hour quotes."}
            </p>
            {fullStats.total > 0 && (
              <HeroSearch
                locale={lang}
                catalogSize={fullStats.total}
              />
            )}
          </div>
        </section>

        {/* Browse by Category — primary navigation block */}
        <ShopByRoom locale={lang} />

        {/* Featured Brands band — flagship logos, brand entry points */}
        <FeaturedBrandsBand locale={lang} brands={featuredBrands} />

        {/* Brand activity — data-driven mini-leaderboard, no product cards */}
        {topBrands.length > 0 && (
          <section className="py-14 md:py-20 bg-white border-y border-brand-stone/10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="grid lg:grid-cols-[1fr_2fr] gap-8 lg:gap-12 items-start">
                <div className="lg:sticky lg:top-24">
                  <p className="font-body font-semibold text-[11px] tracking-[0.25em] text-brand-copper uppercase">
                    {isEs ? "Profundidad del catálogo" : "Catalog depth"}
                  </p>
                  <h2 className="mt-3 font-display text-3xl md:text-4xl font-light tracking-wide text-brand-charcoal leading-[1.1]">
                    {isEs
                      ? "Las marcas más profundas en nuestro catálogo."
                      : "The brands we go deepest on."}
                  </h2>
                  <p className="mt-4 font-body text-sm md:text-base text-brand-stone max-w-md leading-relaxed">
                    {isEs
                      ? `Por cantidad de SKUs autorizados disponibles para especificar. Empieza con cualquiera de estas marcas o busca el catálogo completo de ${fullStats.total.toLocaleString(numFmt)} piezas.`
                      : `By number of authorized SKUs available to specify. Start with any of these or search the full ${fullStats.total.toLocaleString(numFmt)}-piece catalog.`}
                  </p>
                  <Link
                    href={`/${locale}/shop/catalog`}
                    className="mt-6 inline-flex items-center gap-2 font-body text-sm font-semibold tracking-wide text-brand-copper hover:text-brand-charcoal transition-colors"
                  >
                    {isEs ? "Abrir catálogo completo" : "Open full catalog"} →
                  </Link>
                </div>

                <ol className="divide-y divide-brand-stone/10 border-y border-brand-stone/15">
                  {topBrands.map((b, i) => {
                    const slug = brandCounts.find(
                      (bc) => bc.brand === b.brand
                    )
                      ? allBrands.find(
                          (br) => br.name.toLowerCase() === b.brand.toLowerCase()
                        )?.slug
                      : null;
                    const href = slug
                      ? `/${locale}/brands/${slug}`
                      : `/${locale}/shop/catalog?brand=${encodeURIComponent(b.brand)}`;
                    return (
                      <li key={b.brand}>
                        <Link
                          href={href}
                          className="group flex items-baseline justify-between gap-4 py-4 hover:bg-brand-linen/40 -mx-4 px-4 transition-colors"
                        >
                          <div className="flex items-baseline gap-4 min-w-0">
                            <span className="font-mono text-xs text-brand-stone w-6 shrink-0 tabular-nums">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <span className="font-display text-xl md:text-2xl font-light text-brand-charcoal group-hover:text-brand-copper transition-colors truncate">
                              {b.brand}
                            </span>
                          </div>
                          <span className="font-mono text-sm text-brand-stone tabular-nums shrink-0">
                            {b.count.toLocaleString(numFmt)}{" "}
                            <span className="text-[10px] tracking-[0.2em] uppercase ml-1">
                              {isEs ? "SKUs" : "SKUs"}
                            </span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </div>
          </section>
        )}

        {/* How it works — operational promise */}
        <HowItWorksBand locale={lang} variant="light" />

        {/* Two conversion paths — Showroom visit + Trade program */}
        <section className="py-14 md:py-20 bg-brand-charcoal text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-px bg-white/10">
              <Link
                href={`/${locale}/showroom`}
                className="group bg-brand-charcoal p-8 md:p-12 hover:bg-brand-charcoal/80 transition-colors"
              >
                <p className="font-body font-semibold text-[11px] tracking-[0.25em] text-brand-copper uppercase mb-3">
                  {isEs ? "Visítanos" : "Visit us"}
                </p>
                <h3 className="font-display text-2xl md:text-4xl font-light tracking-wide leading-tight mb-4">
                  {isEs
                    ? "Conoce el showroom en San Miguel."
                    : "Visit the San Miguel showroom."}
                </h3>
                <p className="font-body text-sm md:text-base text-white/70 leading-relaxed mb-6 max-w-md">
                  {isEs
                    ? "Acabados, dimensiones y combinaciones que es difícil decidir desde una pantalla. Lunes a viernes, en Providencia."
                    : "Finishes, dimensions, and combinations are hard to commit to from a screen. Monday–Friday, in Providencia."}
                </p>
                <span className="inline-flex items-center gap-2 font-body text-sm font-semibold tracking-wide text-brand-copper group-hover:text-white transition-colors">
                  {isEs ? "Cómo llegar" : "Get directions"} →
                </span>
              </Link>

              <Link
                href={`/${locale}/trade`}
                className="group bg-brand-charcoal p-8 md:p-12 hover:bg-brand-charcoal/80 transition-colors"
              >
                <p className="font-body font-semibold text-[11px] tracking-[0.25em] text-brand-copper uppercase mb-3">
                  {isEs ? "Para arquitectos y diseñadores" : "For architects & designers"}
                </p>
                <h3 className="font-display text-2xl md:text-4xl font-light tracking-wide leading-tight mb-4">
                  {isEs
                    ? "Programa Trade — precios y soporte de especificación."
                    : "Trade Program — pricing and specification support."}
                </h3>
                <p className="font-body text-sm md:text-base text-white/70 leading-relaxed mb-6 max-w-md">
                  {isEs
                    ? "Precios trade en las 19 marcas autorizadas, gerente de cuenta dedicado, presentaciones privadas para clientes. Aprobación en 48 horas."
                    : "Trade pricing across 19 authorized brands, a dedicated account manager, and private client presentations. Approval within 48 hours."}
                </p>
                <span className="inline-flex items-center gap-2 font-body text-sm font-semibold tracking-wide text-brand-copper group-hover:text-white transition-colors">
                  {isEs ? "Solicitar acceso" : "Apply for access"} →
                </span>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer locale={locale} />
    </>
  );
};

export default ShopPage;
