import { notFound } from "next/navigation";
import { loadQuoteData } from "@/app/lib/quote-data";
import { QuoteDocument } from "@/app/components/quote-document";
import { AutoPrint } from "./auto-print";

export const dynamic = "force-dynamic";

interface PrintPageProps {
  params: Promise<{ dealId: string }>;
  searchParams: Promise<{ auto?: string }>;
}

const QuotePrintPage = async ({ params, searchParams }: PrintPageProps) => {
  const { dealId } = await params;
  const { auto } = await searchParams;

  const data = await loadQuoteData(dealId);
  if (!data) notFound();

  return (
    <>
      {/* @media print strips dashboard chrome so Cmd+P outputs a clean quote. */}
      <style
        // eslint-disable-next-line react/no-unknown-property
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              html, body { background: #fff !important; }
              aside, header, .no-print,
              [class*="ActionFab"], [class*="AIChatWidget"], nextjs-portal {
                display: none !important;
              }
              main { padding: 0 !important; margin-left: 0 !important; }
              .flex.min-h-screen > div { margin-left: 0 !important; }
              .quote-doc { box-shadow: none !important; margin: 0 !important; }
              @page { size: letter; margin: 0.5in; }
            }
          `,
        }}
      />

      <div className="bg-brand-stone/5 min-h-screen py-10 print:py-0 print:bg-dash-surface">
        <QuoteDocument data={data} />

        <div className="no-print max-w-[800px] mx-auto mt-6 flex items-center justify-between text-xs text-dash-text-secondary">
          <span>
            Press{" "}
            <kbd className="px-1.5 py-0.5 bg-dash-surface border border-brand-stone/30 rounded text-[10px]">
              Cmd
            </kbd>{" "}
            +{" "}
            <kbd className="px-1.5 py-0.5 bg-dash-surface border border-brand-stone/30 rounded text-[10px]">
              P
            </kbd>
            , then "Save as PDF" in the destination dropdown.
          </span>
          <span className="font-mono text-[10px]">{data.docNumber}</span>
        </div>
      </div>

      {auto === "1" && <AutoPrint />}
    </>
  );
};

export default QuotePrintPage;
