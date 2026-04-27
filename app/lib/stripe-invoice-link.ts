/**
 * Stripe payment links for Odoo invoices.
 *
 * Generates a Stripe Payment Link with `metadata.odoo_invoice_id` so the
 * webhook bridge can register the payment in Odoo automatically when the
 * customer pays. Mirrors the pattern in `stripe-deposit.ts` but operates on
 * Odoo invoices (not portal deals) and supports both MXN and USD.
 *
 * Caching: 7-day in-memory cache keyed by `<odooInvoiceId>:<amountCents>:<currency>`.
 * If the residual changes (partial payment came in), a new link is minted.
 * Cold starts repopulate the cache by re-creating the link, which is fine —
 * Stripe doesn't charge for unused links and the customer always sees the
 * latest URL.
 */

import { getStripe, isConfigured } from "./stripe";

interface InvoiceLinkRequest {
  odooInvoiceId: number;
  invoiceName: string;
  partnerName: string;
  /** Outstanding balance, in the invoice's currency (decimal units). */
  amount: number;
  /** ISO 4217 — "MXN" | "USD". Lowercased before sending to Stripe. */
  currency: string;
  /** Email to prefill on the Stripe checkout (optional). */
  customerEmail?: string;
}

interface CacheEntry {
  url: string;
  paymentLinkId: string;
  priceId: string;
  cacheKey: string;
  createdAt: number;
}

const TTL_MS = 7 * 24 * 60 * 60 * 1000;
const cache = new Map<number, CacheEntry>();

const SUPPORTED_CURRENCIES = new Set(["MXN", "USD"]);
const STRIPE_MIN_CENTS: Record<string, number> = {
  MXN: 1000, // 10 MXN
  USD: 50, // 0.50 USD
};

const buildCacheKey = (req: InvoiceLinkRequest, amountCents: number) =>
  `${req.odooInvoiceId}:${amountCents}:${req.currency.toUpperCase()}`;

export interface InvoiceLinkResult {
  url: string;
  paymentLinkId: string;
  amount: number;
  currency: string;
  cached: boolean;
}

/**
 * Returns a Stripe payment link for the invoice. Returns null when Stripe
 * isn't configured, the currency is unsupported, or the amount is below
 * Stripe's per-currency minimum. Throws on Stripe API errors so the caller
 * can surface a useful message.
 */
export const getOrCreateInvoiceLink = async (
  req: InvoiceLinkRequest
): Promise<InvoiceLinkResult | null> => {
  if (!isConfigured()) return null;
  const currency = req.currency.toUpperCase();
  if (!SUPPORTED_CURRENCIES.has(currency)) return null;

  const amountCents = Math.round(req.amount * 100);
  const min = STRIPE_MIN_CENTS[currency] ?? 50;
  if (amountCents < min) return null;

  const cacheKey = buildCacheKey(req, amountCents);
  const hit = cache.get(req.odooInvoiceId);
  if (hit && hit.cacheKey === cacheKey && Date.now() - hit.createdAt < TTL_MS) {
    return {
      url: hit.url,
      paymentLinkId: hit.paymentLinkId,
      amount: req.amount,
      currency,
      cached: true,
    };
  }

  const stripe = getStripe();

  // 1) Create a one-off price for the residual. Stripe requires a price to
  //    back the payment link's line item; using `product_data` keeps us from
  //    polluting the products list.
  const description = `${req.invoiceName} · ${req.partnerName}`;
  const price = await stripe.prices.create({
    currency: currency.toLowerCase(),
    unit_amount: amountCents,
    product_data: { name: description.slice(0, 250) || req.invoiceName },
  });

  // 2) Create the link with the metadata the webhook bridge looks for.
  const link = await stripe.paymentLinks.create({
    line_items: [{ price: price.id, quantity: 1 }],
    metadata: {
      odoo_invoice_id: String(req.odooInvoiceId),
      odoo_invoice_name: req.invoiceName,
      kind: "odoo_invoice_collection",
    },
    payment_intent_data: {
      // Critical — propagates to the PaymentIntent so `payment_intent.succeeded`
      // sees `metadata.odoo_invoice_id` and triggers the Odoo bridge.
      metadata: {
        odoo_invoice_id: String(req.odooInvoiceId),
        odoo_invoice_name: req.invoiceName,
      },
    },
    after_completion: {
      type: "hosted_confirmation",
      hosted_confirmation: {
        custom_message: `Thank you. Receipt for ${req.invoiceName} is on its way.`,
      },
    },
  });

  const entry: CacheEntry = {
    url: link.url,
    paymentLinkId: link.id,
    priceId: price.id,
    cacheKey,
    createdAt: Date.now(),
  };
  cache.set(req.odooInvoiceId, entry);

  return {
    url: link.url,
    paymentLinkId: link.id,
    amount: req.amount,
    currency,
    cached: false,
  };
};

/** Test/admin escape hatch: clears the cache so the next call re-mints. */
export const invalidateInvoiceLink = (odooInvoiceId: number): void => {
  cache.delete(odooInvoiceId);
};
