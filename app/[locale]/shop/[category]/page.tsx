import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Header } from "@/app/components/layout/header";
import { Footer } from "@/app/components/layout/footer";
import { SubcategoryGrid } from "@/app/components/sections/subcategory-grid";
import { CategoryCinematicHero } from "./category-hero-client";
import { BrandRibbon } from "./brand-ribbon-client";
import { getProducts, getProductsBySubcategory } from "@/app/lib/sheets";
import { PRODUCT_CATEGORIES, SUBCATEGORY_META, BRANDS } from "@/app/lib/constants";
import type { CategoryKey } from "@/app/lib/constants";

interface CategoryPageProps {
  params: Promise<{ category: string; locale: string }>;
}

const HERO_IMAGES: Record<string, string> = {
  bathroom: "/products/bano/baneras/Alisia-Niquelado.jpg",
  kitchen: "/products/cocina/mezcladoras/CF-Corsano-Bridge.jpg",
  hardware: "/products/herrajes/artesanales/artesanales-2.png",
};

const HERO_COPY: Record<string, { en: string; es: string }> = {
  bathroom: {
    en: "Where ritual meets craft. From hand-hammered copper vessels shaped by third-generation artesanos to TOTO's whisper-quiet WASHLET technology — every piece in our baño collection is chosen to transform your daily routine into something worth savoring.",
    es: "Donde el ritual se encuentra con el oficio. Desde lavabos de cobre martillados a mano por artesanos de tercera generación hasta la tecnología silenciosa WASHLET de TOTO — cada pieza de nuestra colección de baño fue elegida para transformar tu rutina diaria en algo que vale la pena disfrutar.",
  },
  kitchen: {
    en: "The heart of the home, engineered for the hands that feed it. BLANCO granite composite sinks that shrug off red wine, Brizo faucets with Diamond Seal technology, and Bluestar ranges trusted by chefs on both sides of the border.",
    es: "El corazón del hogar, diseñado para las manos que lo alimentan. Tarjas BLANCO de granito compuesto que resisten cualquier cosa, grifos Brizo con tecnología Diamond Seal y estufas Bluestar en las que confían chefs a ambos lados de la frontera.",
  },
  hardware: {
    en: "The first thing your guests touch — and the last thing they forget. Hand-cast silicon bronze by Sun Valley Bronze, solid brass by Emtek, and wrought-iron jaladeras forged in the workshops of San Miguel de Allende.",
    es: "Lo primero que tocan tus invitados — y lo último que olvidan. Bronce al silicio fundido a mano por Sun Valley Bronze, latón sólido de Emtek y jaladeras de hierro forjado en los talleres de San Miguel de Allende.",
  },
};

const CATEGORY_TITLES: Record<string, { en: string; es: string }> = {
  bathroom: { en: "Bathroom", es: "Baño" },
  kitchen: { en: "Kitchen", es: "Cocina" },
  hardware: { en: "Door Hardware", es: "Herrajes" },
};

const CATEGORY_EYEBROW: Record<string, { en: string; es: string }> = {
  bathroom: { en: "The Baño Collection", es: "Colección de Baño" },
  kitchen: { en: "The Kitchen Collection", es: "Colección de Cocina" },
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
  const products = await getProducts({ category });

  // Get product counts per subcategory
  const subcategoryCounts = await Promise.all(
    catConfig.subcategories.map(async (sub) => {
      const subProducts = await getProductsBySubcategory(category, sub.slug);
      return { slug: sub.slug, count: subProducts.length };
    })
  );
  const countMap = Object.fromEntries(subcategoryCounts.map((s) => [s.slug, s.count]));

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
            locale={lang}
          />
        </section>

        {/* SECTION 2: Editorial Subcategory Grid */}
        <SubcategoryGrid
          category={category}
          subcategories={subcategoryCards}
          locale={lang}
        />

        {/* SECTION 3: Brand Ribbon */}
        <BrandRibbon
          brands={categoryBrands.map((b) => ({ name: b.name, slug: b.slug }))}
          locale={lang}
        />
      </main>
      <Footer locale={lang} />
    </>
  );
};

export default CategoryPage;
