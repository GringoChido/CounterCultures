import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/app/components/layout/header";
import { Footer } from "@/app/components/layout/footer";
import { ProductVisual } from "@/app/components/product-visual";
import { getBrandBySlug, getBrands } from "@/app/lib/brand-kit-sheets";
import { getFallbackBrand } from "@/app/lib/brand-fallbacks";
import {
  getBrandCategorySummary,
  getBrandCategoryCombos,
  type ProductCategory,
} from "@/app/lib/products-full";
import {
  getMostSpecifiedScores,
  getInShowroomIds,
} from "@/app/lib/catalog-signals";
import { ArrowUpRight } from "lucide-react";
import { SpecifiedBadge, ShowroomBadge } from "@/app/components/catalog/spec-badge";

import { SITE_URL } from "@/app/lib/seo";

const BASE_URL = SITE_URL;

const VALID_CATEGORIES = ["bathroom", "kitchen", "hardware"] as const;
type CategoryParam = (typeof VALID_CATEGORIES)[number];

const isValidCategory = (c: string): c is CategoryParam =>
  (VALID_CATEGORIES as readonly string[]).includes(c);

const CATEGORY_COPY = {
  bathroom: {
    en: {
      label: "Bathroom",
      seoTitle: (brand: string) => `${brand} Bathroom Fixtures`,
      headline: (brand: string) => `${brand} for the bath.`,
      description: (brand: string, n: number) =>
        `Every authorized ${brand} bathroom piece — ${n.toLocaleString()} fixtures across faucets, showers, sinks, tubs, and accessories. Factory-direct pricing, quotes within 24 hours.`,
    },
    es: {
      label: "Baño",
      seoTitle: (brand: string) => `Accesorios ${brand} para Baño`,
      headline: (brand: string) => `${brand} para el baño.`,
      description: (brand: string, n: number) =>
        `Cada pieza ${brand} autorizada para baño — ${n.toLocaleString()} accesorios entre grifería, regaderas, lavabos, tinas y complementos. Precio directo de fábrica, cotización en 24 horas.`,
    },
  },
  kitchen: {
    en: {
      label: "Kitchen",
      seoTitle: (brand: string) => `${brand} Kitchen Fixtures`,
      headline: (brand: string) => `${brand} for the kitchen.`,
      description: (brand: string, n: number) =>
        `${n.toLocaleString()} authorized ${brand} kitchen pieces — faucets, sinks, prep stations, and pull-down sprays. Factory-direct pricing, quotes within 24 hours.`,
    },
    es: {
      label: "Cocina",
      seoTitle: (brand: string) => `Accesorios ${brand} para Cocina`,
      headline: (brand: string) => `${brand} para la cocina.`,
      description: (brand: string, n: number) =>
        `${n.toLocaleString()} piezas ${brand} autorizadas para cocina — grifería, fregaderos, estaciones de preparación y duchas extensibles. Precio directo de fábrica, cotización en 24 horas.`,
    },
  },
  hardware: {
    en: {
      label: "Hardware",
      seoTitle: (brand: string) => `${brand} Door & Cabinet Hardware`,
      headline: (brand: string) => `${brand} hardware.`,
      description: (brand: string, n: number) =>
        `${n.toLocaleString()} ${brand} hardware pieces — door levers, cabinet pulls, knobs, hinges, and finishing details. Authorized dealer in San Miguel de Allende.`,
    },
    es: {
      label: "Herrajes",
      seoTitle: (brand: string) => `Herrajes ${brand} para Puertas y Gabinetes`,
      headline: (brand: string) => `Herrajes ${brand}.`,
      description: (brand: string, n: number) =>
        `${n.toLocaleString()} piezas de herrajes ${brand} — manijas, jaladeras, perillas, bisagras y detalles de acabado. Distribuidor autorizado en San Miguel de Allende.`,
    },
  },
} as const;

// Revalidate every 5 min so Roger's catalog refreshes flow through without
// a redeploy. New brand × category combos appear automatically.
export const revalidate = 300;
export const dynamicParams = true;

interface PageProps {
  params: Promise<{ slug: string; category: string; locale: string }>;
}

export const generateStaticParams = async () => {
  // Source of truth for slug ↔ brand-name mapping is the Brand Kit sheet.
  // Cross-reference with catalog combos so we only emit params for brands we
  // actually carry inventory for in that category (≥10-product threshold).
  const [brands, combos] = await Promise.all([
    getBrands(),
    getBrandCategoryCombos(10),
  ]);
  const slugByName = new Map(brands.map((b) => [b.name, b.slug]));
  const out: Array<{ slug: string; category: string }> = [];
  for (const c of combos) {
    const slug = slugByName.get(c.brand);
    if (!slug) continue;
    out.push({ slug, category: c.category });
  }
  return out;
};

export const generateMetadata = async ({
  params,
}: PageProps): Promise<Metadata> => {
  const { slug, category, locale } = await params;
  if (!isValidCategory(category)) return { title: "Not Found" };
  const brand = (await getBrandBySlug(slug)) ?? getFallbackBrand(slug);
  if (!brand) return { title: "Not Found" };

  const isEs = locale === "es";
  const copy = CATEGORY_COPY[category][isEs ? "es" : "en"];
  const summary = await getBrandCategorySummary(brand.name, category, { limit: 1 });
  if (summary.count < 1) {
    return {
      title: isEs
        ? `${brand.name} ${copy.label} — Counter Cultures`
        : `${brand.name} ${copy.label} — Counter Cultures`,
      robots: { index: false },
    };
  }

  const title = isEs
    ? `${copy.seoTitle(brand.name)} — Counter Cultures`
    : `${copy.seoTitle(brand.name)} — Counter Cultures`;
  const description = copy.description(brand.name, summary.count);

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/${locale}/brands/${slug}/${category}`,
      languages: {
        en: `${BASE_URL}/en/brands/${slug}/${category}`,
        es: `${BASE_URL}/es/brands/${slug}/${category}`,
        "x-default": `${BASE_URL}/en/brands/${slug}/${category}`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}/brands/${slug}/${category}`,
      locale: isEs ? "es_MX" : "en_US",
      alternateLocale: isEs ? "en_US" : "es_MX",
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
  };
};

const formatPrice = (p: number, cur: string, locale: string) =>
  p > 0
    ? `${cur} ${p.toLocaleString(locale === "es" ? "es-MX" : "en-US", {
        maximumFractionDigits: 0,
      })}`
    : "—";

const BrandCategoryPage = async ({ params }: PageProps) => {
  const { slug, category, locale } = await params;
  if (!isValidCategory(category)) notFound();
  const brand = (await getBrandBySlug(slug)) ?? getFallbackBrand(slug);
  if (!brand) notFound();

  const isEs = locale === "es";
  const copy = CATEGORY_COPY[category][isEs ? "es" : "en"];

  // Check product count FIRST — avoids expensive signal fetches for empty combos
  // and prevents 500s when signal sheets are unavailable.
  const quickCheck = await getBrandCategorySummary(brand.name, category as ProductCategory, { limit: 1 });
  if (quickCheck.count === 0) {
    return (
      <>
        <Header />
        <main id="main" tabIndex={-1} className="pt-16 md:pt-20 lg:pt-[116px] bg-dash-surface">
          <section className="bg-brand-linen border-b border-brand-stone/10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-20">
              <nav
                className="flex items-center gap-2 text-[11px] tracking-[0.18em] uppercase text-dash-text-secondary font-body mb-6"
                aria-label="Breadcrumb"
              >
                <Link href={`/${locale}/brands`} className="hover:text-brand-copper">
                  {isEs ? "Marcas" : "Brands"}
                </Link>
                <span aria-hidden>/</span>
                <Link href={`/${locale}/brands/${slug}`} className="hover:text-brand-copper">
                  {brand.name}
                </Link>
                <span aria-hidden>/</span>
                <span className="text-brand-charcoal">{copy.label}</span>
              </nav>
              <span className="font-body font-semibold text-[11px] tracking-[0.25em] text-brand-copper uppercase">
                {isEs ? "Distribuidor Autorizado" : "Authorized Dealer"} · {copy.label}
              </span>
              <h1 className="mt-3 font-display text-4xl md:text-5xl font-light tracking-wide text-brand-charcoal leading-[1.05]">
                {isEs
                  ? `Aún no manejamos ${brand.name} en ${copy.label.toLowerCase()}.`
                  : `We don't carry ${brand.name} in ${copy.label.toLowerCase()} yet.`}
              </h1>
              <p className="mt-5 font-body text-[15px] md:text-base text-dash-text-secondary max-w-xl leading-relaxed">
                {isEs
                  ? `Estamos ampliando nuestra selección de ${brand.name}. Contáctanos si necesitas una pieza específica — podemos cotizarla directo de fábrica.`
                  : `We're expanding our ${brand.name} selection. Contact us if you need a specific piece — we can quote it direct from the factory.`}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={`/${locale}/brands/${slug}`}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-charcoal text-white font-body font-semibold text-sm tracking-wide hover:bg-brand-charcoal/90 transition-colors"
                >
                  {isEs ? `Ver todos los productos de ${brand.name}` : `View all ${brand.name} products`} →
                </Link>
                <Link
                  href={`/${locale}/shop/${category}`}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-brand-charcoal text-brand-charcoal font-body font-medium text-sm tracking-wide hover:bg-brand-charcoal hover:text-white transition-colors"
                >
                  {isEs ? `Explorar ${copy.label.toLowerCase()}` : `Browse all ${copy.label.toLowerCase()}`}
                </Link>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  // Pull signals once and pass into the summary for ranking + decoration
  const [specScores, inShowroomIds] = await Promise.all([
    getMostSpecifiedScores(),
    getInShowroomIds(),
  ]);
  const summary = await getBrandCategorySummary(brand.name, category as ProductCategory, {
    limit: 36,
    specScores,
    inShowroomIds,
  });

  const otherCategories = (["bathroom", "kitchen", "hardware"] as const).filter(
    (c) => c !== category
  );
  const otherCounts = await Promise.all(
    otherCategories.map(async (c) => ({
      category: c,
      count: (await getBrandCategorySummary(brand.name, c, { limit: 1 })).count,
    }))
  );

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
        name: isEs ? "Marcas" : "Brands",
        item: `${BASE_URL}/${locale}/brands`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: brand.name,
        item: `${BASE_URL}/${locale}/brands/${slug}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: copy.label,
        item: `${BASE_URL}/${locale}/brands/${slug}/${category}`,
      },
    ],
  };

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${BASE_URL}/${locale}/brands/${slug}/${category}`,
    name: copy.seoTitle(brand.name),
    description: copy.description(brand.name, summary.count),
    url: `${BASE_URL}/${locale}/brands/${slug}/${category}`,
    isPartOf: {
      "@type": "WebSite",
      name: "Counter Cultures",
      url: BASE_URL,
    },
    about: {
      "@type": "Brand",
      name: brand.name,
      url: `${BASE_URL}/${locale}/brands/${slug}`,
    },
    mainEntity: {
      "@type": "ItemList",
      name: copy.seoTitle(brand.name),
      numberOfItems: summary.count,
      itemListElement: summary.products.slice(0, 24).map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: p.name || p.sku,
        item: {
          "@type": "Product",
          name: p.name || p.sku,
          sku: p.sku,
          brand: { "@type": "Brand", name: brand.name },
          category: copy.label,
          ...(p.listPrice > 0 && {
            offers: {
              "@type": "Offer",
              priceCurrency: p.currency,
              price: p.listPrice,
              availability: p.inShowroom
                ? "https://schema.org/InStock"
                : "https://schema.org/PreOrder",
            },
          }),
        },
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <Header />
      <main id="main" tabIndex={-1} className="pt-16 md:pt-20 lg:pt-[116px] bg-dash-surface">
        {/* Editorial hero */}
        <section className="bg-brand-linen border-b border-brand-stone/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-20">
            <nav
              className="flex items-center gap-2 text-[11px] tracking-[0.18em] uppercase text-dash-text-secondary font-body mb-6"
              aria-label="Breadcrumb"
            >
              <Link href={`/${locale}/brands`} className="hover:text-brand-copper">
                {isEs ? "Marcas" : "Brands"}
              </Link>
              <span aria-hidden>/</span>
              <Link
                href={`/${locale}/brands/${slug}`}
                className="hover:text-brand-copper"
              >
                {brand.name}
              </Link>
              <span aria-hidden>/</span>
              <span className="text-brand-charcoal">{copy.label}</span>
            </nav>
            <div className="grid lg:grid-cols-[1.6fr_1fr] gap-8 items-end">
              <div>
                <span className="font-body font-semibold text-[11px] tracking-[0.25em] text-brand-copper uppercase">
                  {isEs ? "Distribuidor Autorizado" : "Authorized Dealer"} · {copy.label}
                </span>
                <h1 className="mt-3 font-display text-4xl md:text-6xl font-light tracking-wide text-brand-charcoal leading-[1.05]">
                  {copy.headline(brand.name)}
                </h1>
                <p
                  className="mt-5 font-body text-[15px] md:text-base text-dash-text-secondary max-w-xl leading-relaxed"
                  data-speakable="description"
                >
                  {copy.description(brand.name, summary.count)}
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href={`/${locale}/shop/catalog?brand=${encodeURIComponent(
                      brand.name
                    )}&category=${category}`}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-charcoal text-white font-body font-semibold text-sm tracking-wide hover:bg-brand-charcoal/90 transition-colors"
                  >
                    {isEs ? "Buscar en el catálogo" : "Search the full catalog"} →
                  </Link>
                  <Link
                    href={`/${locale}/contact?brand=${slug}`}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-brand-charcoal text-brand-charcoal font-body font-medium text-sm tracking-wide hover:bg-brand-charcoal hover:text-white transition-colors"
                  >
                    {isEs ? "Contáctanos" : "Contact Us"}
                  </Link>
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="grid grid-cols-3 gap-2 text-xs font-body">
                  <div className="p-4 bg-dash-surface border border-brand-stone/15">
                    <div className="font-display text-2xl font-light text-brand-charcoal">
                      {summary.count.toLocaleString(isEs ? "es-MX" : "en-US")}
                    </div>
                    <div className="mt-1 text-[10px] tracking-[0.2em] text-dash-text-secondary uppercase">
                      {isEs ? "Piezas" : "Pieces"}
                    </div>
                  </div>
                  <div className="p-4 bg-dash-surface border border-brand-stone/15">
                    <div className="font-display text-2xl font-light text-brand-charcoal">
                      24h
                    </div>
                    <div className="mt-1 text-[10px] tracking-[0.2em] text-dash-text-secondary uppercase">
                      {isEs ? "Respuesta" : "Response"}
                    </div>
                  </div>
                  <div className="p-4 bg-brand-copper text-white">
                    <div className="font-display text-2xl font-light">70%</div>
                    <div className="mt-1 text-[10px] tracking-[0.2em] uppercase">
                      {isEs ? "Anticipo mín." : "Min. deposit"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Product grid — top 36 by spec score */}
        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between gap-4 mb-8">
              <div>
                <p className="font-body text-[11px] tracking-[0.25em] text-dash-text-secondary uppercase">
                  {isEs ? "Selección destacada" : "Featured selection"}
                </p>
                <h2 className="mt-2 font-display text-2xl md:text-3xl font-light text-brand-charcoal">
                  {isEs
                    ? `Más especificados de ${brand.name} en ${copy.label.toLowerCase()}`
                    : `Most specified ${brand.name} in ${copy.label.toLowerCase()}`}
                </h2>
              </div>
              {summary.count > summary.products.length && (
                <Link
                  href={`/${locale}/shop/catalog?brand=${encodeURIComponent(
                    brand.name
                  )}&category=${category}`}
                  className="text-sm font-body text-brand-copper hover:underline whitespace-nowrap"
                >
                  {isEs
                    ? `Ver los ${summary.count.toLocaleString("es-MX")} →`
                    : `View all ${summary.count.toLocaleString("en-US")} →`}
                </Link>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {summary.products.map((p) => (
                <Link
                  key={p.id}
                  href={`/${locale}/shop/catalog?q=${encodeURIComponent(p.sku)}`}
                  className="group bg-dash-surface border border-brand-stone/15 hover:border-brand-copper/60 transition-colors flex flex-col"
                >
                  <div className="relative">
                    <ProductVisual
                      id={p.id}
                      brand={p.brand}
                      sku={p.sku}
                      name={p.name || p.sku}
                      aspect="4/3"
                      size="card"
                      hasImage={p.hasImage}
                      imageSrc={p.imageSrc}
                    />
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <span className="font-body text-[10px] tracking-[0.15em] text-brand-copper uppercase">
                      {p.brand}
                    </span>
                    <h3 className="mt-1 font-body font-medium text-sm text-brand-charcoal line-clamp-2 leading-snug group-hover:text-brand-copper transition-colors">
                      {p.name || p.sku}
                    </h3>
                    <p className="mt-1 font-mono text-[10px] text-dash-text-secondary truncate">
                      {p.sku || "—"}
                    </p>
                    {(p.inShowroom || (p.projectCount ?? 0) >= 2) && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {p.inShowroom && <ShowroomBadge locale={isEs ? "es" : "en"} />}
                        {(p.projectCount ?? 0) >= 2 && (
                          <SpecifiedBadge count={p.projectCount!} locale={isEs ? "es" : "en"} />
                        )}
                      </div>
                    )}
                    <div className="mt-3 pt-3 border-t border-brand-stone/10 font-body text-xs text-brand-charcoal">
                      {p.listPrice > 0 ? (
                        <>
                          <span className="text-dash-text-secondary">
                            {isEs ? "desde" : "from"}
                          </span>{" "}
                          <span className="font-medium">
                            {formatPrice(p.listPrice, p.currency, locale)}
                          </span>
                        </>
                      ) : (
                        <span className="text-dash-text-secondary">
                          {isEs ? "Cotización" : "Quote"}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Cross-link to other categories of this brand */}
        {otherCounts.some((c) => c.count > 0) && (
          <section className="py-12 md:py-16 bg-brand-linen border-y border-brand-stone/10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <p className="font-body text-[11px] tracking-[0.25em] text-dash-text-secondary uppercase">
                {isEs ? "Más de" : "More from"} {brand.name}
              </p>
              <h2 className="mt-2 font-display text-2xl md:text-3xl font-light text-brand-charcoal mb-8">
                {isEs
                  ? "Otras categorías especificables"
                  : "Other categories you can specify"}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {otherCounts
                  .filter((c) => c.count > 0)
                  .map(({ category: c, count }) => {
                    const otherCopy = CATEGORY_COPY[c][isEs ? "es" : "en"];
                    return (
                      <Link
                        key={c}
                        href={`/${locale}/brands/${slug}/${c}`}
                        className="group flex items-center justify-between gap-4 p-6 bg-dash-surface border border-brand-stone/15 hover:border-brand-copper transition-colors"
                      >
                        <div>
                          <p className="font-body text-[10px] tracking-[0.2em] text-brand-copper uppercase">
                            {brand.name}
                          </p>
                          <h3 className="mt-1 font-display text-xl text-brand-charcoal group-hover:text-brand-copper transition-colors">
                            {otherCopy.label}
                          </h3>
                          <p className="mt-1 font-body text-xs text-dash-text-secondary">
                            {count.toLocaleString(isEs ? "es-MX" : "en-US")}{" "}
                            {isEs ? "piezas disponibles" : "pieces available"}
                          </p>
                        </div>
                        <ArrowUpRight className="w-5 h-5 text-dash-text-secondary group-hover:text-brand-copper transition-colors shrink-0" />
                      </Link>
                    );
                  })}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
};

export default BrandCategoryPage;
