import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/app/components/layout/header";
import { Footer } from "@/app/components/layout/footer";
import { CategoryHero } from "@/app/components/sections/category-hero";
import { ShopCatalog } from "@/app/[locale]/shop/shop-catalog";
import { getProductsByBrand } from "@/app/lib/sheets";
import { BRANDS } from "@/app/lib/constants";
import { Shield, Wrench, HeadphonesIcon } from "lucide-react";

interface BrandPageProps {
  params: Promise<{ slug: string; locale: string }>;
}

const brandHeroData: Record<
  string,
  { tagline: string; description: string; heroImage: string }
> = {
  kohler: {
    tagline: "Gracious Living, Since 1873",
    description:
      "From kitchen sinks to freestanding tubs, Kohler combines 150 years of American engineering with designs that define modern luxury.",
    heroImage: "/Assets/BRANDS/kohler-hero.webp",
  },
  toto: {
    tagline: "People-First Innovation",
    description:
      "Japanese precision meets bathroom perfection. TOTO's CEFIONTECT glaze and Washlet technology set the global standard for hygiene and comfort.",
    heroImage: "/Assets/BRANDS/toto-hero.webp",
  },
  brizo: {
    tagline: "Fashion-Forward Fixtures",
    description:
      "Brizo brings fashion sensibility to the kitchen and bath. The Litze collection's industrial aesthetic and SmartTouch technology redefine what a faucet can be.",
    heroImage: "/Assets/BRANDS/brizo-hero.webp",
  },
  blanco: {
    tagline: "The Kitchen Sink Perfected",
    description:
      "German-engineered Silgranit sinks that resist heat, scratches, and stains. BLANCO's Ikon apron front has become the centerpiece of Mexico's finest kitchens.",
    heroImage: "/Assets/BRANDS/blanco-hero.webp",
  },
  "california-faucets": {
    tagline: "Handcrafted in Huntington Beach",
    description:
      "Over 30 artisan finishes, made to order in California. Bridge-style kitchen faucets and custom bath hardware that no factory can replicate.",
    heroImage: "/Assets/BRANDS/california-faucets-hero.webp",
  },
  "sun-valley-bronze": {
    tagline: "Hand-Cast, One at a Time",
    description:
      "Each Sun Valley Bronze piece is individually sand-cast in silicon bronze and hand-finished in Idaho. Entry sets that are as much sculpture as hardware.",
    heroImage: "/Assets/BRANDS/sun-valley-bronze-hero.webp",
  },
  emtek: {
    tagline: "Precision Door Hardware",
    description:
      "Solid brass construction meets contemporary and classic design. Emtek door knobs, levers, and deadbolts engineered to last generations.",
    heroImage: "/Assets/BRANDS/emtek-hero.avif",
  },
  badeloft: {
    tagline: "Pure Form, Pure Material",
    description:
      "Badeloft freestanding tubs and basins in seamless mineral casting — organic shapes with an easy-clean surface that stays pristine.",
    heroImage: "/Assets/BRANDS/badeloft-hero.webp",
  },
  bante: {
    tagline: "Mexican Artisanal Craft",
    description:
      "Hand-finished bathroom accessories and fixtures that bring the spirit of Mexican craft into contemporary spaces.",
    heroImage: "/Assets/BRANDS/bante-hero.avif",
  },
  mistoa: {
    tagline: "Color Inspired by the Landscape",
    description:
      "Artisanal basins in 10 curated colorways — from Rosa Crudo to Azul Profundo — each hand-shaped and finished by master artisans.",
    heroImage: "/Assets/BRANDS/mistoa-hero.webp",
  },
  "villeroy-boch": {
    tagline: "European Elegance Since 1748",
    description:
      "Nearly three centuries of ceramic mastery. Villeroy & Boch brings timeless European design to bathrooms worldwide.",
    heroImage: "/Assets/BRANDS/villeroy-boch-hero.webp",
  },
  aquaspa: {
    tagline: "Professional Spa Solutions",
    description:
      "Commercial and residential spa fixtures designed for the Mexican climate — durable, beautiful, and built for daily use.",
    heroImage: "/Assets/BRANDS/aquaspa-hero.webp",
  },
  ebbe: {
    tagline: "Engineered Drain Solutions",
    description:
      "Precision-machined linear and square shower drains — stainless steel construction with tile-insert and decorative grate options.",
    heroImage: "/Assets/BRANDS/ebbe-hero.webp",
  },
  delta: {
    tagline: "Innovation at Every Turn",
    description:
      "Touch2O and ShieldSpray technologies across kitchen and bath. Delta's H2Okinetic showerheads sculpt water into a warmer, more powerful pattern.",
    heroImage: "/Assets/BRANDS/delta-hero.webp",
  },
  rohl: {
    tagline: "Authentic Luxury Since 1983",
    description:
      "Italian-made bridge faucets and fireclay farmhouse sinks — every piece reflects ROHL's commitment to European craftsmanship and heritage design.",
    heroImage: "/Assets/BRANDS/rohl-hero.webp",
  },
  teka: {
    tagline: "German Kitchen Technology",
    description:
      "Built-in ovens, induction hobs, and stainless steel sinks — Teka brings 95 years of German-engineered kitchen innovation to Mexico.",
    heroImage: "/Assets/BRANDS/teka-hero.webp",
  },
  smeg: {
    tagline: "Technology with Style",
    description:
      "Iconic Italian design meets precision engineering — retro-style refrigerators, ranges, and small appliances that define the modern kitchen.",
    heroImage: "/Assets/BRANDS/smeg-hero.webp",
  },
  bluestar: {
    tagline: "Restaurant Power. Residential Beauty",
    description:
      "Open-burner ranges with 25,000 BTU and 750+ color options — the professional chef's choice, built by hand in Pennsylvania.",
    heroImage: "/Assets/BRANDS/bluestar-hero.webp",
  },
  baldwin: {
    tagline: "American Craftsmanship Since 1946",
    description:
      "Forged brass door hardware with lifetime finishes — from estate rosettes to contemporary levers, each set is built to last generations.",
    heroImage: "/Assets/BRANDS/baldwin-hero.webp",
  },
};

const BASE_URL = "https://countercultures.mx";

export const generateMetadata = async ({
  params,
}: BrandPageProps): Promise<Metadata> => {
  const { slug, locale } = await params;
  const brand = BRANDS.find((b) => b.slug === slug);
  if (!brand) return { title: "Brand Not Found" };

  const isEs = locale === "es";
  const heroData = brandHeroData[slug];

  const title = isEs
    ? `${brand.name} — Distribuidor Autorizado en San Miguel de Allende`
    : `${brand.name} — Authorized Dealer in San Miguel de Allende`;
  const description = isEs
    ? `Compra accesorios ${brand.name} para baño, cocina y herrajes en Counter Cultures. Distribuidor autorizado en San Miguel de Allende, México.`
    : `Shop ${brand.name} bath, kitchen, and hardware fixtures at Counter Cultures. Authorized dealer in San Miguel de Allende, Mexico.`;

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
      images: heroData
        ? [{ url: heroData.heroImage, width: 1200, height: 630, alt: brand.name }]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: heroData ? [heroData.heroImage] : [],
    },
  };
};

const BrandPage = async ({ params }: BrandPageProps) => {
  const { slug, locale } = await params;
  const isEs = locale === "es";
  const brand = BRANDS.find((b) => b.slug === slug);

  if (!brand) notFound();

  const products = await getProductsByBrand(brand.name);
  const heroData = brandHeroData[slug] ?? {
    tagline: "Authorized Dealer",
    description: `Shop the complete ${brand.name} collection at Counter Cultures.`,
    heroImage:
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1920&q=80",
  };

  // GEO: Brand entity + authorized reseller relationship
  const brandJsonLd = {
    "@context": "https://schema.org",
    "@type": "Brand",
    name: brand.name,
    description: heroData.description,
    url: `${BASE_URL}/${locale}/brands/${slug}`,
    logo: `${BASE_URL}/brands/${slug}-logo.png`,
  };

  const resellerJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${BASE_URL}/${locale}/brands/${slug}`,
    name: isEs
      ? `${brand.name} — Distribuidor Autorizado en San Miguel de Allende`
      : `${brand.name} — Authorized Dealer in San Miguel de Allende`,
    description: heroData.description,
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
        <CategoryHero
          eyebrow="Authorized Dealer"
          title={brand.name}
          description={heroData.description}
          productCount={products.length}
          ctaLabel={`Shop ${brand.name}`}
          ctaHref="#products"
          imageSrc={heroData.heroImage}
        />

        {/* Value props */}
        <section className="py-12 bg-brand-sand/20 border-b border-brand-stone/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex items-start gap-4">
                <Shield className="w-5 h-5 text-brand-terracotta mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-body text-sm font-semibold text-brand-charcoal">
                    Authorized Dealer
                  </h3>
                  <p className="mt-2 font-body text-sm text-brand-stone">
                    Full manufacturer warranty, genuine products, and
                    factory-direct support.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Wrench className="w-5 h-5 text-brand-terracotta mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-body text-sm font-semibold text-brand-charcoal">
                    Local Expertise
                  </h3>
                  <p className="mt-2 font-body text-sm text-brand-stone">
                    20 years specifying {brand.name} for Mexican homes, hotels,
                    and commercial projects.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <HeadphonesIcon className="w-5 h-5 text-brand-terracotta mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-body text-sm font-semibold text-brand-charcoal">
                    Installation Support
                  </h3>
                  <p className="mt-2 font-body text-sm text-brand-stone">
                    Specification guidance, plumber coordination, and post-install
                    support — all in San Miguel de Allende.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div id="products">
          <ShopCatalog initialProducts={products} />
        </div>
      </main>
      <Footer locale={locale} />
    </>
  );
};

export default BrandPage;
