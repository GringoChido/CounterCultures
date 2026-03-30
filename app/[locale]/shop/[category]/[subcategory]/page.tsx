import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/app/components/layout/header";
import { Footer } from "@/app/components/layout/footer";
import { CategoryHero } from "@/app/components/sections/category-hero";
import { ShopCatalog } from "../../shop-catalog";
import { getProductsBySubcategory } from "@/app/lib/sheets";
import { PRODUCT_CATEGORIES, SUBCATEGORY_META } from "@/app/lib/constants";
import type { CategoryKey } from "@/app/lib/constants";

interface SubcategoryPageProps {
  params: Promise<{ category: string; subcategory: string; locale: string }>;
}

const BASE_URL = "https://countercultures.mx";

export const generateMetadata = async ({
  params,
}: SubcategoryPageProps): Promise<Metadata> => {
  const { category, subcategory, locale } = await params;
  const isEs = locale === "es";

  const catConfig = PRODUCT_CATEGORIES[category as CategoryKey];
  if (!catConfig) return { title: "Shop" };

  const subConfig = catConfig.subcategories.find((s) => s.slug === subcategory);
  if (!subConfig) return { title: "Shop" };

  const meta = SUBCATEGORY_META[category]?.[subcategory];
  const subLabel = subConfig.label[isEs ? "es" : "en"];
  const catLabel = catConfig.label[isEs ? "es" : "en"];
  const description = meta?.description[isEs ? "es" : "en"] || "";

  const title = `${subLabel} — ${catLabel}`;

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/${locale}/shop/${category}/${subcategory}`,
      languages: {
        en: `${BASE_URL}/en/shop/${category}/${subcategory}`,
        es: `${BASE_URL}/es/shop/${category}/${subcategory}`,
        "x-default": `${BASE_URL}/en/shop/${category}/${subcategory}`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}/shop/${category}/${subcategory}`,
      locale: isEs ? "es_MX" : "en_US",
      images: meta?.heroImage
        ? [{ url: meta.heroImage, width: 1920, height: 1080, alt: title }]
        : [],
    },
  };
};

const SubcategoryPage = async ({ params }: SubcategoryPageProps) => {
  const { category, subcategory, locale } = await params;
  const lang = (locale as "en" | "es") || "en";

  const catConfig = PRODUCT_CATEGORIES[category as CategoryKey];
  if (!catConfig) notFound();

  const subConfig = catConfig.subcategories.find((s) => s.slug === subcategory);
  if (!subConfig) notFound();

  const meta = SUBCATEGORY_META[category]?.[subcategory];
  const products = await getProductsBySubcategory(category, subcategory);

  const subLabel = subConfig.label[lang];
  const catLabel = catConfig.label[lang];
  const heroDescription = meta?.description[lang] || "";
  const heroImage = meta?.heroImage || "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1920&q=80";

  return (
    <>
      <Header locale={lang} />
      <main>
        <CategoryHero
          eyebrow={`${catLabel} ${lang === "en" ? "Collection" : "Colección"}`}
          title={subLabel}
          description={heroDescription}
          productCount={products.length}
          ctaLabel={lang === "en" ? "Browse Collection" : "Explorar Colección"}
          ctaHref="#products"
          imageSrc={heroImage}
        />

        {/* Breadcrumb + Subcategory pills */}
        <section className="py-6 bg-brand-linen border-b border-brand-stone/10">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 font-mono text-xs text-brand-stone mb-5 flex-wrap">
              <Link href={`/${locale}`} className="hover:text-brand-terracotta transition-colors">
                {lang === "en" ? "Home" : "Inicio"}
              </Link>
              <span>/</span>
              <Link href={`/${locale}/shop`} className="hover:text-brand-terracotta transition-colors">
                {lang === "en" ? "Shop" : "Tienda"}
              </Link>
              <span>/</span>
              <Link href={`/${locale}/shop/${category}`} className="hover:text-brand-terracotta transition-colors">
                {catLabel}
              </Link>
              <span>/</span>
              <span className="text-brand-charcoal">{subLabel}</span>
            </nav>

            {/* Sibling subcategory pills */}
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/${locale}/shop/${category}`}
                className="px-4 py-2 text-sm font-body border border-brand-stone/20 rounded-full text-brand-charcoal hover:border-brand-terracotta hover:text-brand-terracotta transition-colors"
              >
                {lang === "en" ? "All" : "Todos"}
              </Link>
              {catConfig.subcategories.map((sub) => (
                <Link
                  key={sub.slug}
                  href={`/${locale}/shop/${category}/${sub.slug}`}
                  className={`px-4 py-2 text-sm font-body border rounded-full transition-colors ${
                    sub.slug === subcategory
                      ? "border-brand-terracotta text-brand-terracotta bg-brand-terracotta/5"
                      : "border-brand-stone/20 text-brand-charcoal hover:border-brand-terracotta hover:text-brand-terracotta"
                  }`}
                >
                  {sub.label[lang]}
                </Link>
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

export default SubcategoryPage;
