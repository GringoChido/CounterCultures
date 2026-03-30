import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/app/components/layout/header";
import { Footer } from "@/app/components/layout/footer";
import { ProductDetail } from "./product-detail";
import { getProductBySlug, getProducts } from "@/app/lib/sheets";
import { PRODUCT_CATEGORIES } from "@/app/lib/constants";
import type { CategoryKey } from "@/app/lib/constants";

interface PDPProps {
  params: Promise<{ category: string; slug: string; locale: string }>;
}

const BASE_URL = "https://countercultures.mx";

export const generateMetadata = async ({ params }: PDPProps): Promise<Metadata> => {
  const { slug, locale, category } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product Not Found" };

  const isEs = locale === "es";
  const productName = isEs && product.name ? product.name : product.nameEn;
  const productDescription = isEs
    ? product.description
    : product.descriptionEn;

  const title = `${productName} — ${product.brand}`;
  const description = productDescription;

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/${locale}/shop/${category}/p/${slug}`,
      languages: {
        en: `${BASE_URL}/en/shop/${category}/p/${slug}`,
        es: `${BASE_URL}/es/shop/${category}/p/${slug}`,
        "x-default": `${BASE_URL}/en/shop/${category}/p/${slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}/shop/${category}/p/${slug}`,
      locale: isEs ? "es_MX" : "en_US",
      alternateLocale: isEs ? "en_US" : "es_MX",
      type: "website",
      images: product.images[0]
        ? [{ url: product.images[0], width: 1200, height: 630, alt: productName }]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: product.images[0] ? [product.images[0]] : [],
    },
  };
};

const ProductPage = async ({ params }: PDPProps) => {
  const { category, slug, locale } = await params;
  const lang = (locale as "en" | "es") || "en";
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  // Cross-sells: same subcategory first, then same category
  const related = await getProducts({ category: product.category, subcategory: product.subcategory });
  let crossSells = related.filter((p) => p.id !== product.id).slice(0, 4);
  if (crossSells.length < 4) {
    const moreCrossSells = await getProducts({ category: product.category });
    const additional = moreCrossSells
      .filter((p) => p.id !== product.id && !crossSells.some((cs) => cs.id === p.id))
      .slice(0, 4 - crossSells.length);
    crossSells = [...crossSells, ...additional];
  }

  // Resolve subcategory label for breadcrumbs
  const catConfig = PRODUCT_CATEGORIES[category as CategoryKey];
  const subConfig = catConfig?.subcategories.find((s) => s.slug === product.subcategory);

  const isEs = lang === "es";
  const categoryLabel = catConfig?.label[lang] || category;
  const subcategoryLabel = subConfig?.label[lang] || product.subcategory;

  // Enriched Product JSON-LD — GEO: explicit entity linking, AEO: complete product data
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${BASE_URL}/${lang}/shop/${category}/p/${product.slug}#product`,
    name: product.nameEn,
    description: product.descriptionEn,
    brand: {
      "@type": "Brand",
      name: product.brand,
    },
    manufacturer: {
      "@type": "Organization",
      name: product.brand,
    },
    sku: product.sku,
    mpn: product.sku,
    image: product.images.map((img) => ({
      "@type": "ImageObject",
      url: img,
      representativeOfPage: img === product.images[0],
    })),
    url: `${BASE_URL}/${lang}/shop/${category}/p/${product.slug}`,
    offers: {
      "@type": "Offer",
      "@id": `${BASE_URL}/${lang}/shop/${category}/p/${product.slug}#offer`,
      price: product.price > 0 ? product.price : undefined,
      priceCurrency: product.currency || "MXN",
      availability:
        product.availability === "in-stock"
          ? "https://schema.org/InStock"
          : product.availability === "made-to-order"
            ? "https://schema.org/PreOrder"
            : "https://schema.org/LimitedAvailability",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        "@id": `${BASE_URL}/#organization`,
        name: "Counter Cultures",
      },
      url: `${BASE_URL}/${lang}/shop/${category}/p/${product.slug}`,
    },
    category: `${categoryLabel} > ${subcategoryLabel}`,
    inProductGroupWithID: product.subcategory,
    isRelatedTo: crossSells.slice(0, 3).map((p) => ({
      "@type": "Product",
      name: p.nameEn,
      url: `${BASE_URL}/${lang}/shop/${p.category}/p/${p.slug}`,
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
        item: `${BASE_URL}/${lang}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: isEs ? "Tienda" : "Shop",
        item: `${BASE_URL}/${lang}/shop`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: categoryLabel,
        item: `${BASE_URL}/${lang}/shop/${category}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: subcategoryLabel,
        item: `${BASE_URL}/${lang}/shop/${category}/${product.subcategory}`,
      },
      {
        "@type": "ListItem",
        position: 5,
        name: product.nameEn,
        item: `${BASE_URL}/${lang}/shop/${category}/p/${product.slug}`,
      },
    ],
  };

  return (
    <>
      <Header locale={lang} />
      <main className="pt-16 md:pt-20">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
        <ProductDetail
          product={product}
          crossSells={crossSells}
          locale={lang}
          categoryLabel={categoryLabel}
          subcategoryLabel={subcategoryLabel}
          subcategorySlug={product.subcategory}
        />
      </main>
      <Footer locale={lang} />
    </>
  );
};

export default ProductPage;
