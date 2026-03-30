import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/app/components/layout/header";
import { Footer } from "@/app/components/layout/footer";
import { ProductDetail } from "./product-detail";
import { getProductBySlug, getProducts } from "@/app/lib/sheets";

interface PDPProps {
  params: Promise<{ category: string; slug: string; locale: string }>;
}

export const generateMetadata = async ({ params }: PDPProps): Promise<Metadata> => {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product Not Found" };

  return {
    title: `${product.nameEn} — ${product.brand}`,
    description: product.descriptionEn,
    openGraph: {
      images: product.images[0] ? [{ url: product.images[0] }] : [],
    },
  };
};

const ProductPage = async ({ params }: PDPProps) => {
  const { category, slug, locale } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  // Cross-sells: same category, different product
  const related = await getProducts({ category: product.category });
  const crossSells = related
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.nameEn,
    description: product.descriptionEn,
    brand: { "@type": "Brand", name: product.brand },
    sku: product.sku,
    image: product.images[0],
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: product.currency,
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "Counter Cultures",
      },
    },
  };

  return (
    <>
      <Header locale={locale} />
      <main className="pt-20">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ProductDetail product={product} crossSells={crossSells} />
      </main>
      <Footer locale={locale} />
    </>
  );
};

export default ProductPage;
