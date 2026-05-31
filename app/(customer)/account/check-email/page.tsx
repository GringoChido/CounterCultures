"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Mail, Loader2 } from "lucide-react";
import { T } from "@/app/lib/customer-signin-copy";
import {
  safeCallbackUrl,
  readClientLocale,
  sendCustomerMagicLink,
} from "@/app/lib/customer-signin-helpers";

const CheckEmailInner = () => {
  const params = useSearchParams();
  const [lang] = useState<"en" | "es">(() => readClientLocale());
  const [resendEmail, setResendEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const t = T[lang].checkEmail;

  useEffect(() => {
    document.title = lang === "es"
      ? `${T.es.checkEmail.title} · Counter Cultures`
      : `${T.en.checkEmail.title} · Counter Cultures`;
  }, [lang]);

  const rawCallback = params.get("callbackUrl");
  const intent = params.get("intent");
  const callbackUrl = safeCallbackUrl(rawCallback) ?? "/account/welcome";

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;
    setResending(true);
    const ok = await sendCustomerMagicLink(resendEmail, callbackUrl, true);
    setResending(false);
    if (ok) setResent(true);
  };

  const backHref = `/account/sign-in${rawCallback ? `?callbackUrl=${encodeURIComponent(rawCallback)}${intent ? `&intent=${intent}` : ""}` : intent ? `?intent=${intent}` : ""}`;

  return (
    <div className="min-h-screen bg-brand-linen flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <div className="mb-10">
          <h1 className="font-display text-3xl font-light tracking-wider text-brand-charcoal">
            Counter Cultures
          </h1>
        </div>

        <div className="bg-dash-surface rounded-xl p-8 shadow-sm border border-dash-border">
          <div className="w-12 h-12 bg-brand-copper/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-5 h-5 text-brand-copper" />
          </div>
          <h2 className="text-lg font-semibold text-brand-charcoal mb-2">
            {t.title}
          </h2>
          <p className="text-sm text-dash-text-secondary leading-relaxed mb-6">
            {t.body}
          </p>

          {resent ? (
            <p className="text-sm text-dash-success font-medium">{t.resent}</p>
          ) : (
            <form onSubmit={handleResend} className="space-y-3">
              <p className="text-xs text-dash-text-muted">{t.resend}</p>
              <input
                type="email"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                placeholder={T[lang].emailPlaceholder}
                required
                className="w-full px-3 py-2.5 border border-dash-border rounded-lg text-sm text-brand-charcoal placeholder:text-dash-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper/40 focus-visible:border-brand-copper"
              />
              <button
                type="submit"
                disabled={resending || !resendEmail.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand-copper text-white text-sm font-medium rounded-lg hover:bg-brand-copper-dark disabled:opacity-50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper/40 min-h-[44px]"
              >
                {resending && <Loader2 className="w-4 h-4 animate-spin" />}
                {resending ? T[lang].checkEmail.resending : T[lang].sendLink}
              </button>
            </form>
          )}
        </div>

        <a
          href={backHref}
          className="inline-block text-sm text-brand-copper hover:text-brand-copper-dark mt-6 transition-colors"
        >
          {t.back}
        </a>
      </div>
    </div>
  );
};

const CheckEmailPage = () => (
  <Suspense fallback={null}>
    <CheckEmailInner />
  </Suspense>
);

export default CheckEmailPage;
