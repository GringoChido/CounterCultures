"use client";

import { useEffect } from "react";
import Link from "next/link";

type ErrorBoundaryProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const ErrorBoundary = ({ error, reset }: ErrorBoundaryProps) => {
  useEffect(() => {
    console.error("[app/error.tsx]", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-6 py-20 bg-[var(--surface,#0e0b07)] text-[var(--text,#ece4d3)]">
      <div className="max-w-md w-full text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent,#c9a95c)] mb-4">
          Counter Cultures
        </p>
        <h1 className="font-serif text-3xl mb-3">Something went wrong</h1>
        <p className="text-sm text-[var(--text-dim,#9b8f75)] mb-6">
          {error.digest ? `Reference: ${error.digest}` : "The request couldn't be completed."}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={reset}
            className="px-4 py-2 text-sm border border-[var(--border,#2a241b)] rounded hover:bg-[var(--surface-2,#16120b)] transition"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="px-4 py-2 text-sm bg-[var(--accent,#c9a95c)] text-black rounded hover:opacity-90 transition"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
};

export default ErrorBoundary;
