"use client";

import type { LineItem } from "./quote-template";

export interface DeliveryReceiptData {
  docNumber: string;
  date: string;
  customerName: string;
  customerCompany: string;
  deliveryAddress: string;
  orderReference: string;
  items: LineItem[];
  notes: string;
  locale: "en" | "es";
}

const t = {
  title: { en: "Delivery Receipt", es: "Recibo de Entrega" },
  number: { en: "Receipt #", es: "Recibo #" },
  date: { en: "Delivery Date", es: "Fecha de Entrega" },
  deliveredTo: { en: "Delivered To", es: "Entregado A" },
  deliveryAddr: { en: "Delivery Address", es: "Direccion de Entrega" },
  orderRef: { en: "Order Reference", es: "Referencia de Pedido" },
  product: { en: "Product", es: "Producto" },
  sku: { en: "SKU", es: "SKU" },
  qty: { en: "Qty", es: "Cant" },
  notes: { en: "Notes", es: "Notas" },
  signature: { en: "Received By (Signature)", es: "Recibido Por (Firma)" },
  printName: { en: "Print Name", es: "Nombre" },
  dateSign: { en: "Date", es: "Fecha" },
  footer: {
    en: "Counter Cultures | Providencia, San Miguel de Allende, Guanajuato, Mexico | info@countercultures.com.mx",
    es: "Counter Cultures | Providencia, San Miguel de Allende, Guanajuato, Mexico | info@countercultures.com.mx",
  },
};

export const DeliveryReceiptTemplate = ({
  data,
}: {
  data: DeliveryReceiptData;
}) => {
  const l = data.locale;

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
            {t.deliveredTo[l]}
          </p>
          <p className="font-medium">{data.customerName}</p>
          {data.customerCompany && (
            <p className="text-[#6B6B6B]">{data.customerCompany}</p>
          )}
        </div>
        <div>
          <p className="text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-wider text-[#B87333] mb-1">
            {t.deliveryAddr[l]}
          </p>
          <p className="text-[#6B6B6B]">{data.deliveryAddress}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <span className="text-[#6B6B6B]">{t.date[l]}: </span>
          <span>{data.date}</span>
        </div>
        <div>
          <span className="text-[#6B6B6B]">{t.orderRef[l]}: </span>
          <span>{data.orderReference}</span>
        </div>
      </div>

      {/* Items */}
      <table className="w-full mb-8">
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
            </tr>
          ))}
        </tbody>
      </table>

      {data.notes && (
        <div className="mb-8 text-xs">
          <p className="text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-wider text-[#B87333] mb-1">
            {t.notes[l]}
          </p>
          <p className="text-[#6B6B6B]">{data.notes}</p>
        </div>
      )}

      {/* Signature block */}
      <div className="grid grid-cols-2 gap-8 mt-12 mb-8">
        <div>
          <div className="border-b border-[#2C2C2C] h-12" />
          <p className="text-xs text-[#6B6B6B] mt-1">{t.signature[l]}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="border-b border-[#2C2C2C] h-12" />
            <p className="text-xs text-[#6B6B6B] mt-1">{t.printName[l]}</p>
          </div>
          <div>
            <div className="border-b border-[#2C2C2C] h-12" />
            <p className="text-xs text-[#6B6B6B] mt-1">{t.dateSign[l]}</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[#E5E0DB] pt-4 text-center text-[10px] text-[#999]">
        <p>{t.footer[l]}</p>
      </div>
    </div>
  );
};
