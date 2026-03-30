import type { Metadata } from "next";
import { TradeContent } from "./trade-content";

const BASE_URL = "https://countercultures.mx";

interface TradePageProps {
  params: Promise<{ locale: string }>;
}

export const generateMetadata = async ({
  params,
}: TradePageProps): Promise<Metadata> => {
  const { locale } = await params;
  const isEs = locale === "es";

  const title = isEs
    ? "Programa Trade — Precios y Soporte para Arquitectos y Diseñadores"
    : "Trade Program — Pricing & Support for Architects and Designers";
  const description = isEs
    ? "Precios exclusivos, soporte de especificaciones y atención prioritaria para arquitectos, diseñadores de interiores y constructores en México. Solicita acceso en 2 minutos."
    : "Exclusive pricing, specification support, and priority fulfillment for architects, interior designers, and builders in Mexico. Apply for access in 2 minutes.";

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/${locale}/trade`,
      languages: {
        en: `${BASE_URL}/en/trade`,
        es: `${BASE_URL}/es/trade`,
        "x-default": `${BASE_URL}/en/trade`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}/trade`,
      locale: isEs ? "es_MX" : "en_US",
    },
  };
};

const TradePage = () => {
  return <TradeContent />;
};

export default TradePage;
