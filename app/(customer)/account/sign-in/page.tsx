"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  ShoppingBag,
  Bookmark,
  Tag,
  Loader2,
} from "lucide-react";
import { T } from "@/app/lib/customer-signin-copy";
import {
  safeCallbackUrl,
  readClientLocale,
  sendCustomerMagicLink,
} from "@/app/lib/customer-signin-helpers";

const CUSTOMER_AUTH_BASE = "/api/auth/customer";

const SignInInner = () => {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [waOptIn, setWaOptIn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [lang] = useState<"en" | "es">(() => readClientLocale());
  const emailInputRef = useRef<HTMLInputElement>(null);

  const t = T[lang];
  const errorCode = params.get("error");
  const errorMessage = errorCode
    ? (t.error as Record<string, string>)[errorCode] ?? t.error.default
    : null;
  const [intent, setIntent] = useState(() => params.get("intent") ?? "");
  const rawCallback = params.get("callbackUrl");
  const callbackUrl = safeCallbackUrl(rawCallback) ?? "/account/welcome";
  useEffect(() => {
    document.title = lang === "es"
      ? `${T.es.title} · Counter Cultures`
      : `${T.en.title} · Counter Cultures`;
  }, [lang]);

  const selectIntent = (next: string) => {
    setIntent(next);
    const url = new URL(window.location.href);
    url.searchParams.set("intent", next);
    window.history.replaceState({}, "", url.toString());
    emailInputRef.current?.focus({ preventScroll: false });
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);

    try {
      await fetch("/api/account/whatsapp-opt-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), optIn: waOptIn }),
      });
    } catch { /* best-effort */ }

    try {
      const csrfRes = await fetch(`${CUSTOMER_AUTH_BASE}/csrf`);
      const { csrfToken } = await csrfRes.json();

      const res = await fetch(`${CUSTOMER_AUTH_BASE}/signin/email`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          email: email.trim().toLowerCase(),
          csrfToken,
          callbackUrl,
        }),
        redirect: "follow",
      });

      if (res.url?.includes("/account/check-email") || res.ok) {
        const checkUrl = new URL("/account/check-email", window.location.origin);
        if (rawCallback) checkUrl.searchParams.set("callbackUrl", rawCallback);
        if (intent) checkUrl.searchParams.set("intent", intent);
        window.location.href = checkUrl.toString();
      } else {
        window.location.href = "/account/sign-in?error=EmailSignin";
      }
    } catch {
      setLoading(false);
      window.location.href = "/account/sign-in?error=EmailSignin";
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const csrfRes = await fetch(`${CUSTOMER_AUTH_BASE}/csrf`);
      const { csrfToken } = await csrfRes.json();

      const form = document.createElement("form");
      form.method = "POST";
      form.action = `${CUSTOMER_AUTH_BASE}/signin/google-customer`;

      const csrfInput = document.createElement("input");
      csrfInput.type = "hidden";
      csrfInput.name = "csrfToken";
      csrfInput.value = csrfToken;
      form.appendChild(csrfInput);

      const callbackInput = document.createElement("input");
      callbackInput.type = "hidden";
      callbackInput.name = "callbackUrl";
      callbackInput.value = callbackUrl;
      form.appendChild(callbackInput);

      document.body.appendChild(form);
      form.submit();
    } catch {
      setGoogleLoading(false);
    }
  };

  const handleResendFromError = async () => {
    if (!email.trim()) return;
    setLoading(true);
    const ok = await sendCustomerMagicLink(email, callbackUrl, waOptIn);
    if (ok) {
      const checkUrl = new URL("/account/check-email", window.location.origin);
      if (rawCallback) checkUrl.searchParams.set("callbackUrl", rawCallback);
      if (intent) checkUrl.searchParams.set("intent", intent);
      window.location.href = checkUrl.toString();
    } else {
      setLoading(false);
    }
  };

  const switchLocale = () => {
    const next = lang === "en" ? "es" : "en";
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; SameSite=lax`;
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-brand-linen flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="font-display text-3xl font-light tracking-wider text-brand-charcoal">
            {t.eyebrow}
          </h1>
          <p className="font-body text-sm text-dash-text-secondary mt-2">
            {t.subtitle[intent] ?? t.subtitle.default}
          </p>
        </div>

        <div className="bg-dash-surface rounded-xl p-8 shadow-sm border border-dash-border">
          {errorMessage && (
            <div role="alert" className="text-sm text-dash-danger bg-dash-danger-soft px-3 py-2.5 rounded-lg mb-4">
              <p>{errorMessage}</p>
              {errorCode === "Verification" && (
                <button
                  type="button"
                  onClick={handleResendFromError}
                  disabled={loading || !email.trim()}
                  className="mt-1.5 text-xs font-medium text-brand-copper hover:text-brand-copper-dark underline underline-offset-2 cursor-pointer disabled:opacity-50"
                >
                  {t.error.sendNewLink}
                </button>
              )}
              {(errorCode === "OAuthSignin" || errorCode === "OAuthCallback") && (
                <p className="mt-1.5 text-xs text-dash-text-muted">
                  {lang === "en"
                    ? "Try a different browser or check your popup blocker."
                    : "Intenta con otro navegador o revisa el bloqueador de ventanas."}
                </p>
              )}
            </div>
          )}

          <form onSubmit={handleEmail} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-brand-charcoal mb-1"
              >
                {t.emailLabel}
              </label>
              <input
                ref={emailInputRef}
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
                required
                className="w-full px-3 py-2.5 border border-dash-border rounded-lg text-sm text-brand-charcoal placeholder:text-dash-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper/40 focus-visible:border-brand-copper"
              />
            </div>
            <label htmlFor="wa-optin" className="flex items-start gap-2.5 cursor-pointer">
              <input
                id="wa-optin"
                type="checkbox"
                checked={waOptIn}
                onChange={(e) => setWaOptIn(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-dash-border text-brand-copper focus:ring-brand-copper/40 cursor-pointer"
              />
              <span className="text-xs text-dash-text-secondary leading-relaxed">
                {t.waOptIn}
              </span>
            </label>
            <button
              type="submit"
              disabled={loading || googleLoading || !email.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand-copper text-white text-sm font-medium rounded-lg hover:bg-brand-copper-dark disabled:opacity-50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper/40 min-h-[44px]"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? t.sending : t.sendLink}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-dash-border" />
            <span className="text-xs text-dash-text-muted uppercase tracking-wider">
              {t.or}
            </span>
            <div className="flex-1 h-px bg-dash-border" />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
            <button
              type="button"
              onClick={() => selectIntent("project")}
              aria-pressed={intent === "project"}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors cursor-pointer min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper/40 ${
                intent === "project"
                  ? "bg-brand-copper/15 border border-brand-copper/40 text-brand-charcoal"
                  : "bg-brand-linen border border-brand-stone/15 text-dash-text-secondary hover:bg-brand-copper/8 hover:border-brand-copper/25"
              }`}
            >
              <Bookmark className="w-3.5 h-3.5 text-brand-copper" />
              {t.benefitProjects}
            </button>
            <button
              type="button"
              onClick={() => selectIntent("cart")}
              aria-pressed={intent === "cart" || intent === "save-cart"}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors cursor-pointer min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper/40 ${
                intent === "cart" || intent === "save-cart"
                  ? "bg-brand-copper/15 border border-brand-copper/40 text-brand-charcoal"
                  : "bg-brand-linen border border-brand-stone/15 text-dash-text-secondary hover:bg-brand-copper/8 hover:border-brand-copper/25"
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 text-brand-copper" />
              {t.benefitCart}
            </button>
            <button
              type="button"
              onClick={() => selectIntent("quote")}
              aria-pressed={intent === "quote"}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors cursor-pointer min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper/40 ${
                intent === "quote"
                  ? "bg-brand-copper/15 border border-brand-copper/40 text-brand-charcoal"
                  : "bg-brand-linen border border-brand-stone/15 text-dash-text-secondary hover:bg-brand-copper/8 hover:border-brand-copper/25"
              }`}
            >
              <Tag className="w-3.5 h-3.5 text-brand-copper" />
              {t.benefitQuotes}
            </button>
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading || loading}
            aria-label={t.continueGoogle}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-dash-border bg-dash-surface text-sm font-medium text-brand-charcoal rounded-lg hover:bg-brand-linen disabled:opacity-50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper/40 min-h-[44px]"
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
                />
                <path
                  fill="#34A853"
                  d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
                />
                <path
                  fill="#FBBC05"
                  d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"
                />
                <path
                  fill="#EA4335"
                  d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"
                />
              </svg>
            )}
            <span>{googleLoading ? t.redirecting : t.continueGoogle}</span>
          </button>
        </div>

        <p className="text-center text-xs text-dash-text-muted mt-6">
          {t.fromQuoteHint}
        </p>

        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-dash-text-muted">
            {t.locationLabel}
          </p>
          <button
            type="button"
            onClick={switchLocale}
            className="text-xs text-brand-copper hover:text-brand-copper-dark font-medium cursor-pointer"
          >
            {lang === "en" ? "ES" : "EN"}
          </button>
        </div>
      </div>
    </div>
  );
};

const SignInPage = () => (
  <Suspense fallback={null}>
    <SignInInner />
  </Suspense>
);

export default SignInPage;
