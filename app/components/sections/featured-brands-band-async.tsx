import { FeaturedBrandsBand } from "./featured-brands-band";
import { getFeaturedBrands } from "@/app/lib/featured-brands";

interface FeaturedBrandsBandAsyncProps {
  locale: "en" | "es";
}

const FeaturedBrandsBandAsync = async ({
  locale,
}: FeaturedBrandsBandAsyncProps) => {
  const brands = await getFeaturedBrands().catch(() => []);
  return <FeaturedBrandsBand locale={locale} brands={brands} />;
};

export { FeaturedBrandsBandAsync };
