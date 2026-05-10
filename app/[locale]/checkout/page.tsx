import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { CheckoutStepper } from "./checkout-stepper";

export const metadata: Metadata = {
  title: "Checkout",
};

interface CheckoutPageProps {
  params: Promise<{ locale: string }>;
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <CheckoutStepper locale={locale as "en" | "es"} />;
}
