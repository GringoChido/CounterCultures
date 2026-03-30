import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/app/components/layout/header";
import { Footer } from "@/app/components/layout/footer";
import { CategoryHero } from "@/app/components/sections/category-hero";
import { ShopCatalog } from "../shop-catalog";
import { getProducts } from "@/app/lib/sheets";
import { PRODUCT_CATEGORIES } from "@/app/lib/constants";

interface CategoryPageProps {
  params: Promise<{ category: string; locale: string }>;
}

const categoryMeta: Record<
  string,
  {
    title: string;
    titleEs: string;
    description: string;
    descriptionEs: string;
    subtitle: string;
    heroImage: string;
    heroEyebrow: string;
    heroTitle: string;
  }
> = {
  bathroom: {
    title: "Bathroom Fixtures — Sinks, Faucets, Tubs & More",
    titleEs: "Accesorios de Baño — Lavabos, Grifos, Bañeras y Más",
    description:
      "Luxury bathroom fixtures from Kohler, TOTO, Badeloft, California Faucets, and handcrafted artisanal copper and stone basins by Mexican artisans.",
    descriptionEs:
      "Accesorios de baño de lujo de Kohler, TOTO, Badeloft, California Faucets y lavabos artesanales de cobre y piedra hechos por artesanos mexicanos.",
    subtitle:
      "From TOTO's precision engineering to hand-hammered copper basins by local artisans — every piece chosen to elevate the most personal room in your home.",
    heroImage:
      "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1920&q=80",
    heroEyebrow: "Counter Cultures Collection",
    heroTitle: "Bathroom",
  },
  kitchen: {
    title: "Kitchen Fixtures — Sinks, Faucets, Hoods & Appliances",
    titleEs: "Accesorios de Cocina — Tarjas, Mezcladoras, Campanas",
    description:
      "Premium kitchen sinks by BLANCO and Kohler, faucets by Brizo and California Faucets, range hoods, and professional-grade appliances.",
    descriptionEs:
      "Tarjas de cocina BLANCO y Kohler, mezcladoras Brizo y California Faucets, campanas y electrodomésticos de grado profesional.",
    subtitle:
      "BLANCO Silgranit sinks, Brizo Litze faucets, California Faucets bridge designs — professional-grade fixtures for kitchens that work as hard as you do.",
    heroImage:
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1920&q=80",
    heroEyebrow: "Counter Cultures Collection",
    heroTitle: "Kitchen",
  },
  hardware: {
    title: "Door Hardware — Locks, Handles, Knobs & Pulls",
    titleEs: "Herrajes para Puertas — Chapas, Manijas, Perillas y Jaladeras",
    description:
      "Hand-cast bronze entry lock sets by Sun Valley Bronze and precision door hardware by Emtek. Every piece individually finished.",
    descriptionEs:
      "Cerraduras de bronce fundido a mano de Sun Valley Bronze y herrajes de precisión Emtek. Cada pieza acabada individualmente.",
    subtitle:
      "Sun Valley Bronze hand-cast silicon bronze and Emtek solid brass — door hardware that makes an entrance before you even walk through it.",
    heroImage:
      "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1920&q=80",
    heroEyebrow: "Counter Cultures Collection",
    heroTitle: "Door Hardware",
  },
};

const BASE_URL = "https://countercultures.mx";

export const generateMetadata = async ({
  params,
}: CategoryPageProps): Promise<Metadata> => {
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
      images: [
        {
          url: meta.heroImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [meta.heroImage],
    },
  };
};

const CategoryPage = async ({ params }: CategoryPageProps) => {
  const { category, locale } = await params;
  const lang = (locale as "en" | "es") || "en";
  const isEs = lang === "es";

  if (!categoryMeta[category]) notFound();

  const meta = categoryMeta[category];
  const catConfig =
    PRODUCT_CATEGORIES[category as keyof typeof PRODUCT_CATEGORIES];
  const products = await getProducts({ category });

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
      {
        "@type": "ListItem",
        position: 3,
        name: catConfig?.label[lang] ?? category,
        item: `${BASE_URL}/${locale}/shop/${category}`,
      },
    ],
  };

  // ItemList JSON-LD — helps search and AI engines enumerate products
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: isEs ? meta.titleEs : meta.title,
    description: isEs ? meta.descriptionEs : meta.description,
    url: `${BASE_URL}/${locale}/shop/${category}`,
    numberOfItems: products.length,
    itemListElement: products.slice(0, 20).map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${BASE_URL}/${locale}/shop/${category}/p/${product.slug}`,
      name: lang === "es" ? product.name : product.nameEn,
    })),
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
      <Header locale={lang} />
      <main>
        <CategoryHero
          eyebrow={meta.heroEyebrow}
          title={meta.heroTitle}
          description={meta.subtitle}
          productCount={products.length}
          ctaLabel="Browse Collection"
          ctaHref="#products"
          imageSrc={meta.heroImage}
        />

        {/* Subcategory pills */}
        <section className="py-4 md:py-8 bg-brand-linen border-b border-brand-stone/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {catConfig.subcategories.map((sub) => (
                <a
                  key={sub.slug}
                  href={`/${locale}/shop/${category}/${sub.slug}`}
                  className="px-4 py-2.5 min-h-[44px] flex items-center text-sm font-body border border-brand-stone/20 rounded-full text-brand-charcoal hover:border-brand-terracotta hover:text-brand-terracotta transition-colors shrink-0 whitespace-nowrap"
                >
                  {sub.label[lang]}
                </a>
              ))}
            </div>
          </div>
        </section>

        <div id="products">
          <ShopCatalog initialProducts={products} initialCategory={category} />
        </div>
      </main>
      <Footer locale={lang} />
    </>
  );
};

export default CategoryPage;
