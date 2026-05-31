"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { T } from "@/app/lib/customer-signin-copy";
import { safeCallbackUrl, readClientLocale } from "@/app/lib/customer-signin-helpers";

const WelcomeInner = () => {
  const params = useSearchParams();
  const [countdown, setCountdown] = useState(3);
  const [lang] = useState<"en" | "es">(() => readClientLocale());

  const rawCallback = params.get("callbackUrl");
  const intent = params.get("intent");
  const destination = safeCallbackUrl(rawCallback) ?? "/";

  useEffect(() => {
    document.title = lang === "es"
      ? `${T.es.welcome.title} · Counter Cultures`
      : `${T.en.welcome.title} · Counter Cultures`;
  }, [lang]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          window.location.href = destination;
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [destination]);

  const t = T[lang].welcome;
  const bodyText =
    intent === "cart"
      ? t.intentCart
      : t.body.replace("{seconds}", String(countdown));

  return (
    <div className="min-h-screen bg-brand-linen flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <div className="mb-10">
          <h1 className="font-display text-3xl font-light tracking-wider text-brand-charcoal">
            Counter Cultures
          </h1>
        </div>

        <div className="bg-dash-surface rounded-xl p-8 shadow-sm border border-dash-border">
          <div className="w-12 h-12 bg-dash-success-soft rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-5 h-5 text-dash-success" />
          </div>
          <h2 className="text-lg font-semibold text-brand-charcoal mb-2">
            {t.title}
          </h2>
          <p className="text-sm text-dash-text-secondary leading-relaxed">
            {bodyText}
          </p>
        </div>

        <a
          href={destination}
          className="inline-block text-sm text-brand-copper hover:text-brand-copper-dark mt-6 transition-colors"
        >
          {t.goNow}
        </a>
      </div>
    </div>
  );
};

const WelcomePage = () => (
  <Suspense fallback={null}>
    <WelcomeInner />
  </Suspense>
);

export default WelcomePage;
