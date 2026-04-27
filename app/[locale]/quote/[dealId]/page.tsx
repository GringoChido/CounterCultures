import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { loadQuoteData } from "@/app/lib/quote-data";
import { verifyQuoteToken } from "@/app/lib/quote-token";
import { QuoteDocument } from "@/app/components/quote-document";
import { getOrCreateDepositLink } from "@/app/lib/stripe-deposit";
import { buildLocaleMetadata, type Locale } from "@/app/lib/seo";

export const dynamic = "force-dynamic";

interface PublicQuoteProps {
  params: Promise<{ dealId: string; locale: string }>;
  searchParams: Promise<{ t?: string }>;
}

export const generateMetadata = async ({
  params,
}: PublicQuoteProps): Promise<Metadata> => {
  const { dealId, locale } = await params;
  return buildLocaleMetadata({
    locale: locale as Locale,
    path: `quote/${dealId}`,
    title: {
      en: "Quote — Counter Cultures",
      es: "Cotización — Counter Cultures",
    },
    description: {
      en: "Your Counter Cultures quote.",
      es: "Tu cotización de Counter Cultures.",
    },
    absoluteTitle: true,
    index: false,
  });
};

const InvalidTokenView = async ({
  reason,
  locale,
}: {
  reason?: string;
  locale: string;
}) => {
  const t = await getTranslations({ locale, namespace: "quote" });
  return (
    <main className="min-h-screen bg-[#F5F0EB] flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h1 className="font-['Cormorant',serif] text-3xl text-[#1a1a1a] mb-2">
          {t("invalidTitle")}
        </h1>
        <p className="text-sm text-[#6B6B6B]">
          {reason === "expired" ? t("invalidExpired") : t("invalidDefault")}
        </p>
        <p className="mt-6 text-[11px] text-[#999]">{t("footerContact")}</p>
      </div>
    </main>
  );
};

const PublicQuotePage = async ({
  params,
  searchParams,
}: PublicQuoteProps) => {
  const { dealId, locale } = await params;
  const { t } = await searchParams;

  const verification = verifyQuoteToken(t, dealId);
  if (!verification.valid) {
    return <InvalidTokenView reason={verification.reason} locale={locale} />;
  }

  const data = await loadQuoteData(dealId);
  if (!data) notFound();

  // Lazily-created Stripe payment link (cached in-memory by dealId for 7 days).
  const depositPayUrl =
    data.grandTotal > 0
      ? await getOrCreateDepositLink({
          dealId,
          amountMxn: data.depositAmount,
          description: `${data.docNumber} — 50% deposit for ${data.deal.company || data.deal.name}`,
        })
      : null;

  return (
    <main className="bg-[#F5F0EB] min-h-screen py-10">
      {/* Hide any dev-overlay bits + provide print CSS similar to the auth'd route */}
      <style
        // eslint-disable-next-line react/no-unknown-property
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              html, body { background: #fff !important; }
              .no-print, nextjs-portal { display: none !important; }
              .quote-doc { box-shadow: none !important; margin: 0 !important; }
              @page { size: letter; margin: 0.5in; }
            }
          `,
        }}
      />
      <QuoteDocument data={data} depositPayUrl={depositPayUrl} customerFacing />

      <div className="no-print max-w-[800px] mx-auto mt-6 text-center text-[11px] text-[#999]">
        Quote {data.docNumber}. Keep this link — you can return to it any time
        before {new Date(data.validUntil).toLocaleDateString()}.
      </div>
    </main>
  );
};

export default PublicQuotePage;
