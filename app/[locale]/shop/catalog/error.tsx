"use client";

import { useEffect } from "react";

const CatalogError = ({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) => {
  useEffect(() => {
    console.error(
      JSON.stringify({
        where: "shop/catalog/error-boundary",
        message: error.message,
        digest: error.digest,
        stack: error.stack,
      })
    );
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-brand-linen px-4">
      <div className="text-center max-w-md">
        <p className="font-display text-2xl font-light text-brand-charcoal">
          We&rsquo;re updating the catalog
        </p>
        <p className="mt-1 font-display text-xl font-light text-brand-charcoal/70">
          Estamos actualizando el cat&aacute;logo
        </p>
        <p className="mt-4 font-body text-sm text-dash-text-secondary">
          Please refresh in a moment &middot; Actualiza en un momento
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 px-6 py-2.5 bg-brand-copper text-white font-body text-sm font-semibold tracking-wide rounded-full hover:bg-brand-copper/90 transition-colors cursor-pointer"
        >
          Reload &middot; Recargar
        </button>
      </div>
    </div>
  );
};

export default CatalogError;
