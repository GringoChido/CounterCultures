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
    description: string;
    subtitle: string;
    heroImage: string;
    heroEyebrow: string;
    heroTitle: string;
  }
> = {
  bathroom: {
    title: "Bathroom Fixtures — Sinks, Faucets, Tubs & More",
    description:
      "Luxury bathroom fixtures from Kohler, TOTO, Badeloft, California Faucets, and handcrafted artisanal copper and stone basins by Mexican artisans.",
    subtitle:
      "From TOTO's precision engineering to hand-hammered copper basins by local artisans — every piece chosen to elevate the most personal room in your home.",
    heroImage:
      "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1920&q=80",
    heroEyebrow: "Counter Cultures Collection",
    heroTitle: "Bathroom",
  },
  kitchen: {
    title: "Kitchen Fixtures — Sinks, Faucets, Hoods & Appliances",
    description:
      "Premium kitchen sinks by BLANCO and Kohler, faucets by Brizo and California Faucets, range hoods, and professional-grade appliances.",
    subtitle:
      "BLANCO Silgranit sinks, Brizo Litze faucets, California Faucets bridge designs — professional-grade fixtures for kitchens that work as hard as you do.",
    heroImage:
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1920&q=80",
    heroEyebrow: "Counter Cultures Collection",
    heroTitle: "Kitchen",
  },
  hardware: {
    title: "Door Hardware — Locks, Handles, Knobs & Pulls",
    description:
      "Hand-cast bronze entry lock sets by Sun Valley Bronze and precision door hardware by Emtek. Every piece individually finished.",
    subtitle:
      "Sun Valley Bronze hand-cast silicon bronze and Emtek solid brass — door hardware that makes an entrance before you even walk through it.",
    heroImage:
      "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1920&q=80",
    heroEyebrow: "Counter Cultures Collection",
    heroTitle: "Door Hardware",
  },
};

const BASE_URL = "https://countercultures.mx";

const categoryMetaEs: Record<
  string,
  { title: string; description: string }
> = {
  bathroom: {
    title: "Accesorios de Baño — Lavabos, Grifos, Bañeras y Más",
    description:
      "Accesorios de baño de lujo de Kohler, TOTO, Badeloft, California Faucets y lavabos artesanales de cobre y piedra hechos por artesanos mexicanos.",
  },
  kitchen: {
    title: "Accesorios de Cocina — Tarjas, Mezcladoras, Campanas",
    description:
      "Tarjas de cocina BLANCO y Kohler, mezcladoras Brizo y California Faucets, campanas y electrodomésticos de grado profesional.",
  },
  hardware: {
    title: "Herrajes para Puertas — Chapas, Manijas, Perillas y Jaladeras",
    description:
      "Cerraduras de bronce fundido a mano de Sun Valley Bronze y herrajes de precisión Emtek. Cada pieza acabada individualmente.",
  },
};

export const generateMetadata = async ({
  params,
}: CategoryPageProps): Promise<Metadata> => {
  const { category, locale } = await params;
  const isEs = locale === "es";
  const metaEn = categoryMeta[category];
  const metaEs = categoryMetaEs[category];
  if (!metaEn) return { title: "Shop" };

  const title = isEs && metaEs ? metaEs.title : metaEn.title;
  const description = isEs && metaEs ? metaEs.description : metaEn.description;

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
      images: [
        {
          url: metaEn.heroImage,
          width: 1920,
          height: 1080,
          alt: title,
        },
      ],
    },
  };
};

const CategoryPage = async ({ params }: CategoryPageProps) => {
  const { category, locale } = await params;
  const lang = (locale as "en" | "es") || "en";

  if (!categoryMeta[category]) notFound();

  const meta = categoryMeta[category];
  const catConfig =
    PRODUCT_CATEGORIES[category as keyof typeof PRODUCT_CATEGORIES];
  const products = await getProducts({ category });

  return (
    <>
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
        <section className="py-8 bg-brand-linen border-b border-brand-stone/10">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="flex flex-wrap gap-2">
              {catConfig.subcategories.map((sub) => (
                <a
                  key={sub.slug}
                  href={`/shop/${category}?sub=${sub.slug}`}
                  className="px-4 py-2 text-sm font-body border border-brand-stone/20 rounded-full text-brand-charcoal hover:border-brand-terracotta hover:text-brand-terracotta transition-colors"
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
