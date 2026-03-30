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
      alternateLocale: isEs ? "en_US" : "es_MX",
      type: "website",
      images: meta?.heroImage
        ? [{ url: meta.heroImage, width: 1200, height: 630, alt: title }]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: meta?.heroImage ? [meta.heroImage] : [],
    },
  };
};

const SubcategoryPage = async ({ params }: SubcategoryPageProps) => {
  const { category, subcategory, locale } = await params;
  const lang = (locale as "en" | "es") || "en";
  const isEs = lang === "es";

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
        name: catLabel,
        item: `${BASE_URL}/${locale}/shop/${category}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: subLabel,
        item: `${BASE_URL}/${locale}/shop/${category}/${subcategory}`,
      },
    ],
  };

  // ItemList JSON-LD for subcategory product listing
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${subLabel} — ${catLabel}`,
    description: heroDescription,
    url: `${BASE_URL}/${locale}/shop/${category}/${subcategory}`,
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
          eyebrow={`${catLabel} ${lang === "en" ? "Collection" : "Colección"}`}
          title={subLabel}
          description={heroDescription}
          productCount={products.length}
          ctaLabel={lang === "en" ? "Browse Collection" : "Explorar Colección"}
          ctaHref="#products"
          imageSrc={heroImage}
        />

        {/* Breadcrumb + Subcategory pills */}
        <section className="py-4 md:py-6 bg-brand-linen border-b border-brand-stone/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 font-mono text-xs text-brand-stone mb-4 flex-wrap">
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
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <Link
                href={`/${locale}/shop/${category}`}
                className="px-4 py-2.5 min-h-[44px] flex items-center text-sm font-body border border-brand-stone/20 rounded-full text-brand-charcoal hover:border-brand-terracotta hover:text-brand-terracotta transition-colors shrink-0 whitespace-nowrap"
              >
                {lang === "en" ? "All" : "Todos"}
              </Link>
              {catConfig.subcategories.map((sub) => (
                <Link
                  key={sub.slug}
                  href={`/${locale}/shop/${category}/${sub.slug}`}
                  className={`px-4 py-2.5 min-h-[44px] flex items-center text-sm font-body border rounded-full transition-colors shrink-0 whitespace-nowrap ${
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
