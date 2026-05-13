import { redirect, notFound } from "next/navigation";
import { getProductBySlug } from "@/app/lib/products-full";

interface FallbackPDPProps {
  params: Promise<{ locale: string; slug: string }>;
}

const FallbackPDP = async ({ params }: FallbackPDPProps) => {
  const { locale, slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  redirect(`/${locale}/shop/${product.category}/p/${slug}`);
};

export default FallbackPDP;
