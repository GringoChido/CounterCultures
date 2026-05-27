"use client";

import { useState, useEffect, use } from "react";
import { Loader2 } from "lucide-react";
import { QuoteTemplate } from "@/app/(dashboard)/components/templates/quote-template";
import { buildQuoteDataFromOrder } from "@/app/lib/quote-from-order";

interface OrderRow {
  id: string;
  name: string;
  partnerName: string;
  currency: string;
  dateOrder: string;
  validityDate: string;
  amountUntaxed: number;
  amountTax: number;
  amountTotal: number;
  rawState: string;
}

interface OrderLine {
  name: string;
  product_id: string;
  product_id_id: string;
  product_uom_qty: string;
  price_unit: string;
  discount: string;
  price_subtotal: string;
}

interface RawOrder {
  [key: string]: string;
  note: string;
}

interface Data {
  order: OrderRow;
  rawOrder: RawOrder;
  lines: OrderLine[];
  partnerEmail: string;
}

const OrderPreviewPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params);
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/dashboard/orders/${id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-dash-accent" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen text-sm text-dash-text-secondary">
        Order not found.
      </div>
    );
  }

  const { order, rawOrder, lines } = data;
  const quoteData = buildQuoteDataFromOrder(order, rawOrder, lines);

  return (
    <>
      <style
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
              @page { size: letter; margin: 0.5in; }
            }
          `,
        }}
      />
      <div className="bg-brand-stone/5 min-h-screen py-10 print:py-0 print:bg-dash-surface">
        <QuoteTemplate data={quoteData} />
        <div className="no-print max-w-[800px] mx-auto mt-6 flex items-center justify-between text-xs text-dash-text-secondary">
          <span>
            This is how the customer sees the quote. Press{" "}
            <kbd className="px-1.5 py-0.5 bg-dash-surface border border-brand-stone/30 rounded text-[10px]">
              Cmd
            </kbd>{" "}
            +{" "}
            <kbd className="px-1.5 py-0.5 bg-dash-surface border border-brand-stone/30 rounded text-[10px]">
              P
            </kbd>
            {" "}to save as PDF.
          </span>
          <span className="font-mono text-[10px]">{order.name}</span>
        </div>
      </div>
    </>
  );
};

export default OrderPreviewPage;
