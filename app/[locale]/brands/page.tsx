import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/app/components/layout/header";
import { Footer } from "@/app/components/layout/footer";
import { BRANDS } from "@/app/lib/constants";

const BASE_URL = "https://countercultures.mx";

interface BrandsPagePropsForMeta {
  params: Promise<{ locale: string }>;
}

export const generateMetadata = async ({
  params,
}: BrandsPagePropsForMeta): Promise<Metadata> => {
  const { locale } = await params;
  const isEs = locale === "es";

  const title = isEs
    ? "Nuestras Marcas — Distribuidor Autorizado"
    : "Our Brands — Authorized Dealer";
  const description = isEs
    ? "Counter Cultures es distribuidor autorizado de Kohler, TOTO, Brizo, BLANCO, California Faucets, Sun Valley Bronze, Emtek, Badeloft y más en San Miguel de Allende."
    : "Counter Cultures is an authorized dealer for Kohler, TOTO, Brizo, BLANCO, California Faucets, Sun Valley Bronze, Emtek, Badeloft, and more in San Miguel de Allende.";

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
          url: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1200&q=80",
          width: 1200,
          height: 630,
          alt: isEs
            ? "Marcas de accesorios de lujo — Distribuidor autorizado Counter Cultures"
            : "Luxury fixture brands — Counter Cultures authorized dealer",
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

const brandDescriptions: Record<string, { tagline: string; description: string }> = {
  kohler: {
    tagline: "Bold Looks. Lasting Quality.",
    description: "Since 1873, Kohler has defined kitchen and bath innovation — from precision-engineered faucets to their iconic cast iron sinks.",
  },
  toto: {
    tagline: "People-First Innovation.",
    description: "Japan's leading fixture manufacturer, known for CEFIONTECT glaze technology and the world's most advanced toilet engineering.",
  },
  brizo: {
    tagline: "Fashion for the Home.",
    description: "Brizo brings fashion-forward design to kitchen and bath — the Litze collection's industrial precision is a kitchen centerpiece.",
  },
  blanco: {
    tagline: "The Kitchen Sink Experts.",
    description: "German engineering meets kitchen design. BLANCO's patented Silgranit material is heat, scratch, and stain resistant.",
  },
  "california-faucets": {
    tagline: "Handcrafted in Huntington Beach.",
    description: "Over 30 finish options, made to order in California. Bridge-style faucets and custom configurations for architects.",
  },
  "sun-valley-bronze": {
    tagline: "Hand-Cast. Hand-Finished. Idaho-Made.",
    description: "Each Sun Valley Bronze lock set is individually sand-cast in silicon bronze and hand-finished — functional sculpture for your door.",
  },
  emtek: {
    tagline: "Hardware for Every Style.",
    description: "Solid brass door hardware with designs spanning modern to traditional — Hampton, Ribbon & Reed, T-Bar, and more.",
  },
  badeloft: {
    tagline: "Modern Bathing Reimagined.",
    description: "Freestanding tubs in seamless mineral casting — sculptural forms with ergonomic comfort and easy-clean surfaces.",
  },
  bante: {
    tagline: "Farmhouse Refined.",
    description: "Fireclay and ceramic farmhouse sinks — the Duetto, Marea, and Duo collections bring timeless style to the kitchen.",
  },
  mistoa: {
    tagline: "Mexican Artisanal Ceramics.",
    description: "Hand-shaped ceramic basins available in 10 curated colorways inspired by the Mexican landscape — Surco, Poas, Barú, Sisa, Musa.",
  },
  "villeroy-boch": {
    tagline: "European Craftsmanship Since 1748.",
    description: "The Architectura line brings German precision to the bathroom — undermount, vessel, and countertop basins in timeless white.",
  },
  aquaspa: {
    tagline: "Spa-Grade Shower Systems.",
    description: "Rain showers, body sprays, and complete spa systems — bringing the luxury spa experience into the home.",
  },
};

const BrandsPage = async ({ params }: BrandsPagePropsForMeta) => {
  const { locale } = await params;
  const isEs = locale === "es";

  // GEO: ItemList of brand entities with explicit schema
  const brandListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: isEs
      ? "Marcas de Accesorios de Lujo — Counter Cultures"
      : "Luxury Fixture Brands — Counter Cultures",
    description: isEs
      ? "Counter Cultures es distribuidor autorizado de Kohler, TOTO, Brizo, BLANCO, California Faucets, Sun Valley Bronze, Emtek, Badeloft y más en San Miguel de Allende."
      : "Counter Cultures is an authorized dealer for Kohler, TOTO, Brizo, BLANCO, California Faucets, Sun Valley Bronze, Emtek, Badeloft, and more in San Miguel de Allende.",
    url: `${BASE_URL}/${locale}/brands`,
    numberOfItems: BRANDS.length,
    itemListElement: BRANDS.map((brand, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Brand",
        name: brand.name,
        url: `${BASE_URL}/${locale}/brands/${brand.slug}`,
      },
    })),
  };

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
        name: isEs ? "Marcas" : "Brands",
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
      dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
    />
    <Header locale={locale} />
    <main className="pt-16 md:pt-20">
      <section className="py-16 lg:py-20 bg-brand-linen border-b border-brand-stone/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <span className="font-mono text-xs tracking-[0.2em] text-brand-stone uppercase">
            Authorized Dealer
          </span>
          <h1 className="mt-3 font-display text-4xl md:text-5xl lg:text-6xl font-light tracking-wide text-brand-charcoal">
            Our Brands
          </h1>
          <p className="mt-4 font-body text-base text-brand-stone max-w-xl">
            We curate the world&apos;s finest bath, kitchen, and hardware brands —
            each chosen for quality, design integrity, and lasting value.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-brand-linen">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {BRANDS.map((brand) => {
              const info = brandDescriptions[brand.slug];
              return (
                <Link
                  key={brand.slug}
                  href={`/brands/${brand.slug}`}
                  className="group bg-white p-8 hover:shadow-md transition-shadow duration-300 border border-brand-stone/5"
                >
                  <h2 className="font-display text-2xl font-light text-brand-charcoal group-hover:text-brand-terracotta transition-colors tracking-wide">
                    {brand.name}
                  </h2>
                  {info && (
                    <>
                      <p className="mt-2 font-mono text-xs text-brand-copper tracking-wide">
                        {info.tagline}
                      </p>
                      <p className="mt-3 font-body text-sm text-brand-stone leading-relaxed">
                        {info.description}
                      </p>
                    </>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </main>
    <Footer locale={locale} />
  </>
  );
};

export default BrandsPage;
