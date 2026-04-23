import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Header } from "@/app/components/layout/header";
import { Footer } from "@/app/components/layout/footer";
import { CategoryHero } from "@/app/components/sections/category-hero";
import { ShopCatalog } from "@/app/[locale]/shop/shop-catalog";
import { getProductsByBrand } from "@/app/lib/sheets";
import { getBrandBySlug, getBrands } from "@/app/lib/brand-kit-sheets";
import { getBrandSummary } from "@/app/lib/products-full";
import { articles, pillarColors, pillarLabels } from "@/app/lib/articles";
import { Shield, Wrench, HeadphonesIcon, ArrowUpRight, Package } from "lucide-react";
import { BrandSignatureTile } from "./brand-signature-tile";

interface BrandPageProps {
  params: Promise<{ slug: string; locale: string }>;
}

/**
 * Pre-staged hero images — the 19 hand-picked hero photos kept at
 * /public/Assets/brand-images/ are permanent editorial assets. Protected
 * from any future Brand Kit Sheet churn. Keyed by slug.
 */
const PRE_STAGED_HEROES: Record<string, string> = {
  kohler: "/Assets/BRANDS/kohler-hero.webp",
  toto: "/Assets/BRANDS/toto-hero.webp",
  brizo: "/Assets/BRANDS/brizo-hero.webp",
  blanco: "/Assets/BRANDS/blanco-hero.webp",
  "california-faucets": "/Assets/BRANDS/california-faucets-hero.webp",
  "sun-valley-bronze": "/Assets/BRANDS/sun-valley-bronze-hero.webp",
  emtek: "/Assets/BRANDS/emtek-hero.avif",
  badeloft: "/Assets/BRANDS/badeloft-hero.webp",
  "villeroy-boch": "/Assets/BRANDS/villeroy-boch-hero.webp",
  aquaspa: "/Assets/BRANDS/aquaspa-hero.webp",
  ebbe: "/Assets/BRANDS/ebbe-hero.webp",
  delta: "/Assets/BRANDS/delta-hero.webp",
  rohl: "/Assets/BRANDS/rohl-hero.webp",
  teka: "/Assets/BRANDS/teka-hero.webp",
  smeg: "/Assets/BRANDS/smeg-hero.webp",
  bluestar: "/Assets/BRANDS/bluestar-hero.webp",
  baldwin: "/Assets/BRANDS/baldwin-hero.webp",
  // Artisan makers also have pre-staged heroes (not in the 73 import list
  // but the routes still need to render if someone hits /brands/bante or /brands/mistoa)
  bante: "/Assets/BRANDS/bante-hero.avif",
  mistoa: "/Assets/BRANDS/mistoa-hero.webp",
};

const BASE_URL = "https://countercultures.mx";

/**
 * Revalidate every 5 minutes so Brand Kit Sheet edits from Roger surface
 * without a full rebuild. Individual routes are dynamically rendered on
 * demand.
 */
export const revalidate = 300;

export const dynamicParams = true;

export const generateStaticParams = async () => {
  const brands = await getBrands();
  return brands.map((b) => ({ slug: b.slug }));
};

export const generateMetadata = async ({
  params,
}: BrandPageProps): Promise<Metadata> => {
  const { slug, locale } = await params;
  const brand = await getBrandBySlug(slug);
  if (!brand) return { title: "Brand Not Found" };

  const isEs = locale === "es";
  const heroImage = PRE_STAGED_HEROES[slug];

  const title = isEs
    ? `${brand.name} — Distribuidor Autorizado en San Miguel de Allende`
    : `${brand.name} — Authorized Dealer in San Miguel de Allende`;
  const description = isEs
    ? brand.descriptionEs ||
      `Compra accesorios ${brand.name} para baño, cocina y herrajes en Counter Cultures. Distribuidor autorizado en San Miguel de Allende, México.`
    : brand.descriptionEn ||
      `Shop ${brand.name} bath, kitchen, and hardware fixtures at Counter Cultures. Authorized dealer in San Miguel de Allende, Mexico.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/${locale}/brands/${slug}`,
      languages: {
        en: `${BASE_URL}/en/brands/${slug}`,
        es: `${BASE_URL}/es/brands/${slug}`,
        "x-default": `${BASE_URL}/en/brands/${slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}/brands/${slug}`,
      locale: isEs ? "es_MX" : "en_US",
      alternateLocale: isEs ? "en_US" : "es_MX",
      type: "website",
      images: heroImage
        ? [{ url: heroImage, width: 1200, height: 630, alt: brand.name }]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: heroImage ? [heroImage] : [],
    },
  };
};

const BrandPage = async ({ params }: BrandPageProps) => {
  const { slug, locale } = await params;
  const isEs = locale === "es";

  const brand = await getBrandBySlug(slug);
  if (!brand) notFound();

  // External-state brands should have redirected at the card click, but if
  // someone lands here directly, still render — helps SEO for the brand name.
  const products = await getProductsByBrand(brand.name);
  const heroImage = PRE_STAGED_HEROES[slug];

  // Full-catalog summary — connects the editorial brand page to the 354k Vault.
  const catalogSummary = await getBrandSummary(brand.name, {
    featuredIds: brand.featuredProductIds ?? [],
    limit: 8,
  });

  const description =
    (isEs ? brand.descriptionEs : brand.descriptionEn) ||
    (brand.descriptionEn && !isEs
      ? brand.descriptionEn
      : `Shop the complete ${brand.name} collection at Counter Cultures.`);

  const tagline =
    (isEs ? brand.taglineEs : brand.taglineEn) ||
    brand.taglineEn ||
    (isEs ? "Distribuidor Autorizado" : "Authorized Dealer");

  // "From our journal" — every article that mentions this brand
  const relatedPosts = articles.filter((a) =>
    a.brandSlugs?.includes(slug)
  );

  // Request-a-quote state: show CTA prominently when brand is request-state or
  // when there's no product catalog loaded (fallback to quote capture).
  const isRequestState = brand.stockedState === "request";
  const hasProducts = products.length > 0;
  const showQuoteCta = isRequestState || !hasProducts;

  // GEO: Brand entity + authorized reseller relationship
  const brandJsonLd = {
    "@context": "https://schema.org",
    "@type": "Brand",
    name: brand.name,
    description,
    url: `${BASE_URL}/${locale}/brands/${slug}`,
    ...(brand.websiteUrl && { sameAs: [brand.websiteUrl] }),
    ...(brand.originCountryName && {
      address: {
        "@type": "PostalAddress",
        addressCountry: brand.originCountryName,
      },
    }),
  };

  const resellerJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${BASE_URL}/${locale}/brands/${slug}`,
    name: isEs
      ? `${brand.name} — Distribuidor Autorizado en San Miguel de Allende`
      : `${brand.name} — Authorized Dealer in San Miguel de Allende`,
    description,
    url: `${BASE_URL}/${locale}/brands/${slug}`,
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["h1", "h2", "[data-speakable='description']"],
    },
    about: brandJsonLd,
    publisher: {
      "@type": "Organization",
      "@id": `${BASE_URL}/#organization`,
      name: "Counter Cultures",
    },
    ...(hasProducts && {
      numberOfItems: products.length,
      mainEntity: {
        "@type": "ItemList",
        name: `${brand.name} Products`,
        numberOfItems: products.length,
        itemListElement: products.slice(0, 10).map((product, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: `${BASE_URL}/${locale}/shop/${product.category}/p/${product.slug}`,
          name: product.nameEn,
        })),
      },
    }),
  };

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
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(resellerJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Header locale={locale} />
      <main>
        {heroImage ? (
          <CategoryHero
            eyebrow={
              isEs ? "Distribuidor Autorizado" : "Authorized Dealer"
            }
            title={brand.name}
            description={description}
            productCount={hasProducts ? products.length : undefined}
            ctaLabel={
              showQuoteCta
                ? isEs
                  ? "Solicitar Cotización"
                  : "Request a Quote"
                : `Shop ${brand.name}`
            }
            ctaHref={
              showQuoteCta
                ? `/${locale}/contact?brand=${slug}`
                : "#products"
            }
            imageSrc={heroImage}
          />
        ) : (
          // Typography-led hero for brands without pre-staged imagery —
          // editorial luxe fallback. Auto-upgrades when Roger drops a hero
          // file into this brand's Drive folder.
          <section className="bg-brand-charcoal text-white py-24 md:py-32">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <p className="font-body font-semibold text-xs tracking-[0.25em] text-brand-copper uppercase">
                {isEs ? "Distribuidor Autorizado" : "Authorized Dealer"}
              </p>
              <h1 className="mt-6 font-display text-5xl md:text-7xl font-light tracking-tight">
                {brand.name}
              </h1>
              {tagline && (
                <p className="mt-4 font-display text-xl md:text-2xl text-white/70 italic">
                  {tagline}
                </p>
              )}
              <p
                className="mt-8 max-w-2xl font-body text-base md:text-lg text-white/80 leading-relaxed"
                data-speakable="description"
              >
                {description}
              </p>
              {brand.originCountryName && (
                <p className="mt-6 font-body text-xs tracking-wider uppercase text-white/50">
                  {isEs ? "Origen" : "Origin"} · {brand.originCountryName}
                </p>
              )}
              <div className="mt-10 flex flex-wrap gap-3">
                {showQuoteCta ? (
                  <Link
                    href={`/${locale}/contact?brand=${slug}`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-brand-copper text-white font-body font-medium text-sm tracking-wider uppercase hover:bg-brand-copper/90 transition-colors"
                  >
                    {isEs ? "Solicitar Cotización" : "Request a Quote"}
                  </Link>
                ) : (
                  <a
                    href="#products"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-brand-copper text-white font-body font-medium text-sm tracking-wider uppercase hover:bg-brand-copper/90 transition-colors"
                  >
                    Shop {brand.name}
                  </a>
                )}
                {brand.websiteUrl && (
                  <a
                    href={brand.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 border border-white/20 text-white font-body font-medium text-sm tracking-wider uppercase hover:bg-white/5 transition-colors"
                  >
                    {isEs ? "Sitio del Fabricante" : "Manufacturer Site"}
                    <ArrowUpRight className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Value props — present on every brand page */}
        <section className="py-12 bg-brand-sand/20 border-b border-brand-stone/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex items-start gap-4">
                <Shield className="w-5 h-5 text-brand-terracotta mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-body text-sm font-semibold text-brand-charcoal">
                    {isEs ? "Distribuidor Autorizado" : "Authorized Dealer"}
                  </h3>
                  <p className="mt-2 font-body text-sm text-brand-stone">
                    {isEs
                      ? "Garantía completa del fabricante, productos genuinos y soporte directo de fábrica."
                      : "Full manufacturer warranty, genuine products, and factory-direct support."}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Wrench className="w-5 h-5 text-brand-terracotta mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-body text-sm font-semibold text-brand-charcoal">
                    {isEs ? "Experiencia Local" : "Local Expertise"}
                  </h3>
                  <p className="mt-2 font-body text-sm text-brand-stone">
                    {isEs
                      ? `Años especificando ${brand.name} para hogares, hoteles y proyectos comerciales en México.`
                      : `Years specifying ${brand.name} for Mexican homes, hotels, and commercial projects.`}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <HeadphonesIcon className="w-5 h-5 text-brand-terracotta mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-body text-sm font-semibold text-brand-charcoal">
                    {isEs ? "Soporte de Instalación" : "Installation Support"}
                  </h3>
                  <p className="mt-2 font-body text-sm text-brand-stone">
                    {isEs
                      ? "Guía de especificación, coordinación con plomeros y soporte post-instalación — todo en San Miguel de Allende."
                      : "Specification guidance, plumber coordination, and post-install support — all in San Miguel de Allende."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Products — when we actually carry inventory for this brand */}
        {hasProducts && (
          <div id="products">
            <ShopCatalog initialProducts={products} />
          </div>
        )}

        {/* Full Catalog — the Vault, filtered to this brand. Only show when
            the brand actually has catalog items (avoids dead sections on
            request-state brands with no Odoo footprint). */}
        {catalogSummary.count > 0 && (
          <section className="py-16 md:py-24 bg-brand-linen border-y border-brand-stone/10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="grid lg:grid-cols-[1fr_auto] gap-6 items-end mb-10">
                <div>
                  <p className="font-body font-semibold text-[11px] tracking-[0.25em] text-brand-copper uppercase">
                    {isEs ? "Catálogo completo" : "Full Catalog"}
                  </p>
                  <h2 className="mt-3 font-display text-3xl md:text-5xl font-light tracking-wide text-brand-charcoal leading-[1.05]">
                    {isEs ? (
                      <>
                        <span className="italic">
                          {catalogSummary.count.toLocaleString("es-MX")} piezas
                        </span>{" "}
                        de {brand.name} disponibles para especificar.
                      </>
                    ) : (
                      <>
                        <span className="italic">
                          {catalogSummary.count.toLocaleString("en-US")} {brand.name} pieces
                        </span>{" "}
                        available to specify.
                      </>
                    )}
                  </h2>
                  <p className="mt-4 font-body text-base text-brand-stone max-w-xl">
                    {isEs
                      ? `Más allá de la colección curada: cada pieza autorizada de ${brand.name} que podemos importar, buscable por modelo, acabado o colección. Precio de fábrica y cotización en 24 horas hábiles.`
                      : `Beyond our curated selection: every authorized ${brand.name} piece we can source, searchable by model, finish, or collection. Factory-direct pricing, quotes within 24 hours.`}
                  </p>
                </div>
                <Link
                  href={`/${locale}/shop/catalog?brand=${encodeURIComponent(brand.name)}`}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-brand-charcoal text-white font-body font-semibold text-sm tracking-wide hover:bg-brand-charcoal/90 transition-colors whitespace-nowrap"
                >
                  {isEs ? "Abrir catálogo" : "Open catalog"} →
                </Link>
              </div>

              {/* Category breakdown chips */}
              {Object.values(catalogSummary.categoryCounts).some((c) => c > 0) && (
                <div className="mb-8 flex flex-wrap gap-2">
                  {(["bathroom", "kitchen", "hardware"] as const)
                    .filter((c) => catalogSummary.categoryCounts[c] > 0)
                    .map((c) => (
                      <Link
                        key={c}
                        href={`/${locale}/shop/catalog?brand=${encodeURIComponent(brand.name)}&category=${c}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-brand-stone/20 hover:border-brand-copper transition-colors font-body text-xs"
                      >
                        <span className="text-[10px] tracking-[0.18em] uppercase text-brand-stone">
                          {isEs
                            ? c === "bathroom" ? "Baño" : c === "kitchen" ? "Cocina" : "Herrajes"
                            : c === "bathroom" ? "Bathroom" : c === "kitchen" ? "Kitchen" : "Hardware"}
                        </span>
                        <span className="font-mono text-[11px] text-brand-copper">
                          {catalogSummary.categoryCounts[c].toLocaleString()}
                        </span>
                      </Link>
                    ))}
                </div>
              )}

              {/* Signature collection grid — featured or top N */}
              {catalogSummary.signature.length > 0 && (
                <>
                  <p className="font-body text-[11px] tracking-[0.25em] text-brand-stone uppercase mb-5">
                    {isEs
                      ? brand.featuredProductIds?.length
                        ? "Selección del showroom"
                        : "Del catálogo"
                      : brand.featuredProductIds?.length
                        ? "Signature selection"
                        : "From the catalog"}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {catalogSummary.signature.map((p) => (
                      <BrandSignatureTile
                        key={p.id}
                        product={p}
                        locale={locale as "en" | "es"}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {/* Request-a-Quote band — shown when no products (request-state or
            stocked-with-empty-catalog). Sits between products and journal. */}
        {showQuoteCta && (
          <section className="py-16 md:py-20 bg-brand-sand/10 border-y border-brand-stone/10">
            <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
              <p className="font-body font-semibold text-xs tracking-[0.2em] text-brand-terracotta uppercase">
                {isEs
                  ? `Especificación ${brand.name}`
                  : `${brand.name} Specification`}
              </p>
              <h2 className="mt-4 font-display text-3xl md:text-4xl font-light text-brand-charcoal">
                {isEs
                  ? `Solicita una cotización para ${brand.name}`
                  : `Request a ${brand.name} Quote`}
              </h2>
              <p className="mt-4 font-body text-base text-brand-stone leading-relaxed">
                {isEs
                  ? `Contáctanos para especificaciones, tiempos de entrega y disponibilidad de productos ${brand.name} para tu proyecto.`
                  : `Contact us for specs, lead times, and product availability for ${brand.name} on your project.`}
              </p>
              <Link
                href={`/${locale}/contact?brand=${slug}`}
                className="mt-8 inline-flex items-center gap-2 px-8 py-4 bg-brand-copper text-white font-body font-medium text-sm tracking-wider uppercase hover:bg-brand-copper/90 transition-colors"
              >
                {isEs ? "Solicitar Cotización" : "Request a Quote"}
              </Link>
            </div>
          </section>
        )}

        {/* From our journal — related editorial posts tagged with this brand */}
        {relatedPosts.length > 0 && (
          <section className="py-16 md:py-20 bg-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <p className="font-body font-semibold text-xs tracking-[0.2em] text-brand-terracotta uppercase">
                {isEs ? "De Nuestro Diario" : "From our Journal"}
              </p>
              <h2 className="mt-2 font-display text-3xl md:text-4xl font-light text-brand-charcoal">
                {isEs
                  ? `Artículos sobre ${brand.name}`
                  : `Editorial featuring ${brand.name}`}
              </h2>
              <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {relatedPosts.map((post) => (
                  <Link
                    key={post.slug}
                    href={`/${locale}/insights/${post.slug}`}
                    className="group"
                  >
                    <div
                      className="aspect-[4/3] rounded-lg overflow-hidden bg-brand-stone/10 mb-4"
                      style={{
                        backgroundImage: `url('${post.image.startsWith("http") ? post.image.replace("q=80", "q=75") + "&auto=format" : post.image}')`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    />
                    <span
                      className={`inline-block px-2 py-0.5 text-[9px] font-body font-semibold tracking-wider text-white uppercase rounded ${pillarColors[post.pillar]}`}
                    >
                      {pillarLabels[post.pillar][locale as "en" | "es"]}
                    </span>
                    <h3 className="mt-3 font-display text-xl text-brand-charcoal group-hover:text-brand-terracotta transition-colors leading-snug">
                      {post.title[locale as "en" | "es"]}
                    </h3>
                    <p className="mt-2 font-body text-sm text-brand-stone line-clamp-2">
                      {post.excerpt[locale as "en" | "es"]}
                    </p>
                    <p className="mt-3 font-body text-[11px] tracking-wider uppercase text-brand-stone/70">
                      {format(parseISO(post.date), "MMM d, yyyy")} · {post.readTime}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer locale={locale} />
    </>
  );
};

export default BrandPage;
