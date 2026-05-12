import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Header } from "@/app/components/layout/header";
import { Footer } from "@/app/components/layout/footer";
import { CheckoutStepper } from "./checkout-stepper";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
};

interface CheckoutPageProps {
  params: Promise<{ locale: string }>;
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const lang = (locale as "en" | "es") || "en";
  return (
    <>
      <Header locale={lang} />
      <main id="main" tabIndex={-1} className="pt-20">
        <CheckoutStepper locale={lang} />
      </main>
      <Footer locale={lang} />
    </>
  );
}
