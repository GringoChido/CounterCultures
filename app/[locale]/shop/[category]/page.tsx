import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Header } from "@/app/components/layout/header";
import { Footer } from "@/app/components/layout/footer";
import { SubcategoryGrid } from "@/app/components/sections/subcategory-grid";
import { HowItWorksBand } from "@/app/components/sections/how-it-works-band";
import { CategoryCinematicHero } from "./category-hero-client";
import { BrandRibbon } from "./brand-ribbon-client";
import { getProducts } from "@/app/lib/sheets";
import { getCategoryCounts } from "@/app/lib/products-full";
import { PRODUCT_CATEGORIES, SUBCATEGORY_META, BRANDS } from "@/app/lib/constants";
import type { CategoryKey } from "@/app/lib/constants";

export const revalidate = 300;

interface CategoryPageProps {
  params: Promise<{ category: string; locale: string }>;
}

const HERO_IMAGES: Record<string, string> = {
  bathroom: "/images/bathroom/bathroom-hero.webp",
  kitchen: "/images/kitchen/kitchen-hero.webp",
  hardware: "/images/hardware/hardware-hero.webp",
};

const HERO_COPY: Record<string, { en: string; es: string }> = {
  bathroom: {
    en: "From hand-hammered copper basins by San Miguel artisans to TOTO's WASHLET technology. Every bathroom piece we carry, in one showroom.",
    es: "Desde lavabos de cobre martillados a mano por artesanos de San Miguel hasta la tecnología WASHLET de TOTO. Cada pieza de baño que manejamos, en un solo showroom.",
  },
  kitchen: {
    en: "BLANCO sinks, Brizo faucets, Bluestar ranges. Built for the way you actually cook.",
    es: "Tarjas BLANCO, grifos Brizo, estufas Bluestar. Hechas para la forma en que realmente cocinas.",
  },
  hardware: {
    en: "Hand-cast bronze by Sun Valley, Emtek precision, jaladeras forged in San Miguel. The first thing your guests touch — and the last thing they forget.",
    es: "Bronce fundido a mano por Sun Valley, la precisión de Emtek, jaladeras forjadas en San Miguel. Lo primero que tocan tus invitados — y lo último que olvidan.",
  },
};

const CATEGORY_TITLES: Record<string, { en: string; es: string }> = {
  bathroom: { en: "Bathroom", es: "Baño" },
  kitchen: { en: "Kitchen", es: "Cocina" },
  hardware: { en: "Door Hardware", es: "Herrajes" },
};

const CATEGORY_EYEBROW: Record<string, { en: string; es: string }> = {
  bathroom: { en: "Bathroom Collection", es: "Colección de Baño" },
  kitchen: { en: "Kitchen Collection", es: "Colección de Cocina" },
  hardware: { en: "Architectural Hardware", es: "Herrajes Arquitectónicos" },
};

const CATEGORY_BRANDS: Record<string, string[]> = {
  bathroom: ["kohler", "toto", "brizo", "california-faucets", "badeloft", "mistoa", "villeroy-boch", "aquaspa", "ebbe", "delta"],
  kitchen: ["kohler", "brizo", "blanco", "california-faucets", "bante", "delta", "rohl", "teka", "smeg", "bluestar"],
  hardware: ["sun-valley-bronze", "emtek", "baldwin"],
};

const categoryMeta: Record<string, {
  title: string;
  titleEs: string;
  description: string;
  descriptionEs: string;
}> = {
  bathroom: {
    title: "Bathroom Fixtures — Sinks, Faucets, Tubs & More",
    titleEs: "Accesorios de Baño — Lavabos, Grifos, Bañeras y Más",
    description: "Luxury bathroom fixtures from Kohler, TOTO, Badeloft, California Faucets, and handcrafted artisanal copper and stone basins by Mexican artisans.",
    descriptionEs: "Accesorios de baño de lujo de Kohler, TOTO, Badeloft, California Faucets y lavabos artesanales de cobre y piedra hechos por artesanos mexicanos.",
  },
  kitchen: {
    title: "Kitchen Fixtures — Sinks, Faucets, Hoods & Appliances",
    titleEs: "Accesorios de Cocina — Tarjas, Mezcladoras, Campanas",
    description: "Premium kitchen sinks by BLANCO and Kohler, faucets by Brizo and California Faucets, range hoods, and professional-grade appliances.",
    descriptionEs: "Tarjas de cocina BLANCO y Kohler, mezcladoras Brizo y California Faucets, campanas y electrodomésticos de grado profesional.",
  },
  hardware: {
    title: "Door Hardware — Locks, Handles, Knobs & Pulls",
    titleEs: "Herrajes para Puertas — Chapas, Manijas, Perillas y Jaladeras",
    description: "Hand-cast bronze entry lock sets by Sun Valley Bronze and precision door hardware by Emtek. Every piece individually finished.",
    descriptionEs: "Cerraduras de bronce fundido a mano de Sun Valley Bronze y herrajes de precisión Emtek. Cada pieza acabada individualmente.",
  },
};

const BASE_URL = "https://countercultures.mx";

export const generateMetadata = async ({ params }: CategoryPageProps): Promise<Metadata> => {
  const { category, locale } = await params;
  const isEs = locale === "es";
  const meta = categoryMeta[category];
  if (!meta) return { title: "Shop" };

  const title = isEs ? meta.titleEs : meta.title;
  const description = isEs ? meta.descriptionEs : meta.description;

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/${locale}/shop/${category}`,
      languages: {
        en: `${BASE_URL}/en/shop/${category}`,
        es: `${BASE_URL}/es/shop/${category}`,
        "x-default": `${BASE_URL}/en/shop/${category}`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}/shop/${category}`,
      locale: isEs ? "es_MX" : "en_US",
      alternateLocale: isEs ? "en_US" : "es_MX",
      type: "website",
      images: [{ url: `${BASE_URL}${HERO_IMAGES[category] ?? "/og-image.jpg"}`, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${BASE_URL}${HERO_IMAGES[category] ?? "/og-image.jpg"}`],
    },
  };
};

const CategoryPage = async ({ params }: CategoryPageProps) => {
  const { category, locale } = await params;
  const lang = (locale as "en" | "es") || "en";
  const isEs = lang === "es";

  if (!categoryMeta[category]) notFound();

  const meta = categoryMeta[category];
  const catConfig = PRODUCT_CATEGORIES[category as CategoryKey];
  const [products, categoryCounts] = await Promise.all([
    getProducts({ category }),
    getCategoryCounts().catch(() => ({ bathroom: 0, kitchen: 0, hardware: 0 })),
  ]);
  const fullCatalogCount = categoryCounts[category as CategoryKey] ?? 0;

  // Compute subcategory counts from already-fetched products (no extra API calls)
  const countMap: Record<string, number> = {};
  for (const sub of catConfig.subcategories) {
    countMap[sub.slug] = products.filter((p) => p.subcategory === sub.slug).length;
  }

  // Build subcategory data for the grid
  const subcategoryMeta = SUBCATEGORY_META[category] ?? {};
  const subcategoryCards = catConfig.subcategories.map((sub) => ({
    slug: sub.slug,
    label: sub.label as { en: string; es: string },
    description: subcategoryMeta[sub.slug]?.description ?? { en: "", es: "" },
    heroImage: subcategoryMeta[sub.slug]?.heroImage ?? "/og-image.jpg",
    productCount: countMap[sub.slug] ?? 0,
  }));

  // Filter brands for this category
  const categoryBrandSlugs = CATEGORY_BRANDS[category] ?? [];
  const categoryBrands = BRANDS.filter((b) => categoryBrandSlugs.includes(b.slug));

  // Count unique brands in this category
  const uniqueBrands = new Set(products.map((p) => p.brand)).size;

  // JSON-LD: BreadcrumbList
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: isEs ? "Inicio" : "Home", item: `${BASE_URL}/${locale}` },
      { "@type": "ListItem", position: 2, name: isEs ? "Tienda" : "Shop", item: `${BASE_URL}/${locale}/shop` },
      { "@type": "ListItem", position: 3, name: catConfig.label[lang], item: `${BASE_URL}/${locale}/shop/${category}` },
    ],
  };

  // JSON-LD: ItemList — subcategories instead of individual products
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: isEs ? meta.titleEs : meta.title,
    description: isEs ? meta.descriptionEs : meta.description,
    url: `${BASE_URL}/${locale}/shop/${category}`,
    numberOfItems: catConfig.subcategories.length,
    itemListElement: catConfig.subcategories.map((sub, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${BASE_URL}/${locale}/shop/${category}/${sub.slug}`,
      name: sub.label[lang],
    })),
  };

  const heroImage = HERO_IMAGES[category] ?? "/og-image.jpg";
  const heroCopy = HERO_COPY[category]?.[lang] ?? "";
  const heroTitle = CATEGORY_TITLES[category]?.[lang] ?? category;
  const heroEyebrow = CATEGORY_EYEBROW[category]?.[lang] ?? "";

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <Header locale={lang} />
      <main>
        {/* SECTION 1: Cinematic Full-Height Hero */}
        <section className="relative h-[70vh] md:h-screen flex items-end overflow-hidden">
          <Image
            src={heroImage}
            alt={heroTitle}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-charcoal/90 via-brand-charcoal/40 to-transparent" />

          <CategoryCinematicHero
            eyebrow={heroEyebrow}
            title={heroTitle}
            body={heroCopy}
            productCount={products.length}
            brandCount={uniqueBrands}
            catalogCount={fullCatalogCount}
            catalogHref={`/${locale}/shop/catalog?category=${category}`}
            locale={lang}
          />
        </section>

        {/* SECTION 2: Editorial Subcategory Grid */}
        <SubcategoryGrid
          category={category}
          subcategories={subcategoryCards}
          locale={lang}
          catalogHref={`/${locale}/shop/catalog?category=${category}`}
          catalogCount={fullCatalogCount}
        />

        {/* SECTION 3: How it works trust band */}
        <HowItWorksBand locale={lang} variant="light" />

        {/* SECTION 4: Brand Ribbon */}
        <BrandRibbon
          brands={categoryBrands.map((b) => ({ name: b.name, slug: b.slug }))}
          locale={lang}
          category={category}
          categoryLabel={catConfig.label[lang]}
        />
      </main>
      <Footer locale={lang} />
    </>
  );
};

export default CategoryPage;
