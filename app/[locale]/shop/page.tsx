import { redirect } from "next/navigation";

interface ShopPageProps {
  params: Promise<{ locale: string }>;
}

const ShopPage = async ({ params }: ShopPageProps) => {
  const { locale } = await params;
  redirect(`/${locale}/shop/catalog`);
};

export default ShopPage;
