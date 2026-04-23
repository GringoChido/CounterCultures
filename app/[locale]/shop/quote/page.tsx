import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface LegacyQuoteProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; brand?: string; category?: string }>;
}

/**
 * Legacy /shop/quote now redirects to the new /shop/catalog experience,
 * preserving the search/brand/category filters. Old links still work.
 */
const LegacyQuotePage = async ({ params, searchParams }: LegacyQuoteProps) => {
  const { locale } = await params;
  const sp = await searchParams;
  const qs = new URLSearchParams();
  if (sp.q) qs.set("q", sp.q);
  if (sp.brand) qs.set("brand", sp.brand);
  if (sp.category) qs.set("category", sp.category);
  const target = `/${locale}/shop/catalog${qs.toString() ? `?${qs}` : ""}`;
  redirect(target);
};

export default LegacyQuotePage;
