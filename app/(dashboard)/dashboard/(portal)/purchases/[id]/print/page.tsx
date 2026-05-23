"use client";

import { useState, useEffect, use } from "react";
import { Loader2 } from "lucide-react";
import { POTemplate, type POData } from "@/app/(dashboard)/components/templates/po-template";
import { stripHtml } from "@/app/lib/strip-html";
import { formatDate } from "@/app/lib/format-date";

interface RawPO {
  [key: string]: string;
  notes: string;
  date_planned: string;
}

interface PORow {
  id: string;
  name: string;
  vendorName: string;
  currency: string;
  dateOrder: string;
  company: string;
}

interface POLine {
  name: string;
  product_id: string;
  product_id_id: string;
  product_qty: string;
  price_unit: string;
}

interface Data {
  order: PORow;
  rawOrder: RawPO;
  lines: POLine[];
}

const POPrintPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params);
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/dashboard/purchases/${id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        setData(d);
        if (d) setTimeout(() => window.print(), 400);
      })
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
        PO not found.
      </div>
    );
  }

  const poData: POData = {
    docNumber: data.order.name,
    date: formatDate(data.order.dateOrder),
    requestedDelivery: formatDate(data.rawOrder.date_planned),
    vendorName: data.order.vendorName,
    deliveryAddress: "Providencia, San Miguel de Allende, Guanajuato, Mexico",
    items: data.lines.map((l) => ({
      product: l.product_id || l.name,
      sku: "",
      quantity: parseFloat(l.product_qty) || 0,
      unitPrice: parseFloat(l.price_unit) || 0,
      image: l.product_id_id ? `/products/odoo/${l.product_id_id}.jpg` : undefined,
    })),
    notes: data.rawOrder.notes ? stripHtml(data.rawOrder.notes) : "",
    locale: "en",
  };

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
        <POTemplate data={poData} />
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
            , then &ldquo;Save as PDF&rdquo; in the destination dropdown.
          </span>
          <span className="font-mono text-[10px]">{data.order.name}</span>
        </div>
      </div>
    </>
  );
};

export default POPrintPage;
