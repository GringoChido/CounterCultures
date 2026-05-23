"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

const ERROR_MESSAGES: Record<string, string> = {
  AccessDenied:
    "That account isn't in the Users sheet, or it's been deactivated. Ask an admin to add or re-activate your row.",
  DomainMismatch:
    "That isn't a Counter Cultures account. Please sign in with your @countercultures.com.mx account.",
  OAuthSignin: "Couldn't start the Google sign-in flow. Try again.",
  OAuthCallback: "Google sign-in failed. Try again.",
  OAuthAccountNotLinked: "This email is already linked to a different account.",
  Configuration: "Auth is misconfigured. Check Google OAuth credentials.",
  default: "Something went wrong signing in. Try again.",
};

const LoginInner = () => {
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);
  const errorCode = params.get("error");
  const errorMessage = errorCode
    ? ERROR_MESSAGES[errorCode] ?? ERROR_MESSAGES.default
    : null;

  const handleGoogle = () => {
    setLoading(true);
    signIn("google", { callbackUrl: "/dashboard/overview" });
  };

  return (
    <div className="min-h-screen bg-brand-charcoal flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="font-display text-3xl font-light tracking-wider text-white">
            Counter Cultures
          </h1>
          <p className="font-body font-semibold text-[11px] tracking-[0.2em] text-brand-copper uppercase mt-1">
            Counter Portal
          </p>
        </div>

        <div className="bg-dash-surface rounded-xl p-8 shadow-2xl">
          <h2 className="text-lg font-semibold text-dash-text mb-1">
            Welcome back
          </h2>
          <p className="text-sm text-dash-text-secondary mb-6">
            Sign in with your Counter Cultures Google account.
          </p>

          {errorMessage && (
            <div className="bg-dash-danger-soft px-3 py-2 rounded-lg mb-4">
              <p className="text-sm text-dash-danger">
                {errorMessage}
              </p>
              {(errorCode === "AccessDenied" || errorCode === "DomainMismatch") && (
                <button
                  type="button"
                  onClick={() => signIn("google", { callbackUrl: "/dashboard/overview" })}
                  className="text-xs text-dash-text-secondary underline mt-1 cursor-pointer hover:text-dash-text transition-colors"
                >
                  Try a different Google account
                </button>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-dash-border bg-dash-surface text-sm font-medium text-dash-text rounded-lg hover:bg-dash-bg-muted disabled:opacity-50 transition-colors cursor-pointer"
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
            <span>{loading ? "Redirecting…" : "Sign in with Google"}</span>
          </button>

          <p className="text-xs text-dash-text-secondary text-center mt-6">
            Restricted to <span className="font-medium">@countercultures.com.mx</span>{" "}
            accounts. Contact an admin if you need access.
          </p>
        </div>

      </div>
    </div>
  );
};

const LoginPage = () => (
  <Suspense fallback={null}>
    <LoginInner />
  </Suspense>
);

export default LoginPage;
