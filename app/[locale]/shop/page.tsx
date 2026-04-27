import { redirect } from "next/navigation";

interface ShopPageProps {
  params: Promise<{ locale: string }>;
}

// /shop has been consolidated into the homepage — the home page is now
// the single hub for routing into Bathroom / Kitchen / Hardware,
// authorized brands, the full catalog, the showroom, and the trade
// program. Preserves SEO continuity for any historical /shop links.
const ShopPage = async ({ params }: ShopPageProps) => {
  const { locale } = await params;
  redirect(`/${locale}`);
};

export default ShopPage;
