"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn } from "lucide-react";

const LoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (
      email === "joshua@untold.works" &&
      password === "GringoChido1!"
    ) {
      sessionStorage.setItem("cc-portal-auth", "true");
      router.push("/dashboard/overview");
    } else {
      setError("Invalid email or password.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-charcoal flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="font-display text-3xl font-light tracking-wider text-white">
            Counter Cultures
          </h1>
          <p className="font-mono text-[11px] tracking-[0.2em] text-brand-copper uppercase mt-1">
            Counter Portal
          </p>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-2xl">
          <h2 className="text-lg font-semibold text-dash-text mb-1">
            Welcome back
          </h2>
          <p className="text-sm text-dash-text-secondary mb-6">
            Sign in to access the Counter Portal
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dash-text mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="roger@countercultures.mx"
                className="w-full px-4 py-2.5 text-sm border border-dash-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dash-text mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-2.5 text-sm border border-dash-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dash-text-secondary hover:text-dash-text transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-copper text-white text-sm font-medium rounded-lg hover:bg-brand-copper/90 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In
                </>
              )}
            </button>
          </form>

          <p className="text-xs text-dash-text-secondary text-center mt-6">
            Contact your administrator for access credentials
          </p>
        </div>

        <p className="text-center text-xs text-white/30 mt-8">
          Built by{" "}
          <a
            href="https://untold.works"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white/50 transition-colors"
          >
            Untold.works
          </a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
