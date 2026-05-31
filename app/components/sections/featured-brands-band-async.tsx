import { FeaturedBrandsBand } from "./featured-brands-band";

interface FeaturedBrandsBandAsyncProps {
  locale: "en" | "es";
}

const FeaturedBrandsBandAsync = ({ locale }: FeaturedBrandsBandAsyncProps) => {
  return <FeaturedBrandsBand locale={locale} brands={[]} />;
};

export { FeaturedBrandsBandAsync };
