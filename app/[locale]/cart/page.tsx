import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Header } from "@/app/components/layout/header";
import { Footer } from "@/app/components/layout/footer";
import { CartPageClient } from "./cart-page-client";

export const metadata: Metadata = {
  title: "Cart",
  robots: { index: false },
};

interface CartPageProps {
  params: Promise<{ locale: string }>;
}

export default async function CartPage({ params }: CartPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const lang = (locale as "en" | "es") || "en";
  return (
    <>
      <Header locale={lang} />
      <main id="main" tabIndex={-1} className="pt-20">
        <CartPageClient locale={lang} />
      </main>
      <Footer locale={lang} />
    </>
  );
}
