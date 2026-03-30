import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/app/components/layout/header";
import { Footer } from "@/app/components/layout/footer";
import { ShopCatalog } from "../shop-catalog";
import { getProducts } from "@/app/lib/sheets";
import { PRODUCT_CATEGORIES } from "@/app/lib/constants";

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

const categoryMeta: Record<string, { title: string; description: string; subtitle: string }> = {
  bathroom: {
    title: "Bathroom Fixtures — Sinks, Faucets, Tubs & More",
    description:
      "Luxury bathroom fixtures from Kohler, TOTO, Badeloft, California Faucets, and handcrafted artisanal copper and stone basins by Mexican artisans.",
    subtitle:
      "Lavabos, grifos, bañeras, sanitarios, regaderas, accesorios y drenajes from the world's finest brands and Mexico's master artisans.",
  },
  kitchen: {
    title: "Kitchen Fixtures — Sinks, Faucets, Hoods & Appliances",
    description:
      "Premium kitchen sinks by BLANCO and Kohler, faucets by Brizo and California Faucets, range hoods, and professional-grade appliances.",
    subtitle:
      "Tarjas, fregaderos, mezcladoras, campanas y electrodomésticos — from BLANCO Silgranit to Brizo Litze and California Faucets bridge-style designs.",
  },
  hardware: {
    title: "Door Hardware — Locks, Handles, Knobs & Pulls",
    description:
      "Hand-cast bronze entry lock sets by Sun Valley Bronze and precision door hardware by Emtek. Every piece individually finished.",
    subtitle:
      "Chapas de entrada, cerraduras interiores, jaladeras, perillas y ganchos — Sun Valley Bronze hand-cast silicon bronze and Emtek solid brass.",
  },
};

export const generateMetadata = async ({ params }: CategoryPageProps): Promise<Metadata> => {
  const { category } = await params;
  const meta = categoryMeta[category];
  if (!meta) return { title: "Shop" };
  return { title: meta.title, description: meta.description };
};

const CategoryPage = async ({ params }: CategoryPageProps) => {
  const { category } = await params;

  if (!categoryMeta[category]) notFound();

  const meta = categoryMeta[category];
  const catConfig = PRODUCT_CATEGORIES[category as keyof typeof PRODUCT_CATEGORIES];
  const products = await getProducts({ category });

  return (
    <>
      <Header />
      <main className="pt-16 md:pt-20">
        <section className="py-16 lg:py-20 bg-brand-linen border-b border-brand-stone/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <span className="font-mono text-xs tracking-[0.2em] text-brand-stone uppercase">
              {catConfig.label.en}
            </span>
            <h1 className="mt-3 font-display text-4xl md:text-5xl lg:text-6xl font-light tracking-wide text-brand-charcoal">
              {catConfig.label.en}
            </h1>
            <p className="mt-4 font-body text-base text-brand-stone max-w-2xl">
              {meta.subtitle}
            </p>

            {/* Subcategory pills */}
            <div className="mt-8 flex flex-wrap gap-2">
              {catConfig.subcategories.map((sub) => (
                <a
                  key={sub.slug}
                  href={`/shop/${category}?sub=${sub.slug}`}
                  className="px-4 py-2 text-sm font-body border border-brand-stone/20 rounded-full text-brand-charcoal hover:border-brand-terracotta hover:text-brand-terracotta transition-colors"
                >
                  {sub.label.en}
                </a>
              ))}
            </div>
          </div>
        </section>

        <ShopCatalog initialProducts={products} initialCategory={category} />
      </main>
      <Footer />
    </>
  );
};

export default CategoryPage;
