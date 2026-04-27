"use client";

import { useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/app/i18n/navigation";

type ErrorBoundaryProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const LocaleErrorBoundary = ({ error, reset }: ErrorBoundaryProps) => {
  const t = useTranslations("errors");
  const locale = useLocale();

  useEffect(() => {
    console.error("[locale/error.tsx]", {
      locale,
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      import("@sentry/nextjs")
        .then((Sentry) =>
          Sentry.captureException(error, { tags: { locale, scope: "locale" } }),
        )
        .catch(() => {});
    }
  }, [error, locale]);

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-6 py-20 bg-[var(--surface,#0e0b07)] text-[var(--text,#ece4d3)]">
      <div className="max-w-md w-full text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent,#c9a95c)] mb-4">
          {t("eyebrow")}
        </p>
        <h1 className="font-serif text-3xl mb-3">{t("title")}</h1>
        <p className="text-sm text-[var(--text-dim,#9b8f75)] mb-6">
          {error.digest
            ? t("reference", { digest: error.digest })
            : t("descriptionDefault")}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={reset}
            className="px-4 py-2 text-sm border border-[var(--border,#2a241b)] rounded hover:bg-[var(--surface-2,#16120b)] transition"
          >
            {t("tryAgain")}
          </button>
          <Link
            href="/"
            className="px-4 py-2 text-sm bg-[var(--accent,#c9a95c)] text-black rounded hover:opacity-90 transition"
          >
            {t("backHome")}
          </Link>
        </div>
      </div>
    </main>
  );
};

export default LocaleErrorBoundary;
