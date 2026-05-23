import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/app/components/layout/header";
import { Footer } from "@/app/components/layout/footer";
import { getBrands } from "@/app/lib/brand-kit-sheets";
import { getBrandCounts, type BrandCount } from "@/app/lib/products-full";
import type { CategorySlug } from "@/app/lib/brand-kit-types";
import { FALLBACK_BRAND_META } from "@/app/lib/brand-fallbacks";
import { BrandsGrid } from "./brands-grid";
import { BRAND_HERO_IMAGES } from "@/app/lib/brand-heroes";

const BASE_URL = "https://countercultures.mx";

// Brand hero images — single source of truth at app/lib/brand-heroes.ts
const PRE_STAGED_HEROES = BRAND_HERO_IMAGES;

const buildFallbackBrands = (): import("@/app/lib/brand-kit-types").Brand[] =>
  Object.entries(FALLBACK_BRAND_META).map(([slug, meta], idx) => ({
    slug,
    name: meta.name,
    taglineEn: "",
    taglineEs: "",
    descriptionEn: "",
    descriptionEs: "",
    originCountry: meta.originCountry ?? "",
    originCountryName: meta.originCountryName ?? "",
    websiteUrl: "",
    externalUrl: "",
    stockedState: "stocked",
    primaryCategorySlug: (meta.primaryCategorySlug ?? "other") as CategorySlug,
    categorySlugs: [(meta.primaryCategorySlug ?? "other") as CategorySlug],
    logoDriveId: "",
    heroDriveId: "",
    brandFolderDriveId: "",
    featuredProductIds: [],
    featuredProjectSlugs: [],
    nomStatusSummary: "unknown",
    isArtisan: false,
    isFeatured: meta.isFeatured ?? false,
    displayOrder: idx + 1,
    createdAt: "",
    updatedAt: "",
    updatedBy: "fallback",
  }));

/**
 * Flagship brands — the 6 top-tier editorial relationships rendered as a
 * hero band above the filterable grid.
 */
const FLAGSHIP_SLUGS: readonly string[] = [
  "california-faucets",
  "toto",
  "bante",
  "badeloft",
  "emtek",
  "sun-valley-bronze",
  "baldwin",
  "blanco",
];

/* ------------------------------------------------------------------ */
/*  Artisan profiles — kept hardcoded, elevated above imports         */
/* ------------------------------------------------------------------ */

type Bilingual = { en: string; es: string };

interface Artisan {
  name: string;
  productBrand: string;
  craft: Bilingual;
  image: string;
  alt: Bilingual;
}

const artisans: Artisan[] = [
  {
    name: "Mistoa",
    productBrand: "Mistoa",
    craft: {
      en: "Ceramic and concrete basins",
      es: "Lavabos de cerámica y concreto",
    },
    image: "/Assets/Mistoa Studio.webp",
    alt: {
      en: "Mistoa ceramic basin",
      es: "Lavabo de cerámica Mistoa",
    },
  },
  {
    name: "Castro",
    productBrand: "Castro",
    craft: {
      en: "Copper and brass",
      es: "Cobre y latón",
    },
    image: "/Assets/Santa Clara del Cobre.webp",
    alt: {
      en: "Castro copper basin",
      es: "Lavabo de cobre Castro",
    },
  },
  {
    name: "Familia Meza",
    productBrand: "Familia Meza",
    craft: {
      en: "Stone",
      es: "Piedra",
    },
    image: "/Assets/Stone Artisans.webp",
    alt: {
      en: "Familia Meza stone basin",
      es: "Lavabo de piedra Familia Meza",
    },
  },
  {
    name: "Manriquez",
    productBrand: "Manriquez",
    craft: {
      en: "Cast bronze pulls and accessories",
      es: "Jaladeras y accesorios de bronce fundido",
    },
    image: "/products/odoo/2045767.jpg",
    alt: {
      en: "Manriquez cast bronze pull",
      es: "Jaladera de bronce fundido Manriquez",
    },
  },
];

/* ------------------------------------------------------------------ */
/*  Revalidation — Brand Kit Sheet changes surface within 5 min       */
/* ------------------------------------------------------------------ */

export const revalidate = 300;

/* ------------------------------------------------------------------ */
/*  Metadata                                                           */
/* ------------------------------------------------------------------ */

interface BrandsPageProps {
  params: Promise<{ locale: string }>;
}

export const generateMetadata = async ({
  params,
}: BrandsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const isEs = locale === "es";

  const title = isEs
    ? "Marcas y Artesanos — Counter Cultures"
    : "Brands & Makers — Counter Cultures";
  const description = isEs
    ? "73 marcas premium importadas — Kohler, TOTO, Brizo, BLANCO y más — junto con artesanos mexicanos que crean cobre, cerámica y piedra a mano. Descubre nuestra colección completa en San Miguel de Allende."
    : "73 premium imported brands — Kohler, TOTO, Brizo, BLANCO, and more — alongside Mexican artisan makers crafting copper, ceramic, and stone by hand. Discover our full collection in San Miguel de Allende.";

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/${locale}/brands`,
      languages: {
        en: `${BASE_URL}/en/brands`,
        es: `${BASE_URL}/es/brands`,
        "x-default": `${BASE_URL}/en/brands`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}/brands`,
      locale: isEs ? "es_MX" : "en_US",
      alternateLocale: isEs ? "en_US" : "es_MX",
      type: "website",
      images: [
        {
          url: `${BASE_URL}/Assets/BRANDS/kohler-hero.webp`,
          width: 1200,
          height: 630,
          alt: isEs
            ? "Marcas de lujo y artesanos mexicanos — Counter Cultures"
            : "Luxury brands and Mexican artisans — Counter Cultures",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

const BrandsPage = async ({ params }: BrandsPageProps) => {
  const { locale } = await params;
  const isEs = locale === "es";
  const localeKey = (locale === "es" ? "es" : "en") as "en" | "es";

  // getBrands() reads the small Brand Kit sheet (~73 rows) — fast.
  // getBrandCounts() reads the 354k-row product cache. SWR returns instantly
  // whenever there's any data in cache, but on a truly-cold Lambda boot it
  // blocks 10-20s on a Sheets fetch. Cap that with a 1s race so the brands
  // index doesn't stall — counts populate on subsequent requests once the
  // background load completes.
  const countsPromise = Promise.race([
    getBrandCounts().catch(() => []),
    new Promise<BrandCount[]>((resolve) => setTimeout(() => resolve([]), 1000)),
  ]);
  const [sheetBrands, catalogBrandCounts] = await Promise.all([
    getBrands(),
    countsPromise,
  ]);

  // Fallback path: when the Brand Kit Sheet load returns empty (env var
  // missing on build host, sheet not shared with service account, etc.)
  // swap in the hardcoded fallback so "Our Import Partners" never renders
  // as an empty section. The fallback covers the 17 brands we have hero
  // images pre-staged for. When sheet data is present, this is a no-op.
  const allBrands =
    sheetBrands.length > 0 ? sheetBrands : buildFallbackBrands();

  // Index catalog counts by brand name for O(1) lookups when building cards.
  const catalogCountByName = new Map(
    catalogBrandCounts.map((b) => [b.brand.toLowerCase(), b.count])
  );

  // Shape brands for the client grid. External-state brands link out to
  // their own site; others route internally.
  const brandCards = allBrands
    .map((b) => {
      const tagline = (isEs && b.taglineEs ? b.taglineEs : b.taglineEn) || "";
      const description =
        (isEs && b.descriptionEs ? b.descriptionEs : b.descriptionEn) || "";
      const heroImage = PRE_STAGED_HEROES[b.slug];
      const externalHref =
        b.stockedState === "external"
          ? b.externalUrl || b.websiteUrl
          : undefined;
      const catalogCount = catalogCountByName.get(b.name.toLowerCase()) ?? 0;
      return {
        slug: b.slug,
        name: b.name,
        tagline,
        description,
        originCountry: b.originCountry,
        originCountryName: b.originCountryName,
        heroImage,
        primaryCategorySlug: b.primaryCategorySlug || "other",
        categorySlugs: b.categorySlugs as CategorySlug[],
        stockedState: b.stockedState || "",
        externalHref,
        internalHref: `/${locale}/brands/${b.slug}`,
        isFeatured: b.isFeatured,
        displayOrder: b.displayOrder ?? 999,
        catalogCount,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const flagship = FLAGSHIP_SLUGS.map((slug) =>
    brandCards.find((b) => b.slug === slug)
  ).filter((b): b is NonNullable<typeof b> => Boolean(b));

  const flagshipSlugSet = new Set(FLAGSHIP_SLUGS);
  const nonFlagship = brandCards.filter((b) => !flagshipSlugSet.has(b.slug));

  // Catalog-wide stocked count — counter copy on the grid surfaces this so
  // the "we actually stock things" advantage is discoverable without
  // putting commercial state on every card.
  const totalStockedCount = brandCards.filter((b) => b.stockedState === "stocked").length;
  const totalBrandCount = brandCards.length;

  /* ─── JSON-LD ─── */

  const brandListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: isEs
      ? "Marcas y Artesanos — Counter Cultures"
      : "Brands & Makers — Counter Cultures",
    description: isEs
      ? "Counter Cultures representa 73 marcas premium importadas más artesanos mexicanos de cobre, cerámica y piedra en San Miguel de Allende."
      : "Counter Cultures represents 73 premium imported brands alongside Mexican artisans crafting copper, ceramic, and stone in San Miguel de Allende.",
    url: `${BASE_URL}/${locale}/brands`,
    numberOfItems: allBrands.length,
    itemListElement: brandCards.map((brand, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Brand",
        name: brand.name,
        url: `${BASE_URL}/${locale}/brands/${brand.slug}`,
      },
    })),
  };

  const artisanalJsonLd = {
    "@context": "https://schema.org",
    "@type": "Collection",
    name: isEs
      ? "Colección Artesanal Counter Cultures"
      : "Counter Cultures Artisanal Collection",
    description: isEs
      ? "Lavabos de cobre, cerámicas Mistoa, vasijas de piedra y herrajes de bronce forjado a mano — diseñados por Roger Williams y creados por artesanos mexicanos."
      : "Copper basins, Mistoa ceramic sinks, stone vessels, and hand-forged bronze hardware — designed by Roger Williams and crafted by Mexican artisans.",
    url: `${BASE_URL}/${locale}/brands`,
    creator: {
      "@type": "Person",
      "@id": `${BASE_URL}/#founder`,
      name: "Roger Williams",
    },
    producer: {
      "@type": "Organization",
      "@id": `${BASE_URL}/#organization`,
      name: "Counter Cultures",
    },
    about: [
      { "@type": "Thing", name: "Copper Basins" },
      { "@type": "Thing", name: "Mexican Artisan Craft" },
      { "@type": "Thing", name: "Ceramic Sinks" },
      { "@type": "Thing", name: "Stone Vessels" },
    ],
    locationCreated: { "@type": "Country", name: "Mexico" },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: isEs
      ? [
          {
            "@type": "Question",
            name: "¿Cuántas marcas representa Counter Cultures?",
            acceptedAnswer: {
              "@type": "Answer",
              text: `Counter Cultures representa ${allBrands.length} marcas premium importadas — desde Kohler y TOTO hasta Dornbracht y Hansgrohe — más artesanos mexicanos de cobre, cerámica y piedra.`,
            },
          },
          {
            "@type": "Question",
            name: "¿Puedo encargar una pieza artesanal personalizada?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Sí. Counter Cultures acepta encargos personalizados de lavabos de cobre, vasijas de piedra y cerámicas Mistoa. Elige el material, especifica las dimensiones, comparte tu inspiración y nuestros artesanos crearán una pieza única.",
            },
          },
        ]
      : [
          {
            "@type": "Question",
            name: "How many brands does Counter Cultures represent?",
            acceptedAnswer: {
              "@type": "Answer",
              text: `Counter Cultures represents ${allBrands.length} premium imported brands — from Kohler and TOTO to Dornbracht and Hansgrohe — alongside Mexican artisans crafting copper, ceramic, and stone.`,
            },
          },
          {
            "@type": "Question",
            name: "Can I commission a custom artisanal piece?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. Counter Cultures accepts custom commissions for copper basins, stone vessels, and Mistoa ceramics. Choose your material, specify dimensions, share your inspiration, and our artisans will craft a one-of-a-kind piece.",
            },
          },
        ],
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
        name: isEs ? "Marcas y Artesanos" : "Brands & Makers",
        item: `${BASE_URL}/${locale}/brands`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(brandListJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(artisanalJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Header />
      <main id="main" tabIndex={-1} className="pt-16 md:pt-20">

        {/* ═══════════════════════════════════════════════════════════ */}
        {/*  HERO                                                      */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section className="relative py-32 lg:py-44 overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src="/images/brands-hero.webp"
              alt="Luxury kitchen with marble countertops, brass range, and farmhouse sink — brands carried by Counter Cultures"
              fill
              sizes="100vw"
              priority
              className="object-cover scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-charcoal/80 via-brand-charcoal/50 to-brand-charcoal/30" />
          </div>
          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <span className="font-body font-semibold text-xs tracking-[0.2em] text-brand-terracotta uppercase">
              {isEs
                ? "Artesanos Mexicanos · Distribuidor Autorizado"
                : "Mexican Makers · Authorized Dealer"}
            </span>
            <h1 className="mt-6 font-display text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-light text-white tracking-wide leading-[0.95]">
              {isEs ? "Artesanía Mexicana." : "Mexican Craft."}
              <br />
              <span className="italic">
                {isEs ? "Marcas de Clase Mundial." : "World-Class Brands."}
              </span>
            </h1>
            <p className="mt-6 font-body text-lg text-white/70 max-w-2xl leading-relaxed">
              {isEs
                ? "Colaboramos con artesanos mexicanos que trabajan en cobre, cerámica y piedra — y somos distribuidor autorizado de Kohler, TOTO, Brizo, BLANCO, California Faucets, Sun Valley Bronze y más para baño, cocina y herrajes."
                : "We collaborate with Mexican artisans working in copper, ceramic, and stone — and we're an authorized dealer for Kohler, TOTO, Brizo, BLANCO, California Faucets, Sun Valley Bronze, and more for bath, kitchen, and hardware."}
            </p>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/*  ARTISAN MAKERS — elevated above the import grid           */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section className="py-20 lg:py-28 bg-brand-sand/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-14">
              <span className="font-body font-semibold text-xs tracking-[0.2em] text-dash-text-secondary uppercase">
                {isEs ? "Los Creadores" : "The Makers"}
              </span>
              <h2 className="mt-3 font-display text-4xl md:text-5xl font-light tracking-wide text-brand-charcoal">
                {isEs ? "Nuestros Artesanos" : "Our Artisans"}
              </h2>
              <p className="mt-4 font-body text-base text-dash-text-secondary leading-relaxed">
                {isEs
                  ? "Cobre martillado en Michoacán. Cerámica moldeada en Guanajuato. Piedra tallada en Querétaro. Cada pieza lleva la huella de su creador — diseñada por Roger Williams y elaborada por artesanos con los que ha colaborado durante casi dos décadas."
                  : "Copper hammered in Michoacán. Ceramic shaped in Guanajuato. Stone carved in Querétaro. Every piece carries the fingerprint of its maker — designed by Roger Williams and crafted by artisans he\u2019s collaborated with for nearly two decades."}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {artisans.map((artisan) => (
                <Link
                  key={artisan.name}
                  href={`/${locale}/shop/catalog?brand=${encodeURIComponent(artisan.productBrand)}`}
                  className="group relative bg-dash-surface overflow-hidden block transition-shadow duration-300 hover:shadow-lg"
                >
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <Image
                      src={artisan.image}
                      alt={artisan.alt[localeKey]}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-charcoal/70 via-brand-charcoal/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h3 className="font-display text-2xl font-light text-white tracking-wide">
                        {artisan.name}
                      </h3>
                      <p className="mt-1 font-body text-xs text-white/70 tracking-wide">
                        {artisan.craft[localeKey]}
                      </p>
                    </div>
                  </div>

                  <div className="p-6 lg:p-8">
                    <span className="inline-flex items-center gap-2 font-body font-medium text-xs text-dash-text-secondary/60 group-hover:text-brand-terracotta transition-colors duration-300 tracking-wide uppercase">
                      {isEs ? "Ver colección" : "View collection"}
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M7 17L17 7M17 7H7M17 7V17" />
                      </svg>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/*  NARRATIVE BRIDGE — makers → imports                       */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section className="relative py-20 lg:py-24 bg-brand-charcoal overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03]">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
              }}
            />
          </div>
          <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <div className="w-12 h-0.5 bg-brand-copper mx-auto mb-8" />
            <p className="font-display text-2xl md:text-3xl lg:text-4xl font-light text-white tracking-wide leading-snug">
              {isEs
                ? "Nuestros artesanos mexicanos dan el "
                : "Our Mexican artisans give the "}
              <span className="italic text-brand-copper">
                {isEs ? "alma." : "soul."}
              </span>
              {isEs
                ? " Nuestras marcas autorizadas nos dan la base."
                : " Our authorized brands give us the foundation."}
            </p>
            <div className="w-12 h-0.5 bg-brand-copper mx-auto mt-8" />
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/*  OUR IMPORT PARTNERS — flagship band + filterable grid     */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section className="py-20 lg:py-28 bg-brand-linen">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-14">
              <div>
                <span className="font-body font-semibold text-xs tracking-[0.2em] text-dash-text-secondary uppercase">
                  {isEs ? "Distribuidor Autorizado" : "Authorized Dealer"}
                </span>
                <h2 className="mt-3 font-display text-4xl md:text-5xl font-light tracking-wide text-brand-charcoal">
                  {isEs ? "Marcas Asociadas" : "Brand Partners"}
                </h2>
              </div>
              <p className="font-body text-sm text-dash-text-secondary max-w-md leading-relaxed">
                {isEs
                  ? `${allBrands.length} marcas — cada una elegida por su calidad, integridad de diseño y valor duradero.`
                  : `${allBrands.length} brands — each chosen for quality, design integrity, and lasting value.`}
              </p>
            </div>

            {/* Flagship band — 2-column large cards */}
            {flagship.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
                {flagship.map((brand) => (
                  <Link
                    key={brand.slug}
                    id={`brand-${brand.slug}`}
                    href={brand.internalHref}
                    className="group relative bg-dash-surface border border-brand-stone/8 overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-brand-copper/20 hover:-translate-y-0.5"
                  >
                    <div className="absolute top-0 left-0 w-0 h-0.5 bg-brand-copper transition-all duration-500 group-hover:w-full z-10" />
                    {brand.heroImage && (
                      <div className="relative h-52 lg:h-64 overflow-hidden">
                        <Image
                          src={brand.heroImage}
                          alt={brand.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        />
                        {/* Editorial overlay — copper-tinted side gradient
                            instead of the dark bottom scrim used elsewhere,
                            so flagship reads as a magazine spread, not just
                            a bigger card. */}
                        <div className="absolute inset-0 bg-gradient-to-r from-brand-charcoal/75 via-brand-charcoal/20 to-transparent" />
                        <div className="absolute inset-y-0 left-0 flex flex-col justify-end p-6 max-w-md">
                          {brand.originCountryName && (
                            <p className="font-body font-semibold text-[10px] text-brand-copper tracking-[0.18em] uppercase">
                              {brand.originCountryName}
                            </p>
                          )}
                          <h3 className="mt-1.5 font-display text-2xl lg:text-3xl font-light text-white tracking-wide leading-tight">
                            {brand.name}
                          </h3>
                        </div>
                      </div>
                    )}
                    <div className="p-7 lg:p-8">
                      {brand.tagline && (
                        <p className="font-body font-medium text-xs text-brand-terracotta tracking-wide">
                          {brand.tagline}
                        </p>
                      )}
                      {brand.description && (
                        <p className="mt-3 font-body text-sm text-dash-text-secondary leading-relaxed line-clamp-3">
                          {brand.description}
                        </p>
                      )}
                      <span className="inline-flex items-center gap-2 mt-4 font-body font-medium text-xs text-dash-text-secondary/50 group-hover:text-brand-terracotta transition-colors duration-300 tracking-wide uppercase">
                        {isEs ? "Explorar" : "Explore"}
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M7 17L17 7M17 7H7M17 7V17" />
                        </svg>
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Filterable grid — 67 remaining brands. Wrapped in Suspense
                because BrandsGrid uses useSearchParams; Next.js requires
                this boundary during prerender or the whole page bails. */}
            <Suspense fallback={null}>
              <BrandsGrid
                locale={localeKey}
                brands={nonFlagship}
                flagshipBrands={flagship}
                totalStockedCount={totalStockedCount}
                totalBrandCount={totalBrandCount}
              />
            </Suspense>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/*  COMMISSION CTA                                            */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section className="relative py-24 lg:py-32 bg-brand-charcoal overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src="/Assets/Stone Artisans.webp"
              alt="Hand-carved stone artisanal work"
              fill
              sizes="100vw"
              className="object-cover opacity-20"
            />
          </div>
          <div className="relative z-10 mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
            <span className="font-body font-semibold text-xs tracking-[0.2em] text-brand-terracotta uppercase">
              {isEs ? "A Tu Medida" : "Bespoke"}
            </span>
            <h2 className="mt-4 font-display text-4xl md:text-5xl font-light tracking-wide text-white">
              {isEs ? "Encarga una Pieza Única" : "Commission a Custom Piece"}
            </h2>
            <p className="mt-5 font-body text-base text-white/60 max-w-lg mx-auto leading-relaxed">
              {isEs
                ? "Elige tu material — cobre, piedra o cerámica — especifica dimensiones, comparte tu inspiración y nuestros artesanos crearán una pieza irrepetible."
                : "Choose your material — copper, stone, or ceramic — specify dimensions, share your inspiration, and our artisans will craft a one-of-a-kind piece."}
            </p>
            <Link
              href={`/${locale}/contact?type=commission`}
              className="inline-block mt-8 px-10 py-4 bg-brand-copper text-white font-body text-sm font-medium tracking-wider uppercase hover:bg-brand-copper/90 transition-colors duration-300"
            >
              {isEs ? "Comenzar Tu Encargo" : "Start Your Commission"}
            </Link>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
};

export default BrandsPage;
