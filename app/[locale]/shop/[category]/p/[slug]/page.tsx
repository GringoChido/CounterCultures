import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Header } from "@/app/components/layout/header";
import { Footer } from "@/app/components/layout/footer";
import {
  getProductBySlug,
  getRelatedProducts,
  getProductSlug,
  getTopPdpSlugs,
  type ProductCategory,
} from "@/app/lib/products-full";
import { pdpUrl } from "@/app/lib/pdp-href";
import {
  getInShowroomIds,
  getMostSpecifiedScores,
} from "@/app/lib/catalog-signals";
import { getProductContent } from "@/app/lib/product-content";
import { BRANDS, PRODUCT_CATEGORIES } from "@/app/lib/constants";
import type { CategoryKey } from "@/app/lib/constants";
import { customerAuthOptions } from "@/app/lib/customer-auth";
import { getTradePrice } from "@/app/lib/trade-pricing";
import { PDPClient, type PDPClientProps } from "./pdp-client";

export const revalidate = 1800;

const BASE_URL = "https://countercultures.mx";

const BRAND_SLUG_MAP = new Map<string, string>(BRANDS.map((b) => [b.name, b.slug]));

const VALID_CATEGORIES = new Set<string>(["bathroom", "kitchen", "hardware"]);

export const generateStaticParams = async (): Promise<
  Array<{ locale: string; category: string; slug: string }>
> => {
  try {
    const params = await getTopPdpSlugs(1000);
    console.log(
      `[generateStaticParams] PDP: ${params.length} params (${params.length / 2} slugs × 2 locales)`,
    );
    return params;
  } catch (err) {
    console.warn(
      "[generateStaticParams] PDP pre-render failed — falling back to ISR-only:",
      err instanceof Error ? err.message : err,
    );
    return [];
  }
};

interface PDPProps {
  params: Promise<{ locale: string; category: string; slug: string }>;
}

export const generateMetadata = async ({
  params,
}: PDPProps): Promise<Metadata> => {
  const { locale, category, slug } = await params;
  if (!VALID_CATEGORIES.has(category)) return {};

  const product = await getProductBySlug(slug);
  if (!product) return {};

  const content = getProductContent(product.id);
  const isEs = locale === "es";
  const title = content?.title || product.name || product.sku;
  const desc =
    (isEs ? content?.descriptionEs : content?.descriptionEn) ||
    content?.descriptionEs ||
    `${product.brand} ${product.name}`;
  const canonical = `${BASE_URL}/${locale}/shop/${category}/p/${slug}`;
  const images = content?.gallery?.length
    ? content.gallery
    : product.imageSrc
      ? [product.imageSrc]
      : [];
  const imageUrl =
    images.length > 0
      ? images[0].startsWith("http")
        ? images[0]
        : `${BASE_URL}${images[0]}`
      : undefined;

  return {
    title: `${title} — ${product.brand} | Counter Cultures`,
    description: desc.slice(0, 160),
    robots: { index: true, follow: true },
    alternates: {
      canonical,
      languages: {
        en: `${BASE_URL}/en/shop/${category}/p/${slug}`,
        es: `${BASE_URL}/es/shop/${category}/p/${slug}`,
        "x-default": `${BASE_URL}/en/shop/${category}/p/${slug}`,
      },
    },
    openGraph: {
      title: `${title} — ${product.brand}`,
      description: desc.slice(0, 160),
      url: canonical,
      siteName: "Counter Cultures",
      type: "website",
      ...(imageUrl && {
        images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
      }),
    },
  };
};

const PDPPage = async ({ params }: PDPProps) => {
  const t0 = Date.now();
  const { locale, category, slug } = await params;
  const lang = (locale as "en" | "es") || "en";
  if (!VALID_CATEGORIES.has(category)) notFound();

  const found = await getProductBySlug(slug);
  if (!found) notFound();
  if (found.category !== category) redirect(`/${locale}/shop/${found.category}/p/${slug}`);

  const session = await getServerSession(customerAuthOptions);
  const customerUser = session?.user as
    | { isTrade?: boolean; tradeTier?: string }
    | undefined;
  let product = found;
  if (customerUser?.isTrade) {
    const tier = customerUser.tradeTier ?? "default";
    const tp = await getTradePrice(product.id, tier);
    if (tp != null) product = { ...product, tradePrice: tp };
  }

  const content = getProductContent(product.id);
  const isEs = locale === "es";

  const [showroomIds, specScores, relatedRaw] = await Promise.all([
    getInShowroomIds().catch(() => new Set<string>()),
    getMostSpecifiedScores().catch(() => new Map()),
    getRelatedProducts(product.category, product.id, 8),
  ]);

  const inShowroom = showroomIds.has(product.id);
  const specSignal = specScores.get(product.id);
  const projectCount = specSignal?.projectCount ?? 0;
  const brandSlug = BRAND_SLUG_MAP.get(product.brand) ?? null;

  const catConfig = PRODUCT_CATEGORIES[category as CategoryKey];
  const categoryLabel = catConfig
    ? isEs
      ? catConfig.label.es
      : catConfig.label.en
    : category;

  const images = content?.gallery?.length
    ? content.gallery
    : product.imageSrc
      ? [product.imageSrc]
      : [];

  const relatedProducts: PDPClientProps["relatedProducts"] = relatedRaw.map(
    (rp) => ({
      id: rp.id,
      name: rp.name,
      sku: rp.sku,
      brand: rp.brand,
      category: rp.category,
      listPrice: rp.listPrice,
      currency: rp.currency,
      hasImage: rp.hasImage,
      imageSrc: rp.imageSrc,
      slug: getProductSlug(rp),
    })
  );

  const canonical = `${BASE_URL}/${locale}/shop/${category}/p/${slug}`;
  const availability = product.inStock
    ? "https://schema.org/InStock"
    : "https://schema.org/PreOrder";

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${canonical}#product`,
    name: content?.title || product.name,
    description:
      (isEs ? content?.descriptionEs : content?.descriptionEn) ||
      content?.descriptionEs ||
      product.name,
    sku: product.sku,
    mpn: product.sku,
    brand: { "@type": "Brand", name: product.brand },
    ...(images.length > 0 && {
      image: images.map((img) =>
        img.startsWith("http") ? img : `${BASE_URL}${img}`
      ),
    }),
    url: canonical,
    offers: {
      "@type": "Offer",
      url: canonical,
      priceCurrency: product.currency || "MXN",
      ...(product.listPrice > 10 && { price: product.listPrice }),
      availability,
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        "@id": `${BASE_URL}/#organization`,
        name: "Counter Cultures",
      },
    },
    category: categoryLabel,
    ...(relatedProducts.length > 0 && {
      isRelatedTo: relatedProducts.slice(0, 3).map((rp) => ({
        "@type": "Product",
        name: rp.name,
        url: pdpUrl(locale, rp),
      })),
    }),
  };

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
        name: isEs ? "Catálogo" : "Catalog",
        item: `${BASE_URL}/${locale}/shop/catalog`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: categoryLabel,
        item: `${BASE_URL}/${locale}/shop/${category}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: content?.title || product.name,
        item: canonical,
      },
    ],
  };

  console.log(
    `[pdp-render] ${locale}/${category}/${slug} — ${Date.now() - t0}ms — product=${product.id} brand=${product.brand}`,
  );

  return (
    <>
      <Header />
      <main id="main" tabIndex={-1} className="pt-16 md:pt-20 bg-white">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
        <PDPClient
          product={{
            id: product.id,
            name: product.name,
            sku: product.sku,
            brand: product.brand,
            category: product.category,
            listPrice: product.listPrice,
            tradePrice: product.tradePrice,
            currency: product.currency,
            uom: product.uom,
            inStock: product.inStock ?? false,
            stockQty: product.stockQty ?? 0,
            hasImage: product.hasImage,
            imageSrc: product.imageSrc,
          }}
          locale={locale as "en" | "es"}
          categoryLabel={categoryLabel}
          categorySlug={category}
          brandSlug={brandSlug}
          relatedProducts={relatedProducts}
          inShowroom={inShowroom}
          projectCount={projectCount}
          descriptionEs={content?.descriptionEs}
          descriptionEn={content?.descriptionEn}
          features={content?.features}
          gallery={images}
          finishes={content?.variants}
          specSheetUrl={content?.specSheetUrl}
          specSheetLocal={content?.specSheetLocal}
          pdpSlug={slug}
        />
      </main>
      <Footer />
    </>
  );
};

export default PDPPage;
