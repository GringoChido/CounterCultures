"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

const CUSTOMER_AUTH_BASE = "/api/auth/customer";

const ERROR_MESSAGES: Record<string, string> = {
  OAuthSignin: "Couldn't start the Google sign-in flow. Try again.",
  OAuthCallback: "Google sign-in failed. Try again.",
  EmailSignin: "Couldn't send the sign-in email. Try again.",
  Verification: "This link has expired or was already used. Request a new one.",
  default: "Something went wrong. Please try again.",
};

const SignInInner = () => {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [waOptIn, setWaOptIn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const errorCode = params.get("error");
  const errorMessage = errorCode
    ? ERROR_MESSAGES[errorCode] ?? ERROR_MESSAGES.default
    : null;

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
          callbackUrl: "/account/welcome",
        }),
        redirect: "follow",
      });

      if (res.url?.includes("/account/check-email") || res.ok) {
        window.location.href = "/account/check-email";
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
      callbackInput.value = "/account/welcome";
      form.appendChild(callbackInput);

      document.body.appendChild(form);
      form.submit();
    } catch {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="font-display text-3xl font-light tracking-wider text-[#2C2C2C]">
            Counter Cultures
          </h1>
          <p className="font-body text-sm text-[#6B6B6B] mt-2">
            Sign in to your account
          </p>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-sm border border-[#E5E0DB]">
          {errorMessage && (
            <p className="text-sm text-red-700 bg-red-50 px-3 py-2 rounded-lg mb-4">
              {errorMessage}
            </p>
          )}

          <form onSubmit={handleEmail} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[#2C2C2C] mb-1"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-3 py-2.5 border border-[#E5E0DB] rounded-lg text-sm text-[#2C2C2C] placeholder:text-[#B0ACA7] focus:outline-none focus:ring-2 focus:ring-[#B87333]/40 focus:border-[#B87333]"
              />
            </div>
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={waOptIn}
                onChange={(e) => setWaOptIn(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-[#E5E0DB] text-[#B87333] focus:ring-[#B87333]/40 cursor-pointer"
              />
              <span className="text-xs text-[#6B6B6B] leading-relaxed">
                Receive order updates and important messages via WhatsApp.
                Uncheck if you&apos;d prefer not to.
              </span>
            </label>
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full py-2.5 bg-[#B87333] text-white text-sm font-medium rounded-lg hover:bg-[#A0632D] disabled:opacity-50 transition-colors cursor-pointer"
            >
              {loading ? "Sending link..." : "Email me a sign-in link"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[#E5E0DB]" />
            <span className="text-xs text-[#B0ACA7] uppercase tracking-wider">
              or
            </span>
            <div className="flex-1 h-px bg-[#E5E0DB]" />
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-[#E5E0DB] bg-white text-sm font-medium text-[#2C2C2C] rounded-lg hover:bg-[#FAF8F5] disabled:opacity-50 transition-colors cursor-pointer"
          >
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
            <span>
              {googleLoading ? "Redirecting..." : "Continue with Google"}
            </span>
          </button>
        </div>

        <p className="text-center text-xs text-[#B0ACA7] mt-8">
          Counter Cultures &middot; San Miguel de Allende, M&eacute;xico
        </p>
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
