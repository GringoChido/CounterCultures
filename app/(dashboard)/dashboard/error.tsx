"use client";

import { useEffect } from "react";
import Link from "next/link";

type DashboardErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const DashboardError = ({ error, reset }: DashboardErrorProps) => {
  useEffect(() => {
    console.error("[dashboard/error.tsx]", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      import("@sentry/nextjs")
        .then((Sentry) => Sentry.captureException(error))
        .catch(() => {});
    }
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6 py-16">
      <div className="max-w-md w-full text-center">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--accent,#c9a95c)] mb-3">
          Dashboard Error
        </p>
        <h1 className="font-serif text-2xl mb-3 text-[var(--text,#ece4d3)]">
          This view couldn&apos;t load
        </h1>
        <p className="text-sm text-[var(--text-dim,#9b8f75)] mb-6">
          {error.message || "An unexpected error occurred."}
          {error.digest ? ` (ref: ${error.digest})` : ""}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={reset}
            className="px-4 py-2 text-sm border border-[var(--border,#2a241b)] rounded hover:bg-[var(--surface-2,#16120b)] transition"
          >
            Retry
          </button>
          <Link
            href="/dashboard"
            className="px-4 py-2 text-sm bg-[var(--accent,#c9a95c)] text-black rounded hover:opacity-90 transition"
          >
            Back to Today
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardError;
