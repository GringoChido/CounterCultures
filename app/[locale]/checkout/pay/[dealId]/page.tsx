import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { PayClient } from "./pay-client";

export const metadata: Metadata = {
  title: "Payment",
  robots: { index: false },
};

interface PayPageProps {
  params: Promise<{ locale: string; dealId: string }>;
}

export default async function PayPage({ params }: PayPageProps) {
  const { locale, dealId } = await params;
  setRequestLocale(locale);

  return (
    <PayClient
      locale={locale as "en" | "es"}
      dealId={dealId}
    />
  );
}
