"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

const CheckoutErrorBoundary = ({ error, reset }: Props) => {
  const [retrying, setRetrying] = useState(true);

  useEffect(() => {
    console.error("[checkout/error.tsx]", error.message);
    const timer = setTimeout(() => setRetrying(false), 4000);
    return () => clearTimeout(timer);
  }, [error]);

  if (retrying) {
    return (
      <div className="cc-paper min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-copper mx-auto mb-4" />
          <p className="font-body text-sm text-brand-charcoal">
            Redirecting to secure payment…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="cc-paper min-h-screen flex items-center justify-center px-6">
      <div className="max-w-sm text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-brand-copper mb-4">
          Counter Cultures
        </p>
        <h1 className="font-display text-2xl text-brand-charcoal mb-3">
          Let&apos;s try that again
        </h1>
        <p className="text-sm text-dash-text-secondary mb-6">
          The payment page took too long to load. Your cart is still saved.
        </p>
        <button
          type="button"
          onClick={reset}
          className="px-6 py-3 bg-brand-charcoal text-white font-body font-semibold text-sm tracking-wide hover:bg-brand-charcoal/90 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
};

export default CheckoutErrorBoundary;
