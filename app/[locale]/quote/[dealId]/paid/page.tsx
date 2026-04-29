import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildLocaleMetadata, type Locale } from "@/app/lib/seo";

interface QuotePaidProps {
  params: Promise<{ dealId: string; locale: string }>;
}

export const generateMetadata = async ({
  params,
}: QuotePaidProps): Promise<Metadata> => {
  const { dealId, locale } = await params;
  return buildLocaleMetadata({
    locale: locale as Locale,
    path: `quote/${dealId}/paid`,
    title: {
      en: "Deposit received — Counter Cultures",
      es: "Depósito recibido — Counter Cultures",
    },
    description: {
      en: "Thank you. Your deposit has been received.",
      es: "Gracias. Tu depósito ha sido recibido.",
    },
    absoluteTitle: true,
    index: false,
  });
};

const QuotePaidPage = async ({ params }: QuotePaidProps) => {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "quote" });

  return (
    <main id="main" tabIndex={-1} className="min-h-screen bg-brand-linen flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="w-14 h-14 mx-auto mb-6 rounded-full bg-brand-copper flex items-center justify-center">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 className="font-['Cormorant',serif] text-3xl font-light text-brand-charcoal mb-2">
          {t("paidTitle")}
        </h1>
        <p className="text-sm text-dash-text-secondary max-w-sm mx-auto">{t("paidBody")}</p>
        <p className="mt-8 text-[11px] text-dash-text-muted">
          {t("footerAddress")}
          <br />
          {t("footerContact")}
        </p>
      </div>
    </main>
  );
};

export default QuotePaidPage;
