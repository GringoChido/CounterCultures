/**
 * Stripe deposit payment links for quotes.
 *
 * Generates (or reuses a cached) payment link with metadata {dealId, kind}
 * so the webhook can advance the matching deal on checkout.session.completed.
 *
 * The cache is an in-memory Map keyed by dealId with a 7-day TTL. This keeps
 * link URLs stable across requests in a warm serverless instance. A cold start
 * re-creates the link — that's fine because Stripe payment links are free and
 * Roger's customer sees the latest URL.
 */
import { getStripe, isConfigured } from "./stripe";

interface DepositLinkRequest {
  dealId: string;
  amountMxn: number;
  description: string;
  customerEmail?: string;
}

interface CacheEntry {
  url: string;
  paymentLinkId: string;
  priceId: string;
  amountCents: number;
  createdAt: number;
}

const TTL_MS = 7 * 24 * 60 * 60 * 1000;
const cache = new Map<string, CacheEntry>();

const siteUrl = () =>
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://countercultures.mx";

/**
 * Returns the Stripe payment link URL for this deal's 50% deposit.
 * Returns null if Stripe isn't configured or the amount is too small.
 */
export const getOrCreateDepositLink = async ({
  dealId,
  amountMxn,
  description,
}: DepositLinkRequest): Promise<string | null> => {
  if (!isConfigured()) return null;
  const amountCents = Math.round(amountMxn * 100);
  // Stripe MXN minimum is 10 pesos. Guard against $0 deposits.
  if (amountCents < 1000) return null;

  // Check cache
  const hit = cache.get(dealId);
  if (
    hit &&
    Date.now() - hit.createdAt < TTL_MS &&
    hit.amountCents === amountCents
  ) {
    return hit.url;
  }

  try {
    const stripe = getStripe();
    const price = await stripe.prices.create({
      currency: "mxn",
      unit_amount: amountCents,
      product_data: { name: description.slice(0, 250) || "Quote deposit" },
    });

    const link = await stripe.paymentLinks.create({
      line_items: [{ price: price.id, quantity: 1 }],
      metadata: { dealId, kind: "quote_deposit" },
      after_completion: {
        type: "redirect",
        redirect: { url: `${siteUrl()}/en/quote/${encodeURIComponent(dealId)}/paid` },
      },
    });

    const entry: CacheEntry = {
      url: link.url,
      paymentLinkId: link.id,
      priceId: price.id,
      amountCents,
      createdAt: Date.now(),
    };
    cache.set(dealId, entry);
    return link.url;
  } catch (err) {
    console.error("[stripe-deposit] create failed:", err);
    return null;
  }
};
