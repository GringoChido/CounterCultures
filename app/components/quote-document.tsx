import type { QuoteData } from "@/app/lib/quote-data";
import { fmtMxn, fmtDate } from "@/app/lib/quote-data";

interface QuoteDocumentProps {
  data: QuoteData;
  /** Optional Stripe payment-link URL to show a "Pay deposit" button. */
  depositPayUrl?: string | null;
  /** When true, adds a "Powered by" and hides internal-only chrome. */
  customerFacing?: boolean;
}

/**
 * Renders the branded quote. Used by both the authenticated print page and
 * the public share page. Print CSS is handled by the parent route.
 */
const QuoteDocument = ({
  data,
  depositPayUrl,
  customerFacing,
}: QuoteDocumentProps) => {
  const { deal, items, subtotal, shipping, grandTotal, depositAmount, docNumber, issueDate, validUntil } = data;

  return (
    <div className="quote-doc max-w-[800px] mx-auto bg-dash-surface p-10 print:p-0 shadow-sm text-brand-charcoal font-['DM_Sans',sans-serif] text-sm leading-relaxed">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-brand-copper">
        <div>
          <h1 className="font-['Cormorant',serif] text-3xl font-light tracking-wide text-brand-charcoal">
            Counter Cultures
          </h1>
          <p className="text-[10px] font-['JetBrains_Mono',monospace] tracking-[0.2em] text-brand-copper uppercase mt-1">
            Premium Kitchen, Bath &amp; Architectural Hardware
          </p>
          <p className="text-[11px] text-dash-text-secondary mt-3">
            Providencia, San Miguel de Allende, Guanajuato, MX
            <br />
            equipo@countercultures.com.mx &middot; +52-415-154-8375
          </p>
        </div>
        <div className="text-right">
          <h2 className="font-['Cormorant',serif] text-2xl font-light text-brand-charcoal uppercase tracking-wider">
            Quote
          </h2>
          <p className="text-xs text-dash-text-secondary mt-1 font-['JetBrains_Mono',monospace]">
            {docNumber}
          </p>
        </div>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <p className="text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-wider text-brand-copper mb-1">
            Prepared For
          </p>
          <p className="font-medium text-base">{deal.company || deal.name}</p>
          {deal.name && deal.name !== deal.company && (
            <p className="text-dash-text-secondary">{deal.name}</p>
          )}
        </div>
        <div className="text-right text-xs">
          <div className="mb-1.5">
            <span className="text-dash-text-secondary">Date: </span>
            <span>{fmtDate(issueDate)}</span>
          </div>
          <div className="mb-1.5">
            <span className="text-dash-text-secondary">Valid until: </span>
            <span>{fmtDate(validUntil)}</span>
          </div>
          {deal.owner && (
            <div>
              <span className="text-dash-text-secondary">Sales rep: </span>
              <span>{deal.owner}</span>
            </div>
          )}
        </div>
      </div>

      {/* Line items */}
      {items.length === 0 ? (
        <div className="text-center py-12 text-dash-text-muted border border-dashed border-dash-border rounded">
          No line items on this quote.
        </div>
      ) : (
        <table className="w-full mb-6">
          <thead>
            <tr className="border-b border-dash-border">
              <th className="text-left py-2 text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-wider text-brand-copper">
                Product
              </th>
              <th className="text-left py-2 text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-wider text-brand-copper">
                SKU
              </th>
              <th className="text-center py-2 text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-wider text-brand-copper">
                Qty
              </th>
              <th className="text-right py-2 text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-wider text-brand-copper">
                Unit
              </th>
              <th className="text-right py-2 text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-wider text-brand-copper">
                Line total
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-b border-brand-linen align-top">
                <td className="py-3 pr-3">
                  <div className="font-medium">{it.name || it.sku}</div>
                  <div className="text-[11px] text-dash-text-secondary mt-0.5">
                    {it.brand}
                    {it.finish ? ` · ${it.finish}` : ""}
                    {it.leadTime ? ` · Lead time: ${it.leadTime}` : ""}
                  </div>
                </td>
                <td className="py-3 text-dash-text-secondary font-['JetBrains_Mono',monospace] text-[11px] whitespace-nowrap">
                  {it.sku || "—"}
                </td>
                <td className="py-3 text-center">{it.quantity}</td>
                <td className="py-3 text-right">{fmtMxn(it.quotedPrice)}</td>
                <td className="py-3 text-right">{fmtMxn(it.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Totals */}
      {items.length > 0 && (
        <div className="flex justify-end mb-8">
          <div className="w-72">
            <div className="flex justify-between py-1.5 text-xs">
              <span className="text-dash-text-secondary">Subtotal</span>
              <span>{fmtMxn(subtotal)}</span>
            </div>
            {shipping > 0 && (
              <div className="flex justify-between py-1.5 text-xs">
                <span className="text-dash-text-secondary">Shipping &amp; handling</span>
                <span>{fmtMxn(shipping)}</span>
              </div>
            )}
            <div className="flex justify-between py-2 border-t-2 border-brand-copper font-semibold text-lg mt-1">
              <span>Total MXN</span>
              <span>{fmtMxn(grandTotal)}</span>
            </div>
            <div className="flex justify-between py-1.5 text-xs text-dash-text-secondary mt-1">
              <span>Deposit (70%)</span>
              <span>{fmtMxn(depositAmount)}</span>
            </div>
            <p className="mt-1 text-[10px] text-dash-text-muted text-right">
              Prices in Mexican Pesos. IVA included.
            </p>
          </div>
        </div>
      )}

      {/* Pay Deposit CTA — only on customer-facing view */}
      {customerFacing && depositPayUrl && grandTotal > 0 && (
        <div className="no-print mb-8 p-5 bg-brand-copper/5 border border-brand-copper/20 rounded">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="font-['Cormorant',serif] text-lg text-brand-charcoal">
                Ready to proceed? Pay the deposit to confirm.
              </p>
              <p className="text-xs text-dash-text-secondary mt-1">
                Secure payment via Stripe. Balance is requested when the
                order is built and ready to ship — paid before delivery.
              </p>
            </div>
            <a
              href={depositPayUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 bg-brand-copper text-white rounded-lg font-semibold text-sm hover:bg-brand-copper-dark transition-colors whitespace-nowrap"
            >
              Pay {fmtMxn(depositAmount)} deposit →
            </a>
          </div>
        </div>
      )}

      {/* Terms */}
      <div className="grid grid-cols-2 gap-8 mb-6 text-xs">
        <div>
          <p className="text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-wider text-brand-copper mb-1">
            Payment terms
          </p>
          <p className="text-dash-text-secondary">
            Deposit of 70% (or more, depending on brand and order) on
            confirmation. Balance requested when the order is ready to
            ship; paid before delivery. Pesos via wire transfer, USD via
            Stripe link.
          </p>
        </div>
        <div>
          <p className="text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-wider text-brand-copper mb-1">
            Lead time
          </p>
          <p className="text-dash-text-secondary">
            Typically 4–12 weeks from deposit for imported brands. Mexican
            artisan items ship in 2–4 weeks. Specific lead times listed with
            each item above where available.
          </p>
        </div>
      </div>

      <div className="mb-8 text-xs text-dash-text-secondary">
        <p className="text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-wider text-brand-copper mb-1">
          Validity
        </p>
        <p>
          This quote is valid for 15 days from the date above. Prices are
          subject to change with currency and supplier fluctuations after that
          date. Delivery scheduled from our San Miguel de Allende warehouse
          upon final payment.
        </p>
      </div>

      {deal.notes && (
        <div className="mb-8 text-xs">
          <p className="text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-wider text-brand-copper mb-1">
            Notes
          </p>
          <p className="text-dash-text-secondary whitespace-pre-wrap">{deal.notes}</p>
        </div>
      )}

      {/* Signature (print only; hidden on customer-facing web view since
          they approve via the Pay Deposit button) */}
      {!customerFacing && (
        <div className="grid grid-cols-2 gap-10 mt-16 mb-10">
          <div>
            <div className="border-t border-brand-charcoal pt-1 text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-wider text-dash-text-secondary">
              Client Authorization
            </div>
          </div>
          <div>
            <div className="border-t border-brand-charcoal pt-1 text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-wider text-dash-text-secondary">
              Counter Cultures
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-dash-border pt-4 text-center text-[10px] text-dash-text-muted">
        <p>
          Counter Cultures &middot; Providencia, San Miguel de Allende,
          Guanajuato, MX &middot; equipo@countercultures.com.mx
        </p>
        <p className="mt-1">
          Authorized dealer for Kohler, TOTO, Brizo, BLANCO, California
          Faucets, Sun Valley Bronze, Emtek, Badeloft and more.
        </p>
      </div>
    </div>
  );
};

export { QuoteDocument };
