import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getServerSession } from "next-auth";
import { Header } from "@/app/components/layout/header";
import { Footer } from "@/app/components/layout/footer";
import { customerAuthOptions } from "@/app/lib/customer-auth";
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
  const session = await getServerSession(customerAuthOptions);
  const isTradeCustomer =
    (session?.user as { isTrade?: boolean } | undefined)?.isTrade === true;
  return (
    <>
      <Header />
      <main id="main" tabIndex={-1} className="pt-20 lg:pt-[116px]">
        <CheckoutStepper locale={lang} isTradeCustomer={isTradeCustomer} />
      </main>
      <Footer />
    </>
  );
}
