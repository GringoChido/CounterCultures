import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { CartPageClient } from "./cart-page-client";

export const metadata: Metadata = {
  title: "Cart",
};

interface CartPageProps {
  params: Promise<{ locale: string }>;
}

export default async function CartPage({ params }: CartPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <CartPageClient locale={locale as "en" | "es"} />;
}
