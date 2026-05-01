export interface LineItem {
  product: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  brand?: string;
  image?: string;
  slug?: string;
  /** PR 7 — locale-keyed spec sheet PDFs surfaced under each line item.
   *  When the matching locale is missing we fall back to the other one. */
  specSheetUrlEn?: string;
  specSheetUrlEs?: string;
}

export type QuoteCurrency = "MXN" | "USD";
export type QuoteFulfillment = "ship" | "local" | "pickup";

export interface QuoteData {
  docNumber: string;
  date: string;
  validUntil: string;
  customerName: string;
  customerCompany: string;
  customerEmail: string;
  items: LineItem[];
  discount: number;
  discountType: "percent" | "fixed";
  paymentTerms: string;
  deliveryEstimate: string;
  notes: string;
  locale: "en" | "es";
  /** PR 7 — currency toggle on the quote builder. Defaults to MXN. */
  currency?: QuoteCurrency;
  /** PR 7 — fulfillment branch chosen at the top of the quote builder. */
  fulfillment?: QuoteFulfillment;
}

const t = {
  title: { en: "Quote", es: "Cotización" },
  number: { en: "Quote #", es: "Cotización #" },
  date: { en: "Date", es: "Fecha" },
  validUntil: { en: "Valid Until", es: "Válido Hasta" },
  billTo: { en: "Prepared For", es: "Preparado Para" },
  product: { en: "Product", es: "Producto" },
  sku: { en: "SKU", es: "SKU" },
  qty: { en: "Qty", es: "Cant" },
  unitPrice: { en: "Unit Price", es: "Precio Unit." },
  subtotalLabel: { en: "Subtotal", es: "Subtotal" },
  discountLabel: { en: "Discount", es: "Descuento" },
  total: { en: "Total", es: "Total" },
  paymentTerms: { en: "Payment Terms", es: "Términos de Pago" },
  delivery: { en: "Estimated Delivery", es: "Entrega Estimada" },
  notes: { en: "Notes", es: "Notas" },
  fulfillmentLabel: { en: "Fulfillment", es: "Entrega" },
  fulfillmentShip: { en: "Ship via Skydropx", es: "Envío vía Skydropx" },
  fulfillmentLocal: {
    en: "Local SMA delivery · Miguel",
    es: "Entrega local SMA · Miguel",
  },
  fulfillmentPickup: {
    en: "Pickup · Counter Cultures Warehouse",
    es: "Recoger · Bodega Counter Cultures",
  },
  specSheet: { en: "Spec sheet", es: "Hoja técnica" },
  termsHeader: { en: "Terms & Conditions", es: "Términos y Condiciones" },
  terms70: {
    en: "70% deposit confirms the order. Balance of 30% is due on delivery. 100% upfront is also accepted.",
    es: "Anticipo del 70% para confirmar el pedido. Saldo del 30% al momento de la entrega. También se acepta 100% por adelantado.",
  },
  termsRelease: {
    en: "No merchandise is released without payment in full, except partial deliveries valued at or below the deposit amount.",
    es: "No se libera mercancía sin pago completo, salvo entregas parciales por valor menor o igual al anticipo.",
  },
  footer: {
    en: "Counter Cultures | Providencia, San Miguel de Allende, Guanajuato, Mexico | info@countercultures.com.mx",
    es: "Counter Cultures | Providencia, San Miguel de Allende, Guanajuato, México | info@countercultures.com.mx",
  },
  authorized: {
    en: "Authorized dealer for Kohler, TOTO, Brizo, BLANCO, California Faucets, and 14 more brands.",
    es: "Distribuidor autorizado de Kohler, TOTO, Brizo, BLANCO, California Faucets y 14 marcas más.",
  },
};

// Currency formatter — Mexican Spanish style for MXN ("$1,234.00 MXN"),
// US English for USD. We pin the locale per currency rather than per
// document locale so a Spanish quote in USD still reads naturally.
const makeFmt = (currency: QuoteCurrency) => (n: number) =>
  n.toLocaleString(currency === "MXN" ? "es-MX" : "en-US", {
    style: "currency",
    currency,
    currencyDisplay: "symbol",
  });

const fulfillmentText = (
  f: QuoteFulfillment | undefined,
  l: "en" | "es",
): string | null => {
  if (!f) return null;
  if (f === "ship") return t.fulfillmentShip[l];
  if (f === "local") return t.fulfillmentLocal[l];
  return t.fulfillmentPickup[l];
};

export const QuoteTemplate = ({ data }: { data: QuoteData }) => {
  const l = data.locale;
  const currency: QuoteCurrency = data.currency ?? "MXN";
  const fmt = makeFmt(currency);
  const subtotal = data.items.reduce(
    (sum, i) => sum + i.quantity * i.unitPrice,
    0
  );
  const discountAmount =
    data.discountType === "percent"
      ? subtotal * (data.discount / 100)
      : data.discount;
  const total = subtotal - discountAmount;
  const depositAmount = total * 0.7;
  const fulfillmentLabel = fulfillmentText(data.fulfillment, l);

  return (
    <div className="bg-dash-surface text-brand-charcoal p-8 max-w-[800px] mx-auto font-['DM_Sans',sans-serif] text-sm leading-relaxed">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-brand-copper">
        <div>
          <h1 className="font-['Cormorant',serif] text-3xl font-light tracking-wide text-brand-charcoal">
            Counter Cultures
          </h1>
          <p className="text-[10px] font-['JetBrains_Mono',monospace] tracking-[0.2em] text-brand-copper uppercase mt-1">
            Premium Kitchen, Bath & Hardware
          </p>
        </div>
        <div className="text-right">
          <h2 className="font-['Cormorant',serif] text-2xl font-light text-brand-charcoal uppercase tracking-wider">
            {t.title[l]}
          </h2>
          <p className="text-xs text-dash-text-secondary mt-1">
            {t.number[l]}
            {data.docNumber}
          </p>
        </div>
      </div>

      {/* Meta row */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <p className="text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-wider text-brand-copper mb-1">
            {t.billTo[l]}
          </p>
          <p className="font-medium">{data.customerName}</p>
          {data.customerCompany && (
            <p className="text-dash-text-secondary">{data.customerCompany}</p>
          )}
          {data.customerEmail && (
            <p className="text-dash-text-secondary">{data.customerEmail}</p>
          )}
        </div>
        <div className="text-right">
          <div className="mb-2">
            <span className="text-dash-text-secondary">{t.date[l]}: </span>
            <span>{data.date}</span>
          </div>
          <div>
            <span className="text-dash-text-secondary">{t.validUntil[l]}: </span>
            <span>{data.validUntil}</span>
          </div>
        </div>
      </div>

      {/* Fulfillment row — set on the deal at quote time */}
      {fulfillmentLabel && (
        <div className="mb-6">
          <p className="text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-wider text-brand-copper mb-1">
            {t.fulfillmentLabel[l]}
          </p>
          <p className="font-medium">{fulfillmentLabel}</p>
        </div>
      )}

      {/* Line items table */}
      <table className="w-full mb-6">
        <thead>
          <tr className="border-b border-dash-border">
            <th className="text-left py-2 text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-wider text-brand-copper">
              {t.product[l]}
            </th>
            <th className="text-left py-2 text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-wider text-brand-copper">
              {t.sku[l]}
            </th>
            <th className="text-center py-2 text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-wider text-brand-copper">
              {t.qty[l]}
            </th>
            <th className="text-right py-2 text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-wider text-brand-copper">
              {t.unitPrice[l]}
            </th>
            <th className="text-right py-2 text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-wider text-brand-copper">
              {t.subtotalLabel[l]}
            </th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, i) => {
            // Locale-preferred spec sheet, fall back to the other if missing
            const specHref =
              (l === "es" ? item.specSheetUrlEs : item.specSheetUrlEn) ||
              item.specSheetUrlEn ||
              item.specSheetUrlEs;
            return (
              <tr key={i} className="border-b border-brand-linen align-top">
                <td className="py-3">
                  <div className="flex items-start gap-2.5">
                    {item.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image}
                        alt={item.product}
                        className="w-10 h-10 rounded object-cover shrink-0 border border-brand-linen"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div>{item.product}</div>
                      {specHref && (
                        <a
                          href={specHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-brand-copper hover:underline inline-block mt-0.5"
                        >
                          {t.specSheet[l]} ({l.toUpperCase()})
                        </a>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-3 text-dash-text-secondary font-['JetBrains_Mono',monospace] text-xs">
                  {item.sku}
                </td>
                <td className="py-3 text-center">{item.quantity}</td>
                <td className="py-3 text-right">{fmt(item.unitPrice)}</td>
                <td className="py-3 text-right">
                  {fmt(item.quantity * item.unitPrice)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-64">
          <div className="flex justify-between py-1.5">
            <span className="text-dash-text-secondary">{t.subtotalLabel[l]}</span>
            <span>{fmt(subtotal)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between py-1.5 text-brand-copper">
              <span>{t.discountLabel[l]}</span>
              <span>-{fmt(discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between py-2 border-t-2 border-brand-copper font-semibold text-lg mt-1">
            <span>{t.total[l]}</span>
            <span>{fmt(total)}</span>
          </div>
        </div>
      </div>

      {/* Terms / Notes */}
      <div className="grid grid-cols-2 gap-8 mb-8 text-xs">
        <div>
          <p className="text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-wider text-brand-copper mb-1">
            {t.paymentTerms[l]}
          </p>
          <p className="text-dash-text-secondary">{data.paymentTerms}</p>
        </div>
        <div>
          <p className="text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-wider text-brand-copper mb-1">
            {t.delivery[l]}
          </p>
          <p className="text-dash-text-secondary">{data.deliveryEstimate}</p>
        </div>
      </div>

      {/* Standard T&Cs — Roger's hard-coded fiscal+release rules */}
      <div className="mb-8 text-xs border border-brand-linen bg-brand-linen/30 rounded p-4">
        <p className="text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-wider text-brand-copper mb-2">
          {t.termsHeader[l]}
        </p>
        <p className="mb-1.5">
          <span className="font-semibold">{t.terms70[l]}</span>
          <span className="text-dash-text-secondary">
            {" "}
            ({l === "es" ? "Anticipo" : "Deposit"} {fmt(depositAmount)})
          </span>
        </p>
        <p className="text-dash-text-secondary">{t.termsRelease[l]}</p>
      </div>

      {data.notes && (
        <div className="mb-8 text-xs">
          <p className="text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-wider text-brand-copper mb-1">
            {t.notes[l]}
          </p>
          <p className="text-dash-text-secondary">{data.notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-dash-border pt-4 text-center text-[10px] text-dash-text-muted">
        <p>{t.footer[l]}</p>
        <p className="mt-1">{t.authorized[l]}</p>
      </div>
    </div>
  );
};
