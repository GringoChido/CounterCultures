import { CatalogDepthBand } from "./catalog-depth-band";
import { getCatalogStats } from "@/app/lib/products-full";

interface CatalogDepthBandAsyncProps {
  locale: "en" | "es";
}

// Async wrapper so the homepage can stream this band in via <Suspense>.
// `getCatalogStats` triggers the 354k-row product cache load on cold start;
// keeping it off the critical path lets the rest of the page render in <1s.
const CatalogDepthBandAsync = async ({ locale }: CatalogDepthBandAsyncProps) => {
  const stats = await getCatalogStats().catch(() => ({ total: 0, brandCount: 0 }));
  return <CatalogDepthBand locale={locale} totalCatalog={stats.total} />;
};

export { CatalogDepthBandAsync };
