import type { QuoteData } from "@/app/lib/quote-data";
import { fmtMxn, fmtDate } from "@/app/lib/quote-data";
import { QuoteTermsBlock } from "@/app/components/quote-terms-block";

interface QuoteDocumentProps {
  data: QuoteData;
  depositPayUrl?: string | null;
  customerFacing?: boolean;
}

const QuoteDocument = ({
  data,
  depositPayUrl,
  customerFacing,
}: QuoteDocumentProps) => {
  const { deal, items, subtotal, shipping, grandTotal, depositAmount, docNumber, issueDate, validUntil } = data;

  const hasTaxBreakdown = (data.amountTax ?? 0) > 0;
  const displayUntaxed = data.amountUntaxed ?? subtotal + shipping;
  const displayTax = data.amountTax ?? 0;
  const displayTotal = hasTaxBreakdown ? (data.amountTotal ?? grandTotal) : grandTotal;

  return (
    <div className="quote-doc max-w-[800px] mx-auto bg-dash-surface p-10 print:p-0 shadow-sm text-brand-charcoal font-['DM_Sans',sans-serif] text-sm leading-relaxed">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-brand-copper">
        <div>
          <h1 className="font-['Cormorant',serif] text-3xl font-light tracking-wide text-brand-charcoal">
            Counter Cultures
          </h1>
          <p className="text-[10px] font-['JetBrains_Mono',monospace] tracking-[0.2em] text-brand-copper uppercase mt-1">
            Premium Kitchen, Bath &amp; Hardware
          </p>
          <p className="text-[11px] text-dash-text-secondary mt-3 leading-relaxed">
            Calle San Juan #11-A, Col. Providencia 37737
            <br />
            San Miguel de Allende, Guanajuato, México
            <br />
            Tel. 415.154.8375 · equipo@countercultures.com.mx
            <br />
            countercultures.com.mx
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
              <span>{fmtMxn(hasTaxBreakdown ? displayUntaxed : subtotal)}</span>
            </div>
            {shipping > 0 && !hasTaxBreakdown && (
              <div className="flex justify-between py-1.5 text-xs">
                <span className="text-dash-text-secondary">Shipping &amp; handling</span>
                <span>{fmtMxn(shipping)}</span>
              </div>
            )}
            {hasTaxBreakdown && (
              <div className="flex justify-between py-1.5 text-xs">
                <span className="text-dash-text-secondary">IVA 16%</span>
                <span>{fmtMxn(displayTax)}</span>
              </div>
            )}
            <div className="flex justify-between py-2 border-t-2 border-brand-copper font-semibold text-lg mt-1">
              <span>Total MXN</span>
              <span>{fmtMxn(displayTotal)}</span>
            </div>
            <div className="flex justify-between py-1.5 text-xs text-dash-text-secondary mt-1">
              <span>Deposit (70%)</span>
              <span>{fmtMxn(depositAmount)}</span>
            </div>
            {!hasTaxBreakdown && (
              <p className="mt-1 text-[10px] text-dash-text-muted text-right">
                Prices in Mexican Pesos. IVA included.
              </p>
            )}
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

      {/* Canonical bilingual terms + bank deposit */}
      <QuoteTermsBlock />

      {deal.notes && (
        <div className="mb-8 text-xs">
          <p className="text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-wider text-brand-copper mb-1">
            Notes
          </p>
          <p className="text-dash-text-secondary whitespace-pre-wrap">{deal.notes}</p>
        </div>
      )}

      {/* Signature (print only) */}
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
          Counter Cultures &middot; Calle San Juan #11-A, Col. Providencia 37737
          &middot; San Miguel de Allende, Guanajuato, MX &middot; equipo@countercultures.com.mx
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
