import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? "";

const getStripe = (): Stripe => {
  if (!STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY not configured");
  }
  return new Stripe(STRIPE_SECRET_KEY);
};

const isConfigured = (): boolean => Boolean(STRIPE_SECRET_KEY);

export { getStripe, isConfigured };
