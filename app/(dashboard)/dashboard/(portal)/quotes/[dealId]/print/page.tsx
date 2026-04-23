import { notFound } from "next/navigation";
import { readSheet } from "@/app/lib/dashboard-sheets";
import { AutoPrint } from "./auto-print";

export const dynamic = "force-dynamic";

// ── Types matching the sheet rows ──────────────────────────────────────
interface PipelineRow {
  [key: string]: string;
  id: string;
  name: string;
  company: string;
  stage: string;
  value: string;
  expected_close: string;
  owner: string;
  source: string;
  notes: string;
  created_at: string;
}

interface LineItemRow {
  [key: string]: string;
  id: string;
  deal_id: string;
  sku: string;
  product_name: string;
  brand: string;
  finish: string;
  quantity: string;
  dealer_cost: string;
  quoted_price: string;
  msrp: string;
  shipping_cost: string;
  lead_time: string;
  status: string;
}

const num = (s: string) => {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};

const fmtMxn = (n: number) =>
  n.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });

const fmtDate = (iso: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

const addDays = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

// Deterministic quote number from deal id + date, e.g. CC-Q-2026-0742
const quoteNumber = (dealId: string) => {
  const today = new Date();
  const yr = today.getFullYear();
  // Last 4 alphanum chars of the deal id as a stable short suffix
  const suffix = dealId.replace(/[^A-Z0-9]/gi, "").slice(-4).toUpperCase().padStart(4, "0");
  return `CC-Q-${yr}-${suffix}`;
};

interface PrintPageProps {
  params: Promise<{ dealId: string }>;
  searchParams: Promise<{ auto?: string }>;
}

const QuotePrintPage = async ({ params, searchParams }: PrintPageProps) => {
  const { dealId } = await params;
  const { auto } = await searchParams;

  const [deals, lineItems] = await Promise.all([
    readSheet<PipelineRow>("Pipeline"),
    readSheet<LineItemRow>("Deal_Line_Items"),
  ]);
  const deal = deals.find((d) => d.id === dealId);
  if (!deal) notFound();

  const items = lineItems
    .filter((l) => l.deal_id === dealId)
    .map((l) => ({
      id: l.id,
      sku: l.sku,
      name: l.product_name,
      brand: l.brand,
      finish: l.finish,
      quantity: num(l.quantity) || 1,
      quotedPrice: num(l.quoted_price),
      shipping: num(l.shipping_cost),
      leadTime: l.lead_time,
      lineTotal: num(l.quoted_price) * (num(l.quantity) || 1),
    }));

  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  const shipping = items.reduce((s, i) => s + i.shipping, 0);
  const grandTotal = subtotal + shipping;
  const now = new Date().toISOString().slice(0, 10);
  const docNumber = quoteNumber(dealId);

  return (
    <>
      {/* @media print CSS hides dashboard chrome so Cmd+P outputs a clean quote.
          Also resets the surrounding <main> padding that the dashboard layout
          applies, so the quote occupies the full printable page. */}
      <style
        // eslint-disable-next-line react/no-unknown-property
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              html, body { background: #fff !important; }
              body > div > div > div:first-child,                    /* sidebar wrapper */
              aside,                                                  /* <Sidebar /> root */
              header,                                                 /* <DashboardHeader /> */
              .no-print,
              [class*="ActionFab"],
              [class*="AIChatWidget"],
              nextjs-portal { display: none !important; }
              main { padding: 0 !important; margin-left: 0 !important; }
              .flex.min-h-screen > div { margin-left: 0 !important; }
              .quote-doc { box-shadow: none !important; margin: 0 !important; }
              @page { size: letter; margin: 0.5in; }
            }
          `,
        }}
      />

      <div className="bg-brand-stone/5 min-h-screen py-10 print:py-0 print:bg-white">
        <div className="quote-doc max-w-[800px] mx-auto bg-white p-10 print:p-0 shadow-sm text-[#2C2C2C] font-['DM_Sans',sans-serif] text-sm leading-relaxed">
          {/* Header */}
          <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-[#B87333]">
            <div>
              <h1 className="font-['Cormorant',serif] text-3xl font-light tracking-wide text-[#1a1a1a]">
                Counter Cultures
              </h1>
              <p className="text-[10px] font-['JetBrains_Mono',monospace] tracking-[0.2em] text-[#B87333] uppercase mt-1">
                Premium Kitchen, Bath &amp; Architectural Hardware
              </p>
              <p className="text-[11px] text-[#6B6B6B] mt-3">
                Providencia, San Miguel de Allende, Guanajuato, MX
                <br />
                info@countercultures.com.mx &middot; +52-415-154-8375
              </p>
            </div>
            <div className="text-right">
              <h2 className="font-['Cormorant',serif] text-2xl font-light text-[#1a1a1a] uppercase tracking-wider">
                Quote
              </h2>
              <p className="text-xs text-[#6B6B6B] mt-1 font-['JetBrains_Mono',monospace]">
                {docNumber}
              </p>
            </div>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <p className="text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-wider text-[#B87333] mb-1">
                Prepared For
              </p>
              <p className="font-medium text-base">{deal.company || deal.name}</p>
              {deal.name && deal.name !== deal.company && (
                <p className="text-[#6B6B6B]">{deal.name}</p>
              )}
            </div>
            <div className="text-right text-xs">
              <div className="mb-1.5">
                <span className="text-[#6B6B6B]">Date: </span>
                <span>{fmtDate(now)}</span>
              </div>
              <div className="mb-1.5">
                <span className="text-[#6B6B6B]">Valid until: </span>
                <span>{fmtDate(addDays(15))}</span>
              </div>
              {deal.owner && (
                <div>
                  <span className="text-[#6B6B6B]">Sales rep: </span>
                  <span>{deal.owner}</span>
                </div>
              )}
            </div>
          </div>

          {/* Line items */}
          {items.length === 0 ? (
            <div className="text-center py-12 text-[#999] border border-dashed border-[#E5E0DB] rounded">
              No line items on this quote. Add products on the Pipeline page.
            </div>
          ) : (
            <table className="w-full mb-6">
              <thead>
                <tr className="border-b border-[#E5E0DB]">
                  <th className="text-left py-2 text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-wider text-[#B87333]">
                    Product
                  </th>
                  <th className="text-left py-2 text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-wider text-[#B87333]">
                    SKU
                  </th>
                  <th className="text-center py-2 text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-wider text-[#B87333]">
                    Qty
                  </th>
                  <th className="text-right py-2 text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-wider text-[#B87333]">
                    Unit
                  </th>
                  <th className="text-right py-2 text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-wider text-[#B87333]">
                    Line total
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} className="border-b border-[#F5F0EB] align-top">
                    <td className="py-3 pr-3">
                      <div className="font-medium">{it.name || it.sku}</div>
                      <div className="text-[11px] text-[#6B6B6B] mt-0.5">
                        {it.brand}
                        {it.finish ? ` · ${it.finish}` : ""}
                        {it.leadTime ? ` · Lead time: ${it.leadTime}` : ""}
                      </div>
                    </td>
                    <td className="py-3 text-[#6B6B6B] font-['JetBrains_Mono',monospace] text-[11px] whitespace-nowrap">
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
                  <span className="text-[#6B6B6B]">Subtotal</span>
                  <span>{fmtMxn(subtotal)}</span>
                </div>
                {shipping > 0 && (
                  <div className="flex justify-between py-1.5 text-xs">
                    <span className="text-[#6B6B6B]">Shipping &amp; handling</span>
                    <span>{fmtMxn(shipping)}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-t-2 border-[#B87333] font-semibold text-lg mt-1">
                  <span>Total MXN</span>
                  <span>{fmtMxn(grandTotal)}</span>
                </div>
                <p className="mt-1 text-[10px] text-[#999] text-right">
                  Prices in Mexican Pesos. IVA not included.
                </p>
              </div>
            </div>
          )}

          {/* Terms */}
          <div className="grid grid-cols-2 gap-8 mb-6 text-xs">
            <div>
              <p className="text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-wider text-[#B87333] mb-1">
                Payment terms
              </p>
              <p className="text-[#6B6B6B]">
                50% deposit on order confirmation; balance due upon arrival and
                before delivery. Pesos via wire transfer, USD via Stripe link.
              </p>
            </div>
            <div>
              <p className="text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-wider text-[#B87333] mb-1">
                Lead time
              </p>
              <p className="text-[#6B6B6B]">
                Typically 4–12 weeks from deposit for imported brands. Mexican
                artisan items ship in 2–4 weeks. Specific lead times listed
                with each item above where available.
              </p>
            </div>
          </div>

          <div className="mb-8 text-xs text-[#6B6B6B]">
            <p className="text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-wider text-[#B87333] mb-1">
              Validity
            </p>
            <p>
              This quote is valid for 15 days from the date above. Prices are
              subject to change with currency and supplier fluctuations after
              that date. Delivery scheduled from our San Miguel de Allende
              warehouse upon final payment.
            </p>
          </div>

          {deal.notes && (
            <div className="mb-8 text-xs">
              <p className="text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-wider text-[#B87333] mb-1">
                Notes
              </p>
              <p className="text-[#6B6B6B] whitespace-pre-wrap">{deal.notes}</p>
            </div>
          )}

          {/* Signature */}
          <div className="grid grid-cols-2 gap-10 mt-16 mb-10">
            <div>
              <div className="border-t border-[#2C2C2C] pt-1 text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-wider text-[#6B6B6B]">
                Client Authorization
              </div>
            </div>
            <div>
              <div className="border-t border-[#2C2C2C] pt-1 text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-wider text-[#6B6B6B]">
                Counter Cultures
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-[#E5E0DB] pt-4 text-center text-[10px] text-[#999]">
            <p>
              Counter Cultures &middot; Providencia, San Miguel de Allende, Guanajuato, MX
              &middot; info@countercultures.com.mx
            </p>
            <p className="mt-1">
              Authorized dealer for Kohler, TOTO, Brizo, BLANCO, California Faucets,
              Sun Valley Bronze, Emtek, Badeloft and more.
            </p>
          </div>
        </div>

        {/* Screen-only "how to save" helper bar */}
        <div className="no-print max-w-[800px] mx-auto mt-6 flex items-center justify-between text-xs text-brand-stone">
          <span>
            Press{" "}
            <kbd className="px-1.5 py-0.5 bg-white border border-brand-stone/30 rounded text-[10px]">
              Cmd
            </kbd>{" "}
            +{" "}
            <kbd className="px-1.5 py-0.5 bg-white border border-brand-stone/30 rounded text-[10px]">
              P
            </kbd>
            , then "Save as PDF" in the destination dropdown.
          </span>
          <span className="font-mono text-[10px]">{docNumber}</span>
        </div>
      </div>

      {/* Auto-trigger the print dialog on first load when ?auto=1 */}
      {auto === "1" && <AutoPrint />}
    </>
  );
};

export default QuotePrintPage;
