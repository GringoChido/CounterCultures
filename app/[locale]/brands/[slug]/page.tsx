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
import { pdpUrl } from "@/app/lib/pdp-href";
import { articles, pillarColors, pillarLabels } from "@/app/lib/articles";
import { Shield, Wrench, HeadphonesIcon, ArrowUpRight, Package } from "lucide-react";
import { BrandSignatureTile } from "./brand-signature-tile";
import { BRAND_HERO_IMAGES } from "@/app/lib/brand-heroes";

interface BrandPageProps {
  params: Promise<{ slug: string; locale: string }>;
}

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
  const heroImage = BRAND_HERO_IMAGES[slug];

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
  const heroImage = BRAND_HERO_IMAGES[slug];

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

  // Stocking state — empty / unknown defaults to "request" so we never
  // accidentally claim "in stock" for an untagged brand.
  const stockState =
    (brand.stockedState as "stocked" | "request" | "external" | "") || "request";
  const isStocked = stockState === "stocked";
  const isExternal = stockState === "external";
  const isRequestState = stockState === "request";
  const externalUrl = isExternal ? brand.externalUrl || brand.websiteUrl || "" : "";
  const hasProducts = products.length > 0;
  const showQuoteCta = isRequestState || (!isExternal && !hasProducts && !isStocked);

  // Eyebrow line — the one-line commercial-state header above the brand name.
  // The whole "invisible card state" decision flips here: on the detail page,
  // the architect has committed to this brand by clicking through, so they
  // deserve to know what they're getting into.
  const stateEyebrow = isStocked
    ? isEs
      ? "En Stock en Nuestro Showroom"
      : "In Stock at Our Showroom"
    : isExternal
      ? isEs
        ? "Disponible a Través del Fabricante"
        : "Available via the Manufacturer"
      : isEs
        ? "Pedido Especial · 4–8 Semanas"
        : "Special Order · 4–8 Weeks";

  // Primary CTA — depends on stocking state and whether we carry inventory.
  const primaryCta: { label: string; href: string } = (() => {
    if (isExternal && externalUrl) {
      return {
        label: isEs ? `Visitar ${brand.name}` : `Visit ${brand.name}`,
        href: externalUrl,
      };
    }
    if (isStocked && hasProducts) {
      return {
        label: isEs ? `Comprar ${brand.name}` : `Shop ${brand.name}`,
        href: "#products",
      };
    }
    if (isStocked && !hasProducts) {
      return {
        label: isEs ? "Reservar Visita al Showroom" : "Book a Showroom Visit",
        href: `/${locale}/showroom?brand=${slug}`,
      };
    }
    // request state (and any unknown fallback)
    return {
      label: isEs ? "Solicitar Cotización" : "Request a Quote",
      href: `/${locale}/contact?brand=${slug}`,
    };
  })();

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
          url: pdpUrl(locale, product),
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
      <main id="main" tabIndex={-1}>
        {heroImage ? (
          <CategoryHero
            eyebrow={stateEyebrow}
            title={brand.name}
            description={description}
            productCount={hasProducts ? products.length : undefined}
            ctaLabel={primaryCta.label}
            ctaHref={primaryCta.href}
            imageSrc={heroImage}
            locale={locale as "en" | "es"}
            catalogHref={
              catalogSummary.count > 0
                ? `/${locale}/shop/catalog?brand=${encodeURIComponent(brand.name)}`
                : undefined
            }
            catalogLabel={
              catalogSummary.count > 0
                ? isEs
                  ? `${catalogSummary.count.toLocaleString("es-MX")} en el catálogo completo`
                  : `${catalogSummary.count.toLocaleString("en-US")} in the full catalog`
                : undefined
            }
          />
        ) : (
          // Typography-led hero for brands without pre-staged imagery —
          // editorial luxe fallback. Auto-upgrades when Roger drops a hero
          // file into this brand's Drive folder.
          <section className="relative bg-brand-charcoal text-white pt-32 md:pt-40 pb-20 md:pb-28 overflow-hidden">
            {/* atmospheric copper wash — keeps the no-image hero from feeling flat */}
            <div
              className="absolute inset-0 pointer-events-none opacity-40"
              style={{
                background:
                  "radial-gradient(ellipse 70% 60% at 25% 0%, rgba(184, 115, 51, 0.28), transparent 70%), radial-gradient(ellipse 50% 80% at 100% 100%, rgba(196, 114, 90, 0.18), transparent 65%)",
              }}
              aria-hidden
            />
            {/* subtle grid texture, same vocabulary as the brand catalog cards */}
            <div
              className="absolute inset-0 opacity-[0.04] pointer-events-none"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h1v40H0zM0 0v1h40V0z' fill='%23ffffff'/%3E%3C/svg%3E\")",
              }}
              aria-hidden
            />
            {/* hairline corner accents */}
            <div className="hidden lg:block absolute top-32 left-8 w-8 h-px bg-brand-copper/60" aria-hidden />
            <div className="hidden lg:block absolute top-32 left-8 h-8 w-px bg-brand-copper/60" aria-hidden />
            <div className="hidden lg:block absolute bottom-8 right-8 w-8 h-px bg-brand-copper/60" aria-hidden />
            <div className="hidden lg:block absolute bottom-8 right-8 h-8 w-px bg-brand-copper/60" aria-hidden />

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-4">
                <span className="h-px w-12 bg-brand-copper" aria-hidden />
                <p className="font-mono font-semibold text-[11px] tracking-[0.3em] text-brand-copper uppercase flex items-center gap-2">
                  {isStocked && (
                    <span
                      aria-hidden
                      className="inline-block w-2 h-2 rounded-full bg-brand-copper ring-2 ring-white/20"
                    />
                  )}
                  {stateEyebrow}
                </p>
              </div>
              <h1 className="mt-7 font-display text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-light tracking-wide leading-[1.02]">
                {brand.name}
              </h1>
              {tagline && (
                <p className="mt-5 font-display text-xl md:text-2xl text-white/65 italic max-w-3xl">
                  {tagline}
                </p>
              )}
              <p
                className="mt-7 max-w-2xl font-body text-base md:text-lg text-white/75 leading-relaxed"
                data-speakable="description"
              >
                {description}
              </p>
              {brand.originCountryName && (
                <p className="mt-7 font-mono text-[11px] tracking-[0.3em] uppercase text-white/45">
                  {isEs ? "Origen" : "Origin"} · {brand.originCountryName}
                </p>
              )}
              <div className="mt-10 flex flex-wrap gap-3">
                {/^https?:/.test(primaryCta.href) ? (
                  <a
                    href={primaryCta.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-brand-copper text-white font-body font-medium text-sm tracking-wider uppercase hover:bg-brand-copper/90 transition-colors"
                  >
                    {primaryCta.label}
                    <ArrowUpRight className="w-4 h-4" />
                  </a>
                ) : primaryCta.href.startsWith("#") ? (
                  <a
                    href={primaryCta.href}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-brand-copper text-white font-body font-medium text-sm tracking-wider uppercase hover:bg-brand-copper/90 transition-colors"
                  >
                    {primaryCta.label}
                  </a>
                ) : (
                  <Link
                    href={primaryCta.href}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-brand-copper text-white font-body font-medium text-sm tracking-wider uppercase hover:bg-brand-copper/90 transition-colors"
                  >
                    {primaryCta.label}
                  </Link>
                )}
                {/* Secondary "Manufacturer Site" link — only when not already
                    the primary CTA (i.e., for stocked / request brands). */}
                {brand.websiteUrl && !isExternal && (
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
                  <p className="mt-2 font-body text-sm text-dash-text-secondary">
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
                  <p className="mt-2 font-body text-sm text-dash-text-secondary">
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
                  <p className="mt-2 font-body text-sm text-dash-text-secondary">
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
          <section id="products" className="pt-16 md:pt-20 bg-dash-surface">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-8 md:mb-10">
              <p className="font-body font-semibold text-[11px] tracking-[0.25em] text-brand-terracotta uppercase">
                {isEs ? "Nuestra selección" : "Our Selection"}
              </p>
              <h2 className="mt-3 font-display text-3xl md:text-5xl font-light tracking-wide text-brand-charcoal leading-[1.05]">
                {isEs
                  ? `${products.length.toLocaleString("es-MX")} piezas curadas con ficha completa.`
                  : `${products.length.toLocaleString("en-US")} curated pieces with full detail.`}
              </h2>
              <p className="mt-3 font-body text-sm md:text-base text-dash-text-secondary max-w-2xl">
                {isEs
                  ? `Con páginas de detalle, opciones de acabado y fotografía propia. La selección que respaldamos${
                      catalogSummary.count > 0
                        ? ` — un subconjunto de las ${catalogSummary.count.toLocaleString("es-MX")} piezas de ${brand.name} en el catálogo completo.`
                        : "."
                    }`
                  : `With detail pages, finish options, and our own photography. The selection we stand behind${
                      catalogSummary.count > 0
                        ? ` — a subset of the ${catalogSummary.count.toLocaleString("en-US")} ${brand.name} pieces in the full catalog.`
                        : "."
                    }`}
              </p>
            </div>
            <ShopCatalog initialProducts={products} />
          </section>
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
                  <p className="mt-4 font-body text-base text-dash-text-secondary max-w-xl">
                    {isEs
                      ? `Más allá de nuestra selección: cada pieza autorizada de ${brand.name} que podemos pedir directo de fábrica. Buscable por modelo, acabado o colección. Cotización en 24 horas.`
                      : `Beyond our selection: every authorized ${brand.name} piece we can order direct from the factory. Searchable by model, finish, or collection. 24-hour quotes.`}
                  </p>
                </div>
                <Link
                  href={`/${locale}/shop/catalog?brand=${encodeURIComponent(brand.name)}`}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-brand-charcoal text-white font-body font-semibold text-sm tracking-wide hover:bg-brand-charcoal/90 transition-colors whitespace-nowrap"
                >
                  {isEs ? "Abrir catálogo" : "Open catalog"} →
                </Link>
              </div>

              {/* Category breakdown chips → editorial category landing pages */}
              {Object.values(catalogSummary.categoryCounts).some((c) => c > 0) && (
                <div className="mb-8 flex flex-wrap gap-2">
                  {(["bathroom", "kitchen", "hardware"] as const)
                    .filter((c) => catalogSummary.categoryCounts[c] > 0)
                    .map((c) => (
                      <Link
                        key={c}
                        href={`/${locale}/brands/${slug}/${c}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-dash-surface border border-brand-stone/20 hover:border-brand-copper transition-colors font-body text-xs"
                      >
                        <span className="text-[10px] tracking-[0.18em] uppercase text-dash-text-secondary">
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
                  <p className="font-body text-[11px] tracking-[0.25em] text-dash-text-secondary uppercase mb-5">
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
              <p className="mt-4 font-body text-base text-dash-text-secondary leading-relaxed">
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
          <section className="py-16 md:py-20 bg-dash-surface">
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
                    <p className="mt-2 font-body text-sm text-dash-text-secondary line-clamp-2">
                      {post.excerpt[locale as "en" | "es"]}
                    </p>
                    <p className="mt-3 font-body text-[11px] tracking-wider uppercase text-dash-text-secondary/70">
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
