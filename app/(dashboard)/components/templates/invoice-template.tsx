"use client";

import type { LineItem } from "./quote-template";

export interface InvoiceData {
  docNumber: string;
  date: string;
  dueDate: string;
  customerName: string;
  customerCompany: string;
  customerEmail: string;
  items: LineItem[];
  taxRate: number;
  stripeLink: string;
  notes: string;
  locale: "en" | "es";
}

const t = {
  title: { en: "Invoice", es: "Factura" },
  number: { en: "Invoice #", es: "Factura #" },
  date: { en: "Date", es: "Fecha" },
  dueDate: { en: "Due Date", es: "Fecha de Vencimiento" },
  billTo: { en: "Bill To", es: "Facturar A" },
  product: { en: "Description", es: "Descripcion" },
  sku: { en: "SKU", es: "SKU" },
  qty: { en: "Qty", es: "Cant" },
  unitPrice: { en: "Unit Price", es: "Precio Unit." },
  subtotalLabel: { en: "Subtotal", es: "Subtotal" },
  tax: { en: "IVA (16%)", es: "IVA (16%)" },
  total: { en: "Total Due", es: "Total a Pagar" },
  payOnline: { en: "Pay Online", es: "Pagar en Linea" },
  notes: { en: "Notes", es: "Notas" },
  footer: {
    en: "Counter Cultures | Providencia, San Miguel de Allende, Guanajuato, Mexico | info@countercultures.com.mx",
    es: "Counter Cultures | Providencia, San Miguel de Allende, Guanajuato, Mexico | info@countercultures.com.mx",
  },
};

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

export const InvoiceTemplate = ({ data }: { data: InvoiceData }) => {
  const l = data.locale;
  const subtotal = data.items.reduce(
    (sum, i) => sum + i.quantity * i.unitPrice,
    0
  );
  const tax = subtotal * (data.taxRate / 100);
  const total = subtotal + tax;

  return (
    <div className="bg-white text-[#2C2C2C] p-8 max-w-[800px] mx-auto font-['DM_Sans',sans-serif] text-sm leading-relaxed">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-[#B87333]">
        <div>
          <h1 className="font-['Cormorant',serif] text-3xl font-light tracking-wide text-[#1a1a1a]">
            Counter Cultures
          </h1>
          <p className="text-[10px] font-['JetBrains_Mono',monospace] tracking-[0.2em] text-[#B87333] uppercase mt-1">
            Premium Kitchen, Bath & Hardware
          </p>
        </div>
        <div className="text-right">
          <h2 className="font-['Cormorant',serif] text-2xl font-light text-[#1a1a1a] uppercase tracking-wider">
            {t.title[l]}
          </h2>
          <p className="text-xs text-[#6B6B6B] mt-1">
            {t.number[l]}
            {data.docNumber}
          </p>
        </div>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <p className="text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-wider text-[#B87333] mb-1">
            {t.billTo[l]}
          </p>
          <p className="font-medium">{data.customerName}</p>
          {data.customerCompany && (
            <p className="text-[#6B6B6B]">{data.customerCompany}</p>
          )}
          {data.customerEmail && (
            <p className="text-[#6B6B6B]">{data.customerEmail}</p>
          )}
        </div>
        <div className="text-right">
          <div className="mb-2">
            <span className="text-[#6B6B6B]">{t.date[l]}: </span>
            <span>{data.date}</span>
          </div>
          <div>
            <span className="text-[#6B6B6B]">{t.dueDate[l]}: </span>
            <span className="font-medium">{data.dueDate}</span>
          </div>
        </div>
      </div>

      {/* Line items */}
      <table className="w-full mb-6">
        <thead>
          <tr className="border-b border-[#E5E0DB]">
            <th className="text-left py-2 text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-wider text-[#B87333]">
              {t.product[l]}
            </th>
            <th className="text-left py-2 text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-wider text-[#B87333]">
              {t.sku[l]}
            </th>
            <th className="text-center py-2 text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-wider text-[#B87333]">
              {t.qty[l]}
            </th>
            <th className="text-right py-2 text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-wider text-[#B87333]">
              {t.unitPrice[l]}
            </th>
            <th className="text-right py-2 text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-wider text-[#B87333]">
              {t.subtotalLabel[l]}
            </th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, i) => (
            <tr key={i} className="border-b border-[#F5F0EB]">
              <td className="py-3">{item.product}</td>
              <td className="py-3 text-[#6B6B6B] font-['JetBrains_Mono',monospace] text-xs">
                {item.sku}
              </td>
              <td className="py-3 text-center">{item.quantity}</td>
              <td className="py-3 text-right">{fmt(item.unitPrice)}</td>
              <td className="py-3 text-right">
                {fmt(item.quantity * item.unitPrice)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-64">
          <div className="flex justify-between py-1.5">
            <span className="text-[#6B6B6B]">{t.subtotalLabel[l]}</span>
            <span>{fmt(subtotal)}</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-[#6B6B6B]">{t.tax[l]}</span>
            <span>{fmt(tax)}</span>
          </div>
          <div className="flex justify-between py-2 border-t-2 border-[#B87333] font-semibold text-lg mt-1">
            <span>{t.total[l]}</span>
            <span>{fmt(total)}</span>
          </div>
        </div>
      </div>

      {/* Stripe payment link */}
      {data.stripeLink && (
        <div className="mb-8 text-center">
          <a
            href={data.stripeLink}
            className="inline-block bg-[#B87333] text-white px-8 py-3 rounded text-sm font-medium tracking-wide hover:bg-[#a06328] transition-colors"
          >
            {t.payOnline[l]} &rarr;
          </a>
        </div>
      )}

      {data.notes && (
        <div className="mb-8 text-xs">
          <p className="text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-wider text-[#B87333] mb-1">
            {t.notes[l]}
          </p>
          <p className="text-[#6B6B6B]">{data.notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-[#E5E0DB] pt-4 text-center text-[10px] text-[#999]">
        <p>{t.footer[l]}</p>
      </div>
    </div>
  );
};
